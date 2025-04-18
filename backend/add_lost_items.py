import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metro_project.settings')
django.setup()

from metro.models import User, LostItem
from django.core.files.base import ContentFile
import base64

def add_sample_lost_items():
    # Get admin user for posting items
    try:
        admin_user = User.objects.get(email="admin@example.com")
    except User.DoesNotExist:
        print("Admin user not found, using the first available user")
        admin_user = User.objects.first()
        
    if not admin_user:
        print("No users found in the database. Please create a user first.")
        return
    
    # Sample lost items data with external image URLs
    sample_items = [
        {
            "title": "Black Leather Wallet",
            "description": "Leather wallet with ID card and bank cards found on a seat",
            "location": "Uttara North Station",
            "status": "unclaimed",
            "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=400"
        },
        {
            "title": "Blue Smartphone",
            "description": "Samsung Galaxy S22 with cracked screen found on the platform",
            "location": "Agargaon Station",
            "status": "unclaimed",
            "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400"
        },
        {
            "title": "Red Backpack",
            "description": "Adidas backpack with textbooks inside left in the waiting area",
            "location": "Motijheel Station", 
            "status": "unclaimed",
            "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400"
        },
        {
            "title": "Prescription Glasses",
            "description": "Black frame glasses in brown case found in train car #5",
            "location": "Farmgate Station",
            "status": "unclaimed",
            "image_url": "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=400"
        },
    ]
    
    items_created = 0
    
    for item_data in sample_items:
        # Check if this item already exists
        if LostItem.objects.filter(title=item_data["title"], location=item_data["location"]).exists():
            existing_item = LostItem.objects.get(title=item_data["title"], location=item_data["location"])
            print(f"Item '{item_data['title']}' already exists, updating image URL")
            
            # Skip if it already has an image
            if existing_item.image_url:
                print(f"Item already has an image, skipping")
                continue
                
            # For simplicity, we'll just update by setting the external URL string
            existing_item.image_url = item_data["image_url"]
            existing_item.save()
            print(f"Updated image URL for: {existing_item.title}")
            items_created += 1
            continue
            
        # Create item
        lost_item = LostItem.objects.create(
            title=item_data["title"],
            description=item_data["description"],
            location=item_data["location"],
            status=item_data["status"],
            posted_by=admin_user
        )
        
        # Set the image URL
        lost_item.image_url = item_data["image_url"]
        lost_item.save()
        
        items_created += 1
        print(f"Created lost item: {lost_item.title}")
    
    print(f"\nUpdated {items_created} lost items with image URLs")

if __name__ == "__main__":
    add_sample_lost_items() 