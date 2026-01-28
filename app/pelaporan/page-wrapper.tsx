"use client"

import { Suspense } from "react"
import PelaporanPageContent from "./pelaporan-content"

export default function PelaporanPage() {
  return (
    <Suspense fallback={<div style={{padding: "20px", textAlign: "center"}}>Memuat form pelaporan...</div>}>
      <PelaporanPageContent />
    </Suspense>
  )
}
