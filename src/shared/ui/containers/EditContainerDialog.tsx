// src/shared/ui/containers/EditContainerDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContainerDto, ContainerTypeDto, UpdateContainerDto } from "@/shared/types";
import { updateContainer } from "@/shared/api/containers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { normalizeUnit } from "@/shared/constants/units";
import { showErrorToast } from "@/shared/utils/errors";

interface EditContainerDialogProps {
  container: ContainerDto;
  containerTypes: ContainerTypeDto[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormState = {
  name: string;
  volume: string;
  unit: string;
  containerTypeId: string;
  meta: string;
};

function toStr(v: unknown) {
  return v == null ? "" : String(v);
}

export function EditContainerDialog({
  container,
  containerTypes,
  open,
  onClose,
  onSuccess,
}: EditContainerDialogProps) {
  const [saving, setSaving] = useState(false);

  const initialForm: FormState = useMemo(
    () => ({
      name: container.name ?? "",
      volume: Number.isFinite(container.volume) ? String(container.volume) : "",
      unit: normalizeUnit(container.unit),
      containerTypeId: container.containerTypeId != null ? String(container.containerTypeId) : "",
      meta: container.meta ?? "",
    }),
    [container]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  const selectedContainerTypeName = useMemo(() => {
    const typeId = Number(form.containerTypeId);
    if (!Number.isFinite(typeId)) return "-";
    return containerTypes.find((type) => type.id === typeId)?.name ?? "-";
  }, [containerTypes, form.containerTypeId]);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setSaving(false);
  }, [open, initialForm]);

  const buildDto = (): UpdateContainerDto | null => {
    const name = form.name.trim();
    const unit = normalizeUnit(form.unit);
    const meta = form.meta.trim();

    const volumeNum = form.volume.trim() ? Number(form.volume) : Number.NaN;
    const typeIdNum = form.containerTypeId ? Number(form.containerTypeId) : Number.NaN;

    if (!name) {
      toast.error("Вкажіть назву тари");
      return null;
    }
    if (!Number.isFinite(volumeNum) || volumeNum <= 0) {
      toast.error("Об'єм має бути більше 0");
      return null;
    }
    if (!Number.isFinite(typeIdNum)) {
      toast.error("Оберіть тип тари");
      return null;
    }

    const dto: UpdateContainerDto = {
      name,
      volume: volumeNum,
      unit,
      containerTypeId: typeIdNum,
      meta: meta ? meta : null,
    };

    return dto;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto = buildDto();
    if (!dto) return;

    setSaving(true);
    try {
      await updateContainer(container.id, dto);
      toast.success("Тару оновлено");
      onSuccess();
      onClose();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити тару");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Редагувати тару {toStr(container.code)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="volume">Об’єм *</Label>
              <Input
                id="volume"
                type="number"
                inputMode="decimal"
                step="any"
                min={0.001}
                value={form.volume}
                onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Одиниця *</Label>
              <Input
                id="unit"
                value={form.unit || "-"}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="containerTypeId">Тип тари</Label>
            <Input
              id="containerTypeId"
              value={selectedContainerTypeName}
              readOnly
              className="bg-muted text-muted-foreground"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Одиниця та тип тари фіксуються після створення, щоб зберегти коректну історію заповнень.
          </p>

          <div className="space-y-2">
            <Label htmlFor="meta">Примітки</Label>
            <Textarea
              id="meta"
              value={form.meta}
              onChange={(e) => setForm((p) => ({ ...p, meta: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Скасувати
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
