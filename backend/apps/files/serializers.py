from rest_framework import serializers
from .models import File, FileShare, FileShareLink

class FileShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_by', 'shared_with', 'created_at')
        read_only_fields = ('shared_by', 'created_at')

class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    shared_with = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    
    def get_url(self, obj):
        return obj.get_file_url()

    def get_shared_with(self, obj):
        shares = obj.shares.all()
        return [{'id': share.shared_with.id, 'email': share.shared_with.email} for share in shares]

    def get_owner(self, obj):
        return {
            'id': obj.owner.id,
            'email': obj.owner.email
        }

    class Meta:
        model = File
        fields = ['id', 'name', 'mime_type', 'size', 'created_at', 'updated_at', 'url', 'shared_with', 'owner']
        read_only_fields = ['id', 'created_at', 'updated_at', 'url']

class FileShareLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileShareLink
        fields = ('id', 'created_at', 'expires_at') 