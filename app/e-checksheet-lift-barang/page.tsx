// app/e-checksheet-lift-barang/page.tsx
import { Suspense } from 'react';
import { EChecksheetLiftBarangForm } from './EChecksheetLiftBarangForm';

export default function EChecksheetLiftBarangPage({
  searchParams,
}: {
  searchParams: {
    liftName?: string;
    area?: string;
    lokasi?: string;
  };
}) {
  const liftName = searchParams?.liftName || 'Lift Barang';
  const area = searchParams?.area || 'Area';
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