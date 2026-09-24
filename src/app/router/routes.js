import { generatePath } from 'react-router';

export const ROUTES = Object.freeze({
  home: '/',
  templates: '/templates',
  templateNew: '/templates/new',
  templateDetail: '/templates/:templateId',
  templateEdit: '/templates/:templateId/edit',
  responseDetail: '/responses/:responseId',
});

// Arma las rutas con parámetros. Ej: paths.templateDetail('abc') -> '/templates/abc'
export const paths = Object.freeze({
  templateDetail: (templateId) => generatePath(ROUTES.templateDetail, { templateId }),
  templateEdit: (templateId) => generatePath(ROUTES.templateEdit, { templateId }),
  responseDetail: (responseId) => generatePath(ROUTES.responseDetail, { responseId }),
});
