// src/shared/ui/containers/TransferOwnershipDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContainerDto } from "@/shared/types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// IMPORTANT:
// У вашому поточному OpenAPI/types немає поля owner у ContainerDto,
// і немає endpoint'а transferOwnership у src/shared/api/containers.ts.
// Тому робимо компонент "готовий", але виклик API винесений в пропс onTransfer.
//
// Далі ви або:
// 1) Додаєте endpoint у бек і в api/containers.ts (POST /containers/{id}/transfer?email=... або body)
// 2) Або видаляєте фічу, якщо її немає в ТЗ.

interface TransferOwnershipDialogProps {
  container: ContainerDto;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;

  // callback that performs actual transfer request
  onTransfer: (containerId: number, email: string) => Promise<void>;

  // optional: show current owner email if you have it from somewhere else
  currentOwnerEmail?: string | null;
}

function isValidEmail(v: string) {
  // проста перевірка
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function TransferOwnershipDialog({
  container,
  open,
  onClose,
  onSuccess,
  onTransfer,
  currentOwnerEmail,
}: TransferOwnershipDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const containerLabel = useMemo(() => container.code ?? String(container.id), [container.code, container.id]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setLoading(false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const v = email.trim();
    if (!v) {
      toast.error("Вкажіть email нового власника");
      return;
    }
    if (!isValidEmail(v)) {
      toast.error("Некоректний email");
      return;
    }

    setLoading(true);
    try {
      await onTransfer(container.id, v);
      toast.success(`Власника для ${containerLabel} змінено на ${v}`);
      onSuccess();
      onClose();
      setEmail("");
    } catch {
      toast.error("Не вдалося змінити власника");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Передати тару іншому користувачу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email нового власника</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="email"
              required
            />
            {currentOwnerEmail ? (
              <p className="text-xs text-muted-foreground">Поточний власник: {currentOwnerEmail}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setEmail("");
              }}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Передаємо..." : "Передати"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
