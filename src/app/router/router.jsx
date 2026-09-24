import { createBrowserRouter } from 'react-router';
import AppLayout from '@/app/layouts/AppLayout/AppLayout';
import HomePage from '@/app/pages/HomePage/HomePage';
import NotFoundPage from '@/app/pages/NotFoundPage/NotFoundPage';
import RouteErrorPage from '@/app/pages/RouteErrorPage/RouteErrorPage';
import TemplateDetailPage from '@/features/templates/pages/TemplateDetailPage/TemplateDetailPage';
import TemplateReviewPage from '@/features/templates/pages/TemplateReviewPage/TemplateReviewPage';
import TemplatesListPage from '@/features/templates/pages/TemplatesListPage/TemplatesListPage';
import { ROUTES } from './routes';

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.templates, element: <TemplatesListPage /> },
      { path: ROUTES.templateNew, element: <TemplateReviewPage /> },
      { path: ROUTES.templateDetail, element: <TemplateDetailPage /> },
      { path: ROUTES.templateEdit, element: <TemplateReviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
