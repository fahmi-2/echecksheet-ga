// app/home/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  FileText,
  Wrench,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";

interface CardData {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  href: string;
}

interface ActivityItem {
  title: string;
  user: string;
  time: string;
  status: "OK" | "NG";
}

// ─────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth - Mendengarkan event dari Sidebar.tsx
// ─────────────────────────────────────────────────────────────
function useSidebarWidth(isMobile: boolean) {
  const COLLAPSED_W = 70;
  const EXPANDED_W = 240;
  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    // Jika mobile, selalu return 0 (sidebar pakai overlay + transform)
    if (isMobile) {
      setSidebarW(0);
      return;
    }

    // Baca CSS variable yang di-set Sidebar saat mount
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    // Dengarkan event toggle dari Sidebar
    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener("sidebarToggle", onToggle);
    return () => window.removeEventListener("sidebarToggle", onToggle);
  }, [isMobile]);

  return sidebarW;
}

export default function ModernHomePage() {
  // ✅ SEMUA HOOKS DIPANGGIL PERTAMA KALI, TANPA KONDISI
  const { user, loading } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Deteksi ukuran layar untuk mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // ✅ Hook sidebar width yang responsive
  const sidebarWidth = useSidebarWidth(isMobile);

  // ✅ Mount state untuk hindari hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 🔁 Muat aktivitas hari ini
  useEffect(() => {
    if (!isMounted) return;

    let shouldUpdate = true;

    try {
      const historyStr = localStorage.getItem("checksheet_history");
      if (!historyStr) {
        if (shouldUpdate) setActivities([]);
        return;
      }

      const history = JSON.parse(historyStr);
      if (!Array.isArray(history)) {
        if (shouldUpdate) setActivities([]);
        return;
      }

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayEntries = history.filter((item: any) => {
        const filledDate = new Date(item.filledAt);
        return filledDate >= todayStart && filledDate < todayEnd;
      });

      const sorted = [...todayEntries].sort(
        (a: any, b: any) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime()
      );

      const recent = sorted.slice(0, 3).map((item: any) => ({
        title: String(item.area || "Checklist Tanpa Nama"),
        user: String(item.filledBy || "Unknown User"),
        time: new Date(item.filledAt).toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: (item.status === "NG" ? "NG" : "OK") as "OK" | "NG",
      }));

      if (shouldUpdate) setActivities(recent);
    } catch (e) {
      console.error("[Home] Gagal memuat riwayat checklist:", e);
      if (shouldUpdate) setActivities([]);
    }

    return () => {
      shouldUpdate = false;
    };
  }, [isMounted]);

  // ✅ Jangan render apa pun sebelum mount di client
  if (!isMounted) return null;

  // ✅ CONDITIONAL LOGIC DILAKUKAN SETELAH SEMUA HOOKS
  if (loading) {
    return (
      <div className="modern-home-page">
        <Sidebar userName="Loading..." />
        <main className="main-content" style={{ marginLeft: 0 }}>
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Memuat data...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // ✅ LOGIC BISNIS SETELAH VALIDASI AUTH
  const userName = user.fullName || "User";
  const currentRole = user.role;
  const dashboardLink = currentRole === "admin" ? "/ga-dashboard" : "/dashboard";

  const roleCards: Record<string, CardData[]> = {
    "admin": [
      {
        id: "ga-dashboard",
        icon: LayoutDashboard,
        title: "Dashboard GA",
        description: "Lihat statistik dan laporan sistem",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        href: "/ga-dashboard",
      },
    ],
    "inspector-ga": [
      {
        id: "checklist-ga",
        icon: Building2,
        title: "Checklist GA",
        description: "Kebersihan, keamanan, fasilitas",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        href: "/status-ga",
      },
    ],
  };

  const currentRoleCards = roleCards[currentRole] || [];

 // ✅ Inline style untuk margin-left yang dinamis
const mainContentStyle: React.CSSProperties = {
  marginLeft: isMobile ? 0 : sidebarWidth,
  transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  paddingTop: isMobile ? "60px" : "20px",
  paddingLeft: "36px",    // ✅ Tambah padding kiri
  paddingRight: "25px",   // ✅ Tambah padding kanan
};

  return (
    <div className="modern-home-page">
      <Sidebar userName={userName} />

      {/* ✅ main-content dengan margin-left dinamis */}
      <main className="main-content" style={mainContentStyle}>
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1 className="welcome-title">👋 Halo, {userName}!</h1>
            <p className="welcome-text">
              Selamat datang di E-CheckSheet GA. Kelola checklist dan laporan General Affairs Anda dengan mudah.
            </p>
          </div>
          <div className="welcome-illustration" aria-hidden="true">
            <svg width="160" height="120" viewBox="0 0 200 150" fill="none">
              <circle cx="100" cy="75" r="60" fill="#fcfcfc" opacity="0.5" />
              <circle cx="100" cy="75" r="40" fill="#006afe" opacity="0.3" />
              <path
                d="M80 75L95 90L120 60"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* GA Cards */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">📋 Menu Utama GA</h2>
              <p className="section-desc">Akses semua area checklist General Affairs</p>
            </div>
          </div>
          <div className="cards-grid">
            {currentRoleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.id} href={card.href} className="feature-card-link">
                  <div className="feature-card" style={{ background: card.gradient }}>
                    <div className="card-header">
                      <div className="card-icon">
                        <Icon size={24} color="white" aria-hidden="true" />
                      </div>
                      <ChevronRight size={18} color="white" aria-hidden="true" />
                    </div>
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-desc">{card.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <style jsx>{`
        .modern-home-page {
          display: flex;
          min-height: 100vh;
          background-color: #f5f6fa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .empty-activity {
          padding: 16px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          background: white;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .main-content {
  flex: 1;
  padding: 24px 36px;  /* ✅ Padding horizontal lebih besar */
  min-height: calc(100vh - 64px);
  max-width: 1400px;   /* ✅ Max width lebih besar */
  width: 100%;         /* ✅ Pastikan full width */
  margin: 0 auto;      /* ✅ Center secara horizontal */
  box-sizing: border-box;
  will-change: margin-left;
}

        .welcome-banner {
          background: linear-gradient(135deg, #2f00b0 0%, #0987ee 100%);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
          gap: 24px;
        }

        .welcome-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px 0;
        }

        .welcome-text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.6;
        }

        .welcome-illustration {
          flex-shrink: 0;
        }

        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 4px 0;
        }

        .section-desc {
          font-size: 14px;
          color: #718096;
          margin: 0;
        }

        .view-all-btn {
          color: #4facfe;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: #f3f4f6;
          transform: translateX(4px);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .feature-card-link {
          text-decoration: none;
          display: block;
        }

        .feature-card {
          border-radius: 16px;
          padding: 24px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
          gap: 12px;
        }

        .card-icon {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .card-desc {
          font-size: 13px;
          opacity: 0.9;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          background: white;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #f5f5f5;
        }

        .activity-icon.ok {
          background: #d1fae5;
          color: #10b981;
        }
        .activity-icon.ng {
          background: #fee2e2;
          color: #ef4444;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-desc {
          font-size: 12px;
          color: #718096;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        .activity-time {
          font-size: 11px;
          color: #a0aec0;
          white-space: nowrap;
        }

        .activity-status {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .activity-status.ok {
          background: #d1fae5;
          color: #059669;
        }
        .activity-status.ng {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ✅ RESPONSIVE - HAPUS margin-left hardcoded karena sudah di-handle inline style */
        @media (max-width: 1200px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
          .main-content {
            padding: 20px;
            /* ✅ margin-left dihapus, dikontrol via inline style */
          }
        }

        @media (max-width: 768px) {
          .modern-home-page {
            flex-direction: column;
          }

          .main-content {
            padding: 12px;
            margin: 0; /* ✅ Override inline style di mobile */
            max-width: 100%;
          }

          .welcome-banner {
            flex-direction: column;
            text-align: center;
            padding: 16px;
            gap: 16px;
            margin-bottom: 20px;
          }

          .welcome-illustration {
            max-width: 120px;
            margin: 0 auto;
          }

          .welcome-title {
            font-size: 20px;
            margin-bottom: 10px;
          }

          .welcome-text {
            font-size: 13px;
          }

          .cards-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .feature-card {
            padding: 20px;
          }

          .card-title {
            font-size: 18px;
          }

          .card-desc {
            font-size: 12px;
          }

          .section {
            margin-bottom: 24px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 16px;
            gap: 8px;
          }

          .section-title {
            font-size: 18px;
          }

          .view-all-btn {
            align-self: flex-start;
            padding: 6px 12px;
            font-size: 13px;
          }

          .activity-item {
            padding: 14px;
            gap: 10px;
            flex-wrap: wrap;
          }

          .activity-title {
            font-size: 13px;
          }

          .activity-desc {
            font-size: 11px;
          }

          .activity-meta {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .activity-time {
            font-size: 10px;
          }

          .activity-status {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 8px;
          }

          .welcome-banner {
            padding: 12px;
            gap: 12px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .welcome-title {
            font-size: 18px;
            margin-bottom: 8px;
          }

          .welcome-text {
            font-size: 12px;
            line-height: 1.5;
          }

          .welcome-illustration {
            max-width: 100px;
          }

          .welcome-illustration svg {
            width: 100px !important;
            height: auto !important;
          }

          .cards-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .feature-card {
            padding: 16px;
            border-radius: 12px;
          }

          .feature-card:hover {
            transform: translateY(-4px);
          }

          .card-header {
            margin-bottom: 12px;
            gap: 8px;
          }

          .card-icon {
            width: 44px;
            height: 44px;
            border-radius: 8px;
          }

          .card-title {
            font-size: 16px;
            margin-bottom: 6px;
          }

          .card-desc {
            font-size: 11px;
            margin-bottom: 12px;
            line-height: 1.4;
          }

          .section {
            margin-bottom: 18px;
          }

          .section-title {
            font-size: 16px;
          }

          .section-desc {
            font-size: 12px;
          }

          .activity-list {
            gap: 10px;
          }

          .activity-item {
            padding: 12px;
            gap: 8px;
            border-radius: 10px;
          }

          .activity-title {
            font-size: 12px;
          }

          .activity-desc {
            font-size: 10px;
          }

          .activity-icon {
            width: 32px;
            height: 32px;
            min-width: 32px;
          }

          .activity-time {
            font-size: 9px;
          }

          .activity-status {
            padding: 3px 8px;
            font-size: 10px;
          }
        }

        /* ✅ Pastikan margin-left inline style di-override di mobile */
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}