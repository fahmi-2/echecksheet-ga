// /app/-e-checksheet-panel/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import { Sidebar } from "@/components/Sidebar"
import React from "react"

export default function EChecksheetPanelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  // 🔹 Tambahkan isMounted untuk hindari SSR-client mismatch
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const panelName = searchParams.get("panelName") || "Nama Panel"
  const area = searchParams.get("area") || "Area"
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  // 🔹 Inisialisasi answers hanya di client
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // 🔹 Muat data dari localStorage saat mount (hanya di client)
  useEffect(() => {
    if (!isMounted) return

    try {
      const key = `e-checksheet-panel-${panelName}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        let sourceData: Record<string, any> = {}

        if (Array.isArray(parsed)) {
          // Ambil entri terbaru yang cocok dengan tanggal ini (jika ada)
          const matchingEntry = parsed.find((entry: any) => entry._savedAt === date)
          if (matchingEntry) {
            sourceData = matchingEntry
          } else {
            // Jika tidak ada, ambil entri pertama sebagai fallback
            sourceData = parsed[0]
          }
        } else if (parsed && typeof parsed === "object" && parsed.tempC !== undefined) {
          sourceData = parsed
        }

        setAnswers({
          "1": sourceData.tempC || "",
          "2": sourceData.tempCableConnect || "",
          "3": sourceData.tempCable || "",
          "4": sourceData.bau || "",
          "5": sourceData.suara || "",
          "6": sourceData.sistemGrounding || "",
          "7": sourceData.kondisiKabelIsolasi || "",
          "8": sourceData.indikatorPanel || "",
          "9": sourceData.elcb || "",
          "10": sourceData.safetyWarning || "",
          "11-R": sourceData.kondisiSambunganR || "",
          "11-S": sourceData.kondisiSambunganS || "",
          "11-T": sourceData.kondisiSambunganT || "",
          "12": sourceData.boxPanel || "",
          "13": sourceData.s5 || "",
          "14": sourceData.keteranganNg1 || "",
          signature: "",
        })
      }
    } catch (err) {
      console.warn("Failed to parse saved data")
    }
  }, [isMounted, panelName, date])

  // 🔹 Redirect jika tidak punya akses
  useEffect(() => {
    if (!isMounted || loading) return
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
      router.push("/login-page")
    }
  }, [user, loading, router, isMounted])

  // 🔹 Jangan render apa pun sebelum mount (hindari hydration error)
  if (!isMounted) {
    return null
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
            background: #f5f5f5;
          }
        `}</style>
      </div>
    )
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null
  }

  const inspectionItems = [
    { no: 1, name: "Temp (°C)" },
    { no: 2, name: "Temp Cable Connect" },
    { no: 3, name: "Temp Cable" },
    { no: 4, name: "Bau" },
    { no: 5, name: "Suara" },
    { no: 6, name: "Sistem Grounding" },
    { no: 7, name: "Kondisi kabel dan isolasinya" },
    { no: 8, name: "Indikator panel" },
    { no: 9, name: "ELCB" },
    { no: 10, name: "Safety warning" },
    { no: 11, name: "Kondisi Sambungan", sub: ["R", "S", "T"] },
    { no: 12, name: "Box Panel" },
    { no: 13, name: "5S" },
    { no: 14, name: "Lain-lain" },
  ]

  const handleInputChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (typeof window !== "undefined") {
      try {
        const newEntry = {
          _savedAt: date,
          tempC: answers["1"] || "",
          tempCableConnect: answers["2"] || "",
          tempCable: answers["3"] || "",
          bau: answers["4"] || "",
          suara: answers["5"] || "",
          sistemGrounding: answers["6"] || "",
          kondisiKabelIsolasi: answers["7"] || "",
          indikatorPanel: answers["8"] || "",
          elcb: answers["9"] || "",
          safetyWarning: answers["10"] || "",
          kondisiSambunganR: answers["11-R"] || "",
          kondisiSambunganS: answers["11-S"] || "",
          kondisiSambunganT: answers["11-T"] || "",
          boxPanel: answers["12"] || "",
          s5: answers["13"] || "",
          keteranganNg1: answers["14"] || "",
        }

        const key = `e-checksheet-panel-${panelName}`
        const existing = localStorage.getItem(key)
        let history: (typeof newEntry)[] = []

        if (existing) {
          try {
            const parsed = JSON.parse(existing)
            if (Array.isArray(parsed)) {
              history = parsed
            } else if (parsed && typeof parsed === "object" && parsed._savedAt) {
              history = [parsed]
            }
          } catch (e) {
            console.warn("Invalid history format")
          }
        }

        // 🔁 Cek apakah sudah ada data dengan tanggal yang sama
        const existingIndex = history.findIndex((entry) => entry._savedAt === date)

        if (existingIndex >= 0) {
          // ✏️ Update data lama
          history[existingIndex] = newEntry
        } else {
          // ➕ Tambah data baru di awal
          history.unshift(newEntry)
        }

        localStorage.setItem(key, JSON.stringify(history))

        alert("Data berhasil disimpan!")
        router.push(`/status-ga/panel?openPanel=${encodeURIComponent(panelName)}`)
      } catch (err) {
        console.error("Gagal menyimpan:", err)
        alert("Gagal menyimpan data.")
      }
    }
  }

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header-section">
          <div className="header-content">
            <h1>Check Sheet Inspeksi Panel</h1>
            <p className="header-subtitle">Form Pemeriksaan Kelayakan Panel Listrik</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Nama Panel</span>
              <span className="info-value">{panelName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Area</span>
              <span className="info-value">{area}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tanggal Pemeriksaan</span>
              <span className="info-value">{new Date(date).toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="checksheet-table">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-item">ITEM PENGECEKAN</th>
                <th className="col-date">HASIL</th>
              </tr>
            </thead>
            <tbody>
              {inspectionItems.map((item) => {
                if (item.sub) {
                  return (
                    <React.Fragment key={item.no}>
                      <tr>
                        <td rowSpan={item.sub.length} className="col-no">
                          {item.no}
                        </td>
                        <td rowSpan={item.sub.length} className="col-item">
                          {item.name}
                        </td>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-R`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-R`, e.target.value)}
                            placeholder="R"
                            className="input-field"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-S`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-S`, e.target.value)}
                            placeholder="S"
                            className="input-field"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-T`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-T`, e.target.value)}
                            placeholder="T"
                            className="input-field"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                }
                return (
                  <tr key={item.no}>
                    <td className="col-no">{item.no}</td>
                    <td className="col-item">{item.name}</td>
                    <td className="col-input">
                      <input
                        type="text"
                        value={answers[item.no.toString()] || ""}
                        onChange={(e) => handleInputChange(item.no.toString(), e.target.value)}
                        className="input-field"
                      />
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={2} className="col-signature-label">
                  TANDA TANGAN / NIK
                </td>
                <td className="col-input">
                  <input
                    type="text"
                    value={answers["signature"] || ""}
                    onChange={(e) => handleInputChange("signature", e.target.value)}
                    className="input-field"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push("/status-ga/panel")} className="btn-secondary">
            ← Kembali
          </button>
          <button onClick={handleSave} className="btn-primary">
            ✓ Simpan
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-content {
          padding: 32px 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .header-section {
          margin-bottom: 32px;
        }

        .header-content {
          background: linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%);
          border-radius: 12px;
          padding: 24px 32px;
          box-shadow: 0 4px 12px rgba(13, 71, 161, 0.15);
        }

        .header-content h1 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .header-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 400;
        }

        .info-section {
          margin-bottom: 28px;
        }

        .info-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #0d47a1;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 150px;
        }

        .info-value {
          color: #333;
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          flex: 1;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid #e8e8e8;
          margin-bottom: 28px;
        }

        .checksheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .checksheet-table th {
          background: #f5f7fa;
          font-weight: 600;
          color: #0d47a1;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 2px solid #e8e8e8;
        }

        .checksheet-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }

        .checksheet-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .checksheet-table tbody tr:hover {
          background-color: #fafbfc;
        }

        .col-no {
          width: 50px;
          font-weight: 600;
          color: #333;
          text-align: center;
        }

        .col-item {
          font-weight: 500;
          color: #1e88e5;
          min-width: 250px;
        }

        .col-date {
          width: 120px;
        }

        .col-input {
          width: 120px;
        }

        .col-signature-label {
          text-align: right;
          font-weight: 600;
          color: #0d47a1;
          background: #f5f7fa;
        }

        .input-field {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          color: #333;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .input-field:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f9fbff;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding: 20px 0;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 28px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 140px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.2);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1565c0, #0d47a1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 71, 161, 0.3);
        }

        .btn-secondary {
          background: #bdbdbd;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary:hover {
          background: #757575;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
          }

          .header-content {
            padding: 16px 20px;
          }

          .header-content h1 {
            font-size: 22px;
          }

          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .info-value {
            text-align: left;
          }

          .col-item {
            min-width: 150px;
            font-size: 12px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}