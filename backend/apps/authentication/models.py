from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class User(AbstractUser):
    # Role choices
    ADMIN = 'admin'
    REGULAR = 'regular'
    GUEST = 'guest'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (REGULAR, 'Regular'),
        (GUEST, 'Guest'),
    ]

    email = models.EmailField(unique=True)
    totp_secret = models.CharField(max_length=32, null=True, blank=True)
    is_totp_enabled = models.BooleanField(default=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=GUEST)
    
    class Meta:
        db_table = 'auth_user'

    def is_admin(self):
        return self.role == self.ADMIN

    def is_regular(self):
        return self.role == self.REGULAR

    def is_guest(self):
        return self.role == self.GUEST
