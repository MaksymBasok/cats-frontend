"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { showErrorToast } from "@/shared/utils/errors";
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

function parseNonNegativeInteger(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return "invalid";
  }

  return parsed;
}

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
      setLoadError("Failed to load product types.");
      showErrorToast(error, "Failed to load product types");
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

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter a name");
      return;
    }

    const parsedDays = parseNonNegativeInteger(days);
    if (parsedDays === "invalid") {
      toast.error("Days must be a whole number >= 0");
      return;
    }

    const parsedHours = parseNonNegativeInteger(hours);
    if (parsedHours === "invalid") {
      toast.error("Hours must be a whole number >= 0");
      return;
    }

    setCreating(true);
    try {
      await createProductType({
        name: trimmedName,
        shelfLifeDays: parsedDays,
        shelfLifeHours: parsedHours,
        meta: meta.trim() || null,
      });
      toast.success("Product type created");
      resetCreateForm();
      setCreateDialogOpen(false);
      await load();
    } catch (error) {
      showErrorToast(error, "Failed to create product type");
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

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("Enter a name");
      return;
    }

    const parsedDays = parseNonNegativeInteger(editDays);
    if (parsedDays === "invalid") {
      toast.error("Days must be a whole number >= 0");
      return;
    }

    const parsedHours = parseNonNegativeInteger(editHours);
    if (parsedHours === "invalid") {
      toast.error("Hours must be a whole number >= 0");
      return;
    }

    setUpdating(true);
    try {
      await updateProductType(String(editingItem.id), {
        name: trimmedName,
        shelfLifeDays: parsedDays,
        shelfLifeHours: parsedHours,
        meta: editMeta.trim() || null,
      });
      toast.success("Product type updated");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch (error) {
      showErrorToast(error, "Failed to update product type");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setDeleteLoading(true);
    try {
      await deleteProductType(String(deleteItem.id));
      toast.success("Product type deleted");
      setEditDialogOpen(false);
      setEditingItem(null);
      setDeleteItem(null);
      await load();
    } catch (error) {
      showErrorToast(error, "Failed to delete product type");
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Типи продуктів</h1>
          <p className="text-muted-foreground">Керуйте каталогом типів продуктів та стандартними значеннями терміну придатності.</p>
        </div>
        <Button type="button" onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Додати тип
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Не знайдено типів продуктів.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Дні</TableHead>
                  <TableHead>Години</TableHead>
                  <TableHead>Мета</TableHead>
                  <TableHead className="w-[120px]">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
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
                          <Edit className="mr-2 h-4 w-4" /> Редагувати
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteItem(item)}
                          className="h-8 gap-1.5"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" /> Видалити
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
                className="group border-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                onClick={(event) => handleRowNavigation(event, `/product-types/${item.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs">#{item.id}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {item.shelfLifeDays ?? 0}d {item.shelfLifeHours ?? 0}h
                        </span>
                      </div>
                      {item.meta && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.meta}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                        aria-label="Edit"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteItem(item)}
                        className="h-8 w-8"
                        aria-label="Delete"
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
            <DialogTitle>Create product type</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid gap-3">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Дні" value={days} onChange={(e) => setDays(e.target.value)} type="number" min="0" step="1" />
              <Input placeholder="Години" value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0" step="1" />
            </div>
            <Textarea placeholder="Мета" value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} />
            <Button disabled={creating} type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> {creating ? "Створення..." : "Створити"}
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
          {editingItem && (
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="text-sm font-medium">Назва</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1.5" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Дні</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
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
                    onChange={(e) => setEditHours(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Мета</label>
                <Textarea value={editMeta} onChange={(e) => setEditMeta(e.target.value)} className="mt-1.5" rows={3} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={updating} className="flex-1">
                  <Save className="mr-2 h-4 w-4" /> {updating ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete product type?"
        description={`Product type "${deleteItem?.name?.trim() || `#${deleteItem?.id ?? ""}`}" will be deleted permanently.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={deleteLoading}
      />
    </div>
  );
}