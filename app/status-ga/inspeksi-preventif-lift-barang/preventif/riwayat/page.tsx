"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

type PreventiveHistoryEntry = {
  id?: string;
  date: string;
  inspector: string;
  items?: Record<string, any>;
  additionalNotes?: string;
};

export default function RiwayatPreventivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<PreventiveHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PreventiveHistoryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<number, { hasil: string; catatan?: string }>>({});
  const [editAdditionalNotes, setEditAdditionalNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
      return;
    }

    try {
      const allKeys = Object.keys(localStorage).filter(key =>
        key.startsWith("preventive_lift_barang_") && key !== "preventive_lift_barang_riwayat_semua"
      );

      const allEntries = allKeys
        .map(key => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setHistory(allEntries as PreventiveHistoryEntry[]);
      setFilteredHistory(allEntries as PreventiveHistoryEntry[]);
    } catch (error) {
      console.error("Error loading history:", error);
      setHistory([]);
      setFilteredHistory([]);
    }
  }, [user, router]);

  // Filter berdasarkan tanggal
  useEffect(() => {
    if (!selectedDate) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(entry => entry.date === selectedDate);
      setFilteredHistory(filtered);
    }
  }, [selectedDate, history]);

  const handleEditStart = (entry: PreventiveHistoryEntry) => {
    setEditingId(entry.id || "");
    setEditFormData(entry.items || {});
    setEditAdditionalNotes(entry.additionalNotes || "");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
    setEditAdditionalNotes("");
  };

  const handleEditFieldChange = (id: number, field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleEditSave = () => {
    // Validasi semua field terisi
    const emptyFields = [1, 2, 3, 4, 5].filter(id => !editFormData[id]?.hasil?.trim());
    if (emptyFields.length > 0) {
      alert(`❗ Field berikut masih kosong:\n${emptyFields.map(id => getCheckItemName(id)).join(", ")}`);
      return;
    }

    const entryToUpdate = history.find(e => e.id === editingId);
    if (!entryToUpdate) return;

    const allKeys = Object.keys(localStorage).filter(key =>
      key.startsWith("preventive_lift_barang_") && key !== "preventive_lift_barang_riwayat_semua"
    );

    const storageKey = allKeys.find(key => {
      const item = localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : null;
      return parsed?.id === editingId;
    });

    if (storageKey) {
      const updatedEntry = {
        ...entryToUpdate,
        items: editFormData,
        additionalNotes: editAdditionalNotes,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(updatedEntry));

      // Update history list
      const updatedHistory = history.map(h => h.id === editingId ? updatedEntry : h);
      setHistory(updatedHistory);
      setFilteredHistory(updatedHistory);

      alert("✅ Data berhasil diperbarui!");
      handleEditCancel();
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    const allKeys = Object.keys(localStorage).filter(key =>
      key.startsWith("preventive_lift_barang_")
    );

    const storageKey = allKeys.find(key => {
      const item = localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : null;
      return parsed?.id === id;
    });

    if (storageKey) {
      localStorage.removeItem(storageKey);
      const updatedHistory = history.filter(h => h.id !== id);
      setHistory(updatedHistory);
      setFilteredHistory(updatedHistory);
      alert("✅ Data berhasil dihapus!");
    }
  };

  if (!user) return <div>Loading...</div>;
  if (user.role !== "inspector-ga") return null;

  // Dapatkan daftar tanggal unik untuk dropdown
  const uniqueDates = [...new Set(history.map(entry => entry.date))].sort().reverse();

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header-section">
          <button onClick={() => router.back()} className="btn-back">← Kembali</button>
          <h1>🔧 Riwayat Preventive Lift Barang</h1>
        </div>

        {/* Filter Tanggal */}
        <div className="filter-section">
          <label htmlFor="date-filter">Filter berdasarkan tanggal:</label>
          <select
            id="date-filter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-filter"
          >
            <option value="">Semua Tanggal</option>
            {[...new Set(history.map(entry => entry.date))].sort().reverse().map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="empty-message">Tidak ada riwayat preventive maintenance{selectedDate ? ` pada tanggal ${new Date(selectedDate).toLocaleDateString('id-ID')}` : ''}.</p>
        ) : (
          <div className="history-list">
            {filteredHistory.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="history-card">
                {editingId === entry.id ? (
                  // EDIT MODE
                  <div className="edit-mode">
                    <div className="card-header">
                      <h3>Edit Data - Tanggal: {new Date(entry.date).toLocaleDateString('id-ID')}</h3>
                      <p>Inspector: {entry.inspector}</p>
                    </div>

                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Check Item</th>
                          <th>Hasil *</th>
                          <th>Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map(id => (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{getCheckItemName(id)}</td>
                            <td>
                              <input
                                type="text"
                                value={editFormData[id]?.hasil || ""}
                                onChange={(e) => handleEditFieldChange(id, "hasil", e.target.value)}
                                className="edit-input"
                              />
                            </td>
                            <td>
                              <textarea
                                value={editFormData[id]?.catatan || ""}
                                onChange={(e) => handleEditFieldChange(id, "catatan", e.target.value)}
                                className="edit-textarea"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="additional-notes edit-mode-notes">
                      <h4>📝 Saran & Temuan Tambahan:</h4>
                      <textarea
                        value={editAdditionalNotes}
                        onChange={(e) => setEditAdditionalNotes(e.target.value)}
                        className="edit-textarea full"
                      />
                    </div>

                    <div className="edit-actions">
                      <button onClick={handleEditCancel} className="btn-cancel">Batal</button>
                      <button onClick={handleEditSave} className="btn-save">✅ Simpan Perubahan</button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <>
                    <div className="card-header">
                      <h3>Tanggal: {new Date(entry.date).toLocaleDateString('id-ID')}</h3>
                      <p>Inspector: {entry.inspector}</p>
                    </div>

                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Check Item</th>
                          <th>Hasil/Status</th>
                          <th>Keterangan/Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items && typeof entry.items === 'object' ? (
                          Object.entries(entry.items).map(([id, data]) => {
                            const hasil = data?.hasil || data?.status || '-';
                            const catatan = data?.catatan || data?.keterangan || '-';
                            
                            return (
                              <tr key={id}>
                                <td>{id}</td>
                                <td>{getCheckItemName(Number(id))}</td>
                                <td className="status-cell">{hasil}</td>
                                <td>{catatan}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>
                              Tidak ada data item
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {entry.additionalNotes && (
                      <div className="additional-notes">
                        <h4>📝 Saran & Temuan Tambahan:</h4>
                        <p>{entry.additionalNotes}</p>
                      </div>
                    )}

                    <div className="card-actions">
                      <button onClick={() => handleEditStart(entry)} className="btn-edit">✏️ Edit</button>
                      <button onClick={() => handleDeleteEntry(entry.id || "")} className="btn-delete">🗑️ Hapus</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .btn-back {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.95rem;
        }

        .btn-back:hover {
          background: #e0e0e0;
          border-color: #999;
        }

        .header-section h1 {
          color: #0277bd;
          margin: 0;
          flex: 1;
        }
        
        /* Filter Section */
        .filter-section {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-section label {
          font-weight: 600;
          color: #555;
        }
        .date-filter {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: white;
          min-width: 200px;
        }

        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px 20px;
          font-size: 1.1rem;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .history-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .card-header {
          background: #e1f5fe;
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
        }
        .card-header h3 {
          margin: 0 0 8px;
          color: #01579b;
        }
        .card-header p {
          margin: 0;
          color: #555;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
        }
        .history-table th,
        .history-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .history-table th {
          background: #f5fbff;
          font-weight: 600;
        }
        .status-cell {
          font-weight: 600;
          color: #0277bd;
        }
        .additional-notes {
          padding: 16px 24px;
          background: #f9f9f9;
          border-top: 1px solid #eee;
        }
        .additional-notes h4 {
          margin: 0 0 8px;
          color: #01579b;
        }
        .additional-notes p {
          margin: 0;
          color: #555;
          line-height: 1.6;
        }

        /* Edit Mode Styles */
        .edit-mode {
          padding: 24px;
        }
        .edit-mode .card-header {
          background: #fff3e0;
          padding: 16px;
          margin: -24px -24px 20px -24px;
          border-bottom: 2px solid #ffb74d;
        }
        .edit-input, .edit-textarea {
          width: 100%;
          padding: 8px;
          border: 2px solid #bbdefb;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .edit-input:focus, .edit-textarea:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }
        .edit-textarea {
          min-height: 60px;
          resize: vertical;
        }
        .edit-textarea.full {
          min-height: 100px;
        }
        .edit-mode-notes {
          margin: 20px 0;
          background: #fff3e0;
          border-left: 4px solid #ffb74d;
        }
        .edit-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-cancel, .btn-save {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }
        .btn-save {
          background: #4caf50;
          color: white;
        }
        .btn-save:hover {
          background: #45a049;
        }

        /* Card Actions */
        .card-actions {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          background: #f9f9f9;
          border-top: 1px solid #eee;
        }
        .btn-edit, .btn-delete {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
          transition: all 0.3s;
        }
        .btn-edit {
          background: #1e88e5;
          color: white;
        }
        .btn-edit:hover {
          background: #1565c0;
        }
        .btn-delete {
          background: #f44336;
          color: white;
        }
        .btn-delete:hover {
          background: #da190b;
        }

        @media (max-width: 768px) {
          .header-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-section h1 {
            width: 100%;
          }

          .history-table {
            font-size: 0.85rem;
          }

          .history-table th,
          .history-table td {
            padding: 8px 12px;
          }

          .card-actions {
            flex-direction: column;
          }

          .btn-edit, .btn-delete {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function getCheckItemName(id: number): string {
  const items: Record<number, string> = {
    1: "Hook Lift",
    2: "Sling / Wire Rope",
    3: "Holder Plate / Cantolan Hook",
    4: "Roda Penggerak naik turun",
    5: "Limit Switch",
  };
  return items[id] || `Item ${id}`;
}