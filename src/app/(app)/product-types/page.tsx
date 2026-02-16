"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth/AuthProvider";
import type { ProductTypeDto } from "@/shared/types";
import {
  createProductType,
  deleteProductType,
  getProductTypes,
  updateProductType,
} from "@/shared/api/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2 } from "lucide-react";

export default function ProductTypesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
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
      setItems(await getProductTypes());
    } catch {
      toast.error("Не вдалося завантажити типи продуктів");
    } finally {
      setLoading(false);
    }
  };

  const totalShelfHours = useMemo(
    () => items.reduce((acc, i) => acc + (i.shelfLifeDays ?? 0) * 24 + (i.shelfLifeHours ?? 0), 0),
    [items]
  );

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Вкажіть назву");
      return;
    }

    setCreating(true);
    try {
      await createProductType({
        name: name.trim(),
        shelfLifeDays: days ? Number(days) : null,
        shelfLifeHours: hours ? Number(hours) : null,
        meta: meta.trim() || null,
      });
      toast.success("Тип продукту створено");
      setName("");
      setDays("");
      setHours("");
      setMeta("");
      await load();
    } catch {
      toast.error("Не вдалося створити тип продукту");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (item: ProductTypeDto) => {
    setEditingId(item.id);
    try {
      await updateProductType(String(item.id), {
        name: item.name,
        shelfLifeDays: item.shelfLifeDays,
        shelfLifeHours: item.shelfLifeHours,
        meta: item.meta,
      });
      toast.success("Тип продукту оновлено");
      await load();
    } catch {
      toast.error("Не вдалося оновити тип продукту");
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (item: ProductTypeDto) => {
    if (!window.confirm(`Видалити тип "${item.name ?? `#${item.id}`}"?`)) return;
    try {
      await deleteProductType(String(item.id));
      toast.success("Тип продукту видалено");
      await load();
    } catch {
      toast.error("Не вдалося видалити тип продукту");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-semibold">Типи продуктів</h1>
        <p className="text-sm text-muted-foreground">Повне CRUD керування довідником типів продуктів.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Кількість типів</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{items.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Сумарний shelf-life (год)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalShelfHours}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Створити тип продукту</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Дні" value={days} onChange={(e) => setDays(e.target.value)} type="number" min="0" />
            <Input placeholder="Години" value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0" />
            <Button disabled={creating} type="submit">
              <Plus className="mr-2 h-4 w-4" /> Додати
            </Button>
            <div className="md:col-span-4">
              <Textarea placeholder="Meta / коментар" value={meta} onChange={(e) => setMeta(e.target.value)} />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        ) : (
          items.map((item) => (
            <EditableProductTypeRow
              key={`${item.id}-${item.name ?? ""}-${item.shelfLifeDays ?? ""}-${item.shelfLifeHours ?? ""}-${item.meta ?? ""}`}
              initial={item}
              onSave={handleUpdate}
              onDelete={handleDelete}
              saving={editingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EditableProductTypeRow({
  initial,
  onSave,
  onDelete,
  saving,
}: {
  initial: ProductTypeDto;
  onSave: (value: ProductTypeDto) => Promise<void>;
  onDelete: (value: ProductTypeDto) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<ProductTypeDto>(initial);


  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-6 md:items-center">
        <Input
          className="md:col-span-2"
          value={draft.name ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          type="number"
          min="0"
          value={draft.shelfLifeDays ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, shelfLifeDays: Number(e.target.value) || 0 }))}
        />
        <Input
          type="number"
          min="0"
          value={draft.shelfLifeHours ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, shelfLifeHours: Number(e.target.value) || 0 }))}
        />
        <Badge variant="secondary" className="w-fit">ID #{draft.id}</Badge>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void onSave(draft)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Зберегти
          </Button>
          <Button size="sm" variant="destructive" onClick={() => void onDelete(draft)}>
            <Trash2 className="mr-2 h-4 w-4" />
          </Button>
        </div>
        <Textarea
          className="md:col-span-6"
          value={draft.meta ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, meta: e.target.value }))}
          placeholder="Meta"
        />
      </CardContent>
    </Card>
  );
}
