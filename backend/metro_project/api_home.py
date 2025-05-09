from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def api_home(request):
    return JsonResponse({
        'message': 'Welcome to Metro Track Dhaka Rail API',
        'endpoints': {
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'user': '/api/auth/user/',
            }
        }
    })
