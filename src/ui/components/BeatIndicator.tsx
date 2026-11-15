import './BeatIndicator.css';

export interface BeatIndicatorProps {
  beatsPerBar: number;
  beatInBar: number;
  countInRemaining: number;
}

export function BeatIndicator({ beatsPerBar, beatInBar, countInRemaining }: BeatIndicatorProps) {
  if (countInRemaining > 0) {
    return (
      <div className="beat-indicator beat-indicator--countin" data-testid="count-in">
        {countInRemaining}
      </div>
    );
  }
  return (
    <div className="beat-indicator" aria-label="Beat in bar">
      {Array.from({ length: beatsPerBar }, (_, i) => (
        <span
          key={i}
          className={`beat-dot${i === beatInBar ? ' beat-dot--active' : ''}`}
          data-testid={`beat-dot-${i}`}
        />
      ))}
    </div>
  );
}
