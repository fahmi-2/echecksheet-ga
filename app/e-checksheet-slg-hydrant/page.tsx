// app/e-checksheet-slg-hydrant/page.tsx
"use client"; // ← Tambahkan ini

import { Suspense, use } from 'react'; // ← tambahkan `use` dari React
import { EChecksheetSelangHydrantForm } from './EChecksheetSelangHydrantForm';

export default function EChecksheetSelangHydrantPage({
  searchParams,
}: {
  searchParams: Promise<{
    lokasi?: string;
    zona?: string;
    jenisHydrant?: string;
    pic?: string;
  }>;
}) {
  // ✅ Unwrap searchParams dengan React.use()
  const params = use(searchParams);
  
  const lokasi = params.lokasi || 'Hydrant Lokasi';
  const zona = params.zona || 'Zona';
  const jenisHydrant = params.jenisHydrant || 'Jenis Hydrant';
  const picDefault = params.pic || 'PIC';

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
        Loading Selang Hydrant inspection form...
      </div>
    }>
      <EChecksheetSelangHydrantForm
        lokasi={lokasi}
        zona={zona}
        jenisHydrant={jenisHydrant}
        picDefault={picDefault}
      />
    </Suspense>
  );
}