import { env } from '@/app/config/env';
import { apiClient } from './apiClient';

export const healthKeys = {
  status: ['health', 'status'],
};

export function getHealth({ signal } = {}) {
  return apiClient.get(env.endpoints.health, { signal });
}
