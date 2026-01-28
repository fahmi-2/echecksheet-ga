// app/status-ga/selang-hydrant/page.tsx
"use client";

import { Suspense, use } from 'react';
import { GaSelangHydrantContent } from './GaSelangHydrantContent';

export default async function GaSelangHydrantPage({
    searchParams,
}: {
  searchParams: Promise<{ openArea?: string }>; // ← Promise
}) {
  // ✅ Unwrap searchParams dengan React.use()
  const params = use(searchParams);
  const openArea = params?.openArea || '';

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
        fontSize: '16px'
      }}>
        Loading Selang & Hydrant Dashboard...
      </div>
    }>
      <GaSelangHydrantContent openArea={openArea} />
    </Suspense>
  );
}