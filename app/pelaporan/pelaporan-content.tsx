// app/pelaporan/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link"

interface PelaporanData {
  id: string
  tanggal: string
  mainType: string
  subType: string
  checkPoint: string
  shift: string
  timeSlot?: string
  ngNotes: string
  department: string
  reporter: string
  reportedAt: string
  status: "open" | "in-progress" | "closed"

}

export default function PelaporanPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()

  // Ambil data dari URL
  const tanggal = searchParams.get("tanggal")
  const mainType = searchParams.get("mainType")
  const subType = searchParams.get("subType")
  const checkPoint = searchParams.get("checkPoint")
  const shift = searchParams.get("shift")
  const timeSlot = searchParams.get("timeSlot")
  const ngNotes = searchParams.get("ngNotes") || ""

  useEffect(() => {
    if (!user) {
      router.push("/login-page")
      return
    }
    // Validasi data minimal
    if (!tanggal || !mainType || !checkPoint || !shift) {
      alert("Data tidak lengkap untuk pelaporan.")
      router.back()
    }
  }, [user, router, tanggal, mainType, checkPoint, shift])

  const [formData, setFormData] = useState({
    department: "",
    description: ngNotes,
    attachment: null as File | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const departments = [
    "Production",
    "Maintenance",
    "Quality Assurance",
    "Engineering",
    "Logistics",
    "Safety",
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, attachment: e.target.files[0] })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department) {
      alert("Silakan pilih departemen.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simpan ke localStorage (bisa diganti dengan API call)
      const pelaporan: PelaporanData = {
        id: `NG-${Date.now()}`,
        tanggal: tanggal!,
        mainType: mainType!,
        subType: subType || "group-leader",
        checkPoint: checkPoint!,
        shift: shift!,
        timeSlot: timeSlot || undefined,
        ngNotes: formData.description,
        department: formData.department,
        reporter: user?.fullName || "Unknown",
        reportedAt: new Date().toISOString(),
        status: "open",
      }

      // Simpan ke localStorage
      const existing = localStorage.getItem("ngReports")
      const reports = existing ? JSON.parse(existing) : []
      reports.push(pelaporan)
      localStorage.setItem("ngReports", JSON.stringify(reports))

      setSubmitSuccess(true)
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Gagal mengirim laporan. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user || !tanggal || !mainType || !checkPoint || !shift) {
    return null
  }

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📝 Form Pelaporan NG</h1>
          <p className="subtitle">
            Laporkan temuan <strong>NG (Not Good)</strong> ke departemen terkait
          </p>
        </div>

        <div className="form-container">
          <div className="info-section">
            <h3>Data Temuan NG</h3>
            <div className="info-grid">
              <div><strong>Tanggal:</strong> {tanggal}</div>
              <div><strong>Area:</strong> {mainType === "pre-assy" ? "Pre Assy" : "Final Assy"}</div>
              <div><strong>Check Point:</strong> {checkPoint}</div>
              <div><strong>Shift:</strong> {shift}</div>
              {timeSlot && <div><strong>Waktu:</strong> {timeSlot}</div>}
              {ngNotes && <div><strong>Catatan NG:</strong> {ngNotes}</div>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label htmlFor="department">Departemen Tujuan *</label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="">-- Pilih Departemen --</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Deskripsi Masalah *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan secara detail kondisi NG yang ditemukan..."
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="attachment">Lampiran (Foto/Doc) - Opsional</label>
              <input
                type="file"
                id="attachment"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              {formData.attachment && (
                <p className="file-preview">File: {formData.attachment.name}</p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => router.back()}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </form>

          {submitSuccess && (
            <div className="success-message">
              ✅ Laporan berhasil dikirim! Redirect ke dashboard...
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 24px;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
        }
        .subtitle {
          color: #666;
          margin-top: 8px;
        }

        .form-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }

        .info-section {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        .info-section h3 {
          margin: 0 0 16px;
          color: #0d47a1;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          font-size: 0.95rem;
        }

        .report-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-weight: 600;
          color: #333;
        }
        .form-group select,
        .form-group textarea,
        .form-group input {
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
        }
        .form-group textarea {
          resize: vertical;
        }
        .file-preview {
          font-size: 0.85rem;
          color: #666;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .btn-cancel,
        .btn-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }
        .btn-cancel:hover {
          background: #e0e0e0;
        }
        .btn-submit {
          background: #d32f2f;
          color: white;
        }
        .btn-submit:hover:not(:disabled) {
          background: #b71c1c;
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-message {
          padding: 12px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 6px;
          margin-top: 16px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}