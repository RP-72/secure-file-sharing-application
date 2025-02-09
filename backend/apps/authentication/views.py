from django.shortcuts import render
import pyotp
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from .serializers import SignupSerializer, UserSerializer
from .models import User

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generate token for the new user
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'token': str(refresh.access_token),
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def setup_2fa(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generate TOTP secret
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    
    # Save secret to user
    request.user.totp_secret = secret
    request.user.save()
    
    # Generate QR code provisioning URI
    provisioning_uri = totp.provisioning_uri(
        name=request.user.email,
        issuer_name="Your App Name"
    )
    
    return Response({
        'secret': secret,
        'qr_code': provisioning_uri
    })

@api_view(['POST'])
def verify_2fa(request):
    user = request.user
    code = request.data.get('code')
    
    if not code:
        return Response({
            'error': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(user.totp_secret)
    if totp.verify(code):
        user.is_totp_enabled = True
        user.save()
        return Response({'message': '2FA verified successfully'})
    
    return Response({
        'error': 'Invalid verification code'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
