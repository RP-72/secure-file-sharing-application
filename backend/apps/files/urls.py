from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload_file'),
    path('', views.list_files, name='list_files'),
    path('<uuid:file_id>/download/', views.download_file, name='download_file'),
    path('<uuid:file_id>/', views.delete_file, name='delete_file'),
] 