// page.tsx
// app/exit-lamp-pintu-darurat/exit-lamp/page.tsx
import { Suspense } from 'react';
import { ExitLampChecklistContent } from './ExitLampChecklistContent';

export default function ExitLampChecklistPage({
  searchParams,
}: {
  searchParams: {
    date?: string;
  };
}) {
  const date = searchParams?.date || new Date().toISOString().split('T')[0];

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
        Loading Exit Lamp Checklist...
      </div>
    }>
      <ExitLampChecklistContent date={date} />
    </Suspense>
  );
}
