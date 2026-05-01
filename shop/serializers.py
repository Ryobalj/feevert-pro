# shop/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import ProductCategory, Product, ProductImage, Cart, CartItem, Order, OrderItem


# ==================== PRODUCT IMAGE SERIALIZER ====================
class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'caption', 'alt_text', 'is_primary', 'order', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


# ==================== PRODUCT CATEGORY ====================
class ProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'image_url', 
                  'parent', 'children', 'product_count', 'order', 'is_active']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        if children.exists():
            return ProductCategorySerializer(children, many=True).data
        return []
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    
    def get_image_url(self, obj):
        if obj.image: return obj.image.url
        return None


# ==================== PRODUCT LIST ====================
class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    primary_image_url = serializers.CharField(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'category', 'category_name', 'short_description',
                  'product_type', 'current_price', 'price', 'sale_price', 'is_on_sale',
                  'discount_percentage', 'in_stock', 'image_url', 'primary_image_url', 
                  'is_featured', 'average_rating', 'review_count', 'order']
    
    def get_image_url(self, obj):
        if obj.image: return obj.image.url
        return None
    
    def get_average_rating(self, obj):
        from reviews.models import Review
        content_type = ContentType.objects.get_for_model(Product)
        reviews = Review.objects.filter(content_type=content_type, object_id=obj.id, is_approved=True)
        if reviews.exists():
            from django.db import models
            return reviews.aggregate(models.Avg('rating'))['rating__avg']
        return None
    
    def get_review_count(self, obj):
        from reviews.models import Review
        content_type = ContentType.objects.get_for_model(Product)
        return Review.objects.filter(content_type=content_type, object_id=obj.id, is_approved=True).count()


# ==================== PRODUCT DETAIL ====================
class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    primary_image_url = serializers.CharField(read_only=True)
    gallery = ProductImageSerializer(many=True, read_only=True)
    all_images = serializers.SerializerMethodField()
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def get_image_url(self, obj):
        if obj.image: return obj.image.url
        return None
    
    def get_all_images(self, obj):
        return obj.all_images
    
    def get_average_rating(self, obj):
        from reviews.models import Review
        content_type = ContentType.objects.get_for_model(Product)
        reviews = Review.objects.filter(content_type=content_type, object_id=obj.id, is_approved=True)
        if reviews.exists():
            from django.db import models
            return reviews.aggregate(models.Avg('rating'))['rating__avg']
        return None
    
    def get_review_count(self, obj):
        from reviews.models import Review
        content_type = ContentType.objects.get_for_model(Product)
        return Review.objects.filter(content_type=content_type, object_id=obj.id, is_approved=True).count()


# ==================== CART ====================
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'total', 'created_at']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)


# ==================== ORDER ====================
class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'status_display', 'full_name', 'email', 
                  'phone', 'shipping_address', 'city', 'region', 'subtotal', 'shipping_cost', 
                  'total', 'payment_status', 'tracking_number', 'notes', 'items', 'created_at']
        read_only_fields = ['order_number', 'status', 'subtotal', 'shipping_cost', 'total', 'payment_status']


class CreateOrderSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    region = serializers.CharField(max_length=100)
    notes = serializers.CharField(required=False, allow_blank=True)