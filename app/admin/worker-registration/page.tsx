// app/admin/worker-registration/page.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

// ──────────────────────────────────────────────────────────────────────────────
// AUTH FETCH HELPER
// ──────────────────────────────────────────────────────────────────────────────
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === "undefined") return fetch(url, options);
  try {
    const userStr = localStorage.getItem("auth_current_user_v2");
    if (userStr) {
      const u = JSON.parse(userStr);
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
        "x-user-id": String(u.id || ""),
        "x-user-role": String(u.role || ""),
        "x-username": String(u.username || ""),
      };
    }
  } catch {}
  return fetch(url, options);
}

// ──────────────────────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// ──────────────────────────────────────────────────────────────────────────────
function useSidebarWidth() {
  const COLLAPSED_W = 70;
  const EXPANDED_W = 240;
  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener("sidebarToggle", onToggle);
    return () => window.removeEventListener("sidebarToggle", onToggle);
  }, []);

  return sidebarW;
}

// ──────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS - 5 ROLE BARU UNTUK INSPECTOR GA
// ──────────────────────────────────────────────────────────────────────────────
type GARole = 
  | "inspector-ga-fire"        // Kategori 1: Proteksi Kebakaran & Evakuasi
  | "inspector-ga-equipment"   // Kategori 2: Pemeliharaan Peralatan
  | "inspector-ga-electrical"  // Kategori 3: Instalasi Listrik
  | "inspector-ga-personal"    // Kategori 4: Keselamatan Personal & Prasarana
  | "inspector-ga-facility";   // Kategori 5: Kebersihan Fasilitas

interface WorkerFormData {
  username: string;
  fullName: string;
  nik: string;
  password: string;
  confirmPassword: string;
  department: "general-affairs" | "ga";
  role: GARole | "";
}

interface FormErrors {
  username?: string;
  fullName?: string;
  nik?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  role?: string;
  general?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ROLE CONFIGURATION - 5 KATEGORI CHECKSHEET
// ──────────────────────────────────────────────────────────────────────────────
const GA_ROLES: { value: GARole; label: string; category: string; icon: string; desc: string }[] = [
  {
    value: "inspector-ga-fire",
    label: "🔥 Inspector GA - Proteksi Kebakaran",
    category: "1. Sistem Proteksi Kebakaran & Evakuasi",
    icon: "🔥",
    desc: "Hydrant, Fire Alarm, APAR, Smoke Detector, Emergency Lamp, Jalur Evakuasi"
  },
  {
    value: "inspector-ga-equipment",
    label: "⚙️ Inspector GA - Peralatan",
    category: "2. Keselamatan dan Pemeliharaan Peralatan",
    icon: "⚙️",
    desc: "Lift Barang Daily, Preventif Lift, Tangga Listrik (AWP)"
  },
  {
    value: "inspector-ga-electrical",
    label: "⚡ Inspector GA - Listrik",
    category: "3. Keselamatan dan Instalasi Listrik",
    icon: "⚡",
    desc: "Panel Listrik, Stop Kontak, Instalasi Listrik Area Kerja"
  },
  {
    value: "inspector-ga-personal",
    label: "🦺 Inspector GA - Personal & Prasarana",
    category: "4. Keselamatan Personal dan Prasarana Umum",
    icon: "🦺",
    desc: "Form APD, Inspeksi APD, Infrastruktur Jalan"
  },
  {
    value: "inspector-ga-facility",
    label: "🧹 Inspector GA - Fasilitas",
    category: "5. Kebersihan dan Kenyamanan Fasilitas",
    icon: "🧹",
    desc: "Checksheet Toilet, Patroli Kebersihan 5S"
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const validateForm = (data: WorkerFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.username.trim()) errors.username = "Username wajib diisi";
  else if (data.username.length < 4) errors.username = "Username minimal 4 karakter";

  if (!data.fullName.trim()) errors.fullName = "Nama lengkap wajib diisi";

  if (!data.nik.trim()) errors.nik = "NIK wajib diisi";
  else if (!/^\d{6,}$/.test(data.nik)) errors.nik = "NIK minimal 6 digit angka";

  if (!data.password) errors.password = "Password wajib diisi";
  else if (data.password.length < 6) errors.password = "Password minimal 6 karakter";

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok";
  }

  if (!data.role) errors.role = "Pilih role/kategori checksheet terlebih dahulu";

  if (!data.department) errors.department = "Pilih departemen terlebih dahulu";

  // Validasi department hanya GA
  if (data.department && !["general-affairs", "ga"].includes(data.department)) {
    errors.department = "Departemen harus General Affairs (GA)";
  }

  return errors;
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function WorkerRegistrationPage() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized, signup } = useAuth();
  const sidebarW = useSidebarWidth();

  const [formData, setFormData] = useState<WorkerFormData>({
    username: "",
    fullName: "",
    nik: "",
    password: "",
    confirmPassword: "",
    department: "general-affairs", // Default GA
    role: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // 🔹 Redirect jika tidak authorized
  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      router.push("/login-page");
      return;
    }
    if (!["admin", "superadmin"].includes(user.role)) {
      router.push("/home");
    }
  }, [user, authLoading, isInitialized, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error saat user mulai mengetik
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    
    // Validasi form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signup({
        username: formData.username,
        fullName: formData.fullName,
        nik: formData.nik,
        department: formData.department,
        role: formData.role as GARole,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        setSuccessMessage(`✅ "${formData.fullName}" berhasil didaftarkan sebagai ${GA_ROLES.find(r => r.value === formData.role)?.label}!`);
        // Reset form setelah sukses
        setFormData({
          username: "",
          fullName: "",
          nik: "",
          password: "",
          confirmPassword: "",
          department: "general-affairs",
          role: "",
        });
      } else {
        setErrors({ general: result.error || "Pendaftaran gagal!" });
      }
    } catch (err) {
      setErrors({ general: "Terjadi kesalahan sistem. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isInitialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4f8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "#1e88e5", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Memuat...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return null;

  // ✅ Inline style yang reaktif terhadap sidebarW
  const mainStyle: React.CSSProperties = {
    marginLeft: sidebarW,
    padding: 24,
    minHeight: "100vh",
    background: "#f0f4f8",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const selectedRole = GA_ROLES.find(r => r.value === formData.role);

  return (
    <>
      <Sidebar userName={user.fullName || user.username} />
      <main className="wr-main" style={mainStyle}>
        {/* Header */}
        <div className="wr-header">
          <div>
            <h1 className="wr-title">👥 Registrasi Inspector GA</h1>
            <p className="wr-subtitle">Daftarkan pekerja dengan pembagian 5 kategori checksheet</p>
          </div>
          <button 
            className="wr-back-btn"
            onClick={() => router.back()}
            title="Kembali"
          >
            ← Kembali
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="wr-success">
            <span>✨</span>
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage("")}>✕</button>
          </div>
        )}

        {/* Form Card */}
        <div className="wr-card">
          <div className="wr-card-header">
            <h2>📝 Form Pendaftaran Inspector GA</h2>
            <p className="wr-card-desc">Pilih kategori checksheet yang akan menjadi tanggung jawab pekerja</p>
          </div>

          <form className="wr-form" onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && (
              <div className="wr-error-global">
                ⚠️ {errors.general}
              </div>
            )}

            <div className="wr-form-grid">
              {/* Username */}
              <div className="wr-form-group">
                <label htmlFor="username">Username <span className="required">*</span></label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="contoh: ga_fire01"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.username ? "error" : ""}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              {/* Full Name */}
              <div className="wr-form-group">
                <label htmlFor="fullName">Nama Lengkap <span className="required">*</span></label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Nama lengkap pekerja"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.fullName ? "error" : ""}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              {/* NIK */}
              <div className="wr-form-group">
                <label htmlFor="nik">NIK <span className="required">*</span></label>
                <input
                  id="nik"
                  type="text"
                  name="nik"
                  placeholder="Nomor Induk Karyawan"
                  value={formData.nik}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.nik ? "error" : ""}
                />
                {errors.nik && <span className="error-text">{errors.nik}</span>}
              </div>

              {/* Department - Fixed to GA */}
              <div className="wr-form-group">
                <label>Departemen <span className="required">*</span></label>
                <div className="fixed-field">
                  <span className="fixed-value">🏢 General Affairs (GA)</span>
                  <input type="hidden" name="department" value={formData.department} />
                </div>
                <p className="hint-text">Semua Inspector GA berada di departemen General Affairs</p>
              </div>

              {/* Role - 5 Categories */}
              <div className="wr-form-group full-width">
                <label htmlFor="role">Kategori Checksheet <span className="required">*</span></label>
                <div className="role-grid">
                  {GA_ROLES.map(role => (
                    <label 
                      key={role.value} 
                      className={`role-card ${formData.role === role.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        disabled={loading}
                        className="role-radio"
                      />
                      <div className="role-card-content">
                        <span className="role-icon">{role.icon}</span>
                        <span className="role-name">{role.label.split(' - ')[1]}</span>
                        <span className="role-category">{role.category}</span>
                        <span className="role-desc">{role.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && <span className="error-text">{errors.role}</span>}
              </div>

              {/* Password */}
              <div className="wr-form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.password ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="wr-form-group">
                <label htmlFor="confirmPassword">Konfirmasi Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.confirmPassword ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Selected Role Preview */}
            {selectedRole && (
              <div className="role-preview">
                <h4>✅ Kategori Terpilih:</h4>
                <div className="preview-card">
                  <span className="preview-icon">{selectedRole.icon}</span>
                  <div>
                    <strong>{selectedRole.label}</strong>
                    <p>{selectedRole.desc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="wr-form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  if (confirm("Reset semua field?")) {
                    setFormData({
                      username: "",
                      fullName: "",
                      nik: "",
                      password: "",
                      confirmPassword: "",
                      department: "general-affairs",
                      role: "",
                    });
                    setErrors({});
                  }
                }}
                disabled={loading}
              >
                🔄 Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Memproses...
                  </>
                ) : (
                  "✅ Daftarkan Inspector GA"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="wr-info-panel">
          <h3>📋 Panduan Pembagian Role Inspector GA</h3>
          <div className="info-grid">
            {GA_ROLES.map((role, idx) => (
              <div key={role.value} className="info-item">
                <strong>{role.icon} {idx + 1}. {role.label.split(' - ')[1]}</strong>
                <p>{role.desc}</p>
                <small>Role: <code>{role.value}</code></small>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        /* ── Main Layout ── */
        .wr-main {
          padding: 24px;
          min-height: 100vh;
          background: #f0f4f8;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Header ── */
        .wr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .wr-title {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }
        .wr-subtitle {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }
        .wr-back-btn {
          padding: 10px 18px;
          background: #f1f5f9;
          color: #475569;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wr-back-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        /* ── Success Message ── */
        .wr-success {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border-left: 4px solid #22c55e;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 20px;
          animation: slideIn 0.3s ease;
        }
        .wr-success p {
          margin: 0;
          font-size: 14px;
          color: #166534;
          font-weight: 500;
          flex: 1;
        }
        .wr-success button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #166534;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .wr-success button:hover { opacity: 1; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Form Card ── */
        .wr-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          margin-bottom: 24px;
          border: 2px solid #f1f5f9;
        }
        .wr-card-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .wr-card-header h2 {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        .wr-card-desc {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        /* ── Form Grid ── */
        .wr-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .wr-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wr-form-group.full-width {
          grid-column: 1 / -1;
        }
        .wr-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .required { color: #ef4444; }
        
        .wr-form-group input,
        .wr-form-group select {
          padding: 12px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .wr-form-group input:focus,
        .wr-form-group select:focus {
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30,136,229,0.15);
        }
        .wr-form-group input.error,
        .wr-form-group select.error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .wr-form-group input:disabled,
        .wr-form-group select:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .error-text {
          font-size: 11px;
          color: #ef4444;
          font-weight: 500;
        }
        .hint-text {
          font-size: 11px;
          color: #94a3b8;
          margin: 4px 0 0;
          font-style: italic;
        }

        /* ── Fixed Field ── */
        .fixed-field {
          padding: 12px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }
        .fixed-value {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Role Grid Cards ── */
        .role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .role-card {
          position: relative;
          cursor: pointer;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          background: white;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .role-card:hover {
          border-color: #1e88e5;
          background: #eff6ff;
          transform: translateY(-2px);
        }
        .role-card.selected {
          border-color: #1e88e5;
          background: #dbeafe;
          box-shadow: 0 4px 12px rgba(30,136,229,0.2);
        }
        .role-radio {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        .role-card-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .role-icon {
          font-size: 18px;
        }
        .role-name {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        .role-category {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
        .role-desc {
          font-size: 10px;
          color: #94a3b8;
          line-height: 1.3;
        }

        /* ── Password Wrapper ── */
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-wrapper input {
          width: 100%;
          padding-right: 40px;
        }
        .toggle-password {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .toggle-password:hover { opacity: 1; }
        .toggle-password:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Role Preview ── */
        .role-preview {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 24px;
        }
        .role-preview h4 {
          margin: 0 0 10px;
          font-size: 13px;
          color: #0369a1;
          font-weight: 600;
        }
        .preview-card {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .preview-icon {
          font-size: 24px;
        }
        .preview-card strong {
          display: block;
          font-size: 14px;
          color: #0c4a6e;
        }
        .preview-card p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        /* ── Form Actions ── */
        .wr-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30,136,229,0.3);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .btn-secondary {
          padding: 12px 20px;
          background: #f1f5f9;
          color: #475569;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Error Global ── */
        .wr-error-global {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #991b1b;
          font-weight: 500;
        }

        /* ── Info Panel ── */
        .wr-info-panel {
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 2px solid #f1f5f9;
        }
        .wr-info-panel h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .info-item {
          padding: 14px;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 3px solid #1e88e5;
        }
        .info-item strong {
          display: block;
          font-size: 13px;
          color: #1e293b;
          margin-bottom: 6px;
        }
        .info-item p {
          margin: 0 0 6px;
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
        }
        .info-item small {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .wr-main {
            margin-left: 0 !important;
            padding: 12px;
          }
          .wr-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .wr-title { font-size: 18px; }
          .wr-subtitle { font-size: 12px; }
          .wr-form-grid {
            grid-template-columns: 1fr;
          }
          .role-grid {
            grid-template-columns: 1fr;
          }
          .wr-form-actions {
            flex-direction: column-reverse;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
