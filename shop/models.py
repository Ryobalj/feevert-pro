# shop/models.py

from django.db import models
from django.conf import settings
from django.utils.text import slugify
from core.models import BaseModel


class ProductCategory(BaseModel):
    """
    Categories for shop products
    e.g., Honey, Equipment, Books, Health Products
    """
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Emoji or text icon")
    image = models.ImageField(upload_to='shop/categories/', blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Product Categories"
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(BaseModel):
    """
    Shop products for sale
    """
    PRODUCT_TYPES = (
    ('honey', '🍯 Honey'),
    ('beeswax', '🕯️ Beeswax Products'),
    ('propolis', '💊 Propolis'),
    ('royal_jelly', '✨ Royal Jelly'),
    ('bee_venom', '💉 Bee Venom'),
    ('beehives', '🏠 Beehives'),
    ('equipment', '🛠️ Beekeeping Equipment'),
    ('bee_colonies', '🐝 Bee Colonies & Queens'),
    ('books', '📚 Books & Manuals'),
    ('other', '📦 Other'),
)
    
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField(help_text="Full product description")
    short_description = models.CharField(max_length=500, help_text="Short description for cards")
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES, default='other')
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='TZS')
    
    # Inventory
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=50, blank=True, help_text="Stock Keeping Unit")
    
    # Main image (primary/thumbnail)
    image = models.ImageField(upload_to='shop/products/', blank=True, null=True, help_text="Main product image")
    
    # Specifications
    weight = models.CharField(max_length=50, blank=True, help_text="e.g., 500g, 1kg, 250ml")
    dimensions = models.CharField(max_length=100, blank=True)
    ingredients = models.TextField(blank=True)
    usage_instructions = models.TextField(blank=True)
    benefits = models.JSONField(default=list, blank=True)
    
    # Display
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_digital = models.BooleanField(default=False, help_text="Digital product (no shipping)")
    popularity_score = models.IntegerField(default=0)
    order = models.IntegerField(default=0)
    
    # SEO
    seo_title = models.CharField(max_length=60, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    
    class Meta:
        ordering = ['order', '-popularity_score', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['product_type']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_product_type_display()}"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def current_price(self):
        """Returns sale price if available, otherwise regular price"""
        return self.sale_price if self.sale_price else self.price
    
    @property
    def is_on_sale(self):
        return self.sale_price is not None and self.sale_price < self.price
    
    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return round((1 - self.sale_price / self.price) * 100)
        return 0
    
    @property
    def in_stock(self):
        return self.stock > 0
    
    @property
    def all_images(self):
        """Returns main image + all gallery images from ProductImage model"""
        images = []
        if self.image:
            images.append({
                'id': None,
                'url': self.image.url,
                'is_primary': True,
                'caption': self.name,
            })
        for img in self.gallery.filter(is_active=True):
            images.append({
                'id': img.id,
                'url': img.image.url if img.image else None,
                'is_primary': img.is_primary,
                'caption': img.caption or self.name,
            })
        return images
    
    @property
    def primary_image_url(self):
        if self.image:
            return self.image.url
        first_gallery = self.gallery.filter(is_active=True, is_primary=True).first()
        if first_gallery:
            return first_gallery.image.url
        first_gallery = self.gallery.filter(is_active=True).first()
        if first_gallery:
            return first_gallery.image.url
        return None


class ProductImage(BaseModel):
    """
    Multiple images for a shop product (Gallery/Inline)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='shop/products/gallery/')
    caption = models.CharField(max_length=500, blank=True)
    alt_text = models.CharField(max_length=500, blank=True, help_text="Alternative text for accessibility")
    is_primary = models.BooleanField(default=False, help_text="Set as primary/thumbnail image")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images (Gallery)"
        indexes = [
            models.Index(fields=['product', 'is_active', 'order']),
        ]
    
    def __str__(self):
        return f"Image for {self.product.name} - {self.caption or 'No caption'}"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None


class Cart(BaseModel):
    """
    Shopping cart (supports both logged-in and guest users)
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='cart')
    session_id = models.CharField(max_length=100, null=True, blank=True, help_text="For guest users")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        if self.user:
            return f"Cart of {self.user.username}"
        return f"Guest Cart #{self.id}"
    
    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0
    
    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def total(self):
        return self.subtotal


class CartItem(BaseModel):
    """
    Individual item in shopping cart
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ['cart', 'product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.cart}"
    
    @property
    def subtotal(self):
        return self.quantity * self.product.current_price


class Order(BaseModel):
    """
    Customer orders
    """
    STATUS_CHOICES = (
        ('pending', 'Pending Payment'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    order_number = models.CharField(max_length=50, unique=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Customer details
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    
    # Order totals
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment
    payment_status = models.CharField(max_length=20, default='pending')
    payment_method = models.CharField(max_length=50, default='pawapay')
    payment_reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Shipping
    tracking_number = models.CharField(max_length=100, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Order #{self.order_number} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            from datetime import datetime
            self.order_number = f"FEE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)


class OrderItem(BaseModel):
    """
    Individual item in an order
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=300)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name} in Order #{self.order.order_number}"
    
    @property
    def subtotal(self):
        return self.quantity * self.price