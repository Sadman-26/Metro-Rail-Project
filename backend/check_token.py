import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metro_project.settings')
django.setup()

from rest_framework.authtoken.models import Token
from metro.models import User

def check_token(token_key):
    """Check if a token is valid and return user information"""
    print(f"Checking token: {token_key}")
    
    try:
        token = Token.objects.get(key=token_key)
        user = token.user
        print(f"Token is valid!")
        print(f"User: {user.email}")
        print(f"User ID: {user.id}")
        print(f"Is admin: {user.is_admin}")
        print(f"Is staff: {user.is_staff}")
        print(f"Is superuser: {user.is_superuser}")
        return True
    except Token.DoesNotExist:
        print(f"Error: Token does not exist")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def list_active_tokens():
    """List all active tokens in the system"""
    print("\nActive tokens in system:")
    print("-" * 60)
    print(f"{'User Email':<30} {'Token Key':<40}")
    print("-" * 60)
    
    for token in Token.objects.all().order_by('user__email'):
        print(f"{token.user.email:<30} {token.key}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_token.py <token_key> or 'list' to see all tokens")
        list_active_tokens()
    elif sys.argv[1].lower() == 'list':
        list_active_tokens()
    else:
        token_key = sys.argv[1]
        check_token(token_key) 