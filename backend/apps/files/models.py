import os
import uuid
from django.db import models
from django.conf import settings

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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_file_url(self):
        return f'/api/files/{self.id}/download/'
