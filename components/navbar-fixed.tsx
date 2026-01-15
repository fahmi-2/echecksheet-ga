"use client"

import Link from "next/link"

export function NavbarFixed() {
  return (
    <nav className="nav-bar-fixed">
      <div className="logo">E-Checksheet</div>
      <div className="nav-links">
        <Link href="/login-page">Login</Link>
        <Link href="/signup-page">Sign Up</Link>
      </div>
    </nav>
  )
}
