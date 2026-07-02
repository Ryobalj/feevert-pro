# home/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import (
    SiteSetting, HeroSection, AboutSection, ServiceHighlight,
    SeoData, Faq, Partner, Testimonial,
    WhatWeDo, WhatWeDoService, WhatWeDoImage
)

@register(SiteSetting)
class SiteSettingTranslationOptions(TranslationOptions):
    fields = ('site_name', 'site_tagline', 'footer_copyright_text', 'footer_about_text')

@register(HeroSection)
class HeroSectionTranslationOptions(TranslationOptions):
    fields = ('title', 'subtitle', 'cta_text', 'cta_second_text')

@register(AboutSection)
class AboutSectionTranslationOptions(TranslationOptions):
    fields = ('title', 'description', 'mission', 'vision')

@register(ServiceHighlight)
class ServiceHighlightTranslationOptions(TranslationOptions):
    fields = ('title', 'description', 'badge_text')

@register(SeoData)
class SeoDataTranslationOptions(TranslationOptions):
    fields = ('meta_title', 'meta_description', 'keywords')

@register(Faq)
class FaqTranslationOptions(TranslationOptions):
    fields = ('question', 'answer')

@register(Partner)
class PartnerTranslationOptions(TranslationOptions):
    fields = ('name', 'description')

@register(Testimonial)
class TestimonialTranslationOptions(TranslationOptions):
    fields = ('client_name', 'client_role', 'client_company', 'content')

@register(WhatWeDo)
class WhatWeDoTranslationOptions(TranslationOptions):
    fields = ('title', 'subtitle', 'description', 'cta_text')

@register(WhatWeDoService)
class WhatWeDoServiceTranslationOptions(TranslationOptions):
    fields = ('title', 'description')

@register(WhatWeDoImage)
class WhatWeDoImageTranslationOptions(TranslationOptions):
    fields = ('title', 'caption')
