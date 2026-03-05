// app/status-ga/fire-alarm/riwayat/[zona]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ==========================================
// 📦 INTERFACES
// ==========================================
export interface FireAlarmItem {
  id?: number; // ID database (opsional)
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
  // Helper fields untuk edit mode
  _action?: 'create' | 'update' | 'delete';
  originalNo?: number;
}

export interface FireAlarmRecord {
  id: string;
  date: string;
  zona: string;
  checker: string;
  checkerNik?: string;
  submittedAt: string;
  items: FireAlarmItem[];
}

interface EditFormData {
  recordId: string;
  date: string;
  zona: string;
  checker: string;
  checkerNik?: string;
  items: FireAlarmItem[];
  replaceItems?: boolean;
}

// ==========================================
// 📄 MAIN COMPONENT
// ==========================================
export default function RiwayatFireAlarm({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { zona } = use(params);
  
  // State Data & Loading
  const [records, setRecords] = useState<FireAlarmRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FireAlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  
  // State UI
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  
  // State Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'items'>('header');
  const [newItemNo, setNewItemNo] = useState(1);

  // ==========================================
  // 🔐 AUTH & INIT
  // ==========================================
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // ==========================================
  // 🔥 DATA LOADING
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('zona', zona);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      if (filterLocation) queryParams.append('lokasi', filterLocation);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/api/fire-alarm/history?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.data || []);
          setFilteredRecords(data.data || []);
        } else {
          alert('Gagal memuat riwayat: ' + data.message);
        }
      } else {
        alert('Gagal mengambil data dari server');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Gagal memuat riwayat: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zona) {
      loadData();
    }
  }, [zona, filterDateFrom, filterDateTo, filterLocation]);

  // ==========================================
  // 🔧 HELPER FUNCTIONS
  // ==========================================
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const generateNextNo = (items: FireAlarmItem[]) => {
    const maxNo = Math.max(0, ...items.map(i => i.no || 0));
    return maxNo + 1;
  };

  const locations = Array.from(
    new Set(
      records
        .flatMap((r) => r.items || [])
        .map((i) => i.lokasi)
        .filter(Boolean)
    )
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) {
      const imageUrl = src.startsWith('data:') ? src : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${src}`;
      setPreviewImage(imageUrl);
    }
  };

  const closeImagePreview = () => setPreviewImage(null);

  // ==========================================
  // 🗑️ DELETE HANDLER
  // ==========================================
  const handleDelete = async (recordId: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const response = await fetch(`/api/fire-alarm/delete?id=${recordId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadData();
        alert('Data berhasil dihapus!');
      } else {
        const error = await response.json();
        alert('Gagal menghapus data: ' + error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  // ==========================================
  // ✏️ EDIT LOGIC
  // ==========================================
  const openEditModal = async (record: FireAlarmRecord) => {
    try {
      // Coba fetch data fresh dari API
      const response = await fetch(`/api/fire-alarm/history?zona=${zona}&record_id=${record.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.[0]) {
          const freshRecord = data.data[0];
          setEditData({
            recordId: freshRecord.id,
            date: formatDateForInput(freshRecord.date),
            zona: freshRecord.zona,
            checker: freshRecord.checker,
            checkerNik: freshRecord.checkerNik || '',
            items: (freshRecord.items || []).map((item: FireAlarmItem) => ({
              ...item,
              _action: 'update'
            })),
            replaceItems: true
          });
          setIsEditMode(true);
          setActiveTab('header');
          setNewItemNo(generateNextNo(freshRecord.items) + 1);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching record for edit:', error);
    }
    
    // Fallback: gunakan data dari list jika API detail gagal
    setEditData({
      recordId: record.id,
      date: formatDateForInput(record.date),
      zona: record.zona || zona,
      checker: record.checker,
      checkerNik: record.checkerNik || '',
      items: record.items.map((item) => ({ ...item, _action: 'update' })),
      replaceItems: true
    });
    setIsEditMode(true);
    setActiveTab('header');
    setNewItemNo(generateNextNo(record.items) + 1);
  };

  const closeEditModal = () => {
    setIsEditMode(false);
    setEditData(null);
    setNewItemNo(1);
  };

  const handleHeaderChange = (field: keyof EditFormData, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleItemChange = (index: number, field: keyof FireAlarmItem, value: string) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value,
      _action: updatedItems[index]._action === 'create' ? 'create' : 'update'
    };
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleAddItem = () => {
    if (!editData) return;
    const itemToAdd: FireAlarmItem = {
      no: newItemNo,
      zona: editData.zona,
      lokasi: `Lokasi Baru ${newItemNo}`,
      alarmBell: 'OK',
      indicatorLamp: 'OK',
      manualCallPoint: 'OK',
      idZona: `ID-${newItemNo}`,
      kebersihan: 'OK',
      kondisiNok: '',
      tindakanPerbaikan: '',
      pic: editData.checker,
      foto: null,
      _action: 'create'
    };
    setEditData(prev => prev ? { ...prev, items: [...prev.items, itemToAdd] } : null);
    setNewItemNo(prev => prev + 1);
  };

  const handleRemoveItem = (index: number) => {
    if (!editData) return;
    const updatedItems = [...editData.items];
    const item = updatedItems[index];
    if (item.id) {
      updatedItems[index] = { ...item, _action: 'delete' };
    } else {
      updatedItems.splice(index, 1);
    }
    setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const handleFotoUpload = (index: number, file: File) => {
    if (!editData) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedItems = [...editData.items];
      updatedItems[index] = { 
        ...updatedItems[index], 
        foto: reader.result as string,
        _action: updatedItems[index]._action === 'create' ? 'create' : 'update'
      };
      setEditData(prev => prev ? { ...prev, items: updatedItems } : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEdit = async () => {
    if (!editData) return;
    if (!editData.date || !editData.zona || !editData.checker) {
      alert('Harap lengkapi field Header: Tanggal, Zona, dan Checker');
      setActiveTab('header');
      return;
    }
    
    const itemsToSubmit = editData.items
      .filter(item => item._action !== 'delete')
      .map(({ _action, originalNo, id, ...item }) => item);
    
    if (itemsToSubmit.length === 0 && !confirm('Tidak ada item yang akan disimpan. Lanjutkan hanya update header?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/fire-alarm/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: editData.recordId,
          date: editData.date,
          zona: editData.zona,
          checker: editData.checker,
          checkerNik: editData.checkerNik,
          items: itemsToSubmit,
          replaceItems: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Data berhasil diupdate!');
        closeEditModal();
        await loadData();
      } else {
        alert('❌ Gagal update: ' + result.message);
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  // ==========================================
  // 🎨 RENDER UI
  // ==========================================
  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button onClick={() => router.push("/status-ga/fire-alarm")} className="btn-back" aria-label="Kembali">
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">📍 Riwayat Inspeksi Fire Alarm - {zona?.toUpperCase()}</h1>
        </div>

        {/* Filter Controls */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Dari Tanggal:</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="date-input" />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="date-input" />
          </div>
          <div className="filter-group">
            <label>Lokasi:</label>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="location-select">
              <option value="">Semua Lokasi</option>
              {locations.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
            </select>
          </div>
          <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterLocation(""); }} className="clear-filter">Reset Filter</button>
          <Link href={`/status-ga/fire-alarm/${zona}`} className="btn-add">➕ Tambah Data</Link>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="riwayat-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">Belum ada data Inspeksi Fire Alarm.</div>
            ) : (
              <div className="data-tables">
                {/* ✅ DESKTOP: Table View */}
                <div className="desktop-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="data-section">
                      <div className="section-header">
                        <span>📅 {formatDateDisplay(record.date)}</span>
                        <span>👤 {record.checker}</span>
                        <div className="section-actions">
                          <button onClick={() => openEditModal(record)} className="edit-btn" title="Edit data">✏️</button>
                          <button onClick={() => handleDelete(record.id)} className="delete-btn" title="Hapus data">🗑️</button>
                        </div>
                      </div>
                      <div className="table-wrapper">
                        <table className="apd-table">
                          <thead>
                            <tr>
                              <th>No</th><th>Zona</th><th>Lokasi</th><th>Alarm Bell</th><th>Indicator Lamp</th>
                              <th>Manual Call Point</th><th>ID Zona</th><th>Kebersihan</th><th>Kondisi N-OK</th>
                              <th>Tindakan Perbaikan</th><th>PIC</th><th>Foto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item) => (
                              <tr key={`${record.id}-${item.no}`}>
                                <td>{item.no}</td><td>{item.zona}</td><td>{item.lokasi}</td>
                                <td className={item.alarmBell === "NG" ? "status-ng" : ""}>{item.alarmBell || "-"}</td>
                                <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>{item.indicatorLamp || "-"}</td>
                                <td className={item.manualCallPoint === "NG" ? "status-ng" : ""}>{item.manualCallPoint || "-"}</td>
                                <td className={item.idZona === "NG" ? "status-ng" : ""}>{item.idZona || "-"}</td>
                                <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan || "-"}</td>
                                <td>{item.kondisiNok || "-"}</td><td>{item.tindakanPerbaikan || "-"}</td><td>{item.pic || "-"}</td>
                                <td>
                                  {item.foto ? (
                                    <img src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} alt="Foto" className="history-image clickable" onClick={() => openImagePreview(item.foto!)} />
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ MOBILE: Card View */}
                <div className="mobile-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="record-card">
                      <div className="card-header" onClick={() => toggleExpandRecord(record.id)}>
                        <div className="card-date"><span className="calendar-icon">📅</span><span>{formatDateDisplay(record.date)}</span></div>
                        <div className="card-checker"><span className="user-icon">👤</span><span>{record.checker}</span></div>
                        <div className={`expand-icon ${expandedRecord === record.id ? 'expanded' : ''}`}>▼</div>
                      </div>
                      
                      {expandedRecord === record.id && (
                        <div className="card-body">
                          <div className="card-actions">
                            <button onClick={() => openEditModal(record)} className="edit-btn-mobile">✏️ Edit Data</button>
                            <button onClick={() => handleDelete(record.id)} className="delete-btn-mobile">🗑️ Hapus Data</button>
                          </div>
                          <div className="items-list">
                            {record.items.map((item) => (
                              <div key={`${record.id}-${item.no}`} className="item-card">
                                <div className="item-header"><span className="item-no">#{item.no}</span><span className="item-zona">{item.zona}</span></div>
                                <div className="item-lokasi">{item.lokasi}</div>
                                <div className="item-details">
                                  <div className="detail-row"><span className="detail-label">Alarm Bell:</span><span className={`detail-value ${item.alarmBell === "NG" ? "ng" : "ok"}`}>{item.alarmBell || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Indicator Lamp:</span><span className={`detail-value ${item.indicatorLamp === "NG" ? "ng" : "ok"}`}>{item.indicatorLamp || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Manual Call Point:</span><span className={`detail-value ${item.manualCallPoint === "NG" ? "ng" : "ok"}`}>{item.manualCallPoint || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">ID Zona:</span><span className={`detail-value ${item.idZona === "NG" ? "ng" : "ok"}`}>{item.idZona || "-"}</span></div>
                                  <div className="detail-row"><span className="detail-label">Kebersihan:</span><span className={`detail-value ${item.kebersihan === "NG" ? "ng" : "ok"}`}>{item.kebersihan || "-"}</span></div>
                                  {item.kondisiNok && <div className="detail-row full"><span className="detail-label">Kondisi N-OK:</span><span className="detail-value">{item.kondisiNok}</span></div>}
                                  {item.tindakanPerbaikan && <div className="detail-row full"><span className="detail-label">Tindakan:</span><span className="detail-value">{item.tindakanPerbaikan}</span></div>}
                                  <div className="detail-row"><span className="detail-label">PIC:</span><span className="detail-value">{item.pic || "-"}</span></div>
                                  {item.foto && (
                                    <div className="detail-row full">
                                      <span className="detail-label">Foto:</span>
                                      <img src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} alt="Foto" className="item-photo" onClick={() => openImagePreview(item.foto!)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={closeImagePreview}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeImagePreview}>✕</button>
              <img src={previewImage} alt="Zoom" className="modal-image" />
            </div>
          </div>
        )}

        {/* ✅ EDIT MODAL */}
        {isEditMode && editData && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Edit Inspeksi Fire Alarm</h3>
                <button className="modal-close" onClick={closeEditModal}>✕</button>
              </div>
              <div className="modal-tabs">
                <button className={`tab-btn ${activeTab === 'header' ? 'active' : ''}`} onClick={() => setActiveTab('header')}>📋 Header</button>
                <button className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>📦 Items ({editData.items.filter(i => i._action !== 'delete').length})</button>
              </div>
              <div className="modal-body">
                {activeTab === 'header' ? (
                  <div className="form-section">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tanggal Inspeksi *</label>
                        <input type="date" value={editData.date} onChange={(e) => handleHeaderChange('date', e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label>Zona *</label>
                        <input type="text" value={editData.zona} onChange={(e) => handleHeaderChange('zona', e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label>Checker *</label>
                        <input type="text" value={editData.checker} onChange={(e) => handleHeaderChange('checker', e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group">
                        <label>NIK Checker</label>
                        <input type="text" value={editData.checkerNik || ''} onChange={(e) => handleHeaderChange('checkerNik', e.target.value)} className="form-input" placeholder="Opsional" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-section">
                    <div className="items-edit-list">
                      {editData.items.filter(i => i._action !== 'delete').map((item, index) => {
                        // Find actual index in original array
                        const originalIndex = editData.items.findIndex(i => i.no === item.no && i.lokasi === item.lokasi);
                        const realIndex = originalIndex >= 0 ? originalIndex : index;
                        
                        return (
                          <div key={`${item.no}-${item.lokasi}-${index}`} className="edit-item-card">
                            <div className="edit-item-header">
                              <span className="item-badge">#{item.no}</span>
                              <span className="item-lokasi-edit">{item.lokasi}</span>
                              <button className="remove-item-btn" onClick={() => handleRemoveItem(realIndex)} title="Hapus item">🗑️</button>
                            </div>
                            <div className="edit-item-fields">
                              <div className="form-row">
                                <div className="form-group-small"><label>Lokasi</label><input type="text" value={item.lokasi} onChange={(e) => handleItemChange(realIndex, 'lokasi', e.target.value)} className="form-input-small" /></div>
                                <div className="form-group-small"><label>ID Zona</label><input type="text" value={item.idZona} onChange={(e) => handleItemChange(realIndex, 'idZona', e.target.value)} className="form-input-small" /></div>
                              </div>
                              <div className="status-grid">
                                {['alarmBell', 'indicatorLamp', 'manualCallPoint', 'kebersihan'].map((field) => (
                                  <div key={field} className="status-select-group">
                                    <label className="status-label">{field === 'alarmBell' ? 'Alarm Bell' : field === 'indicatorLamp' ? 'Indicator Lamp' : field === 'manualCallPoint' ? 'Manual Call Point' : 'Kebersihan'}</label>
                                    <select value={item[field as keyof FireAlarmItem] || 'OK'} onChange={(e) => handleItemChange(realIndex, field as keyof FireAlarmItem, e.target.value)} className={`status-select ${item[field as keyof FireAlarmItem] === 'NG' ? 'ng' : 'ok'}`}>
                                      <option value="OK">✅ OK</option><option value="NG">❌ NG</option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                              <div className="form-row">
                                <div className="form-group-small full"><label>Kondisi N-OK</label><textarea value={item.kondisiNok || ''} onChange={(e) => handleItemChange(realIndex, 'kondisiNok', e.target.value)} className="form-textarea-small" rows={2} placeholder="Jelaskan jika ada kondisi NG..." /></div>
                              </div>
                              <div className="form-row">
                                <div className="form-group-small full"><label>Tindakan Perbaikan</label><textarea value={item.tindakanPerbaikan || ''} onChange={(e) => handleItemChange(realIndex, 'tindakanPerbaikan', e.target.value)} className="form-textarea-small" rows={2} placeholder="Tindakan yang dilakukan..." /></div>
                              </div>
                              <div className="form-row">
                                <div className="form-group-small"><label>PIC</label><input type="text" value={item.pic || ''} onChange={(e) => handleItemChange(realIndex, 'pic', e.target.value)} className="form-input-small" /></div>
                                <div className="form-group-small">
                                  <label>Foto</label>
                                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFotoUpload(realIndex, e.target.files[0])} className="form-file-small" />
                                  {item.foto && <img src={item.foto} alt="Preview" className="item-foto-preview" onClick={() => openImagePreview(item.foto!)} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="add-item-section">
                      <button type="button" onClick={handleAddItem} className="btn-add-item">➕ Tambah Item Baru</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal} className="btn-modal-cancel" disabled={isSubmitting}>Batal</button>
                <button type="button" onClick={handleSubmitEdit} className="btn-modal-save" disabled={isSubmitting}>{isSubmitting ? '💾 Menyimpan...' : '💾 Simpan Perubahan'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          🎨 STYLES (CSS-in-JS)
          ========================================== */}
      <style jsx>{`
        .app-page { display: flex; min-height: 100vh; background-color: #f7f9fc; }
        .page-content { flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; color: #1e293b; }
        .header-banner { background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); color: white; padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .btn-back { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(255, 255, 255, 0.2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; min-height: 44px; }
        .btn-back:hover { background: rgba(255, 255, 255, 0.3); }
        .btn-back-text { display: inline; }
        .page-title { margin: 0; font-size: 1.4rem; font-weight: 700; flex: 1; word-break: break-word; }
        .date-filter { display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: white; border-radius: 12px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); flex-wrap: wrap; align-items: center; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-group label { font-weight: 600; font-size: 0.9rem; color: #333; }
        .date-input, .location-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; min-width: 160px; min-height: 44px; }
        .clear-filter { padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; min-height: 44px; }
        .clear-filter:hover { background: #b91c1c; }
        .btn-add { padding: 8px 16px; background: #1e88e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-left: auto; white-space: nowrap; min-height: 44px; display: flex; align-items: center; }
        .btn-add:hover { background: #1565c0; }
        .riwayat-container { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); padding: 24px; }
        .empty-state { text-align: center; padding: 40px 20px; color: #64748b; font-size: 1.1rem; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
        .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #1976d2; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .data-tables { display: flex; flex-direction: column; gap: 24px; }
        .desktop-view { display: block; }
        .mobile-view { display: none; }
        .data-section { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
        .section-header { background: #f1f5f9; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #475569; font-weight: 600; flex-wrap: wrap; gap: 8px; }
        .section-actions { display: flex; gap: 8px; }
        .edit-btn, .delete-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }
        .edit-btn { color: #1976d2; }
        .delete-btn { color: #f44336; }
        .edit-btn:hover, .delete-btn:hover { transform: scale(1.1); }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .apd-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 1000px; }
        .apd-table th, .apd-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; color: #334155; }
        .apd-table th { background: #f8fafc; font-weight: 700; color: #1e293b; position: sticky; top: 0; z-index: 10; }
        .status-ng { background: #fee2e2; color: #dc2626; font-weight: 600; border-radius: 4px; padding: 2px 6px; }
        .history-image { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; transition: transform 0.2s; }
        .history-image:hover { transform: scale(1.1); }
        
        /* Mobile Card Styles */
        .record-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
        .card-header { display: flex; align-items: center; gap: 12px; padding: 16px; cursor: pointer; background: #f8fafc; transition: background 0.2s; min-height: 44px; }
        .card-header:hover { background: #f1f5f9; }
        .card-date { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #1e88e5; font-weight: 600; }
        .card-checker { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #64748b; flex: 1; }
        .expand-icon { font-size: 1.2rem; color: #94a3b8; transition: transform 0.3s ease; }
        .expand-icon.expanded { transform: rotate(180deg); }
        .card-body { padding: 16px; background: #fafbfc; }
        .card-actions { margin-bottom: 16px; }
        .edit-btn-mobile, .delete-btn-mobile { width: 100%; padding: 12px 16px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
        .edit-btn-mobile { background: #dbeafe; color: #1976d2; }
        .edit-btn-mobile:hover { background: #bfdbfe; }
        .delete-btn-mobile { background: #fee2e2; color: #dc2626; }
        .delete-btn-mobile:hover { background: #fecaca; }
        .items-list { display: flex; flex-direction: column; gap: 16px; }
        .item-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .item-no { background: #1976d2; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }
        .item-zona { color: #64748b; font-size: 0.85rem; font-weight: 500; }
        .item-lokasi { font-size: 1rem; font-weight: 600; color: #1e293b; margin-bottom: 12px; word-break: break-word; }
        .item-details { display: flex; flex-direction: column; gap: 8px; }
        .detail-row { display: flex; align-items: flex-start; gap: 8px; font-size: 0.9rem; }
        .detail-row.full { flex-direction: column; gap: 4px; }
        .detail-label { color: #64748b; font-weight: 500; min-width: 140px; flex-shrink: 0; }
        .detail-value { color: #1e293b; font-weight: 400; word-break: break-word; }
        .detail-value.ok { color: #059669; font-weight: 600; }
        .detail-value.ng { color: #dc2626; font-weight: 600; }
        .item-photo { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #e2e8f0; cursor: pointer; transition: transform 0.2s; }
        .item-photo:hover { transform: scale(1.05); }
        
        /* Zoom Image Modal */
        .image-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; cursor: pointer; }
        .modal-content { position: relative; max-width: 90vw; max-height: 90vh; cursor: default; }
        .close-btn { position: absolute; top: -40px; right: 0; background: #fff; color: #000; border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }
        .close-btn:hover { background: #e0e0e0; transform: scale(1.1); }
        .modal-image { max-width: 100%; max-height: 80vh; object-fit: contain; border: 2px solid white; border-radius: 8px; }

        /* ✅ EDIT MODAL STYLES */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 16px; overflow-y: auto; }
        .modal-container { background: white; border-radius: 16px; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalSlideIn 0.3s ease; }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { padding: 16px 20px; background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); color: white; display: flex; justify-content: space-between; align-items: center; border-radius: 16px 16px 0 0; }
        .modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; }
        .modal-close { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .modal-close:hover { background: rgba(255,255,255,0.3); }
        .modal-tabs { display: flex; padding: 8px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; gap: 4px; }
        .tab-btn { padding: 10px 20px; border: none; background: transparent; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
        .tab-btn.active { background: #1976d2; color: white; }
        .tab-btn:hover:not(.active) { background: #e2e8f0; }
        .modal-body { flex: 1; overflow-y: auto; padding: 20px; }
        .form-section { display: flex; flex-direction: column; gap: 20px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-weight: 600; font-size: 0.9rem; color: #334155; }
        .form-input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; min-height: 44px; transition: border-color 0.2s; }
        .form-input:focus { outline: none; border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1); }
        
        .items-edit-list { display: flex; flex-direction: column; gap: 12px; }
        .edit-item-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #fafbfc; }
        .edit-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
        .item-badge { background: #1976d2; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
        .item-lokasi-edit { font-weight: 600; color: #1e293b; flex: 1; }
        .remove-item-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #f44336; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
        .remove-item-btn:hover { background: #fee2e2; }
        .edit-item-fields { display: flex; flex-direction: column; gap: 12px; }
        .form-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .form-group-small { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 150px; }
        .form-group-small.full { flex: 1 1 100%; }
        .form-group-small label { font-size: 0.8rem; font-weight: 500; color: #64748b; }
        .form-input-small { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; min-height: 38px; }
        .form-textarea-small { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; resize: vertical; font-family: inherit; }
        .form-input-small:focus, .form-textarea-small:focus { outline: none; border-color: #1976d2; }
        .form-file-small { font-size: 0.85rem; }
        .item-foto-preview { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; margin-top: 4px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
        .status-select-group { display: flex; flex-direction: column; gap: 4px; }
        .status-label { font-size: 0.75rem; font-weight: 500; color: #64748b; }
        .status-select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; background: white; }
        .status-select.ok { color: #059669; border-color: #059669; }
        .status-select.ng { color: #dc2626; border-color: #dc2626; }
        .add-item-section { padding-top: 12px; border-top: 1px dashed #cbd5e1; }
        .btn-add-item { width: 100%; padding: 12px; background: #f1f5f9; color: #1976d2; border: 2px dashed #94a3b8; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.95rem; }
        .btn-add-item:hover { background: #e2e8f0; border-color: #1976d2; }
        
        .modal-footer { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; border-radius: 0 0 16px 16px; }
        .btn-modal-cancel, .btn-modal-save { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; min-height: 44px; min-width: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-modal-cancel { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
        .btn-modal-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .btn-modal-save { background: #1976d2; color: white; border: none; }
        .btn-modal-save:hover:not(:disabled) { background: #1565c0; }
        .btn-modal-cancel:disabled, .btn-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Responsive */
        @media (max-width: 1024px) { .page-content { padding: 20px 16px; } .page-title { font-size: 1.2rem; } .apd-table { min-width: 900px; font-size: 0.8rem; } .apd-table th, .apd-table td { padding: 8px 6px; } }
        @media (max-width: 768px) {
          .page-content { padding: 16px 12px; margin-left: 0; }
          .header-banner { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 12px; }
          .btn-back { width: 100%; justify-content: center; }
          .page-title { font-size: 1.1rem; width: 100%; text-align: center; }
          .date-filter { flex-direction: column; align-items: stretch; gap: 12px; padding: 12px; }
          .filter-group { width: 100%; }
          .date-input, .location-select { width: 100%; min-width: 100%; font-size: 0.9rem; }
          .clear-filter, .btn-add { width: 100%; justify-content: center; }
          .btn-add { margin-left: 0; }
          .riwayat-container { padding: 16px 12px; }
          .desktop-view { display: none; }
          .mobile-view { display: block; }
          .apd-table { min-width: 700px; font-size: 0.75rem; }
          .apd-table th, .apd-table td { padding: 6px 4px; }
          .history-image { width: 45px; height: 45px; }
          .item-photo { width: 70px; height: 70px; }
          .detail-label { min-width: 120px; font-size: 0.85rem; }
          .detail-value { font-size: 0.9rem; }
          
          /* Modal Mobile */
          .modal-container { max-height: 95vh; border-radius: 12px; }
          .modal-header { padding: 12px 16px; }
          .modal-header h3 { font-size: 1.1rem; }
          .modal-body { padding: 16px; }
          .form-grid { grid-template-columns: 1fr; }
          .status-grid { grid-template-columns: repeat(2, 1fr); }
          .modal-footer { flex-direction: column-reverse; padding: 12px 16px; }
          .btn-modal-cancel, .btn-modal-save { width: 100%; }
        }
        @media (max-width: 480px) {
          .page-content { padding: 12px 8px; }
          .header-banner { padding: 10px 12px; }
          .page-title { font-size: 1rem; }
          .date-filter { padding: 10px; gap: 10px; }
          .filter-group label { font-size: 0.85rem; }
          .date-input, .location-select { font-size: 0.85rem; padding: 8px 10px; }
          .clear-filter, .btn-add { font-size: 0.85rem; padding: 10px 14px; }
          .riwayat-container { padding: 12px 8px; }
          .card-header { padding: 12px; }
          .card-date, .card-checker { font-size: 0.85rem; }
          .card-body { padding: 12px; }
          .item-card { padding: 12px; }
          .item-lokasi { font-size: 0.9rem; }
          .detail-row { font-size: 0.85rem; }
          .detail-label { min-width: 100px; font-size: 0.8rem; }
          .detail-value { font-size: 0.85rem; }
          .item-photo { width: 60px; height: 60px; }
          .apd-table { min-width: 600px; font-size: 0.7rem; }
          .apd-table th, .apd-table td { padding: 4px 3px; }
          .status-grid { grid-template-columns: 1fr; }
          .form-row { flex-direction: column; gap: 8px; }
          .form-group-small { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}