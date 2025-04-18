from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from django.contrib.auth import get_user_model
from .models import User, Journey, Payment, LostItem, UserLostReport, Feedback, Complaint
from .serializers import (
    UserSerializer, JourneySerializer, PaymentSerializer,
    LostItemSerializer, UserLostReportSerializer,
    FeedbackSerializer, ComplaintSerializer
)
import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

class JourneyViewSet(viewsets.ModelViewSet):
    queryset = Journey.objects.all()
    serializer_class = JourneySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Journey.objects.filter(user=self.request.user)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

class LostItemViewSet(viewsets.ModelViewSet):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_permissions(self):
        """
        Override get_permissions to allow GET (list/retrieve) without authentication
        but require authentication for POST, PUT, DELETE
        """
        if self.action == 'list' or self.action == 'retrieve':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Set the posted_by field automatically to the current user
        logger.info(f"Creating lost item by user: {self.request.user.email}")
        serializer.save(posted_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Detailed debugging
        logger.info(f"Lost item create request: {request.data}")
        
        # Debug auth information
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info(f"Auth header: {auth_header[:15]}..." if auth_header else "No auth header")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        logger.info(f"User: {request.user.email if request.user.is_authenticated else 'Anonymous'}")
        
        # Handle image upload if provided
        image_path = None
        if 'image_file' in request.FILES:
            image_path = "cat.jpg"  # Just use the name, not the full path
            logger.info(f"Using image from public folder: {image_path}")
        elif 'image_path' in request.data:
            # Get just the filename from the path
            path = request.data.get('image_path')
            image_path = path.split('/')[-1] if '/' in path else path
            logger.info(f"Using provided image path: {image_path}")
        else:
            # Use default image
            image_path = "cat.jpg"
            logger.info(f"No image provided, using default: {image_path}")
            
        # Create a modified data dict with the image_url
        data = {}
        for key in request.data:
            if key not in ['image_file', 'image_path']:
                data[key] = request.data[key]
        
        data['image_url'] = image_path
        
        # Create serializer with modified data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class UserLostReportViewSet(viewsets.ModelViewSet):
    queryset = UserLostReport.objects.all()
    serializer_class = UserLostReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserLostReport.objects.filter(user=self.request.user)

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(user=self.request.user)
