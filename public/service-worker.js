self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  // Cache files here
});

self.addEventListener('fetch', event => {
  console.log('Fetching:', event.request.url);
  // Handle requests
});
