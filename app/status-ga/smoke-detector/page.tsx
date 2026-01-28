// app/ga-smoke-detector/page.tsx
import { Suspense } from 'react';
import { GaSmokeDetectorContent } from './GaSmokeDetectorContent';
export default async function GaSmokeDetectorPage({
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
        Loading Smoke & Heat Detector Dashboard...
      </div>
    }>
      <GaSmokeDetectorContent openArea={openArea} />
    </Suspense>
  );
}