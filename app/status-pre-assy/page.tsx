"use client"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import { DetailModal } from "@/components/ui/detailmodal"
import React from "react"
import Link from "next/link"

// 🔹 Tipe Umum
interface CheckResult {
  status: "OK" | "NG"
  ngCount: number
  items: Array<{ name: string; status: "OK" | "NG" | "N/A"; notes: string }>
  notes: string
  submittedAt: string
  submittedBy: string
}

// 🔹 Tipe Daily Check
interface DailyCheckPoint {
  id: number
  checkPoint: string
  shift: "A" | "B"
  waktuCheck: string
  standard: string
}

// 🔹 Tipe CC & Stripping
interface CcStrippingCheckPoint {
  id: number
  machine: string
  kind: string
  size: string
  shift: "A" | "B"
}

// 🔹 Tipe Daily Check Ins. (dari status-inspector-pre-assy)
interface DailyCheckInsPoint {
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
  schedule: string
}

export default function PreAssyGLStatusPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user || user.role !== "group-leader") {
      router.push("/login-page")
    }
  }, [user, router])

  const [viewMode, setViewMode] = useState<"daily" | "cc-stripping" | "daily-check-ins">("daily")

  // 🔹 DATA: Daily Check (14 item)
  const DAILY_CHECKPOINTS: DailyCheckPoint[] = useMemo(() => [
    { id: 1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", standard: "Check pengisian C/S 4M", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 1.1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", standard: "Check pengisian C/S 4M", shift: "B", waktuCheck: "Setiap Hari" },
    { id: 2, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 2.1, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )", shift: "B", waktuCheck: "Setiap Hari" },
    { id: 3, checkPoint: "Circuit defect yang ada di hanger merah sudah terpasang defective tag...", standard: "", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 3.1, checkPoint: "Circuit defect yang ada di hanger merah sudah terpasang defective tag...", standard: "", shift: "B", waktuCheck: "Setiap Hari" },
    { id: 4, checkPoint: "Inspector check visual terminal dengan memisahkan 1 lot menjadi beberapa bagian...", standard: "Sesuai IS no. QA-ACL-PA-IS-031", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 4.1, checkPoint: "Inspector check visual terminal dengan memisahkan 1 lot menjadi beberapa bagian...", standard: "Sesuai IS no. QA-ACL-PA-IS-031", shift: "B", waktuCheck: "Setiap Hari" },
    { id: 5, checkPoint: "Cek implementasi pengecekan circuit A/B (Countermeasure claim no stripping J53C)", standard: "Sesuai IS no. QA-ACL-PA-IS-031 hal. 4", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 5.1, checkPoint: "Cek implementasi pengecekan circuit A/B (Countermeasure claim no stripping J53C)", standard: "Sesuai IS no. QA-ACL-PA-IS-031 hal. 4", shift: "B", waktuCheck: "Setiap Hari" },
    { id: 6, checkPoint: "Circuit di supply dan di letakan di store sesuai dengan address...", standard: "Sampling check circuit yang ada di store", shift: "A", waktuCheck: "Setiap Senin & Kamis" },
    { id: 6.1, checkPoint: "Circuit di supply dan di letakan di store sesuai dengan address...", standard: "Sampling check circuit yang ada di store", shift: "B", waktuCheck: "Setiap Senin & Kamis" },
    { id: 7, checkPoint: "Jumlah circuit di troli tidak melebihi kapasitas trolly...", standard: "Check kondisi actual ( sampling check min. 3 inspector )", shift: "A", waktuCheck: "Setiap Senin & Kamis" },
    { id: 7.1, checkPoint: "Jumlah circuit di troli tidak melebihi kapasitas trolly...", standard: "Check kondisi actual ( sampling check min. 3 inspector )", shift: "B", waktuCheck: "Setiap Senin & Kamis" },
    { id: 8, checkPoint: "Cup di trolly di tempatkan sesuai dengan tempat yang di sediakan...", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "A", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 8.1, checkPoint: "Cup di trolly di tempatkan sesuai dengan tempat yang di sediakan...", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "B", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 9, checkPoint: "Cek kondisi Micrometer, Gauge, Tool dan Alat Potong", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "A", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 9.1, checkPoint: "Cek kondisi Micrometer, Gauge, Tool dan Alat Potong", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "B", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 10, checkPoint: "Daily Check Inspector sudah diisi dan update sesuai kondisi actual", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "A", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 10.1, checkPoint: "Daily Check Inspector sudah diisi dan update sesuai kondisi actual", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012", shift: "B", waktuCheck: "Setiap Selasa & Jumat" },
    { id: 11, checkPoint: "Tidak ada bagian trolly inspector yang rusak", standard: "Check kondisi actual", shift: "A", waktuCheck: "1 Inspector / Minggu" },
    { id: 11.1, checkPoint: "Tidak ada bagian trolly inspector yang rusak", standard: "Check kondisi actual", shift: "B", waktuCheck: "1 Inspector / Minggu" },
    { id: 12, checkPoint: "Inspector bekerja sesuai dengan urutan yang ada di SWCT", standard: "Check actual dengan SWCT", shift: "A", waktuCheck: "1 Inspector / Minggu" },
    { id: 12.1, checkPoint: "Inspector bekerja sesuai dengan urutan yang ada di SWCT", standard: "Check actual dengan SWCT", shift: "B", waktuCheck: "1 Inspector / Minggu" },
    { id: 13, checkPoint: "Stop kontak dalam keadaan bersih tidak berdebu...", standard: "Check kondisi actual", shift: "A", waktuCheck: "Setiap Selasa" },
    { id: 13.1, checkPoint: "Stop kontak dalam keadaan bersih tidak berdebu...", standard: "Check kondisi actual", shift: "B", waktuCheck: "Setiap Selasa" },
    { id: 14, checkPoint: "Memastikan semua inspector menggunakan penutup kepala...", standard: "Check kondisi actual", shift: "A", waktuCheck: "Setiap Hari" },
    { id: 14.1, checkPoint: "Memastikan semua inspector menggunakan penutup kepala...", standard: "Check kondisi actual", shift: "B", waktuCheck: "Setiap Hari" },
  ], [])

  // 🔹 DATA: CC & Stripping (17 mesin)
  const CC_STRIPPING_CHECKPOINTS: CcStrippingCheckPoint[] = useMemo(() => [
    { id: 1, machine: "AC90 TRX 01", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 1.1, machine: "AC90 TRX 01", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 2, machine: "AC90 TRX 02", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 2.1, machine: "AC90 TRX 02", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 3, machine: "AC90 TRX 03", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 3.1, machine: "AC90 TRX 03", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 4, machine: "AC90 TRX 04", kind: "CIVUS", size: "0.35", shift: "A" },
    { id: 4.1, machine: "AC90 TRX 04", kind: "CIVUS", size: "0.35", shift: "B" },
    { id: 5, machine: "AC90 TRX 05", kind: "AVSS", size: "2.0", shift: "A" },
    { id: 5.1, machine: "AC90 TRX 05", kind: "AVSS", size: "2.0", shift: "B" },
    { id: 6, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.0", shift: "A" },
    { id: 6.1, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.0", shift: "B" },
    { id: 7, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.5", shift: "A" },
    { id: 7.1, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.5", shift: "B" },
    { id: 8, machine: "AC90 TRX 07", kind: "ALVUS", size: "0.75", shift: "A" },
    { id: 8.1, machine: "AC90 TRX 07", kind: "ALVUS", size: "0.75", shift: "B" },
    { id: 9, machine: "AC90 TRX 07", kind: "ALVUS", size: "1.25", shift: "A" },
    { id: 9.1, machine: "AC90 TRX 07", kind: "ALVUS", size: "1.25", shift: "B" },
    { id: 10, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.5", shift: "A" },
    { id: 10.1, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.5", shift: "B" },
    { id: 11, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.75", shift: "A" },
    { id: 11.1, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.75", shift: "B" },
    { id: 12, machine: "AC90 TRX 09", kind: "ALVUS", size: "0.5", shift: "A" },
    { id: 12.1, machine: "AC90 TRX 09", kind: "ALVUS", size: "0.5", shift: "B" },
    { id: 13, machine: "AC90 TRX 10", kind: "CAVS", size: "0.3", shift: "A" },
    { id: 13.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.3", shift: "B" },
    { id: 14, machine: "AC90 TRX 10", kind: "CAVS", size: "0.5", shift: "A" },
    { id: 14.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.5", shift: "B" },
    { id: 15, machine: "AC90 TRX 10", kind: "CAVS", size: "0.85", shift: "A" },
    { id: 15.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.85", shift: "B" },
    { id: 16, machine: "AC90 TRX 10", kind: "AESSX", size: "0.3", shift: "A" },
    { id: 16.1, machine: "AC90 TRX 10", kind: "AESSX", size: "0.3", shift: "B" },
    { id: 17, machine: "AC90 TRX 10", kind: "CIVUS", size: "0.35", shift: "A" },
    { id: 17.1, machine: "AC90 TRX 10", kind: "CIVUS", size: "0.35", shift: "B" },
  ], [])

  // 🔹 DATA: Daily Check Ins. (SESUAI EXCEL DCIPA.xlsx)
  const DAILY_CHECK_INS_CHECKPOINTS: DailyCheckInsPoint[] = useMemo(() => [
    // No 1 - BOLPOINT & MARKER
    { id: 1, no: 1, itemCheck: "BOLPOINT & MARKER", checkPoint: "1A. TERDAPAT STICKER \"E\"", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 1.1, no: 1, itemCheck: "BOLPOINT & MARKER", checkPoint: "1A. TERDAPAT STICKER \"E\"", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 2 - MICROMETER
    { id: 2, no: 2, itemCheck: "MICROMETER", checkPoint: "2A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 2.1, no: 2, itemCheck: "MICROMETER", checkPoint: "2A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 2.2, no: 2, itemCheck: "MICROMETER", checkPoint: "2B. ANGKA TERBACA DENGAN JELAS (LAYAR TIDAK MUNCUL HURUF \"B\",\"H\",\"INS\" atau \"P\").", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 2.3, no: 2, itemCheck: "MICROMETER", checkPoint: "2B. ANGKA TERBACA DENGAN JELAS (LAYAR TIDAK MUNCUL HURUF \"B\",\"H\",\"INS\" atau \"P\").", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 2.4, no: 2, itemCheck: "MICROMETER", checkPoint: "2C. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.000\").", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 2.5, no: 2, itemCheck: "MICROMETER", checkPoint: "2C. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.000\").", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 2.6, no: 2, itemCheck: "MICROMETER", checkPoint: "2D. KONDISI ANVIL DAN SPINDLE OK (TIDAK ADA KARAT DAN BERPUTAR LONGGAR PADA BAGIAN PENGUKURAN).", method: "VISUAL, SENTUH", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 2.7, no: 2, itemCheck: "MICROMETER", checkPoint: "2D. KONDISI ANVIL DAN SPINDLE OK (TIDAK ADA KARAT DAN BERPUTAR LONGGAR PADA BAGIAN PENGUKURAN).", method: "VISUAL, SENTUH", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 2.8, no: 2, itemCheck: "MICROMETER", checkPoint: "2E. BAUT PENGUNCI TIDAK LONGGAR / DOL (CEK TANDA PADA SCREW)", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 2.9, no: 2, itemCheck: "MICROMETER", checkPoint: "2E. BAUT PENGUNCI TIDAK LONGGAR / DOL (CEK TANDA PADA SCREW)", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 3 - CALIPER
    { id: 3, no: 3, itemCheck: "CALIPER", checkPoint: "3A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 3.1, no: 3, itemCheck: "CALIPER", checkPoint: "3A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 3.2, no: 3, itemCheck: "CALIPER", checkPoint: "3B. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.00\").", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 3.3, no: 3, itemCheck: "CALIPER", checkPoint: "3B. ZERO SETTING OK (LAYAR MENUNJUKKAN \"0.00\").", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 3.4, no: 3, itemCheck: "CALIPER", checkPoint: "3C. PENGGESER BERGERAK DENGAN LANCAR, TIDAK ADA BAGIAN YANG DEFORMASI, BERKARAT, RUSAK DAN TIDAK ADA BENDA YANG MENEMPEL PADA BAGIAN PENGUKURAN", method: "VISUAL, SENTUH", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 3.5, no: 3, itemCheck: "CALIPER", checkPoint: "3C. PENGGESER BERGERAK DENGAN LANCAR, TIDAK ADA BAGIAN YANG DEFORMASI, BERKARAT, RUSAK DAN TIDAK ADA BENDA YANG MENEMPEL PADA BAGIAN PENGUKURAN", method: "VISUAL, SENTUH", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 4 - MESIN TENSILE
    { id: 4, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.1, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.2, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4B. ANGKA HASIL PENGUKURAN PADA LAYAR TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.3, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4B. ANGKA HASIL PENGUKURAN PADA LAYAR TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.4, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4C. MESIN TENSILE DALAM KONDISI BAIK DAN BAGIANNYA TIDAK ADA YANG RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.5, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4C. MESIN TENSILE DALAM KONDISI BAIK DAN BAGIANNYA TIDAK ADA YANG RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.6, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4D. SAAT DI OPERASIKAN TIDAK ADA KONDISI ATAU MUNCUL SUARA YANG ABNORMAL.", method: "VISUAL / DI DENGARKAN", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.7, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4D. SAAT DI OPERASIKAN TIDAK ADA KONDISI ATAU MUNCUL SUARA YANG ABNORMAL.", method: "VISUAL / DI DENGARKAN", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.8, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4E. SAAT DI OPERASIKAN ANGKA PENGUKURAN DI LAYAR STABIL ATAU TIDAK BERUBAH-UBAH", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.9, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4E. SAAT DI OPERASIKAN ANGKA PENGUKURAN DI LAYAR STABIL ATAU TIDAK BERUBAH-UBAH", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.10, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4F. SEBELUM DI LAKUKAN PENGUKURAN, BISA DI SETTING \"0\" UNTUK ANGKA PENGUKURAN.", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.11, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4F. SEBELUM DI LAKUKAN PENGUKURAN, BISA DI SETTING \"0\" UNTUK ANGKA PENGUKURAN.", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.12, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4G. PASTIKAN GRIPER BISA BERHENTI PADA POSISI STOPPER YANG DITENTUKAN", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.13, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4G. PASTIKAN GRIPER BISA BERHENTI PADA POSISI STOPPER YANG DITENTUKAN", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 4.14, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4H. TOMBOL EMERGENCY BISA BERFUNGSI", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 4.15, no: 4, itemCheck: "MESIN TENSILE", checkPoint: "4H. TOMBOL EMERGENCY BISA BERFUNGSI", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },

    // No 5 - STEEL RULER
    { id: 5, no: 5, itemCheck: "STEEL RULER", checkPoint: "5A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 5.1, no: 5, itemCheck: "STEEL RULER", checkPoint: "5A. ADA NOMOR REGISTER & KALIBRASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 5.2, no: 5, itemCheck: "STEEL RULER", checkPoint: "5B. STEEL RULER TIDAK BERKARAT DAN ANGKA TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 5.3, no: 5, itemCheck: "STEEL RULER", checkPoint: "5B. STEEL RULER TIDAK BERKARAT DAN ANGKA TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 6 - BENT UP/DOWN GAUGE
    { id: 6, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 6.1, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 6.2, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6B. GAUGE DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 6.3, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6B. GAUGE DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 6.4, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6C. BISA MENDETEKSI KONDISI OK DAN N-OK MELALUI SAMPLE OK DAN N-OK", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 6.5, no: 6, itemCheck: "BENT UP / DOWN GAUGE", checkPoint: "6C. BISA MENDETEKSI KONDISI OK DAN N-OK MELALUI SAMPLE OK DAN N-OK", method: "DICOBA", area: { tensile: true, crossSection: false, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },

    // No 7 - THICKNESS GAUGE / GO NO GO
    { id: 7, no: 7, itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL", checkPoint: "7A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED (EXPIRED DATE HANYA UNTUK THICKENESS GAUGE)", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 7.1, no: 7, itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL", checkPoint: "7A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED (EXPIRED DATE HANYA UNTUK THICKENESS GAUGE)", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 7.2, no: 7, itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL", checkPoint: "7B. GAUGE / GO NO GO DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 7.3, no: 7, itemCheck: "THICKNESS GAUGE / GO NO GO M TERMINAL", checkPoint: "7B. GAUGE / GO NO GO DALAM KONDISI BAIK, TIDAK BENT, TIDAK TAJAM DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: true, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 8 - POCKET COMPARATOR
    { id: 8, no: 8, itemCheck: "POCKET COMPARATOR", checkPoint: "8A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 8.1, no: 8, itemCheck: "POCKET COMPARATOR", checkPoint: "8A. ADA NOMOR REGISTER & VERIFIKASI TIDAK EXPIRED", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 8.2, no: 8, itemCheck: "POCKET COMPARATOR", checkPoint: "8B. POCKET COMPARATOR DALAM KONDISI BAIK, TIDAK RUSAK DAN BISA MELIHAT SECARA JELAS", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 8.3, no: 8, itemCheck: "POCKET COMPARATOR", checkPoint: "8B. POCKET COMPARATOR DALAM KONDISI BAIK, TIDAK RUSAK DAN BISA MELIHAT SECARA JELAS", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },

    // No 9 - CRIMPING STANDARD & IS
    { id: 9, no: 9, itemCheck: "CRIMPING STANDARD & IS", checkPoint: "9A. TIDAK RUSAK / TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 9.1, no: 9, itemCheck: "CRIMPING STANDARD & IS", checkPoint: "9A. TIDAK RUSAK / TERBACA DENGAN JELAS", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 9.2, no: 9, itemCheck: "CRIMPING STANDARD & IS", checkPoint: "9B. ADA STAMP CONTROL DAN STAMP \"CONFIDENTIAL\"", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 9.3, no: 9, itemCheck: "CRIMPING STANDARD & IS", checkPoint: "9B. ADA STAMP CONTROL DAN STAMP \"CONFIDENTIAL\"", method: "VISUAL", area: { tensile: true, crossSection: true, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 10 - TROLLY INSPECTOR
    { id: 10, no: 10, itemCheck: "TROLLY INSPECTOR", checkPoint: "10A. TROLLY DALAM KONDISI BAIK DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 10.1, no: 10, itemCheck: "TROLLY INSPECTOR", checkPoint: "10A. TROLLY DALAM KONDISI BAIK DAN TIDAK RUSAK", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 10.2, no: 10, itemCheck: "TROLLY INSPECTOR", checkPoint: "10B. TEMPAT CUP TIDAK RUSAK", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: true, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 10.3, no: 10, itemCheck: "TROLLY INSPECTOR", checkPoint: "10B. TEMPAT CUP TIDAK RUSAK", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: true, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 11 - LAMPU UV
    { id: 11, no: 11, itemCheck: "LAMPU UV", checkPoint: "11A. ADA 2 LAMPU DI AREA INSPEKSI UV", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 11.1, no: 11, itemCheck: "LAMPU UV", checkPoint: "11A. ADA 2 LAMPU DI AREA INSPEKSI UV", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },
    { id: 11.2, no: 11, itemCheck: "LAMPU UV", checkPoint: "11B. SAAT DIOPERASIKAN LAMPU MENYALA TERANG (TIDAK ADA LAMPU LED YANG MATI ≥ 3 PCS DALAM LENSA UV)", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "A", schedule: "Setiap Hari" },
    { id: 11.3, no: 11, itemCheck: "LAMPU UV", checkPoint: "11B. SAAT DIOPERASIKAN LAMPU MENYALA TERANG (TIDAK ADA LAMPU LED YANG MATI ≥ 3 PCS DALAM LENSA UV)", method: "VISUAL", area: { tensile: false, crossSection: false, cutting: false, pa: true }, shift: "B", schedule: "Setiap Hari" },

    // No 12 - MESIN SIMPLE CROSS SECTION
    { id: 12, no: 12, itemCheck: "MESIN SIMPLE CROSS SECTION", checkPoint: "12A. TOMBOL ON OFF BERFUNGSI, TIDAK RUSAK DAN LAMPU INDIKATOR MENYALA", method: "VISUAL", area: { tensile: false, crossSection: true, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 12.1, no: 12, itemCheck: "MESIN SIMPLE CROSS SECTION", checkPoint: "12A. TOMBOL ON OFF BERFUNGSI, TIDAK RUSAK DAN LAMPU INDIKATOR MENYALA", method: "VISUAL", area: { tensile: false, crossSection: true, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
    { id: 12.2, no: 12, itemCheck: "MESIN SIMPLE CROSS SECTION", checkPoint: "12B. TIDAK BERBAU ASAP DAN STOP KONTAK TERPASANG SEMPURNA", method: "VISUAL", area: { tensile: false, crossSection: true, cutting: false, pa: false }, shift: "A", schedule: "Setiap Hari" },
    { id: 12.3, no: 12, itemCheck: "MESIN SIMPLE CROSS SECTION", checkPoint: "12B. TIDAK BERBAU ASAP DAN STOP KONTAK TERPASANG SEMPURNA", method: "VISUAL", area: { tensile: false, crossSection: true, cutting: false, pa: false }, shift: "B", schedule: "Setiap Hari" },
  ], [])

  const storageKey = useMemo(
    () =>
      viewMode === "daily"
        ? "preAssyGroupLeaderDailyCheckResults"
        : viewMode === "cc-stripping"
        ? "preAssyGroupLeaderCcStrippingDailyCheckResults"
        : "preAssyInspectorDailyCheckResults",
    [viewMode]
  )

  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
    const load = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey)
        setResults(saved ? JSON.parse(saved) : {})
      }
    }
    load()
    const handler = () => load()
    window.addEventListener("storage", handler)
    const interval = setInterval(load, 500)
    const focusHandler = () => load()
    window.addEventListener("focus", focusHandler)
    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener("focus", focusHandler)
      clearInterval(interval)
    }
  }, [storageKey])

  const januaryDates = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  const today = new Date().getDate()
  const weekdays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  const timeSlots = ["01.00", "04.00", "08.00", "13.00", "16.00", "20.00"]

  // 🔹 Untuk Daily Check Ins - Grid minggu × hari
  const todayDate = new Date(2026, 0, 12) // Monday, January 12, 2026
  const todayDay = todayDate.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const todayWeekIndex = Math.floor((todayDate.getDate() - 1) / 7)
  const todayDayIndex = todayDay === 0 ? 6 : todayDay - 1

  const weeks = useMemo(() => [
    { week: "Minggu 1", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
    { week: "Minggu 2", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
    { week: "Minggu 3", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
    { week: "Minggu 4", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
    { week: "Minggu 5", days: ["Se", "Sl", "Rb", "Km", "Jm", "Sb"] },
  ], [])

  const getHari = (date: number): string | null => {
    const d = new Date(2026, 0, date)
    const dayIndex = d.getDay()
    if (dayIndex === 0 || dayIndex === 6) return null
    return weekdays[dayIndex - 1]
  }

  const getResult = (date: number, id: number, shift: "A" | "B", timeSlot?: string) => {
    const dateKey = `2026-01-${String(date).padStart(2, "0")}`
    const key = timeSlot ? `${id}-${shift}-${timeSlot}` : `${id}-${shift}`
    return results[dateKey]?.[key] || null
  }

  // 🔹 Get result untuk Daily Check Ins (minggu-hari format)
  const getResultDailyCheckIns = (weekIndex: number, dayIndex: number, checkpointId: number, shift: "A" | "B") => {
    const weekKey = `week-${weekIndex + 1}`
    const dayKey = `${weeks[weekIndex].days[dayIndex]}`
    const checkpointKey = `${checkpointId}-${shift}`
    const dateKey = `${weekKey}-${dayKey}`
    return results[dateKey]?.[checkpointKey] || null
  }

  const isDayNeeded = (schedule: string, dayName: string): boolean => {
    if (schedule === "Setiap Hari") return true
    return false
  }

  const isTodayOrPast = (weekIndex: number, dayIndex: number): boolean => {
    if (weekIndex < todayWeekIndex) return true
    if (weekIndex === todayWeekIndex && dayIndex <= todayDayIndex) return true
    return false
  }

  const [modalData, setModalData] = useState<{
    date?: number
    weekIndex?: number
    dayIndex?: number
    checkpoint: any
    timeSlot?: string
    result: CheckResult
  } | null>(null)

  // 🔹 Fungsi renderStatusCell yang diperbarui
  const renderStatusCell = (date: number, checkpoint: any, timeSlot?: string) => {
    const id = (checkpoint as any).id
    const shift = checkpoint.shift
    const result = getResult(date, id, shift, timeSlot)

    if (result) {
      return (
        <span
          className={`status-badge ${
            result.status === "OK" ? "status-badge-ok" : "status-badge-ng"
          } text-xs px-1 py-0.5 rounded cursor-pointer inline-block`}
          onClick={() => setModalData({ date, checkpoint, timeSlot, result })}
        >
          {result.status === "OK" ? "OK" : `NG${result.ngCount > 0 ? ` (${result.ngCount})` : ""}`}
        </span>
      )
    }

    if (viewMode === "cc-stripping") {
      if (!timeSlot) return null
      const hari = getHari(date)
      if (!hari) return null
      const [jam, menit] = timeSlot.split(".").map(Number)
      const now = new Date()
      const todayDate = now.getDate()
      const nowHour = now.getHours()
      const nowMinute = now.getMinutes()
      if (date === todayDate) {
        const currentTimeInMinutes = nowHour * 60 + nowMinute
        const checkTimeInMinutes = jam * 60 + menit
        const nextTimeSlot = timeSlots.find((ts) => {
          const [nextJam] = ts.split(".").map(Number)
          return nextJam * 60 > checkTimeInMinutes
        })
        let nextTimeInMinutes = nextTimeSlot ? parseInt(nextTimeSlot.split(".")[0]) * 60 : 23 * 60 + 59
        if (currentTimeInMinutes >= checkTimeInMinutes && currentTimeInMinutes < nextTimeInMinutes) {
          const dateStr = `2026-01-${String(date).padStart(2, "0")}`
          return (
            <Link
              href={`/e-checksheet?id=${id}&shift=${shift}&date=${dateStr}&timeSlot=${timeSlot}&mainType=pre-assy&checkType=cc-stripping&subType=group-leader`}
              className="block w-full h-full"
            >
              <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer flex items-center justify-center w-full h-full">
                CHECK
              </span>
            </Link>
          )
        }
        if (currentTimeInMinutes >= nextTimeInMinutes) {
          return <span className="status-badge status-badge-past text-xs px-1 py-0.5 rounded">-</span>
        }
      } else if (date < todayDate) {
        return <span className="status-badge status-badge-past text-xs px-1 py-0.5 rounded">-</span>
      }
      return null
    }

    if (date === today) {
      const dateStr = `2026-01-${String(date).padStart(2, "0")}`
      return (
        <Link
          href={`/e-checksheet?id=${id}&shift=${shift}&date=${dateStr}&mainType=pre-assy&subType=group-leader`}
          className="block w-full h-full"
        >
          <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer flex items-center justify-center w-full h-full">
            CHECK
          </span>
        </Link>
      )
    }
    return null
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />
      <div className="page-content">
        <div className="header">
          <h1>
            {viewMode === "daily"
              ? "Daily Check Group Leader Pre Assy"
              : viewMode === "cc-stripping"
              ? "CallCheck CC & Stripping GL Pre Assy"
              : "Daily Check Ins. Inspector Pre Assy"}
          </h1>
        </div>

        {/* 🔹 Switch Button */}
        <div className="button-group">
          <button
            className={`btn ${viewMode === "daily" ? "active" : ""}`}
            onClick={() => setViewMode("daily")}
          >
            📄 Daily Check
          </button>
          <button
            className={`btn ${viewMode === "cc-stripping" ? "active" : ""}`}
            onClick={() => setViewMode("cc-stripping")}
          >
            🔧 CC & Stripping
          </button>
          <button
            className={`btn ${viewMode === "daily-check-ins" ? "active" : ""}`}
            onClick={() => setViewMode("daily-check-ins")}
          >
            🔧 Daily Check Ins.
          </button>
        </div>

        <div className="status-table-section">
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                {viewMode === "daily" ? (
                  <>
                    <tr>
                      <th className="col-checkpoint text-center align-middle" rowSpan={2}>
                        Check Point
                      </th>
                      <th className="col-standard text-center align-middle" rowSpan={2}>
                        Standard / Metode
                      </th>
                      <th className="col-waktu text-center align-middle" rowSpan={2}>
                        Waktu Check
                      </th>
                      <th className="col-shift text-center align-middle" rowSpan={2}>
                        Shift
                      </th>
                      <th colSpan={4}></th>
                      <th colSpan={31} className="month-header">
                        JANUARI 2026
                      </th>
                    </tr>
                    <tr>
                      {januaryDates.map((date) => (
                        <th key={date} className={`col-date ${date === today ? "col-date-today" : ""}`}>
                          {date}
                        </th>
                      ))}
                    </tr>
                  </>
                ) : viewMode === "daily-check-ins" ? (
                  <>
                    <tr>
                      <th rowSpan={2} className="col-no">
                        No
                      </th>
                      <th rowSpan={2} className="col-item">
                        Item Check
                      </th>
                      <th rowSpan={2} className="col-checkpoint">
                        Check Point
                      </th>
                      <th rowSpan={2} className="col-method">
                        Metode
                      </th>
                      <th rowSpan={2} className="col-area">
                        TENSILE
                      </th>
                      <th rowSpan={2} className="col-area">
                        CROSS SECTION
                      </th>
                      <th rowSpan={2} className="col-area">
                        CUTTING
                      </th>
                      <th rowSpan={2} className="col-area">
                        PA
                      </th>
                      <th rowSpan={2} className="col-shift">
                        Shift
                      </th>
                      {weeks.map((week, wIdx) => (
                        <th key={wIdx} colSpan={6} className="col-week-header">
                          {week.week}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {weeks.map((week, wIdx) =>
                        week.days.map((day, dIdx) => (
                          <th key={`${wIdx}-${dIdx}`} className="col-day">
                            {day}
                          </th>
                        ))
                      )}
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <th rowSpan={3} className="col-machine align-middle">
                        MESIN
                      </th>
                      <th rowSpan={3} className="col-kind align-middle">
                        KIND
                      </th>
                      <th rowSpan={3} className="col-size align-middle">
                        SIZE
                      </th>
                      <th colSpan={6 * 5} className="month-header">
                        JANUARI 2026 (SENIN–JUMAT)
                      </th>
                    </tr>
                    <tr>
                      {weekdays.map((hari) => (
                        <th key={hari} colSpan={6} className="hari-header">
                          {hari}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: 5 }).flatMap((_, dayIndex) =>
                        timeSlots.map((time, timeIndex) => (
                          <th key={`${dayIndex}-${timeIndex}`} className="col-time">
                            {time}
                          </th>
                        ))
                      )}
                    </tr>
                  </>
                )}
              </thead>
              <tbody>
                {viewMode === "daily" ? (
                  Array.from({ length: 14 }, (_, i) => i + 1).map((id) => {
                    const shiftA = DAILY_CHECKPOINTS.find((cp) => cp.id === id && cp.shift === "A")
                    const shiftB = DAILY_CHECKPOINTS.find((cp) => cp.id === id + 0.1 && cp.shift === "B")
                    if (!shiftA || !shiftB) return null
                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td className="col-checkpoint" rowSpan={2}>
                            {shiftA!.checkPoint}
                          </td>
                          <td className="col-standard">{shiftA!.standard}</td>
                          <td className="col-waktu">{shiftA!.waktuCheck}</td>
                          <td className="col-shift">{shiftA!.shift}</td>
                          {januaryDates.map((date) => (
                            <td
                              key={`A-${id}-${date}`}
                              className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}
                            >
                              {renderStatusCell(date, shiftA!)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="col-standard">{shiftB!.standard}</td>
                          <td className="col-waktu">{shiftB!.waktuCheck}</td>
                          <td className="col-shift">{shiftB!.shift}</td>
                          {januaryDates.map((date) => (
                            <td
                              key={`B-${id}-${date}`}
                              className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}
                            >
                              {renderStatusCell(date, shiftB!)}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    )
                  })
                ) : viewMode === "daily-check-ins" ? (
                  Array.from(
                    new Map(
                      DAILY_CHECK_INS_CHECKPOINTS.map((cp) => [cp.no, cp])
                    ).keys()
                  ).map((no) => {
                    const group = DAILY_CHECK_INS_CHECKPOINTS.filter(cp => cp.no === no)
                    const rowCount = group.length
                    return (
                      <React.Fragment key={no}>
                        {group.map((checkpoint, idx) => (
                          <tr key={`${checkpoint.id}-${checkpoint.shift}`}>
                            {idx === 0 && <td rowSpan={rowCount} className="col-no">{checkpoint.no}</td>}
                            {idx === 0 && <td rowSpan={rowCount} className="col-item">{checkpoint.itemCheck}</td>}
                            <td className="col-checkpoint">{checkpoint.checkPoint}</td>
                            <td className="col-method">{checkpoint.method}</td>
                            <td className="col-area text-center">{checkpoint.area.tensile ? "√" : "-"}</td>
                            <td className="col-area text-center">{checkpoint.area.crossSection ? "√" : "-"}</td>
                            <td className="col-area text-center">{checkpoint.area.cutting ? "√" : "-"}</td>
                            <td className="col-area text-center">{checkpoint.area.pa ? "√" : "-"}</td>
                            <td className="col-shift">{checkpoint.shift}</td>
                            {weeks.map((week, wIdx) =>
                              week.days.map((day, dIdx) => {
                                const needed = isDayNeeded(checkpoint.schedule, day)
                                const isTodayOrBefore = isTodayOrPast(wIdx, dIdx)
                                const result = getResultDailyCheckIns(wIdx, dIdx, checkpoint.id, checkpoint.shift)

                                if (!needed) {
                                  return <td key={`${wIdx}-${dIdx}`} className="col-date-cell bg-gray-200"></td>
                                }

                                if (result) {
                                  return (
                                    <td key={`${wIdx}-${dIdx}`} className="col-date-cell">
                                      <span
                                        className={`status-badge ${
                                          result.status === "OK" ? "status-badge-ok" : "status-badge-ng"
                                        } text-xs px-1 py-0.5 rounded cursor-pointer inline-block`}
                                        onClick={() =>
                                          setModalData({ weekIndex: wIdx, dayIndex: dIdx, checkpoint, result })
                                        }
                                      >
                                        {result.status === "OK" ? "OK" : `NG (${result.ngCount})`}
                                      </span>
                                    </td>
                                  )
                                }

                                if (isTodayOrBefore) {
                                  return (
                                    <td key={`${wIdx}-${dIdx}`} className="col-date-cell">
                                      <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer inline-block">
                                        CHECK
                                      </span>
                                    </td>
                                  )
                                }

                                return <td key={`${wIdx}-${dIdx}`} className="col-date-cell bg-gray-100"></td>
                              })
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })
                ) : viewMode === "cc-stripping" ? (
                  Array.from({ length: 17 }, (_, i) => i + 1).map((id) => {
                    const shiftA = CC_STRIPPING_CHECKPOINTS.find((cp) => cp.id === id && cp.shift === "A")
                    const shiftB = CC_STRIPPING_CHECKPOINTS.find((cp) => cp.id === id + 0.1 && cp.shift === "B")
                    if (!shiftA || !shiftB) return null
                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td className="col-machine" rowSpan={2}>
                            {shiftA!.machine}
                          </td>
                          <td className="col-kind" rowSpan={2}>
                            {shiftA!.kind}
                          </td>
                          <td className="col-size" rowSpan={2}>
                            {shiftA!.size}
                          </td>
                          {weekdays.flatMap((hari) =>
                            timeSlots.map((time) => {
                              let date = getHari(today) === hari ? today : januaryDates.find((d) => getHari(d) === hari)
                              return (
                                <td key={`${hari}-${time}-A`} className="col-time-cell">
                                  {date ? renderStatusCell(date, shiftA!, time) : null}
                                </td>
                              )
                            })
                          )}
                        </tr>
                        <tr>
                          {weekdays.flatMap((hari) =>
                            timeSlots.map((time) => {
                              let date = getHari(today) === hari ? today : januaryDates.find((d) => getHari(d) === hari)
                              return (
                                <td key={`${hari}-${time}-B`} className="col-time-cell">
                                  {date ? renderStatusCell(date, shiftB!, time) : null}
                                </td>
                              )
                            })
                          )}
                        </tr>
                      </React.Fragment>
                    )
                  })
                ) : null}

                {/* BARIS CUSTOM – HANYA UNTUK DAILY */}
                {viewMode === "daily" && (
                  <React.Fragment>
                    {/* === Baris: Check dan Tanda tangan GL Inspector === */}
                    <tr>
                      <td colSpan={2} rowSpan={2} className="border text-xs font-bold text-center bg-gray-50 py-2">
                        Check dan Tanda tangan GL Inspector
                      </td>
                      <td className="col-waktu" rowSpan={2}></td>
                      <td className="col-shift">A</td>
                      {januaryDates.map((date) => {
                        const dateKey = `2026-01-${String(date).padStart(2, "0")}`
                        const storageKeyGL = "preAssyGroupLeaderSignatureGL"
                        const savedGL = typeof window !== "undefined" ? localStorage.getItem(storageKeyGL) : null
                        const glData = savedGL ? JSON.parse(savedGL) : {}
                        const value = glData[dateKey]?.["A"] || "-"
                        if (user?.role === "group-leader") {
                          return (
                            <td
                              key={`gl-A-${date}`}
                              className={`border text-xs cursor-pointer ${date === today ? "bg-blue-50" : ""} hover:bg-blue-100`}
                              onClick={() => {
                                const newValue = value === "OK" ? "NO" : "OK"
                                const newData = {
                                  ...glData,
                                  [dateKey]: { ...(glData[dateKey] || {}), A: newValue },
                                }
                                localStorage.setItem(storageKeyGL, JSON.stringify(newData))
                                setResults((prev) => ({ ...prev }))
                              }}
                            >
                              {value === "-" ? "Pilih" : value}
                            </td>
                          )
                        } else {
                          return (
                            <td key={`gl-A-${date}`} className="border text-xs bg-gray-200 text-gray-500">
                              {value === "-" ? "-" : value}
                            </td>
                          )
                        }
                      })}
                    </tr>
                    <tr>
                      <td className="col-shift">B</td>
                      {januaryDates.map((date) => {
                        const dateKey = `2026-01-${String(date).padStart(2, "0")}`
                        const storageKeyGL = "preAssyGroupLeaderSignatureGL"
                        const savedGL = typeof window !== "undefined" ? localStorage.getItem(storageKeyGL) : null
                        const glData = savedGL ? JSON.parse(savedGL) : {}
                        const value = glData[dateKey]?.["B"] || "-"
                        if (user?.role === "group-leader") {
                          return (
                            <td
                              key={`gl-B-${date}`}
                              className={`border text-xs cursor-pointer ${date === today ? "bg-blue-50" : ""} hover:bg-blue-100`}
                              onClick={() => {
                                const newValue = value === "OK" ? "NO" : "OK"
                                const newData = {
                                  ...glData,
                                  [dateKey]: { ...(glData[dateKey] || {}), B: newValue },
                                }
                                localStorage.setItem(storageKeyGL, JSON.stringify(newData))
                                setResults((prev) => ({ ...prev }))
                              }}
                            >
                              {value === "-" ? "Pilih" : value}
                            </td>
                          )
                        } else {
                          return (
                            <td key={`gl-B-${date}`} className="border text-xs bg-gray-200 text-gray-500">
                              {value === "-" ? "-" : value}
                            </td>
                          )
                        }
                      })}
                    </tr>
                    {/* === Baris: Verifikasi dan Tanda tangan ESO === */}
                    <tr>
                      <td colSpan={2} rowSpan={2} className="border text-xs font-bold text-center bg-gray-50 py-2">
                        Verifikasi dan Tanda tangan ESO (Setiap Hari Selasa & Kamis)
                      </td>
                      <td className="col-waktu" rowSpan={2}></td>
                      <td className="col-shift">A</td>
                      {januaryDates.map((date) => {
                        const hari = getHari(date)
                        const isSelasaKamis = hari === "Selasa" || hari === "Kamis"
                        const dateKey = `2026-01-${String(date).padStart(2, "0")}`
                        const storageKeyESO = "preAssyGroupLeaderSignatureESO"
                        const savedESO = typeof window !== "undefined" ? localStorage.getItem(storageKeyESO) : null
                        const esoData = savedESO ? JSON.parse(savedESO) : {}
                        const value = esoData[dateKey]?.["A"] || "-"
                        if (!isSelasaKamis) {
                          return <td key={`eso-A-${date}`} className="border text-xs"></td>
                        }
                        if (user?.role === "group-leader") {
                          return (
                            <td
                              key={`eso-A-${date}`}
                              className={`border text-xs cursor-pointer ${date === today ? "bg-blue-50" : ""} hover:bg-blue-100`}
                              onClick={() => {
                                const newValue = value === "OK" ? "NO" : "OK"
                                const newData = {
                                  ...esoData,
                                  [dateKey]: { ...(esoData[dateKey] || {}), A: newValue },
                                }
                                localStorage.setItem(storageKeyESO, JSON.stringify(newData))
                                setResults((prev) => ({ ...prev }))
                              }}
                            >
                              {value === "-" ? "Pilih" : value}
                            </td>
                          )
                        } else {
                          return (
                            <td key={`eso-A-${date}`} className="border text-xs bg-gray-200 text-gray-500">
                              {value === "-" ? "-" : value}
                            </td>
                          )
                        }
                      })}
                    </tr>
                    <tr>
                      <td className="col-shift">B</td>
                      {januaryDates.map((date) => {
                        const hari = getHari(date)
                        const isSelasaKamis = hari === "Selasa" || hari === "Kamis"
                        const dateKey = `2026-01-${String(date).padStart(2, "0")}`
                        const storageKeyESO = "preAssyGroupLeaderSignatureESO"
                        const savedESO = typeof window !== "undefined" ? localStorage.getItem(storageKeyESO) : null
                        const esoData = savedESO ? JSON.parse(savedESO) : {}
                        const value = esoData[dateKey]?.["B"] || "-"
                        if (!isSelasaKamis) {
                          return <td key={`eso-B-${date}`} className="border text-xs"></td>
                        }
                        if (user?.role === "group-leader") {
                          return (
                            <td
                              key={`eso-B-${date}`}
                              className={`border text-xs cursor-pointer ${date === today ? "bg-blue-50" : ""} hover:bg-blue-100`}
                              onClick={() => {
                                const newValue = value === "OK" ? "NO" : "OK"
                                const newData = {
                                  ...esoData,
                                  [dateKey]: { ...(esoData[dateKey] || {}), B: newValue },
                                }
                                localStorage.setItem(storageKeyESO, JSON.stringify(newData))
                                setResults((prev) => ({ ...prev }))
                              }}
                            >
                              {value === "-" ? "Pilih" : value}
                            </td>
                          )
                        } else {
                          return (
                            <td key={`eso-B-${date}`} className="border text-xs bg-gray-200 text-gray-500">
                              {value === "-" ? "-" : value}
                            </td>
                          )
                        }
                      })}
                    </tr>
                  </React.Fragment>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalData && modalData.date !== undefined && (
          <DetailModal
            data={{
              date: modalData.date,
              checkpoint: {
                ...modalData.checkpoint,
                checkPoint:
                  viewMode === "cc-stripping"
                    ? `${modalData.checkpoint.machine} (${modalData.timeSlot})`
                    : modalData.checkpoint.checkPoint,
              },
              result: modalData.result,
            }}
            onClose={() => setModalData(null)}
          />
        )}
      </div>
      <style jsx>{`
        .header {
          margin-bottom: 24px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.6rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }
        .logout-link {
          color: #d32f2f;
          text-decoration: none;
          font-weight: 600;
        }
        .button-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fbff;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        .btn {
          padding: 10px 20px;
          border: 2px solid transparent;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #666;
          transition: all 0.2s;
        }
        .btn:hover {
          background: #e0e0e0;
        }
        .btn.active {
          background: #1e88e5;
          color: white;
          border-color: #0d47a1;
        }
        .month-header {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0d47a1;
          background: #e3f2fd;
          padding: 8px 0;
        }
        .hari-header {
          text-align: center;
          font-weight: 600;
          background: #f5f9ff;
          border-bottom: 1px solid #ddd;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .status-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 0.85rem;
        }
        .status-table th,
        .status-table td {
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #e0e0e0;
          vertical-align: middle;
        }
        .status-table th {
          background: #f5f9ff;
          font-weight: 700;
          position: sticky;
          top: 0;
          z-index: 2;
          font-size: 14px;
          padding: 5px 6px;
        }
        .status-table td.col-checkpoint {
          min-width: 250px;
          text-align: left;
          word-break: break-word;
          white-space: pre-wrap;
          font-size: 12px;
          font-weight: 500;
        }
        .col-machine {
          min-width: 100px;
        }
        .col-kind {
          min-width: 90px;
        }
        .col-size {
          min-width: 50px;
        }
        .col-shift,
        .col-waktu,
        .col-standard {
          min-width: 80px;
        }
        .col-date {
          min-width: 36px;
        }
        .status-table th.col-time {
          font-size: 10px;
          padding: 4px;
        }
        .col-time-cell {
          height: 36px;
          min-width: 36px;
        }
        .col-date-today {
          background: #fff8e1;
          color: #e65100;
        }
        .col-date-cell {
          min-width: 36px;
          height: 36px;
          padding: 2px;
        }
        .status-badge {
          display: inline-block;
          width: 100%;
          height: 100%;
        }
        .status-badge-ok {
          background: #4caf50;
          color: white;
        }
        .status-badge-ng {
          background: #f44336;
          color: white;
        }
        .status-badge-check {
          background: #1e88e5;
          color: white;
          display: inline;
        }
        .status-badge-past {
          background: #bdbdbd;
          color: #333;
          font-weight: bold;
        }
        .bg-gray-200 {
          background-color: #e0e0e0 !important;
        }
        .bg-gray-100 {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </div>
  )
}