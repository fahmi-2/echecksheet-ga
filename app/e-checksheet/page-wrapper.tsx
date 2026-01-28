"use client"

import { Suspense } from "react"
import EChecksheetContent from "./e-checksheet-content"

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: "20px", textAlign: "center"}}>Memuat checklist...</div>}>
      <EChecksheetContent />
    </Suspense>
  )
}
