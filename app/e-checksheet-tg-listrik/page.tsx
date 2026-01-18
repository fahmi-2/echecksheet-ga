// app/e-checksheet-tg-listrik/page.tsx
import { Suspense } from 'react';
import { EChecksheetTgListrikForm } from './EChecksheetTgListrikForm';

export default function EChecksheetTgListrikPage({
  searchParams,
}: {
  searchParams: {
    areaName?: string;
    lokasi?: string;
  };
}) {
  const areaName = searchParams?.areaName || 'Tangga Listrik';
  const lokasi = searchParams?.lokasi || 'Lokasi';

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
        Loading Tangga Listrik inspection form...
      </div>
    }>
      <EChecksheetTgListrikForm
        areaName={areaName}
        lokasi={lokasi}
      />
    </Suspense>
  );
}