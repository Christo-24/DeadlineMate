from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.conf import settings
import json

from deadline.models import Profile, Task, PushSubscription
from deadline.api.serializer import UserSerializer, ProfileSerializer, TaskSerializer, PushSubscriptionSerializer


class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user with password passed directly to create_user
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data.get('email', ''),
            password=request.data.get('password', ''),
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', '')
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Create is handled by UserRegisterView"""
        return Response({"detail": "Use /api/register/ endpoint"}, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class ProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return profiles for current user"""
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create profile for current user"""
        serializer.save(user=self.request.user)


class ProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return profiles for current user"""
        return Profile.objects.filter(user=self.request.user)


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return tasks for current user"""
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create task for current user"""
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return tasks for current user"""
        return Task.objects.filter(user=self.request.user)


class TaskPendingView(generics.ListAPIView):
    """Get pending (incomplete) tasks"""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user, completed=False)


class TaskCompletedView(generics.ListAPIView):
    """Get completed tasks"""
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user, completed=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_task_complete(request, pk):
    """Mark a task as complete"""
    try:
        task = Task.objects.get(pk=pk, user=request.user)
        task.completed = True
        task.save()
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    except Task.DoesNotExist:
        return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_task_incomplete(request, pk):
    """Mark a task as incomplete"""
    try:
        task = Task.objects.get(pk=pk, user=request.user)
        task.completed = False
        task.save()
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    except Task.DoesNotExist:
        return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


# Push Notification Endpoints

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_push(request):
    """Subscribe user to push notifications"""
    try:
        data = request.data
        
        # Extract subscription details
        endpoint = data.get('endpoint')
        subscription_keys = data.get('keys', {})
        auth = subscription_keys.get('auth')
        p256dh = subscription_keys.get('p256dh')
        
        if not all([endpoint, auth, p256dh]):
            return Response(
                {"detail": "Missing subscription data"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update subscription
        subscription, created = PushSubscription.objects.get_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                'auth': auth,
                'p256dh': p256dh,
                'is_active': True
            }
        )
        
        if not created:
            subscription.auth = auth
            subscription.p256dh = p256dh
            subscription.is_active = True
            subscription.save()
        
        serializer = PushSubscriptionSerializer(subscription)
        return Response(
            {"status": "subscribed", "subscription": serializer.data},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe_push(request):
    """Unsubscribe user from push notifications"""
    try:
        endpoint = request.data.get('endpoint')
        
        if not endpoint:
            return Response(
                {"detail": "Endpoint required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription = PushSubscription.objects.get(
            user=request.user,
            endpoint=endpoint
        )
        subscription.is_active = False
        subscription.save()
        
        return Response({"status": "unsubscribed"})
    except PushSubscription.DoesNotExist:
        return Response(
            {"detail": "Subscription not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_push_subscriptions(request):
    """Get all active push subscriptions for user"""
    subscriptions = PushSubscription.objects.filter(
        user=request.user,
        is_active=True
    )
    serializer = PushSubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    """Send notification to all user's subscriptions"""
    try:
        from webpush import webpush, WebPushException
        
        title = request.data.get('title', 'DeadlineMate')
        body = request.data.get('body', '')
        task_id = request.data.get('task_id')
        
        if not body:
            return Response(
                {"detail": "Body required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscriptions = PushSubscription.objects.filter(
            user=request.user,
            is_active=True
        )
        
        sent_count = 0
        failed_count = 0
        
        for subscription in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "auth": subscription.auth,
                            "p256dh": subscription.p256dh
                        }
                    },
                    data=json.dumps({
                        "title": title,
                        "body": body,
                        "tag": f"task-{task_id}" if task_id else "deadlinemate",
                        "url": "/dashboard" if task_id else "/"
                    }),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": f"mailto:{request.user.email}",
                        "exp": 12 * 60 * 60
                    }
                )
                sent_count += 1
            except WebPushException as e:
                print(f"Failed to send push: {e}")
                failed_count += 1
                if 'expired' in str(e) or '410' in str(e):
                    subscription.is_active = False
                    subscription.save()
        
        return Response({
            "status": "sent",
            "sent": sent_count,
            "failed": failed_count
        })
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
