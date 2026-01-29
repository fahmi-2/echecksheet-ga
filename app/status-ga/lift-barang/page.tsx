// app/ga-lift-barang/page.tsx
'use client';

import { Suspense, use } from 'react';
import { GaLiftBarangContent } from './GaLiftBarangContent';
export default function GaLiftBarangPage({
    searchParams,
}: {
  searchParams: Promise<{
    openLift?: string;
  }>;
}) {
  const params = use(searchParams);
  const openLift = params?.openLift || '';

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
        Loading Lift Barang Dashboard...
      </div>
    }>
      <GaLiftBarangContent openLift={openLift} />
    </Suspense>
  );
}