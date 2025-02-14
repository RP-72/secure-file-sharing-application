from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from core.utils.sanitizers import sanitize_email
import re

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'is_totp_enabled', 'role')

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('email', 'password')

    def validate_password(self, value):
        """Validate password strength."""
        if len(value) < 8:
            raise serializers.ValidationError(
                'Password must be at least 8 characters long.'
            )
        
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                'Password must contain at least one uppercase letter.'
            )
            
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                'Password must contain at least one lowercase letter.'
            )
            
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                'Password must contain at least one number.'
            )
            
        if not re.search(r'[!@#$%^&*]', value):
            raise serializers.ValidationError(
                'Password must contain at least one special character (!@#$%^&*).'
            )
            
        return value

    def validate_email(self, value):
        """Validate and sanitize email."""
        sanitized_email = sanitize_email(value)
        if not sanitized_email:
            raise serializers.ValidationError('Invalid email format.')
            
        # Check if email already exists
        if User.objects.filter(email=sanitized_email).exists():
            raise serializers.ValidationError('Email already registered.')
            
        return sanitized_email

    def create(self, validated_data):
        # Set username to email when creating user
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user 