"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

export function Sidebar({ userName = "User", userRole = "Role" }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState("/ga-home");
  const router = useRouter();
  const { user, logout } = useAuth();

  const currentRole = user?.role || "";
  const currentUserName = user?.username || "User";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getHomeRoute = () => {
    const role = currentRole.toLowerCase();
    if (role.includes("inspector-ga") || role === "ga") return "/home";
    if (role.includes("inspector-qa") || role === "qa") return "/home";
    if (role.includes("inspector-produksi") || role === "produksi") return "/produksi-home";
    if (role.includes("manager") || role === "manager") return "/manager-home";
    if (role.includes("admin") || role === "admin") return "/admin-home";
    return "/home";
  };

  const getDashboardRoute = () => {
    const role = currentRole.toLowerCase();
    if (role.includes("inspector-ga") || role === "ga") return "/ga-dashboard";
    if (role.includes("inspector") || role === "qa") return "/qa-dashboard";
    if (role.includes("group-leader") || role === "produksi") return "/gl-dashboard";
    
    return "/dashboard";
  };

  const getLaporanRoute = () => {
    const role = currentRole.toLowerCase();
    if (role.includes("manager") || role === "manager" || role.includes("admin")) {
      return "/pelaporan-list";
    }
    return "/pelaporan-list";
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLogout = () => {
    if (logout) logout();
    router.push("/login-page");
  };

  if (!isMounted) return null;

  return (
    <>
      <div className={`sidebar-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            {isExpanded && (
              <div className="logo-content">
                <h1 className="logo-title">E-Checksheet</h1>
                <p className="logo-subtitle">Management System</p>
              </div>
            )}
          </div>
          <button className="toggle-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {isExpanded ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-navigation">
          <Link 
            href={getHomeRoute()} 
            className={`menu-item ${activeMenu === getHomeRoute() ? 'active' : ''}`}
            onClick={() => setActiveMenu(getHomeRoute())}
          >
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            {isExpanded && <span className="menu-label">Home</span>}
          </Link>

          <Link 
            href={getDashboardRoute()} 
            className={`menu-item ${activeMenu === getDashboardRoute() ? 'active' : ''}`}
            onClick={() => setActiveMenu(getDashboardRoute())}
          >
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            {isExpanded && <span className="menu-label">Dashboard</span>}
          </Link>

          <Link 
            href={getLaporanRoute()} 
            className={`menu-item ${activeMenu === getLaporanRoute() ? 'active' : ''}`}
            onClick={() => setActiveMenu(getLaporanRoute())}
          >
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            {isExpanded && <span className="menu-label">Laporan</span>}
          </Link>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            {isExpanded && (
              <div className="user-info">
                <p className="user-name">{currentUserName}</p>
                <p className="user-role">{currentRole}</p>
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} className="logout-button" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}