from django.shortcuts import render
import os
import mimetypes
from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import File, FileShare
from .serializers import FileSerializer, FileShareSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

# Create your views here.

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    if 'file' not in request.FILES:
        return Response({
            'error': 'No file provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']
    
    # Create file object
    file = File(
        name=uploaded_file.name,
        file=uploaded_file,
        mime_type=uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0],
        size=uploaded_file.size,
        owner=request.user
    )
    file.save()
    
    return Response(FileSerializer(file).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_files(request):
    files = File.objects.filter(owner=request.user)
    return Response(FileSerializer(files, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_file(request, file_id):
    try:
        file = File.objects.get(id=file_id)
        
        # Check if user has access (is owner or file is shared with them)
        if file.owner != request.user and not file.shares.filter(shared_with=request.user).exists():
            return Response({
                'error': 'Access denied'
            }, status=status.HTTP_403_FORBIDDEN)
            
        response = FileResponse(file.file, content_type=file.mime_type)
        response['Content-Disposition'] = f'attachment; filename="{file.name}"'
        return response
    except File.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_file(request, file_id):
    try:
        file = File.objects.get(id=file_id, owner=request.user)
        file.file.delete()  # Delete the actual file
        file.delete()  # Delete the database record
        return Response(status=status.HTTP_204_NO_CONTENT)
    except File.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_file(request, file_id):
    file = get_object_or_404(File, id=file_id, owner=request.user)
    shared_with_email = request.data.get('email')

    if not shared_with_email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        user_to_share_with = User.objects.get(email=shared_with_email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    # Don't allow sharing with yourself
    if user_to_share_with == request.user:
        return Response({'error': 'Cannot share with yourself'}, status=400)
    
    # Check if already shared
    if FileShare.objects.filter(file=file, shared_with=user_to_share_with).exists():
        return Response({'error': 'File already shared with this user'}, status=400)
    
    share = FileShare.objects.create(
        file=file,
        shared_by=request.user,
        shared_with=user_to_share_with
    )
    
    return Response(FileShareSerializer(share).data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shared_with_me(request):
    shared_files = File.objects.filter(shares__shared_with=request.user)
    serializer = FileSerializer(shared_files, many=True)
    return Response(serializer.data)
