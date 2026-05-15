// app/status-ga/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"

// ──────────────────────────────────────────────────────────────────────────────
// MAPPING ROLE KE CATEGORIES INDEX (0-4)
// ──────────────────────────────────────────────────────────────────────────────
const ROLE_TO_CATEGORY: Record<string, number | null> = {
  "inspector-ga-fire": 0,
  "inspector-ga-equipment": 1,
  "inspector-ga-electrical": 2,
  "inspector-ga-personal": 3,
  "inspector-ga-facility": 4,
  "inspector-ga": null,
  "admin": null,
  "superadmin": null,
};

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<number[]>([])

  useEffect(() => {
    if (redirected) return;

    if (!user) {
      setRedirected(true);
      router.push("/login-page")
    } else if (!user.role?.startsWith("inspector-ga") && !["admin", "superadmin"].includes(user.role)) {
      setRedirected(true);
      router.push("/home")
    }
  }, [user, router, redirected])

  useEffect(() => {
    if (!user?.role) return;
    
    const categoryIndex = ROLE_TO_CATEGORY[user.role];
    
    if (categoryIndex === null) {
      setVisibleCategories([0, 1, 2, 3, 4]);
    } else if (categoryIndex !== undefined && categoryIndex !== null) {
      setVisibleCategories([categoryIndex]);
    }
  }, [user?.role])

  if (!user) return null

  // ──────────────────────────────────────────────────────────────────────────────
  // 5 KATEGORI CHECKSHEET
  // ──────────────────────────────────────────────────────────────────────────────
  const categories = [
    {
      title: "1. Sistem Proteksi Kebakaran & Evakuasi",
      items: [
        { name: "INSPEKSI HYDRANT", desc: "Cek kondisi fisik dan fungsional hidran", link: "inspeksi-hydrant" },
        { name: "INSPEKSI FUNGSI DAN SELANG HYDRANT", desc: "Cek tekanan air, coupling, nozzle", link: "selang-hydrant" },
        { name: "INSPEKSI FIRE ALARM", desc: "Pastikan sistem alarm kebakaran siap siaga", link: "fire-alarm" },
        { name: "INSPEKSI SMOKE DETECTOR", desc: "Cek fungsi smoke & heat detector", link: "smoke-detector" },
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
        { name: "Form pengambilan APD", desc: "Formulir distribusi & pengambilan APD", link: "e-checksheet-apd/riwayat-apd" },
        { name: "INSPEKSI INFRASTUKTUR JALAN", desc: "Cek kondisi jalan, trotoar, boardess pabrik", link: "inf-jalan" },
        { name: "INSPEKSI APD", desc: "Inspeksi pengecekan penggunaan APD", link: "inspeksi-apd" },
      ]
    },
    {
      title: "5. Kebersihan dan Kenyamanan Fasilitas",
      items: [
        { name: "Checksheet Toilet", desc: "Patroli harian kebersihan toilet (standar 5S)", link: "checksheet-toilet" },
      ]
    },
  ]

  const displayedCategories = categories.filter((_, index) => visibleCategories.includes(index));

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      "inspector-ga-fire": "🔥 Proteksi Kebakaran",
      "inspector-ga-equipment": "⚙️ Peralatan",
      "inspector-ga-electrical": "⚡ Listrik",
      "inspector-ga-personal": "🦺 Personal & Prasarana",
      "inspector-ga-facility": "🧹 Fasilitas",
      "admin": "👑 Administrator",
      "superadmin": "🌟 Super Administrator",
    };
    return labels[role] || "Inspector GA";
  };

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <main className="page-content">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">📋 Checklist General Affairs</h1>
            <span className="role-badge">Role: {getRoleLabel(user.role)}</span>
          </div>
          <div className="header-right">
            <span className="welcome-text">Selamat datang, <strong>{user.fullName}</strong></span>
            
          </div>
        </header>

        {/* Role Info Banner */}
        {user.role?.startsWith("inspector-ga") && visibleCategories.length === 1 && (
          <div className="role-banner" role="status">
            <span className="role-banner-icon" aria-hidden="true">🎯</span>
            <p>Akses terbatas: <strong>{displayedCategories[0]?.title}</strong></p>
          </div>
        )}

        <div className="ga-checklist-container">
          {displayedCategories.length > 0 ? (
            displayedCategories.map((cat, catIndex) => (
              <section key={catIndex} className="category-section" aria-labelledby={`cat-title-${catIndex}`}>
                <h2 id={`cat-title-${catIndex}`} className="category-title">{cat.title}</h2>
                <div className="checklist-grid">
                  {cat.items.map((item, itemIdx) => (
                    <Link 
                      key={`${catIndex}-${itemIdx}`} 
                      href={`/status-ga/${item.link}`} 
                      className="checklist-card"
                      aria-label={`${item.name}: ${item.desc}`}
                    >
                      <div className="card-header">
                        <span className="card-icon" aria-hidden="true">📄</span>
                        <h3 className="card-title">{item.name}</h3>
                      </div>
                      <p className="card-desc">{item.desc}</p>
                      <span className="card-action" aria-hidden="true">
                        <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </Link> 
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state" role="alert">
              <p>🔒 Anda belum memiliki akses ke kategori checksheet.</p>
              <p className="empty-sub">Hubungi administrator untuk pengaturan role.</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        /* ───────────────────────────────────────────────────────────
           BASE / MOBILE FIRST (≤ 479px)
           ─────────────────────────────────────────────────────────── */
        :global(.app-page) {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .page-content {
          flex: 1;
          width: 100%;
          min-width: 0;
          padding: 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
        }

        .page-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          word-break: break-word;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          width: fit-content;
        }

        .welcome-text {
          font-size: 0.9rem;
          color: white;
          opacity: 0.95;
          text-align: center;
        }

        .welcome-text strong {
          font-weight: 600;
        }

        .btn-scan-qr {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          min-height: 44px;
          width: 100%;
        }

        .btn-scan-qr:hover {
          background: rgba(255, 255, 255, 0.35);
          border-color: rgba(255, 255, 255, 0.6);
        }

        .btn-scan-qr:active {
          transform: scale(0.98);
        }

        .qr-icon {
          flex-shrink: 0;
        }

        /* ── Role Banner ── */
        .role-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border-left: 4px solid #f97316;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          color: #9a3412;
        }

        .role-banner-icon {
          font-size: 1.1rem;
          line-height: 1;
        }

        .role-banner p {
          margin: 0;
          line-height: 1.4;
        }

        .role-banner strong {
          color: #c2410c;
          font-weight: 600;
        }

        /* ── Checklist Container ── */
        .ga-checklist-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .category-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 14px 12px;
          border-left: 4px solid #1e88e5;
        }

        .category-title {
          margin: 0 0 12px;
          color: #0d47a1;
          font-size: 1rem;
          font-weight: 700;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.3;
        }

        .category-title::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #1e88e5;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
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
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          min-height: 90px;
        }

        .checklist-card:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #1e88e5;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.15);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
          min-width: 0;
        }

        .card-icon {
          font-size: 1.2rem;
          color: #1e88e5;
          flex-shrink: 0;
          line-height: 1;
        }

        .card-title {
          font-size: 0.9rem;
          color: #1a237e;
          font-weight: 700;
          line-height: 1.3;
          word-break: break-word;
          overflow-wrap: break-word;
          margin: 0;
          flex: 1;
          min-width: 0;
        }

        .card-desc {
          font-size: 0.75rem;
          color: #666;
          line-height: 1.4;
          margin: 0 0 8px 28px;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .card-action {
          display: flex;
          justify-content: flex-end;
          margin-left: 28px;
          margin-top: auto;
        }

        .arrow-icon {
          color: #1e88e5;
          opacity: 0.7;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checklist-card:hover .arrow-icon {
          opacity: 1;
          transform: translateX(2px);
        }

        /* ── Empty State ── */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 12px;
          border: 2px dashed #cbd5e1;
          color: #64748b;
        }

        .empty-state p {
          margin: 8px 0;
          font-size: 0.95rem;
        }

        .empty-sub {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        /* ───────────────────────────────────────────────────────────
           TABLET: ≥ 480px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 480px) {
          .page-content { padding: 16px; }
          .header { 
            flex-direction: row; 
            align-items: center; 
            justify-content: space-between;
            gap: 12px;
            padding: 16px;
          }
          .header-left { flex: 1; min-width: 0; }
          .header-right { 
            flex-direction: row; 
            align-items: center; 
            justify-content: flex-end;
            gap: 12px;
            flex-wrap: wrap;
          }
          .page-title { font-size: 1.35rem; }
          .welcome-text { text-align: right; font-size: 0.9rem; }
          .btn-scan-qr { width: auto; min-width: 100px; padding: 8px 12px; font-size: 0.8rem; }
          .category-section { padding: 18px 16px; border-radius: 14px; }
          .category-title { font-size: 1.1rem; margin-bottom: 14px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
          .checklist-card { padding: 14px; min-height: 100px; border-radius: 12px; }
          .card-title { font-size: 0.95rem; }
          .card-desc { font-size: 0.8rem; margin-left: 32px; }
          .card-icon { font-size: 1.3rem; }
        }

        /* ───────────────────────────────────────────────────────────
           SMALL DESKTOP: ≥ 768px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 768px) {
          .page-content { 
            margin-left: 72px; /* Sidebar collapsed width */
            padding: 20px 24px;
          }
          :global(body.sidebar-expanded) .page-content {
            margin-left: 240px; /* Sidebar expanded width */
          }
          .header { padding: 20px 24px; margin-bottom: 24px; border-radius: 14px; }
          .page-title { font-size: 1.5rem; }
          .welcome-text { font-size: 0.95rem; }
          .btn-scan-qr { font-size: 0.9rem; padding: 9px 16px; min-height: 42px; }
          .ga-checklist-container { gap: 24px; }
          .category-section { padding: 24px 20px; border-radius: 16px; border-left-width: 5px; }
          .category-title { font-size: 1.25rem; margin-bottom: 18px; padding-bottom: 12px; }
          .category-title::before { width: 7px; height: 7px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
          .checklist-card { padding: 16px; min-height: 110px; border-radius: 14px; }
          .card-header { gap: 10px; }
          .card-title { font-size: 1rem; }
          .card-desc { font-size: 0.85rem; margin-left: 36px; }
          .card-icon { font-size: 1.4rem; }
          .arrow-icon { opacity: 0; transform: translateX(-4px); }
          .checklist-card:hover .arrow-icon { opacity: 1; transform: translateX(0); }
        }

        /* ───────────────────────────────────────────────────────────
           LARGE DESKTOP: ≥ 1024px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 1024px) {
          .page-content { padding: 28px 32px; }
          .header { padding: 24px 32px; margin-bottom: 32px; border-radius: 16px; }
          .page-title { font-size: 1.65rem; }
          .welcome-text { font-size: 1rem; }
          .btn-scan-qr { font-size: 0.95rem; padding: 10px 18px; }
          .category-section { padding: 28px 24px; }
          .category-title { font-size: 1.4rem; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
          .checklist-card { padding: 20px; min-height: 120px; }
          .card-title { font-size: 1.05rem; }
          .card-desc { font-size: 0.9rem; }
          .card-icon { font-size: 1.5rem; }
        }

        /* ───────────────────────────────────────────────────────────
           EXTRA LARGE: ≥ 1400px
           ─────────────────────────────────────────────────────────── */
        @media (min-width: 1400px) {
          .page-content { max-width: 1400px; margin: 0 auto 0 72px; padding: 32px 40px; }
          :global(body.sidebar-expanded) .page-content { margin-left: 240px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
          .category-section { padding: 32px 28px; }
          .category-title { font-size: 1.5rem; }
        }

        /* ───────────────────────────────────────────────────────────
           UTILITY & ACCESSIBILITY
           ─────────────────────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
        
        /* Focus states untuk aksesibilitas */
        .checklist-card:focus-visible,
        .btn-scan-qr:focus-visible {
          outline: 3px solid #1e88e5;
          outline-offset: 2px;
        }
        
        /* Smooth scroll behavior */
        html { scroll-behavior: smooth; }
        
        /* Prevent text selection on interactive elements */
        .card-icon, .arrow-icon, .role-banner-icon { user-select: none; }
      `}</style>
    </div>
  )
}