// Unregister ALL service workers to fix CORS issues
// This runs immediately when the page loads

(function() {
  if ('serviceWorker' in navigator) {
    // Unregister all service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length > 0) {
        console.log('🔧 Unregistering', registrations.length, 'service worker(s)...');
        for(let registration of registrations) {
          registration.unregister().then(function(success) {
            if (success) {
              console.log('✅ Service Worker unregistered successfully');
            }
          });
        }
        
        // Clear all caches too
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              console.log('🗑️ Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }).then(function() {
          console.log('✅ All caches cleared');
        });
      } else {
        console.log('✅ No service workers to unregister');
      }
    }).catch(function(error) {
      console.error('❌ Error unregistering service workers:', error);
    });
  }
})();
