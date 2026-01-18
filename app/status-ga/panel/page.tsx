// app/ga-panel/page.tsx
import { Suspense } from 'react';
import { GaPanelContent } from './GaPanelContent';

export default function GaPanelPage({
  searchParams,
}: {
  searchParams: {
    openPanel?: string;
  };
}) {
  const openPanel = searchParams?.openPanel || '';

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
        Loading Panel Inspection Dashboard...
      </div>
    }>
      <GaPanelContent openPanel={openPanel} />
    </Suspense>
  );
}