// app/ga-inf-jalan/page.tsx
import { Suspense } from 'react';
import { GaInfJalanContent } from './GaInfJalanContent';


// ✅ JADIKAN SERVER COMPONENT ASYNC
export default async function GaInfJalanPage({
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
        Loading Infrastruktur Jalan...
      </div>
    }>
      <GaInfJalanContent openArea={openArea} />
    </Suspense>
  );
}