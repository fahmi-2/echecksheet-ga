// app/status-ga/checksheet-toilet/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";

export default function ChecksheetToiletListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  const areas = [
    { id: "toilet-driver", title: "TOILET - DRIVER", desc: "Toilet laki & perempuan" },
    { id: "toilet-bea-cukai", title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan" },
    { id: "toilet-parkir", title: "TOILET - PARKIR", desc: "Toilet laki & perempuan" },
    { id: "toilet-c2", title: "TOILET - C2", desc: "Toilet wanita" },
    { id: "toilet-c1", title: "TOILET - C1", desc: "Toilet laki & perempuan" },
    { id: "toilet-d", title: "TOILET - D", desc: "Toilet laki & perempuan" },
    { id: "toilet-auditorium", title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan" },
    { id: "toilet-whs", title: "TOILET - WHS", desc: "Toilet wanita" },
    { id: "toilet-b1", title: "TOILET - B1", desc: "Toilet laki & perempuan" },
    { id: "toilet-a", title: "TOILET - A", desc: "Toilet laki & perempuan" },
    { id: "toilet-lobby", title: "TOILET - LOBBY", desc: "Toilet laki & perempuan" },
    { id: "toilet-office-main", title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan" },
  ];

  const checkIfFilled = (areaId: string) => {
    if (typeof window === "undefined") return false;
    const key = `e-checksheet-toilet-${areaId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return false;
    try {
      const data = JSON.parse(saved);
      return !!data.find((entry: any) => entry.date === today);
    } catch {
      return false;
    }
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header-section">
          <div className="header-content">
            <h1>🚻 Checksheet Toilet</h1>
            <p className="header-subtitle">Daily check kebersihan dan kondisi toilet</p>
          </div>
        </div>

        <div className="cards-grid">
          {areas.map((area) => (
            <div key={area.id} className="card">
              <div className={`card-header ${checkIfFilled(area.id) ? 'filled' : 'not-filled'}`}>
                <div className="emoji">🚽</div>
                <h2>{area.title}</h2>
              </div>
              <p className="card-desc">{area.desc}</p>
              <div className="card-actions">
                <Link 
                  href={`/status-ga/checksheet-toilet/${area.id}`} 
                  className={`btn ${checkIfFilled(area.id) ? 'btn-filled' : 'btn-primary'}`}
                >
                  {checkIfFilled(area.id) ? "✅ Sudah Diisi" : "📝 Isi Checklist"}
                </Link>
                <Link
                  href={`/status-ga/checksheet-toilet/riwayat/${area.id}`}
                  className="btn btn-history"
                >
                  📊 Riwayat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .app-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-content {
          padding: 32px 24px;
          max-width: 1400px;
          margin: 0 auto;
          margin-left: 75px; /* ← SESUAIKAN DENGAN LEBAR SIDEBAR */
        }

        .header-section {
          margin-bottom: 32px;
        }

        .header-content {
          background: linear-gradient(135deg, #0059f1 0%, #13d9ef 100%);
          border-radius: 12px;
          padding: 24px 32px;
          box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
        }

        .header-content h1 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 400;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .card:hover {
          transform: translateY(-4px);
        }

        .card-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-header.filled {
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
        }

        .card-header.not-filled {
          background: linear-gradient(135deg, #0796de, #17ddfc);
        }

        .emoji {
          font-size: 2rem;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.3rem;
          color: #ffffff;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
          color: white;
          background: #0036fa;
        }

        /* Primary Button */
.btn-primary {
  background: #0036fa;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #00bfff;
  box-shadow: 0 2px 8px rgba(0, 54, 250, 0.3);
}

        
/* Filled Button */
.btn-filled {
  background: #4caf50;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
}

.btn-filled:hover {
  background: #388e3c;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

 
/* History Button */
.btn-history {
  background: #0d47a1 !important;
  color: white !important;  
  padding: 8px 12px !important;
}

.btn-history:hover {
  background: #1565c0;
  box-shadow: 0 2px 8px rgba(13, 71, 161, 0.3);
}

        @media (max-width: 768px) {
          .page-content {
            margin-left: 0;
            padding: 16px 12px;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}