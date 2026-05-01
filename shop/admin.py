# shop/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import ProductCategory, Product, ProductImage, Cart, CartItem, Order, OrderItem


# ==================== PRODUCT IMAGE INLINE ====================
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'caption', 'alt_text', 'is_primary', 'order', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


# ==================== INLINE FOR ORDER ITEMS ====================
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'quantity', 'price', 'subtotal')
    fields = ('product', 'product_name', 'quantity', 'price', 'subtotal')
    can_delete = False
    
    def subtotal(self, obj):
        return f"TZS {obj.subtotal:,.0f}"
    subtotal.short_description = "Subtotal"


# ==================== INLINE FOR CART ITEMS ====================
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'subtotal')
    fields = ('product', 'quantity', 'subtotal')
    can_delete = True
    
    def subtotal(self, obj):
        return f"TZS {obj.subtotal:,.0f}"
    subtotal.short_description = "Subtotal"


# ==================== PRODUCT CATEGORY ====================
@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'product_count', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'slug', 'description', 'icon')}),
        ('Media', {'fields': ('image',)}),
        ('Hierarchy', {'fields': ('parent',)}),
        ('Display', {'fields': ('order', 'is_active')}),
        ('SEO', {'fields': ('seo_title', 'seo_description'), 'classes': ('collapse',)}),
    )
    
    def product_count(self, obj):
        count = obj.products.filter(is_active=True).count()
        return format_html(f'<span style="font-weight: bold; color: #10b981;">{count}</span>')
    product_count.short_description = "📦 Products"


# ==================== PRODUCT ====================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'category', 'product_type', 'price_display', 
                    'stock_status', 'is_featured', 'is_active', 'popularity_score')
    list_filter = ('category', 'product_type', 'is_featured', 'is_active', 'is_digital')
    search_fields = ('name', 'description', 'sku')
    list_editable = ('is_featured', 'is_active', 'popularity_score')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('image_preview_large', 'created_at', 'updated_at')
    list_per_page = 25
    inlines = [ProductImageInline]  # ✅ ADDED
    
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'slug', 'category', 'product_type', 'description', 'short_description')}),
        ('Pricing & Inventory', {'fields': ('price', 'sale_price', 'currency', 'stock', 'sku', 'is_digital')}),
        ('Media', {'fields': ('image', 'image_preview_large')}),  # ✅ Removed 'gallery'
        ('Specifications', {'fields': ('weight', 'dimensions', 'ingredients', 'usage_instructions', 'benefits')}),
        ('Display', {'fields': ('is_featured', 'is_active', 'popularity_score', 'order')}),
        ('SEO', {'fields': ('seo_title', 'seo_description'), 'classes': ('collapse',)}),
        ('Metadata', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(f'<img src="{obj.image.url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;" />')
        # Check gallery images
        first_gallery = obj.gallery.filter(is_active=True, is_primary=True).first() or obj.gallery.filter(is_active=True).first()
        if first_gallery and first_gallery.image:
            return format_html(f'<img src="{first_gallery.image.url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;" />')
        return format_html('<span style="color: #94a3b8;">No img</span>')
    image_preview.short_description = "Img"
    
    def image_preview_large(self, obj):
        if obj.image:
            return format_html(f'<img src="{obj.image.url}" style="max-width: 300px; border-radius: 16px;" />')
        return "No image uploaded"
    image_preview_large.short_description = "Preview"
    
    def price_display(self, obj):
        if obj.is_on_sale:
            return format_html(
                f'<span style="text-decoration: line-through; color: #94a3b8;">TZS {obj.price:,.0f}</span> '
                f'<span style="color: #ef4444; font-weight: bold;">TZS {obj.sale_price:,.0f}</span> '
                f'<span style="background: #fef2f2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 0.7em;">-{obj.discount_percentage}%</span>'
            )
        return format_html(f'<span style="font-weight: bold; color: #10b981;">TZS {obj.price:,.0f}</span>')
    price_display.short_description = "Price"
    
    def stock_status(self, obj):
        if obj.stock > 10:
            return format_html(f'<span style="color: #10b981; font-weight: bold;">✅ {obj.stock}</span>')
        elif obj.stock > 0:
            return format_html(f'<span style="color: #f59e0b; font-weight: bold;">⚠️ {obj.stock}</span>')
        return format_html(f'<span style="color: #ef4444; font-weight: bold;">❌ 0</span>')
    stock_status.short_description = "Stock"


# ==================== CART ====================
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_or_guest', 'total_items', 'total', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'session_id')
    inlines = [CartItemInline]
    
    def user_or_guest(self, obj):
        if obj.user: return obj.user.username
        return format_html(f'<span style="color: #94a3b8;">Guest</span>')
    user_or_guest.short_description = "User"
    
    def total_items(self, obj): return obj.total_items
    total_items.short_description = "Items"
    
    def total(self, obj): return f"TZS {obj.total:,.0f}"
    total.short_description = "Total"


# ==================== ORDER ====================
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'full_name', 'status_badge', 'payment_status_badge', 'total', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at', 'region')
    search_fields = ('order_number', 'user__username', 'full_name', 'phone', 'tracking_number')
    readonly_fields = ('order_number', 'subtotal', 'shipping_cost', 'total', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order', {'fields': ('order_number', 'user', 'status', 'notes')}),
        ('Customer', {'fields': ('full_name', 'email', 'phone', 'shipping_address', 'city', 'region')}),
        ('Financials', {'fields': ('subtotal', 'shipping_cost', 'total')}),
        ('Payment', {'fields': ('payment_status', 'payment_method', 'payment_reference', 'paid_at')}),
        ('Shipping', {'fields': ('tracking_number', 'shipped_at', 'delivered_at')}),
        ('Metadata', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    actions = ['mark_as_processing', 'mark_as_shipped', 'mark_as_delivered', 'mark_as_cancelled']
    
    def status_badge(self, obj):
        colors = {'pending': '#f59e0b', 'paid': '#3b82f6', 'processing': '#8b5cf6', 'shipped': '#10b981', 'delivered': '#059669', 'cancelled': '#ef4444'}
        color = colors.get(obj.status, '#94a3b8')
        return format_html(f'<span style="background: {color}15; color: {color}; padding: 4px 12px; border-radius: 9999px; font-size: 0.75em; font-weight: 600;">{obj.get_status_display()}</span>')
    status_badge.short_description = "Status"
    
    def payment_status_badge(self, obj):
        if obj.payment_status == 'completed': return format_html('<span style="color: #10b981;">✅ Paid</span>')
        return format_html('<span style="color: #f59e0b;">⏳ Pending</span>')
    payment_status_badge.short_description = "Paid"
    
    def mark_as_processing(self, request, queryset):
        queryset.update(status='processing'); self.message_user(request, f"{queryset.count()} updated.")
    mark_as_processing.short_description = "→ Processing"
    
    def mark_as_shipped(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='shipped', shipped_at=timezone.now()); self.message_user(request, f"{queryset.count()} shipped.")
    mark_as_shipped.short_description = "→ Shipped"
    
    def mark_as_delivered(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='delivered', delivered_at=timezone.now()); self.message_user(request, f"{queryset.count()} delivered.")
    mark_as_delivered.short_description = "→ Delivered"
    
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled'); self.message_user(request, f"{queryset.count()} cancelled.")
    mark_as_cancelled.short_description = "→ Cancelled"