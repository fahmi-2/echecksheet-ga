"use client";

import { useState, useEffect, useCallback } from "react";
import { AccountTable } from "@/components/admin/AccountTable";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";

export interface User {
  id: string;
  username: string;
  fullName: string;
  nik: string;
  department: string;
  role: string;
  isActive: boolean;
  checksheets: string[];
  createdAt: string;
  lastLogin: string | null;
  totalLogins: number;
}

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

export const VALID_CHECKSHEETS = [
  { key: "hydrant", label: "Hydrant" },
  { key: "selang-hydrant", label: "Selang Hydrant" },
  { key: "fire-alarm", label: "Fire Alarm" },
  { key: "smoke-detector", label: "Smoke Detector" },
  { key: "apar", label: "APAR" },
  { key: "emergency-lamp", label: "Emergency Lamp" },
  { key: "exit-lamp-pintu-darurat", label: "Exit Lamp & Pintu Darurat" },
  { key: "lift-barang", label: "Lift Barang" },
  { key: "inspeksi-preventif-lift-barang", label: "Inspeksi Preventif Lift Barang" },
  { key: "tg-listrik", label: "Tangga Listrik" },
  { key: "panel", label: "Panel Listrik" },
  { key: "form-inspeksi-stop-kontak", label: "Stop Kontak" },
  { key: "e-checksheet-apd", label: "APD" },
  { key: "inf-jalan", label: "Infrastruktur Jalan" },
  { key: "inspeksi-apd", label: "Inspeksi APD" },
  { key: "checksheet-toilet", label: "Toilet" },
];

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterRole) params.set("role", filterRole);
      if (filterDepartment) params.set("department", filterDepartment);

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-user-role": role || "",
        },
      });

      const data = await res.json();

      if (data.success) {
        let filtered = data.data;
        if (filterStatus === "active") {
          filtered = filtered.filter((u: User) => u.isActive);
        } else if (filterStatus === "inactive") {
          filtered = filtered.filter((u: User) => !u.isActive);
        }
        setUsers(filtered);
      } else {
        showToast(data.error || "Gagal memuat data", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterDepartment, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-user-role": role || "",
        },
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Akun "${selectedUser.fullName}" berhasil dinonaktifkan`);
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal menonaktifkan akun", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers();
    showToast("Data akun berhasil diperbarui!");
  };

  const handleUserCreated = () => {
    setShowAddModal(false);
    fetchUsers();
    showToast("Akun baru berhasil dibuat!");
  };

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-xl shadow-2xl text-white font-medium transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-red-500 to-rose-600"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                🛡️ Account Management
              </h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">
                Pusat kontrol untuk mengelola semua akun pengguna
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Akun
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Akun</p>
                <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Akun Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Akun Nonaktif</p>
                <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari username, nama, atau NIK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              <option value="">Semua Role</option>
              {VALID_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              <option value="">Semua Departemen</option>
              {VALID_DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 self-center mr-2">Status:</span>
            {[
              { key: "all", label: "Semua" },
              { key: "active", label: "Aktif" },
              { key: "inactive", label: "Nonaktif" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === s.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <AccountTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleUserUpdated}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}