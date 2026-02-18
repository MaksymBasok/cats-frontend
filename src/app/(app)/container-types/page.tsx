"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
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
import { getProductTypes } from "@/shared/api/product-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronDown, Plus, Save, Trash2, Edit } from "lucide-react";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { MEASUREMENT_UNITS, normalizeUnit } from "@/shared/constants/units";
import { showErrorToast } from "@/shared/utils/errors";
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
  const [productTypes, setProductTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [allTypesSelected, setAllTypesSelected] = useState(true);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [meta, setMeta] = useState("");

  const [editingItem, setEditingItem] = useState<ContainerTypeDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ContainerTypeDto | null>(null);
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
      const [containerTypes, productTypeItems] = await Promise.all([getContainerTypes(), getProductTypes()]);
      setItems(containerTypes);
      setProductTypes(
        productTypeItems.map((type) => ({ id: type.id, name: type.name?.trim() || `Тип #${type.id}` })),
      );
    } catch (error) {
      showErrorToast(error, "Не вдалося завантажити типи тари");
    } finally {
      setLoading(false);
    }
  };

  const autoCodePrefix = (value: string) => {
    const words = value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/g, ""))
      .filter(Boolean);

    const onlyLetters =
      words.length > 1
        ? words
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase()
        : (words[0] || "").slice(0, 2).toUpperCase();

    setCodePrefix((prev) => (prev.trim().length > 0 ? prev : onlyLetters));
  };

  const selectedTypeNames = useMemo(() => {
    if (allTypesSelected) {
      return "Усі типи продуктів";
    }

    if (!selectedTypeIds.length) {
      return "Типи не вибрані";
    }

    return productTypes
      .filter((type) => selectedTypeIds.includes(type.id))
      .map((type) => type.name)
      .join(", ");
  }, [allTypesSelected, productTypes, selectedTypeIds]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Вкажіть назву типу");
      return;
    }

    setCreating(true);
    try {
      const ids = allTypesSelected ? [] : Array.from(new Set(selectedTypeIds));

      await createContainerType({
        name: name.trim(),
        codePrefix: codePrefix.trim() || null,
        defaultUnit: normalizeUnit(defaultUnit),
        meta: meta.trim() || null,
        allowedProductTypeIds: allTypesSelected ? null : ids,
      });

      toast.success("Тип тари створено");
      setName("");
      setCodePrefix("");
      setDefaultUnit("");
      setSelectedTypeIds([]);
      setAllTypesSelected(true);
      setTypePickerOpen(false);
      setMeta("");
      setCreateDialogOpen(false);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося створити тип тари");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (item: ContainerTypeDto) => {
    try {
      await updateContainerType(String(item.id), {
        name: item.name,
        codePrefix: item.codePrefix,
        defaultUnit: normalizeUnit(item.defaultUnit),
        meta: item.meta,
      });
      toast.success("Тип тари оновлено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити тип тари");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setDeleteLoading(true);
    try {
      await deleteContainerType(String(deleteItem.id));
      toast.success("Тип тари видалено");
      setEditDialogOpen(false);
      setEditingItem(null);
      setDeleteItem(null);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося видалити тип тари");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditDialog = (item: ContainerTypeDto) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  const handleTypeToggle = (typeId: number, checked: boolean) => {
    setAllTypesSelected(false);
    if (checked) {
      setSelectedTypeIds((prev) => Array.from(new Set([...prev, typeId])));
      return;
    }
    setSelectedTypeIds((prev) => prev.filter((id) => id !== typeId));
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
                  <TableRow
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={(event) => handleRowNavigation(event, `/container-types/${item.id}`)}
                  >
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
              <Card
                key={item.id}
                className="group border-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                onClick={(event) => handleRowNavigation(event, `/container-types/${item.id}`)}
              >
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
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditDialog(item)}
                        aria-label="Редагувати"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteItem(item)}
                        className="h-8 w-8"
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
            <Input
              placeholder="Назва"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                autoCodePrefix(e.target.value);
              }}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Префікс коду" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} />
              <select
                value={normalizeUnit(defaultUnit)}
                onChange={(e) => setDefaultUnit(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Дозволені типи продуктів</p>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setTypePickerOpen((prev) => !prev)}
                >
                  <span className="line-clamp-1 text-left">{selectedTypeNames}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
                {typePickerOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-md border bg-background p-3 shadow-lg">
                    <label className="mb-2 flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/60">
                      <input
                        type="checkbox"
                        checked={allTypesSelected}
                        onChange={(e) => {
                          setAllTypesSelected(e.target.checked);
                          if (e.target.checked) {
                            setSelectedTypeIds([]);
                          }
                        }}
                      />
                      <span className="font-medium">Усі типи</span>
                    </label>

                    <div className="max-h-40 space-y-1 overflow-auto pr-1 text-sm">
                      {productTypes.length === 0 ? (
                        <p className="px-1 py-1 text-muted-foreground">Типи продуктів не знайдені</p>
                      ) : (
                        productTypes.map((type) => (
                          <label key={type.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/60">
                            <input
                              type="checkbox"
                              checked={!allTypesSelected && selectedTypeIds.includes(type.id)}
                              onChange={(e) => handleTypeToggle(type.id, e.target.checked)}
                            />
                            <span className="flex-1">{type.name}</span>
                            <span className="text-xs text-muted-foreground">#{type.id}</span>
                            {!allTypesSelected && selectedTypeIds.includes(type.id) && <Check className="h-3.5 w-3.5 text-primary" />}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                  <select
                    value={normalizeUnit(editingItem.defaultUnit)}
                    onChange={(e) => setEditingItem({ ...editingItem, defaultUnit: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {MEASUREMENT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
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


      <ConfirmDialog
        open={!!deleteItem}
        title="Видалити тип тари?"
        description={`Тип тари "${deleteItem?.name?.trim() || `#${deleteItem?.id ?? ""}`}" буде видалено без можливості відновлення.`}
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
