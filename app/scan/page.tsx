// app/scan/page.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { 
  X, RefreshCw, CheckCircle, Loader2, ScanLine, Camera as CameraIcon 
} from "lucide-react";
import jsQR from "jsqr";

export default function ScanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // ─────────────────────────────────────────────────────────────
  // ✅ 1. STATE
  // ─────────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [isCameraReady, setIsCameraReady] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // ✅ 2. REFS
  // ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parseRef = useRef<((result: string) => Promise<void>) | null>(null);
  const processingRef = useRef(false); // 🔹 Prevent double processing

  // ─────────────────────────────────────────────────────────────
  // ✅ 3. CALLBACKS
  // ─────────────────────────────────────────────────────────────
  
  const checkUserRole = useCallback((role: string | undefined): boolean => {
    if (!role) return false;
    if (role.startsWith('inspector-ga') || role.includes('admin') || role.startsWith('group-leader') || role.startsWith('inspector-qa')) return true;
    return ['supervisor', 'manager-ga', 'admin-ga', 'super-admin'].includes(role);
  }, []);

  const addScanParam = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_scanned=true`;
  };

  const parseAndNavigate = useCallback(async (result: string) => {
    if (!result || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setScanStatus("scanning");
    
    try {
      console.log("🔍 Parsing QR result:", result);
      let text = result.trim();
      
      if (!text.startsWith("echecksheet://")) {
        setError("❌ QR tidak valid.\nHarus dimulai dengan: echecksheet://");
        setScanStatus("idle");
        setTimeout(() => setError(null), 5000);
        return;
      }

      let remaining = text.replace(/^echecksheet:\/\//, "");

      // FORMAT: status-ga/[type]/[params]
      if (remaining.startsWith("status-ga/")) {
        remaining = remaining.replace("status-ga/", "");
        const [firstPart, ...restParts] = remaining.split("/");
        const urlWithQuery = [firstPart, ...restParts].join("/");
        const [pathPart, query] = urlWithQuery.split("?");
        
        let targetUrl = "";
        const routeMap: Record<string, () => string> = {
          "fire-alarm": () => `/status-ga/fire-alarm/${encodeURIComponent(pathPart.replace("fire-alarm/", ""))}`,
          "inspeksi-hydrant": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openHydrant");
            return v ? `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(v)}` : "";
          },
          "inspeksi-apar": () => `/status-ga/inspeksi-apar/${encodeURIComponent(pathPart.replace("inspeksi-apar/", ""))}`,
          "checksheet-toilet": () => `/status-ga/checksheet-toilet/${encodeURIComponent(pathPart.replace("checksheet-toilet/", ""))}`,
          "lift-barang": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openLift");
            return v ? `/status-ga/lift-barang?openLift=${encodeURIComponent(v)}` : "";
          },
          "selang-hydrant": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openArea");
            return v ? `/status-ga/selang-hydrant?openArea=${encodeURIComponent(v)}` : "";
          },
          "smoke-detector": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openArea");
            return v ? `/status-ga/smoke-detector?openArea=${encodeURIComponent(v)}` : "";
          },
          "inspeksi-emergency": () => `/status-ga/inspeksi-emergency/${encodeURIComponent(pathPart.replace("inspeksi-emergency/", ""))}`,
          "exit-lamp-pintu-darurat": () => `/status-ga/exit-lamp-pintu-darurat/${encodeURIComponent(pathPart.replace("exit-lamp-pintu-darurat/", ""))}`,
          "panel": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openPanel");
            return v ? `/status-ga/panel?openPanel=${encodeURIComponent(v)}` : "";
          },
          "form-inspeksi-stop-kontak": () => `/status-ga/form-inspeksi-stop-kontak/${encodeURIComponent(pathPart.replace("form-inspeksi-stop-kontak/", ""))}`,
          "ga-inf-jalan": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("search");
            return v ? `/status-ga/ga-inf-jalan?search=${encodeURIComponent(v)}` : "";
          },
          "inspeksi-apd": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("areaId");
            return v ? `/status-ga/inspeksi-apd?areaId=${encodeURIComponent(v)}` : "";
          },
          "tg-listrik": () => {
            const p = new URLSearchParams(query || "");
            const v = p.get("openArea");
            return v ? `/status-ga/tg-listrik?openArea=${encodeURIComponent(v)}` : "";
          },
          "inspeksi-preventif-lift-barang": () => `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(pathPart.replace("inspeksi-preventif-lift-barang/", ""))}`,
        };

        const builder = routeMap[firstPart];
        if (builder) targetUrl = builder();

        if (!targetUrl) {
          setError(`⚠️ Jenis checksheet "${firstPart}" tidak dikenali.`);
          setScanStatus("idle");
          setTimeout(() => setError(null), 5000);
          return;
        }

        targetUrl = addScanParam(targetUrl);
        console.log("✅ Navigating to:", targetUrl);
        setSuccess("✅ QR berhasil diproses! Mengalihkan...");
        setScanStatus("success");
        setTimeout(() => router.push(targetUrl), 500);
        return;
      }

      // FORMAT: e-checksheet-*/...
      if (remaining.startsWith("e-checksheet-")) {
        const [pathPart, query] = remaining.split("?", 2);
        const [checksheetType] = pathPart.split("/");
        let targetUrl = "";
        const params = new URLSearchParams(query || "");

        const buildUrl = (base: string, primary: string, secondary: Record<string, string>) => {
          const pVal = params.get(primary) || params.get(primary.replace("open", ""));
          if (!pVal) return;
          const extra = Object.entries(secondary).every(([_, v]) => params.get(v) !== null);
          if (extra) {
            const queryParams = Object.entries(secondary).map(([k, v]) => {
              const val = params.get(v);
              return `${k}=${encodeURIComponent(val || "")}`;
            }).join("&");
            targetUrl = `${base}?${queryParams}`;
          } else {
            const key = primary.replace("open", "");
            targetUrl = `${base}?${key}=${encodeURIComponent(pVal)}`;
          }
        };

        switch (checksheetType) {
          case "e-checksheet-hydrant": 
            buildUrl("/e-checksheet-hydrant", "openHydrant", { no: "no", lokasi: "lokasi", zona: "zona", jenis: "jenisHydrant" }); 
            break;
          case "e-checksheet-inf-jalan": 
            buildUrl("/e-checksheet-inf-jalan", "search", { areaName: "areaName", kategori: "kategori", lokasi: "lokasi" }); 
            break;
          case "e-checksheet-ins-apd": 
            buildUrl("/e-checksheet-ins-apd", "areaId", { areaName: "areaName", areaType: "areaType" }); 
            break;
          case "e-checksheet-lift-barang": 
            buildUrl("/e-checksheet-lift-barang", "openLift", { liftName: "liftName", area: "area", lokasi: "lokasi" }); 
            break;
          case "e-checksheet-panel": 
            buildUrl("/e-checksheet-panel", "openPanel", { panelName: "panelName", area: "area", date: "date" }); 
            break;
          case "e-checksheet-slg-hydrant": 
            buildUrl("/e-checksheet-slg-hydrant", "openArea", { lokasi: "lokasi", zona: "zona", jenis: "jenisHydrant", pic: "pic" }); 
            break;
          case "e-checksheet-smoke-detector": 
            buildUrl("/e-checksheet-smoke-detector", "openArea", { no: "no", lokasi: "lokasi", zona: "zona" }); 
            break;
          case "e-checksheet-tg-listrik": 
            buildUrl("/e-checksheet-tg-listrik", "openArea", { areaName: "areaName", lokasi: "lokasi" }); 
            break;
          default: 
            setError(`⚠️ E-Checksheet "${checksheetType}" tidak dikenali.`); 
            setScanStatus("idle");
            setTimeout(() => setError(null), 5000); 
            return;
        }

        if (!targetUrl) {
          setError("⚠️ Tidak dapat memproses URL QR code.");
          setScanStatus("idle");
          setTimeout(() => setError(null), 5000);
          return;
        }

        targetUrl = addScanParam(targetUrl);
        console.log("✅ Navigating to:", targetUrl);
        setSuccess("✅ QR berhasil diproses! Mengalihkan...");
        setScanStatus("success");
        setTimeout(() => router.push(targetUrl), 500);
        return;
      }

      // FORMAT LEGACY
      const parts = remaining.split("/");
      if (parts.length < 2) {
        setError("⚠️ Format QR tidak lengkap.");
        setScanStatus("idle");
        setTimeout(() => setError(null), 5000);
        return;
      }
      const type = parts[0];
      const rest = parts.slice(1).join("/");
      const [id] = rest.split("?");
      if (!type || !id) {
        setError("⚠️ Jenis atau ID tidak ditemukan.");
        setScanStatus("idle");
        setTimeout(() => setError(null), 5000);
        return;
      }

      let targetUrl = "";
      const legacyMap: Record<string, string> = {
        "fire-alarm": `/status-ga/fire-alarm/${encodeURIComponent(id)}`,
        "apar": `/status-ga/inspeksi-apar/${encodeURIComponent(id)}`,
        "toilet": `/status-ga/checksheet-toilet/${encodeURIComponent(id)}`,
        "lift-barang": `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(id)}`,
        "hydrant": `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(id)}`,
      };

      targetUrl = legacyMap[type];
      if (!targetUrl) {
        setError(`⚠️ Jenis checksheet "${type}" tidak dikenali.`);
        setScanStatus("idle");
        setTimeout(() => setError(null), 5000);
        return;
      }

      targetUrl = addScanParam(targetUrl);
      console.log("✅ Navigating to:", targetUrl);
      setSuccess("✅ QR berhasil diproses! Mengalihkan...");
      setScanStatus("success");
      setTimeout(() => router.push(targetUrl), 500);

    } catch (err) {
      console.error("❌ Error memproses QR:", err);
      setError("⚠️ Terjadi kesalahan saat memproses QR code.");
      setScanStatus("idle");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
      // Reset processingRef after short delay to allow next scan
      setTimeout(() => { processingRef.current = false; }, 300);
    }
  }, [router]);

  useEffect(() => { parseRef.current = parseAndNavigate; }, [parseAndNavigate]);

  // 🔹 FIX: Handle EXIF Orientation & Decode QR with Multiple Attempts
  const decodeQRFromImage = (img: HTMLImageElement, canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 🔹 Coba decode dengan orientasi normal dulu
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);
    
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    
    if (code?.data) {
      console.log("✅ QR detected (normal orientation)");
      return code.data;
    }

    // 🔹 Jika gagal, coba dengan rotasi 90° (EXIF orientation issue)
    console.log("🔄 Trying rotated orientation...");
    canvas.width = img.naturalHeight || img.height;
    canvas.height = img.naturalWidth || img.width;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);
    ctx.restore();
    
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    
    if (code?.data) {
      console.log("✅ QR detected (rotated 90°)");
      return code.data;
    }

    // 🔹 Coba rotasi 180°
    console.log("🔄 Trying 180° rotation...");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(180 * Math.PI / 180);
    ctx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);
    ctx.restore();
    
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    
    if (code?.data) {
      console.log("✅ QR detected (rotated 180°)");
      return code.data;
    }

    // 🔹 Coba rotasi 270°
    console.log("🔄 Trying 270° rotation...");
    canvas.width = img.naturalHeight || img.height;
    canvas.height = img.naturalWidth || img.width;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(270 * Math.PI / 180);
    ctx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);
    ctx.restore();
    
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    
    if (code?.data) {
      console.log("✅ QR detected (rotated 270°)");
      return code.data;
    }

    console.log("❌ QR not detected in any orientation");
    return null;
  };

  // 🔹 TRIGGER NATIVE CAMERA - Reset input FIRST to allow re-selection
  const triggerNativeCamera = useCallback(() => {
    if (isProcessing || processingRef.current) return;
    
    // 🔹 FIX: Reset input value BEFORE clicking to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Small delay to ensure reset takes effect
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  }, [isProcessing]);

  // 🔹 HANDLE IMAGE CAPTURE & DECODE QR - FIX: No preview state, proper EXIF handling
  const handleImageCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("⚠️ No file selected");
      return;
    }

    // 🔹 FIX: Use ref to prevent double processing
    if (processingRef.current) {
      console.log("⚠️ Already processing, skipping");
      e.target.value = "";
      return;
    }
    
    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setScanStatus("scanning");

    let imageUrl: string | null = null;
    
    try {
      console.log("📸 Processing file:", file.name, file.type, file.size);
      
      // Create object URL for image loading
      imageUrl = URL.createObjectURL(file);

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("✅ Image loaded:", img.width, "x", img.height, "natural:", img.naturalWidth, "x", img.naturalHeight);
          resolve();
        };
        img.onerror = (err) => {
          console.error("❌ Image load error:", err);
          reject(err);
        };
        img.src = imageUrl!;
      });

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      // 🔹 FIX: Try multiple orientations for EXIF handling
      const qrData = decodeQRFromImage(img, canvas);
      
      if (qrData) {
        console.log("🔍 QR Data:", qrData.substring(0, 100) + (qrData.length > 100 ? "..." : ""));
        await parseRef.current?.(qrData);
      } else {
        console.log("❌ Failed to decode QR from image");
        setError("❌ QR code tidak terdeteksi.\n\n💡 Tips:\n• Pastikan QR jelas & tidak blur\n• Pencahayaan cukup\n• Arahkan kamera tegak lurus\n• Jarak 15-30cm dari QR");
        setScanStatus("idle");
        setTimeout(() => {
          setError(null);
          // Auto-retry: trigger camera again for convenience
          if (!processingRef.current) triggerNativeCamera();
        }, 6000);
      }
      
    } catch (err) {
      console.error("❌ Error in handleImageCapture:", err);
      setError("⚠️ Gagal memproses gambar.\nSilakan coba lagi.");
      setScanStatus("idle");
      setTimeout(() => setError(null), 4000);
    } finally {
      // 🔹 FIX: Proper cleanup
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      // Reset input to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Reset processing flag after short delay
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 200);
    }
  }, [triggerNativeCamera]);

  // 🔹 RETRY LOGIC
  const handleRetry = useCallback(() => {
    setError(null);
    setSuccess(null);
    setScanStatus("idle");
    processingRef.current = false;
    setIsProcessing(false);
    // Auto trigger camera for seamless retry
    setTimeout(() => triggerNativeCamera(), 100);
  }, [triggerNativeCamera]);

  // ─────────────────────────────────────────────────────────────
  // ✅ 4. EFFECTS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login-page"); return; }
    if (!checkUserRole(user.role)) { router.replace("/home"); return; }
  }, [authLoading, user, router, checkUserRole]);

  // Auto-trigger camera on mount (after auth check)
  useEffect(() => {
    if (!authLoading && user && checkUserRole(user.role) && !success && !error && !isCameraReady) {
      setIsCameraReady(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => triggerNativeCamera(), 400);
    }
  }, [authLoading, user, success, error, isCameraReady, triggerNativeCamera, checkUserRole]);

  const handleCancel = () => router.back();

  // ─────────────────────────────────────────────────────────────
  // ✅ 5. EARLY RETURNS
  // ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} color="#1976d2" />
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }
  if (!user || !checkUserRole(user.role)) return null;

  // ─────────────────────────────────────────────────────────────
  // ✅ 6. RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-page">
      <Sidebar userName={user?.fullName || "User"} />
      
      {/* Hidden canvas for QR decoding */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Native Camera Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
        disabled={isProcessing}
      />

      <div className="page-content">
        <div className="header-banner">
          <div className="header-title">
            <ScanLine size={28} color="#ffffff" />
            Scan QR Checksheet
          </div>
          <p className="header-subtitle">📱 Kamera native • Bekerja di HTTP & HTTPS</p>
        </div>

        <div className="scan-container">
          {/* ✅ Success State */}
          {success && (
            <div className="success-box">
              <CheckCircle size={48} color="#22c55e" />
              <p>{success}</p>
              <button onClick={handleRetry} className="btn-retry">
                <RefreshCw size={16} /> Scan Lagi
              </button>
            </div>
          )}

          {/* ❌ Error State */}
          {error && !success && (
            <div className="error-box">
              <p style={{ whiteSpace: "pre-line", textAlign: "center" }}>{error}</p>
              <div className="error-actions">
                <button onClick={handleRetry} className="btn-retry">
                  <RefreshCw size={16} /> Scan Ulang
                </button>
                <button onClick={handleCancel} className="btn-cancel">
                  <X size={16} /> Kembali
                </button>
              </div>
            </div>
          )}

          {/* 🔄 Processing State */}
          {isProcessing && !success && !error && (
            <div className="processing-box">
              <Loader2 className="animate-spin mx-auto" size={48} color="#1976d2" />
              <p className="processing-text">🔍 Mendeteksi QR code...</p>
              <p className="processing-hint">Pastikan QR terlihat jelas di kamera</p>
            </div>
          )}

          {/* 📷 Initial State */}
          {!success && !error && !isProcessing && (
            <div className="camera-prompt-box">
              <div className="camera-icon-large">
                <CameraIcon size={64} color="#1976d2" />
              </div>
              <p className="prompt-title">📸 Siapkan Kamera</p>
              <p className="prompt-desc">
                Arahkan ke QR code dan ambil foto.<br/>
                Sistem akan otomatis memproses.
              </p>
              
              <button 
                onClick={triggerNativeCamera} 
                className="btn-scan-now"
                disabled={isProcessing}
              >
                <CameraIcon size={18} /> Ambil Foto QR
              </button>
              
              <p className="prompt-hint">
                💡 Tips: QR jelas • Pencahayaan cukup • Jarak 15-30cm
              </p>
            </div>
          )}

          {/* 🔙 Cancel Button */}
          {!success && (
            <div className="scan-actions">
              <button onClick={handleCancel} className="btn-cancel" disabled={isProcessing}>
                <X size={18} /> Kembali
              </button>
            </div>
          )}
        </div>

        {/* ℹ️ Info Box */}
        <div className="info-box">
          <p className="info-title">✅ Kompatibel HTTP/HTTPS</p>
          <p className="info-desc">
            Menggunakan kamera native perangkat. Tidak memerlukan HTTPS.
          </p>
        </div>
      </div>

      <style jsx>{`
        .app-page { display: flex; min-height: 100vh; background-color: #f7f9fc; }
        .page-content { flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; }
        .hidden { display: none !important; }
        
        .header-banner { 
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); 
          color: white; 
          padding: 24px 32px; 
          border-radius: 16px; 
          margin-bottom: 24px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
        }
        .header-title { 
          font-size: 1.8rem; 
          font-weight: 700; 
          margin: 0; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        .header-subtitle { 
          margin: 8px 0 0; 
          font-size: 0.95rem; 
          opacity: 0.9; 
        }
        
        .scan-container { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 20px; 
        }
        
        .success-box, .error-box, .processing-box, .camera-prompt-box { 
          text-align: center; 
          padding: 24px; 
          background: white; 
          border-radius: 12px; 
          max-width: 400px; 
          width: 100%; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .success-box { border: 2px solid #bbf7d0; }
        .error-box { border: 2px solid #fecaca; }
        .processing-box { border: 2px solid #bfdbfe; }
        .camera-prompt-box { border: 2px dashed #bfdbfe; }
        
        .success-box p { color: #166534; margin: 8px 0 16px; font-weight: 500; }
        .error-box p { color: #c62828; margin: 8px 0 16px; }
        .processing-text { font-weight: 600; color: #1e40af; margin: 12px 0 4px; }
        .processing-hint { color: #64748b; font-size: 0.9rem; }
        
        .camera-icon-large { margin-bottom: 16px; }
        .prompt-title { font-weight: 700; color: #1e40af; font-size: 1.2rem; margin-bottom: 8px; }
        .prompt-desc { color: #475569; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.4; }
        
        .btn-scan-now { 
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); 
          color: white; 
          border: none; 
          padding: 14px 28px; 
          border-radius: 12px; 
          cursor: pointer; 
          font-weight: 600; 
          font-size: 1rem; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          margin: 0 auto 16px;
          transition: all 0.2s ease;
          min-height: 48px;
          width: 100%;
          max-width: 320px;
        }
        .btn-scan-now:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(25,118,210,0.3); }
        .btn-scan-now:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .prompt-hint { font-size: 0.85rem; color: #64748b; font-style: italic; }
        
        .info-box { 
          background: #f0f9ff; 
          border: 1px solid #7dd3fc; 
          border-radius: 12px; 
          padding: 16px 20px; 
          max-width: 700px; 
          width: 100%; 
          text-align: center;
          margin-top: 8px;
        }
        .info-title { font-weight: 600; color: #0369a1; margin-bottom: 4px; font-size: 0.95rem; }
        .info-desc { color: #075985; font-size: 0.9rem; margin: 0; line-height: 1.4; }
        
        .scan-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; width: 100%; max-width: 400px; }
        .btn-cancel, .btn-retry { 
          background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; 
          cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; 
          min-height: 44px; transition: all 0.3s ease; font-size: 0.95rem;
        }
        .btn-retry { background: #1976d2; }
        .btn-cancel:hover { background: #b91c1c; }
        .btn-retry:hover { background: #1565c0; }
        .btn-cancel:disabled, .btn-retry:disabled { opacity: 0.6; cursor: not-allowed; }
        
        @media (max-width: 768px) {
          .page-content { padding: 16px 12px; margin-left: 0; }
          .header-banner { padding: 16px 20px; margin-bottom: 16px; border-radius: 12px; }
          .header-title { font-size: 1.4rem; gap: 8px; }
          .btn-cancel, .btn-retry, .btn-scan-now { width: 100%; justify-content: center; }
        }
        @media (hover: none) and (pointer: coarse) {
          button { min-height: 48px !important; font-size: 1rem !important; }
        }
      `}</style>
    </div>
  );
}