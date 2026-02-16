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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Save, Trash2, Boxes, Edit, Clock, Sparkles } from "lucide-react";
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
  const [createOpenMobile, setCreateOpenMobile] = useState(false);

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

  const handleDelete = async (item: ProductTypeDto) => {
    if (!window.confirm(`Видалити тип "${item.name ?? `#${item.id}`}"?`)) return;
    try {
      await deleteProductType(String(item.id));
      toast.success("Тип продукту видалено");
      setEditDialogOpen(false);
      setEditingItem(null);
      await load();
    } catch {
      toast.error("Не вдалося видалити тип продукту");
    }
  };

  const openEditDialog = (item: ProductTypeDto) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">Типи продуктів</h1>
        <p className="text-muted-foreground">Керування довідником типів продуктів та термінами придатності.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Кількість типів</CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-sky-500/5 to-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сумарний shelf-life (год)</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShelfHours}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <span className="inline-flex items-center gap-2"><Plus className="h-5 w-5" />Створити тип продукту</span>
            <Button type="button" size="sm" variant="outline" className="md:hidden" onClick={() => setCreateOpenMobile((v) => !v)}>
              {createOpenMobile ? "Сховати" : "Відкрити"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className={createOpenMobile ? "block" : "hidden md:block"}>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Назва" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Дні" value={days} onChange={(e) => setDays(e.target.value)} type="number" min="0" />
            <Input placeholder="Години" value={hours} onChange={(e) => setHours(e.target.value)} type="number" min="0" />
            <Button disabled={creating} type="submit" className="transition-all hover:shadow-md active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Додати
            </Button>
            <div className="md:col-span-4">
              <Textarea placeholder="Meta / коментар" value={meta} onChange={(e) => setMeta(e.target.value)} rows={2} />
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
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
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {item.meta || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(item)}
                        className="h-8 transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card View */}
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <Card key={item.id} className="group transition-all hover:shadow-md active:scale-[0.98]">
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
                          {item.shelfLifeDays ?? 0}д {item.shelfLifeHours ?? 0}г
                        </span>
                      </div>
                      {item.meta && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.meta}</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)} className="h-8 px-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit Dialog */}
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
                <Button variant="destructive" onClick={() => handleDelete(editingItem)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
