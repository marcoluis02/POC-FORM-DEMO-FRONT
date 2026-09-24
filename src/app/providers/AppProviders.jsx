import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import ConfirmProvider from '@/shared/components/ConfirmModal/ConfirmProvider';
import ToastProvider from '@/shared/components/Toast/ToastProvider';
import { createQueryClient } from './queryClient';

export default function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
