// app/exit-lamp-pintu-darurat/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import Link from "next/link"

interface ChecklistItem {
  id: string
  date: string
  category: "exit-lamp" | "pintu-darurat" | "titik-kumpul"
  items: Array<{
    no: number
    lokasi: string
    kondisiLampu?: string
    indikatorLampu?: string
    kebersihan?: string
    kondisiPintu?: string
    areaSekitar?: string
    paluAlatBantu?: string
    identitasPintu?: string
    idPeringatan?: string
    doorCloser?: string
    jalurEvakuasiAman?: string
    penandaJalur?: string
    pencahayaan?: string
    notes?: string
  }>
  checker: string
  submittedAt: string
}

export default function ExitLampPintuDaruratPage() {
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
  const checkIfFilled = (category: string) => {
  if (typeof window === "undefined") return false // ❗ Cegah SSR error
  const key = `ga_exit_${category}_${today}`
  return localStorage.getItem(key) !== null
}

  const categories = [
    {
      id: "exit-lamp",
      title: "Exit Lamp & Emergency Lamp",
      desc: "Pemeriksaan kondisi lampu darurat dan exit lamp",
      filled: checkIfFilled("exit-lamp"),
      link: "/status-ga/exit-lamp-pintu-darurat/exit-lamp"
    },
    {
      id: "pintu-darurat",
      title: "Pintu Darurat",
      desc: "Pemeriksaan kondisi pintu darurat dan akses evakuasi",
      filled: checkIfFilled("pintu-darurat"),
      link: "/status-ga/exit-lamp-pintu-darurat/pintu-darurat"
    },
    {
      id: "titik-kumpul",
      title: "Titik Kumpul & Jalur Evakuasi",
      desc: "Pemeriksaan area evakuasi dan jalur darurat",
      filled: checkIfFilled("titik-kumpul"),
      link: "/status-ga/exit-lamp-pintu-darurat/titik-kumpul"
    }
  ]

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>🚨 Checklist Exit Lamp & Evakuasi</h1>
          <p className="subtitle">Daily check sistem keselamatan darurat</p>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card">
              <div className={`card-header ${cat.filled ? 'filled' : ''}`}>
                <div className="icon">
  {cat.id === "exit-lamp" 
    ? "💡" 
    : cat.id === "pintu-darurat" 
      ? "🚪" 
      : "📍"}
</div>
                <h2>{cat.title}</h2>
              </div>
              <p className="card-desc">{cat.desc}</p>
              
              <div className="card-actions">
                <Link href={`${cat.link}?date=${today}`} className={`btn ${cat.filled ? 'btn-filled' : 'btn-primary'}`}>
                  {cat.filled ? "✅ Sudah Diisi" : "📝 Isi Checklist"}
                </Link>
                <Link href={`/status-ga/exit-lamp-pintu-darurat/riwayat/${cat.id}`} className="btn btn-view">
                  📊 Lihat Riwayat
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
          color: #fefefe;
          font-size: 2.2rem;
        }

        .subtitle {
          color: #ffffff;
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
          background: linear-gradient(135deg, #c6fbb6 0%, #c8e6c9 100%);
        }

        .icon {
          font-size: 2rem;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.3rem;
          color:    #000000;
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
          color: black;
        }

        .btn-primary {
          background: #d32f2f;
          color: black;
        }

        .btn-primary:hover {
          background: #b71c1c;
        }

        .btn-filled {
          background: #4caf50;
          color: black;
          cursor: not-allowed;
        }

        .btn-view {
          background: #1e88e5;
          color: white;
          padding: 10px 16px;
        }

        .btn-view:hover {
          background: #1565c0;
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