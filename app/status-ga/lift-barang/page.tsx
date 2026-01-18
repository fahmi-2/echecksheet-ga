// app/ga-lift-barang/page.tsx
import { Suspense } from 'react';
import { GaLiftBarangContent } from './GaLiftBarangContent';
export default function GaLiftBarangPage({
  searchParams,
}: {
  searchParams: {
    openLift?: string;
  };
}) {
  const openLift = searchParams?.openLift || '';

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