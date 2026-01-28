// app/ga-panel/page.tsx
import { Suspense } from 'react';
import { GaPanelContent } from '@/app/status-ga/panel/GaPanelContent';

export default async function GaPanelPage({
  searchParams,
}: {
  searchParams?: Promise<{ openPanel?: string }>; // ← searchParams adalah Promise
}) {
  // ✅ TUNGGU NILAI searchParams
  const resolvedSearchParams = await searchParams;
  const openPanel = resolvedSearchParams?.openPanel || '';

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