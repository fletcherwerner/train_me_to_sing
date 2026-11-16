import { SAVE_ERROR_TEXT, useProfileStatus } from '../../storage/profiles';
import { useAppStore } from '../../storage/store';

export const STORAGE_FAILED_TEXT =
  "Couldn't save on this device. Your progress will be lost when you close the app. Export it from Settings.";
import './ProfileNotices.css';

/** Small non-blocking messages about profiles: a missing profile file, or a failed save. */
export function ProfileNotices() {
  const notice = useProfileStatus((s) => s.notice);
  const saveError = useProfileStatus((s) => s.saveError);
  const storageFailed = useAppStore((s) => s.saveFailed);
  if (!notice && !saveError && !storageFailed) return null;
  return (
    <div className="profile-notices" role="status" data-testid="profile-notices">
      {notice ? (
        <p className="profile-notices__item" data-testid="profile-notice">
          <span>{notice}</span>
          <button type="button" className="btn" onClick={() => useProfileStatus.setState({ notice: null })}>
            OK
          </button>
        </p>
      ) : null}
      {storageFailed ? (
        <p className="profile-notices__item" data-testid="storage-save-error">
          <span>{STORAGE_FAILED_TEXT}</span>
        </p>
      ) : null}
      {saveError ? (
        <p className="profile-notices__item" data-testid="profile-save-error">
          <span>{SAVE_ERROR_TEXT}</span>
        </p>
      ) : null}
    </div>
  );
}
