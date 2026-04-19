# news/translation.py

from modeltranslation.translator import register, TranslationOptions
from .models import NewsCategory, NewsPost, Comment

@register(NewsCategory)
class NewsCategoryTranslationOptions(TranslationOptions):
    fields = ('name', 'description', 'seo_title', 'seo_description')

@register(NewsPost)
class NewsPostTranslationOptions(TranslationOptions):
    fields = ('title', 'content', 'excerpt', 'seo_title', 'seo_description')

@register(Comment)
class CommentTranslationOptions(TranslationOptions):
    fields = ('name', 'message')
