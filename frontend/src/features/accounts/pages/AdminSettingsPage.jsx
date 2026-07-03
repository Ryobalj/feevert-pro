// src/features/accounts/pages/AdminSettingsPage.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'

const FIELD_GROUPS = [
  {
    titleKey: 'general', title: 'General',
    fields: [
      { name: 'site_name', labelKey: 'site_name', label: 'Site Name' },
      { name: 'site_tagline', labelKey: 'site_tagline', label: 'Tagline' },
    ],
  },
  {
    titleKey: 'contact', title: 'Contact',
    fields: [
      { name: 'contact_email', labelKey: 'contact_email', label: 'Contact Email' },
      { name: 'contact_phone', labelKey: 'contact_phone', label: 'Contact Phone' },
      { name: 'contact_phone_alt', labelKey: 'contact_phone_alt', label: 'Alternate Phone' },
      { name: 'contact_address', labelKey: 'contact_address', label: 'Address', textarea: true },
    ],
  },
  {
    titleKey: 'social_links', title: 'Social Links',
    fields: [
      { name: 'social_facebook', labelKey: 'social_facebook', label: 'Facebook URL' },
      { name: 'social_twitter', labelKey: 'social_twitter', label: 'Twitter/X URL' },
      { name: 'social_linkedin', labelKey: 'social_linkedin', label: 'LinkedIn URL' },
      { name: 'social_instagram', labelKey: 'social_instagram', label: 'Instagram URL' },
      { name: 'social_youtube', labelKey: 'social_youtube', label: 'YouTube URL' },
      { name: 'social_whatsapp', labelKey: 'social_whatsapp', label: 'WhatsApp Number' },
    ],
  },
  {
    titleKey: 'seo', title: 'SEO',
    fields: [
      { name: 'meta_description', labelKey: 'meta_description', label: 'Meta Description', textarea: true },
      { name: 'meta_keywords', labelKey: 'meta_keywords', label: 'Meta Keywords' },
      { name: 'google_analytics_id', labelKey: 'google_analytics_id', label: 'Google Analytics ID' },
    ],
  },
  {
    titleKey: 'branding', title: 'Branding',
    fields: [
      { name: 'primary_color', labelKey: 'primary_color', label: 'Primary Color', color: true },
      { name: 'secondary_color', labelKey: 'secondary_color', label: 'Secondary Color', color: true },
      { name: 'accent_color', labelKey: 'accent_color', label: 'Accent Color', color: true },
    ],
  },
  {
    titleKey: 'footer', title: 'Footer',
    fields: [
      { name: 'footer_copyright_text', labelKey: 'footer_copyright_text', label: 'Copyright Text' },
      { name: 'footer_about_text', labelKey: 'footer_about_text', label: 'About Text', textarea: true },
    ],
  },
]

const AdminSettingsPage = () => {
  const { t } = useTranslation('admin')
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/site-settings/')
      const data = (res.data?.results || res.data || [])[0] || null
      setSettings(data)
      setForm(data || {})
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const payload = { ...form }
      delete payload.site_logo
      delete payload.site_logo_dark
      delete payload.favicon
      const res = await api.patch(`/site-settings/${settings.id}/`, payload)
      setSettings(res.data)
      setForm(res.data)
      setSaved(true)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(t('settings_page.save_error') || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container-main py-12 text-center">
        <div className="spinner spinner-lg mx-auto" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container-main py-12 text-center text-white/50">
        {t('settings_page.no_settings_found') || 'No site settings found.'}
      </div>
    )
  }

  return (
    <div className="container-main py-8 md:py-12 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t('settings_page.title') || 'Site Settings'}</h1>
        <p className="text-white/40 text-sm mt-1">{t('settings_page.subtitle') || 'Global settings used across the public site.'}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {FIELD_GROUPS.map(group => (
          <div key={group.titleKey} className="glass-card p-6">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-4">
              {t(`settings_page.groups.${group.titleKey}`) || group.title}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {group.fields.map(field => (
                <div key={field.name} className={field.textarea ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs text-white/40 mb-1.5">
                    {t(`settings_page.fields.${field.labelKey}`) || field.label}
                  </label>
                  {field.textarea ? (
                    <textarea
                      value={form[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none"
                    />
                  ) : field.color ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form[field.name] || '#000000'}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="flex-1 px-4 py-2.5 glass text-white rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">{t('settings_page.maintenance_mode') || 'Maintenance Mode'}</h2>
            <p className="text-xs text-white/30 mt-1">{t('settings_page.maintenance_desc') || 'Show a maintenance page instead of the public site.'}</p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('enable_maintenance_mode', !form.enable_maintenance_mode)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              form.enable_maintenance_mode ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {form.enable_maintenance_mode ? (t('settings_page.enabled') || 'Enabled') : (t('settings_page.disabled') || 'Disabled')}
          </button>
        </div>
        {form.enable_maintenance_mode && (
          <div className="glass-card p-6">
            <label className="block text-xs text-white/40 mb-1.5">{t('settings_page.maintenance_message') || 'Maintenance Message'}</label>
            <textarea
              value={form.maintenance_message || ''}
              onChange={(e) => handleChange('maintenance_message', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none"
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? (t('settings_page.saving') || 'Saving...') : (t('settings_page.save_button') || 'Save Settings')}
          </button>
          {saved && <span className="text-emerald-400 text-sm">{t('settings_page.saved') || 'Saved'} ✓</span>}
        </div>
      </form>
    </div>
  )
}

export default AdminSettingsPage
