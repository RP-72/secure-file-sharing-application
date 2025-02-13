import os
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

def get_file_path(instance, filename):
    # Generate a UUID for the file
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    # Return the complete upload path
    return os.path.join('uploads', str(instance.owner.id), filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=get_file_path)
    mime_type = models.CharField(max_length=255)
    size = models.BigIntegerField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    iv = models.TextField()  # Store base64 encoded IV

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_file_url(self):
        return f'/api/files/{self.id}/download/'

class FileShare(models.Model):
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='shared_files')
    shared_with = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='received_files')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('file', 'shared_with')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.name} shared by {self.shared_by.email} with {self.shared_with.email}"

class FileShareLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='share_links')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Share link for {self.file.name} (expires: {self.expires_at})"
