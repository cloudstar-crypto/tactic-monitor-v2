import { useEffect, useState, useCallback } from 'react';

// LocalStorage key used to remember that the user dismissed the prompt.
// Version the key so we can resurrect the prompt if we change copy later.
const DISMISS_KEY = 'tm:install-dismissed:v1';

// Detect whether the app is already running as an installed PWA.
function isStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS Safari exposes navigator.standalone; other browsers use display-mode.
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Detect iOS Safari (excluding Chrome/Firefox on iOS which also say "iPhone"
// but can't be installed via Share sheet the same way).
function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function InstallPrompt() {
  // Saved beforeinstallprompt event (Android / Chromium). Non-null means
  // we can trigger a native install dialog.
  const [deferred, setDeferred] = useState(null);
  // Whether this is an iOS Safari session (needs manual instructions).
  const [iosMode, setIosMode] = useState(false);
  // User-controlled visibility.
  const [visible, setVisible] = useState(false);
  // iOS instructions modal open state.
  const [iosModal, setIosModal] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // Already installed, never show.
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    // Android / Chromium path.
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS Safari path — no event, detect UA and show manual prompt.
    if (isIosSafari()) {
      setIosMode(true);
      setVisible(true);
    }

    // If the user installs via another route, hide the prompt immediately.
    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (iosMode) {
      setIosModal(true);
      return;
    }
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome !== 'accepted') {
      // Respect the "not now" choice for this session.
      localStorage.setItem(DISMISS_KEY, '1');
    }
  }, [deferred, iosMode]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="ip-bar" role="dialog" aria-label="Install Tactic Monitor">
        <div className="ip-bar-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 40 40">
            <polygon points="20,3 36,11 36,29 20,37 4,29 4,11" fill="none" stroke="#8fae5f" strokeWidth="1.5" />
            <polygon points="20,9 30,14 30,26 20,31 10,26 10,14" fill="#2d3817" stroke="#b5d477" strokeWidth="1" />
            <circle cx="20" cy="20" r="3" fill="#b5d477" />
          </svg>
        </div>
        <div className="ip-bar-text">
          <div className="ip-bar-title">DEPLOY TO DEVICE</div>
          <div className="ip-bar-sub">
            {iosMode ? 'Tap for iOS install steps' : 'Install Tactic Monitor as an app'}
          </div>
        </div>
        <button type="button" className="ip-bar-cta" onClick={handleInstall}>
          INSTALL
        </button>
        <button
          type="button"
          className="ip-bar-close"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {iosModal && (
        <div className="ip-modal-backdrop" onClick={() => setIosModal(false)}>
          <div className="ip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ip-modal-title">ADD TO HOME SCREEN</div>
            <ol className="ip-modal-steps">
              <li>
                Tap the <strong>Share</strong> icon in Safari's bottom bar
                <span className="ip-share-icon" aria-hidden>⎋</span>
              </li>
              <li>
                Scroll and choose <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right corner
              </li>
            </ol>
            <button
              type="button"
              className="ip-modal-close"
              onClick={() => setIosModal(false)}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallPrompt;
