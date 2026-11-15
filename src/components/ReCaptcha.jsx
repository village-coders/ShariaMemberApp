import React, { useEffect, useRef } from 'react';

const DEFAULT_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LezIiIuAAAAAD9fjVwvFUVLe7UsKmJq3zjL1mqF';

export default function ReCaptcha({
  siteKey = DEFAULT_SITE_KEY,
  onChange,
  onExpired,
  onError,
  widgetRef
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.grecaptcha || widgetIdRef.current !== null) {
        return;
      }

      window.grecaptcha.ready(() => {
        if (!isMounted || !containerRef.current || widgetIdRef.current !== null) return;
        try {
          // Clear any stale nodes
          containerRef.current.innerHTML = '';
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'light',
            callback: (token) => {
              if (isMounted && onChange) onChange(token);
            },
            'expired-callback': () => {
              if (isMounted && onExpired) onExpired();
            },
            'error-callback': () => {
              if (isMounted && onError) onError();
            }
          });
          widgetIdRef.current = id;
          if (widgetRef) {
            widgetRef.current = {
              reset: () => {
                if (window.grecaptcha && widgetIdRef.current !== null) {
                  window.grecaptcha.reset(widgetIdRef.current);
                }
              },
              getResponse: () => {
                if (window.grecaptcha && widgetIdRef.current !== null) {
                  return window.grecaptcha.getResponse(widgetIdRef.current);
                }
                return '';
              }
            };
          }
        } catch (err) {
          console.warn('[reCAPTCHA] render notice:', err);
        }
      });
    };

    if (window.grecaptcha && window.grecaptcha.ready) {
      renderWidget();
    } else {
      const scriptId = 'google-recaptcha-v2-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const interval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
      widgetIdRef.current = null;
    };
  }, [siteKey, onChange, onExpired, onError, widgetRef]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '16px 0 8px 0',
        minHeight: '78px',
        overflowX: 'auto',
        maxWidth: '100%'
      }}
    >
      <div ref={containerRef} />
    </div>
  );
}

