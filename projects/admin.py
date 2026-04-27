# projects/admin.py

from django.contrib import admin
from .models import ProjectCategory, ProjectTag, Project, ProjectImage, ProjectAward

class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1

class ProjectAwardInline(admin.TabularInline):
    model = ProjectAward
    extra = 1

@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent_category', 'order', 'is_active')
    list_filter = ('is_active', 'parent_category')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

@admin.register(ProjectTag)
class ProjectTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'client_name', 'completion_date', 'is_featured', 'status')
    list_filter = ('category', 'status', 'is_featured', 'completion_date')
    search_fields = ('title', 'client_name', 'description')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_featured', 'status')
    filter_horizontal = ('tags',)
    inlines = [ProjectImageInline, ProjectAwardInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'tags', 'status')
        }),
        ('Content', {
            'fields': ('description', 'cover_image', 'gallery')
        }),
        ('Client & Dates', {
            'fields': ('client_name', 'completion_date')
        }),
        ('Technical Details', {
            'fields': ('technologies_used', 'video_url')
        }),
        ('Case Study', {
            'fields': ('challenges', 'solutions', 'results')
        }),
        ('Testimonial', {
            'fields': ('testimonial', 'testimonial_author')
        }),
        ('SEO & Display', {
            'fields': ('is_featured', 'order', 'meta_title', 'meta_description')
        }),
    )

@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ('project', 'image', 'is_cover', 'order')
    list_filter = ('is_cover',)
    search_fields = ('project__title', 'caption')
    list_editable = ('is_cover', 'order')

@admin.register(ProjectAward)
class ProjectAwardAdmin(admin.ModelAdmin):
    list_display = ('project', 'award_name', 'awarding_body', 'year')
    list_filter = ('year',)
    search_fields = ('project__title', 'award_name')