// app/status-ga/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
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
            <span>Selamat datang, {user.fullName}</span>
            <button
              onClick={() => router.push("/scan")}
              className="btn-scan-qr"
              title="Buka scanner QR"
            >
              <QrCode size={20} />
              Scan QR
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
        .page-content {
          max-width: 1400px;
          margin: 0 00 0 120px;
          padding: 32px 24px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  gap: 16px;
}
.page-title {
  margin: 0;
  color: white; /* ✅ Warna putih */
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* ✅ Tambahkan shadow agar lebih jelas */
}

        .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  gap: 16px;
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%); /* ✅ Pastikan background biru */
}

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1rem;
          color: white;
          font-weight: 500;
          margin-left: auto !important;
          white-space: nowrap;
          flex-wrap: wrap;
        }

        .btn-scan-qr {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
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
          gap: 48px;
        }

        .category-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 32px;
          border-left: 6px solid #1e88e5;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .category-section:hover {
          transform: translateX(4px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }

        .category-title {
          margin: 0 0 28px;
          color: #0d47a1;
          font-size: 1.6rem;
          font-weight: 700;
          border-bottom: 3px solid #e3f2fd;
          padding-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-title::before {
          content: '';
          width: 8px;
          height: 8px;
          background: #1e88e5;
          border-radius: 50%;
          display: inline-block;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .checklist-card {
          display: block;
          text-decoration: none;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 2px solid #e8eef7;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
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
        }

        .checklist-card:hover::before {
          left: 100%;
        }

        .checklist-card:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #1e88e5;
          transform: translateY(-8px);
          box-shadow: 0 16px 40px rgba(30, 136, 229, 0.25);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .card-icon {
          font-size: 1.8rem;
          color: #1e88e5;
          min-width: 32px;
          text-align: center;
          flex-shrink: 0;
        }

        .card-title {
          font-size: 1.05rem;
          color: #1a237e;
          font-weight: 700;
          line-height: 1.4;
          word-break: break-word;
        }

        .card-desc {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.6;
          margin-bottom: 12px;
          margin-left: 44px;
        }

        .card-action {
          display: flex;
          justify-content: flex-end;
          margin-left: 44px;
        }

        .btn-arrow {
          font-size: 1.2rem;
          color: #1e88e5;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
        }

        .checklist-card:hover .btn-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 24px 16px;
          }
          .header h1 { font-size: 1.8rem; }
          .checklist-grid { grid-template-columns: 1fr; gap: 16px; }
          .category-section { padding: 20px; border-radius: 12px; border-left: 4px solid #1e88e5; }
          .category-title { font-size: 1.3rem; margin-bottom: 20px; }
          .card-title { font-size: 0.95rem; }
          .card-desc { font-size: 0.85rem; margin-left: 40px; }
          .checklist-card { padding: 16px; }
          .card-icon { font-size: 1.4rem; }
        }
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .page-title {
    font-size: 1.8rem;
    text-align: left;
  }
        @media (max-width: 480px) {
          .header h1 { font-size: 1.5rem; }
          .category-title { font-size: 1.1rem; }
          .card-title { font-size: 0.9rem; }
          .user-info { font-size: 0.9rem; }
        }
      `}</style>
    </div>
  )
}