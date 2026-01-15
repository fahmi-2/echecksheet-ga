// /app/status-inspector-pre-assy/page.tsx

"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import { DetailModal } from "@/components/ui/detailmodal"
import Link from "next/link"
import React from "react"

interface CheckPoint {
  id: number
  no: number
  itemCheck: string
  checkPoint: string
  method: string
  area: {
    tensile: boolean
    crossSection: boolean
    cutting: boolean
    pa: boolean
  }
  shift: "A" | "B"
  schedule: string // Jadwal pengecekan: "Setiap Hari", "Senin & Kamis", "Rabu", dll.
}

interface CheckResult {
  status: "OK" | "NG"
  ngCount: number
  items: Array<{
    name: string
    status: "OK" | "NG" | "N/A"
    notes: string
  }>
  notes: string
  submittedAt: string
  submittedBy: string
}

export default function StatusInspectorPreAssyPage() {
  const router = useRouter()
  const { user } = useAuth()

  // 🔐 Redirect ke login jika belum login
  useEffect(() => {
    if (!user) {
      router.push("/login-page")
    }
  }, [user, router])

  // Tanggal sekarang
  const todayDate = new Date() // ⭐ DINAMIS — gunakan tanggal sekarang
  const todayDay = todayDate.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const todayWeekNumber = Math.ceil(todayDate.getDate() / 7) // Minggu ke-X

  // Compute 0-based indexes for the table grid (weeks array is 0..4, days are Mon..Sat => 0..5)
  const todayWeekIndex = todayWeekNumber - 1
  // map JS day -> table day index: Mon(1)->0 ... Sat(6)->5; Sun(0) => -1 (not shown)
  const todayDayIndex = todayDay === 0 ? -1 : todayDay - 1

  // Data dari Excel Sheet1 (DCIPA.xlsx)
  const [checkpoints] = useState<CheckPoint[]>([
    // No 1 - BOLPOINT & MARKER
    {
      id: 1,
      no: 1,
      itemCheck: "BOLPOINT & MARKER",
      checkPoint: "1A. TERDAPAT STICKER \"E\"",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Hari", // ✅ Dicek setiap hari
    },
    {
      id: 1.1,
      no: 1,
      itemCheck: "BOLPOINT & MARKER",
      checkPoint: "1A. TERDAPAT STICKER \"E\"",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    // No 2 - MICROMETER
    {
      id: 2,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 2.1,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    {
      id: 2.2,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2B. ANGKA TERBACA DENGAN JELAS (LAYAR TIDAK MUNCUL HURUF \"B\",''H'',''INS'' atau ''P'').",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 2.3,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2B. ANGKA TERBACA DENGAN JELAS (LAYAR TIDAK MUNCUL HURUF \"B\",''H'',''INS'' atau ''P'').",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 2.4,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2C. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.000\").",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 2.5,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2C. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.000\").",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 2.6,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2D. KONDISI ANVIL DAN SPINDLE OK (TIDAK ADA KARAT DAN BERPUTAR LONGGAR PADA BAGIAN PENGUKURAN).",
      method: "VISUAL, SENTUH",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 2.7,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2D. KONDISI ANVIL DAN SPINDLE OK (TIDAK ADA KARAT DAN BERPUTAR LONGGAR PADA BAGIAN PENGUKURAN).",
      method: "VISUAL, SENTUH",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 2.8,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2E. BAUT PENGUNCI TIDAK LONGGAR / DOL (CEK TANDA PADA SCREW)",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 2.9,
      no: 2,
      itemCheck: "MICROMETER",
      checkPoint: "2E. BAUT PENGUNCI TIDAK LONGGAR / DOL (CEK TANDA PADA SCREW)",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    // No 3 - CALIPER
    {
      id: 3,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 3.1,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    {
      id: 3.2,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3B. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.00\").",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 3.3,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3B. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.00\").",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 3.4,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3C. PENGGESER BERGERAK DENGAN LANCAR, TIDAK ADA BAGIAN YANG DEFORMASI, BERKARAT, RUSAK DAN TIDAK ADA BENDA YANG MENEMPEL PADA BAGIAN PENGUKURAN",
      method: "VISUAL, SENTUH",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 3.5,
      no: 3,
      itemCheck: "CALIPER",
      checkPoint: "3C. PENGGESER BERGERAK DENGAN LANCAR, TIDAK ADA BAGIAN YANG DEFORMASI, BERKARAT, RUSAK DAN TIDAK ADA BENDA YANG MENEMPEL PADA BAGIAN PENGUKURAN",
      method: "VISUAL, SENTUH",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    // No 4 - MESIN TENSILE
    {
      id: 4,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Selasa",
    },
    {
      id: 4.1,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Kamis",
    },
    {
      id: 4.2,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4B. ANGKA HASIL PENGUKURAN PADA LAYAR TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.3,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4B. ANGKA HASIL PENGUKURAN PADA LAYAR TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 4.4,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4C. MESIN TENSILE DALAM KONDISI BAIK DAN BAGIANNYA TIDAK ADA YANG RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Selasa",
    },
    {
      id: 4.5,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4C. MESIN TENSILE DALAM KONDISI BAIK DAN BAGIANNYA TIDAK ADA YANG RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Kamis",
    },
    {
      id: 4.6,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4D. SAAT DI OPERASIKAN TIDAK ADA KONDISI ATAU MUNCUL SUARA YANG ABNORMAL.",
      method: "VISUAL / DI DENGARKAN",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.7,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4D. SAAT DI OPERASIKAN TIDAK ADA KONDISI ATAU MUNCUL SUARA YANG ABNORMAL.",
      method: "VISUAL / DI DENGARKAN",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 4.8,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4E. SAAT DI OPERASIKAN ANGKA PENGUKURAN DI LAYAR STABIL ATAU TIDAK BERUBAH-UBAH",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.9,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4E. SAAT DI OPERASIKAN ANGKA PENGUKURAN DI LAYAR STABIL ATAU TIDAK BERUBAH-UBAH",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 4.10,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4F. SEBELUM DI LAKUKAN PENGUKURAN, BISA DI SETTING \"0\" UNTUK ANGKA PENGUKURAN.",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.11,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4F. SEBELUM DI LAKUKAN PENGUKURAN, BISA DI SETTING \"0\" UNTUK ANGKA PENGUKURAN.",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 4.12,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4G. PASTIKAN GRIPER BISA BERHENTI PADA POSISI STOPPER YANG DITENTUKAN",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.13,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4G. PASTIKAN GRIPER BISA BERHENTI PADA POSISI STOPPER YANG DITENTUKAN",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 4.14,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4H. TOMBOL EMERGENCY BISA BERFUNGSI",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 4.15,
      no: 4,
      itemCheck: "MESIN TENSILE",
      checkPoint: "4H. TOMBOL EMERGENCY BISA BERFUNGSI",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    // No 5 - STEEL RULER
    {
      id: 5,
      no: 5,
      itemCheck: "STEEL RULER",
      checkPoint: "5A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 5.1,
      no: 5,
      itemCheck: "STEEL RULER",
      checkPoint: "5A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    {
      id: 5.2,
      no: 5,
      itemCheck: "STEEL RULER",
      checkPoint: "5B. STEEL RULER TIDAK BERKARAT DAN ANGKA TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 5.3,
      no: 5,
      itemCheck: "STEEL RULER",
      checkPoint: "5B. STEEL RULER TIDAK BERKARAT DAN ANGKA TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    // No 6 - BENT UP / DOWN GAUGE
    {
      id: 6,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 6.1,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    {
      id: 6.2,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6B. GAUGE DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 6.3,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6B. GAUGE DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    {
      id: 6.4,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6C. BISA MENDETEKSI KONDISI OK DAN N-OK MELALUI SAMPLE OK DAN N-OK",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 6.5,
      no: 6,
      itemCheck: "BENT UP / DOWN GAUGE",
      checkPoint: "6C. BISA MENDETEKSI KONDISI OK DAN N-OK MELALUI SAMPLE OK DAN N-OK",
      method: "DICOBA",
      area: { tensile: true, crossSection: false, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    // No 7 - THICKNESS GAUGE / GO NO GO M TERMINAL
    {
      id: 7,
      no: 7,
      itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL",
      checkPoint: "7A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED (EXPIRED DATE HANYA UNTUK THICKENESS GAUGE)",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 7.1,
      no: 7,
      itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL",
      checkPoint: "7A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED (EXPIRED DATE HANYA UNTUK THICKENESS GAUGE)",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    {
      id: 7.2,
      no: 7,
      itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL",
      checkPoint: "7B. GAUGE / GO NO GO DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 7.3,
      no: 7,
      itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL",
      checkPoint: "7B. GAUGE / GO NO GO DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: true, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    // No 8 - POCKET COMPARATOR
    {
      id: 8,
      no: 8,
      itemCheck: "POCKET COMPARATOR",
      checkPoint: "8A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 8.1,
      no: 8,
      itemCheck: "POCKET COMPARATOR",
      checkPoint: "8A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    {
      id: 8.2,
      no: 8,
      itemCheck: "POCKET COMPARATOR",
      checkPoint: "8B. POCKET COMPARATOR DALAM KONDISI BAIK, TIDAK RUSAK DAN BISA MELIHAT SECARA JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Senin",
    },
    {
      id: 8.3,
      no: 8,
      itemCheck: "POCKET COMPARATOR",
      checkPoint: "8B. POCKET COMPARATOR DALAM KONDISI BAIK, TIDAK RUSAK DAN BISA MELIHAT SECARA JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Rabu",
    },
    // No 9 - CRIMPING STANDARD & IS
    {
      id: 9,
      no: 9,
      itemCheck: "CRIMPING STANDARD & IS",
      checkPoint: "9A. TIDAK RUSAK / TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 9.1,
      no: 9,
      itemCheck: "CRIMPING STANDARD & IS",
      checkPoint: "9A. TIDAK RUSAK / TERBACA DENGAN JELAS",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    {
      id: 9.2,
      no: 9,
      itemCheck: "CRIMPING STANDARD & IS",
      checkPoint: "9B. ADA STAMP CONTROL DAN STAMP \"CONFIDENTIAL\"",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 9.3,
      no: 9,
      itemCheck: "CRIMPING STANDARD & IS",
      checkPoint: "9B. ADA STAMP CONTROL DAN STAMP \"CONFIDENTIAL\"",
      method: "VISUAL",
      area: { tensile: true, crossSection: true, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    // No 10 - TROLLY INSPECTOR
    {
      id: 10,
      no: 10,
      itemCheck: "TROLLY INSPECTOR",
      checkPoint: "10A. TROLLY DALAM KONDISI BAIK DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 10.1,
      no: 10,
      itemCheck: "TROLLY INSPECTOR",
      checkPoint: "10A. TROLLY DALAM KONDISI BAIK DAN TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    {
      id: 10.2,
      no: 10,
      itemCheck: "TROLLY INSPECTOR",
      checkPoint: "10B. TEMPAT CUP TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: true, pa: true },
      shift: "A",
      schedule: "Setiap Rabu",
    },
    {
      id: 10.3,
      no: 10,
      itemCheck: "TROLLY INSPECTOR",
      checkPoint: "10B. TEMPAT CUP TIDAK RUSAK",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: true, pa: true },
      shift: "B",
      schedule: "Setiap Jumat",
    },
    // No 11 - LAMPU UV
    {
      id: 11,
      no: 11,
      itemCheck: "LAMPU UV",
      checkPoint: "11A. ADA 2 LAMPU DI AREA INSPEKSI UV",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 11.1,
      no: 11,
      itemCheck: "LAMPU UV",
      checkPoint: "11A. ADA 2 LAMPU DI AREA INSPEKSI UV",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 11.2,
      no: 11,
      itemCheck: "LAMPU UV",
      checkPoint: "11B. SAAT DIOPERASIKAN LAMPU MENYALA TERANG (TIDAK ADA LAMPU LED YANG MATI ≥ 3 PCS DALAM LENSA UV)",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 11.3,
      no: 11,
      itemCheck: "LAMPU UV",
      checkPoint: "11B. SAAT DIOPERASIKAN LAMPU MENYALA TERANG (TIDAK ADA LAMPU LED YANG MATI ≥ 3 PCS DALAM LENSA UV)",
      method: "VISUAL",
      area: { tensile: false, crossSection: false, cutting: false, pa: true },
      shift: "B",
      schedule: "Setiap Hari",
    },
    // No 12 - MESIN SIMPLE CROSS SECTION
    {
      id: 12,
      no: 12,
      itemCheck: "MESIN SIMPLE CROSS SECTION",
      checkPoint: "12A. TOMBOL ON OFF BERFUNGSI, TIDAK RUSAK DAN LAMPU INDIKATOR MENYALA",
      method: "VISUAL",
      area: { tensile: false, crossSection: true, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 12.1,
      no: 12,
      itemCheck: "MESIN SIMPLE CROSS SECTION",
      checkPoint: "12A. TOMBOL ON OFF BERFUNGSI, TIDAK RUSAK DAN LAMPU INDIKATOR MENYALA",
      method: "VISUAL",
      area: { tensile: false, crossSection: true, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
    {
      id: 12.2,
      no: 12,
      itemCheck: "MESIN SIMPLE CROSS SECTION",
      checkPoint: "12B. TIDAK BERBAU ASAP DAN STOP KONTAK TERPASANG SEMPURNA",
      method: "VISUAL",
      area: { tensile: false, crossSection: true, cutting: false, pa: false },
      shift: "A",
      schedule: "Setiap Hari",
    },
    {
      id: 12.3,
      no: 12,
      itemCheck: "MESIN SIMPLE CROSS SECTION",
      checkPoint: "12B. TIDAK BERBAU ASAP DAN STOP KONTAK TERPASANG SEMPURNA",
      method: "VISUAL",
      area: { tensile: false, crossSection: true, cutting: false, pa: false },
      shift: "B",
      schedule: "Setiap Hari",
    },
  ])

  // 🔹 State hasil checklist harian dari localStorage
  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dailyCheckResults")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // 🔹 Load data dari localStorage dan listen untuk perubahan
  useEffect(() => {
    const loadResults = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("dailyCheckResults")
        setResults(saved ? JSON.parse(saved) : {})
      }
    }

    loadResults()

    // Listen untuk perubahan di tab/window lain
    const handleStorage = () => loadResults()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Generate 5 minggu × 6 hari (Senin-Sabtu)
  const weeks = useMemo(() => {
    return [
      { week: "Minggu -1", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
      { week: "Minggu -2", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
      { week: "Minggu -3", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
      { week: "Minggu -4", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
      { week: "Minggu -5", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
    ]
  }, [])

  // 🔹 Get result dari localStorage
  const getResult = (weekIndex: number, dayIndex: number, checkpointId: number, shift: "A" | "B") => {
    const weekKey = `week-${weekIndex + 1}`
    const dayKey = `${weeks[weekIndex].days[dayIndex]}`
    const checkpointKey = `${checkpointId}-${shift}`

    const dateKey = `${weekKey}-${dayKey}`
    return results[dateKey]?.[checkpointKey] || null
  }

  // 🔹 Modal state
  const [modalData, setModalData] = useState<{
    weekIndex: number
    dayIndex: number
    checkpoint: CheckPoint
    result: CheckResult
  } | null>(null)

  // 🔹 Fungsi untuk menentukan apakah hari ini perlu dicek berdasarkan schedule
  const isDayNeeded = (schedule: string, dayName: string) => {
    if (schedule === "Setiap Hari") return true
    if (schedule === "Setiap Senin & Kamis") return dayName === "Se" || dayName === "Km"
    if (schedule === "Setiap Selasa & Jumat") return dayName === "Sl" || dayName === "Jm"
    if (schedule === "Setiap Rabu") return dayName === "Rb"
    return false
  }

  // 🔹 Fungsi untuk menentukan apakah hari ini atau sebelumnya
  // Only treat the cell matching today's week & day as "today"; do not mark previous days.
  const isTodayCell = (weekIndex: number, dayIndex: number) => {
    return weekIndex === todayWeekIndex && dayIndex === todayDayIndex
  }

  // 🔹 Render status cell dengan logika real-time
  const renderStatusCell = (weekIndex: number, dayIndex: number, checkpoint: CheckPoint) => {
    const dayName = weeks[weekIndex].days[dayIndex]
    const isNeeded = isDayNeeded(checkpoint.schedule, dayName)
    const isTodayOrBeforeFlag = isTodayCell(weekIndex, dayIndex)

    // Jika hari tidak perlu dicek → tampilkan sel abu-abu
    if (!isNeeded) {
      return <div className="status-cell-gray"></div>
    }

    // Jika hari perlu dicek tapi bukan hari ini → tampilkan sel abu-abu
    if (!isTodayOrBeforeFlag) {
      return <div className="status-cell-gray"></div>
    }

    // Jika hari perlu dicek dan hari ini/sebelumnya → tampilkan status
    const result = getResult(weekIndex, dayIndex, checkpoint.id, checkpoint.shift)

    // Jika ada result (sudah dicek)
    if (result) {
      return (
        <span
          className={`status-badge ${result.status === "OK" ? "status-badge-ok" : "status-badge-ng"} text-xs px-1 py-0.5 rounded cursor-pointer inline-block`}
          onClick={() => setModalData({ weekIndex, dayIndex, checkpoint, result })}
          title={`Status: ${result.status}${result.status === "NG" ? ` (${result.ngCount})` : ""}`}
        >
          {result.status === "OK" ? "OK" : `NG (${result.ngCount})`}
        </span>
      )
    }

    // Jika belum ada result → tampilkan tombol CHECK
    return (
      <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer inline-block">
        CHECK
      </span>
    )
  }

  // 🔐 Jika user null, tidak render
  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>Daily Check Inspector Pre Assy (DCIPA)</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
            <a href="/login-page" className="logout-link">
              Logout
            </a>
          </div>
        </div>

        {/* Status Table */}
        <div className="status-table-section">
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                <tr>
                  <th rowSpan={2} className="col-no">No</th>
                  <th rowSpan={2} className="col-item">Item Check</th>
                  <th rowSpan={2} className="col-checkpoint">Check Point</th>
                  <th rowSpan={2} className="col-method">Metode Check</th>
                  <th rowSpan={2} className="col-area">TENSILE</th>
                  <th rowSpan={2} className="col-area">CROSS SECTION</th>
                  <th rowSpan={2} className="col-area">CUTTING</th>
                  <th rowSpan={2} className="col-area">PA</th>
                  <th rowSpan={2} className="col-shift">Shift</th>
                  {weeks.map((week, wIdx) => (
                    <th key={wIdx} colSpan={6} className="col-week-header" >
                      {week.week}
                    </th>
                  ))}
                </tr>
                <tr>
                  {weeks.map((week, wIdx) => (
                    <React.Fragment key={wIdx}>
                      {week.days.map((day, dIdx) => (
                        <th key={`${wIdx}-${dIdx}`} className="col-day">
                          {day}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  new Map(
                    checkpoints.map((cp) => [
                      Math.floor(cp.id), // group key: 1, 2, 3, ... (untuk grouping No)
                      checkpoints.filter((item) => Math.floor(item.id) === Math.floor(cp.id)),
                    ])
                  ).values()
                ).map((group, groupIndex) => {
                  // Hitung jumlah baris per nomor
                  const rowCount = group.length

                  return (
                    <React.Fragment key={groupIndex}>
                      {group.map((checkpoint, index) => (
                        <tr key={`${checkpoint.id}-${checkpoint.shift}`}>
                          {/* Kolom No - hanya tampil di baris pertama */}
                          {index === 0 && (
                            <td rowSpan={rowCount} className="col-no">
                              {checkpoint.no}
                            </td>
                          )}

                          {/* Kolom Item Check - hanya tampil di baris pertama */}
                          {index === 0 && (
                            <td rowSpan={rowCount} className="col-item">
                              {checkpoint.itemCheck}
                            </td>
                          )}

                          {/* Kolom Check Point - hanya tampil di baris pertama */}
                          {index === 0 && (
                            <td rowSpan={rowCount} className="col-checkpoint">
                              {checkpoint.checkPoint}
                            </td>
                          )}

                          {/* Kolom Metode Check - hanya tampil di baris pertama */}
                          {index === 0 && (
                            <td rowSpan={rowCount} className="col-method">
                              {checkpoint.method}
                            </td>
                          )}

                          {/* Kolom Area - TENSILE */}
                          <td className="col-area text-center">
                            {checkpoint.area.tensile ? "√" : "-"}
                          </td>

                          {/* Kolom Area - CROSS SECTION */}
                          <td className="col-area text-center">
                            {checkpoint.area.crossSection ? "√" : "-"}
                          </td>

                          {/* Kolom Area - CUTTING */}
                          <td className="col-area text-center">
                            {checkpoint.area.cutting ? "√" : "-"}
                          </td>

                          {/* Kolom Area - PA */}
                          <td className="col-area text-center">
                            {checkpoint.area.pa ? "√" : "-"}
                          </td>

                          {/* Kolom Shift */}
                          <td className="col-shift">{checkpoint.shift}</td>

                          {/* Kolom Minggu dan Hari */}
                          {weeks.map((week, wIdx) => (
                            <React.Fragment key={wIdx}>
                              {week.days.map((day, dIdx) => (
                                <td
                                  key={`${wIdx}-${dIdx}`}
                                  className={`col-date px-1 py-1 text-xs border ${
                                    isDayNeeded(checkpoint.schedule, day) && isTodayCell(wIdx, dIdx) ? "bg-white" : "bg-gray-200"
                                  }`}
                                >
                                  {renderStatusCell(wIdx, dIdx, checkpoint)}
                                </td>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DetailModal */}
        {modalData && (
          <DetailModal
            data={{
              date: modalData.weekIndex + 1, // sebagai identifikasi minggu
              checkpoint: {
                checkPoint: modalData.checkpoint.checkPoint,
                shift: modalData.checkpoint.shift,
                waktuCheck: "", // bisa diisi jika ada info waktu
                method: modalData.checkpoint.method, // ✅ ini akan digunakan oleh modal
              },
              result: modalData.result,
            }}
            onClose={() => setModalData(null)}
          />
        )}
      </div>
    </div>
  )
}