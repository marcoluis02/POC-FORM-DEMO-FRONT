export const responseKeys = {
  all: ['responses'],
  detail: (responseId) => [...responseKeys.all, 'detail', responseId],
};
