// app/status-ga/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"
import { QrCode } from "lucide-react"

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    // Prevent infinite loops
    if (redirected) return;

    if (!user) {
      setRedirected(true);
      router.push("/login-page")
    } else if (user?.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home")
    }
  }, [user, router, redirected])

  if (!user) return null

  const categories = [
    {
      title: "1. Sistem Proteksi Kebakaran & Evakuasi",
      items: [
        { name: "INSPEKSI HYDRANT", desc: "Cek kondisi fisik dan fungsional hidran", link: "inspeksi-hydrant" },
        { name: "INSPEKSI FUNGSI DAN SELANG HYDRANT", desc: "Cek tekanan air, coupling, nozzle", link: "selang-hydrant" },
        { name: "INSPEKSI FIRE ALARM", desc: "Pastikan sistem alarm kebakaran siap siaga", link: "fire-alarm" },
        { name: "INSPEKSI SMOKE DETECTOR.", desc: "Cek fungsi smoke & heat detector", link: "smoke-detector" },
        { name: "INSPEKSI APAR", desc: "Cek APAR: isi, kondisi, aksesibilitas", link: "inspeksi-apar" },
        { name: "INSPEKSI EMERGENCY LAMP", desc: "Cek lampu darurat & exit lamp", link: "inspeksi-emergency" },
        { name: "EXIT LAMP, PINTU DARURAT, DAN JALUR EVAKUASI", desc: "Cek pintu darurat & kejelasan jalur evakuasi", link: "exit-lamp-pintu-darurat" },
      ] 
    },
    {
      title: "2. Keselamatan dan Pemeliharaan Peralatan",
      items: [
        { name: "PENGECEKAN LIFT BARANG DAILY", desc: "Cek harian lift barang: limit switch, tombol, kabin", link: "lift-barang" },
        { name: "INSPEKSI DAN PREVENTIF LIFT BARANG", desc: "Pemeliharaan preventif lift barang", link: "inspeksi-preventif-lift-barang" },
        { name: "TANGGA LISTRIK (AWP)", desc: "Cek hidrolik, rem darurat, outrigger, kontrol keselamatan", link: "tg-listrik" },
      ]
    },
    {
      title: "3. Keselamatan dan Instalasi Listrik",
      items: [
        { name: "PANEL", desc: "Inspeksi panel listrik: suhu, bau, suara, grounding, ELCB", link: "panel" },
        { name: "FORM PENGECEKAN STOP KONTAK DAN INSTALASI LISTRIK", desc: "Cek stop kontak dan instalasi listrik di area kerja", link: "form-inspeksi-stop-kontak" },
      ]
    },
    {
      title: "4. Keselamatan Personal dan Prasarana Umum",
      items: [
        { 
          name: "Form pengambilan APD", 
          desc: "Formulir distribusi & pengambilan APD",
          link: "e-checksheet-apd/riwayat-apd"
        },
        { 
          name: "INSPEKSI INFRASTUKTUR JALAN", 
          desc: "Cek kondisi jalan, trotoar, boardess pabrik", 
          link: "inf-jalan"
        },
        { 
          name: "INSPEKSI APD", 
          desc: "Inspeksi pengecekan penggunaan APD",
          link: "inspeksi-apd"
        },
      ]
    },
    {
      title: "5. Kebersihan dan Kenyamanan Fasilitas",
      items: [
        { 
          name: "Checksheet Toilet", 
          desc: "Patroli harian kebersihan toilet (standar 5S)", 
          link: "checksheet-toilet" 
        },
      ]
    },
  ]

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1 className="page-title">📋 Checklist General Affairs</h1>
          <div className="user-info">
            <span className="welcome-text">Selamat datang, {user.fullName}</span>
            <button
              onClick={() => router.push("/scan")}
              className="btn-scan-qr"
              title="Buka scanner QR"
            >
              <QrCode size={20} />
              <span className="btn-text">Scan QR</span>
            </button>
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
        /* ───────────────────────────────────────────────────────────
           BASE STYLES - Mobile First
           ─────────────────────────────────────────────────────────── */
        .page-content {
          width: 100%;
          min-width: 0;
          margin-left: 0;
          padding: 16px 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          transition: margin-left 0.3s ease, padding 0.3s ease;
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px 14px;
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
          border-radius: 12px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .page-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          word-break: break-word;
          line-height: 1.3;
          text-align: center;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          width: 100%;
        }

        .welcome-text {
          font-size: 0.9rem;
          color: white;
          font-weight: 500;
          text-align: center;
          opacity: 0.95;
        }

        .btn-scan-qr {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          min-height: 44px;
          width: 100%;
          white-space: nowrap;
        }

        .btn-scan-qr:hover {
          background: rgba(255, 255, 255, 0.35);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .btn-scan-qr:active {
          transform: translateY(0);
        }

        .ga-checklist-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          min-width: 0;
        }

        .category-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          padding: 16px 12px;
          border-left: 4px solid #1e88e5;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .category-section:hover {
          transform: translateX(3px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
        }

        .category-title {
          margin: 0 0 16px;
          color: #0d47a1;
          font-size: 1.1rem;
          font-weight: 700;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          word-break: break-word;
          line-height: 1.3;
        }

        .category-title::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #1e88e5;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          width: 100%;
          min-width: 0;
        }

        .checklist-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-decoration: none;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 2px solid #e8eef7;
          border-radius: 10px;
          padding: 12px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          min-height: 95px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .checklist-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
          pointer-events: none;
        }

        .checklist-card:hover::before {
          left: 100%;
        }

        .checklist-card:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #1e88e5;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(30, 136, 229, 0.2);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
          min-width: 0;
        }

        .card-icon {
          font-size: 1.3rem;
          color: #1e88e5;
          min-width: 24px;
          text-align: center;
          flex-shrink: 0;
          line-height: 1;
        }

        .card-title {
          font-size: 0.9rem;
          color: #1a237e;
          font-weight: 700;
          line-height: 1.3;
          word-break: break-word;
          min-width: 0;
          flex: 1;
        }

        .card-desc {
          font-size: 0.78rem;
          color: #666;
          line-height: 1.4;
          margin-bottom: 8px;
          margin-left: 34px;
          word-break: break-word;
          min-width: 0;
        }

        .card-action {
          display: flex;
          justify-content: flex-end;
          margin-left: 34px;
          margin-top: 4px;
        }

        .btn-arrow {
          font-size: 1rem;
          color: #1e88e5;
          opacity: 0.7;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .checklist-card:hover .btn-arrow {
          opacity: 1;
          transform: translateX(2px);
        }

        /* ───────────────────────────────────────────────────────────
           TABLET: min-width 480px - Header masih vertikal tapi lebih rapi
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 480px) {
          .page-content {
            padding: 18px 16px;
          }

          .header {
            padding: 18px 16px;
            gap: 14px;
          }

          .page-title {
            font-size: 1.35rem;
          }

          .user-info {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }

          .welcome-text {
            text-align: left;
            font-size: 0.95rem;
            flex: 1;
            min-width: 0;
          }

          .btn-scan-qr {
            width: auto;
            min-width: 110px;
            padding: 9px 14px;
            font-size: 0.85rem;
          }

          .category-section {
            padding: 20px 16px;
            border-radius: 14px;
            border-left-width: 5px;
          }

          .category-title {
            font-size: 1.2rem;
            margin-bottom: 18px;
          }

          .checklist-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
          }

          .checklist-card {
            padding: 14px;
            min-height: 105px;
            border-radius: 12px;
          }

          .card-title {
            font-size: 0.95rem;
          }

          .card-desc {
            font-size: 0.82rem;
            margin-left: 38px;
          }

          .card-icon {
            font-size: 1.4rem;
            min-width: 26px;
          }
        }

        /* ───────────────────────────────────────────────────────────
           MEDIUM TABLET: min-width 640px - Header mulai horizontal
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 640px) {
          .header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            padding: 20px 20px;
          }

          .page-title {
            flex: 1;
            min-width: 0;
            text-align: left;
            font-size: 1.4rem;
          }

          .user-info {
            flex-wrap: nowrap;
            justify-content: flex-end;
            gap: 14px;
          }

          .welcome-text {
            font-size: 0.95rem;
          }

          .btn-scan-qr {
            padding: 10px 16px;
            min-width: 120px;
          }
        }

        /* ───────────────────────────────────────────────────────────
           SMALL DESKTOP: min-width 768px (Sidebar Expanded)
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 768px) {
          .page-content {
            margin-left: 120px;
            padding: 24px 20px;
          }

          .header {
            padding: 22px 24px;
            margin-bottom: 36px;
            border-radius: 14px;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .user-info {
            gap: 16px;
          }

          .welcome-text {
            font-size: 1rem;
          }

          .btn-scan-qr {
            font-size: 0.95rem;
            padding: 10px 18px;
            min-height: 44px;
            min-width: 130px;
          }

          .ga-checklist-container {
            gap: 32px;
          }

          .category-section {
            padding: 28px 24px;
            border-radius: 16px;
            border-left-width: 6px;
          }

          .category-section:hover {
            transform: translateX(5px);
          }

          .category-title {
            font-size: 1.4rem;
            margin-bottom: 24px;
            padding-bottom: 12px;
          }

          .category-title::before {
            width: 8px;
            height: 8px;
          }

          .checklist-grid {
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
          }

          .checklist-card {
            padding: 18px;
            min-height: 115px;
            border-radius: 14px;
          }

          .card-header {
            gap: 12px;
          }

          .card-title {
            font-size: 1.05rem;
          }

          .card-desc {
            font-size: 0.9rem;
            margin-left: 44px;
          }

          .card-icon {
            font-size: 1.6rem;
            min-width: 30px;
          }

          .btn-arrow {
            font-size: 1.1rem;
            opacity: 0;
            transform: translateX(-6px);
          }

          .checklist-card:hover .btn-arrow {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ───────────────────────────────────────────────────────────
           LARGE DESKTOP: min-width 1024px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 1024px) {
          .page-content {
            padding: 32px 28px;
          }

          .header {
            padding: 26px 32px;
            margin-bottom: 48px;
            border-radius: 16px;
          }

          .page-title {
            font-size: 1.7rem;
          }

          .user-info {
            gap: 18px;
          }

          .welcome-text {
            font-size: 1.05rem;
          }

          .btn-scan-qr {
            font-size: 1rem;
            padding: 11px 22px;
            min-width: 140px;
          }

          .category-section {
            padding: 32px 28px;
          }

          .category-title {
            font-size: 1.6rem;
          }

          .checklist-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
          }

          .checklist-card {
            padding: 22px;
            min-height: 125px;
          }

          .card-title {
            font-size: 1.1rem;
          }

          .card-desc {
            font-size: 0.95rem;
          }

          .card-icon {
            font-size: 1.8rem;
          }
        }

        /* ───────────────────────────────────────────────────────────
           EXTRA LARGE: min-width 1400px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 1400px) {
          .page-content {
            max-width: 1400px;
            margin: 0 auto 0 120px;
            padding: 32px 36px;
          }

          .checklist-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }

          .category-section {
            padding: 36px 32px;
          }
        }

        /* ───────────────────────────────────────────────────────────
           UTILITY
           ─────────────────────────────────────────────────────────── */
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        img, svg, video {
          max-width: 100%;
          height: auto;
          display: block;
        }

        html, body {
          overflow-x: hidden;
          width: 100%;
          min-width: 0;
        }

        .app-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
          min-width: 0;
        }
      `}</style>
    </div>
  )
}