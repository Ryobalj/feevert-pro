# core/report_builder.py
"""Turn the field data into the first draft of the report.

The last manual step in the chain was retyping: readings collected on site,
already averaged and checked against their limit on the job page, were being
copied into Word by hand — which is where the transcription errors and the
lost evenings come from.

This writes the draft instead: the tables, the arithmetic, and the sentences
that follow directly from the numbers ("3 of 12 readings exceeded the 85 dB(A)
limit, the highest at 92.5"). What it will not do is write the professional
judgement. Every draft carries a line saying so, and the conclusions are
statements of fact about the data, never an opinion the consultant has not
formed. It is a first draft to finish, not a report to send.
"""

import html


def _e(value):
    return html.escape(str(value if value is not None else ''))


def _table(headers, rows):
    head = ''.join(f'<th>{_e(h)}</th>' for h in headers)
    body = ''.join(
        '<tr>' + ''.join(f'<td>{_e(c)}</td>' for c in row) + '</tr>' for row in rows
    )
    return (f'<table border="1" cellspacing="0" cellpadding="6" '
            f'style="border-collapse:collapse;width:100%;font-size:10pt">'
            f'<tr style="background:#e8f5ee;font-weight:bold">{head}</tr>{body}</table>')


def _checklist_section(sheet, number):
    rows = []
    findings = []
    for row in sheet.rows or []:
        status = {'yes': 'Compliant', 'no': 'Non-compliant', 'na': 'Not applicable'}.get(
            row.get('status'), 'Not assessed')
        rows.append([row.get('item', ''), status, row.get('note', '')])
        if row.get('status') == 'no':
            findings.append((row.get('item', ''), row.get('note', '')))

    s = sheet.summary()
    out = [f'<h3>{number} {_e(sheet.title)}</h3>']
    if sheet.location:
        out.append(f'<p><b>Location:</b> {_e(sheet.location)}</p>')
    if sheet.collected_on:
        out.append(f'<p><b>Date of assessment:</b> {sheet.collected_on:%d %B %Y}</p>')
    out.append(_table(['Item assessed', 'Status', 'Observation'], rows))

    out.append(
        f'<p>Of {s["count"]} items assessed, {s["compliant"]} were found compliant '
        f'({s["percent"]}%) and {s["findings"]} were recorded as non-compliant.</p>')
    if findings:
        out.append('<p><b>Non-conformities requiring action:</b></p><ol>')
        for item, note in findings:
            out.append(f'<li>{_e(item)}{f" — {_e(note)}" if note else ""}</li>')
        out.append('</ol>')
    return '\n'.join(out), findings


def _measurement_section(sheet, number):
    rows = [[r.get('point', ''), r.get('value', ''), r.get('time', ''), r.get('note', '')]
            for r in (sheet.rows or [])]
    s = sheet.summary()
    unit = f' {sheet.unit}' if sheet.unit else ''

    out = [f'<h3>{number} {_e(sheet.title)}</h3>']
    if sheet.location:
        out.append(f'<p><b>Location:</b> {_e(sheet.location)}</p>')
    if sheet.collected_on:
        out.append(f'<p><b>Date of measurement:</b> {sheet.collected_on:%d %B %Y}</p>')
    if sheet.limit_value is not None:
        out.append(f'<p><b>Reference limit:</b> {sheet.limit_value}{unit}'
                   f'{f" ({_e(sheet.limit_source)})" if sheet.limit_source else ""}</p>')
    out.append(_table(['Point', f'{sheet.parameter or "Value"}{unit}', 'Time', 'Remark'], rows))

    if not s.get('count'):
        out.append('<p><i>No readings were recorded for this parameter.</i></p>')
        return '\n'.join(out), []

    out.append(
        f'<p>{s["count"]} readings were taken. The mean was {s["mean"]}{unit} '
        f'(range {s["min"]}–{s["max"]}{unit}, standard deviation {s["std_dev"]}).</p>')

    exceedances = []
    if 'compliant' in s:
        if s['compliant']:
            out.append(
                f'<p>All readings were within the reference limit of '
                f'{s["limit"]}{unit}.</p>')
        else:
            out.append(
                f'<p><b>{s["exceedances"]} of {s["count"]} readings exceeded the '
                f'reference limit of {s["limit"]}{unit}, the highest at '
                f'{s["worst_exceedance"]}{unit}.</b></p>')
            exceedances.append(
                f'{sheet.parameter or sheet.title}: {s["exceedances"]} reading(s) above '
                f'{s["limit"]}{unit} (max {s["worst_exceedance"]}{unit})')
    return '\n'.join(out), exceedances


def _risk_section(sheet, number):
    from .models import FieldSheet

    rows = []
    serious = []
    for row in sheet.rows or []:
        try:
            likelihood = int(row.get('likelihood', 0))
            severity = int(row.get('severity', 0))
        except (TypeError, ValueError):
            likelihood = severity = 0
        score = likelihood * severity
        band = FieldSheet.risk_band(score)
        rows.append([row.get('hazard', ''), row.get('who', ''), likelihood, severity,
                     score, band.title(), row.get('control', '')])
        if band in ('high', 'extreme'):
            serious.append((row.get('hazard', ''), band, row.get('control', '')))

    s = sheet.summary()
    out = [f'<h3>{number} {_e(sheet.title)}</h3>']
    if sheet.location:
        out.append(f'<p><b>Location:</b> {_e(sheet.location)}</p>')
    out.append('<p>Risk is rated as likelihood × severity on a 5×5 matrix: '
               '1–3 low, 4–7 medium, 8–14 high, 15–25 extreme.</p>')
    out.append(_table(['Hazard', 'Persons at risk', 'L', 'S', 'Score', 'Rating',
                       'Control measure'], rows))
    out.append(
        f'<p>{s["count"]} hazards were assessed: {s["extreme"]} extreme, {s["high"]} high, '
        f'{s["medium"]} medium and {s["low"]} low. The highest rating recorded was '
        f'{s["highest_score"]} ({s["highest_band"]}).</p>')
    if serious:
        out.append('<p><b>Hazards requiring priority control:</b></p><ol>')
        for hazard, band, control in serious:
            out.append(f'<li>{_e(hazard)} — rated {_e(band)}.'
                       f'{f" Proposed control: {_e(control)}" if control else ""}</li>')
        out.append('</ol>')
    return '\n'.join(out), serious


def build_report(job, sheets, author=None, company='FEE-VERT SOLUTION LIMITED'):
    """Assemble the draft. Returns (title, html)."""
    from django.utils import timezone

    service = job.item_name or 'Consultancy'
    client = (getattr(job.client, 'full_name', '') or getattr(job.client, 'username', '')
              if job.client_id else '')
    today = timezone.now()

    parts = [
        f'<div style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5">',
        f'<p style="text-align:center;font-size:9pt;color:#555">{_e(company)}</p>',
        f'<h1 style="text-align:center">{_e(service)}</h1>',
        f'<p style="text-align:center">Prepared for <b>{_e(client)}</b><br>'
        f'{today:%d %B %Y}</p>',
        '<hr>',
        '<p style="background:#fff6e5;padding:8px;font-size:9pt">'
        '<b>Draft.</b> The tables and figures below are generated from the field data '
        'recorded for this job. The professional interpretation, recommendations and '
        'sign-off remain to be written by the consultant before this leaves the office.'
        '</p>',
    ]

    # 1. Introduction
    parts.append('<h2>1. Introduction</h2>')
    parts.append(f'<p>{_e(company)} was engaged by {_e(client) or "the client"} to carry out '
                 f'{_e(service.lower())}.</p>')
    if job.message:
        parts.append(f'<p><b>Client’s brief:</b> {_e(job.message)}</p>')

    # 2. Methodology — described from what was actually done
    kinds = {s.kind for s in sheets}
    parts.append('<h2>2. Methodology</h2>')
    if kinds:
        method = []
        if 'checklist' in kinds:
            method.append('a structured site inspection against a compliance checklist')
        if 'measurements' in kinds:
            method.append('in-situ measurement of the parameters listed below, compared '
                          'against the applicable reference limits')
        if 'risk' in kinds:
            method.append('a hazard identification and risk assessment using a 5×5 '
                          'likelihood–severity matrix')
        parts.append('<p>The assessment comprised ' + ', and '.join(method) + '.</p>')
        dates = sorted({s.collected_on for s in sheets if s.collected_on})
        if dates:
            span = (f'on {dates[0]:%d %B %Y}' if len(dates) == 1
                    else f'between {dates[0]:%d %B %Y} and {dates[-1]:%d %B %Y}')
            parts.append(f'<p>Field work was carried out {span}.</p>')
    else:
        parts.append('<p><i>No field data has been recorded for this job yet.</i></p>')

    # 3. Findings — one subsection per sheet, in the order they were collected
    parts.append('<h2>3. Findings</h2>')
    all_findings, all_exceedances, all_risks = [], [], []
    for index, sheet in enumerate(sheets, start=1):
        number = f'3.{index}'
        if sheet.kind == 'measurements':
            section, extra = _measurement_section(sheet, number)
            all_exceedances += extra
        elif sheet.kind == 'risk':
            section, extra = _risk_section(sheet, number)
            all_risks += extra
        else:
            section, extra = _checklist_section(sheet, number)
            all_findings += extra
        parts.append(section)
    if not sheets:
        parts.append('<p><i>Nothing to report — no field data was collected.</i></p>')

    # 4. Conclusion — only what the data says
    parts.append('<h2>4. Conclusion</h2>')
    said = []
    if all_exceedances:
        said.append('<p>The following parameters exceeded their reference limits:</p><ul>'
                    + ''.join(f'<li>{_e(x)}</li>' for x in all_exceedances) + '</ul>')
    elif 'measurements' in kinds:
        said.append('<p>All measured parameters were within their reference limits.</p>')
    if all_risks:
        said.append(f'<p>{len(all_risks)} hazard(s) were rated high or extreme and require '
                    f'priority control.</p>')
    if all_findings:
        said.append(f'<p>{len(all_findings)} non-conformities were recorded during the '
                    f'inspection.</p>')
    elif 'checklist' in kinds:
        said.append('<p>No non-conformities were recorded during the inspection.</p>')
    parts.append('\n'.join(said) or '<p>[To be written.]</p>')

    # 5. Recommendations — seeded from the controls already proposed on site
    parts.append('<h2>5. Recommendations</h2>')
    seeds = ([f'Address the non-conformity: {item}' for item, _ in all_findings]
             + [f'Implement controls for {hazard} (rated {band})'
                + (f': {control}' if control else '') for hazard, band, control in all_risks]
             + [f'Investigate and reduce {x}' for x in all_exceedances])
    if seeds:
        parts.append('<ol>' + ''.join(f'<li>{_e(x)}</li>' for x in seeds) + '</ol>')
        parts.append('<p style="color:#777;font-size:9pt"><i>The above are drawn directly '
                     'from the findings; expand each into the recommendation you intend to '
                     'make.</i></p>')
    else:
        parts.append('<p>[To be written.]</p>')

    parts.append('<h2>6. Declaration</h2>')
    parts.append(f'<p>Prepared by: {_e(getattr(author, "full_name", "") or getattr(author, "username", ""))}<br>'
                 f'Date: {today:%d %B %Y}<br>Signature: ______________________</p>')
    parts.append('</div>')

    title = f'{service} — draft report ({today:%d %b %Y})'
    return title, '\n'.join(parts)
