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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Save, Trash2, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const [editingItem, setEditingItem] = useState<ContainerTypeDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      setCreateDialogOpen(false);
      await load();
    } catch {
      toast.error("Не вдалося створити тип тари");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (item: ContainerTypeDto) => {
    try {
      await updateContainerType(String(item.id), {
        name: item.name,
        codePrefix: item.codePrefix,
        defaultUnit: item.defaultUnit,
        meta: item.meta,
      });
      toast.success("Тип тари оновлено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch {
      toast.error("Не вдалося оновити тип тари");
    }
  };

  const handleDelete = async (item: ContainerTypeDto) => {
    if (!window.confirm(`Видалити тип "${item.name ?? `#${item.id}`}"?`)) return;
    try {
      await deleteContainerType(String(item.id));
      toast.success("Тип тари видалено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch {
      toast.error("Не вдалося видалити тип тари");
    }
  };

  const openEditDialog = (item: ContainerTypeDto) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Типи тари</h1>
          <p className="text-muted-foreground">Керування типами контейнерів та обмеженнями на типи продуктів.</p>
        </div>
        <Button type="button" onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Додати тип
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Префікс</TableHead>
                  <TableHead>Одиниця</TableHead>
                  <TableHead>Дозволені типи продуктів</TableHead>
                  <TableHead className="w-[100px]">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline">#{item.id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.codePrefix || "—"}</Badge>
                    </TableCell>
                    <TableCell>{item.defaultUnit || "—"}</TableCell>
                    <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                      {item.allowedProductTypeNames?.length ? item.allowedProductTypeNames.join(", ") : "усі"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                          className="h-8"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Редагувати
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(item)}
                          className="h-8 w-8"
                          aria-label="Видалити"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <Card key={item.id} className="group transition-all hover:shadow-md active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          #{item.id}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {item.codePrefix && (
                          <Badge variant="outline" className="text-xs">
                            {item.codePrefix}
                          </Badge>
                        )}
                        {item.defaultUnit && <span>{item.defaultUnit}</span>}
                      </div>
                      {item.allowedProductTypeNames && item.allowedProductTypeNames.length > 0 && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          Дозволені: {item.allowedProductTypeNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)} className="h-8 w-8">
                        <Edit className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        aria-label="Видалити"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Додати новий тип тари</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-3">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Префікс коду" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} />
              <Input placeholder="Одиниця" value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} />
            </div>
            <Input
              placeholder="ID типів продукту (1,2,3)"
              value={allowedTypeIds}
              onChange={(e) => setAllowedTypeIds(e.target.value)}
            />
            <Textarea placeholder="Meta / примітки" value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} />
            <Button disabled={creating} type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> Додати
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати тип тари</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Назва</label>
                <Input
                  value={editingItem.name ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Префікс коду</label>
                  <Input
                    value={editingItem.codePrefix ?? ""}
                    onChange={(e) => setEditingItem({ ...editingItem, codePrefix: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Одиниця</label>
                  <Input
                    value={editingItem.defaultUnit ?? ""}
                    onChange={(e) => setEditingItem({ ...editingItem, defaultUnit: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Дозволені типи продуктів: {" "}
                {editingItem.allowedProductTypeNames?.length
                  ? editingItem.allowedProductTypeNames.join(", ")
                  : "усі"}
              </div>
              <div>
                <label className="text-sm font-medium">Meta</label>
                <Textarea
                  value={editingItem.meta ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, meta: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleUpdate(editingItem)} className="flex-1">
                  <Save className="mr-2 h-4 w-4" /> Зберегти
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
