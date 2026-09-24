export const importKeys = {
  all: ['imports'],
  detail: (importId) => [...importKeys.all, 'detail', importId],
};
