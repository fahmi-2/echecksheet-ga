// app/e-checksheet-smoke-detector/page.tsx
"use client";

import { Suspense, use } from 'react';
import { EChecksheetSmokeDetectorForm } from './EChecksheetSmokeDetectorForm';

export default function EChecksheetSmokeDetectorPage({
  searchParams,
}: {
  searchParams: Promise<{
    no?: string;
    lokasi?: string;
    zona?: string;
  }>;
}) {
  // ✅ Unwrap searchParams dengan React.use()
  const params = use(searchParams);
  
  const no = params.no || '0';
  const lokasi = params.lokasi || 'Smoke Detector Location';
  const zona = params.zona || 'Zone';

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
        Loading Smoke Detector inspection form...
      </div>
    }>
      <EChecksheetSmokeDetectorForm
        no={no}
        lokasi={lokasi}
        zona={zona}
      />
    </Suspense>
  );
}