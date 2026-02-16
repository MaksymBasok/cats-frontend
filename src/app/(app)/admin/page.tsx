"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, UserX, Shield, UserPlus, MailPlus, Users, UserCog } from "lucide-react";
import { toast } from "sonner";

import type { UserDto, UserRole } from "@/shared/types";
import * as usersApi from "@/shared/api/users";
import { createInvitation } from "@/shared/api/invitations";
import { useAuth } from "@/shared/auth/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    } catch {
      toast.error("Не вдалося завантажити користувачів");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await usersApi.activateUser(userId);
      toast.success("Користувача підтверджено");
      await fetchUsers();
    } catch {
      toast.error("Не вдалося підтвердити користувача");
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm("Відхилити цього користувача?")) return;

    try {
      await usersApi.deactivateUser(userId);
      toast.success("Користувача відхилено");
      await fetchUsers();
    } catch {
      toast.error("Не вдалося відхилити користувача");
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!window.confirm("Надати цьому користувачу права адміністратора?")) return;

    try {
      await usersApi.updateUser(userId, { role: "Admin" });
      toast.success("Користувач тепер адміністратор");
      await fetchUsers();
    } catch {
      toast.error("Не вдалося оновити роль користувача");
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
    } catch {
      toast.error("Не вдалося створити запрошення");
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
      await fetchUsers();
    } catch {
      toast.error("Не вдалося створити користувача");
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
      <div>
        <h1 className="text-3xl font-bold">Користувачі та доступ</h1>
        <p className="text-muted-foreground">Керування акаунтами, ролями, інвайтами та активаціями.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Очікують</CardTitle>
            <UserCog className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активні</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailPlus className="h-5 w-5" /> Надіслати запрошення
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <Button disabled={inviteLoading} type="submit" className="transition-all hover:shadow-md active:scale-[0.98]">
                Створити запрошення
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Створити користувача
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <Button disabled={createLoading} type="submit" className="transition-all hover:shadow-md active:scale-[0.98]">
                Створити користувача
              </Button>
            </form>
          </CardContent>
        </Card>
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
                {/* Desktop Table */}
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
                          <TableCell className="font-medium">
                            {(u.firstName ?? "—") + " " + (u.lastName ?? "")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApprove(u.id)} className="transition-all hover:shadow-md">
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

                {/* Mobile Cards */}
                <div className="grid gap-3 md:hidden">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="rounded-lg border p-4">
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
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Активні користувачі ({activeUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
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
                        <TableCell className="font-medium">
                          {(u.firstName ?? "—") + " " + (u.lastName ?? "")}
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
                            <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)} className="transition-all hover:shadow-md">
                              <Shield className="mr-2 h-4 w-4" /> Адмін
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="grid gap-3 md:hidden">
                {activeUsers.map((u) => (
                  <div key={u.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
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
                        <Shield className="mr-2 h-4 w-4" /> Зробити адміном
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {activeUsers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Немає активних користувачів</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
