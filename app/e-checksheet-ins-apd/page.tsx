// app/e-checksheet-ins-apd/page.tsx
import { Suspense } from 'react';
import { EChecksheetInsApdForm } from './EChecksheetInsApdForm';

export default function EChecksheetInsApdPage({
  searchParams,
}: {
  searchParams: {
    areaId?: string;
  };
}) {
  const areaId = Number(searchParams?.areaId) || 1;
  const areaName = `Area ${areaId}`;

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
        Loading APD inspection form...
      </div>
    }>
      <EChecksheetInsApdForm areaId={areaId} areaName={areaName} />
    </Suspense>
  );
}