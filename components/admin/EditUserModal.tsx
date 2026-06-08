"use client";

import { useState } from "react";
import { User, VALID_CHECKSHEETS } from "@/app/admin/accounts/page";

const VALID_ROLES = [
  { value: "group-leader-qa", label: "Group Leader QA" },
  { value: "inspector-qa", label: "Inspector QA" },
  { value: "inspector-ga", label: "Inspector GA" },
  { value: "inspector-ga-fire", label: "Inspector GA - Fire" },
  { value: "inspector-ga-equipment", label: "Inspector GA - Equipment" },
  { value: "inspector-ga-electrical", label: "Inspector GA - Electrical" },
  { value: "inspector-ga-personal", label: "Inspector GA - Personal" },
  { value: "inspector-ga-facility", label: "Inspector GA - Facility" },
  { value: "eso", label: "ESO" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

const VALID_DEPARTMENTS = [
  { value: "quality", label: "Quality" },
  { value: "qa", label: "QA" },
  { value: "general-affairs", label: "General Affairs" },
  { value: "ga", label: "GA" },
];

interface Props {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ user, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    username: user.username,
    fullName: user.fullName,
    nik: user.nik,
    department: user.department,
    role: user.role,
    newPassword: "",
    confirmPassword: "",
    isActive: user.isActive,
    checksheets: [...user.checksheets],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "password" | "checksheets">("info");

  const handleSubmit = async () => {
    setError("");

    // Validasi
    if (!formData.username.trim() || !formData.fullName.trim() || !formData.nik.trim()) {
      setError("Username, Nama Lengkap, dan NIK wajib diisi!");
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter!");
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("Password dan konfirmasi tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");

      const body: any = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        nik: formData.nik.trim(),
        department: formData.department,
        role: formData.role,
        isActive: formData.isActive,
        checksheets: formData.checksheets,
      };

      if (formData.newPassword) {
        body.newPassword = formData.newPassword;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-user-role": userRole || "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "Gagal mengupdate akun");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const toggleChecksheet = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      checksheets: prev.checksheets.includes(key)
        ? prev.checksheets.filter((c) => c !== key)
        : [...prev.checksheets, key],
    }));
  };

  const selectAllChecksheets = () => {
    setFormData((prev) => ({
      ...prev,
      checksheets: VALID_CHECKSHEETS.map((c) => c.key),
    }));
  };

  const deselectAllChecksheets = () => {
    setFormData((prev) => ({ ...prev, checksheets: [] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">✏️ Edit Akun</h2>
            <p className="text-blue-100 text-sm">{user.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { key: "info", label: "👤 Informasi", icon: "👤" },
            { key: "password", label: "🔒 Password", icon: "🔒" },
            { key: "checksheets", label: "📋 Checksheet", icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {VALID_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {VALID_DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-700">Status Akun</p>
                  <p className="text-sm text-gray-500">
                    {formData.isActive ? "Akun dapat login dan menggunakan aplikasi" : "Akun tidak dapat login"}
                  </p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      formData.isActive ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Tab: Password */}
          {activeTab === "password" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                  ⚠️ Kosongkan jika tidak ingin mengubah password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab: Checksheets */}
          {activeTab === "checksheets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Pilih checksheet yang dapat diakses oleh user ini ({formData.checksheets.length} dipilih)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllChecksheets}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={deselectAllChecksheets}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VALID_CHECKSHEETS.map((cs) => {
                  const isSelected = formData.checksheets.includes(cs.key);
                  return (
                    <button
                      key={cs.key}
                      onClick={() => toggleChecksheet(cs.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
                        {cs.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              "💾 Simpan Perubahan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}