# core/management/commands/import_mail_archive.py
"""Bring old mail into the system from wherever it still exists.

Zoho holds only what was on the server when the domain moved. The old inboxes
did not come with it: Essau's mailbox in Zoho starts in July 2026, though he
has been writing since 2022, and mail a director had already pulled down with
POP lives in their Outlook and nowhere else.

Two sources, one destination:

    # straight from the old cPanel mailbox, if it is still alive
    python manage.py import_mail_archive --imap mail.feevert.co.tz
        --user essau@feevert.co.tz --password SECRET
        --mailbox essau.losujaki@feevert.co.tz

    # or from an export: an .mbox file, or a folder of .eml files
    python manage.py import_mail_archive --file exports/essau-2022.mbox
        --mailbox essau.losujaki@feevert.co.tz

Nothing is overwritten and nothing is duplicated: a message already held —
matched on its Message-ID — is left exactly as it is, so the command can be
run again after a partial import without making a mess.
"""

import email
import email.policy
import email.utils
import hashlib
import imaplib
import mailbox
import os
from email.utils import parsedate_to_datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import EmailAccount, IncomingEmail


def _body(message):
    """The readable body, preferring plain text over HTML."""
    if message.is_multipart():
        for kind in ('text/plain', 'text/html'):
            for part in message.walk():
                if part.get_content_type() == kind and not part.get_filename():
                    try:
                        return part.get_content()
                    except Exception:
                        continue
        return ''
    try:
        return message.get_content()
    except Exception:
        return ''


def _received(message):
    try:
        when = parsedate_to_datetime(message.get('Date'))
    except Exception:
        when = None
    if not when:
        return timezone.now()
    if timezone.is_naive(when):
        when = timezone.make_aware(when)
    return when


class Command(BaseCommand):
    help = 'Import old mail from an IMAP server or an exported archive.'

    def add_arguments(self, parser):
        parser.add_argument('--mailbox', required=True,
                            help='Which mailbox in the system it belongs to')
        parser.add_argument('--folder', default='inbox',
                            help='Folder to file it under (default: inbox)')

        parser.add_argument('--imap', help='Old mail server, e.g. mail.feevert.co.tz')
        parser.add_argument('--user', help='Login on the old server')
        parser.add_argument('--password', help='Password on the old server')
        parser.add_argument('--imap-folder', default='INBOX',
                            help='Folder on the old server (default: INBOX)')
        parser.add_argument('--port', type=int, default=993)

        parser.add_argument('--file', help='An .mbox file, or a folder of .eml files')
        parser.add_argument('--dry-run', action='store_true',
                            help='Say what would be imported without saving')

    # ------------------------------------------------------------------
    def handle(self, *args, **o):
        account = EmailAccount.objects.filter(email_address__iexact=o['mailbox']).first()
        if not account:
            self.stderr.write(self.style.ERROR(
                'No mailbox %s in the system. Run map_mailbox --list to see them.'
                % o['mailbox']))
            return

        if o['imap']:
            source = self._from_imap(o)
        elif o['file']:
            source = self._from_file(o['file'])
        else:
            self.stderr.write(self.style.ERROR('Give either --imap ... or --file ...'))
            return

        saved = skipped = failed = 0
        oldest = newest = None

        for raw in source:
            try:
                message = email.message_from_bytes(raw, policy=email.policy.default)
                mid = (message.get('Message-ID') or '').strip()[:500]
                if not mid:
                    # No Message-ID: derive one from the bytes, so importing
                    # the same archive twice is still a no-op.
                    mid = 'archive-' + hashlib.sha256(raw).hexdigest()[:40]
                if IncomingEmail.objects.filter(message_id=mid).exists():
                    skipped += 1
                    continue

                when = _received(message)
                oldest = when if not oldest or when < oldest else oldest
                newest = when if not newest or when > newest else newest

                if o['dry_run']:
                    saved += 1
                    continue

                name, address = email.utils.parseaddr(message.get('From') or '')
                text = _body(message)
                IncomingEmail.objects.create(
                    account=account,
                    message_id=mid,
                    sender=address[:254],
                    sender_name=(name or '')[:300],
                    recipient=(message.get('To') or '')[:254],
                    subject=(message.get('Subject') or '')[:500],
                    body=text,
                    body_html=text if '<' in text[:200] else '',
                    received_at=when,
                    has_attachments=bool(message.is_multipart()
                                         and any(p.get_filename() for p in message.walk())),
                    source='archive',
                    folder=o['folder'],
                    is_read=True,          # old mail arrives already dealt with
                )
                saved += 1
            except Exception as e:
                failed += 1
                self.stderr.write('  skipped one message: %s' % str(e)[:120])

        verb = 'would import' if o['dry_run'] else 'imported'
        self.stdout.write(self.style.SUCCESS(
            '%s %d, already held %d, unreadable %d' % (verb, saved, skipped, failed)))
        if oldest and newest:
            self.stdout.write('  covering %s -> %s'
                              % (oldest.strftime('%d %b %Y'), newest.strftime('%d %b %Y')))

    # ------------------------------------------------------------------
    def _from_imap(self, o):
        if not (o['user'] and o['password']):
            self.stderr.write(self.style.ERROR('--imap needs --user and --password'))
            return
        self.stdout.write('Connecting to %s...' % o['imap'])
        server = imaplib.IMAP4_SSL(o['imap'], o['port'])
        server.login(o['user'], o['password'])
        # readonly: the old server is evidence, not something to change.
        server.select(o['imap_folder'], readonly=True)
        _, data = server.search(None, 'ALL')
        ids = data[0].split()
        self.stdout.write('  %d messages in %s' % (len(ids), o['imap_folder']))
        for num in ids:
            _, fetched = server.fetch(num, '(RFC822)')
            for part in fetched:
                if isinstance(part, tuple):
                    yield part[1]
        server.logout()

    def _from_file(self, path):
        if os.path.isdir(path):
            for root, _, files in os.walk(path):
                for name in files:
                    if name.lower().endswith(('.eml', '.txt')):
                        with open(os.path.join(root, name), 'rb') as fh:
                            yield fh.read()
            return
        for message in mailbox.mbox(path):
            yield message.as_bytes()
