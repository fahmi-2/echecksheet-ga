// app/ga-lift-barang/page.tsx
import { Suspense } from 'react';
import { GaLiftBarangContent } from './GaLiftBarangContent';
export default async function GaLiftBarangPage({
    searchParams,
}: {
  searchParams?: Promise<{ openLift?: string }>; // ← searchParams adalah Promise
}) {
  // ✅ TUNGGU NILAI searchParams
  const resolvedSearchParams = await searchParams;
  const openLift = resolvedSearchParams?.openLift || '';
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