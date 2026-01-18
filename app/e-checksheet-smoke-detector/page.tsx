// app/e-checksheet-smoke-detector/page.tsx
import { Suspense } from 'react';
import { EChecksheetSmokeDetectorForm } from './EChecksheetSmokeDetectorForm';

export default function EChecksheetSmokeDetectorPage({
  searchParams,
}: {
  searchParams: {
    no?: string;
    lokasi?: string;
    zona?: string;
  };
}) {
  const no = searchParams?.no || '0';
  const lokasi = searchParams?.lokasi || 'Smoke Detector Location';
  const zona = searchParams?.zona || 'Zone';

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