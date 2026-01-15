// app/status-ga/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import Link from "next/link"

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login-page")
    }
    // Pastikan hanya inspector-ga yang bisa akses
    if (user?.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  if (!user) return null

  const categories = [
    {
      title: "1. Sistem Proteksi Kebakaran & Evakuasi",
      items: [
        { name: "INSPEKSI HYDRANT.xlsx", desc: "Cek kondisi fisik dan fungsional hidran", link: "inspeksi-hydrant" },
        { name: "INSPEKSI FUNGSI DAN SELANG HYDRANT.xlsx", desc: "Cek tekanan air, coupling, nozzle", link: "selang-hydrant" },
        { name: "INSPEKSI FIRE ALARM.xlsx", desc: "Pastikan sistem alarm kebakaran siap siaga", link: "inspeksi-fire-alarm" },
        { name: "INSPEKSI SMOKE DETECTOR.xlsx", desc: "Cek fungsi smoke & heat detector", link: "smoke-detector" },
        { name: "INSPEKSI APAR.xlsx", desc: "Cek APAR: isi, kondisi, aksesibilitas", link: "inspeksi-apar" },
        { name: "INSPEKSI EMERGENCY LAMP.xlsx", desc: "Cek lampu darurat & exit lamp", link: "inspeksi-emergency-lamp" },
        { name: "EXIT LAMP, PINTU DARURAT, DAN JALUR EVAKUASI", desc: "Cek pintu darurat & kejelasan jalur evakuasi", link: "exit-lamp-pintu-darurat" },
      ]
    },
    {
      title: "2. Keselamatan dan Pemeliharaan Peralatan",
      items: [
        { name: "PENGECEKAN LIFT BARANG DAILY.xlsx", desc: "Cek harian lift barang: limit switch, tombol, kabin", link: "lift-barang" },
        { name: "INSPEKSI DAN PREVENTIF LIFT BARANG.xlsx", desc: "Pemeliharaan preventif lift barang", link: "lift-barang" },
        { name: "TANGGA LISTRIK (AWP).xlsx", desc: "Cek hidrolik, rem darurat, outrigger, kontrol keselamatan", link: "tg-listrik" },
      ]
    },
    {
      title: "3. Keselamatan dan Instalasi Listrik",
      items: [
        { name: "PANEL.xlsx", desc: "Inspeksi panel listrik: suhu, bau, suara, grounding, ELCB", link: "panel" },
        { name: "4.10. Form Inspeksi Stop Kontak (REv 03) GAGS.xlsx", desc: "Cek stop kontak dan instalasi listrik di area kerja", link: "form-inspeksi-stop-kontak" },
      ]
    },
    {
      title: "4. Keselamatan Personal dan Prasarana Umum",
      items: [
        { 
          name: "Form pengambilan APD", 
          desc: "Formulir distribusi & pengambilan APD",
          link: "riwayat-apd" // 🔹 Diarahkan ke riwayat APD
        },
        { name: "INSPEKSI INFRASTUKTUR JALAN.xlsx", desc: "Cek kondisi jalan, trotoar, boardess pabrik", link: "inf-jalan" },
      ]
    },
    {
      title: "5. Kebersihan dan Kenyamanan Fasilitas",
      items: [
        { name: "Checksheet Toilet.xlsx", desc: "Patroli harian kebersihan toilet (standar 5S)", link: "checksheet-toilet" },
      ]
    },
  ]

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📋 Checklist General Affairs</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
          </div>
        </div>

        <div className="ga-checklist-container">
          {categories.map((cat, catIndex) => (
            <div key={catIndex} className="category-section">
              <h2 className="category-title">{cat.title}</h2>
              <div className="checklist-grid">
                {cat.items.map((item) => (
                  <Link 
                    key={item.name} 
                    href={`/status-ga/${item.link}`} 
                    className="checklist-card"
                  >
                    <div className="card-header">
                      <div className="card-icon">📄</div>
                      <div className="card-title">{item.name}</div>
                    </div>
                    <div className="card-desc">{item.desc}</div>
                    <div className="card-action">
                      <span className="btn-arrow">→</span>
                    </div>
                  </Link> 
                ))}
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
          margin-bottom: 24px;
        }

        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }

        .ga-checklist-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .category-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 24px;
        }

        .category-title {
          margin: 0 0 20px;
          color: #1e88e5;
          font-size: 1.4rem;
          font-weight: 600;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 8px;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .checklist-card {
          display: block;
          text-decoration: none;
          background: #f9f9f9;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .checklist-card:hover {
          background: #e3f2fd;
          border-color: #1e88e5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.15);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .card-icon {
          font-size: 1.2rem;
          color: #1e88e5;
          min-width: 24px;
          text-align: center;
        }

        .card-title {
          font-size: 1rem;
          color: #333;
          font-weight: 600;
          line-height: 1.4;
          word-break: break-word;
        }

        .card-desc {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .card-action {
          display: flex;
          justify-content: flex-end;
        }

        .btn-arrow {
          font-size: 1.1rem;
          color: #1e88e5;
          opacity: 0.7;
        }

        .checklist-card:hover .btn-arrow {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .checklist-grid {
            grid-template-columns: 1fr;
          }

          .category-title {
            font-size: 1.2rem;
          }

          .card-title {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  )
}