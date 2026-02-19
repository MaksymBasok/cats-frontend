// src/shared/ui/QrScannerModal.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

type Html5QrInstance = {
  start: (
    cameraConfig: { facingMode: "environment" } | string,
    config: { fps?: number; qrbox?: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
};

function extractContainerCode(raw: string): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  try {
    const u = new URL(text);
    const m = u.pathname.match(/\/(containers|c)\/([^/?#]+)/i);
    return m?.[2] ? decodeURIComponent(m[2]) : null;
  } catch {
    // ignore
  }

  const pathMatch = text.match(/\/(containers|c)\/([^/?#]+)/i);
  if (pathMatch?.[2]) return decodeURIComponent(pathMatch[2]);

  return text;
}

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const router = useRouter();

  const scannerRootRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<Html5QrInstance | null>(null);
  const scannerStartedRef = useRef(false);
  const hasScannedRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase(),
      );
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || (hasTouch && window.innerWidth < 768));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToCode = useCallback(
    (raw: string) => {
      const code = extractContainerCode(raw);
      if (!code) {
        toast.error("Не вдалося розпізнати код контейнера");
        return;
      }

      onClose();
      router.push(`/containers/${encodeURIComponent(code)}`);
      toast.success(`Відкриваємо контейнер ${code}`);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) {
      setScannerError(null);
      setShowManual(false);
      setManualCode("");
      setIsStarting(false);
      hasScannedRef.current = false;
      return;
    }

    if (!isMobile) {
      setShowManual(true);
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || showManual) return;

    let cancelled = false;

    async function initScanner() {
      if (!scannerRootRef.current) return;

      setIsStarting(true);
      setScannerError(null);
      hasScannedRef.current = false;

      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;

        const { Html5Qrcode } = mod as unknown as {
          Html5Qrcode: new (elementId: string) => Html5QrInstance;
        };

        if (qrInstanceRef.current) {
          try {
            if (scannerStartedRef.current) {
              await qrInstanceRef.current.stop();
            }
          } catch {
            // ignore
          }

          try {
            await qrInstanceRef.current.clear();
          } catch {
            // ignore
          }

          scannerStartedRef.current = false;
          qrInstanceRef.current = null;
        }

        const instance = new Html5Qrcode("qr-reader");
        qrInstanceRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            navigateToCode(decodedText);
          },
          () => {
            // ignore frame errors
          },
        );

        scannerStartedRef.current = true;

        if (!cancelled) setScannerError(null);
      } catch (error) {
        scannerStartedRef.current = false;
        if (!cancelled) {
          const message = error instanceof Error ? error.message.toLowerCase() : "";
          const blockedByPermissions =
            message.includes("permission") || message.includes("denied") || message.includes("notallowed");

          setScannerError(
            blockedByPermissions
              ? "Доступ до камери заборонено. Надайте дозвіл або введіть код вручну."
              : "Не вдалося запустити камеру. Введіть код вручну.",
          );
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
        const stopPromise = scannerStartedRef.current ? instance.stop() : Promise.resolve();

        stopPromise
          .catch(() => {
            // ignore
          })
          .then(() => instance.clear())
          .catch(() => {
            // ignore
          })
          .finally(() => {
            scannerStartedRef.current = false;
            qrInstanceRef.current = null;
          });
      }
    };
  }, [open, showManual, navigateToCode]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    navigateToCode(code);
    setManualCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="w-full max-w-sm p-4 sm:max-w-sm">
        <DialogHeader className="pr-8">
          <DialogTitle>{showManual ? "Введіть код" : "Скануйте QR-код"}</DialogTitle>
        </DialogHeader>

        {!showManual ? (
          <>
            <div id="qr-reader" ref={scannerRootRef} className="overflow-hidden rounded-lg" />

            {isStarting && <p className="mt-2 text-sm text-muted-foreground">Запускаємо камеру...</p>}

            {scannerError && <p className="mt-2 text-sm text-destructive">{scannerError}</p>}

            {isMobile && (
              <Button type="button" variant="outline" className="mt-3 w-full gap-2" onClick={() => setShowManual(true)}>
                <Keyboard className="h-4 w-4" />
                Ввести код вручну
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="Введіть код тари..."
                autoFocus
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} type="button">
                Відкрити
              </Button>
            </div>

            {isMobile && (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2"
                onClick={() => {
                  setShowManual(false);
                  setScannerError(null);
                }}
              >
                <Camera className="h-4 w-4" />
                Сканувати камерою
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
