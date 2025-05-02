import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metro_project.settings')
django.setup()

from metro.models import User, Journey, Payment, Feedback, Complaint
from django.db.models import Sum, Count

def check_database():
    """
    Check the database contents and print summary information.
    """
    print("\n=== Database Summary ===\n")
    
    # Count users
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for user in users:
        print(f"User: {user.name}, Email: {user.email}, IsAdmin: {user.is_admin}")
    
    print("\n=== Journey Statistics ===\n")
    
    # Count journeys
    journeys = Journey.objects.all()
    print(f"Total journeys: {journeys.count()}")
    
    # Stats per user
    print("\nJourneys per user:")
    for user in users:
        user_journeys = Journey.objects.filter(user=user)
        total_spent = user_journeys.aggregate(total=Sum('fare'))['total'] or 0
        print(f"  - {user.name}: {user_journeys.count()} journeys, total spent: ৳{total_spent}")
    
    print("\n=== Payment Statistics ===\n")
    
    # Count payments
    payments = Payment.objects.all()
    print(f"Total payments: {payments.count()}")
    
    # Count by payment method
    payment_methods = Payment.objects.values('method').annotate(count=Count('id')).order_by('-count')
    print("\nPayment methods:")
    for method in payment_methods:
        print(f"  - {method['method']}: {method['count']} payments")
    
    print("\n=== Feedback Statistics ===\n")
    
    # Count feedback
    feedback = Feedback.objects.all()
    print(f"Total feedback items: {feedback.count()}")
    
    # Count by type (reviews, suggestions, complaints)
    suggestions = feedback.filter(comment__startswith="[SUGGESTION]").count()
    complaints_fb = feedback.filter(comment__startswith="[COMPLAINT]").count()
    regular = feedback.count() - suggestions - complaints_fb
    
    print("\nFeedback by type:")
    print(f"  - Regular reviews: {regular}")
    print(f"  - Suggestions: {suggestions}")
    print(f"  - Complaints as feedback: {complaints_fb}")
    
    print("\n=== Complaint Statistics ===\n")
    
    # Count complaints
    complaints = Complaint.objects.all()
    print(f"Total complaints: {complaints.count()}")
    
    # Count by status
    open_complaints = complaints.filter(status='open').count()
    closed_complaints = complaints.filter(status='closed').count()
    
    print("\nComplaints by status:")
    print(f"  - Open: {open_complaints}")
    print(f"  - Closed: {closed_complaints}")
    
    # Count by urgency
    urgency_counts = complaints.values('urgency').annotate(count=Count('id')).order_by('-count')
    print("\nComplaints by urgency:")
    for urgency in urgency_counts:
        print(f"  - {urgency['urgency'].capitalize()}: {urgency['count']}")

if __name__ == "__main__":
    check_database()
    print("\nDone!") 