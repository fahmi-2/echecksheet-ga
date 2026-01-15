"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login-page")
    }
  }, [user, router])

  if (!user) return null

  const roleLabels = {
    "group-leader": "Group Leader QA",
    "inspector": "Inspector QA",
    "inspector-ga": "Inspector GA",
    "manager": "Manajer",
  }

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>Selamat Datang</h1>
          <div className="user-info">
            <span>
              {user.fullName} • <strong>{roleLabels[user.role as keyof typeof roleLabels] || "User"}</strong>
            </span>
          </div>
        </div>

        <div className="home-container">
          {/* 🔹 MANAJER: Lihat semua */}
          {user.role === "manager" && (
            <div className="section">
              <h2 className="section-title">🔐 Akses Penuh - Manajemen</h2>
              <p className="section-desc">Kelola semua area dan laporan</p>
              <div className="card-grid">
                <Link href="/status-final-assy?subType=inspector" className="card-link">
                  <div className="card card-primary">
                    <div className="card-icon">🔧</div>
                    <h3>Final Assy (QA)</h3>
                    <p>Semua checklist Final Assy</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
                <Link href="/status-pre-assy?subType=inspector" className="card-link">
                  <div className="card card-primary">
                    <div className="card-icon">⚙️</div>
                    <h3>Pre-Assy (QA)</h3>
                    <p>Semua checklist Pre-Assy</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
                <Link href="/status-ga" className="card-link">
                  <div className="card card-ga">
                    <div className="card-icon">🏢</div>
                    <h3>General Affairs</h3>
                    <p>Checklist GA</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* 🔹 GROUP LEADER QA */}
          {user.role === "group-leader" && (
            <div className="section">
              <h2 className="section-title">📋 Daily Check Group Leader QA</h2>
              <p className="section-desc">Kelola daily check untuk Final Assy dan Pre-Assy</p>
              <div className="card-grid">
                <Link href="/status-final-assy?subType=group-leader" className="card-link">
                  <div className="card card-primary">
                    <div className="card-icon">🔧</div>
                    <h3>Final Assy</h3>
                    <p>Daily check untuk Final Assembly</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
                <Link href="/status-pre-assy?subType=group-leader" className="card-link">
                  <div className="card card-primary">
                    <div className="card-icon">⚙️</div>
                    <h3>Pre-Assy</h3>
                    <p>Daily check dan CC Stripping</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* 🔹 INSPECTOR QA */}
          {user.role === "inspector" && (
            <div className="section">
              <h2 className="section-title">📋 Daily Check Inspector QA</h2>
              <p className="section-desc">Lakukan daily check sesuai area Anda</p>
              <div className="card-grid">
                <Link href="/status-final-assy?subType=inspector" className="card-link">
                  <div className="card card-secondary">
                    <div className="card-icon">🔍</div>
                    <h3>Final Assy</h3>
                    <p>Inspeksi Final Assembly</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
                <Link href="/status-pre-assy?subType=inspector" className="card-link">
                  <div className="card card-secondary">
                    <div className="card-icon">🔎</div>
                    <h3>Pre-Assy</h3>
                    <p>Inspeksi Pre-Assembly</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
                <Link href="/status-pre-assy-pressure-jig" className="card-link">
                  <div className="card card-secondary">
                    <div className="card-icon">🔩</div>
                    <h3>Pressure Jig</h3>
                    <p>Check Pressure Jig</p>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* 🔹 INSPECTOR GA */}
          {user.role === "inspector-ga" && (
  <div className="section">
    <h2 className="section-title">🏢 Daily Check General Affairs</h2>
    <p className="section-desc">Lakukan checklist fasilitas dan lingkungan</p>
    <div className="card-grid">
      <Link href="/status-ga" className="card-link">
        <div className="card card-ga">
          <div className="card-icon">🧹</div>
          <h3>Checklist GA</h3>
          <p>Kebersihan, keamanan, fasilitas</p>
          <span className="card-arrow">→</span>
        </div>
      </Link>
    </div>
  </div>
)}

          {/* 🔹 SEMUA ROLE: Riwayat & Pelaporan */}
          <div className="section">
            <h2 className="section-title">📊 Riwayat & Pelaporan</h2>
            <p className="section-desc">Kelola checklist dan laporan NG</p>
            <div className="card-grid">
              <Link href="/dashboard" className="card-link">
                <div className="card card-info">
                  <div className="card-icon">📈</div>
                  <h3>Dashboard</h3>
                  <p>Statistik dan riwayat checklist</p>
                  <span className="card-arrow">→</span>
                </div>
              </Link>
              <Link href="/pelaporan-list" className="card-link">
                <div className="card card-danger">
                  <div className="card-icon">🔴</div>
                  <h3>Laporan NG</h3>
                  <p>Kelola dan diskusikan laporan NG</p>
                  <span className="card-arrow">→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .section {
          margin-bottom: 48px;
        }
        .section-title {
          font-size: 1.5rem;
          color: #1e88e5;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .section-desc {
          color: #666;
          margin-bottom: 24px;
          font-size: 0.95rem;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .card-link {
          text-decoration: none;
          transition: transform 0.2s;
        }
        .card-link:hover {
          transform: translateY(-4px);
        }
        .card {
          position: relative;
          padding: 32px 24px;
          border-radius: 12px;
          transition: all 0.2s;
          cursor: pointer;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .card-primary { background: linear-gradient(135deg, #1e88e5, #0d47a1); }
        .card-secondary { background: linear-gradient(135deg, #7cb342, #558b2f); }
        .card-ga { background: linear-gradient(135deg, #9c27b0, #6a1b9a); }
        .card-info { background: linear-gradient(135deg, #29b6f6, #0277bd); }
        .card-danger { background: linear-gradient(135deg, #e53935, #c62828); }
        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }
        .card h3 {
          margin: 0 0 8px;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .card p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.95;
        }
        .card-arrow {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 1.5rem;
          opacity: 0.7;
        }
        @media (max-width: 768px) {
          .card-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 1.2rem; }
          .card { padding: 24px; min-height: 160px; }
          .card-icon { font-size: 2rem; }
        }
      `}</style>
    </div>
  )
}