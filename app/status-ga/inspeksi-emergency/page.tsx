// app/inspeksi-emergency/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link"

export default function InspeksiEmergencyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  // Cek apakah sudah diisi hari ini
  const checkIfFilled = (area: string) => {
    if (typeof window === "undefined") return false
    const key = `ga_emergency_${area}_${today}`
    return localStorage.getItem(key) !== null
  }

  const areas = [
    { id: "genba-a", title: "GENBA A", desc: "Emergency lamp di area Genba A" },
    { id: "genba-b", title: "GENBA B", desc: "Emergency lamp di area Genba B" },
    { id: "genba-c", title: "GENBA C", desc: "Emergency lamp di area Genba C" },
    { id: "jig-proto", title: "JIG PROTO", desc: "Emergency lamp di area Jig Proto" },
    { id: "gel-sheet", title: "GEL SHEET", desc: "Emergency lamp di area Gel Sheet" },
    { id: "warehouse", title: "WAREHOUSE", desc: "Emergency lamp di area Warehouse" },
    { id: "mezzanine", title: "MEZZANINE", desc: "Emergency lamp di area Mezzanine" },
    { id: "parkir", title: "PARKIR", desc: "Emergency lamp portable di area parkir" },
    { id: "main-office", title: "MAIN OFFICE", desc: "Emergency lamp di kantor utama" },
  ]

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>🚨 Inspeksi Emergency Lamp</h1>
          <p className="subtitle">Daily check sistem pencahayaan darurat</p>
        </div>

        <div className="categories-grid">
          {areas.map((area) => (
            <div key={area.id} className="category-card">
              <div className={`card-header ${checkIfFilled(area.id) ? 'filled' : ''}`}>
                <div className="icon">💡</div>
                <h2>{area.title}</h2>
              </div>
              <p className="card-desc">{area.desc}</p>
              
              <div className="card-actions">
                <Link 
                  href={`/status-ga/inspeksi-emergency/${area.id}`} 
                  className={`btn ${checkIfFilled(area.id) ? 'btn-filled' : 'btn-primary'}`}
                >
                  {checkIfFilled(area.id) ? "✅ Sudah Diisi" : "📝 Isi Checklist"}
                </Link>
                <Link
  href={`/status-ga/inspeksi-emergency/riwayat/${area.id}`}
  className="btn-riwayat"
>
  📊 Riwayat
</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 2.2rem;
        }

        .subtitle {
          color: #666;
          margin-top: 8px;
          font-size: 1.1rem;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .category-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: transform 0.3s;
        }

        .category-card:hover {
          transform: translateY(-4px);
        }

        .card-header {
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-header.filled {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        }

        .icon {
          font-size: 2rem;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.3rem;
          color: #0d47a1;
        }

        .card-desc {
          padding: 0 20px;
          color: #666;
          line-height: 1.5;
          margin: 16px 0;
        }

        .card-actions {
          padding: 0 20px 20px;
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #d32f2f;
          color: white;
        }

        .btn-primary:hover {
          background: #b71c1c;
        }

        .btn-filled {
          background: #4caf50;
          color: white;
          cursor: not-allowed;
        }
.btn-riwayat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 10px 16px;
  border-radius: 10px;

  background: #f5faff;
  border: 1.5px solid #90caf9;
  color: #1e88e5;

  font-weight: 600;
  text-decoration: none;
  cursor: pointer;

  transition: all 0.25s ease;
}

.btn-riwayat:hover {
  background: #e3f2fd;
  border-color: #42a5f5;
  transform: translateY(-1px);
}
        .btn-view {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  padding: 10px 14px;
  border-radius: 10px;

  background: #f5faff;
  border: 1.5px solid #90caf9;
  color: #1e88e5;

  font-weight: 600;
  text-decoration: none;

  transition: all 0.25s ease;
}

.btn-view:hover {
  background: #e3f2fd;
  border-color: #42a5f5;
  transform: translateY(-1px);
}

        @media (max-width: 768px) {
          .categories-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}