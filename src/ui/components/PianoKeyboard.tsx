import { useLayoutEffect, useRef, useState } from 'react';
import { isBlackKey, midiToName } from '../../core/music/notes';
import './PianoKeyboard.css';

export interface PianoKeyboardProps {
  lowMidi: number;
  highMidi: number;
  targetMidi?: number | null;
  sungMidi?: number | null;
  rangeMarkers?: { lowMidi: number; highMidi: number };
  onKeyPress?: (midi: number) => void;
  /** With a target: the sung key is "match" only within this many cents of the target. */
  matchCents?: number;
}

/** Smallest text sizes, in rendered (screen) pixels. */
const MIN_LABEL_PX = 12;
const MIN_KEY_LABEL_PX = 10;

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
  matchCents = 50,
}: PianoKeyboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Rendered pixels per SVG unit. The SVG scales with its viewBox, so text sizes are set from this.
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const vb = el.viewBox.baseVal;
      const r = el.getBoundingClientRect();
      if (!vb || vb.width <= 0 || vb.height <= 0 || r.width <= 0 || r.height <= 0) return;
      const s = Math.min(r.width / vb.width, r.height / vb.height);
      setScale((prev) => (Math.abs(prev - s) < 0.01 ? prev : s));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const labelUnits = MIN_LABEL_PX / scale;
  const keyLabelUnits = Math.max(8, MIN_KEY_LABEL_PX / scale);
  // A key label needs about 1.3 x its font size to fit across one white key.
  const showKeyLabels = keyLabelUnits * 1.3 <= WHITE_W;
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

  // With a target, "match" needs the right key AND a pitch inside the lesson's tolerance.
  const sungMatches =
    sungKey != null &&
    (targetMidi == null ||
      (sungKey === targetMidi && Math.abs(((sungMidi as number) - targetMidi) * 100) <= matchCents));

  const keyClass = (midi: number): string => {
    const cls = ['piano-key', isBlackKey(midi) ? 'piano-key--black' : 'piano-key--white'];
    if (targetMidi != null && midi === targetMidi) cls.push('piano-key--target');
    if (sungInRange && midi === sungKey) {
      cls.push(sungMatches ? 'piano-key--sung-match' : 'piano-key--sung-off');
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
        <text x={cx} y={MARKER_Y + 8 + labelUnits} textAnchor="middle" style={{ fontSize: labelUnits }}>
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
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
          {m % 12 === 0 && showKeyLabels && (
            <text
              className="piano-label"
              x={whiteX(m) + WHITE_W / 2}
              y={KEY_H - 6}
              textAnchor="middle"
              style={{ fontSize: keyLabelUnits }}
            >
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
          className={`piano-arrow ${sungMatches ? 'piano-arrow--match' : 'piano-arrow--off'}`}
          data-testid="edge-arrow"
          x={sungKey < lo ? 2 : width - 2}
          y={ARROW_Y + labelUnits - 11}
          textAnchor={sungKey < lo ? 'start' : 'end'}
          style={{ fontSize: labelUnits }}
        >
          {sungKey < lo ? `◀ ${midiToName(sungKey)}` : `${midiToName(sungKey)} ▶`}
        </text>
      )}
    </svg>
  );
}
