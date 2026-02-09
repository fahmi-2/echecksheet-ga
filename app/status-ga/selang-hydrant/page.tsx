// app/status-ga/selang-hydrant/page.tsx
'use client';

import { Suspense, use } from 'react';
import { GaSelangHydrantContent } from './GaSelangHydrantContent';

export default function GaSelangHydrantPage({
  searchParams,
}: {
  searchParams?: Promise<{ 
    openArea?: string;
  }>;
}) {
  const params = use(searchParams || Promise.resolve({ openArea: '' }));
  const openArea = (params as { openArea?: string })?.openArea || '';

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        Loading Selang & Hydrant Dashboard...
      </div>
    }>
      <GaSelangHydrantContent openArea={openArea} />
    </Suspense>
  );
}
