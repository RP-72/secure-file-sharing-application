from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
import jwt
from .models import User

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            # Allow verification tokens to pass through
            token_type = payload.get('token_type')
            if token_type not in ['access', 'verification']:
                raise exceptions.AuthenticationFailed('Invalid token type')
            
            user = User.objects.get(id=payload['user_id'])
            
            # For verification tokens, authenticate but mark as verification
            if token_type == 'verification':
                user.is_verification_token = True
            
            return (user, token)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except (jwt.InvalidTokenError, User.DoesNotExist):
            raise exceptions.AuthenticationFailed('Invalid token')

    def authenticate_header(self, request):
        return 'Bearer' 