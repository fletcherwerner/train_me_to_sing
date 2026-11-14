import { Route, Routes } from 'react-router-dom';
import { Home } from '../ui/screens/Home';
import { PianoDev } from '../ui/screens/dev/PianoDev';
import { TunerDev } from '../ui/screens/dev/TunerDev';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dev/piano" element={<PianoDev />} />
      <Route path="/dev/tuner" element={<TunerDev />} />
    </Routes>
  );
}
