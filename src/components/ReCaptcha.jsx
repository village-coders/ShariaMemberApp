import React, { useEffect, useRef, memo } from 'react';

const DEFAULT_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LezIiIuAAAAAD9fjVwvFUVLe7UsKmJq3zjL1mqF';

function ReCaptchaComponent({
  siteKey = DEFAULT_SITE_KEY,
  onChange,
  onExpired,
  onError,
  widgetRef
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const renderedRef = useRef(false);

  // Keep latest callbacks in refs so parent re-renders never destroy/re-render the reCAPTCHA iframe
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.grecaptcha || renderedRef.current) {
        return;
      }

      window.grecaptcha.ready(() => {
        if (!isMounted || !containerRef.current || renderedRef.current) return;
        try {
          if (containerRef.current.hasChildNodes()) {
            return;
          }

          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'light',
            callback: (token) => {
              onChangeRef.current?.(token);
            },
            'expired-callback': () => {
              onExpiredRef.current?.();
            },
            'error-callback': () => {
              onErrorRef.current?.();
            }
          });

          widgetIdRef.current = id;
          renderedRef.current = true;

          if (widgetRef) {
            widgetRef.current = {
              reset: () => {
                if (window.grecaptcha && widgetIdRef.current !== null) {
                  try {
                    window.grecaptcha.reset(widgetIdRef.current);
                  } catch (e) {
                    console.warn('[reCAPTCHA] reset notice:', e);
                  }
                }
              },
              getResponse: () => {
                if (window.grecaptcha && widgetIdRef.current !== null) {
                  try {
                    return window.grecaptcha.getResponse(widgetIdRef.current);
                  } catch (e) {
                    return '';
                  }
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
    };
  }, [siteKey, widgetRef]);

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

export default memo(ReCaptchaComponent);
