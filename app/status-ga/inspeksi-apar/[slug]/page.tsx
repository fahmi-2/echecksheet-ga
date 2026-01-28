// app/status-ga/inspeksi-apar/[slug]/page.tsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";
import { format, parse, isBefore, isValid } from "date-fns";
import { aparDataBySlug } from "@/lib/apar-data";

const areaNames: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING (SEBELAH PINTU MASUK) FABRIKASI JP SISI BARAT",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM FABRIKASI C/B JP",
  "area-training-dining-mtc": "AREA TRAINING A& DINING ROOM , MTC OFFICE",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (UNTUK GENBA A)",
  "power-house-genba-c": "POWER HOUSE (UNTUK GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE AREA DAN WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR SEBELAH RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};
const checkItems = [
  {
    label: "Masa Berlaku",
    help: "Lihat identitas APAR apakah masih berlaku atau tidak",
    ok: "APAR masih berlaku",
    ng: "APAR tidak berlaku",
  },
  {
    label: "Tekanan",
    help: "Pastikan jarum penunjuk tekanan APAR tepat di warna hijau",
    ok: "Normal",
    ng: "Tidak normal",
  },
  {
    label: "Isi Tabung",
    help: "Pastikan isi APAR tidak menggumpal dengan menggoyangkan, mengocok tabung dan menimbang APAR",
    ok: "Normal",
    ng: "Tidak normal",
  },
  {
    label: "Selang",
    help: "Pastikan selang APAR tidak rusak & tidak tersumbat benda apapun",
    ok: "Tidak rusak & tidak tersumbat",
    ng: "Rusak & tersumbat",
  },
  {
    label: "Segel",
    help: "Periksa segel APAR apakah dalam kondisi terkunci ataukah dalam kondisi terbuka",
    ok: "Segel dalam posisi terkunci",
    ng: "Segel terbuka dan hilang",
  },
  {
    label: "Kondisi Tabung & Kebersihan tabung",
    help: "Pastikan area APAR tidak terhalang benda apapun",
    ok: "Tidak terhalang benda apapun",
    ng: "Ada benda yang menghalangi",
  },
  {
    label: "Gantungan Apar",
    help: "Pastikan masing-masing Gantungan APAR Tidak Rusak",
    ok: "Tidak Rusak",
    ng: "Rusak",
  },
  {
    label: "Lay out APAR",
    help: "Pastikan masing-masing APAR ada Lay out nya",
    ok: "Ada",
    ng: "Tidak ada",
  },
  {
    label: "Papan Petunjuk & Nomor Apar",
    help: "Pastikan terpasang dan mudah dilihat",
    ok: "Terpasang rapi & jelas, update",
    ng: "Tidak terpasang",
  },
  {
    label: "OS & C/S",
    help: "Pastikan Operation standart & Check Sheet terpasang rapi dan jelas dan update",
    ok: "Terpasang rapi & jelas, update",
    ng: "Tidak terpasang",
  },
  {
    label: "Area Sekitar",
    help: "Pastikan Jalan/akses APAR mudah dan dapat dijangkau oleh tim",
    ok: "Bisa dengan mudah dijangkau / diakses",
    ng: "Jalan menuju Apar terhalang benda lain",
  },
  {
    label: "Posisi APAR tidak bergeser",
    help: "Pastikan APAR tetap pada posisi semula dan tidak bergeser",
    ok: "Tidak bergeser",
    ng: "Bergeser dari posisi awal",
  },
];

export default function InspeksiAparForm({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = use(params);
  const today = new Date();
  const date = format(today, "yyyy-MM-dd");

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  useEffect(() => {
    const areaName = areaNames[slug];
    if (!areaName) {
      alert("Area tidak ditemukan!");
      router.push("/status-ga/inspeksi-apar");
      return;
    }

    const rawData = aparDataBySlug[slug as keyof typeof aparDataBySlug] || [];
    const initialItems = rawData.map((item) => ({
      no: item.no,
      jenisApar: item.jenisApar,
      lokasi: item.lokasi,
      noApar: item.noApar,
      expDate: item.expDate,
      ...Object.fromEntries(checkItems.map((_, idx) => [`check${idx + 1}`, ""])),
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      dueDate: "",
      verifikasi: "",
    }));
    setItems(initialItems);
  }, [slug, user]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const parseExpDate = (dateStr: string): Date | null => {
    let parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return parsed;
    parsed = parse(dateStr, "dd/MM/yy", new Date());
    if (isValid(parsed)) return parsed;
    return null;
  };

  const isExpired = (expDateString: string): boolean => {
    const expDate = parseExpDate(expDateString);
    return expDate ? isBefore(expDate, today) : false;
  };

  const handleShowPreview = () => {
    // Validasi semua kolom pengecekan wajib O/X
    for (const item of items) {
      for (let i = 1; i <= checkItems.length; i++) {
        const val = item[`check${i}`];
        if (!val || !["O", "X"].includes(val)) {
          alert("⚠️ Semua kolom pengecekan harus diisi dengan 'O' atau 'X'!");
          return;
        }
      }
    }

    const ngExists = items.some((item) =>
      Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean)
    );

    // 🔴 Jika ada NG, pastikan keterangan diisi
    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean) &&
          (!item.keterangan || item.keterangan.trim() === "")
      );
      if (missingKeterangan) {
        alert("⚠️ Harap isi kolom 'Keterangan' untuk semua item yang berstatus NG!");
        return;
      }
    }

    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleCancelPreview = () => setShowPreview(false);

  const handleSave = () => {
    const storageKey = `ga_apar_${slug}_${date}`;
    const result = {
      id: `apar-${slug}-${Date.now()}`,
      date,
      area: areaNames[slug],
      items,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(result));

    const historyKey = `ga_apar_history_${slug}`;
    const existing = localStorage.getItem(historyKey) || "[]";
    const history = JSON.parse(existing);
    history.push({ ...result, id: storageKey });
    localStorage.setItem(historyKey, JSON.stringify(history));

    alert("✅ Data berhasil disimpan!");
    router.push("/status-ga/inspeksi-apar");
  };

  const handleReportNg = () => {
    const ngItems = items
      .filter((item) =>
        Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean)
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.noApar})`,
        notes: item.keterangan || "Tidak ada keterangan",
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi APAR - ${areaNames[slug]}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist APAR",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/pelaporan");
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-top">
            <button onClick={() => router.back()} className="btn-back">← Kembali</button>
            <h1>🧯 Inspeksi APAR - {areaNames[slug]}</h1>
          </div>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        {!showPreview ? (
          <div className="form-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Jenis APAR</th>
                  <th>Lokasi</th>
                  <th>No. APAR</th>
                  <th>Exp. Date</th>
                  {checkItems.map((item, idx) => (
                    <th key={idx} title={`${item.help}\n\nO: ${item.ok}\nX: ${item.ng}`}>
                      {item.label}
                    </th>
                  ))}
                  <th>Keterangan</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Due Date</th>
                  <th>Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.no}</td>
                    <td>{item.jenisApar}</td>
                    <td>{item.lokasi}</td>
                    <td>{item.noApar}</td>
                    <td className={isExpired(item.expDate) ? "text-red-600 font-bold" : ""}>
                      {item.expDate}
                    </td>
                    {checkItems.map((_, idx) => (
                      <td key={idx}>
                        <select
                          value={item[`check${idx + 1}`]}
                          onChange={(e) => handleInputChange(index, `check${idx + 1}`, e.target.value)}
                          className="status-select"
                        >
                          <option value="">Pilih</option>
                          <option value="O">O</option>
                          <option value="X">X</option>
                        </select>
                      </td>
                    ))}
                    <td>
                      <input
                        type="text"
                        value={item.keterangan}
                        onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                        placeholder="Wajib diisi jika NG"
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.tindakanPerbaikan}
                        onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                        placeholder="Tindakan perbaikan..."
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.pic}
                        onChange={(e) => handleInputChange(index, "pic", e.target.value)}
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => handleInputChange(index, "dueDate", e.target.value)}
                        className="date-input"
                      />
                    </td>
                    <td>
                      <select
                        value={item.verifikasi}
                        onChange={(e) => handleInputChange(index, "verifikasi", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="O">O</option>
                        <option value="X">X</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button onClick={() => router.push("/status-ga/inspeksi-apar")} className="btn-cancel">
                Batal
              </button>
              <button onClick={handleShowPreview} className="btn-submit">
                👁️ Preview & Simpan
              </button>
            </div>

            <div className="info-box mt-6">
              <p><strong>Catatan:</strong></p>
              <ul className="list-disc pl-5 mt-2 text-sm">
                <li>Kolom <strong>Exp. Date</strong> akan berwarna <span className="text-red-600">merah</span> jika sudah lewat tanggal hari ini.</li>
                <li>Semua kolom pengecekan wajib diisi dengan <strong>O</strong> (OK) atau <strong>X</strong> (NG).</li>
                <li><strong>Keterangan wajib diisi</strong> jika ada temuan NG.</li>
                <li>Gunakan <strong>title tooltip</strong> pada header kolom untuk melihat petunjuk pengecekan lengkap.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <h2 className="preview-title">🔍 Preview Data</h2>
            <div className="preview-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Lokasi</th>
                    <th>No. APAR</th>
                    {checkItems.map((item, idx) => (
                      <th key={idx}>{item.label}</th>
                    ))}
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td>{item.noApar}</td>
                      {checkItems.map((_, idx) => (
                        <td key={idx} className={item[`check${idx + 1}`] === "X" ? "status-ng" : ""}>
                          {item[`check${idx + 1}`]}
                        </td>
                      ))}
                      <td>{item.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn">← Kembali</button>
              {hasNg ? (
                <div className="ng-actions">
                  <button onClick={handleReportNg} className="report-btn">📢 Laporkan NG</button>
                  <button onClick={handleSave} className="save-btn">💾 Simpan Tanpa Lapor</button>
                </div>
              ) : (
                <button onClick={handleSave} className="save-btn">💾 Simpan Data</button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1800px;
          margin: 0 auto;
          padding: 24px;
        }
        .header h1 {
          margin: 0;
          color: #b71c1c;
          font-size: 2rem;
        }
        .header-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        .btn-back {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .subtitle {
          color: #666;
          margin-top: 8px;
        }
        .form-container,
        .preview-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 24px;
          overflow-x: auto;
        }
        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          min-width: 1800px;
        }
        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px 8px;
          text-align: left;
          border: 1px solid #eee;
          font-size: 0.9rem;
          vertical-align: top;
        }
        .checklist-table th {
          background: #fff8e1;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        /* Lebar Kolom Diperbesar */
        .checklist-table th:nth-child(1),
        .checklist-table td:nth-child(1) { width: 50px; text-align: center; }
        .checklist-table th:nth-child(2),
        .checklist-table td:nth-child(2) { width: 150px; }
        .checklist-table th:nth-child(3),
        .checklist-table td:nth-child(3) { width: 220px; }
        .checklist-table th:nth-child(4),
        .checklist-table td:nth-child(4) { width: 110px; }
        .checklist-table th:nth-child(5),
        .checklist-table td:nth-child(5) { width: 120px; }

        /* Kolom pengecekan (12 kolom) */
        .checklist-table th:nth-child(n+6):nth-child(-n+17),
        .checklist-table td:nth-child(n+6):nth-child(-n+17) {
          width: 90px;
          text-align: center;
          font-size: 0.85rem;
        }

        /* Kolom akhir — lebih lebar */
        .checklist-table th:nth-child(18),
        .checklist-table td:nth-child(18) { width: 200px; } /* Keterangan */
        .checklist-table th:nth-child(19),
        .checklist-table td:nth-child(19) { width: 220px; } /* Tindakan Perbaikan */
        .checklist-table th:nth-child(20),
        .checklist-table td:nth-child(20) { width: 130px; } /* PIC */
        .checklist-table th:nth-child(21),
        .checklist-table td:nth-child(21) { width: 140px; } /* Due Date */
        .checklist-table th:nth-child(22),
        .checklist-table td:nth-child(22) { width: 100px; }  /* Verifikasi */

        .status-select,
        .notes-input,
        .date-input {
          width: 100%;
          padding: 8px 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.9rem;
          height: 36px;
          box-sizing: border-box;
        }
        .status-select {
          height: auto;
          padding: 6px;
        }
        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .btn-cancel,
        .btn-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }
        .btn-submit {
          background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
          color: white;
        }
        .preview-title {
          margin: 0 0 24px;
          color: #b71c1c;
          font-size: 1.5rem;
          text-align: center;
        }
        .status-ng {
          background: #ffebee;
          color: #c62828;
          font-weight: bold;
        }
        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .cancel-btn,
        .save-btn,
        .report-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .cancel-btn {
          background: #f5f5f5;
          color: #333;
        }
        .save-btn {
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
        }
        .report-btn {
          background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
          color: white;
          margin-right: 12px;
        }
        .ng-actions {
          display: flex;
          gap: 12px;
        }
        .info-box {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 12px;
          border-radius: 0 4px 4px 0;
          font-size: 0.9rem;
          margin-top: 24px;
        }
        @media (max-width: 1200px) {
          .page-content {
            padding: 16px;
          }
          .checklist-table th,
          .checklist-table td {
            padding: 10px 6px;
            font-size: 0.85rem;
          }
          .status-select,
          .notes-input,
          .date-input {
            font-size: 0.85rem;
            padding: 6px 4px;
          }
        }
      `}</style>
    </div>
  );
}
