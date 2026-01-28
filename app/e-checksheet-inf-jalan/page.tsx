// app/e-checksheet-inf-jalan/page.tsx
'use client';

import { Suspense, use } from 'react';
import { EChecksheetInfJalanForm } from './EChecksheetInfJalanForm';

export default function EChecksheetInfJalanPage({
  searchParams,
}: {
  searchParams: Promise<{
    areaName?: string;
    kategori?: string;
    lokasi?: string;
  }>;
}) {
  const params = use(searchParams);
  const areaName = params?.areaName || 'Area Jalan';
  const kategori = params?.kategori || 'Kategori';
  const lokasi = params?.lokasi || 'Lokasi';

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