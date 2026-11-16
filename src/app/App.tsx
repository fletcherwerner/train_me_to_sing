import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { UpdateBanner } from '../ui/components/UpdateBanner';

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
      <UpdateBanner />
    </HashRouter>
  );
}
