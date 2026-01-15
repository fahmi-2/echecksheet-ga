"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface NavbarStaticProps {
  userName?: string
}

export function NavbarStatic({ userName = "User" }: NavbarStaticProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/login-page")
    closeMenu()
  }

  const menuOpen = isMounted && isMenuOpen
  const hamburgerOpen = isMounted && isMenuOpen

  return (
    <nav className="nav-bar-static" data-menu-open={menuOpen}>
      <div className="logo">E-Checksheet System</div>

      <button className="hamburger" data-active={hamburgerOpen} onClick={toggleMenu} aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className="nav-links" data-active={menuOpen}>
        <Link href="/ga-home" onClick={closeMenu}>
          Home
        </Link>
        <Link href="/dashboard" onClick={closeMenu}>
          Dashboard
        </Link>
        <Link href="/ga-inspeksi-apd" onClick={closeMenu}>
          Ga-inspeksi-apd
        </Link>
        <Link href="/e-checksheet-panel" onClick={closeMenu}>
          E-Checksheet
        </Link>
        <Link href="/status-inspector-pre-assy" onClick={closeMenu}>
          Pre-Assy
        </Link>
        <Link href="/cs-remove-tool" onClick={closeMenu}>
          Remove-Tool
        </Link>
      </div>

      <div className="user-info" data-active={menuOpen}>
        <span className="user-name">{userName}</span>
        <button onClick={handleLogout} className="logout-link">
          Logout
        </button>
      </div>

      <style jsx>{`
        .nav-bar-static {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%);
          padding: 0 24px;
          height: 64px;
          box-shadow: 0 4px 12px rgba(13, 71, 161, 0.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
          flex-shrink: 0;
        }

        .nav-links {
          display: flex;
          gap: 32px;
          margin: 0 auto;
          flex: 1;
          justify-content: center;
        }

        .nav-links a {
          color: rgb(255, 255, 255);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          letter-spacing: 0.3px;
          position: relative;
        }

        .nav-links a:hover {
          color: white;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: white;
          transition: width 0.3s ease;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .nav-bar-static .user-name {
          color: rgb(255, 255, 255);
          font-size: 14px;
          font-weight: 500;
        }

        .logout-link {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .logout-link:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .hamburger {
          display: none;
          flex-direction: column;
          cursor: pointer;
          background: none;
          border: none;
          padding: 8px;
          gap: 5px;
          margin-right: 16px;
        }

        .hamburger span {
          width: 24px;
          height: 3px;
          background: white;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .hamburger[data-active="true"] span:nth-child(1) {
          transform: rotate(45deg) translateY(11px);
        }

        .hamburger[data-active="true"] span:nth-child(2) {
          opacity: 0;
        }

        .hamburger[data-active="true"] span:nth-child(3) {
          transform: rotate(-45deg) translateY(-11px);
        }

        @media (max-width: 768px) {
          .nav-bar-static {
            height: auto;
            flex-wrap: wrap;
            padding: 12px 16px;
          }

          .logo {
            font-size: 18px;
          }

          .hamburger {
            display: flex;
          }

          .nav-links {
            display: none;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%);
            flex-direction: column;
            padding: 16px;
            gap: 8px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            width: 100%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .nav-links[data-active="true"] {
            display: flex;
          }

          .nav-links a {
            padding: 10px 12px;
            border-radius: 6px;
            transition: background 0.3s ease;
          }

          .nav-links a:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .nav-links a::after {
            display: none;
          }

          .user-info {
            position: absolute;
            top: 12px;
            right: 16px;
            gap: 12px;
          }

          .user-name {
            display: none;
          }

          .nav-links[data-active="true"] {
            top: 100%;
          }
        }
      `}</style>
    </nav>
  )
}
