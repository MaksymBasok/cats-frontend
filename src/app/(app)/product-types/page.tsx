"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Save, Trash2, Edit, Clock } from "lucide-react";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductTypesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [meta, setMeta] = useState("");

  const [editingItem, setEditingItem] = useState<ProductTypeDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ProductTypeDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setCreateDialogOpen(false);
      await load();
    } catch {
      toast.error("Не вдалося створити тип продукту");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (item: ProductTypeDto) => {
    try {
      await updateProductType(String(item.id), {
        name: item.name,
        shelfLifeDays: item.shelfLifeDays,
        shelfLifeHours: item.shelfLifeHours,
        meta: item.meta,
      });
      toast.success("Тип продукту оновлено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch {
      toast.error("Не вдалося оновити тип продукту");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setDeleteLoading(true);
    try {
      await deleteProductType(String(deleteItem.id));
      toast.success("Тип продукту видалено");
      setEditDialogOpen(false);
      setEditingItem(null);
      setDeleteItem(null);
      await load();
    } catch {
      toast.error("Не вдалося видалити тип продукту");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (item: ProductTypeDto) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">Типи продуктів</h1>
          <p className="text-muted-foreground">Керування довідником типів продуктів та термінами придатності.</p>
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
          <Card className="hidden border-primary/10 shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Дні</TableHead>
                  <TableHead>Години</TableHead>
                  <TableHead>Meta</TableHead>
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
                    <TableCell>{item.shelfLifeDays ?? 0}</TableCell>
                    <TableCell>{item.shelfLifeHours ?? 0}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {item.meta || "—"}
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
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteItem(item)}
                          className="h-8 gap-1.5"
                          aria-label="Видалити"
                        >
                          <Trash2 className="h-4 w-4" />
                          Видалити
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
              <Card key={item.id} className="group border-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          #{item.id}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {item.shelfLifeDays ?? 0}д {item.shelfLifeHours ?? 0}г
                        </span>
                      </div>
                      {item.meta && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.meta}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)} className="h-8 w-8">
                        <Edit className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteItem(item)}
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
            <DialogTitle>Створити тип продукту</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-3">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Дні" value={days} onChange={(e) => setDays(e.target.value)} type="number" min="0" />
              <Input placeholder="Години" value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0" />
            </div>
            <Textarea placeholder="Meta / коментар" value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} />
            <Button disabled={creating} type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> Додати
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати тип продукту</DialogTitle>
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
                  <label className="text-sm font-medium">Дні</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.shelfLifeDays ?? ""}
                    onChange={(e) => setEditingItem({ ...editingItem, shelfLifeDays: Number(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Години</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.shelfLifeHours ?? ""}
                    onChange={(e) => setEditingItem({ ...editingItem, shelfLifeHours: Number(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
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


      <ConfirmDialog
        open={!!deleteItem}
        title="Видалити тип продукту?"
        description={`Тип продукту "${deleteItem?.name?.trim() || `#${deleteItem?.id ?? ""}`}" буде видалено без можливості відновлення.`}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
