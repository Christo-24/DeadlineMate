// Push Notification and Background Sync utilities

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY || undefined
      });
      
      console.log('Subscribed to push notifications:', subscription);
      
      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);
    }
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      
      // Notify backend
      await removeSubscriptionFromBackend(subscription);
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
  }
}

/**
 * Send subscription to backend
 */
async function sendSubscriptionToBackend(subscription) {
  try {
    const response = await fetch('/api/notifications/subscribe/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send subscription to backend');
    }
    
    console.log('Subscription sent to backend');
  } catch (error) {
    console.error('Error sending subscription to backend:', error);
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(subscription) {
  try {
    const response = await fetch('/api/notifications/unsubscribe/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove subscription from backend');
    }
    
    console.log('Subscription removed from backend');
  } catch (error) {
    console.error('Error removing subscription from backend:', error);
  }
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag = 'sync-tasks') {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

/**
 * Show local notification
 */
export async function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'deadlinemate',
      ...options
    });
  }
}

/**
 * Make app installable check
 */
export function canInstallApp() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get device info for deployment configuration
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    onLine: navigator.onLine,
    webWorkerSupport: typeof Worker !== 'undefined',
    pushSupport: 'PushManager' in window,
    syncSupport: 'SyncManager' in window,
    notificationSupport: 'Notification' in window,
    serviceWorkerSupport: 'serviceWorker' in navigator
  };
}
