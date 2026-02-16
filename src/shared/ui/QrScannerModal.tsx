// src/shared/ui/QrScannerModal.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

// Minimal typing for html5-qrcode instance
type Html5QrInstance = {
  start: (
    cameraConfig: { facingMode: "environment" } | string,
    config: { fps?: number; qrbox?: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
};

function extractContainerCode(raw: string): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  // If QR contains a URL
  try {
    const u = new URL(text);
    const m = u.pathname.match(/\/(containers|c)\/([^/?#]+)/i);
    return m?.[2] ? decodeURIComponent(m[2]) : null;
  } catch {
    // Not a URL
  }

  // If QR contains a path-like string (without scheme), e.g. /containers/ABC123
  const pathMatch = text.match(/\/(containers|c)\/([^/?#]+)/i);
  if (pathMatch?.[2]) return decodeURIComponent(pathMatch[2]);

  // Otherwise treat it as plain code
  return text;
}

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const router = useRouter();

  const scannerRootRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<Html5QrInstance | null>(null);

  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const navigateToCode = useCallback(
    (raw: string) => {
      const code = extractContainerCode(raw);
      if (!code) {
        toast.error("Не вдалося розпізнати код контейнера");
        return;
      }
      onClose();
      // IMPORTANT: mentor requirement says URL should be based on container CODE.
      // Keep route consistent with your app. If you also support /c/[code], you can route there.
      router.push(`/containers/${encodeURIComponent(code)}`);
      toast.success(`Перехід до контейнера ${code}`);
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!open) {
      // reset state when closing
      setScannerError(null);
      setShowManual(false);
      setManualCode("");
      setIsStarting(false);
      setHasScanned(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || showManual) return;

    let cancelled = false;

    async function initScanner() {
      if (!scannerRootRef.current) return;

      setIsStarting(true);
      setScannerError(null);
      setHasScanned(false);

      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;

        const { Html5Qrcode } = mod as unknown as {
          Html5Qrcode: new (elementId: string) => Html5QrInstance;
        };

        // Ensure we stop previous instance if any
        if (qrInstanceRef.current) {
          try {
            await qrInstanceRef.current.stop();
          } catch {}
          try {
            await qrInstanceRef.current.clear();
          } catch {}
          qrInstanceRef.current = null;
        }

        const instance = new Html5Qrcode("qr-reader");
        qrInstanceRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // prevent double fire
            if (hasScanned) return;
            setHasScanned(true);
            navigateToCode(decodedText);
          },
          () => {
            // ignore per-frame errors
          }
        );

        if (!cancelled) setScannerError(null);
      } catch {
        if (!cancelled) {
          setScannerError("Не вдалося запустити камеру. Введіть код вручну.");
          setShowManual(true);
        }
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    }

    initScanner();

    return () => {
      cancelled = true;
      const instance = qrInstanceRef.current;
      if (instance) {
        instance.stop().catch(() => {});
        instance.clear().catch(() => {});
        qrInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showManual, navigateToCode]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    navigateToCode(code);
    setManualCode("");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Сканувати QR"
    >
      <div className="relative w-full max-w-sm rounded-xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">Сканувати QR</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showManual ? (
          <>
            <div
              id="qr-reader"
              ref={scannerRootRef}
              className="overflow-hidden rounded-lg"
            />

            {isStarting && (
              <p className="mt-2 text-sm text-muted-foreground">
                Запуск камери...
              </p>
            )}

            {scannerError && (
              <p className="mt-2 text-sm text-destructive">{scannerError}</p>
            )}

            <button
              onClick={() => setShowManual(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              type="button"
            >
              <Keyboard className="h-4 w-4" />
              Ввести код вручну
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="Введіть код контейнера..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                type="button"
              >
                Перейти
              </button>
            </div>

            <button
              onClick={() => {
                setShowManual(false);
                setScannerError(null);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              type="button"
            >
              <Camera className="h-4 w-4" />
              Сканувати камерою
            </button>
          </>
        )}
      </div>
    </div>
  );
}
