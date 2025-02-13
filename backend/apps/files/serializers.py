from rest_framework import serializers
from .models import File, FileShare

class FileShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_by', 'shared_with', 'created_at')
        read_only_fields = ('shared_by', 'created_at')

class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    shared_with = serializers.SerializerMethodField()
    
    def get_url(self, obj):
        return obj.get_file_url()

    def get_shared_with(self, obj):
        shares = obj.shares.all()
        return [{'id': share.shared_with.id, 'email': share.shared_with.email} for share in shares]

    class Meta:
        model = File
        fields = ['id', 'name', 'mime_type', 'size', 'created_at', 'updated_at', 'url', 'shared_with']
        read_only_fields = ['id', 'created_at', 'updated_at', 'url'] 