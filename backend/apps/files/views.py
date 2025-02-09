from django.shortcuts import render
import os
import mimetypes
from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import File
from .serializers import FileSerializer

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
        file = File.objects.get(id=file_id, owner=request.user)
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
