# realtime/serializers.py

from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Chat Messages"""
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_full_name = serializers.SerializerMethodField()
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    recipient_full_name = serializers.SerializerMethodField()
    is_sender = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'sender_full_name', 
            'recipient', 'recipient_name', 'recipient_full_name',
            'message', 'is_read', 'read_at', 'attachment',
            'created_at', 'is_sender'
        ]
        read_only_fields = ['id', 'created_at', 'read_at', 'is_sender']
    
    def get_sender_full_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username
    
    def get_recipient_full_name(self, obj):
        return obj.recipient.get_full_name() or obj.recipient.username
    
    def get_is_sender(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False


class ConversationSerializer(serializers.Serializer):
    """Serializer for conversation list"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    profile_picture = serializers.CharField(allow_null=True)
    last_message = serializers.CharField()
    last_message_time = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
    is_online = serializers.BooleanField(default=False)


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a message"""
    recipient_id = serializers.IntegerField(required=True)
    message = serializers.CharField(required=True, max_length=2000)
    attachment = serializers.FileField(required=False)