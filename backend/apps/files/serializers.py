from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = ['id', 'name', 'mime_type', 'size', 'created_at', 'updated_at', 'url']
        read_only_fields = ['id', 'created_at', 'updated_at', 'url']
    
    def get_url(self, obj):
        return obj.get_file_url() 