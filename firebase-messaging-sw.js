importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDrVVzXE_hd-5HTC1CZoVOU7zGNx7TDQQ",
  authDomain: "net-732c9.firebaseapp.com",
  projectId: "net-732c9",
  storageBucket: "net-732c9.firebasestorage.app",
  messagingSenderId: "928563175887",
  appId: "1:928563175887:web:57a9102491dcb8a96572ba"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'طلب جديد';
  const notificationOptions = {
    body: payload.notification.body || 'لديك طلب جديد في Net',
    icon: './icon-192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
