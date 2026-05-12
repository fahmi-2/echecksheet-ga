// lib/hooks/useScanVerification.ts
"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Hook untuk verifikasi apakah user datang dari scan QR code
 * 
 * Ketika user scan QR code, parameter special '_scanned' ditambahkan ke URL
 * Gunakan hook ini di setiap halaman checksheet untuk enforce scan requirement
 * 
 * @param enableReadOnlyMode - Jika true, tampilkan halaman read-only jika tidak scan
 * @returns { isScanned: boolean, isLoading: boolean }
 */
export function useScanVerification() {
  const searchParams = useSearchParams();
  const [isScanned, setIsScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cek apakah ada parameter _scanned di URL (ditambahkan oleh scan system)
    const scanned = searchParams.get('_scanned') === 'true';
    setIsScanned(scanned);
    setIsLoading(false);
  }, [searchParams]);

  return { isScanned, isLoading };
}

/**
 * Helper untuk menambahkan parameter scan ke URL
 * Digunakan oleh scan page saat user scan QR code
 */
export function addScanParameter(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_scanned=true`;
}

/**
 * Helper untuk remove parameter scan dari URL
 */
export function removeScanParameter(url: string): string {
  // ✅ FIX: Gunakan URLSearchParams untuk parsing yang lebih aman
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.delete('_scanned');
    // Return path + query yang sudah dibersihkan
    const cleanUrl = urlObj.pathname + (urlObj.search ? urlObj.search : '');
    return cleanUrl;
  } catch {
    // Fallback string replace jika URL parsing gagal
    return url.replace(/([?&])_scanned=true/, '').replace(/\?$/, '').replace(/[?&]$/, '');
  }
}
