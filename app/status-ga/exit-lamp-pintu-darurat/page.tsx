// app/exit-lamp-pintu-darurat/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
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
    if (typeof window === "undefined") return false
    const key = `ga_exit_${category}_${today}`
    return localStorage.getItem(key) !== null
  }

  const categories = [
    {
      id: "exit-lamp",
      title: "Exit Lamp & Emergency Lamp",
      desc: "Pemeriksaan kondisi lampu darurat dan exit lamp",
      filled: checkIfFilled("exit-lamp"),
      link: "/status-ga/exit-lamp-pintu-darurat/exit-lamp",
      historyLink: "/status-ga/exit-lamp-pintu-darurat/riwayat/exit-lamp",
      color: "#ff9800",
      icon: "💡"
    },
    {
      id: "pintu-darurat",
      title: "Pintu Darurat",
      desc: "Pemeriksaan kondisi pintu darurat dan akses evakuasi",
      filled: checkIfFilled("pintu-darurat"),
      link: "/status-ga/exit-lamp-pintu-darurat/pintu-darurat",
      historyLink: "/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat",
      color: "#f44336",
      icon: "🚪"
    },
    {
      id: "titik-kumpul",
      title: "Titik Kumpul & Jalur Evakuasi",
      desc: "Pemeriksaan area evakuasi dan jalur darurat",
      filled: checkIfFilled("titik-kumpul"),
      link: "/status-ga/exit-lamp-pintu-darurat/titik-kumpul",
      historyLink: "/status-ga/exit-lamp-pintu-darurat/riwayat/titik-kumpul",
      color: "#2196f3",
      icon: "📍"
    }
  ]

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-icon">🚨</div>
          <h1>Checklist Exit Lamp & Evakuasi</h1>
          <p className="subtitle">Daily check sistem keselamatan darurat</p>
        </div>

        {/* Satu Grid Card - Gabungan Isi & Riwayat */}
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card">
              <div className={`card-header ${cat.filled ? 'filled' : ''}`} style={{
                background: cat.filled 
                  ? 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)'
                  : `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}30 100%)`
              }}>
                <div className="icon" style={{ color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="header-text">
                  <h2>{cat.title}</h2>
                  {cat.filled && <span className="badge-filled">✓ Sudah Diisi Hari Ini</span>}
                </div>
              </div>
              
              <div className="card-body">
                <p className="card-desc">{cat.desc}</p>
                
                <div className="card-actions">
                  <Link 
                    href={`${cat.link}?date=${today}`} 
                    className={`btn btn-checklist ${cat.filled ? 'disabled' : ''}`}
                    style={{
                      background: cat.filled ? '#e0e0e0' : cat.color,
                      borderColor: cat.color
                    }}
                  >
                    <span className="btn-icon">{cat.filled ? "✓" : "📝"}</span>
                    <span className="btn-text">
                      {cat.filled ? "Sudah Diisi" : "Isi Checklist"}
                    </span>
                  </Link>
                  
                  <Link 
                    href={cat.historyLink} 
                    className="btn btn-history"
                    style={{ background: cat.color }}
                  >
                    <span className="btn-icon">📊</span>
                    <span className="btn-text">Lihat Riwayat</span>
                  </Link>
                </div>
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
          margin-bottom: 40px;
        }

        .header-icon {
          font-size: 4rem;
          margin-bottom: 12px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .header h1 {
          margin: 0;
          color: #fefefe;
          font-size: 2.2rem;
          font-weight: 700;
        }

        .subtitle {
          color: #e0e0e0;
          margin-top: 8px;
          font-size: 1.1rem;
          font-weight: 400;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 28px;
        }

        .category-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }

        .card-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .card-header.filled {
          background: linear-gradient(135deg, #66bb6a 0%, #81c784 100%) !important;
        }

        .icon {
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header-text {
          flex: 1;
        }

        .card-header h2 {
          margin: 0 0 4px 0;
          font-size: 1.35rem;
          color: #1a1a1a;
          font-weight: 700;
        }

        .badge-filled {
          display: inline-block;
          background: rgba(255,255,255,0.9);
          color: #2e7d32;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .card-body {
          padding: 24px;
        }

        .card-desc {
          color: #666;
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-size: 0.95rem;
        }

        .card-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 14px 20px;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px solid transparent;
          font-size: 0.95rem;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.2);
          transition: left 0.3s ease;
        }

        .btn:hover::before {
          left: 100%;
        }

        .btn-icon {
          font-size: 1.2rem;
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        .btn-checklist {
          color: white;
          flex: 1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-checklist:not(.disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .btn-checklist.disabled {
          color: #757575;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-checklist.disabled:hover {
          transform: none;
        }

        .btn-history {
          color: white;
          flex: 1;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          box-shadow: 0 4px 12px rgba(30,136,229,0.3);
        }

        .btn-history:hover {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(30,136,229,0.4);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 16px;
          }

          .header-icon {
            font-size: 3rem;
          }

          .header h1 {
            font-size: 1.8rem;
          }

          .categories-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .card-actions {
            flex-direction: column;
          }

          .icon {
            width: 50px;
            height: 50px;
            font-size: 2rem;
          }

          .card-header h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  )
}