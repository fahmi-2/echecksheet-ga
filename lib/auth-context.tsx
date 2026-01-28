// lib/auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// 🔹 Role yang didukung
<<<<<<< HEAD
export type Role = "group-leader-qa" | "inspector-qa" | "inspector-ga" | "manager"
=======
export type Role = "group-leader" | "inspector" | "inspector-ga" | "manager";
>>>>>>> main

// 🔹 Struktur pengguna
export interface User {
<<<<<<< HEAD
  username: string
  fullName: string
  nik: string
  department: string
  role: Role
}

interface AuthContextType {
  user: User | null
  currentUser: User | null
  loading: boolean
  signup: (data: {
    username: string
    fullName: string
    nik: string
    department: string
    role: Role
    password: string
    confirmPassword: string
  }) => { success: boolean; error?: string }
  login: (username: string, password: string) => { success: boolean; error?: string }
  logout: () => void
=======
  username: string;
  fullName: string;
  niki: string;
  department: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  signup: (
    data: {
      username: string;
      fullName: string;
      niki: string;
      department: string;
      role: Role;
      password: string;
      confirmPassword: string;
    }
  ) => { success: boolean; error?: string };
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
>>>>>>> main
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔑 Kunci localStorage
const USER_STORAGE_KEY = "auth_users_v2";
const CURRENT_USER_KEY = "auth_current_user_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User & { password: string }>>({});
  const [loading, setLoading] = useState(true);

  // 🔄 Load dari localStorage saat pertama kali
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }

      const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedCurrentUser) {
<<<<<<< HEAD
        const user = JSON.parse(savedCurrentUser)
        if (["group-leader-qa", "inspector-qa", "inspector-ga", "manager"].includes(user.role)) {
=======
        const user = JSON.parse(savedCurrentUser);
        if (["group-leader", "inspector", "inspector-ga", "manager"].includes(user.role)) {
>>>>>>> main
          setCurrentUser({
            username: user.username,
            fullName: user.fullName,
            nik: user.nik,
            department: user.department,
            role: user.role as Role,
          });
        }
      }
    } catch (e) {
      console.warn("Gagal memuat data auth dari localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Simpan users ke localStorage
  useEffect(() => {
    if (Object.keys(users).length > 0) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  // 🔄 Simpan currentUser ke localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({
          username: currentUser.username,
          fullName: currentUser.fullName,
          nik: currentUser.nik,
          department: currentUser.department,
          role: currentUser.role,
        })
      );
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  const signup = useCallback(
    ({
      username,
      fullName,
      nik,
      department,
      role,
      password,
      confirmPassword,
    }: {
<<<<<<< HEAD
      username: string
      fullName: string
      nik: string
      department: string
      role: Role
      password: string
      confirmPassword: string
    }) => {
      if (!username.trim() || !fullName.trim() || !nik.trim() || !department.trim()) {
        return { success: false, error: "Semua field wajib diisi!" }
      }

      if (!role || !["group-leader-qa", "inspector-qa", "inspector-ga", "manager"].includes(role)) {
        return { success: false, error: "Pilih role yang valid!" }
=======
      username: string;
      fullName: string;
      niki: string;
      department: string;
      role: Role;
      password: string;
      confirmPassword: string;
    }) => {
      if (!username.trim() || !fullName.trim() || !niki.trim() || !department.trim()) {
        return { success: false, error: "Semua field wajib diisi!" };
      }

      if (!role || !["group-leader", "inspector", "inspector-ga", "manager"].includes(role)) {
        return { success: false, error: "Pilih role yang valid!" };
>>>>>>> main
      }

      if (password.length < 6) {
        return { success: false, error: "Password minimal 6 karakter!" };
      }

      if (password !== confirmPassword) {
        return { success: false, error: "Password dan konfirmasi tidak cocok!" };
      }

      if (users[username]) {
        return { success: false, error: "Username sudah terdaftar!" };
      }

      // ✅ Validasi role ↔ departemen
      const validDepartments: Record<Role, string[]> = {
        "group-leader": ["operations", "maintenance", "quality", "admin"],
        "inspector": ["operations", "maintenance", "quality", "admin"],
        "inspector-ga": ["general-affairs"],
        "manager": ["management"],
      };

      if (!validDepartments[role].includes(department)) {
        const deptLabels = validDepartments[role].map((d) => {
          const map: Record<string, string> = {
            operations: "Operasional",
            maintenance: "Perawatan",
            quality: "Kualitas",
            admin: "Admin",
            "general-affairs": "General Affairs",
            management: "Management",
          };
          return map[d] || d;
        }).join(", ");
        return { success: false, error: `Role ${role} hanya boleh memilih departemen: ${deptLabels}` };
      }

      const newUser = {
        username,
        fullName,
        nik,
        department,
        role,
        password,
      };

      setUsers((prev) => ({
        ...prev,
        [username]: newUser,
      }));

      console.log("[Auth] User berhasil didaftarkan:", { username, fullName, department, role });
      return { success: true };
    },
    [users]
  );

  const login = useCallback(
    (username: string, password: string) => {
      if (!username.trim() || !password) {
        return { success: false, error: "Username dan password harus diisi!" };
      }

      const user = users[username];
      if (!user) {
        return { success: false, error: "Username tidak ditemukan!" };
      }

      if (user.password !== password) {
        return { success: false, error: "Password salah!" };
      }

<<<<<<< HEAD
      if (!["group-leader-qa", "inspector-qa", "inspector-ga", "manager"].includes(user.role)) {
        return { success: false, error: "Role tidak valid!" }
=======
      if (!["group-leader", "inspector", "inspector-ga", "manager"].includes(user.role)) {
        return { success: false, error: "Role tidak valid!" };
>>>>>>> main
      }

      const safeUser: User = {
        username: user.username,
        fullName: user.fullName,
        nik: user.nik,
        department: user.department,
        role: user.role as Role,
      };

      setCurrentUser(safeUser);
      console.log("[Auth] Login berhasil:", safeUser.fullName, "Role:", safeUser.role);

      return { success: true };
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    console.log("[Auth] Logout berhasil");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}