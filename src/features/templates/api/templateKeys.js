export const templateKeys = {
  all: ['templates'],
  detail: (templateId) => [...templateKeys.all, 'detail', templateId],
  version: (templateId, version) => [...templateKeys.detail(templateId), 'version', version],
};
