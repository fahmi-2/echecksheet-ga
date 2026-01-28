// app/e-checksheet-hydrant/page.tsx
import { Suspense, use } from 'react';
import { EChecksheetHydrantForm } from './EChecksheetHydrantForm';

export default function EChecksheetHydrantPage({
  searchParams,
}: {
  searchParams: Promise<{
    no?: string;
    lokasi?: string;
    zona?: string;
    jenisHydrant?: string;
  }>;
}) {
  const params = use(searchParams);
  const no = params?.no || '0';
  const lokasi = params?.lokasi || 'Hydrant Location';
  const zona = params?.zona || 'Zone';
  const jenisHydrant = params?.jenisHydrant || 'HYDRANT TYPE';

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