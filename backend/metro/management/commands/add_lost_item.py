from django.core.management.base import BaseCommand
from metro.models import LostItem, User
import argparse

class Command(BaseCommand):
    help = 'Add a new lost item directly to the database'

    def add_arguments(self, parser):
        parser.add_argument('--title', required=True, help='Title of the lost item')
        parser.add_argument('--description', required=True, help='Description of the lost item')
        parser.add_argument('--location', required=True, help='Location where the item was found')
        parser.add_argument('--status', default='unclaimed', choices=['claimed', 'unclaimed'], help='Status of the item')
        parser.add_argument('--image_url', default=None, help='URL to image of the lost item')
        parser.add_argument('--admin_email', required=True, help='Email of admin user to associate with this item')

    def handle(self, *args, **options):
        try:
            # Find the admin user
            try:
                admin = User.objects.get(email=options['admin_email'])
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"No user found with email: {options['admin_email']}"))
                return
            
            # Create the lost item
            lost_item = LostItem.objects.create(
                title=options['title'],
                description=options['description'],
                location=options['location'],
                status=options['status'],
                image_url=options['image_url'],
                posted_by=admin
            )
            
            self.stdout.write(self.style.SUCCESS(f"Successfully added lost item: {lost_item.title}"))
            self.stdout.write(f"ID: {lost_item.id}")
            self.stdout.write(f"Title: {lost_item.title}")
            self.stdout.write(f"Description: {lost_item.description}")
            self.stdout.write(f"Location: {lost_item.location}")
            self.stdout.write(f"Status: {lost_item.status}")
            self.stdout.write(f"Posted by: {lost_item.posted_by.email}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error adding lost item: {str(e)}")) 