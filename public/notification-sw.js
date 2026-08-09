// Imported into the generated Workbox service worker (see vite.config.ts).
// Makes tapping a rest-timer notification focus the running app, or open it if
// it isn't already in a tab/window.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(self.registration.scope);
    })()
  );
});
