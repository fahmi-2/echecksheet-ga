// app/e-checksheet-inf-jalan/page.tsx
import { Suspense } from 'react';
import { EChecksheetInfJalanForm } from './EChecksheetInfJalanForm';

export default function EChecksheetInfJalanPage({
  searchParams,
}: {
  searchParams: {
    areaName?: string;
    kategori?: string;
    lokasi?: string;
  };
}) {
  const areaName = searchParams?.areaName || 'Area Jalan';
  const kategori = searchParams?.kategori || 'Kategori';
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
        Loading form...
      </div>
    }>
      <EChecksheetInfJalanForm
        areaName={areaName}
        kategori={kategori}
        lokasi={lokasi}
      />
    </Suspense>
  );
}