"use client";

import { User } from "@/app/admin/accounts/page";

interface Props {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ user, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nonaktifkan Akun</h2>
              <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.fullName}</p>
              <p className="text-sm text-gray-500">@{user.username} • {user.nik}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>Apakah Anda yakin ingin <strong>menonaktifkan</strong> akun ini?</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 ml-2">
              <li>Pengguna tidak dapat login ke sistem</li>
              <li>Data checksheet yang sudah diisi tetap tersimpan</li>
              <li>Akun dapat diaktifkan kembali kapan saja</li>
            </ul>
          </div>
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
            onClick={onConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            🗑️ Nonaktifkan
          </button>
        </div>
      </div>
    </div>
  );
}