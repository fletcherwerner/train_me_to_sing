import { Route, Routes, Navigate } from 'react-router-dom';
import { Home } from '../ui/screens/Home';
import { RangeSetup } from '../ui/screens/RangeSetup';
import { PianoDev } from '../ui/screens/dev/PianoDev';
import { TunerDev } from '../ui/screens/dev/TunerDev';
import { useAppStore } from '../storage/store';

export function AppRoutes() {
  const range = useAppStore((s) => s.range);

  // Redirect to range setup if no range is set
  const hasRange = range != null;

  return (
    <Routes>
      <Route path="/range" element={<RangeSetup />} />
      <Route
        path="/"
        element={hasRange ? <Home /> : <Navigate to="/range" />}
      />
      <Route path="/dev/piano" element={<PianoDev />} />
      <Route path="/dev/tuner" element={<TunerDev />} />
    </Routes>
  );
}
