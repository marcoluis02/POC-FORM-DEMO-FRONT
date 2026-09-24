export const responseKeys = {
  all: ['responses'],
  list: (templateId) => [...responseKeys.all, 'list', templateId],
  detail: (responseId) => [...responseKeys.all, 'detail', responseId],
};
