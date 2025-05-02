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
        if self.action == 'list' or self.action == 'retrieve':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Lost item create request: {request.data}")
        logger.info(f"User ID: {request.user.id}, User email: {request.user.email}")
        
        # Handle image from request
        image_path = None
        if 'image_file' in request.FILES:
            image_file = request.FILES['image_file']
            logger.info(f"Processing uploaded image: {image_file}")
            image_path = image_file.name
        elif 'image_path' in request.data:
            path = request.data.get('image_path')
            image_path = path.split('/')[-1] if '/' in path else path
            logger.info(f"Using provided image path: {image_path}")
        else:
            image_path = "cat.jpg"
            logger.info(f"No image provided, using default: {image_path}")
        
        # Prepare data dictionary
        data = {}
        for key in request.data:
            if key not in ['image_file', 'image_path']:
                data[key] = request.data[key]
        
        # Ensure status is set
        if 'status' not in data:
            data['status'] = 'unclaimed'
            logger.info("Setting default status to 'unclaimed'")
        
        data['image_url'] = image_path
        logger.info(f"Prepared data for serializer: {data}")
        
        # Create serializer with data
        serializer = self.get_serializer(data=data)
        
        # Validate serializer data
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Save with posted_by set to request user
        self.perform_create(serializer)
        
        # Return success response
        headers = self.get_success_headers(serializer.data)
        logger.info(f"Successfully created lost item: {serializer.data}")
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class UserLostReportViewSet(viewsets.ModelViewSet):
    queryset = UserLostReport.objects.all()
    serializer_class = UserLostReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f"UserLostReportViewSet get_queryset called by user: {self.request.user.email}, is_admin: {self.request.user.is_admin}")
        # If user is admin, return all reports
        try:
            if self.request.user.is_admin:
                all_reports = UserLostReport.objects.all()
                logger.info(f"Admin user, returning all reports: {all_reports.count()} reports found")
                return all_reports
            # Otherwise, return only the user's own reports
            user_reports = UserLostReport.objects.filter(user=self.request.user)
            logger.info(f"Regular user, returning user's own reports: {user_reports.count()} reports found")
            return user_reports
        except Exception as e:
            logger.error(f"Error in UserLostReportViewSet.get_queryset: {str(e)}")
            return UserLostReport.objects.none()
    
    @action(detail=False, methods=['get'])
    def debug_reports(self, request):
        """Debug endpoint to check if reports exist and can be accessed."""
        try:
            all_reports = UserLostReport.objects.all()
            all_reports_count = all_reports.count()
            
            user_reports = UserLostReport.objects.filter(user=request.user)
            user_reports_count = user_reports.count()
            
            report_examples = []
            if all_reports_count > 0:
                report_examples = [
                    {
                        "id": report.id,
                        "title": report.title,
                        "user_id": report.user.id,
                        "user_email": report.user.email
                    }
                    for report in all_reports[:3]  # Get up to 3 examples
                ]
            
            debug_info = {
                "total_reports": all_reports_count,
                "user_reports": user_reports_count,
                "user_is_admin": request.user.is_admin,
                "user_id": request.user.id,
                "user_email": request.user.email,
                "report_examples": report_examples
            }
            
            return Response(debug_info)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def create_samples(self, request):
        """Create sample user reports for testing."""
        try:
            if not request.user.is_admin:
                return Response({"error": "Only admins can create sample reports"}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # Get all users (or a subset)
            users = User.objects.all()[:5]  # Limit to 5 users
            if not users:
                return Response({"error": "No users found"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Sample report data
            sample_reports = [
                {
                    "title": "Lost Wallet",
                    "description": "I lost my black leather wallet on the metro. It has my ID and credit cards.",
                    "contact": "01712345678"
                },
                {
                    "title": "Missing Phone",
                    "description": "Left my Samsung phone at Uttara North station around 5pm.",
                    "contact": "01898765432"
                },
                {
                    "title": "Lost Backpack",
                    "description": "Blue backpack with textbooks lost on the train at Agargaon station.",
                    "contact": "01654321234"
                }
            ]
            
            # Create reports for different users
            created_reports = []
            for i, user in enumerate(users):
                report_data = sample_reports[i % len(sample_reports)]
                report = UserLostReport.objects.create(
                    user=user,
                    title=report_data["title"],
                    description=report_data["description"],
                    contact=report_data["contact"]
                )
                created_reports.append({
                    "id": report.id,
                    "title": report.title,
                    "user": user.email
                })
            
            return Response({
                "message": f"Created {len(created_reports)} sample reports",
                "reports": created_reports
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # If user is admin, return all feedback
        if self.request.user.is_admin:
            return Feedback.objects.all()
        # Otherwise, return only the user's own feedback
        return Feedback.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Explicitly set the user to the request user
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Feedback create request from user {request.user.email}: {request.data}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Use perform_create instead of directly saving
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Feedback created successfully: ID={serializer.instance.id}, Rating={serializer.instance.rating}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # If user is admin, return all complaints
        if self.request.user.is_admin:
            return Complaint.objects.all()
        # Otherwise, return only the user's own complaints
        return Complaint.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        # Explicitly set the user to the request user
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Complaint create request from user {request.user.email}: {request.data}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Use perform_create instead of directly saving
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Complaint created successfully: ID={serializer.instance.id}, Title={serializer.instance.title}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating complaint: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
