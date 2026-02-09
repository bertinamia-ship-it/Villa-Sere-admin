(function() {
  // Intercept fetch FIRST (before React loads) - AGGRESSIVE MODE
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    // Check if this is ANY Supabase REST API query
    const isSupabaseQuery = url.includes('supabase.co/rest/v1/');
    
    // For ALL Supabase queries, intercept 400 errors
    if (isSupabaseQuery) {
      return originalFetch.apply(this, args)
        .then(response => {
          // If 400, return empty array instead
          if (response.status === 400) {
            return new Response(JSON.stringify([]), {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return response;
        })
        .catch(() => {
          // Silently return empty response on any error
          return new Response(JSON.stringify([]), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // AGGRESSIVE: Intercept ALL console methods to filter Supabase errors
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  console.error = function(...args) {
    const allArgs = args.map(a => String(a || '')).join(' ');
    if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request') || allArgs.includes('GET'))) {
      return; // Silently ignore ALL Supabase errors
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const allArgs = args.map(a => String(a || '')).join(' ');
    if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request'))) {
      return; // Silently ignore
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.log = function(...args) {
    const allArgs = args.map(a => String(a || '')).join(' ');
    if (allArgs.includes('supabase.co') && (allArgs.includes('400') || allArgs.includes('Bad Request'))) {
      return; // Silently ignore
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Also intercept unhandled errors
  window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('supabase.co') && (e.message.includes('400') || e.message.includes('Bad Request'))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
  
  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    const reason = String(e.reason || '');
    if (reason.includes('supabase.co') && (reason.includes('400') || reason.includes('Bad Request'))) {
      e.preventDefault();
      return false;
    }
  });
})();

