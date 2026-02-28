"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Keyboard, RefreshCcw } from "lucide-react";
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
  ) => Promise<unknown>;
  stop: () => Promise<unknown>;
  clear: () => Promise<unknown>;
};

type Html5QrCamera = {
  id: string;
  label: string;
};

type Html5QrModule = {
  Html5Qrcode: {
    new (elementId: string): Html5QrInstance;
    getCameras?: () => Promise<Html5QrCamera[]>;
  };
};

const QR_READER_ID = "qr-reader";

function extractContainerCode(raw: string): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const match = url.pathname.match(/\/(containers|c)\/([^/?#]+)/i);
    return match?.[2] ? decodeURIComponent(match[2]) : null;
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
  const warmupStreamRef = useRef<MediaStream | null>(null);

  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);

  const stopWarmupStream = useCallback(() => {
    const stream = warmupStreamRef.current;
    if (!stream) return;

    stream.getTracks().forEach((track) => track.stop());
    warmupStreamRef.current = null;
  }, []);

  const stopScanner = useCallback(async () => {
    stopWarmupStream();

    const instance = qrInstanceRef.current;
    if (!instance) return;

    try {
      if (scannerStartedRef.current) {
        await instance.stop();
      }
    } catch {
      // ignore
    }

    try {
      await instance.clear();
    } catch {
      // ignore
    }

    scannerStartedRef.current = false;
    qrInstanceRef.current = null;

    if (scannerRootRef.current) {
      scannerRootRef.current.innerHTML = "";
    }
  }, [stopWarmupStream]);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobileUa = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobileUa || (hasTouch && window.innerWidth < 768));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToCode = useCallback(
    (raw: string) => {
      const parsedCode = extractContainerCode(raw);
      if (!parsedCode) {
        toast.error("Не вдалося розпізнати код контейнера");
        return;
      }

      onClose();
      router.push(`/containers/${encodeURIComponent(parsedCode)}`);
      toast.success(`Відкриваємо контейнер ${parsedCode}`);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) {
      setScannerError(null);
      setManualCode("");
      setShowManual(false);
      setIsStarting(false);
      setScanAttempt(0);
      hasScannedRef.current = false;
      void stopScanner();
      return;
    }

    setScannerError(null);
    setManualCode("");
    setIsStarting(false);
    hasScannedRef.current = false;

    if (!isMobile) {
      setShowManual(true);
      return;
    }

    setShowManual(false);
    setScanAttempt((value) => value + 1);
  }, [open, isMobile, stopScanner]);

  useEffect(() => {
    if (!open || showManual || !isMobile || scanAttempt === 0) return;

    let cancelled = false;

    async function initScanner() {
      if (!scannerRootRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Браузер не підтримує доступ до камери. Введіть код вручну.");
        return;
      }

      setIsStarting(true);
      setScannerError(null);
      hasScannedRef.current = false;

      try {
        await stopScanner();
        if (cancelled) return;

        const warmupStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        warmupStreamRef.current = warmupStream;

        const warmupTrack = warmupStream.getVideoTracks()[0];
        const preferredDeviceId = warmupTrack?.getSettings().deviceId;

        const mod = (await import("html5-qrcode")) as unknown as Html5QrModule;
        if (cancelled) return;

        const availableCameras = typeof mod.Html5Qrcode.getCameras === "function"
          ? await mod.Html5Qrcode.getCameras()
          : [];

        const preferredCamera =
          availableCameras.find((camera) => /back|rear|environment/i.test(camera.label)) ||
          availableCameras.find((camera) => camera.id === preferredDeviceId) ||
          availableCameras[0];

        stopWarmupStream();
        if (cancelled) return;

        scannerRootRef.current.innerHTML = "";

        const instance = new mod.Html5Qrcode(QR_READER_ID);
        qrInstanceRef.current = instance;

        const qrboxSize = isMobile ? 230 : 260;

        await instance.start(
          preferredCamera?.id ?? { facingMode: "environment" },
          { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            navigateToCode(decodedText);
          },
          () => {
            // ignore frame decode errors
          },
        );

        scannerStartedRef.current = true;

        if (!cancelled) {
          setScannerError(null);
        }
      } catch (error) {
        scannerStartedRef.current = false;

        if (!cancelled) {
          const message = error instanceof Error ? error.message.toLowerCase() : "";
          const blockedByPermissions =
            message.includes("permission") ||
            message.includes("denied") ||
            message.includes("notallowed") ||
            message.includes("not readable");

          setScannerError(
            blockedByPermissions
              ? "Не вдалося отримати доступ до камери. Надайте дозвіл у браузері та спробуйте ще раз."
              : "Камера не запустилась. Спробуйте ще раз або введіть код вручну.",
          );
        }
      } finally {
        stopWarmupStream();
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    }

    void initScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [isMobile, navigateToCode, open, scanAttempt, showManual, stopScanner, stopWarmupStream]);

  const handleManualSubmit = () => {
    const value = manualCode.trim();
    if (!value) return;
    navigateToCode(value);
    setManualCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="w-full max-w-sm p-4 sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{showManual ? "Введіть код" : "Скануйте QR-код"}</DialogTitle>
        </DialogHeader>

        {!showManual ? (
          <div className="space-y-4">
            <div className="qr-gradient-border animate-fade-in-scale">
              <div className="scanner-shell">
                <div id={QR_READER_ID} ref={scannerRootRef} className="scanner-surface" />
                <div className="scanner-frame pointer-events-none absolute inset-0">
                  <span className="scanner-corner left-5 top-5" />
                  <span className="scanner-corner right-5 top-5 rotate-90" />
                  <span className="scanner-corner bottom-5 left-5 -rotate-90" />
                  <span className="scanner-corner bottom-5 right-5 rotate-180" />
                </div>
              </div>
            </div>

            {isStarting ? (
              <p className="text-sm text-muted-foreground">Запускаємо камеру та запитуємо дозвіл...</p>
            ) : null}

            {scannerError ? <p className="text-sm text-destructive">{scannerError}</p> : null}

            <div className="flex flex-col gap-2">
              {scannerError ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setScanAttempt((value) => value + 1)}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Спробувати ще раз
                </Button>
              ) : null}

              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setShowManual(true)}>
                <Keyboard className="h-4 w-4" />
                Ввести код вручну
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <Input
                type="text"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleManualSubmit()}
                placeholder="Введіть код тари..."
                autoFocus
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} type="button">
                Відкрити
              </Button>
            </div>

            {isMobile ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2"
                onClick={() => {
                  setShowManual(false);
                  setScannerError(null);
                  setScanAttempt((value) => value + 1);
                }}
              >
                <Camera className="h-4 w-4" />
                Сканувати камерою
              </Button>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
