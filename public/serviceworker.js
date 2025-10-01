self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || "Web Push";
  const options = {
    body: data.body || "新しい通知があります",
    icon: "/favicon.ico",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (!event.notification.data) {
    console.error(
      "Click on WebPush with empty data, where url should be. Notification: ",
      event.notification
    );
    return;
  }
  if (!event.notification.data.url) {
    console.error(
      "Click on WebPush without url. Notification: ",
      event.notification
    );
    return;
  }

  clients.openWindow(event.notification.data.url).then(() => {
    // You can send fetch request to your analytics API fact that push was clicked
    // fetch('https://your_backend_server.com/track_click?message_id=' + pushData.data.message_id);
  });
});
