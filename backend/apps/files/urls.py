from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload_file'),
    path('', views.list_files, name='list_files'),
    path('<uuid:file_id>/download/', views.download_file, name='download_file'),
    path('<uuid:file_id>/', views.delete_file, name='delete_file'),
    path('<uuid:file_id>/share/', views.share_file, name='share_file'),
    path('shared_with_me/', views.shared_with_me, name='shared_with_me'),
    path('<uuid:file_id>/create-share-link/', views.create_share_link, name='create_share_link'),
]
