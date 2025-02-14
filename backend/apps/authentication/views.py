from django.shortcuts import render
import pyotp
import jwt
from datetime import timedelta, datetime, timezone
from django.conf import settings
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsAdmin
from django.contrib.auth.hashers import make_password
from .serializers import SignupSerializer, UserSerializer
from .models import User
from rest_framework.views import APIView
from core.constants import (
    APP_NAME,
    VERIFICATION_TOKEN_LIFETIME,
    ACCESS_TOKEN_LIFETIME,
    REFRESH_TOKEN_LIFETIME,
    TOTP_ISSUER
)
from django.contrib.auth import get_user_model

User = get_user_model()

def create_verification_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user.id,
        'token_type': 'verification',
        'exp': now + timedelta(minutes=VERIFICATION_TOKEN_LIFETIME),
        'iat': now
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    print("Created verification token payload:", payload)  # Debug log
    return token

def create_full_access_token(user):
    now = datetime.now(timezone.utc)
    access_payload = {
        'user_id': user.id,
        'token_type': 'access',
        'exp': now + timedelta(minutes=ACCESS_TOKEN_LIFETIME),
        'iat': now
    }
    refresh_payload = {
        'user_id': user.id,
        'token_type': 'refresh',
        'exp': now + timedelta(days=REFRESH_TOKEN_LIFETIME),
        'iat': now
    }
    return {
        'access': jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256'),
        'refresh': jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    }

def verify_token(token, expected_type='verification'):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('token_type') != expected_type:
            raise jwt.InvalidTokenError(f'Token has wrong type. Expected {expected_type}')
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.InvalidTokenError('Token has expired')
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(str(e))

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        # Check if this is the first user
        if User.objects.count() == 0:
            # First user gets admin role
            user = serializer.save(role=User.ADMIN)
        else:
            # Subsequent users get guest role
            user = serializer.save(role=User.GUEST)
        
        # Generate TOTP secret during signup
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        
        user.totp_secret = secret
        user.save()
        
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=TOTP_ISSUER
        )
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully',
            'qr_code': provisioning_uri,
            'secret': secret,
            'verification_token': create_verification_token(user)
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_2fa(request):
    # Check if user was authenticated with a verification token
    if not hasattr(request.user, 'is_verification_token'):
        return Response({
            'error': 'Invalid token type',
            'details': 'Token must be a verification token'
        }, status=status.HTTP_401_UNAUTHORIZED)

    code = request.data.get('code')
    if not code:
        return Response({
            'error': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        totp = pyotp.TOTP(request.user.totp_secret)
        if totp.verify(code):
            request.user.is_totp_enabled = True
            request.user.save()
            tokens = create_full_access_token(request.user)
            return Response({
                'message': '2FA verified successfully',
                **tokens,
                'user': UserSerializer(request.user).data
            })
        
        return Response({
            'error': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Verification failed',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_verify_2fa(request):
    email = request.data.get('email')
    code = request.data.get('code')
    
    try:
        user = User.objects.get(email=email)
        if not user.is_totp_enabled:
            return Response({
                'error': '2FA not set up for this user'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(user.totp_secret)
        verification_result = totp.verify(code)
        if verification_result:
            tokens = create_full_access_token(user)
            return Response({
                **tokens,
                'user': UserSerializer(user).data
            })
        return Response({
            'error': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return Response({
            'error': 'Unexpected error occurred',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
            if user.check_password(attrs['password']):
                if user.is_totp_enabled:
                    return {
                        'requires_2fa': True,
                        'email': attrs['email'],
                        'verification_token': create_verification_token(user)
                    }
                else:
                    secret = pyotp.random_base32()
                    totp = pyotp.TOTP(secret)
                    user.totp_secret = secret
                    user.save()
                    
                    provisioning_uri = totp.provisioning_uri(
                        name=user.email,
                        issuer_name=TOTP_ISSUER
                    )
                    
                    return {
                        'requires_2fa_setup': True,
                        'email': attrs['email'],
                        'qr_code': provisioning_uri,
                        'secret': secret,
                        'verification_token': create_verification_token(user)
                    }
            raise serializers.ValidationError('Invalid credentials')
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

class CustomTokenObtainPairView(APIView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify the refresh token
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('token_type') != 'refresh':
            raise jwt.InvalidTokenError('Invalid token type')
        
        user = User.objects.get(id=payload['user_id'])
        # Generate new access token
        now = datetime.now(timezone.utc)
        access_payload = {
            'user_id': user.id,
            'token_type': 'access',
            'exp': now + timedelta(minutes=60),
            'iat': now
        }
        return Response({
            'access': jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
        })
    except (jwt.InvalidTokenError, User.DoesNotExist) as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

# Add new endpoints for role management
@api_view(['POST'])
@permission_classes([IsAdmin])
def update_user_role(request, user_id):
    try:
        target_user = User.objects.get(id=user_id)
        new_role = request.data.get('role')
        
        if new_role not in [User.ADMIN, User.REGULAR, User.GUEST]:
            return Response({
                'error': 'Invalid role'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        target_user.role = new_role
        target_user.save()
        
        return Response(UserSerializer(target_user).data)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users(request):
    users = User.objects.all()
    return Response(UserSerializer(users, many=True).data)

@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_user(request, user_id):
    try:
        # Prevent self-deletion
        if str(request.user.id) == str(user_id):
            return Response({
                'error': 'Cannot delete yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(id=user_id)
        
        # Prevent deletion of other admin users
        if user.role == User.ADMIN:
            return Response({
                'error': 'Cannot delete admin user'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Delete user's files
        from apps.files.models import File
        import os
        
        try:
            # Get all files owned by the user
            user_files = File.objects.filter(owner=user)
            user_files.delete()
        except Exception as e:
            print(f"Error during user file cleanup: {e}")
            return Response({
                'error': f'Error cleaning up user files: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Finally delete the user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

class SignupInitView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            # Don't save the user yet, just validate the data
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'User with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate and send 2FA code
            two_factor_code = generate_2fa_code()
            send_2fa_email(email, two_factor_code)

            # Create temporary token with user data and 2FA code
            temp_token = jwt.encode({
                'email': email,
                'password': password,
                'two_factor_code': two_factor_code,
                'exp': datetime.utcnow() + timedelta(minutes=10)
            }, settings.SECRET_KEY, algorithm='HS256')

            return Response({
                'message': '2FA code sent to email',
                'temp_token': temp_token
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SignupCompleteView(APIView):
    permission_classes = []

    def post(self, request):
        temp_token = request.data.get('temp_token')
        submitted_code = request.data.get('two_factor_code')

        try:
            # Decode the temporary token
            payload = jwt.decode(
                temp_token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )

            # Verify 2FA code
            if submitted_code != payload['two_factor_code']:
                return Response(
                    {'error': 'Invalid 2FA code'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the user
            user = User.objects.create_user(
                email=payload['email'],
                password=payload['password']
            )

            # Generate access and refresh tokens
            access_token = generate_access_token(user)
            refresh_token = generate_refresh_token(user)

            return Response({
                'access': access_token,
                'refresh': refresh_token
            }, status=status.HTTP_201_CREATED)

        except jwt.ExpiredSignatureError:
            return Response(
                {'error': '2FA session expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except jwt.InvalidTokenError:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
