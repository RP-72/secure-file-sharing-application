from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.refresh_token, name='token_refresh'),
    path('verify-2fa/', views.verify_2fa, name='verify_2fa'),
    path('me/', views.me, name='me'),
    path('login-verify-2fa/', views.login_verify_2fa, name='login_verify_2fa'),
] 