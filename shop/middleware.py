# shop/middleware.py

from .models import Cart


class CartMiddleware:
    """
    Middleware ya ku-attach cart kwa kila request.
    Inafanya kazi kwa logged-in users na guest users.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Attach cart to request
        request.cart = self.get_cart(request)
        
        response = self.get_response(request)
        return response
    
    def get_cart(self, request):
        """Get or create cart for current user/session"""
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_id=session_id)
        return cart