from django.shortcuts import render
import os
import mimetypes
from django.http import FileResponse, HttpResponse, JsonResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.authentication.permissions import IsRegularUser, IsGuest
from .models import File, FileShare, FileShareLink
from .serializers import FileSerializer, FileShareSerializer, FileShareLinkSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import PermissionDenied
from core.utils.sanitizers import (
    sanitize_filename, 
    validate_file_size, 
    validate_mime_type,
    sanitize_email
)

User = get_user_model()

# Create your views here.

@api_view(['POST'])
@permission_classes([IsRegularUser])
def upload_file(request):
    if 'file' not in request.FILES:
        return Response({
            'error': 'No file provided'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']
    iv = request.POST.get('iv')
    
    # Validate file size
    if not validate_file_size(uploaded_file.size):
        return Response({
            'error': 'File size exceeds maximum limit of 10MB'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Sanitize and validate filename
    safe_filename = sanitize_filename(uploaded_file.name)
    
    # Validate mime type
    mime_type = uploaded_file.content_type or mimetypes.guess_type(safe_filename)[0]
    if not validate_mime_type(mime_type):
        return Response({
            'error': 'Invalid file type'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create file object with sanitized data
    file = File(
        name=safe_filename,
        file=uploaded_file,
        mime_type=mime_type,
        size=uploaded_file.size,
        owner=request.user,
        iv=iv
    )
    file.save()
    
    return Response(FileSerializer(file).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsGuest])
def list_files(request):
    # Allow admins to see all files, others only see their own
    if request.user.role == 'admin':
        files = File.objects.all()
    else:
        files = File.objects.filter(owner=request.user)
    return Response(FileSerializer(files, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_file(request, file_id):
    try:
        file = File.objects.get(id=file_id)
        
        # Allow access if user is admin, owner, or file is shared with them
        if (request.user.role == 'admin' or 
            file.owner == request.user or 
            file.shares.filter(shared_with=request.user).exists()):
            
            # If metadata is requested, return encryption metadata
            if request.query_params.get('metadata'):
                return Response({
                    'iv': file.iv,
                    'filename': file.name,
                    'mime_type': file.mime_type,
                })
                
            # Otherwise return the file content
            response = FileResponse(file.file, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file.name}"'
            return response
            
        return Response({
            'error': 'Access denied'
        }, status=status.HTTP_403_FORBIDDEN)
        
    except File.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsRegularUser])
def delete_file(request, file_id):
    try:
        # Allow admins to delete any file, others only their own
        if request.user.role == 'admin':
            file = File.objects.get(id=file_id)
        else:
            file = File.objects.get(id=file_id, owner=request.user)
            
        file.file.delete()  # Delete the actual file
        file.delete()  # Delete the database record
        return Response(status=status.HTTP_204_NO_CONTENT)
    except File.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsRegularUser])
def share_file(request, file_id):
    # Allow admins to share any file, others only their own
    if request.user.role == 'admin':
        file = get_object_or_404(File, id=file_id)
    else:
        file = get_object_or_404(File, id=file_id, owner=request.user)
        
    shared_with_email = request.data.get('email')

    if not shared_with_email:
        return Response({'error': 'Email is required'}, status=400)
    
    # Sanitize email
    sanitized_email = sanitize_email(shared_with_email)
    if not sanitized_email:
        return Response({'error': 'Invalid email format'}, status=400)
    
    try:
        user_to_share_with = User.objects.get(email=sanitized_email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    # Don't allow sharing with yourself
    if user_to_share_with == request.user:
        return Response({'error': 'You cannot share the file with yourself'}, status=400)
    
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_share_link(request, file_id):
    try:
        # Allow admins to create share links for any file, others only their own
        if request.user.role == 'admin':
            file = File.objects.get(id=file_id)
        else:
            file = File.objects.get(id=file_id, owner=request.user)
            
        share_link = FileShareLink.objects.create(
            file=file,
            created_by=request.user,
            expires_at=timezone.now() + timedelta(seconds=10),
            iv=file.iv,
            name=file.name,
            mime_type=file.mime_type
        )
        serializer = FileShareLinkSerializer(share_link, context={'request': request})
        return Response(serializer.data)
    except File.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def access_shared_file(request, share_id):
    try:
        share_link = FileShareLink.objects.get(id=share_id)
        
        if share_link.is_expired():
            return Response({
                'error': 'Share link has expired'
            }, status=status.HTTP_410_GONE)
            
        file = share_link.file
        
        # If metadata is requested, return encryption metadata
        if request.query_params.get('metadata'):
            return Response({
                'iv': file.iv,
                'filename': file.name,
                'mime_type': file.mime_type,
            })
        
        response = FileResponse(file.file, content_type=file.mime_type)
        response['Content-Disposition'] = f'inline; filename="{file.name}"'
        response['Content-Type'] = file.mime_type  # Explicitly set content type
        return response
    except FileShareLink.DoesNotExist:
        return Response({
            'error': 'Share link not found'
        }, status=status.HTTP_404_NOT_FOUND)
