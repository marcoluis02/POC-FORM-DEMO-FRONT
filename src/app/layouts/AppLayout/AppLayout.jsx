import { Link, NavLink, Outlet } from 'react-router';
import { APP_NAME } from '@/shared/constants/appInfo';
import { ROUTES } from '@/app/router/routes';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <div className="app-layout__header-inner">
          <Link to={ROUTES.home} className="app-layout__brand">
            {APP_NAME}
          </Link>
          <nav aria-label="Principal">
            <NavLink to={ROUTES.templates} className="app-layout__nav-link">
              Plantillas
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
