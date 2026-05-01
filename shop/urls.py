# shop/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductCategoryViewSet, ProductViewSet, CartViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='shop-categories')
router.register(r'products', ProductViewSet, basename='shop-products')
router.register(r'cart', CartViewSet, basename='shop-cart')
router.register(r'orders', OrderViewSet, basename='shop-orders')

urlpatterns = [
    path('', include(router.urls)),
]