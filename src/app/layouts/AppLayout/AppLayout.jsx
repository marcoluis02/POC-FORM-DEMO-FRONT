import { FileStackIcon } from 'lucide-animated';
import { Link, Outlet } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { APP_NAME } from '@/shared/constants/appInfo';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import { useAnimatedIcon } from '@/shared/hooks/useAnimatedIcon';
import { useApiHealth } from '@/shared/hooks/useApiHealth';
import './AppLayout.css';

export default function AppLayout() {
  const health = useApiHealth();
  const logo = useAnimatedIcon();

  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <div className="app-layout__header-inner">
          <div className="app-layout__brand-block">
            <Link
              to={ROUTES.home}
              className="app-layout__brand"
              onMouseEnter={logo.onMouseEnter}
              onMouseLeave={logo.onMouseLeave}
              onFocus={logo.onFocus}
              onBlur={logo.onBlur}
            >
              <div className="app-layout__logo">
                <AnimatedIcon icon={FileStackIcon} iconRef={logo.ref} size={18} />
              </div>
              {APP_NAME}
            </Link>
          </div>
        </div>
      </header>
      <main className="app-layout__main">
        {health.isError && (
          <ErrorState
            title="No pudimos conectar con el servidor"
            message={health.error.message}
            onRetry={() => health.refetch()}
            retrying={health.isFetching}
          />
        )}
        <Outlet />
      </main>
    </div>
  );
}
