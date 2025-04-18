from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    is_admin = models.BooleanField(default=False)

class Journey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    route = models.CharField(max_length=255)
    date = models.DateField()
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    payment = models.ForeignKey('Payment', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.user.name}'s journey on {self.date}"

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('bKash', 'bKash'),
        ('Nagad', 'Nagad'),
        ('Rocket', 'Rocket'),
        ('Card', 'Card'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    reference = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name}'s payment of {self.amount}"

class LostItem(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    # Store image URLs as text fields to allow both uploaded files and external URLs
    image_url = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=[('claimed', 'Claimed'), ('unclaimed', 'Unclaimed')])
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return self.title
        
    @property
    def get_image_url(self):
        """Return a valid image URL path"""
        if not self.image_url:
            return "/images/cat.jpg"
            
        # If already an absolute URL, return it
        if self.image_url.startswith('http'):
            return self.image_url
            
        # If a proper path, return it
        if self.image_url.startswith('/'):
            return self.image_url
            
        # Otherwise add the correct prefix
        return f"/images/{self.image_url}"

class UserLostReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    contact = models.CharField(max_length=255)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name}'s lost report: {self.title}"

class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name}'s feedback"

class Complaint(models.Model):
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name}'s complaint: {self.title}"
