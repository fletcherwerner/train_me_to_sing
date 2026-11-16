import { SAVE_ERROR_TEXT, useProfileStatus } from '../../storage/profiles';
import './ProfileNotices.css';

/** Small non-blocking messages about profiles: a missing profile file, or a failed save. */
export function ProfileNotices() {
  const notice = useProfileStatus((s) => s.notice);
  const saveError = useProfileStatus((s) => s.saveError);
  if (!notice && !saveError) return null;
  return (
    <div className="profile-notices" role="status" data-testid="profile-notices">
      {notice ? (
        <p className="profile-notices__item" data-testid="profile-notice">
          <span>{notice}</span>
          <button type="button" onClick={() => useProfileStatus.setState({ notice: null })}>
            OK
          </button>
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
