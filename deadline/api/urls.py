from django.urls import path
from deadline.api.views import (
    UserRegisterView, UserListCreateView, UserDetailView, current_user,
    ProfileListCreateView, ProfileDetailView,
    TaskListCreateView, TaskDetailView,
    TaskPendingView, TaskCompletedView,
    mark_task_complete, mark_task_incomplete
)

urlpatterns = [
    # Authentication endpoints
    path('register/', UserRegisterView.as_view(), name='register'),
    
    # User endpoints
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/me/', current_user, name='current-user'),
    
    # Profile endpoints
    path('profiles/', ProfileListCreateView.as_view(), name='profile-list'),
    path('profiles/<int:pk>/', ProfileDetailView.as_view(), name='profile-detail'),
    
    # Task endpoints - specific routes first
    path('tasks/pending/', TaskPendingView.as_view(), name='task-pending'),
    path('tasks/completed/', TaskCompletedView.as_view(), name='task-completed'),
    path('tasks/<int:pk>/mark-complete/', mark_task_complete, name='mark-complete'),
    path('tasks/<int:pk>/mark-incomplete/', mark_task_incomplete, name='mark-incomplete'),
    # Generic task routes last
    path('tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
]
