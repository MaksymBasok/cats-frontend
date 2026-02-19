// src/shared/ui/containers/CreateContainerDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { normalizeUnit } from "@/shared/constants/units";
import { createContainer } from "@/shared/api/containers";
import type { ContainerTypeDto, CreateContainerDto } from "@/shared/types";
import { showErrorToast } from "@/shared/utils/errors";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateContainerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  containerTypes: ContainerTypeDto[];
}

type FormState = {
  code: string;
  name: string;
  volume: string;
  unit: string;
  containerTypeId: string;
  meta: string;
};

const initialForm: FormState = {
  code: "",
  name: "",
  volume: "",
  unit: normalizeUnit("л"),
  containerTypeId: "",
  meta: "",
};

export function CreateContainerDialog({
  open,
  onClose,
  onCreated,
  containerTypes,
}: CreateContainerDialogProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  const defaultUnitByTypeId = useMemo(() => {
    const map = new Map<number, string>();
    for (const ct of containerTypes) {
      if (ct.id != null && ct.defaultUnit) map.set(ct.id, ct.defaultUnit);
    }
    return map;
  }, [containerTypes]);

  const selectedTypeUnit = useMemo(() => {
    const typeId = Number(form.containerTypeId);
    if (!Number.isFinite(typeId)) return "";
    const foundUnit = defaultUnitByTypeId.get(typeId);
    return foundUnit ? normalizeUnit(foundUnit) : "";
  }, [defaultUnitByTypeId, form.containerTypeId]);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setSaving(false);
  }, [open]);

  const submitDto = (): CreateContainerDto | null => {
    const name = form.name.trim();
    const code = form.code.trim();
    const meta = form.meta.trim();

    const containerTypeIdNum = form.containerTypeId ? Number(form.containerTypeId) : Number.NaN;
    const volumeNum = form.volume.trim() ? Number(form.volume) : Number.NaN;

    if (!name) {
      toast.error("Вкажіть назву тари");
      return null;
    }
    if (!Number.isFinite(containerTypeIdNum)) {
      toast.error("Оберіть тип тари");
      return null;
    }
    if (!Number.isFinite(volumeNum) || volumeNum <= 0) {
      toast.error("Об'єм має бути більше 0");
      return null;
    }

    return {
      ...(code ? { code } : {}),
      name,
      volume: volumeNum,
      unit: selectedTypeUnit || normalizeUnit(form.unit),
      containerTypeId: containerTypeIdNum,
      meta: meta ? meta : null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto = submitDto();
    if (!dto) return;

    setSaving(true);
    try {
      await createContainer(dto);
      toast.success("Тару створено");
      onCreated();
      onClose();
      setForm(initialForm);
    } catch (error) {
      showErrorToast(error, "Не вдалося створити тару");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Нова тара</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-code">Код (необов’язково)</Label>
            <Input
              id="create-code"
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="Автоматично"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-name">Назва *</Label>
            <Input
              id="create-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="create-volume">Об’єм *</Label>
              <Input
                id="create-volume"
                type="number"
                value={form.volume}
                onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                required
                min={0.001}
                step="any"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-unit">Одиниця *</Label>
              <Input id="create-unit" value={selectedTypeUnit || "-"} readOnly className="bg-muted text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-container-type">Тип тари *</Label>
            <Select
              value={form.containerTypeId || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  setForm((p) => ({ ...p, containerTypeId: "" }));
                  return;
                }

                const idNum = Number(value);
                const suggestedUnit = Number.isFinite(idNum) ? defaultUnitByTypeId.get(idNum) : undefined;

                setForm((p) => ({
                  ...p,
                  containerTypeId: value,
                  unit: suggestedUnit ? normalizeUnit(suggestedUnit) : p.unit,
                }));
              }}
            >
              <SelectTrigger id="create-container-type">
                <SelectValue placeholder="Оберіть тип..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Оберіть тип...</SelectItem>
                {containerTypes.map((ct) => (
                  <SelectItem key={ct.id} value={String(ct.id)}>
                    {ct.name ?? "-"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            Одиниця підтягується з типу тари та не редагується вручну.
          </p>

          <div className="space-y-2">
            <Label htmlFor="create-meta">Примітки</Label>
            <Textarea
              id="create-meta"
              value={form.meta}
              onChange={(e) => setForm((p) => ({ ...p, meta: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Скасувати
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Створення..." : "Створити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
