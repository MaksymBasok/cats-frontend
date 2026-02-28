"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { validateProductType } from "@/shared/utils/form-validation";
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
import { Clock3, Edit, FlaskConical, Plus, Save, Trash2 } from "lucide-react";
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [meta, setMeta] = useState("");

  const [editingItem, setEditingItem] = useState<ProductTypeDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editDays, setEditDays] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editMeta, setEditMeta] = useState("");

  const [deleteItem, setDeleteItem] = useState<ProductTypeDto | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    void load();
  }, [isAdmin, router]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setItems(await getProductTypes());
    } catch (error) {
      setLoadError("Не вдалося завантажити типи продуктів.");
      showErrorToast(error, "Не вдалося завантажити типи продуктів");
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setName("");
    setDays("");
    setHours("");
    setMeta("");
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();

    const createResult = validateProductType({
      name,
      shelfLifeDays: days,
      shelfLifeHours: hours,
      meta,
    });

    if (!createResult.success) {
      showValidationToast(createResult.issues);
      return;
    }

    setCreating(true);
    try {
      await createProductType(createResult.data);
      toast.success("Тип продукту створено");
      resetCreateForm();
      setCreateDialogOpen(false);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося створити тип продукту");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (item: ProductTypeDto) => {
    setEditingItem({ ...item });
    setEditName(item.name ?? "");
    setEditDays(item.shelfLifeDays != null ? String(item.shelfLifeDays) : "");
    setEditHours(item.shelfLifeHours != null ? String(item.shelfLifeHours) : "");
    setEditMeta(item.meta ?? "");
    setUpdating(false);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    const updateResult = validateProductType({
      name: editName,
      shelfLifeDays: editDays,
      shelfLifeHours: editHours,
      meta: editMeta,
    });

    if (!updateResult.success) {
      showValidationToast(updateResult.issues);
      return;
    }

    setUpdating(true);
    try {
      await updateProductType(String(editingItem.id), updateResult.data);
      toast.success("Тип продукту оновлено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити тип продукту");
    } finally {
      setUpdating(false);
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
    } catch (error) {
      showErrorToast(error, "Не вдалося видалити тип продукту");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRowNavigation = (event: MouseEvent<HTMLElement>, href: string) => {
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("label")) {
      return;
    }
    router.push(href);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <section className="glass relative overflow-hidden rounded-[28px] border border-primary/10 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[var(--neon-glow)]">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="gradient-text">Типи продуктів</span>
                </h1>
                <p className="text-muted-foreground">
                  Каталог типів продуктів зі стандартними значеннями терміну придатності.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                Типів продуктів: {items.length}
              </Badge>
            </div>
          </div>

          <Button type="button" onClick={() => setCreateDialogOpen(true)} className="gap-2 shadow-[var(--neon-glow)]">
            <Plus className="h-4 w-4" />
            Додати тип
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : loadError ? (
        <Card className="stylish-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              Повторити
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="stylish-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Не знайдено типів продуктів.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="stylish-card hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Дні</TableHead>
                  <TableHead>Години</TableHead>
                  <TableHead>Примітки</TableHead>
                  <TableHead className="w-[120px]">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-primary/5"
                    onClick={(event) => handleRowNavigation(event, `/product-types/${item.id}`)}
                  >
                    <TableCell>
                      <Badge variant="outline">#{item.id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.name ?? "-"}</TableCell>
                    <TableCell>{item.shelfLifeDays ?? 0}</TableCell>
                    <TableCell>{item.shelfLifeHours ?? 0}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{item.meta || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(item)} className="h-8">
                          <Edit className="mr-2 h-4 w-4" />
                          Редагувати
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteItem(item)}
                          className="h-8 gap-1.5"
                          aria-label="Видалити тип продукту"
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
              <Card
                key={item.id}
                className="stylish-card group border-primary/10 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                onClick={(event) => handleRowNavigation(event, `/product-types/${item.id}`)}
              >
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
                          <Clock3 className="h-3.5 w-3.5" />
                          {item.shelfLifeDays ?? 0} дн. {item.shelfLifeHours ?? 0} год.
                        </span>
                      </div>
                      {item.meta ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.meta}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                        aria-label="Редагувати тип продукту"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteItem(item)}
                        className="h-8 w-8"
                        aria-label="Видалити тип продукту"
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

      <Dialog
        open={createDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !creating) {
            resetCreateForm();
          }
          setCreateDialogOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Створити тип продукту</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-3">
            <Input placeholder="Назва" value={name} onChange={(event) => setName(event.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Дні" value={days} onChange={(event) => setDays(event.target.value)} type="number" min="0" step="1" />
              <Input placeholder="Години" value={hours} onChange={(event) => setHours(event.target.value)} type="number" min="0" step="1" />
            </div>
            <Textarea placeholder="Примітки" value={meta} onChange={(event) => setMeta(event.target.value)} rows={3} />
            <Button disabled={creating} type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {creating ? "Створення..." : "Створити"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !updating) {
            setEditingItem(null);
          }
          setEditDialogOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати тип продукту</DialogTitle>
          </DialogHeader>
          {editingItem ? (
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="text-sm font-medium">Назва</label>
                <Input value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-1.5" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Дні</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editDays}
                    onChange={(event) => setEditDays(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Години</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editHours}
                    onChange={(event) => setEditHours(event.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Примітки</label>
                <Textarea value={editMeta} onChange={(event) => setEditMeta(event.target.value)} className="mt-1.5" rows={3} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={updating} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {updating ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </form>
          ) : null}
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
