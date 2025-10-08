// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyCmBjSFatJ6a8VIkH5grtafdCJD6qknGxk",
  authDomain: "ariba-d40cc.firebaseapp.com",
  projectId: "ariba-d40cc",
  storageBucket: "ariba-d40cc.firebasestorage.app",
  messagingSenderId: "171583954238",
  appId: "1:171583954238:web:2923d72e2d622d9129a06f",
  measurementId: "G-4WJCBYD6TR",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/Logo.png", // You can replace this with your app icon
    badge: "/Logo.png",
    tag: "notification-tag", // Prevents duplicate notifications
    requireInteraction: true, // Keeps notification visible until user interacts
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'view') {
    // Handle view action - could open specific page
    event.waitUntil(
      clients.openWindow('/') // Adjust URL as needed
    );
  } else if (event.action === 'dismiss') {
    // Handle dismiss action
    console.log('Notification dismissed');
  } else {
    // Handle default click (notification body click)
    event.waitUntil(
      clients.openWindow('/') // Adjust URL as needed
    );
  }
});
