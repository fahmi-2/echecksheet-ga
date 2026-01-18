// app/e-checksheet-content/page.tsx
import { Suspense } from 'react';
import { EChecksheetContentForm } from './EChecksheetContentForm';

export default function EChecksheetContentPage({
  searchParams,
}: {
  searchParams: {
    id?: string;
    shift?: string;
    date?: string;
    mainType?: string;
    subType?: string;
    checkType?: string;
    timeSlot?: string;
    checkPoint?: string;
  };
}) {
  const id = searchParams.id || '';
  const shift = searchParams.shift || '';
  const date = searchParams.date || '';
  const mainType = searchParams.mainType || 'final-assy';
  const subType = searchParams.subType || 'group-leader';
  const checkType = searchParams.checkType || 'daily-check';
  const timeSlot = searchParams.timeSlot || '';
  const checkPoint = searchParams.checkPoint || 'Checkpoint';

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
        Loading checklist form...
      </div>
    }>
      <EChecksheetContentForm
        id={id}
        shift={shift}
        date={date}
        mainType={mainType}
        subType={subType}
        checkType={checkType}
        timeSlot={timeSlot}
        checkPoint={checkPoint}
      />
    </Suspense>
  );
}