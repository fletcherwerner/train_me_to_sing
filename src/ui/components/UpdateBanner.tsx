import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../../app/registerServiceWorker';
import './UpdateBanner.css';

export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    registerServiceWorker(() => setReady(true));
  }, []);
  if (!ready) return null;
  return (
    <div className="update-banner" role="status" data-testid="update-banner">
      <span>Update ready — reload</span>
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
