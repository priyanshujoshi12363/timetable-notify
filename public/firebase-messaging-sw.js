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

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || "Class Compass", {
    body: data.body || "",
    icon: "/icon.png",
    badge: "/icon.png",
    data: { link: "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
