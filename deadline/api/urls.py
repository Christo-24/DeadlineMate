from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from deadline.api.views import (
    UserRegisterView, UserListCreateView, UserDetailView, current_user,
    ProfileListCreateView, ProfileDetailView,
    TaskListCreateView, TaskDetailView,
    TaskPendingView, TaskCompletedView,
    mark_task_complete, mark_task_incomplete
)

urlpatterns = [
    # Authentication endpoints
    path('register/', csrf_exempt(UserRegisterView.as_view()), name='register'),
    
    # User endpoints
    path('users/', csrf_exempt(UserListCreateView.as_view()), name='user-list'),
    path('users/<int:pk>/', csrf_exempt(UserDetailView.as_view()), name='user-detail'),
    path('users/me/', csrf_exempt(current_user), name='current-user'),
    
    # Profile endpoints
    path('profiles/', csrf_exempt(ProfileListCreateView.as_view()), name='profile-list'),
    path('profiles/<int:pk>/', csrf_exempt(ProfileDetailView.as_view()), name='profile-detail'),
    
    # Task endpoints
    path('tasks/', csrf_exempt(TaskListCreateView.as_view()), name='task-list'),
    path('tasks/<int:pk>/', csrf_exempt(TaskDetailView.as_view()), name='task-detail'),
    path('tasks/pending/', csrf_exempt(TaskPendingView.as_view()), name='task-pending'),
    path('tasks/completed/', csrf_exempt(TaskCompletedView.as_view()), name='task-completed'),
    path('tasks/<int:pk>/mark-complete/', csrf_exempt(mark_task_complete), name='mark-complete'),
    path('tasks/<int:pk>/mark-incomplete/', csrf_exempt(mark_task_incomplete), name='mark-incomplete'),
]
