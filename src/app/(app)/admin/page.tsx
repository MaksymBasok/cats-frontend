// src/app/(app)/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, UserX, Shield } from "lucide-react";
import { toast } from "sonner";

import type { UserDto } from "@/shared/types";
import * as usersApi from "@/shared/api/users";
import { useAuth } from "@/shared/auth/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      router.push("/");
      return;
    }
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
        <h1 className="text-3xl font-bold">Користувачі</h1>
        <p className="text-muted-foreground">Керування акаунтами та ролями</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Очікують</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активні</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Пошук користувачів..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
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
              <CardContent className="space-y-4">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {(u.firstName ?? "—") + " " + (u.lastName ?? "")}
                      </div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(u.id)}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Підтвердити
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(u.id)}>
                        <UserX className="mr-2 h-4 w-4" />
                        Відхилити
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Активні користувачі ({activeUsers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {(u.firstName ?? "—") + " " + (u.lastName ?? "")}
                      </div>

                      {u.role === "Admin" && (
                        <Badge variant="secondary">
                          <Shield className="mr-1 h-3 w-3" />
                          Адмін
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </div>

                  {u.role !== "Admin" && (
                    <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Зробити адміном
                    </Button>
                  )}
                </div>
              ))}

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
