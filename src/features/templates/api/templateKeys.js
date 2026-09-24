export const templateKeys = {
  all: ['templates'],
  list: () => [...templateKeys.all, 'list'],
  detail: (templateId) => [...templateKeys.all, 'detail', templateId],
  version: (templateId, version) => [...templateKeys.detail(templateId), 'version', version],
};
