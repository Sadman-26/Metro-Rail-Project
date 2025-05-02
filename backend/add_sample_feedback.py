import os
import django
import random
from datetime import datetime, timedelta
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metro_project.settings')
django.setup()

from metro.models import User, Feedback, Complaint
from django.db import transaction

def create_sample_feedback_data():
    """
    Create sample feedback data including reviews, suggestions, and complaints.
    """
    print("Creating sample feedback data...")
    
    # Get all existing users or create test users if none exist
    users = User.objects.all()
    if not users.exists():
        print("No users found. Creating test users...")
        # Create test users
        user1 = User.objects.create_user(
            username="testuser1",
            email="user1@example.com",
            password="password123",
            name="Karim Ahmed"
        )
        user2 = User.objects.create_user(
            username="testuser2",
            email="user2@example.com",
            password="password123",
            name="Fatima Rahman"
        )
        user3 = User.objects.create_user(
            username="testuser3",
            email="user3@example.com",
            password="password123",
            name="Mohammed Ali"
        )
        user4 = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="admin123",
            name="Admin User",
            is_admin=True,
            is_staff=True,
            is_superuser=True
        )
        users = [user1, user2, user3, user4]
        print(f"Created {len(users)} test users.")
    else:
        print(f"Using {users.count()} existing users.")
    
    # Create sample reviews
    reviews = [
        {"rating": 5, "comment": "The metro service is excellent! Always on time and clean."},
        {"rating": 4, "comment": "Good service overall, but could use more frequent trains during peak hours."},
        {"rating": 3, "comment": "Average experience. Stations are clean but trains can be crowded."},
        {"rating": 5, "comment": "The new metro line is a game changer for my commute!"},
        {"rating": 4, "comment": "Staff are very helpful and professional."},
        {"rating": 2, "comment": "Ticket prices are a bit high for short distances."},
        {"rating": 5, "comment": "The app makes it easy to plan journeys and check schedules."},
        {"rating": 3, "comment": "Decent service but stations lack proper seating for elderly."}
    ]
    
    # Create sample suggestions
    suggestions = [
        {"rating": 4, "comment": "[SUGGESTION] Add more charging ports for mobile devices in the stations."},
        {"rating": 3, "comment": "[SUGGESTION] Consider adding express trains that skip certain stations during rush hour."},
        {"rating": 5, "comment": "[SUGGESTION] Implement a loyalty program for frequent travelers."},
        {"rating": 4, "comment": "[SUGGESTION] Install better signage in Bangla and English at all stations."},
        {"rating": 3, "comment": "[SUGGESTION] Add more food kiosks at major stations."},
        {"rating": 4, "comment": "[SUGGESTION] Consider extending operating hours on weekends."},
        {"rating": 5, "comment": "[SUGGESTION] Create a special family card for weekend travel."},
    ]
    
    # Create sample complaints with corresponding data for the Complaints model
    complaints_feedback = [
        {"rating": 2, "comment": "[COMPLAINT] Trains are consistently late at Uttara North station."},
        {"rating": 1, "comment": "[COMPLAINT] Ticket machines at Agargaon station are not working."},
        {"rating": 2, "comment": "[COMPLAINT] Poor lighting at Motijheel station in the evening."},
        {"rating": 1, "comment": "[COMPLAINT] Air conditioning not working properly in many trains."},
        {"rating": 2, "comment": "[COMPLAINT] Overcrowding during peak hours is a serious safety concern."},
        {"rating": 1, "comment": "[COMPLAINT] The escalator at Farmgate station has been broken for weeks."},
    ]
    
    complaints_data = [
        {
            "title": "Trains are consistently late",
            "description": "The trains at Uttara North station have been 10-15 minutes late every morning this week.",
            "urgency": "medium"
        },
        {
            "title": "Ticket machines not working",
            "description": "All ticket machines at Agargaon station are out of order.",
            "urgency": "high"
        },
        {
            "title": "Poor lighting in station",
            "description": "The lighting at Motijheel station is very dim, especially in the evening. This is a safety concern.",
            "urgency": "low"
        },
        {
            "title": "Air conditioning issues",
            "description": "The air conditioning is not working properly in many trains, making the journey uncomfortable in hot weather.",
            "urgency": "medium"
        },
        {
            "title": "Overcrowding during peak hours",
            "description": "Trains are dangerously overcrowded during peak hours, especially at Farmgate and Shahbag stations.",
            "urgency": "high"
        },
        {
            "title": "Broken escalator",
            "description": "The escalator at Farmgate station has been broken for weeks and no one is fixing it.",
            "urgency": "medium"
        },
    ]
    
    # Generate creation dates for the last 30 days
    now = datetime.now()
    date_range = [now - timedelta(days=i) for i in range(30)]
    
    with transaction.atomic():
        # Create reviews
        for review in reviews:
            user = random.choice(users)
            created_at = random.choice(date_range)
            
            Feedback.objects.create(
                user=user,
                rating=review["rating"],
                comment=review["comment"],
                created_at=created_at
            )
        
        # Create suggestions
        for suggestion in suggestions:
            user = random.choice(users)
            created_at = random.choice(date_range)
            
            Feedback.objects.create(
                user=user,
                rating=suggestion["rating"],
                comment=suggestion["comment"],
                created_at=created_at
            )
        
        # Create complaints (both as feedback and as complaint objects)
        for i, complaint_feedback in enumerate(complaints_feedback):
            user = random.choice(users)
            created_at = random.choice(date_range)
            complaint_data = complaints_data[i]
            
            # Create as feedback
            Feedback.objects.create(
                user=user,
                rating=complaint_feedback["rating"],
                comment=complaint_feedback["comment"],
                created_at=created_at
            )
            
            # Create as complaint
            Complaint.objects.create(
                user=user,
                title=complaint_data["title"],
                description=complaint_data["description"],
                urgency=complaint_data["urgency"],
                status=random.choice(["open", "closed"]),
                submitted_at=created_at
            )
    
    print(f"Created {len(reviews)} reviews")
    print(f"Created {len(suggestions)} suggestions")
    print(f"Created {len(complaints_data)} complaints")
    print("Sample feedback data creation complete!")

if __name__ == "__main__":
    create_sample_feedback_data()
    print("Done!") 