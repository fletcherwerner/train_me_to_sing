import './CentsMeter.css';

export interface CentsMeterProps {
  cents: number | null;
  toleranceCents: number;
}

export function CentsMeter({ cents, toleranceCents }: CentsMeterProps) {
  // Clamp display to ±100
  const displayCents = cents == null ? null : Math.max(-100, Math.min(100, cents));

  // Needle position: 0 = center, -100 = left edge, +100 = right edge
  const needlePct = displayCents == null ? 50 : 50 + (displayCents / 100) * 50;

  // Inside tolerance zone?
  const inZone = displayCents != null && Math.abs(displayCents) <= toleranceCents;

  // Text display
  let text: string;
  if (cents == null) {
    text = '—';
  } else if (cents < 0) {
    text = `♭ ${Math.round(Math.abs(cents))}`;
  } else {
    text = `♯ ${Math.round(cents)}`;
  }

  return (
    <div className="cents-meter" role="meter" aria-label="Cents deviation">
      <div className="cents-meter__bar">
        <div
          className="cents-meter__zone"
          style={{
            left: `${50 - (toleranceCents / 100) * 50}%`,
            width: `${(toleranceCents / 100) * 100}%`,
          }}
        />
        <div
          className={`cents-meter__needle ${inZone ? 'cents-meter__needle--in-zone' : 'cents-meter__needle--off-zone'}`}
          style={{ left: `${needlePct}%` }}
        />
      </div>
      <div className={`cents-meter__text ${inZone ? 'cents-meter__text--in-zone' : 'cents-meter__text--off-zone'}`}>
        {text}
      </div>
    </div>
  );
}
