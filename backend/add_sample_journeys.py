import os
import django
import random
from datetime import datetime, timedelta, date
import sys
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metro_project.settings')
django.setup()

from metro.models import User, Journey, Payment
from django.db import transaction

def create_sample_journey_data():
    """
    Create sample journey and payment data for users.
    """
    print("Creating sample journey and payment data...")
    
    # Get all existing users
    users = User.objects.all()
    if not users.exists():
        print("No users found. Please run add_sample_feedback.py first to create users.")
        return
    else:
        print(f"Found {users.count()} users.")
    
    # Define metro routes
    routes = [
        "Uttara North to Motijheel",
        "Uttara North to Agargaon",
        "Agargaon to Motijheel",
        "Farmgate to Uttara South",
        "Mirpur to Shahbag",
        "Motijheel to Uttara South",
        "Uttara Center to Shahbag",
        "Agargaon to Mirpur",
        "Dhanmondi to Motijheel"
    ]
    
    # Define fare ranges
    fare_ranges = {
        "short": (Decimal('20.00'), Decimal('50.00')),
        "medium": (Decimal('50.00'), Decimal('100.00')),
        "long": (Decimal('100.00'), Decimal('150.00'))
    }
    
    # Define payment methods
    payment_methods = ['bKash', 'Nagad', 'Rocket', 'Card']
    
    # Generate dates for the last 90 days
    today = date.today()
    date_range = [today - timedelta(days=i) for i in range(90)]
    
    # Create journeys per user
    all_journeys = []
    all_payments = []
    
    with transaction.atomic():
        # First create payments
        for user in users:
            # Generate between 5 and 30 journeys per user
            num_journeys = random.randint(5, 30)
            
            for _ in range(num_journeys):
                route = random.choice(routes)
                journey_date = random.choice(date_range)
                
                # Determine fare based on route length
                if "to" in route:
                    stations = route.split("to")
                    if len(stations) == 2:
                        # Roughly estimate distance by station names
                        if "Uttara" in route and "Motijheel" in route:
                            fare_type = "long"
                        elif "Agargaon" in route or "Farmgate" in route:
                            fare_type = "medium"
                        else:
                            fare_type = "short"
                    else:
                        fare_type = random.choice(["short", "medium", "long"])
                else:
                    fare_type = random.choice(["short", "medium", "long"])
                
                min_fare, max_fare = fare_ranges[fare_type]
                fare = Decimal(str(random.uniform(float(min_fare), float(max_fare)))).quantize(Decimal('0.01'))
                
                # Create payment
                payment_method = random.choice(payment_methods)
                reference = f"{payment_method.lower()}-{random.randint(100000, 999999)}"
                
                payment = Payment.objects.create(
                    user=user,
                    method=payment_method,
                    reference=reference,
                    amount=fare
                )
                
                # Create journey
                journey = Journey.objects.create(
                    user=user,
                    route=route,
                    date=journey_date,
                    fare=fare,
                    payment=payment
                )
                
                all_journeys.append(journey)
                all_payments.append(payment)
    
    print(f"Created {len(all_journeys)} journeys")
    print(f"Created {len(all_payments)} payments")
    
    # Print summary per user
    for user in users:
        user_journeys = Journey.objects.filter(user=user)
        total_spent = sum(journey.fare for journey in user_journeys)
        print(f"User {user.name}: {user_journeys.count()} journeys, total spent: ৳{total_spent}")
    
    print("Sample journey data creation complete!")

if __name__ == "__main__":
    create_sample_journey_data()
    print("Done!") 