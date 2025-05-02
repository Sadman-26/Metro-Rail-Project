from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, Journey, Payment, LostItem, UserLostReport, Feedback, Complaint

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'is_admin')
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class JourneySerializer(serializers.ModelSerializer):
    class Meta:
        model = Journey
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class LostItemSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    display_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LostItem
        fields = '__all__'
        read_only_fields = ('posted_by',)  # Make posted_by read-only, so it can only be set by the view
    
    def get_posted_by_name(self, obj):
        return obj.posted_by.name if obj.posted_by.name else obj.posted_by.username
    
    def get_date(self, obj):
        return obj.date.isoformat() if hasattr(obj, 'date') and obj.date else None
        
    def get_display_image_url(self, obj):
        """Get the processed image URL"""
        return obj.get_image_url
    
    def create(self, validated_data):
        # Print the data being sent for debugging
        print(f"Creating LostItem with data: {validated_data}")
        
        # If posted_by is already in validated_data, use it
        if 'posted_by' in validated_data:
            try:
                # If posted_by is a string ID, convert to User object
                if isinstance(validated_data['posted_by'], str):
                    from metro.models import User
                    user_id = validated_data['posted_by']
                    try:
                        user = User.objects.get(id=user_id)
                        validated_data['posted_by'] = user
                    except User.DoesNotExist:
                        raise serializers.ValidationError(f"User with ID {user_id} does not exist")
            except Exception as e:
                print(f"Error processing posted_by: {e}")
                # If any error occurs, try to use the request user
                if self.context.get('request'):
                    validated_data['posted_by'] = self.context['request'].user
        # If posted_by is not provided, use the request user
        elif self.context.get('request') and self.context['request'].user.is_authenticated:
            validated_data['posted_by'] = self.context['request'].user
        else:
            # If neither is available, raise an error
            raise serializers.ValidationError("posted_by field is required")
            
        return super().create(validated_data)

class UserLostReportSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLostReport
        fields = '__all__'
    
    def get_user_name(self, obj):
        return obj.user.name if hasattr(obj.user, 'name') else obj.user.username
    
    def get_user_email(self, obj):
        return obj.user.email

class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ('user',)  # Make user field read-only, so it can only be set by the view
    
    def get_user_name(self, obj):
        return obj.user.name if hasattr(obj.user, 'name') else obj.user.username
    
    def get_user_email(self, obj):
        return obj.user.email

class ComplaintSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ('user',)
    
    def get_user_name(self, obj):
        return obj.user.name if hasattr(obj.user, 'name') else obj.user.username
    
    def get_user_email(self, obj):
        return obj.user.email
