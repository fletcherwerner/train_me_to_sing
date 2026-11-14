import { isBlackKey, midiToName } from '../../core/music/notes';
import './PianoKeyboard.css';

export interface PianoKeyboardProps {
  lowMidi: number;
  highMidi: number;
  targetMidi?: number | null;
  sungMidi?: number | null;
  rangeMarkers?: { lowMidi: number; highMidi: number };
  onKeyPress?: (midi: number) => void;
}

const WHITE_W = 24;
const KEY_H = 120;
const BLACK_W = WHITE_W * 0.6;
const BLACK_H = KEY_H * 0.62;
const MARKER_Y = KEY_H + 4;
const ARROW_Y = KEY_H + 30;
const TOTAL_H = KEY_H + 40;

export function PianoKeyboard({
  lowMidi,
  highMidi,
  targetMidi = null,
  sungMidi = null,
  rangeMarkers,
  onKeyPress,
}: PianoKeyboardProps) {
  let lo = Math.round(lowMidi);
  let hi = Math.round(highMidi);
  if (isBlackKey(lo)) lo -= 1;
  if (isBlackKey(hi)) hi += 1;
  if (hi < lo) hi = lo;

  const whites: number[] = [];
  const blacks: { midi: number; x: number }[] = [];
  for (let m = lo; m <= hi; m++) {
    if (isBlackKey(m)) {
      // lower neighbour (m - 1) is white and already placed
      blacks.push({ midi: m, x: whites.length * WHITE_W - BLACK_W / 2 });
    } else {
      whites.push(m);
    }
  }
  const width = whites.length * WHITE_W;
  const whiteX = (m: number) => whites.indexOf(m) * WHITE_W;
  const keyCentreX = (m: number) => (isBlackKey(m) ? blacks.find((b) => b.midi === m)!.x + BLACK_W / 2 : whiteX(m) + WHITE_W / 2);

  const sungKey = sungMidi == null ? null : Math.round(sungMidi);
  const sungInRange = sungKey != null && sungKey >= lo && sungKey <= hi;

  const keyClass = (midi: number): string => {
    const cls = ['piano-key', isBlackKey(midi) ? 'piano-key--black' : 'piano-key--white'];
    if (targetMidi != null && midi === targetMidi) cls.push('piano-key--target');
    if (sungInRange && midi === sungKey) {
      cls.push(targetMidi == null || sungKey === targetMidi ? 'piano-key--sung-match' : 'piano-key--sung-off');
    }
    return cls.join(' ');
  };

  const handleDown = (midi: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    onKeyPress?.(midi);
  };

  const rm = rangeMarkers;
  const markerEl = (midi: number, label: string) => {
    if (midi < lo || midi > hi) return null;
    const cx = keyCentreX(midi);
    return (
      <g className="piano-marker" data-testid={`marker-${label}`}>
        <path d={`M ${cx - 6} ${MARKER_Y + 8} V ${MARKER_Y} H ${cx + 6} V ${MARKER_Y + 8}`} />
        <text x={cx} y={MARKER_Y + 18} textAnchor="middle">
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      className="piano"
      viewBox={`0 0 ${width} ${TOTAL_H}`}
      width="100%"
      role="group"
      aria-label="Piano keyboard"
      style={{ touchAction: 'none', display: 'block', maxWidth: '100%' }}
    >
      {whites.map((m) => (
        <g key={m} onPointerDown={handleDown(m)} data-midi={m}>
          <rect
            className={keyClass(m)}
            data-testid={`key-${m}`}
            x={whiteX(m)}
            y={0}
            width={WHITE_W}
            height={KEY_H}
          />
          {m % 12 === 0 && (
            <text className="piano-label" x={whiteX(m) + WHITE_W / 2} y={KEY_H - 6} textAnchor="middle">
              {midiToName(m)}
            </text>
          )}
        </g>
      ))}
      {blacks.map((b) => (
        <rect
          key={b.midi}
          className={keyClass(b.midi)}
          data-testid={`key-${b.midi}`}
          data-midi={b.midi}
          x={b.x}
          y={0}
          width={BLACK_W}
          height={BLACK_H}
          onPointerDown={handleDown(b.midi)}
        />
      ))}
      {rm && markerEl(rm.lowMidi, 'low')}
      {rm && markerEl(rm.highMidi, 'high')}
      {sungKey != null && !sungInRange && (
        <text
          className={`piano-arrow ${targetMidi == null || sungKey === targetMidi ? 'piano-arrow--match' : 'piano-arrow--off'}`}
          data-testid="edge-arrow"
          x={sungKey < lo ? 2 : width - 2}
          y={ARROW_Y}
          textAnchor={sungKey < lo ? 'start' : 'end'}
        >
          {sungKey < lo ? `◀ ${midiToName(sungKey)}` : `${midiToName(sungKey)} ▶`}
        </text>
      )}
    </svg>
  );
}
