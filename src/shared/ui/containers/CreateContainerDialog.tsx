"use client";

import { useState } from "react";
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

export function CreateContainerDialog({
  open,
  onClose,
  onCreated,
  containerTypes,
}: CreateContainerDialogProps) {
  const [form, setForm] = useState<CreateContainerDto>({
    name: "",
    volume: 0,
    unit: "л",
    containerTypeId: "",
    code: "",
    meta: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createContainer({
        ...form,
        code: form.code || undefined,
        meta: form.meta || undefined,
      });
      toast.success("Тару створено");
      onCreated();
      onClose();
      setForm({ name: "", volume: 0, unit: "л", containerTypeId: "", code: "", meta: "" });
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
          <h2 className="text-lg font-semibold text-card-foreground">
            Нова тара
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
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
              value={form.code || ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Автоматично"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Назва *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onChange={(e) =>
                  setForm({ ...form, volume: Number(e.target.value) })
                }
                required
                min={0}
                step="any"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Одиниця *
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Тип тари *
            </label>
            <select
              value={form.containerTypeId}
              onChange={(e) =>
                setForm({ ...form, containerTypeId: e.target.value })
              }
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Оберіть тип...</option>
              {containerTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Примітки
            </label>
            <textarea
              value={form.meta || ""}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
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
