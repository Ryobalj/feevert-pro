# accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Role, UserActivityLog

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for User Profile"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'username', 'email', 'address', 'city',
            'country', 'postal_code', 'date_of_birth', 'gender',
            'newsletter_subscribed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with nested profile"""
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    # Nested profile - inaonyesha profile data moja kwa moja
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'role', 'role_name',
            'full_name', 'profile_picture', 'profile_picture_url',
            'bio', 'is_verified', 'preferred_language',
            'date_joined', 'last_login', 'is_active',
            'profile'  # <-- NESTED PROFILE
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    role_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'phone', 'password', 'password_confirm', 'role_id']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        
        # Password strength validation
        password = data['password']
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        if not any(c.isalpha() for c in password):
            raise serializers.ValidationError({"password": "Password must contain at least one letter."})
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password')
        
        user = User(**validated_data)
        
        # Set role: use provided role_id OR default to 'client'
        if role_id:
            try:
                user.role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                user.role = Role.objects.get(name='client')
        else:
            user.role, _ = Role.objects.get_or_create(
                name='client',
                defaults={
                    'description': 'Default client role - Basic access',
                    'is_system_role': True,
                    'priority_level': 10
                }
            )
        
        user.set_password(password)
        user.save()
        
        # Create profile automatically
        Profile.objects.get_or_create(user=user)
        
        return user


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model"""
    users_count = serializers.IntegerField(source='users.count', read_only=True)
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_system_role', 'priority_level', 'users_count']
        read_only_fields = ['id', 'users_count']


class UserActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for User Activity Log"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserActivityLog
        fields = ['id', 'user', 'user_name', 'action', 'ip_address', 'user_agent', 'details', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True, min_length=8)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        
        # Password strength
        new_password = data['new_password']
        if not any(c.isalpha() for c in new_password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one letter."})
        if not any(c.isdigit() for c in new_password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one number."})
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)