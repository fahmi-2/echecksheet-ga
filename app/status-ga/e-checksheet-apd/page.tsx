// app/status-ga/e-checksheet-apd/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";

export default function EChecksheetApdPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)
  
  // Jenis APD dari Excel
  const apdTypes = [
    "SARUNG TANGAN BINTIL",
    "SARUNG TANGAN KATUN",
    "SARUNG TANGAN KULIT",
    "SARUNG TANGAN GREEN NITRIL",
    "SARUNG TANGAN LAS",
    "SARUNG TANGAN RESIISTANCE",
    "SARUNG TANGAN SHOWA BO500",
    "SARUNG TANGAN SHOWA 380",
    "SARUNG TANGAN PU (COMET) (KHUSUS OA)",
    "MASKER KAIN",
    "MASKER FKA",
    "MASKER 3M-3200",
    "CATRIDGE 3M-3303K-10",
    "MASKER 3M-8515 (N950)",
    "KACAMATA GERINDRA",
    "KACAMATA LAS KING",
    "CELEMEK SAKU",
    "CELEMEK TANPA SKAU",
    "CELEMEK KULIT",
    "CELEMEK SISUI",
    "CELEMEK DIP SOLDER",
    "CELEMEK RAYCHEM",
    "SAFETY SHOES KWD 901X",
    "SAFETY SHOES KWD 301X",
    "SAFETY SHOES KWS 200X",
    "SAFETY SHOES KWS 205CX",
    "NPR L-026 & L-026X",
    "TOPENG LAS",
    "VISOR HOLDER",
    "VISOR HOLDER FC48, ANSI Z87+",
    "FACE SHEILD",
    "EAR MUFF",
    "SLEAVE",
    "HELMET",
    "HELM SUSPENSION",
    "TALI HELMET",
    "CATLEPACK",
    "FULL BODY HARNESS",
    "EAR PLUG",
    "TOPI PELINDUNG",
    "BACK SUPPORT",
    "SAFETY HELMET KETINGGIAN",
    "SAFETY VEST"
  ]

  const [selectedType, setSelectedType] = useState("")
  const [items, setItems] = useState<Array<{
    no: number
    nama: string
    nik: string
    tglPengambilan: string
    dept: string
    jobDesc: string
    jumlah: number
    ttd: string
    keterangan: string
  }>>([
    {
      no: 1,
      nama: "",
      nik: "",
      tglPengambilan: new Date().toISOString().split('T')[0],
      dept: "",
      jobDesc: "",
      jumlah: 1,
      ttd: "",
      keterangan: ""
    }
  ])

  const [showPreview, setShowPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Validasi akses
  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "inspector-ga") {
      setRedirected(true)
      router.push("/home")
    }
  }, [user, router, redirected])

  const handleAddRow = () => {
    setItems([...items, {
      no: items.length + 1,
      nama: "",
      nik: "",
      tglPengambilan: new Date().toISOString().split('T')[0],
      dept: "",
      jobDesc: "",
      jumlah: 1,
      ttd: "",
      keterangan: ""
    }])
  }

  const handleRemoveRow = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    const updatedItems = newItems.map((item, idx) => ({ ...item, no: idx + 1 }))
    setItems(updatedItems)
  }

  const handleInputChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleShowPreview = () => {
    if (!selectedType) {
      alert("⚠️ Silakan pilih jenis APD terlebih dahulu!")
      return
    }
    
    // Validasi semua baris
    for (const item of items) {
      if (!item.nama.trim()) {
        alert("⚠️ Kolom 'Nama' wajib diisi!")
        return
      }
      if (!item.nik.trim()) {
        alert("⚠️ Kolom 'NIK' wajib diisi!")
        return
      }
      if (!item.tglPengambilan) {
        alert("⚠️ Kolom 'Tgl. Pengambilan' wajib diisi!")
        return
      }
      if (!item.dept.trim()) {
        alert("⚠️ Kolom 'Dept' wajib diisi!")
        return
      }
      if (!item.jobDesc.trim()) {
        alert("⚠️ Kolom 'Job Desc' wajib diisi!")
        return
      }
      if (item.jumlah <= 0) {
        alert("⚠️ Kolom 'Jumlah' harus lebih dari 0!")
        return
      }
    }

    const validItems = items.filter(item => item.nama.trim())
    if (validItems.length === 0) {
      alert("⚠️ Minimal 1 baris harus diisi!")
      return
    }

    setShowPreview(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    
    try {
      // 1. Validasi awal
      if (!selectedType.trim()) {
        throw new Error("Jenis APD belum dipilih");
      }

      if (!user?.fullName || !user?.nik) {
        throw new Error("Informasi user tidak lengkap");
      }

      // 2. Filter dan validasi items
      const validItems = items.filter(item => item.nama.trim() && item.nik.trim());
      
      if (validItems.length === 0) {
        throw new Error("Minimal 1 baris harus diisi dengan Nama dan NIK");
      }

      // 3. Validasi detail setiap item
      for (const item of validItems) {
        if (!item.nama.trim()) throw new Error(`Baris ${item.no}: Nama wajib diisi`);
        if (!item.nik.trim()) throw new Error(`Baris ${item.no}: NIK wajib diisi`);
        if (!item.tglPengambilan) throw new Error(`Baris ${item.no}: Tanggal pengambilan wajib diisi`);
        if (!item.dept.trim()) throw new Error(`Baris ${item.no}: Departemen wajib diisi`);
        if (!item.jobDesc.trim()) throw new Error(`Baris ${item.no}: Job Description wajib diisi`);
        if (item.jumlah <= 0) throw new Error(`Baris ${item.no}: Jumlah harus lebih dari 0`);
      }

      // 4. Prepare data untuk API (sesuai struktur API PostgreSQL)
      const today = new Date().toISOString().split('T')[0];
      
        const apiPayload = {
      jenisApd: selectedType,
      date: today,
      checker: user.fullName,
      checkerNik: user.nik,
      items: validItems.map(item => ({
        no: item.no,
        nama: item.nama.trim(),
        nik: item.nik.trim(),
        tglPengambilan: item.tglPengambilan,
        dept: item.dept.trim(),
        jobDesc: item.jobDesc.trim(),
        jumlah: item.jumlah,
        keterangan: item.keterangan?.trim() || ""
      }))
    };

    console.log('📤 Sending to API:', apiPayload);

    const response = await fetch('/api/apd/submit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiPayload),
      credentials: 'include'
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📥 Response body:', result);

    if (!response.ok || !result.success) {
      // Tampilkan error detail
      console.error('❌ API Error:', result);
      throw new Error(result.message || 'Gagal menyimpan data');
    }

      // 7. Success feedback
      alert(`✅ Data berhasil disimpan!\n\nID: ${result.id}\nJenis APD: ${selectedType}\nTotal Item: ${validItems.length}`);
      
      // 8. Reset form
      setSelectedType("");
      setItems([{
        no: 1,
        nama: "",
        nik: "",
        tglPengambilan: new Date().toISOString().split('T')[0],
        dept: "",
        jobDesc: "",
        jumlah: 1,
        ttd: "",
        keterangan: ""
      }]);
      setShowPreview(false);
      
      // 9. Redirect ke riwayat
      router.push("/status-ga/e-checksheet-apd/riwayat-apd");
      
    } catch (error) {
      console.error('Save error:', error);
      
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga';
      
      // Show user-friendly error
      alert(`❌ Gagal menyimpan data\n\n${errorMessage}\n\nSilakan cek kembali data Anda dan coba lagi.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false)
  }

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header">
          <h1>📋 Form Pengambilan APD</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
          </div>
        </div>

        <div className="form-container">
          {!showPreview ? (
            <>
              {/* Dropdown Jenis APD */}
              <div className="apd-type-selector">
                <label htmlFor="apd-type">Jenis APD:</label>
                <select
                  id="apd-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="apd-select"
                  required
                >
                  <option value="">-- Pilih Jenis APD --</option>
                  {apdTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {/* Preview penyimpanan */}
                {selectedType && (
                  <div className="preview-box">
                    📥 Data akan disimpan ke: <strong>{selectedType}</strong>
                  </div>
                )}
              </div>

              {/* Tabel Input */}
              <div className="checklist-table">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama *</th>
                      <th>NIK *</th>
                      <th>Tgl. Pengambilan *</th>
                      <th>Dept *</th>
                      <th>Job Desc *</th>
                      <th>Jumlah *</th>
                      <th>Keterangan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.no}</td>
                        <td>
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) => handleInputChange(index, "nama", e.target.value)}
                            placeholder="Nama karyawan"
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.nik}
                            onChange={(e) => handleInputChange(index, "nik", e.target.value)}
                            placeholder="NIK"
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={item.tglPengambilan}
                            onChange={(e) => handleInputChange(index, "tglPengambilan", e.target.value)}
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.dept}
                            onChange={(e) => handleInputChange(index, "dept", e.target.value)}
                            placeholder="Departemen"
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.jobDesc}
                            onChange={(e) => handleInputChange(index, "jobDesc", e.target.value)}
                            placeholder="Jabatan"
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.jumlah}
                            onChange={(e) => handleInputChange(index, "jumlah", Number(e.target.value))}
                            className="table-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                            placeholder="Catatan tambahan..."
                            className="table-input"
                          />
                        </td>
                        <td>
                          {items.length > 1 && (
                            <button
                              onClick={() => handleRemoveRow(index)}
                              className="remove-btn"
                              title="Hapus baris"
                            >
                              ✖
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="table-actions">
                  <button onClick={handleAddRow} className="add-btn">
                    ➕ Tambah Baris
                  </button>
                  <button onClick={handleShowPreview} className="submit-btn" disabled={!selectedType || submitting}>
                    {submitting ? "💾 Menyimpan..." : "👁️ Preview & Simpan"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="preview-container">
              <h2 className="preview-title">🔍 Preview Data</h2>
              <div className="preview-info">
                <p><strong>Jenis APD:</strong> {selectedType}</p>
                <p><strong>Total Item:</strong> {items.filter(i => i.nama.trim()).length}</p>
              </div>

              <div className="preview-table">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>NIK</th>
                      <th>Tgl. Pengambilan</th>
                      <th>Dept</th>
                      <th>Job Desc</th>
                      <th>Jumlah</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.nama.trim()).map((item, index) => (
                      <tr key={index}>
                        <td>{item.no}</td>
                        <td>{item.nama}</td>
                        <td>{item.nik}</td>
                        <td>{item.tglPengambilan}</td>
                        <td>{item.dept}</td>
                        <td>{item.jobDesc}</td>
                        <td>{item.jumlah}</td>
                        <td>{item.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="preview-actions">
                <button onClick={handleCancelPreview} className="cancel-btn">
                  ← Kembali ke Form
                </button>
                <button onClick={handleSave} className="save-btn" disabled={submitting}>
                  {submitting ? "💾 Menyimpan..." : "💾 Simpan Data"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }
        
        .page-content {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }

        .apd-type-selector {
          margin-bottom: 24px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .apd-type-selector label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .apd-select {
          padding: 10px 16px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
          min-width: 300px;
          cursor: pointer;
        }

        .preview-box {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          margin-left: 16px;
        }

        .checklist-table,
        .preview-container {
          overflow-x: auto;
        }

        .simple-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .simple-table th {
          background: #f5f9ff;
          font-weight: 600;
          color: #333;
        }

        .table-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95rem;
        }

        .table-input[type="date"] {
          padding: 6px;
        }

        .remove-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #f44336;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .remove-btn:hover {
          background: #ffebee;
        }

        .table-actions {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-top: 20px;
        }

        .add-btn {
          padding: 10px 16px;
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .add-btn:hover {
          background: #1565c0;
        }

        .submit-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Preview Styles */
        .preview-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .preview-title {
          margin: 0 0 16px;
          color: #0d47a1;
          font-size: 1.5rem;
          text-align: center;
        }

        .preview-info {
          background: #f5f9ff;
          padding: 16px;
          border-radius: 8px;
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .preview-info p {
          margin: 0;
          font-size: 0.95rem;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-btn {
          padding: 10px 24px;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        .save-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .apd-type-selector {
            flex-direction: column;
            align-items: flex-start;
          }

          .apd-select,
          .preview-box {
            min-width: 100%;
            margin-left: 0;
            margin-top: 8px;
          }

          .table-actions,
          .preview-actions {
            flex-direction: column;
            gap: 12px;
          }

          .simple-table th,
          .simple-table td {
            padding: 8px 4px;
            font-size: 0.8rem;
          }

          .preview-info {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}