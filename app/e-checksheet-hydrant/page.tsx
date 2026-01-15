// app/e-checksheet-hydrant/page.tsx
import { Suspense } from 'react';
import { EChecksheetHydrantForm } from './EChecksheetHydrantForm';

export default function EChecksheetHydrantPage({
  searchParams,
}: {
  searchParams: {
    no?: string;
    lokasi?: string;
    zona?: string;
    jenisHydrant?: string;
  };
}) {
  const no = searchParams?.no || '0';
  const lokasi = searchParams?.lokasi || 'Hydrant Location';
  const zona = searchParams?.zona || 'Zone';
  const jenisHydrant = searchParams?.jenisHydrant || 'HYDRANT TYPE';

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
        Loading inspection form...
      </div>
    }>
      <EChecksheetHydrantForm
        no={no}
        lokasi={lokasi}
        zona={zona}
        jenisHydrant={jenisHydrant}
      />
    </Suspense>
  );
}