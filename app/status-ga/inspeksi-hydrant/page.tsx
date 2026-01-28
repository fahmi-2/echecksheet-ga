import { Suspense } from "react";
import { GaInspeksiHydrantContent } from "@/app/status-ga/inspeksi-hydrant/GaInspeksiHydrantContent";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "#f5f5f5",
            fontSize: "16px",
          }}
        >
          Loading Hydrant Dashboard...
        </div>
      }
    >
      <GaInspeksiHydrantContent />
    </Suspense>
  );
}
