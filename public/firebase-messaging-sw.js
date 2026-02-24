importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCNYIamdrBj6YYriiXZYUpcEhNFGWJsYl0",
  authDomain: "notify-5d896.firebaseapp.com",
  projectId: "notify-5d896",
  messagingSenderId: "237529461463",
  appId: "1:237529461463:web:edbb75e8464b9826043692",
});

const messaging = firebase.messaging();

// 🔥 THIS PART IS THE KEY
messaging.onBackgroundMessage(function (payload) {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";

  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon || "/og-image.png",
    image: payload.notification?.image,
    data: {
      link: payload.fcmOptions?.link || "/",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const link = event.notification.data?.link || "/";

  event.waitUntil(
    clients.openWindow(link)
  );
});