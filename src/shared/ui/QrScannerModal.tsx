"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const handleScan = useCallback(
    (code: string) => {
      onClose();
      // Check if it's a URL with container code
      const urlMatch = code.match(/\/containers\/([^/?#]+)/);
      const containerCode = urlMatch ? urlMatch[1] : code.trim();
      if (containerCode) {
        router.push(`/containers/${containerCode}`);
        toast.success(`Перехід до контейнера ${containerCode}`);
      }
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!open || showManual) return;

    let scanner: { clear: () => Promise<void>; stop: () => Promise<void>; start: (config: unknown, opts: unknown, onSuccess: (text: string) => void, onError: () => void) => Promise<void> } | null = null;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!scannerRef.current) return;

        scanner = new Html5Qrcode("qr-reader") as unknown as typeof scanner;
        html5QrCodeRef.current = scanner;

        await scanner!.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => handleScan(decodedText),
          () => {}
        );
        setScannerError(null);
      } catch {
        setScannerError("Не вдалося запустити камеру. Введіть код вручну.");
        setShowManual(true);
      }
    }

    initScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [open, showManual, handleScan]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode("");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            Сканувати QR
          </h2>
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
              ref={scannerRef}
              className="overflow-hidden rounded-lg"
            />
            {scannerError && (
              <p className="mt-2 text-sm text-destructive">{scannerError}</p>
            )}
            <button
              onClick={() => setShowManual(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
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
                className="w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
