import { createBrowserRouter } from 'react-router';
import AppLayout from '@/app/layouts/AppLayout/AppLayout';
import HomePage from '@/app/pages/HomePage/HomePage';
import NotFoundPage from '@/app/pages/NotFoundPage/NotFoundPage';
import RouteErrorPage from '@/app/pages/RouteErrorPage/RouteErrorPage';
import { ROUTES } from './routes';

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
