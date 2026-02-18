"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, UserX, Shield, UserPlus, MailPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { showErrorToast } from "@/shared/utils/errors";

import type { UserDto, UserRole } from "@/shared/types";
import * as usersApi from "@/shared/api/users";
import { createInvitation } from "@/shared/api/invitations";
import { useAuth } from "@/shared/auth/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function initialsForUser(u: UserDto): string {
  const first = (u.firstName ?? "").trim();
  const last = (u.lastName ?? "").trim();
  if (first || last) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "U";
  }
  const email = (u.email ?? "").trim();
  return email ? email[0].toUpperCase() : "U";
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("Operator");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [createEmail, setCreateEmail] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("Operator");
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/");
      return;
    }
    void fetchUsers();
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (error) {
      showErrorToast(error, "Не вдалося завантажити користувачів");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await usersApi.activateUser(userId);
      toast.success("Користувача підтверджено");
      await fetchUsers();
    } catch (error) {
      showErrorToast(error, "Не вдалося підтвердити користувача");
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm("Відхилити цього користувача?")) return;

    try {
      await usersApi.deactivateUser(userId);
      toast.success("Користувача відхилено");
      await fetchUsers();
    } catch (error) {
      showErrorToast(error, "Не вдалося відхилити користувача");
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!window.confirm("Надати цьому користувачу права адміністратора?")) return;

    try {
      await usersApi.updateUser(userId, { role: "Admin" });
      toast.success("Користувач тепер адміністратор");
      await fetchUsers();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити роль користувача");
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Вкажіть email");
      return;
    }
    setInviteLoading(true);
    try {
      await createInvitation({ email: inviteEmail.trim(), role: inviteRole });
      toast.success("Запрошення створено");
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error) {
      showErrorToast(error, "Не вдалося створити запрошення");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim()) {
      toast.error("Вкажіть email");
      return;
    }

    setCreateLoading(true);
    try {
      await usersApi.createUser({
        email: createEmail.trim(),
        firstName: createFirstName.trim() || null,
        lastName: createLastName.trim() || null,
        role: createRole,
        isActive: true,
      });
      toast.success("Користувача створено");
      setCreateEmail("");
      setCreateFirstName("");
      setCreateLastName("");
      setCreateDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      showErrorToast(error, "Не вдалося створити користувача");
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return full.includes(q) || email.includes(q);
    });
  }, [users, search]);

  const pendingUsers = useMemo(() => filteredUsers.filter((u) => !u.isActive), [filteredUsers]);
  const activeUsers = useMemo(() => filteredUsers.filter((u) => u.isActive), [filteredUsers]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <h1 className="text-3xl font-bold">Користувачі та доступ</h1>
            {!loading && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Всього: <span className="font-semibold text-foreground">{users.length}</span>
                </span>
                <span>
                  Очікують: <span className="font-semibold text-foreground">{pendingUsers.length}</span>
                </span>
                <span>
                  Активні: <span className="font-semibold text-foreground">{activeUsers.length}</span>
                </span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">Керування акаунтами, ролями, інвайтами та активаціями.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => setInviteDialogOpen(true)}>
            <MailPlus className="h-4 w-4" /> Запрошення
          </Button>
          <Button type="button" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4" /> Користувач
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Пошук користувачів..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {pendingUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Очікують підтвердження ({pendingUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:hidden">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="font-medium">{(u.firstName ?? "—") + " " + (u.lastName ?? "")}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(u.id)} className="flex-1">
                          <UserCheck className="mr-2 h-4 w-4" /> Підтвердити
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(u.id)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Користувач</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[200px]">Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{(u.firstName ?? "—") + " " + (u.lastName ?? "")}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApprove(u.id)}>
                                <UserCheck className="mr-2 h-4 w-4" /> Підтвердити
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(u.id)}>
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Активні користувачі ({activeUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {activeUsers.map((u) => (
                  <div key={u.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {initialsForUser(u)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{(u.firstName ?? "—") + " " + (u.lastName ?? "")}</div>
                          {u.role === "Admin" && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              <Shield className="mr-1 h-3 w-3" /> Адмін
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                    {u.role !== "Admin" && (
                      <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)} className="mt-3 w-full">
                        <Sparkles className="mr-2 h-4 w-4" /> Зробити адміном
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Користувач</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead className="w-[150px]">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initialsForUser(u)}
                            </div>
                            <div className="font-medium">{(u.firstName ?? "—") + " " + (u.lastName ?? "")}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          {u.role === "Admin" ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Shield className="mr-1 h-3 w-3" /> Адмін
                            </Badge>
                          ) : (
                            <Badge variant="outline">Operator</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.role !== "Admin" && (
                            <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)}>
                              <Shield className="mr-2 h-4 w-4" /> Адмін
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {activeUsers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Немає активних користувачів</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Надіслати запрошення</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleInvite}>
            <Input placeholder="email@company.com" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={inviteLoading} type="submit">
              Створити запрошення
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Створити користувача</DialogTitle>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={handleCreateUser}>
            <Input placeholder="Email" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Ім'я" value={createFirstName} onChange={(e) => setCreateFirstName(e.target.value)} />
              <Input placeholder="Прізвище" value={createLastName} onChange={(e) => setCreateLastName(e.target.value)} />
            </div>
            <Select value={createRole} onValueChange={(v) => setCreateRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={createLoading} type="submit">
              Створити користувача
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
