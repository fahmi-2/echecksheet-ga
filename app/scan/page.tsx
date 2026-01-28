// app/scan/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const isCleaningUpRef = useRef(false);

  // ✅ Ubah forceStopCamera menjadi async dengan cleanup flag
  const forceStopCamera = useCallback(async () => {
    if (isCleaningUpRef.current) return; // Prevent concurrent cleanup
    isCleaningUpRef.current = true;

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch {}
        html5QrCodeRef.current = null;
      }
    } finally {
      isScanningRef.current = false;
      isCleaningUpRef.current = false;
    }
  }, []);

  // ✅ Separate effect untuk authentication check (hanya jalan sekali)
  useEffect(() => {
    // Only redirect if not authenticated
    if (!user) {
      setRedirected(true);
      router.push("/login-page");
      return;
    }

    if (user.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home");
      return;
    }

    // Reset redirected flag when scan page loads with valid user
    setRedirected(false);
  }, [user, router]);

  // ✅ Wrap handleScanResult dalam useCallback dengan flag untuk prevent multiple calls
  const handleScanResult = useCallback(async (text: string) => {
    // Prevent multiple simultaneous scans
    if (isScanningRef.current === false || isCleaningUpRef.current) {
      return;
    }

    // Mark as no longer scanning to prevent multiple scans
    isScanningRef.current = false;

    // 🔥 MATIKAN KAMERA & TUNGGU SAMPAI BENAR-BENAR MATI
    await forceStopCamera();

    try {
      // Support both old and new QR formats
      if (!text.startsWith("echecksheet://")) {
        setError("QR tidak valid. Harus dimulai dengan: echecksheet://");
        // Restart scanner setelah error
        isScanningRef.current = true;
        return;
      }

      // Remove echecksheet:// prefix
      let remaining = text.replace(/^echecksheet:\/\/\//, ""); // Handle echecksheet:///
      remaining = remaining.replace(/^echecksheet:\/\//, ""); // Handle echecksheet://

      // NEW FORMAT: echecksheet:///status-ga/[checksheet-type]/[path-or-query]
      if (remaining.startsWith("status-ga/")) {
        remaining = remaining.replace("status-ga/", "");
        const [firstPart, ...restParts] = remaining.split("/");
        const urlWithQuery = [firstPart, ...restParts].join("/");
        const [pathPart, query] = urlWithQuery.split("?");
        
        let targetUrl = "";

        switch (firstPart) {
          case "fire-alarm": {
            const zona = pathPart.replace("fire-alarm/", "");
            targetUrl = `/status-ga/fire-alarm/${encodeURIComponent(zona)}`;
            break;
          }
          case "inspeksi-hydrant": {
            const queryParams = new URLSearchParams(query || "");
            const openHydrant = queryParams.get("openHydrant");
            if (openHydrant) {
              targetUrl = `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(openHydrant)}`;
            }
            break;
          }
          case "inspeksi-apar": {
            const slug = pathPart.replace("inspeksi-apar/", "");
            targetUrl = `/status-ga/inspeksi-apar/${encodeURIComponent(slug)}`;
            break;
          }
          case "checksheet-toilet": {
            const areaId = pathPart.replace("checksheet-toilet/", "");
            targetUrl = `/status-ga/checksheet-toilet/${encodeURIComponent(areaId)}`;
            break;
          }
          case "lift-barang": {
            const queryParams = new URLSearchParams(query || "");
            const openLift = queryParams.get("openLift");
            if (openLift) {
              targetUrl = `/status-ga/lift-barang?openLift=${encodeURIComponent(openLift)}`;
            }
            break;
          }
          case "selang-hydrant": {
            const queryParams = new URLSearchParams(query || "");
            const openArea = queryParams.get("openArea");
            if (openArea) {
              targetUrl = `/status-ga/selang-hydrant?openArea=${encodeURIComponent(openArea)}`;
            }
            break;
          }
          case "smoke-detector": {
            const queryParams = new URLSearchParams(query || "");
            const openArea = queryParams.get("openArea");
            if (openArea) {
              targetUrl = `/status-ga/smoke-detector?openArea=${encodeURIComponent(openArea)}`;
            }
            break;
          }
          case "inspeksi-emergency": {
            const area = pathPart.replace("inspeksi-emergency/", "");
            targetUrl = `/status-ga/inspeksi-emergency/${encodeURIComponent(area)}`;
            break;
          }
          case "exit-lamp-pintu-darurat": {
            const category = pathPart.replace("exit-lamp-pintu-darurat/", "");
            targetUrl = `/status-ga/exit-lamp-pintu-darurat/${encodeURIComponent(category)}`;
            break;
          }
          case "panel": {
            const queryParams = new URLSearchParams(query || "");
            const openPanel = queryParams.get("openPanel");
            if (openPanel) {
              targetUrl = `/status-ga/panel?openPanel=${encodeURIComponent(openPanel)}`;
            }
            break;
          }
          case "form-inspeksi-stop-kontak": {
            const type = pathPart.replace("form-inspeksi-stop-kontak/", "");
            targetUrl = `/status-ga/form-inspeksi-stop-kontak/${encodeURIComponent(type)}`;
            break;
          }
          case "ga-inf-jalan": {
            const queryParams = new URLSearchParams(query || "");
            const search = queryParams.get("search");
            if (search) {
              targetUrl = `/status-ga/ga-inf-jalan?search=${encodeURIComponent(search)}`;
            }
            break;
          }
          case "inspeksi-apd": {
            const queryParams = new URLSearchParams(query || "");
            const areaId = queryParams.get("areaId");
            if (areaId) {
              targetUrl = `/status-ga/inspeksi-apd?areaId=${encodeURIComponent(areaId)}`;
            }
            break;
          }
          case "tg-listrik": {
            const queryParams = new URLSearchParams(query || "");
            const openArea = queryParams.get("openArea");
            if (openArea) {
              targetUrl = `/status-ga/tg-listrik?openArea=${encodeURIComponent(openArea)}`;
            }
            break;
          }
          case "inspeksi-preventif-lift-barang": {
            const subtype = pathPart.replace("inspeksi-preventif-lift-barang/", "");
            targetUrl = `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(subtype)}`;
            break;
          }
          default:
            setError(`Jenis checksheet "${firstPart}" tidak dikenali.`);
            isScanningRef.current = true;
            return;
        }

        if (!targetUrl) {
          setError("Tidak dapat memproses URL QR code.");
          isScanningRef.current = true;
          return;
        }

        // ✅ Navigasi setelah kamera benar-benar stop
        router.push(targetUrl);
        return;
      }

      // E-CHECKSHEET DIRECT ROUTES: echecksheet:///e-checksheet-*/...
      if (remaining.startsWith("e-checksheet-")) {
        // First, separate path from query string
        const [pathPart, query] = remaining.split("?", 2);
        const [checksheetType, ...restParts] = pathPart.split("/");

        let targetUrl = "";

        switch (checksheetType) {
          case "e-checksheet-hydrant": {
            const queryParams = new URLSearchParams(query || "");
            // Accept both old format (openHydrant) and new format (no, lokasi, zona, jenisHydrant)
            const openHydrant = queryParams.get("openHydrant") || queryParams.get("no");
            const lokasi = queryParams.get("lokasi");
            const zona = queryParams.get("zona");
            const jenisHydrant = queryParams.get("jenisHydrant");
            
            if (openHydrant) {
              if (lokasi && zona && jenisHydrant) {
                // New format with all parameters
                targetUrl = `/e-checksheet-hydrant?no=${encodeURIComponent(openHydrant)}&lokasi=${encodeURIComponent(lokasi)}&zona=${encodeURIComponent(zona)}&jenisHydrant=${encodeURIComponent(jenisHydrant)}`;
              } else {
                // Old format with just openHydrant
                targetUrl = `/e-checksheet-hydrant?openHydrant=${encodeURIComponent(openHydrant)}`;
              }
            }
            break;
          }
          case "e-checksheet-inf-jalan": {
            const queryParams = new URLSearchParams(query || "");
            const areaName = queryParams.get("areaName");
            const kategori = queryParams.get("kategori");
            const lokasi = queryParams.get("lokasi");
            const search = queryParams.get("search"); // Old format
            
            if (areaName || kategori || lokasi) {
              // New format
              targetUrl = `/e-checksheet-inf-jalan?areaName=${encodeURIComponent(areaName || "")}&kategori=${encodeURIComponent(kategori || "")}&lokasi=${encodeURIComponent(lokasi || "")}`;
            } else if (search) {
              // Old format
              targetUrl = `/e-checksheet-inf-jalan?search=${encodeURIComponent(search)}`;
            }
            break;
          }
          case "e-checksheet-ins-apd": {
            const queryParams = new URLSearchParams(query || "");
            const areaId = queryParams.get("areaId");
            const areaName = queryParams.get("areaName");
            const areaType = queryParams.get("areaType");
            
            if (areaId) {
              if (areaName && areaType) {
                // New format with all parameters
                targetUrl = `/e-checksheet-ins-apd?areaId=${encodeURIComponent(areaId)}&areaName=${encodeURIComponent(areaName)}&areaType=${encodeURIComponent(areaType)}`;
              } else {
                // Old format with just areaId
                targetUrl = `/e-checksheet-ins-apd?areaId=${encodeURIComponent(areaId)}`;
              }
            }
            break;
          }
          case "e-checksheet-lift-barang": {
            const queryParams = new URLSearchParams(query || "");
            const liftName = queryParams.get("liftName");
            const area = queryParams.get("area");
            const lokasi = queryParams.get("lokasi");
            const openLift = queryParams.get("openLift"); // Old format
            
            if (liftName || openLift) {
              if (liftName && area && lokasi) {
                // New format with all parameters
                targetUrl = `/e-checksheet-lift-barang?liftName=${encodeURIComponent(liftName)}&area=${encodeURIComponent(area)}&lokasi=${encodeURIComponent(lokasi)}`;
              } else if (openLift) {
                // Old format
                targetUrl = `/e-checksheet-lift-barang?openLift=${encodeURIComponent(openLift)}`;
              }
            }
            break;
          }
          case "e-checksheet-panel": {
            const queryParams = new URLSearchParams(query || "");
            const panelName = queryParams.get("panelName");
            const area = queryParams.get("area");
            const date = queryParams.get("date");
            const openPanel = queryParams.get("openPanel"); // Old format
            
            if (panelName || openPanel) {
              if (panelName && area && date) {
                // New format with all parameters
                targetUrl = `/e-checksheet-panel?panelName=${encodeURIComponent(panelName)}&area=${encodeURIComponent(area)}&date=${encodeURIComponent(date)}`;
              } else if (openPanel) {
                // Old format
                targetUrl = `/e-checksheet-panel?openPanel=${encodeURIComponent(openPanel)}`;
              }
            }
            break;
          }
          case "e-checksheet-slg-hydrant": {
            const queryParams = new URLSearchParams(query || "");
            const lokasi = queryParams.get("lokasi");
            const zona = queryParams.get("zona");
            const jenisHydrant = queryParams.get("jenisHydrant");
            const pic = queryParams.get("pic");
            const openArea = queryParams.get("openArea"); // Old format
            
            if (lokasi || openArea) {
              if (lokasi && zona && jenisHydrant && pic) {
                // New format with all parameters
                targetUrl = `/e-checksheet-slg-hydrant?lokasi=${encodeURIComponent(lokasi)}&zona=${encodeURIComponent(zona)}&jenisHydrant=${encodeURIComponent(jenisHydrant)}&pic=${encodeURIComponent(pic)}`;
              } else if (openArea) {
                // Old format
                targetUrl = `/e-checksheet-slg-hydrant?openArea=${encodeURIComponent(openArea)}`;
              }
            }
            break;
          }
          case "e-checksheet-smoke-detector": {
            const queryParams = new URLSearchParams(query || "");
            const no = queryParams.get("no");
            const lokasi = queryParams.get("lokasi");
            const zona = queryParams.get("zona");
            const openArea = queryParams.get("openArea"); // Old format
            
            if (no || openArea) {
              if (no && lokasi && zona) {
                // New format with all parameters
                targetUrl = `/e-checksheet-smoke-detector?no=${encodeURIComponent(no)}&lokasi=${encodeURIComponent(lokasi)}&zona=${encodeURIComponent(zona)}`;
              } else if (openArea) {
                // Old format
                targetUrl = `/e-checksheet-smoke-detector?openArea=${encodeURIComponent(openArea)}`;
              }
            }
            break;
          }
          case "e-checksheet-tg-listrik": {
            const queryParams = new URLSearchParams(query || "");
            const areaName = queryParams.get("areaName");
            const lokasi = queryParams.get("lokasi");
            const openArea = queryParams.get("openArea"); // Old format
            
            if (areaName || openArea) {
              if (areaName && lokasi) {
                // New format with all parameters
                targetUrl = `/e-checksheet-tg-listrik?areaName=${encodeURIComponent(areaName)}&lokasi=${encodeURIComponent(lokasi)}`;
              } else if (openArea) {
                // Old format
                targetUrl = `/e-checksheet-tg-listrik?openArea=${encodeURIComponent(openArea)}`;
              }
            }
            break;
          }
          default:
            setError(`E-Checksheet "${checksheetType}" tidak dikenali.`);
            isScanningRef.current = true;
            return;
        }

        if (!targetUrl) {
          setError("Tidak dapat memproses URL QR code.");
          isScanningRef.current = true;
          return;
        }

        // ✅ Navigasi ke e-checksheet page
        router.push(targetUrl);
        return;
      }

      // OLD FORMAT: echo-checksheet://type/id?action=form|history (kept for backward compatibility)
      const parts = remaining.split("/");
      if (parts.length < 2) {
        setError("Format QR tidak lengkap.");
        isScanningRef.current = true;
        return;
      }

      const type = parts[0];
      const rest = parts.slice(1).join("/");
      const [id, oldQuery] = rest.split("?");

      if (!type || !id) {
        setError("Jenis atau ID tidak ditemukan.");
        isScanningRef.current = true;
        return;
      }

      const oldQueryParams = new URLSearchParams(oldQuery || "");
      const action = oldQueryParams.get("action") || "form";

      let targetUrl = "";

      switch (type) {
        case "fire-alarm":
          targetUrl = `/status-ga/fire-alarm/${encodeURIComponent(id)}`;
          break;
        case "apar":
          targetUrl = `/status-ga/inspeksi-apar/${encodeURIComponent(id)}`;
          break;
        case "toilet":
          targetUrl = `/status-ga/checksheet-toilet/${encodeURIComponent(id)}`;
          break;
        case "lift-barang":
          targetUrl = `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(id)}`;
          break;
        case "hydrant":
          targetUrl = `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(id)}`;
          break;
        default:
          setError(`Jenis checksheet "${type}" tidak dikenali.`);
          isScanningRef.current = true;
          return;
      }

      // ✅ Sekarang aman untuk navigasi
      router.push(targetUrl);
    } catch (err) {
      console.error("Error memproses QR:", err);
      setError("Terjadi kesalahan saat memproses QR code.");
      isScanningRef.current = true;
    }
  }, [router, forceStopCamera]);

  // ✅ Separate effect untuk scanner initialization (berjalan setelah auth valid)
  useEffect(() => {
    // Only initialize scanner if user is authenticated
    if (redirected || !user || user.role !== "inspector-ga") {
      return;
    }

    const initScanner = async () => {
      if (!scannerRef.current || isScanningRef.current) return;

      try {
        isScanningRef.current = true;
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        // Start scanner dengan kamera belakang
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => handleScanResult(decodedText.trim()),
          (err) => console.debug("QR decode error:", err)
        );
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setError("Tidak dapat mengakses kamera.");
        isScanningRef.current = false;
      }
    };

    initScanner();

    // Cleanup saat unmount atau dependency berubah
    return () => {
      forceStopCamera();
    };
  }, [redirected, user?.role, forceStopCamera, handleScanResult]);

  // ✅ Ubah handleCancel menjadi async
  const handleCancel = async () => {
    await forceStopCamera();
    router.back();
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-banner">
          <div className="header-title">
            <AlertTriangle size={28} color="#ffffff" />
            Scan QR Checksheet
          </div>
        </div>

        <div className="scan-container">
          {error ? (
            <div className="error-box">
              <p style={{ whiteSpace: "pre-line", textAlign: "center" }}>{error}</p>
              <button onClick={() => router.back()} className="btn-back-small">
                ← Kembali
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader" ref={scannerRef} className="qr-scanner" />
              <p className="scan-instruction">Arahkan kamera ke QR code</p>
              <button onClick={handleCancel} className="btn-cancel">
                <X size={18} /> Batal
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 24px 32px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scan-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .qr-scanner {
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
        }

        .scan-instruction {
          color: #475569;
          font-size: 1rem;
          text-align: center;
        }

        .btn-cancel,
        .btn-back-small {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-cancel:hover {
          background: #b91c1c;
        }

        .error-box {
          text-align: center;
          padding: 20px;
          background: #fee;
          border-radius: 12px;
          color: #c62828;
          max-width: 400px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}