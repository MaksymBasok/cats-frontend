// src/shared/ui/containers/CreateContainerDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ContainerTypeDto, CreateContainerDto } from "@/shared/types";
import { createContainer } from "@/shared/api/containers";
import { toast } from "sonner";

interface CreateContainerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  containerTypes: ContainerTypeDto[];
}

type FormState = {
  code: string;
  name: string;
  volume: string; // keep as string to avoid NaN during typing
  unit: string;
  containerTypeId: string; // select value
  meta: string;
};

const initialForm: FormState = {
  code: "",
  name: "",
  volume: "",
  unit: "л",
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

  useEffect(() => {
    if (!open) return;
    // reset when opening
    setForm(initialForm);
    setSaving(false);
  }, [open]);

  const submitDto = (): CreateContainerDto | null => {
    const name = form.name.trim();
    const code = form.code.trim();
    const meta = form.meta.trim();

    const containerTypeIdNum = form.containerTypeId ? Number(form.containerTypeId) : NaN;
    const volumeNum = form.volume.trim() ? Number(form.volume) : NaN;

    if (!name) {
      toast.error("Вкажіть назву");
      return null;
    }
    if (!Number.isFinite(containerTypeIdNum)) {
      toast.error("Оберіть тип тари");
      return null;
    }
    if (!Number.isFinite(volumeNum) || volumeNum <= 0) {
      toast.error("Вкажіть коректний об'єм (> 0)");
      return null;
    }

    const dto: CreateContainerDto = {
      // code optional
      ...(code ? { code } : {}),
      name,
      volume: volumeNum,
      unit: form.unit.trim() || null,
      containerTypeId: containerTypeIdNum,
      meta: meta ? meta : null,
    };

    return dto;
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
    } catch {
      toast.error("Не вдалося створити тару");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">Нова тара</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрити"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Код (необов&apos;язково)
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="Автоматично"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Назва *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                {"Об'єм *"}
              </label>
              <input
                type="number"
                value={form.volume}
                onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))}
                required
                min={0.001}
                step="any"
                inputMode="decimal"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Одиниця *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Тип тари *</label>
            <select
              value={form.containerTypeId}
              onChange={(e) => {
                const v = e.target.value;
                const idNum = v ? Number(v) : NaN;
                const suggestedUnit = Number.isFinite(idNum)
                  ? defaultUnitByTypeId.get(idNum)
                  : undefined;

                setForm((p) => ({
                  ...p,
                  containerTypeId: v,
                  unit: suggestedUnit ?? p.unit,
                }));
              }}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Оберіть тип...</option>
              {containerTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name ?? "—"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Примітки</label>
            <textarea
              value={form.meta}
              onChange={(e) => setForm((p) => ({ ...p, meta: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Створюємо..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
