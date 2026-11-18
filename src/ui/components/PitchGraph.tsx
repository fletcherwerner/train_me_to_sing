import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { now as audioNow } from '../../audio/audioEngine';
import {
  GRAPH_NOW_FRACTION,
  GRAPH_WINDOW_SEC,
  clampedMidiToY,
  graphPitchBounds,
  labelledMidis,
  midiToY,
  pxPerSec,
  sungSegments,
  splitByBounds,
  targetSegments,
  type GraphFrame,
  type PitchBounds,
} from '../../core/exercise/pitchGraph';
import type { ResolvedExercise, ResolvedNote, StudentRange } from '../../core/exercise/types';
import { isBlackKey, midiToName } from '../../core/music/notes';
import './PitchGraph.css';

const DEFAULT_W = 600;
const DEFAULT_H = 220;
const LABEL_W = 34;
const RESULTS_WINDOW_SEC = 30;

function useBoxSize(): [React.RefObject<HTMLDivElement>, { w: number; h: number }] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

/** Faint semitone lines and shaded black-key rows. */
const GridRows = memo(function GridRows({ bounds, width, height }: { bounds: PitchBounds; width: number; height: number }) {
  const rows = [];
  for (let m = Math.ceil(bounds.lowMidi); m <= Math.floor(bounds.highMidi); m++) {
    const y = midiToY(m, bounds, height);
    const rowH = height / (bounds.highMidi - bounds.lowMidi);
    if (isBlackKey(m)) {
      rows.push(<rect key={`b${m}`} className="pitch-graph__black-row" x={0} y={y - rowH / 2} width={width} height={rowH} />);
    }
    rows.push(<line key={`l${m}`} className="pitch-graph__grid" x1={0} x2={width} y1={y} y2={y} />);
  }
  return <g>{rows}</g>;
});

function AxisLabels({
  bounds,
  range,
  notes,
  height,
  x = 2,
}: {
  bounds: PitchBounds;
  range: StudentRange;
  notes: ResolvedNote[];
  height: number;
  x?: number;
}) {
  return (
    <g>
      {labelledMidis(bounds, range, notes).map((m) => (
        <text key={m} className="pitch-graph__label" x={x} y={midiToY(m, bounds, height) + 3}>
          {midiToName(m)}
        </text>
      ))}
    </g>
  );
}

/** SVG paths for the sung line: `d` inside the axis, `off` pinned to the edge where the voice is off the axis. */
function pathFor(frames: GraphFrame[], bounds: PitchBounds, height: number, pps: number): { d: string; off: string } {
  let d = '';
  let off = '';
  for (const seg of sungSegments(frames)) {
    for (const run of splitByBounds(seg, bounds)) {
      let part = '';
      run.points.forEach((p, i) => {
        // Keep the edge line a little inside the box so all of its width shows.
        const y = Math.min(height - 2, Math.max(2, clampedMidiToY(p.midi, bounds, height)));
        part += `${i === 0 ? 'M' : 'L'}${(p.tSec * pps).toFixed(1)} ${y.toFixed(1)} `;
      });
      // A single frame is a point: draw a tiny dash so it still shows.
      if (run.points.length === 1) part += `l1 0 `;
      if (run.inside) d += part;
      else off += part;
    }
  }
  return { d, off };
}

/** "target" (thick black) and "you" (thin red) samples. Drawn, so it does not rely on colour. */
export function GraphLegend({ showYou = true }: { showYou?: boolean }) {
  return (
    <div className="graph-legend" data-testid="graph-legend" aria-hidden="true">
      <span className="graph-legend__item" data-testid="legend-target">
        <svg width="28" height="10" viewBox="0 0 28 10">
          <line className="graph-legend__sample-target" x1="0" x2="28" y1="5" y2="5" />
        </svg>
        target
      </span>
      {showYou ? (
        <span className="graph-legend__item" data-testid="legend-you">
          <svg width="28" height="10" viewBox="0 0 28 10">
            <line className="graph-legend__sample-you" x1="0" x2="28" y1="5" y2="5" />
          </svg>
          you
        </span>
      ) : null}
    </div>
  );
}

export interface PitchGraphProps {
  /** The notes shown: the phrase being practised or the whole exercise. */
  exercise: ResolvedExercise;
  range: StudentRange;
  /** Audio-clock time of exercise beat 0; null when nothing is playing. */
  startSec: number | null;
  /** Latency-corrected frames, exercise time. Filled live by `recordFrames`. */
  frames: GraphFrame[] | null;
  /** I do shows only the target. */
  showSung: boolean;
  /** The audio clock. Defaults to the app's single AudioContext. */
  clock?: () => number;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** Live scrolling pitch graph. Targets come from the right, past a fixed "now" line. */
export function PitchGraph({ exercise, range, startSec, frames, showSung, clock = audioNow }: PitchGraphProps) {
  const [boxRef, { w, h }] = useBoxSize();
  const bounds = useMemo(() => graphPitchBounds(range, exercise.notes), [range, exercise.notes]);
  const pps = pxPerSec(w);
  const nowX = w * GRAPH_NOW_FRACTION;
  const segs = useMemo(() => targetSegments(exercise.notes), [exercise.notes]);
  const scrollRef = useRef<SVGGElement>(null);
  const sungRef = useRef<SVGPathElement>(null);
  const offRef = useRef<SVGPathElement>(null);
  const upRef = useRef<SVGTextElement>(null);
  const downRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const draw = () => {
      const nowSec = startSec === null ? 0 : clock() - startSec;
      scrollRef.current?.setAttribute('transform', `translate(${(nowX - nowSec * pps).toFixed(2)} 0)`);
      let up = false;
      let down = false;
      let d = '';
      let off = '';
      if (showSung && frames && startSec !== null) {
        const lo = nowSec - GRAPH_NOW_FRACTION * GRAPH_WINDOW_SEC - 0.5;
        const hi = nowSec + (1 - GRAPH_NOW_FRACTION) * GRAPH_WINDOW_SEC;
        let from = frames.length;
        while (from > 0 && frames[from - 1].tSec >= lo) from--;
        const visible = frames.slice(from).filter((f) => f.tSec <= hi);
        ({ d, off } = pathFor(visible, bounds, h, pps));
        const last = visible[visible.length - 1];
        if (last && last.midi !== null && nowSec - last.tSec < 0.15) {
          up = last.midi > bounds.highMidi;
          down = last.midi < bounds.lowMidi;
        }
      }
      sungRef.current?.setAttribute('d', d);
      offRef.current?.setAttribute('d', off);
      upRef.current?.setAttribute('visibility', up ? 'visible' : 'hidden');
      downRef.current?.setAttribute('visibility', down ? 'visible' : 'hidden');
    };
    draw();
    if (startSec === null) return;
    const reduced = prefersReducedMotion();
    if (reduced) {
      const id = window.setInterval(draw, 100);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [startSec, frames, showSung, bounds, h, pps, nowX, clock]);

  return (
    <div className="pitch-graph" ref={boxRef} data-testid="pitch-graph" aria-hidden="true">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <GridRows bounds={bounds} width={w} height={h} />
        <line className="pitch-graph__now" x1={nowX} x2={nowX} y1={0} y2={h} />
        <g ref={scrollRef}>
          {segs.map((s, i) => {
            return (
              <line
                key={i}
                className="pitch-graph__target"
                data-testid="graph-target"
                data-glide={s.endMidi !== s.midi ? 'true' : undefined}
                x1={s.startSec * pps}
                x2={s.endSec * pps}
                y1={midiToY(s.midi, bounds, h)}
                y2={midiToY(s.endMidi, bounds, h)}
              />
            );
          })}
          <path ref={offRef} className="pitch-graph__sung pitch-graph__sung--off" data-testid="graph-sung-off" d="" />
          <path ref={sungRef} className="pitch-graph__sung" data-testid="graph-sung" d="" />
        </g>
        <AxisLabels bounds={bounds} range={range} notes={exercise.notes} height={h} />
        <text ref={upRef} className="pitch-graph__marker" x={nowX} y={12} textAnchor="middle" visibility="hidden">
          ▲
        </text>
        <text ref={downRef} className="pitch-graph__marker" x={nowX} y={h - 3} textAnchor="middle" visibility="hidden">
          ▼
        </text>
      </svg>
    </div>
  );
}

export interface ResultsGraphProps {
  exercise: ResolvedExercise;
  range: StudentRange;
  frames: GraphFrame[];
}

/** The whole You do attempt as one static graph. Scrolls sideways inside its own box past 30 s. */
export function ResultsGraph({ exercise, range, frames }: ResultsGraphProps) {
  const [boxRef, { w, h }] = useBoxSize();
  const bounds = useMemo(() => graphPitchBounds(range, exercise.notes), [range, exercise.notes]);
  const segs = useMemo(() => targetSegments(exercise.notes), [exercise.notes]);
  const span = Math.max(exercise.totalSec, 0.5) + 0.25;
  const viewW = Math.max(40, w - LABEL_W);
  const pps = viewW / Math.min(span, RESULTS_WINDOW_SEC);
  const contentW = span * pps;
  const { d, off } = useMemo(() => pathFor(frames, bounds, h, pps), [frames, bounds, h, pps]);

  return (
    <div className="pitch-graph pitch-graph--results" ref={boxRef} data-testid="results-graph" aria-hidden="true">
      <svg className="pitch-graph__labels" width={LABEL_W} height={h}>
        <AxisLabels bounds={bounds} range={range} notes={exercise.notes} height={h} />
      </svg>
      <div className="pitch-graph__scroll" data-testid="results-graph-scroll" style={{ width: viewW }}>
        <svg width={contentW} height={h} viewBox={`0 0 ${contentW} ${h}`}>
          <GridRows bounds={bounds} width={contentW} height={h} />
          {segs.map((s, i) => {
            return (
              <line
                key={i}
                className="pitch-graph__target"
                data-testid="graph-target"
                data-glide={s.endMidi !== s.midi ? 'true' : undefined}
                x1={s.startSec * pps}
                x2={s.endSec * pps}
                y1={midiToY(s.midi, bounds, h)}
                y2={midiToY(s.endMidi, bounds, h)}
              />
            );
          })}
          <path className="pitch-graph__sung pitch-graph__sung--off" data-testid="graph-sung-off" d={off} />
          <path className="pitch-graph__sung" data-testid="graph-sung" d={d} />
        </svg>
      </div>
    </div>
  );
}
