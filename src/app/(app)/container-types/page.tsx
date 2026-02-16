"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth/AuthProvider";
import type { ContainerTypeDto } from "@/shared/types";
import {
  createContainerType,
  deleteContainerType,
  getContainerTypes,
  updateContainerType,
} from "@/shared/api/container-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Package } from "lucide-react";

export default function ContainerTypesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ContainerTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [allowedTypeIds, setAllowedTypeIds] = useState("");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    void load();
  }, [isAdmin, router]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getContainerTypes());
    } catch {
      toast.error("Не вдалося завантажити типи тари");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Вкажіть назву типу");
      return;
    }

    setCreating(true);
    try {
      const ids = allowedTypeIds
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v));

      await createContainerType({
        name: name.trim(),
        codePrefix: codePrefix.trim() || null,
        defaultUnit: defaultUnit.trim() || null,
        meta: meta.trim() || null,
        allowedProductTypeIds: ids.length ? ids : null,
      });

      toast.success("Тип тари створено");
      setName("");
      setCodePrefix("");
      setDefaultUnit("");
      setAllowedTypeIds("");
      setMeta("");
      await load();
    } catch {
      toast.error("Не вдалося створити тип тари");
    } finally {
      setCreating(false);
    }
  };

  const onSave = async (draft: ContainerTypeDto) => {
    try {
      await updateContainerType(String(draft.id), {
        name: draft.name,
        codePrefix: draft.codePrefix,
        defaultUnit: draft.defaultUnit,
        meta: draft.meta,
      });
      toast.success("Тип тари оновлено");
      await load();
    } catch {
      toast.error("Не вдалося оновити тип тари");
    }
  };

  const onDelete = async (draft: ContainerTypeDto) => {
    if (!window.confirm(`Видалити тип "${draft.name ?? `#${draft.id}`}"?`)) return;
    try {
      await deleteContainerType(String(draft.id));
      toast.success("Тип тари видалено");
      await load();
    } catch {
      toast.error("Не вдалося видалити тип тари");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">Типи тари</h1>
        <p className="text-muted-foreground">Керування типами контейнерів та обмеженнями на типи продуктів.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього типів тари</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус системи</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Активна</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Додати новий тип тари</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Префікс коду" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} />
            <Input placeholder="Одиниця" value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} />
            <Input
              placeholder="ID типів продукту (1,2,3)"
              value={allowedTypeIds}
              onChange={(e) => setAllowedTypeIds(e.target.value)}
            />
            <Button disabled={creating} type="submit">
              <Plus className="mr-2 h-4 w-4" /> Додати
            </Button>
            <div className="md:col-span-5">
              <Textarea placeholder="Meta / примітки" value={meta} onChange={(e) => setMeta(e.target.value)} />
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Завантаження...</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <EditableContainerType key={`${item.id}-${item.name ?? ""}-${item.codePrefix ?? ""}-${item.defaultUnit ?? ""}-${item.meta ?? ""}`} item={item} onSave={onSave} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function EditableContainerType({
  item,
  onSave,
  onDelete,
}: {
  item: ContainerTypeDto;
  onSave: (value: ContainerTypeDto) => Promise<void>;
  onDelete: (value: ContainerTypeDto) => Promise<void>;
}) {
  const [draft, setDraft] = useState(item);


  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-6">
        <Input value={draft.name ?? ""} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
        <Input
          value={draft.codePrefix ?? ""}
          onChange={(e) => setDraft((p) => ({ ...p, codePrefix: e.target.value }))}
        />
        <Input
          value={draft.defaultUnit ?? ""}
          onChange={(e) => setDraft((p) => ({ ...p, defaultUnit: e.target.value }))}
        />
        <Badge className="w-fit" variant="secondary">#{draft.id}</Badge>
        <Button size="sm" onClick={() => void onSave(draft)}>
          <Save className="mr-2 h-4 w-4" /> Зберегти
        </Button>
        <Button size="sm" variant="destructive" onClick={() => void onDelete(draft)}>
          <Trash2 className="mr-2 h-4 w-4" /> Видалити
        </Button>

        <div className="md:col-span-6 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Дозволені типи продуктів: {draft.allowedProductTypeNames?.length ? draft.allowedProductTypeNames.join(", ") : "усі"}
        </div>
        <Textarea
          className="md:col-span-6"
          value={draft.meta ?? ""}
          onChange={(e) => setDraft((p) => ({ ...p, meta: e.target.value }))}
          placeholder="Meta"
        />
      </CardContent>
    </Card>
  );
}
