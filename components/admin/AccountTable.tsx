"use client";

import { User, VALID_CHECKSHEETS } from "@/app/admin/accounts/types";

interface Props {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const ROLE_LABELS: Record<string, string> = {
  "group-leader-qa": "Group Leader QA",
  "inspector-qa": "Inspector QA",
  "inspector-ga": "Inspector GA",
  "inspector-ga-fire": "GA - Fire",
  "inspector-ga-equipment": "GA - Equipment",
  "inspector-ga-electrical": "GA - Electrical",
  "inspector-ga-personal": "GA - Personal",
  "inspector-ga-facility": "GA - Facility",
  "eso": "ESO",
  "admin": "Admin",
  "superadmin": "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  "group-leader-qa": "bg-purple-100 text-purple-700",
  "inspector-qa": "bg-blue-100 text-blue-700",
  "inspector-ga": "bg-cyan-100 text-cyan-700",
  "inspector-ga-fire": "bg-orange-100 text-orange-700",
  "inspector-ga-equipment": "bg-amber-100 text-amber-700",
  "inspector-ga-electrical": "bg-yellow-100 text-yellow-700",
  "inspector-ga-personal": "bg-teal-100 text-teal-700",
  "inspector-ga-facility": "bg-emerald-100 text-emerald-700",
  "eso": "bg-indigo-100 text-indigo-700",
  "admin": "bg-red-100 text-red-700",
  "superadmin": "bg-gradient-to-r from-red-100 to-pink-100 text-red-800",
};

export function AccountTable({ users, loading, onEdit, onDelete }: Props) {
  const getChecksheetLabel = (key: string) => {
    return VALID_CHECKSHEETS.find((c) => c.key === key)?.label || key;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500">Memuat data akun...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">Tidak ada akun ditemukan</p>
          <p className="text-gray-400 text-sm">Coba ubah filter pencarian Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">Pengguna</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">NIK</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">Role</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">Dept</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">Checksheet</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-blue-800">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-blue-800">Login Terakhir</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-blue-800">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                {/* User Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </td>

                {/* NIK */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 font-mono">{user.nik}</span>
                </td>

                {/* Role */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>

                {/* Department */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {user.department?.replace("-", " ") || "-"}
                  </span>
                </td>

                {/* Checksheets */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {user.checksheets.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Belum ada</span>
                    ) : (
                      <>
                        {user.checksheets.slice(0, 2).map((cs) => (
                          <span
                            key={cs}
                            className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                          >
                            {getChecksheetLabel(cs)}
                          </span>
                        ))}
                        {user.checksheets.length > 2 && (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                            +{user.checksheets.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"
                      }`}
                    />
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>

                {/* Last Login */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <p>{formatDate(user.lastLogin)}</p>
                    <p className="text-xs text-gray-400">
                      {user.totalLogins > 0 ? `${user.totalLogins}x login` : "Belum pernah"}
                    </p>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all"
                      title="Nonaktifkan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500">@{user.username} • {user.nik}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                {user.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-400 text-xs">Role</span>
                <p className="font-medium text-gray-700">{ROLE_LABELS[user.role] || user.role}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Departemen</span>
                <p className="font-medium text-gray-700 capitalize">{user.department?.replace("-", " ") || "-"}</p>
              </div>
            </div>

            {user.checksheets.length > 0 && (
              <div className="mb-3">
                <span className="text-gray-400 text-xs">Checksheet ({user.checksheets.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.checksheets.slice(0, 3).map((cs) => (
                    <span key={cs} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md">
                      {getChecksheetLabel(cs)}
                    </span>
                  ))}
                  {user.checksheets.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                      +{user.checksheets.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Login: {formatDate(user.lastLogin)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(user)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onDelete(user)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
        Menampilkan {users.length} akun
      </div>
    </div>
  );
}