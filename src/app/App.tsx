import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { UpdateBanner } from '../ui/components/UpdateBanner';
import { ProfileNotices } from '../ui/components/ProfileNotices';

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
      <UpdateBanner />
      <ProfileNotices />
    </HashRouter>
  );
}
