# home/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_homepage_data, name='homepage-data'),
    path('set-language/', views.set_language, name='set-language'),
    path('get-language/', views.get_language, name='get-language'),
]