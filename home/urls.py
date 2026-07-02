# home/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # ============ MAIN HOMEPAGE ============
    path('', views.get_homepage_data, name='homepage-data'),
    
    # ============ LANGUAGE ============
    path('set-language/', views.set_language, name='set-language'),
    path('get-language/', views.get_language, name='get-language'),
    
    # ============ HERO SLIDES ============
    path('hero-slides/', views.get_hero_slides, name='hero-slides'),
    
    # ============ WHAT WE DO ============
    path('what-we-do/', views.WhatWeDoViewSet.as_view({'get': 'list'}), name='what-we-do-list'),
    path('what-we-do-slides/', views.get_what_we_do_slides, name='what-we-do-slides'),
]