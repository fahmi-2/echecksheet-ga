// app/status-ga/checksheet-toilet/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";
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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <NavbarStatic userName={user.fullName} />
      <div style={{ padding: "20px 16px", maxWidth: "1200px", margin: "0 auto" }}>
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
              🚻 Checksheet Toilet
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)" }}>
              Daily check kebersihan dan kondisi toilet
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
          {areas.map((area) => (
            <div
              key={area.id}
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                overflow: "hidden",
                transition: "transform 0.3s",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  background: checkIfFilled(area.id)
                    ? "linear-gradient(135deg, #e8f5e9, #c8e6c9)"
                    : "linear-gradient(135deg, #ffebee, #ffcdd2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div style={{ fontSize: "2rem" }}>🚽</div>
                <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#d32f2f" }}>{area.title}</h2>
              </div>
              <p style={{ padding: "0 20px", color: "#666", lineHeight: "1.5", margin: "16px 0" }}>{area.desc}</p>
              <div style={{ padding: "0 20px 20px", display: "flex", gap: "12px" }}>
                <Link 
  href={`/status-ga/checksheet-toilet/${area.id}`} 
  className={`btn ${checkIfFilled(area.id) ? 'btn-filled' : 'btn-primary'}`}
>
  {checkIfFilled(area.id) ? "✅ Sudah Diisi" : "📝 Isi Checklist"}
</Link>
                <Link
                  href={`/status-ga/checksheet-toilet/riwayat/${area.id}`}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    textAlign: "center",
                    textDecoration: "none",
                    background: "#1e88e5",
                    color: "white",
                  }}
                >
                  📊 Riwayat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}