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
import { useRouter } from "next/navigation";

// 🔹 Role yang didukung - UPDATED: Tambahkan superadmin
export type Role = 
  | "group-leader-qa" 
  | "inspector-qa" 
  | "inspector-ga"           // ← Legacy (opsional, bisa di-deprecate)
  | "inspector-ga-fire"      // 🔥 Kategori 1: Proteksi Kebakaran & Evakuasi
  | "inspector-ga-equipment" // ⚙️ Kategori 2: Pemeliharaan Peralatan
  | "inspector-ga-electrical"// ⚡ Kategori 3: Instalasi Listrik
  | "inspector-ga-personal"  // 🦺 Kategori 4: Keselamatan Personal & Prasarana
  | "inspector-ga-facility"  // 🧹 Kategori 5: Kebersihan Fasilitas
  | "eso" 
  | "admin"
  | "superadmin";            // ✅ TAMBAHKAN INI

// 🔹 Struktur pengguna
export interface User {
  id: string;
  username: string;
  fullName: string;
  nik: string;
  department: string;
  role: Role;
}

// 🔹 Interface untuk update user data
export interface UpdateUserData {
  username?: string;
  fullName?: string;
  nik?: string;
  department?: string;
  role?: Role;
  newPassword?: string;
  isActive?: boolean;
}

export interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  isInitialized: boolean;
  signup: (
    data: {
      username: string;
      fullName: string;
      nik: string;
      department: string;
      role: Role;
      password: string;
      confirmPassword: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // 🔹 User Management (Admin Only)
  fetchUsers: (params?: { search?: string; role?: string; department?: string }) => 
    Promise<{ success: boolean; data?: any[]; error?: string }>;
  updateUser: (id: string, data: UpdateUserData) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔑 Kunci localStorage
const CURRENT_USER_KEY = "auth_current_user_v2";
const SESSION_TOKEN_KEY = "auth_session_token";

// 🔹 Helper: Cek apakah role valid - UPDATED: tambah superadmin
export function isValidRole(role: string): role is Role {
  const validRoles: Role[] = [
    "group-leader-qa",
    "inspector-qa", 
    "inspector-ga",
    "inspector-ga-fire",
    "inspector-ga-equipment",
    "inspector-ga-electrical", 
    "inspector-ga-personal",
    "inspector-ga-facility",
    "eso",
    "admin",
    "superadmin",  // ✅ TAMBAHKAN INI
  ];
  return validRoles.includes(role as Role);
}

// 🔹 Helper: Get allowed departments untuk role tertentu - UPDATED: tambah superadmin
export function getAllowedDepartments(role: Role): string[] {
  const validDepartments: Record<Role, string[]> = {
    "group-leader-qa": ["quality-assurance"],
    "inspector-qa": ["quality-assurance"],
    "inspector-ga": ["general-affairs"],
    // ✅ 5 Role GA Baru - semua hanya boleh general-affairs
    "inspector-ga-fire": ["general-affairs"],
    "inspector-ga-equipment": ["general-affairs"],
    "inspector-ga-electrical": ["general-affairs"],
    "inspector-ga-personal": ["general-affairs"],
    "inspector-ga-facility": ["general-affairs"],
    "admin": ["admin"],
    "superadmin": ["admin"],  // ✅ TAMBAHKAN INI
    "eso": ["k3"]
  };
  return validDepartments[role] || [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasExplicitLogout, setHasExplicitLogout] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch - only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔄 Load dari localStorage saat pertama kali dengan proper initialization
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        console.log('🔐 Initializing authentication...');
        
        const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
        const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
        
        // Jika tidak ada session, skip
        if (!savedCurrentUser || !sessionToken) {
          console.log('ℹ️ No saved session found');
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        try {
          const user = JSON.parse(savedCurrentUser);
          
          // ✅ Validasi role dengan helper function
          if (isValidRole(user.role)) {
            const validUser: User = {
              id: user.id || user.username,
              username: user.username,
              fullName: user.fullName,
              nik: user.nik,
              department: user.department,
              role: user.role,
            };
            
            setCurrentUser(validUser);
            console.log('✅ Session restored:', validUser.username, 'Role:', validUser.role);
          } else {
            console.warn('⚠️ Invalid role in saved session:', user.role);
            localStorage.removeItem(CURRENT_USER_KEY);
            setCurrentUser(null);
          }
        } catch (parseError) {
          console.error("❌ Failed to parse user data:", parseError);
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("❌ Failed to restore session:", e);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setCurrentUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        console.log('✅ Auth initialization complete');
      }
    };

    initAuth();
  }, []);

  // 🔄 Simpan currentUser ke localStorage AMAN - HANYA saat sudah initialized
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏸️  Auth not initialized yet, skipping save...');
      return;
    }

    try {
      if (currentUser) {
        if (!currentUser.username || !currentUser.fullName) {
          console.warn('⚠️ Invalid user object, skipping save:', currentUser);
          return;
        }
        
        localStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify({
            id: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName,
            nik: currentUser.nik,
            department: currentUser.department,
            role: currentUser.role,
          })
        );
        console.log('💾 User data saved:', currentUser.username);
        setHasExplicitLogout(false);
      } else {
        if (hasExplicitLogout) {
          console.log('🔄 Explicit logout detected, clearing all auth data');
          localStorage.removeItem(CURRENT_USER_KEY);
          localStorage.removeItem(SESSION_TOKEN_KEY);
        } else {
          console.log('⚠️ User data null, but keeping session token intact');
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }, [currentUser, isInitialized]);

  // ──────────────────────────────────────────────────────────────────────────
  // 🔹 USER MANAGEMENT FUNCTIONS (Admin Only)
  // ──────────────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(
    async (params?: { search?: string; role?: string; department?: string }) => {
      try {
        const userStr = localStorage.getItem(CURRENT_USER_KEY);
        if (!userStr) {
          console.error('❌ [fetchUsers] No user in localStorage');
          return { success: false, error: "Not authenticated" };
        }
        
        const currentUser = JSON.parse(userStr);
        console.log('🔐 [fetchUsers] Current user:', {
          id: currentUser.id,
          role: currentUser.role,
          username: currentUser.username,
        });

        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.role) searchParams.set("role", params.role);
        if (params?.department) searchParams.set("department", params.department);

        const headers: Record<string, string> = {
          "x-user-id": String(currentUser.id || ""),
          "x-user-role": String(currentUser.role || ""),
          "x-username": String(currentUser.username || ""),
        };
        
        console.log('📡 [fetchUsers] Fetching with headers:', headers);

        const response = await fetch(`/e-checksheet-ga/api/auth/users?${searchParams}`, {
          method: "GET",
          headers: headers,
        });

        console.log('📥 [fetchUsers] Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 [fetchUsers] Raw response:', responseText.substring(0, 500));
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseErr) {
          console.error('❌ [fetchUsers] Failed to parse JSON:', parseErr);
          return { success: false, error: "Invalid response from server" };
        }
        
        if (!response.ok) {
          console.error('❌ [fetchUsers] API error:', result);
          return { success: false, error: result.message || result.error || "Failed to fetch users" };
        }
        
        return { success: true, data: result.data };
        
      } catch (error) {
        console.error("❌ [fetchUsers] Network error:", error);
        return { success: false, error: "Gagal terhubung ke server" };
      }
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, data: UpdateUserData) => {
      try {
        const userStr = localStorage.getItem(CURRENT_USER_KEY);
        if (!userStr) return { success: false, error: "Not authenticated" };
        const currentUser = JSON.parse(userStr);

        const response = await fetch(`/e-checksheet-ga/api/auth/users/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-username": currentUser.username,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) {
          return { success: false, error: result.error || "Failed to update user" };
        }
        return { success: true };
      } catch (error) {
        console.error("❌ Error updating user:", error);
        return { success: false, error: "Gagal terhubung ke server" };
      }
    },
    []
  );

  const deactivateUser = useCallback(
    async (id: string) => {
      try {
        const userStr = localStorage.getItem(CURRENT_USER_KEY);
        if (!userStr) return { success: false, error: "Not authenticated" };
        const currentUser = JSON.parse(userStr);

        const response = await fetch(`/e-checksheet-ga/api/auth/users/${id}`, {
          method: "DELETE",
          headers: {
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-username": currentUser.username,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          return { success: false, error: result.error || "Failed to deactivate user" };
        }
        return { success: true };
      } catch (error) {
        console.error("❌ Error deactivating user:", error);
        return { success: false, error: "Gagal terhubung ke server" };
      }
    },
    []
  );

  // ──────────────────────────────────────────────────────────────────────────
  // ✅ SIGNUP - Kirim ke PostgreSQL API
  // ──────────────────────────────────────────────────────────────────────────
  const signup = useCallback(
    async ({
      username,
      fullName,
      nik,
      department,
      role,
      password,
      confirmPassword,
    }: {
      username: string;
      fullName: string;
      nik: string;
      department: string;
      role: Role;
      password: string;
      confirmPassword: string;
    }) => {
      // Validasi sisi klien
      if (!username.trim() || !fullName.trim() || !nik.trim() || !department.trim()) {
        return { success: false, error: "Semua field wajib diisi!" };
      }

      // ✅ Validasi role dengan helper
      if (!role || !isValidRole(role)) {
        return { success: false, error: "Pilih role yang valid!" };
      }

      if (password.length < 6) {
        return { success: false, error: "Password minimal 6 karakter!" };
      }

      if (password !== confirmPassword) {
        return { success: false, error: "Password dan konfirmasi tidak cocok!" };
      }

      // ✅ Validasi role ↔ departemen dengan helper
      const allowedDepts = getAllowedDepartments(role);
      if (!allowedDepts.includes(department)) {
        const deptLabels = allowedDepts
          .map((d) => {
            const map: Record<string, string> = {
              "quality-assurance": "Quality Assurance",
              "general-affairs": "General Affairs",
              "admin": "Admin",
              "k3": "K3/ESO"
            };
            return map[d] || d;
          })
          .join(", ");
        return { success: false, error: `Role ${role} hanya boleh memilih departemen: ${deptLabels}` };
      }

      // KIRIM KE API DATABASE
      try {
        console.log('📤 Sending signup request to API...');
        
        const response = await fetch('/e-checksheet-ga/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            fullName: fullName.trim(),
            nik: nik.trim(),
            department,
            role,
            password,
            confirmPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('❌ Signup failed:', result.error);
          
          if (response.status === 409) {
            return { success: false, error: "Username atau NIK sudah terdaftar!" };
          }
          return { success: false, error: result.error || "Pendaftaran gagal!" };
        }

        console.log('✅ Signup successful:', result.userId);
        return { success: true };
        
      } catch (error) {
        console.error("❌ Error during signup API call:", error);
        return { success: false, error: "Gagal terhubung ke server. Periksa koneksi Anda." };
      }
    },
    []
  );
  
  // ──────────────────────────────────────────────────────────────────────────
  // ✅ LOGIN - Kirim ke PostgreSQL API
  // ──────────────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (username: string, password: string) => {
      if (!username.trim() || !password) {
        return { success: false, error: "Username dan password harus diisi!" };
      }

      try {
        console.log('📤 Sending login request to API...');
        
        const response = await fetch('/e-checksheet-ga/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('❌ Login failed:', result.error);
          
          if (response.status === 401) {
            return { success: false, error: result.error || "Username atau password salah!" };
          }
          if (response.status === 403) {
            return { success: false, error: result.error || "Akun tidak aktif!" };
          }
          return { success: false, error: result.error || "Login gagal!" };
        }

        // ✅ Validasi role dari response API
        if (!isValidRole(result.user.role)) {
          console.error('❌ Invalid role from API:', result.user.role);
          return { success: false, error: "Role pengguna tidak valid!" };
        }

        // Simpan user ke state dan localStorage
        const safeUser: User = {
          id: result.user.id,
          username: result.user.username,
          fullName: result.user.fullName,
          nik: result.user.nik,
          department: result.user.department,
          role: result.user.role,
        };

        setCurrentUser(safeUser);

        // Set session token
        const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);

        console.log('✅ Login successful:', safeUser.fullName, 'Role:', safeUser.role);
        return { success: true };
        
      } catch (error) {
        console.error("❌ Error during login API call:", error);
        return { success: false, error: "Gagal terhubung ke server. Periksa koneksi Anda." };
      }
    },
    []
  );

  const logout = useCallback(() => {
    console.log('👋 Logging out user...');
    setHasExplicitLogout(true);
    setCurrentUser(null);
    router.push("/login-page");
  }, [router]);

  // ✅ Tampilkan loading screen saat initialization
  if (!mounted || !isInitialized) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        loading,
        isInitialized,
        signup,
        login,
        logout,
        fetchUsers,
        updateUser,
        deactivateUser,
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

// ============================================
// 🔐 SERVER-SIDE AUTHENTICATION HELPER
// ============================================
export async function getAuth(request?: Request): Promise<{ user: User | null; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

      if (!currentUserStr || !sessionToken) {
        return { user: null };
      }

      const currentUser = JSON.parse(currentUserStr);
      
      // ✅ Validasi role dengan helper
      if (!isValidRole(currentUser.role)) {
        return { user: null, error: "Invalid role" };
      }
      
      return {
        user: {
          id: currentUser.id || currentUser.username,
          username: currentUser.username,
          fullName: currentUser.fullName,
          nik: currentUser.nik,
          department: currentUser.department,
          role: currentUser.role,
        },
      };
    }

    return { user: null };
    
  } catch (error) {
    console.error("Error in getAuth:", error);
    return { user: null, error: "Authentication error" };
  }
}

// ✅ CHECK AUTHENTICATION STATUS
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

  return !!currentUser && !!sessionToken;
}

// ✅ GET CURRENT USER (CLIENT-SIDE)
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!currentUserStr) return null;

  try {
    const currentUser = JSON.parse(currentUserStr);
    
    // ✅ Validasi role dengan helper
    if (!isValidRole(currentUser.role)) {
      console.warn("Invalid role in getCurrentUser:", currentUser.role);
      return null;
    }
    
    return {
      id: currentUser.id || currentUser.username,
      username: currentUser.username,
      fullName: currentUser.fullName,
      nik: currentUser.nik,
      department: currentUser.department,
      role: currentUser.role,
    };
  } catch (error) {
    console.error("Error parsing current user:", error);
    return null;
  }
}