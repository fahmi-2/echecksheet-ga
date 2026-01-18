// app/ga-tg-listrik/page.tsx
import { Suspense } from 'react';
import { GaTanggaListrikContent } from './GaTanggaListrikContent';

export default function GaTanggaListrikPage({
  searchParams,
}: {
  searchParams: {
    openArea?: string;
  };
}) {
  const openArea = searchParams?.openArea || '';

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
        Loading Tangga Listrik Dashboard...
      </div>
    }>
      <GaTanggaListrikContent openArea={openArea} />
    </Suspense>
  );
}