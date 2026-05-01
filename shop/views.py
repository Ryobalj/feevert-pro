# shop/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType

from .models import ProductCategory, Product, Cart, CartItem, Order, OrderItem
from .serializers import (
    ProductCategorySerializer, ProductListSerializer, ProductDetailSerializer,
    CartSerializer, CartItemSerializer, AddToCartSerializer,
    OrderSerializer, CreateOrderSerializer, OrderItemSerializer
)

# PawaPay service import (models import imehamishwa ndani ya function)
from payments.services.pawapay_service import PawaPayService


class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'product_type', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'name', 'popularity_score', 'order']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        products = self.get_queryset().filter(sale_price__isnull=False)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user)
        session_id = self.request.session.session_key
        if not session_id:
            self.request.session.create()
            session_id = self.request.session.session_key
        return Cart.objects.filter(session_id=session_id)
    
    def get_object(self):
        queryset = self.get_queryset()
        cart = queryset.first()
        if not cart:
            if self.request.user.is_authenticated:
                cart = Cart.objects.create(user=self.request.user)
            else:
                session_id = self.request.session.session_key
                cart = Cart.objects.create(session_id=session_id)
        return cart
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = self.get_object()
        product = Product.objects.filter(id=serializer.validated_data['product_id'], is_active=True).first()
        
        if not product:
            return Response({'error': 'Product not found'}, status=404)
        
        if product.stock < serializer.validated_data['quantity']:
            return Response({'error': f'Only {product.stock} items available'}, status=400)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': serializer.validated_data['quantity']}
        )
        
        if not created:
            cart_item.quantity += serializer.validated_data['quantity']
            cart_item.save()
        
        return Response(CartSerializer(cart).data)
    
    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity', 1)
        
        cart_item = CartItem.objects.filter(id=item_id, cart=self.get_object()).first()
        if not cart_item:
            return Response({'error': 'Item not found in cart'}, status=404)
        
        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()
        
        return Response(CartSerializer(self.get_object()).data)
    
    @action(detail=False, methods=['post'])
    def remove(self, request):
        item_id = request.data.get('item_id')
        CartItem.objects.filter(id=item_id, cart=self.get_object()).delete()
        return Response(CartSerializer(self.get_object()).data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        self.get_object().items.all().delete()
        return Response({'message': 'Cart cleared'})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        import uuid
        from django.apps import apps
        
        # Lazy import to avoid circular import
        PaymentTransaction = apps.get_model('payments', 'PaymentTransaction')
        
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get user's cart
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            full_name=serializer.validated_data['full_name'],
            email=serializer.validated_data['email'],
            phone=serializer.validated_data['phone'],
            shipping_address=serializer.validated_data['shipping_address'],
            city=serializer.validated_data['city'],
            region=serializer.validated_data['region'],
            subtotal=cart.subtotal,
            shipping_cost=0,
            total=cart.total,
            notes=serializer.validated_data.get('notes', ''),
            payment_status='pending',
            payment_method='pawapay',
        )
        
        # Create order items from cart
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                quantity=cart_item.quantity,
                price=cart_item.product.current_price,
            )
        
        # Initiate PawaPay payment
        transaction_id = f"FEE-{uuid.uuid4().hex[:8].upper()}"
        
        # Create payment transaction
        payment = PaymentTransaction.objects.create(
            user=request.user,
            order=order,
            amount=order.total,
            currency='TZS',
            transaction_id=transaction_id,
            gateway='pawapay',
            customer_name=order.full_name,
            customer_email=order.email,
            customer_phone=order.phone,
            status='pending'
        )
        
        # Initiate payment with PawaPay
        pawapay = PawaPayService()
        result = pawapay.initiate_deposit(
            transaction_id=transaction_id,
            amount=str(order.total),
            currency='TZS',
            phone_number=order.phone,
            customer_name=order.full_name,
            customer_email=order.email
        )
        
        if result.get('success'):
            # Update payment with gateway response
            payment.gateway_reference = result.get('deposit_id')
            payment.payment_link = result.get('redirect_url', '')
            payment.gateway_response = result
            payment.status = 'processing'
            payment.save()
            
            # Update order payment status
            order.payment_reference = transaction_id
            order.payment_status = 'processing'
            order.save()
            
            # Clear cart after successful order
            cart.items.all().delete()
            
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': order.order_number,
                'transaction_id': transaction_id,
                'payment_link': payment.payment_link,
                'message': 'Order created successfully. Please complete payment to process your order.'
            }, status=201)
        
        else:
            # Payment initiation failed
            payment.status = 'failed'
            payment.error_message = result.get('error', 'Payment initiation failed')
            payment.gateway_response = result
            payment.save()
            
            order.payment_status = 'failed'
            order.save()
            
            return Response({
                'success': False,
                'order_number': order.order_number,
                'error': 'Payment initiation failed. Your order has been saved, please try paying again later.'
            }, status=400)