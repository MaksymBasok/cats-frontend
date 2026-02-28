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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronDown, Edit, Plus, Save, Shapes, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { MEASUREMENT_UNITS, normalizeUnit } from "@/shared/constants/units";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { validateContainerType } from "@/shared/utils/form-validation";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [name, setName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [defaultUnit, setDefaultUnit] = useState(normalizeUnit("л"));
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [allTypesSelected, setAllTypesSelected] = useState(true);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [meta, setMeta] = useState("");

  const [editingItem, setEditingItem] = useState<ContainerTypeDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSelectedTypeIds, setEditSelectedTypeIds] = useState<number[]>([]);
  const [editAllTypesSelected, setEditAllTypesSelected] = useState(true);
  const [editTypePickerOpen, setEditTypePickerOpen] = useState(false);
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
    setLoadError(null);

    try {
      const [containerTypes, productTypeItems] = await Promise.all([getContainerTypes(), getProductTypes()]);
      setItems(containerTypes);
      setProductTypes(productTypeItems.map((type) => ({ id: type.id, name: type.name?.trim() || `Тип #${type.id}` })));
    } catch (error) {
      setLoadError("Не вдалося завантажити типи тари.");
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

    const prefix =
      words.length > 1
        ? words
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase()
        : (words[0] || "").slice(0, 2).toUpperCase();

    setCodePrefix((prev) => (prev.trim().length > 0 ? prev : prefix));
  };

  const selectedTypeNames = useMemo(() => {
    if (allTypesSelected) return "Усі типи продуктів";
    if (!selectedTypeIds.length) return "Типи не вибрані";

    return productTypes
      .filter((type) => selectedTypeIds.includes(type.id))
      .map((type) => type.name)
      .join(", ");
  }, [allTypesSelected, productTypes, selectedTypeIds]);

  const editSelectedTypeNames = useMemo(() => {
    if (editAllTypesSelected) return "Усі типи продуктів";
    if (!editSelectedTypeIds.length) return "Типи не вибрані";

    return productTypes
      .filter((type) => editSelectedTypeIds.includes(type.id))
      .map((type) => type.name)
      .join(", ");
  }, [editAllTypesSelected, editSelectedTypeIds, productTypes]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Вкажіть назву типу");
      return;
    }

    setCreating(true);

    try {
      const createResult = validateContainerType({
        name,
        codePrefix,
        defaultUnit,
        meta,
        allowedProductTypeIds: allTypesSelected ? [] : Array.from(new Set(selectedTypeIds)),
      });

      if (!createResult.success) {
        showValidationToast(createResult.issues);
        return;
      }

      await createContainerType(createResult.data);

      toast.success("Тип тари створено");
      setName("");
      setCodePrefix("");
      setDefaultUnit(normalizeUnit("л"));
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
    const trimmedName = (item.name ?? "").trim();
    if (!trimmedName) {
      toast.error("Вкажіть назву типу тари");
      return;
    }

    setUpdating(true);

    try {
      const updateResult = validateContainerType({
        name: trimmedName,
        codePrefix: item.codePrefix ?? "",
        defaultUnit: item.defaultUnit ?? "",
        meta: item.meta ?? "",
        allowedProductTypeIds: editAllTypesSelected ? [] : Array.from(new Set(editSelectedTypeIds)),
      });

      if (!updateResult.success) {
        showValidationToast(updateResult.issues);
        return;
      }

      await updateContainerType(String(item.id), updateResult.data);
      toast.success("Тип тари оновлено");
      setEditDialogOpen(false);
      setEditingItem(null);
      setEditSelectedTypeIds([]);
      setEditAllTypesSelected(true);
      setEditTypePickerOpen(false);
      await load();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити тип тари");
    } finally {
      setUpdating(false);
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
    const allowedNames = (item.allowedProductTypeNames ?? []).map((value) => value.trim().toLowerCase());
    const idsByName = productTypes
      .filter((type) => allowedNames.includes(type.name.trim().toLowerCase()))
      .map((type) => type.id);
    const isAllTypes = !item.allowedProductTypeNames || item.allowedProductTypeNames.length === 0;

    setEditingItem({
      ...item,
      defaultUnit: normalizeUnit(item.defaultUnit) || normalizeUnit("л"),
    });
    setEditAllTypesSelected(isAllTypes);
    setEditSelectedTypeIds(idsByName);
    setEditTypePickerOpen(false);
    setUpdating(false);
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

  const handleEditTypeToggle = (typeId: number, checked: boolean) => {
    setEditAllTypesSelected(false);
    if (checked) {
      setEditSelectedTypeIds((prev) => Array.from(new Set([...prev, typeId])));
      return;
    }
    setEditSelectedTypeIds((prev) => prev.filter((id) => id !== typeId));
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
                <Shapes className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="gradient-text">Типи тари</span>
                </h1>
                <p className="text-muted-foreground">
                  Керування типами контейнерів та дозволеними типами продуктів.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                Типів тари: {items.length}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                Типів продуктів: {productTypes.length}
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
      ) : (
        <>
          <Card className="stylish-card hidden overflow-hidden md:block">
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
                    <TableCell className="font-medium">{item.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.codePrefix || "-"}</Badge>
                    </TableCell>
                    <TableCell>{item.defaultUnit || "-"}</TableCell>
                    <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground">
                      {item.allowedProductTypeNames?.length ? item.allowedProductTypeNames.join(", ") : "усі"}
                    </TableCell>
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
                className="stylish-card group border-primary/10 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
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
                        {item.codePrefix ? (
                          <Badge variant="outline" className="text-xs">
                            {item.codePrefix}
                          </Badge>
                        ) : null}
                        {item.defaultUnit ? <span>{item.defaultUnit}</span> : null}
                      </div>
                      {item.allowedProductTypeNames && item.allowedProductTypeNames.length > 0 ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          Дозволені: {item.allowedProductTypeNames.join(", ")}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Дозволені: усі типи продуктів</p>
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
              onChange={(event) => {
                setName(event.target.value);
                autoCodePrefix(event.target.value);
              }}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Префікс коду" value={codePrefix} onChange={(event) => setCodePrefix(event.target.value)} />

              <Select value={normalizeUnit(defaultUnit) || normalizeUnit("л")} onValueChange={setDefaultUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

                {typePickerOpen ? (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border bg-background p-3 shadow-lg">
                    <label className="mb-2 flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/60">
                      <input
                        type="checkbox"
                        checked={allTypesSelected}
                        onChange={(event) => {
                          setAllTypesSelected(event.target.checked);
                          if (event.target.checked) {
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
                              onChange={(event) => handleTypeToggle(type.id, event.target.checked)}
                            />
                            <span className="flex-1">{type.name}</span>
                            <span className="text-xs text-muted-foreground">#{type.id}</span>
                            {!allTypesSelected && selectedTypeIds.includes(type.id) ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : null}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <Textarea placeholder="Примітки" value={meta} onChange={(event) => setMeta(event.target.value)} rows={3} />

            <Button disabled={creating} type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {creating ? "Створення..." : "Додати"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати тип тари</DialogTitle>
          </DialogHeader>

          {editingItem ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-container-type-name">Назва</Label>
                <Input
                  id="edit-container-type-name"
                  value={editingItem.name ?? ""}
                  onChange={(event) => setEditingItem({ ...editingItem, name: event.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-container-type-prefix">Префікс коду</Label>
                  <Input
                    id="edit-container-type-prefix"
                    value={editingItem.codePrefix ?? ""}
                    onChange={(event) => setEditingItem({ ...editingItem, codePrefix: event.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-container-type-unit">Одиниця</Label>
                  <Select
                    value={normalizeUnit(editingItem.defaultUnit) || normalizeUnit("л")}
                    onValueChange={(value) => setEditingItem({ ...editingItem, defaultUnit: value })}
                  >
                    <SelectTrigger id="edit-container-type-unit" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed p-3 text-xs text-muted-foreground">
                Дозволені типи продуктів: {editingItem.allowedProductTypeNames?.length ? editingItem.allowedProductTypeNames.join(", ") : "усі"}
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setEditTypePickerOpen((prev) => !prev)}
                >
                  <span className="line-clamp-1 text-left">{editSelectedTypeNames}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>

                {editTypePickerOpen ? (
                  <div className="rounded-xl border bg-background p-3">
                    <label className="mb-2 flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/60">
                      <input
                        type="checkbox"
                        checked={editAllTypesSelected}
                        onChange={(event) => {
                          setEditAllTypesSelected(event.target.checked);
                          if (event.target.checked) {
                            setEditSelectedTypeIds([]);
                          }
                        }}
                      />
                      <span className="font-medium">Усі типи продуктів</span>
                    </label>

                    <div className="max-h-40 space-y-1 overflow-auto pr-1 text-sm">
                      {productTypes.map((type) => (
                        <label key={type.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted/60">
                          <input
                            type="checkbox"
                            checked={!editAllTypesSelected && editSelectedTypeIds.includes(type.id)}
                            onChange={(event) => handleEditTypeToggle(type.id, event.target.checked)}
                          />
                          <span className="flex-1">{type.name}</span>
                          <span className="text-xs text-muted-foreground">#{type.id}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <Label htmlFor="edit-container-type-meta">Примітки</Label>
                <Textarea
                  id="edit-container-type-meta"
                  value={editingItem.meta ?? ""}
                  onChange={(event) => setEditingItem({ ...editingItem, meta: event.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleUpdate(editingItem)} disabled={updating} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {updating ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          ) : null}
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
