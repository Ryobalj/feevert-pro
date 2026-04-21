# accounts/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings  # <-- ONGEZA HII

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
# USER VIEWSET
# =========================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if user.role and user.role.name == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def update_profile(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


# =========================
# REGISTER
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    serializer = UserCreateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = serializer.save()

    UserActivityLog.log_action(
        user=user,
        action='REGISTER',
        description=f"User {user.username} registered",
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

    # create email verification token
    token_obj = AuthService.create_email_verification(user)

    # Build verification URL - FIXED (no build_url)
    if settings.IS_PRODUCTION:
        verify_url = f"https://feevert-api.onrender.com/api/auth/verify-email/?token={token_obj.token}"
    else:
        verify_url = f"http://127.0.0.1:8000/api/auth/verify-email/?token={token_obj.token}"

    # send email
    if user.email:
        EmailService.send_verification_email(user, token_obj.token, verify_url=verify_url)

    refresh = RefreshToken.for_user(user)

    return Response({
        "success": True,
        "message": "Account created. Check email for verification.",
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "email_verification_required": True
    }, status=201)


# =========================
# LOGIN (JWT)
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password']
    )

    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    UserActivityLog.log_action(
        user=user,
        action='LOGIN',
        description=f"User {user.username} logged in",
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

    return Response({
        "success": True,
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    })


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

        # Build verification URL - FIXED (no build_url)
        if settings.IS_PRODUCTION:
            verify_url = f"https://feevert-api.onrender.com/api/auth/verify-email/?token={token_obj.token}"
        else:
            verify_url = f"http://127.0.0.1:8000/api/auth/verify-email/?token={token_obj.token}"

        EmailService.send_verification_email(user, token_obj.token, verify_url=verify_url)

        return Response({
            "success": True,
            "message": "Verification email sent again"
        })

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)