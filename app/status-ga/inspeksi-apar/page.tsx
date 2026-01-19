  "use client";

  import { useEffect, useMemo } from "react";
  import { useRouter } from "next/navigation";
  import { useAuth } from "@/lib/auth-context";
  import { NavbarStatic } from "@/components/navbar-static";
  import { aparDataBySlug } from "@/lib/apar-data";

  const AREAS = [
    { name: "AREA LOCKER & SECURITY", slug: "area-locker-security" },
    { name: "AREA KANTIN", slug: "area-kantin" },
    { name: "AREA AUDITORIUM", slug: "area-auditorium" },
    { name: "AREA MAIN OFFICE", slug: "area-main-office" },
    { name: "EXIM", slug: "exim" },
    { name: "AREA GENBA A", slug: "area-genba-a" },
    { name: "AREA MEZZANINE GENBA A", slug: "area-mezzanine-genba-a" },
    { name: "JIG PROTO 1 AREA RECEIVING (SEBELAH PINTU MASUK) FABRIKASI JP SISI BARAT", slug: "jig-proto-1-area-receiving" },
    { name: "STOCK CONTROL AREA", slug: "stock-control-area" },
    { name: "JIG PROTO 2 CNC ROOM FABRIKASI C/B JP", slug: "jig-proto-2-cnc-room" },
    { name: "AREA TRAINING A& DINING ROOM , MTC OFFICE", slug: "area-training-dining-mtc" },
    { name: "GENBA C", slug: "genba-c" },
    { name: "AREA PUMP ROOM & WAREHOUSE", slug: "area-pump-room-warehouse" },
    { name: "POWER HOUSE (UNTUK GENBA A)", slug: "power-house-genba-a" },
    { name: "POWER HOUSE (UNTUK GENBA C)", slug: "power-house-genba-c" },
    { name: "AREA TPS B3", slug: "area-tps-b3" },
    { name: "NEW BUILDING WAREHOUSE", slug: "new-building-warehouse" },
    { name: "GENBA B", slug: "genba-b" },
    { name: "POWER HOUSE AREA DAN WORKSHOP", slug: "power-house-workshop" },
    { name: "AREA SEGITIGA GA", slug: "area-segitiga-ga" },
    { name: "AREA PARKIR MOTOR", slug: "area-parkir-motor" },
    { name: "FORKLIFT", slug: "forklift" },
    { name: "SAMPING PAGAR SEBELUM RAK HELM", slug: "samping-pagar-rak-helm" },
    { name: "BELAKANG KANTIN", slug: "belakang-kantin" },
    { name: "IR ROOM", slug: "ir-room" },
    { name: "AREA AUDITORIUM OUTDOOR", slug: "area-auditorium-outdoor" },
    { name: "AREA KLINIK", slug: "area-klinik" },
    { name: "MESIN RAYCHEM GENBA A", slug: "mesin-raychem-genba-a" },
    { name: "MESIN RAYCHEM GENBA B", slug: "mesin-raychem-genba-b" },
    { name: "MESIN RAYCHEM GENBA C", slug: "mesin-raychem-genba-c" },
  ];

  export default function InspeksiAparPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
      if (!user) return;
      if (user.role !== "inspector-ga") {
        router.push("/home");
      }
    }, [user, router]);

    if (!user) return <div className="loading">Memuat...</div>;
    if (user.role !== "inspector-ga") return null;

    const validAreas = useMemo(() => {
      return AREAS.filter(area => aparDataBySlug[area.slug as keyof typeof aparDataBySlug]?.length > 0);
    }, []);

    return (
      <div className="app-page">
        <NavbarStatic userName={user.fullName} />

        <div className="page-content">
          <h1 className="title">🧯 Status Inspeksi APAR</h1>
          <p className="subtitle">Pilih area untuk melihat detail inspeksi:</p>

          <div className="card-grid">
            {validAreas.map((area) => (
              <div key={area.slug} className="option-card-container">
                <button
                  className="option-card"
                  onClick={() =>
                    router.push(`/status-ga/inspeksi-apar/${area.slug}`)
                  }
                >
                  <span className="icon">📍</span>
                  <div className="text">
                    <h2>{area.name}</h2>
                    <p>Lihat status dan detail APAR</p>
                  </div>
                </button>
                <button
                  className="history-btn"
                  onClick={() =>
                    router.push(`/status-ga/inspeksi-apar/${area.slug}/riwayat`)
                  }
                >
                  📜 Lihat Riwayat
                </button>
              </div>
            ))}
          </div>

          <div className="info-box">
            <h3>Catatan Penting:</h3>
            <ul>
              <li>
                <strong>Kolom berwarna hitam atau kosong</strong> pada tabel item pengecekan berarti{" "}
                <em>fitur tersebut tidak tersedia/tidak relevan</em> untuk jenis APAR di lokasi tersebut.
              </li>
              <li>
                <strong>Tanggal Expired (Exp. Date)</strong> yang telah melewati tanggal hari ini akan ditampilkan dalam{" "}
                <span className="expired-text">warna merah</span>.
              </li>
            </ul>
          </div>
        </div>

        <style jsx>{`
          .page-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
            background: #fafafa;
            min-height: calc(100vh - 80px);
          }
          .title {
            color: #c62828;
            font-size: 2rem;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .subtitle {
            color: #757575;
            font-size: 1.05rem;
            margin-bottom: 32px;
          }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
          }

          .option-card-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .option-card {
            display: flex;
            gap: 16px;
            padding: 24px;
            background: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            align-items: flex-start;
            text-align: left;
            flex: 1;
            border-left: 5px solid #d32f2f;
          }
          .option-card:hover {
            box-shadow: 0 8px 24px rgba(211, 47, 47, 0.15);
            transform: translateY(-6px);
            border-left-color: #c62828;
          }
          .option-card .icon {
            font-size: 2.5rem;
            min-width: 60px;
            text-align: center;
            color: #d32f2f;
            flex-shrink: 0;
          }
          .option-card .text h2 {
            margin: 0 0 8px 0;
            color: #1a237e;
            font-size: 1.1rem;
            line-height: 1.4;
            font-weight: 600;
          }
          .option-card .text p {
            margin: 0;
            color: #616161;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          .history-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #ffebee 0%, #f5f5f5 100%);
            border: 1.5px solid #ffb3ba;
            border-radius: 8px;
            color: #b71c1c;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.95rem;
          }
          .history-btn:hover {
            background: linear-gradient(135deg, #ffcdd2 0%, #eeeeee 100%);
            border-color: #ff8a97;
            box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
            transform: translateY(-2px);
          }

          .info-box {
            background: linear-gradient(135deg, #fff8e1 0%, #fffde7 100%);
            border-left: 5px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin-top: 32px;
            font-size: 0.95rem;
            color: #5d4037;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }
          .info-box h3 {
            margin: 0 0 12px 0;
            color: #e65100;
            font-weight: 700;
          }
          .info-box ul {
            list-style: disc;
            padding-left: 20px;
            margin: 0;
          }
          .info-box li {
            margin-bottom: 8px;
            line-height: 1.6;
          }
          .expired-text {
            color: #d32f2f;
            font-weight: bold;
            background: #ffebee;
            padding: 2px 6px;
            border-radius: 3px;
          }
        `}</style>
      </div>
    );
  }
