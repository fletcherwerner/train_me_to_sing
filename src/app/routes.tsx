import { Route, Routes } from 'react-router-dom';
import { Home } from '../ui/screens/Home';
import { RangeSetup } from '../ui/screens/RangeSetup';
import { Settings } from '../ui/screens/Settings';
import { Calibrate } from '../ui/screens/Calibrate';
import { Practice } from '../ui/screens/Practice';
import { Progress } from '../ui/screens/Progress';
import { Lesson } from '../ui/screens/Lesson';
import { ImportMidi } from '../ui/screens/ImportMidi';
import { PianoDev } from '../ui/screens/dev/PianoDev';
import { MicCheck } from '../ui/screens/MicCheck';
import { TunerDev } from '../ui/screens/dev/TunerDev';
import { ExerciseDev } from '../ui/screens/dev/ExerciseDev';
import { AttemptDev } from '../ui/screens/dev/AttemptDev';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/range" element={<RangeSetup />} />
      {/* Home always opens first: from there the student finds their range or loads a profile in Settings. */}
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/calibrate" element={<Calibrate />} />
      <Route path="/lesson/:lessonId" element={<Lesson />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/mic-check" element={<MicCheck />} />
      <Route path="/import" element={<ImportMidi />} />
      <Route path="/dev/piano" element={<PianoDev />} />
      <Route path="/dev/tuner" element={<TunerDev />} />
      <Route path="/dev/exercise" element={<ExerciseDev />} />
      <Route path="/dev/attempt" element={<AttemptDev />} />
    </Routes>
  );
}
