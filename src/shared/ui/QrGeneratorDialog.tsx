// src/shared/ui/QrGeneratorDialog.tsx
"use client";

import { useRef } from "react";
import NextImage from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/ThemeProvider";

interface QrGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

const QR_LOGO_SRC = "/images/cats-logo.png";
const QR_SIZE = 256;
const LOGO_SIZE = 60;
const LOGO_BADGE_PADDING = 8;

export function QrGeneratorDialog({ open, onClose, url, title }: QrGeneratorDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const qrBackground = theme === "dark" ? "#0b1220" : "#ffffff";
  const qrForeground = theme === "dark" ? "#f8fafc" : "#0f172a";
  const logoBadgeBackground = theme === "dark" ? "#111827" : "#ffffff";
  const logoBadgeBorder = theme === "dark" ? "#334155" : "#cbd5e1";

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Посилання скопійовано");
    } catch {
      toast.error("Не вдалося скопіювати посилання");
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(svgBlob);

      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = qrBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const badgeRadius = LOGO_SIZE / 2 + LOGO_BADGE_PADDING;

        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = logoBadgeBackground;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = logoBadgeBorder;
        ctx.stroke();

        const logoImg = new window.Image();
        logoImg.onload = () => {
          const logoX = centerX - LOGO_SIZE / 2;
          const logoY = centerY - LOGO_SIZE / 2;
          ctx.drawImage(logoImg, logoX, logoY, LOGO_SIZE, LOGO_SIZE);

          canvas.toBlob((blob) => {
            if (!blob) return;
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `${title || "qr-code"}.png`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            toast.success("QR-код завантажено");
          });
        };
        logoImg.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          toast.error("Не вдалося додати логотип до QR-коду");
        };
        logoImg.src = QR_LOGO_SRC;

        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch {
      toast.error("Не вдалося завантажити QR-код");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR-код {title && `- ${title}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col items-center gap-4">
            <div className="qr-gradient-border animate-fade-in-scale">
              <div
                ref={qrRef}
                className="flex items-center justify-center rounded-[calc(1rem-3px)] p-4"
                style={{ backgroundColor: qrBackground }}
              >
                <div className="relative inline-flex">
                  <QRCodeSVG
                    value={url}
                    size={QR_SIZE}
                    level="H"
                    includeMargin
                    bgColor={qrBackground}
                    fgColor={qrForeground}
                  />
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: logoBadgeBackground,
                      borderColor: logoBadgeBorder,
                    }}
                  >
                    <NextImage src={QR_LOGO_SRC} alt="CATS" width={60} height={60} className="object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 py-2">
              <QrCode className="h-4 w-4 text-primary" />
              <span className="gradient-text text-sm font-bold tracking-wider">{title || "QR"}</span>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="rounded-2xl bg-muted/70 p-3">
            <p className="break-all text-sm text-muted-foreground">{url}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleCopyUrl} variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Копіювати посилання
            </Button>
            <Button onClick={handleDownloadQR} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Завантажити QR-код
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
