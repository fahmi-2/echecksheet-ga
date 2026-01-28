  // app/status-ga/fire-alarm/page.tsx
  "use client"

  import { useState, useEffect } from "react"
  import { useRouter } from "next/navigation"
  import { useAuth } from "@/lib/auth-context"
  import { NavbarStatic } from "@/components/navbar-static"
  import Link from "next/link"

  export default function FireAlarmPage() {
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
    const checkIfFilled = (zona: string) => {
      if (typeof window === "undefined") return false
      const key = `ga_fire_alarm_${zona}_${today}`
      return localStorage.getItem(key) !== null
    }

    const zones = [
      { id: "zona-1", title: "ZONA 1", desc: "Lobby, Hydrant Main Office" },
      { id: "zona-2", title: "ZONA 2", desc: "EXIM" },
      { id: "zona-3", title: "ZONA 3", desc: "Toilet C, Rest Area, Musholla, Pintu 1-2 Genba A" },
      { id: "zona-4", title: "ZONA 4", desc: "Office Warehouse, Lift Barang WHS, USM Area" },
      { id: "zona-5", title: "ZONA 5", desc: "Hydrant Jig Proto, Office Jig Proto" },
      { id: "zona-6", title: "ZONA 6", desc: "Hydrant Training" },
      { id: "zona-7", title: "ZONA 7", desc: "Hydrant Genba C, Dinding Mezzanine, Gel Sheet" },
      { id: "zona-8", title: "ZONA 8", desc: "Pump Room" },
      { id: "zona-9", title: "ZONA 9", desc: "Power House A, TPS B3" },
      { id: "zona-10", title: "ZONA 10", desc: "Hydrant Canteen" },
      { id: "zona-11", title: "ZONA 11", desc: "Auditorium" },
      { id: "zona-12", title: "ZONA 12", desc: "Samping Panel Genba B" },
      { id: "zona-13", title: "ZONA 13", desc: "Area Timur Genba B" },
      { id: "zona-14", title: "ZONA 14", desc: "Power House B, Parkir Bawah & Atas" },
      { id: "zona-15", title: "ZONA 15", desc: "Prepare Box EXIM, Office EXIM" },
      { id: "zona-20", title: "ZONA 20", desc: "Axis 8 - Selatan Pintu 7" },
      { id: "zona-22", title: "ZONA 22", desc: "New Warehouse" },
      { id: "zona-23", title: "ZONA 23", desc: "Bawah Mezzanine, Ministore Warehouse" },
    ]

    if (!user) return null

    return (
      <div className="app-page">
        <NavbarStatic userName={user.fullName} />

        <div className="page-content">
          <div className="header">
            <h1>🚨 Inspeksi Fire Alarm</h1>
            <p className="subtitle">Daily check sistem alarm kebakaran</p>
          </div>

          <div className="categories-grid">
            {zones.map((zone) => (
              <div key={zone.id} className="category-card">
                <div className={`card-header ${checkIfFilled(zone.id) ? 'filled' : ''}`}>
                  <div className="icon">🔔</div>
                  <h2>{zone.title}</h2>
                </div>
                <p className="card-desc">{zone.desc}</p>
                
                <div className="card-actions">
                  <Link 
                    href={`/status-ga/fire-alarm/${zone.id}?date=${today}`} 
                    className={`btn ${checkIfFilled(zone.id) ? 'btn-filled' : 'btn-primary'}`}
                  >
                    {checkIfFilled(zone.id) ? "✅ Sudah Diisi" : "📝 Isi Checklist"}
                  </Link>
                  <Link 
                    href={`/status-ga/fire-alarm/riwayat/${zone.id}`} 
                    className="btn-view"
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
            color: #d32f2f;
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
