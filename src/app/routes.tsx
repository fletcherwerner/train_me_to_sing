import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Home } from '../ui/screens/Home';
import { RangeSetup } from '../ui/screens/RangeSetup';
import { Lesson } from '../ui/screens/Lesson';
import { PianoDev } from '../ui/screens/dev/PianoDev';
import { TunerDev } from '../ui/screens/dev/TunerDev';
import { ExerciseDev } from '../ui/screens/dev/ExerciseDev';
import { AttemptDev } from '../ui/screens/dev/AttemptDev';
import { useAppStore } from '../storage/store';

export function AppRoutes() {
  const range = useAppStore((s) => s.range);
  const { search } = useLocation();

  // Redirect to range setup if no range is set
  const hasRange = range != null;

  return (
    <Routes>
      <Route path="/range" element={<RangeSetup />} />
      <Route
        path="/"
        element={hasRange ? <Home /> : <Navigate to={{ pathname: '/range', search }} replace />}
      />
      <Route path="/lesson/:lessonId" element={<Lesson />} />
      <Route path="/dev/piano" element={<PianoDev />} />
      <Route path="/dev/tuner" element={<TunerDev />} />
      <Route path="/dev/exercise" element={<ExerciseDev />} />
      <Route path="/dev/attempt" element={<AttemptDev />} />
    </Routes>
  );
}
