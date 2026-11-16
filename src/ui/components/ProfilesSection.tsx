import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listProfiles, profileSync, useProfileStatus } from '../../storage/profiles';
import type { ProfileSummary } from '../../storage/profileFormat';
import './ProfilesSection.css';

/** Settings → Profiles. */
export function ProfilesSection() {
  const available = useProfileStatus((s) => s.available);
  const activeId = useProfileStatus((s) => s.activeId);
  const activeName = useProfileStatus((s) => s.activeName);
  const navigate = useNavigate();
  const { search } = useLocation();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'fresh' | 'copy'>('fresh');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    listProfiles()
      .then((l) => !cancelled && setProfiles(l))
      .catch(() => !cancelled && setProfiles([]));
    return () => {
      cancelled = true;
    };
  }, [available, activeId]);

  const go = (r: { ok: true; hasRange: boolean } | { ok: false; error: string }) => {
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setName('');
    navigate({ pathname: r.hasRange ? '/' : '/range', search });
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    go(await profileSync().create(name, mode));
    setBusy(false);
  };

  const onLoad = async (id: string) => {
    setBusy(true);
    go(await profileSync().load(id));
    setBusy(false);
  };

  return (
    <section className="profiles" aria-label="Profiles" data-testid="profiles-section">
      <h2>Profiles</h2>
      {available === false ? (
        <p data-testid="profiles-unavailable">Profiles work when the app runs locally with <code>npm run dev</code>.</p>
      ) : available === null ? (
        <p>Checking for profiles…</p>
      ) : (
        <>
          <p data-testid="profile-active">
            Active profile: <strong>{activeName ?? 'No profile'}</strong>
          </p>

          <form onSubmit={onCreate} className="profiles__new">
            <h3>New profile</h3>
            <label>
              Name
              <input
                type="text"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                data-testid="profile-name"
              />
            </label>
            <fieldset>
              <legend>Start with</legend>
              <label className="profiles__choice">
                <input type="radio" name="profile-mode" checked={mode === 'fresh'} onChange={() => setMode('fresh')} />
                Start fresh
              </label>
              <label className="profiles__choice">
                <input type="radio" name="profile-mode" checked={mode === 'copy'} onChange={() => setMode('copy')} />
                Copy current range and progress
              </label>
            </fieldset>
            <button type="submit" disabled={busy} data-testid="profile-create">
              Create profile
            </button>
          </form>
          {error ? (
            <p className="tuner-error" role="alert" data-testid="profile-error">
              {error}
            </p>
          ) : null}

          <h3>Load profile</h3>
          {profiles.length === 0 ? (
            <p>No saved profiles yet.</p>
          ) : (
            <ul className="profiles__list">
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="profiles__row"
                    disabled={busy}
                    onClick={() => onLoad(p.id)}
                    data-testid={`profile-${p.id}`}
                    aria-current={p.id === activeId ? 'true' : undefined}
                  >
                    <span className="profiles__name">
                      {p.name}
                      {p.id === activeId ? ' (active)' : ''}
                    </span>
                    <span className="profiles__meta">
                      {p.range ? `Range ${p.range.low}–${p.range.high}` : 'No range'} · {p.passedCount}{' '}
                      {p.passedCount === 1 ? 'lesson' : 'lessons'} passed · saved{' '}
                      {new Date(p.updatedAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
