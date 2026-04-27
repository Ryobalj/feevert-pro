# accounts/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings

from rest_framework_simplejwt.tokens import RefreshToken

from .services.auth_service import AuthService
from .services.email_service import EmailService

from .models import (
    User,
    Profile,
    Role,
    UserActivityLog,
    EmailVerificationToken
)

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    ProfileSerializer,
    RoleSerializer,
    UserActivityLogSerializer,
    ChangePasswordSerializer,
    LoginSerializer
)

from .throttles import LoginThrottle, RegisterThrottle


# =========================
# USER VIEWSET - ENHANCED
# =========================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'me']:
            self.permission_classes = [AllowAny] if self.action == 'create' else [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.role and user.role.name == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        """
        Get or update current authenticated user.
        
        GET: Returns current user profile
        PUT/PATCH: Updates current user profile
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            UserActivityLog.log_action(
                user=user,
                action='UPDATE_PROFILE',
                description=f"User {user.username} updated their profile",
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "user": serializer.data
            })
        
        return Response({
            "success": False,
            "error": "Validation failed",
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def update_profile(self, request):
        """Legacy method - kept for backward compatibility"""
        return self.me(request)


# =========================
# REGISTER - ENHANCED (EMAIL FIXED)
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    """
    Register a new user account.
    """
    request_data = request.data.copy()
    if 'password' in request_data:
        request_data['password'] = '***'
    if 'password_confirm' in request_data:
        request_data['password_confirm'] = '***'
    
    print(f"📥 Register request: {request_data}")
    
    serializer = UserCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        errors = {}
        for field, error_list in serializer.errors.items():
            errors[field] = error_list[0] if isinstance(error_list, list) else str(error_list)
        
        print(f"❌ Registration validation failed: {errors}")
        
        return Response(
            {
                "success": False,
                "error": "Validation failed",
                "details": errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = serializer.save()
        print(f"✅ User created: {user.username} (ID: {user.id})")
    except Exception as e:
        print(f"❌ Error saving user: {str(e)}")
        return Response(
            {
                "success": False,
                "error": "Unable to create account. Please try again."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    UserActivityLog.log_action(
        user=user,
        action='REGISTER',
        description=f"User {user.username} registered with email {user.email}",
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    email_sent = False
    token = None
    
    if user.email:
        try:
            token_obj = AuthService.create_email_verification(user)
            token = token_obj.token
            EmailService.send_verification_email(user, token)
            email_sent = True
            print(f"📧 Verification email sent to: {user.email}")
        except Exception as e:
            print(f"⚠️ Failed to send verification email: {str(e)}")
            email_sent = False
    
    refresh = RefreshToken.for_user(user)
    
    response_data = {
        "success": True,
        "message": "Account created successfully.",
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "email_verification_required": True,
        "email_sent": email_sent
    }
    
    if not email_sent and user.email:
        response_data["message"] += " However, verification email could not be sent. You can request a new one from your profile."
    
    if not settings.IS_PRODUCTION and token:
        response_data["verification_url"] = f"http://127.0.0.1:8000/api/auth/verify-email/?token={token}"
    
    print(f"✅ Registration complete for: {user.username}")
    
    return Response(response_data, status=status.HTTP_201_CREATED)


# =========================
# LOGIN (JWT) - ENHANCED
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    """
    Authenticate user and return JWT tokens.
    """
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        print(f"⚠️ Login validation failed: {serializer.errors}")
        return Response(
            {"error": "Invalid request data", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    username = serializer.validated_data.get('username')
    password = serializer.validated_data.get('password')
    
    user = authenticate(request, username=username, password=password)
    
    if not user:
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = User.objects.get(email=username)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
    
    if not user:
        print(f"🔐 Failed login attempt for: {username} from IP: {request.META.get('REMOTE_ADDR')}")
        return Response(
            {
                "success": False,
                "error": "Invalid username/email or password"
            },
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        print(f"⚠️ Inactive user attempted login: {user.username}")
        return Response(
            {
                "success": False,
                "error": "Your account has been deactivated. Please contact support."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    refresh = RefreshToken.for_user(user)
    
    UserActivityLog.log_action(
        user=user,
        action='LOGIN',
        description=f"User {user.username} logged in successfully",
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    
    response_data = {
        "success": True,
        "message": "Login successful",
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "expires_in": 7200,
    }
    
    print(f"✅ User {user.username} (role: {user.role_name if hasattr(user, 'role_name') else 'N/A'}) logged in successfully")
    
    return Response(response_data, status=status.HTTP_200_OK)


# =========================
# LOGOUT (JWT BLACKLIST)
# =========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()

        UserActivityLog.log_action(
            user=request.user,
            action='LOGOUT',
            description=f"User {request.user.username} logged out",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        return Response({"success": True})

    except Exception:
        return Response({"error": "Invalid token"}, status=400)


# =========================
# CHANGE PASSWORD
# =========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = request.user

    if not user.check_password(serializer.validated_data['old_password']):
        return Response({"error": "Old password incorrect"}, status=400)

    user.set_password(serializer.validated_data['new_password'])
    user.save()

    UserActivityLog.log_action(
        user=user,
        action='CHANGE_PASSWORD',
        description="Password changed",
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

    return Response({"success": True})


# =========================
# PROFILE
# =========================
class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.none()

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# =========================
# ROLES
# =========================
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


# =========================
# ACTIVITY LOGS
# =========================
class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserActivityLog.objects.all()
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role and user.role.name == 'admin':
            return UserActivityLog.objects.all()
        return UserActivityLog.objects.filter(user=self.request.user)


# =========================
# EMAIL VERIFICATION
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get('token')

    if not token:
        return Response({"error": "Token required"}, status=400)

    try:
        token_obj = EmailVerificationToken.objects.get(token=token)

        if not token_obj.is_valid():
            return Response({"error": "Token expired or used"}, status=400)

        token_obj.verified_at = timezone.now()
        token_obj.save()

        user = token_obj.user
        user.email_verified = True
        user.save()

        UserActivityLog.log_action(
            user=user,
            action='EMAIL_VERIFIED',
            description="Email verified successfully",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

        return Response({
            "success": True,
            "message": "Email verified successfully"
        })

    except EmailVerificationToken.DoesNotExist:
        return Response({"error": "Invalid token"}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def resend_verification_email(request):
    email = request.data.get('email')

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)

        if user.email_verified:
            return Response({"message": "Email already verified"})

        token_obj = AuthService.create_email_verification(user)
        EmailService.send_verification_email(user, token_obj.token)
        
        return Response({
            "success": True,
            "message": "Verification email sent again"
        })

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# =========================
# CURRENT USER ENDPOINT (FALLBACK)
# =========================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)