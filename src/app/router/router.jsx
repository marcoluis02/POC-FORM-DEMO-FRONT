import { createBrowserRouter } from "react-router";
import AppLayout from "@/app/layouts/AppLayout/AppLayout";
import HomePage from "@/app/pages/HomePage/HomePage";
import NotFoundPage from "@/app/pages/NotFoundPage/NotFoundPage";
import RouteErrorPage from "@/app/pages/RouteErrorPage/RouteErrorPage";
import Loader from "@/shared/components/Loader/Loader";
import { ROUTES } from "./routes";

// Cada pantalla se descarga solo cuando se abre, así la app inicial pesa menos
const page = (load) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <Loader label="Cargando..." fullPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: ROUTES.importNew,
        lazy: page(
          () => import("@/features/imports/pages/ImportPage/ImportPage"),
        ),
      },
      {
        path: ROUTES.importDetail,
        lazy: page(
          () =>
            import("@/features/imports/pages/ImportStatusPage/ImportStatusPage"),
        ),
      },
      {
        path: ROUTES.inspections,
        lazy: page(
          () =>
            import("@/features/responses/pages/InspectionsPage/InspectionsPage"),
        ),
      },
      {
        path: ROUTES.templates,
        lazy: page(
          () =>
            import("@/features/templates/pages/TemplatesListPage/TemplatesListPage"),
        ),
      },
      {
        path: ROUTES.templateNew,
        lazy: page(
          () =>
            import("@/features/templates/pages/TemplateReviewPage/TemplateReviewPage"),
        ),
      },
      {
        path: ROUTES.templateDetail,
        lazy: page(
          () =>
            import("@/features/templates/pages/TemplateDetailPage/TemplateDetailPage"),
        ),
      },
      {
        path: ROUTES.templateEdit,
        lazy: page(
          () =>
            import("@/features/templates/pages/TemplateReviewPage/TemplateReviewPage"),
        ),
      },
      {
        path: ROUTES.responseReport,
        lazy: page(
          () =>
            import("@/features/responses/pages/ResponseReportPage/ResponseReportPage"),
        ),
      },
      {
        path: ROUTES.responseDetail,
        lazy: page(
          () =>
            import("@/features/responses/pages/ResponseFillPage/ResponseFillPage"),
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
