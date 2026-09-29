import { generatePath } from "react-router";

export const ROUTES = Object.freeze({
  home: "/",
  templates: "/templates",
  inspections: "/inspections",
  importNew: "/imports/new",
  importDetail: "/imports/:importId",
  templateNew: "/templates/new",
  templateDetail: "/templates/:templateId",
  templateEdit: "/templates/:templateId/edit",
  responseDetail: "/responses/:responseId",
  responseReport: "/responses/:responseId/report",
});

// Arma las rutas con parámetros. Ej: paths.templateDetail('abc') -> '/templates/abc'
export const paths = Object.freeze({
  importDetail: (importId) => generatePath(ROUTES.importDetail, { importId }),
  templateDetail: (templateId) =>
    generatePath(ROUTES.templateDetail, { templateId }),
  templateEdit: (templateId) =>
    generatePath(ROUTES.templateEdit, { templateId }),
  responseDetail: (responseId) =>
    generatePath(ROUTES.responseDetail, { responseId }),
  responseReport: (responseId) =>
    generatePath(ROUTES.responseReport, { responseId }),
});
