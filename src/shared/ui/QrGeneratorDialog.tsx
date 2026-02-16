// src/shared/ui/QrGeneratorDialog.tsx
"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";

interface QrGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function QrGeneratorDialog({ open, onClose, url, title }: QrGeneratorDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);

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
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `${title || "qr-code"}.png`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
          toast.success("QR код завантажено");
        });

        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch {
      toast.error("Не вдалося завантажити QR код");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR код {title && `- ${title}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center rounded-lg bg-white p-6" ref={qrRef}>
            <QRCodeSVG value={url} size={256} level="H" includeMargin />
          </div>

          {/* URL Display */}
          <div className="rounded-lg bg-muted p-3">
            <p className="break-all text-sm text-muted-foreground">{url}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleCopyUrl} variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Копіювати посилання
            </Button>
            <Button onClick={handleDownloadQR} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Завантажити QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
