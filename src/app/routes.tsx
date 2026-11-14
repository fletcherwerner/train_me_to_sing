import { Route, Routes } from 'react-router-dom';
import { Home } from '../ui/screens/Home';
import { PianoDev } from '../ui/screens/dev/PianoDev';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dev/piano" element={<PianoDev />} />
    </Routes>
  );
}
