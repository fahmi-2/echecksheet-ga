  // /app/status-ga/checksheet-toilet/riwayat/[area]/page.tsx
  "use client";

  import { useState, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { useAuth } from "@/lib/auth-context";
  import { NavbarStatic } from "@/components/navbar-static";
  import * as React from "react";
  import Link from "next/link";

  interface ChecksheetEntry {
    date: string;
    hasilPemeriksaan: string;
    keteranganTemuan: string;
    tindakanPerbaikan: string;
    pic: string;
    dueDate: string;
    verify: string;
    inspector: string;
  }

  interface SavedData {
    [itemKey: string]: ChecksheetEntry[];
  }

  export default function RiwayatToilet({ params }: { params: Promise<{ area: string }> }) {
    const resolvedParams = React.use(params);
    const areaId = resolvedParams.area;

    const router = useRouter();
    const { user, loading } = useAuth();

    const [isMounted, setIsMounted] = useState(false);
    const [allData, setAllData] = useState<SavedData>({});
    const [filterDate, setFilterDate] = useState<string>("");

    // Mapping area
    const areaMap: Record<string, { title: string; desc: string }> = {
      "toilet-driver": { title: "TOILET - DRIVER", desc: "Toilet laki & perempuan" },
      "toilet-bea-cukai": { title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan" },
      "toilet-parkir": { title: "TOILET - PARKIR", desc: "Toilet laki & perempuan" },
      "toilet-c2": { title: "TOILET - C2", desc: "Toilet wanita" },
      "toilet-c1": { title: "TOILET - C1", desc: "Toilet laki & perempuan" },
      "toilet-d": { title: "TOILET - D", desc: "Toilet laki & perempuan" },
      "toilet-auditorium": { title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan" },
      "toilet-whs": { title: "TOILET - WHS", desc: "Toilet wanita" },
      "toilet-b1": { title: "TOILET - B1", desc: "Toilet laki & perempuan" },
      "toilet-a": { title: "TOILET - A", desc: "Toilet laki & perempuan" },
      "toilet-lobby": { title: "TOILET - LOBBY", desc: "Toilet laki & perempuan" },
      "toilet-office-main": { title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan" },
    };

    const currentArea = areaMap[areaId] || { title: decodeURIComponent(areaId), desc: "Lokasi tidak diketahui" };

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      if (!isMounted) return;
      try {
        const key = `e-checksheet-toilet-${areaId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAllData(parsed);
        }
      } catch (err) {
        console.warn("Gagal memuat riwayat:", err);
      }
    }, [isMounted, areaId]);

    useEffect(() => {
      if (!isMounted || loading) return;
      if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
        router.push("/login-page");
      }
    }, [user, loading, router, isMounted]);

    if (!isMounted) return null;
    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) return null;

    // Ambil semua tanggal unik
    const allDates = new Set<string>();
    Object.values(allData).forEach(entries => {
      entries.forEach(entry => allDates.add(entry.date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const filteredDates = filterDate ? [filterDate] : sortedDates;

    // Inspection items (harus sama dengan form)
    const inspectionItems = [
      { key: "kebersihanLantai", no: 1, item: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
      { key: "kebersihanDinding", no: 2, item: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
      { key: "bauToilet", no: 3, item: "Bau tidak menyengat / tidak ada bau tidak sedap" },
      { key: "ketersediaanAir", no: 4, item: "Ketersediaan air mencukupi" },
      { key: "klosetBersih", no: 5, item: "Kloset bersih, tidak mampet, tidak bocor" },
      { key: "wastafel", no: 6, item: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
      { key: "tisuToilet", no: 7, item: "Tisu toilet tersedia" },
      { key: "tempatSampah", no: 8, item: "Tempat sampah tersedia dan tertutup" },
      { key: "ventilasi", no: 9, item: "Ventilasi cukup (tidak pengap)" },
      { key: "perlengkapanLain", no: 10, item: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
        <NavbarStatic userName={user.fullName} />
        <div style={{ padding: "20px 16px", maxWidth: "100%", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #d32f2f 0%, #f44336 100%)",
                borderRadius: "12px",
                padding: "20px 24px",
                boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
              }}
            >
              <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
                📊 Riwayat Checksheet Toilet
              </h1>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)" }}>
                {currentArea.title}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div
            style={{
              background: "white",
              border: "1px solid #e8e8e8",
              borderRadius: "10px",
              padding: "16px 20px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
              marginBottom: "20px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: "600", color: "#d32f2f", fontSize: "clamp(12px, 3vw, 14px)" }}>
              📅 Filter Tanggal:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "clamp(12px, 3vw, 14px)",
              }}
            />
            <button
              onClick={() => setFilterDate("")}
              style={{
                padding: "8px 16px",
                background: "#bdbdbd",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "clamp(12px, 3vw, 13px)",
              }}
            >
              Reset
            </button>
            <Link
              href={`/status-ga/checksheet-toilet/${areaId}`}
              style={{
                marginLeft: "auto",
                padding: "8px 16px",
                background: "#1e88e5",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "600",
              }}
            >
              ➕ Tambah Data
            </Link>
          </div>

          {/* Riwayat per Tanggal */}
          {filteredDates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "10px" }}>
              Belum ada data.
            </div>
          ) : (
            filteredDates.map((date) => {
              const hasAnyData = inspectionItems.some(item => allData[item.key]?.some(e => e.date === date));
              if (!hasAnyData) return null;

              return (
                <div key={date} style={{ marginBottom: "30px", background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #eee" }}>
                  <div style={{ background: "#ffebee", padding: "12px 16px", fontWeight: "700", color: "#b71c1c" }}>
                    Tanggal: {new Date(date).toLocaleDateString("id-ID")}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(11px, 2.5vw, 13px)", minWidth: "1000px" }}>
                      <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>No</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Item Pengecekan</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Hasil</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Keterangan</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Tindakan</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>PIC</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Due Date</th>
                          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Verify</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map((item) => {
                          const entry = allData[item.key]?.find(e => e.date === date);
                          return (
                            <tr key={item.key}>
                              <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{item.no}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.item}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center", fontWeight: "600", color: entry?.hasilPemeriksaan === "OK" ? "#2e7d32" : "#d32f2f" }}>
                                {entry?.hasilPemeriksaan || "-"}
                              </td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{entry?.keteranganTemuan || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{entry?.tindakanPerbaikan || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{entry?.pic || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("id-ID") : "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #ddd" }}>{entry?.verify || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }