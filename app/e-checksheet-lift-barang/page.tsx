// app/e-checksheet-lift-barang/page.tsx
'use client';

import { Suspense, use } from 'react';
import { EChecksheetLiftBarangForm } from './EChecksheetLiftBarangForm';

export default async function EChecksheetLiftBarangPage({
  searchParams,
}: {
  searchParams: Promise<{
    liftName?: string;
    area?: string;
    lokasi?: string;
  }>;
}) {
  const params = use(searchParams);
  const liftName = params?.liftName || 'Lift Barang';
  const area = params?.area || 'Area';
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
        Loading Lift Barang inspection form...
      </div>
    }>
      <EChecksheetLiftBarangForm
        liftName={liftName}
        area={area}
        lokasi={lokasi}
      />
    </Suspense>
  );
}