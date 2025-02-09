from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User(AbstractUser):
    email = models.EmailField(unique=True)
    totp_secret = models.CharField(max_length=32, null=True, blank=True)
    is_totp_enabled = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'auth_user'
