// app/ga-selang-hydrant/page.tsx
import { Suspense } from 'react';
import { GaSelangHydrantContent } from './GaSelangHydrantContent';

export default async function GaSelangHydrantPage({
    searchParams,
}: {
  searchParams?: Promise<{ openArea?: string }>; // ← searchParams adalah Promise
}) {
  // ✅ TUNGGU NILAI searchParams
  const resolvedSearchParams = await searchParams;
  const openArea = resolvedSearchParams?.openArea || '';

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