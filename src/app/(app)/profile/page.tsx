// src/app/(app)/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { showErrorToast } from "@/shared/utils/errors";
import Image from "next/image";
import { Save, LogOut, UserCircle } from "lucide-react";

import { useAuth } from "@/shared/auth/AuthProvider";
import { updateProfile } from "@/shared/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setMiddleName(user?.middleName ?? "");
    setLastName(user?.lastName ?? "");
  }, [user?.firstName, user?.middleName, user?.lastName]);

  const roleName = useMemo(() => {
    if (!user) return "";
    return user.role === "Admin" ? "Адміністратор" : "Оператор";
  }, [user]);

  const avatarUrl = useMemo(() => {
    const extended = user as (typeof user & { avatarUrl?: string | null; picture?: string | null; imageUrl?: string | null }) | null;
    return extended?.avatarUrl || extended?.picture || extended?.imageUrl || null;
  }, [user]);

  const dirty = useMemo(() => {
    return (
      firstName !== (user?.firstName ?? "") ||
      middleName !== (user?.middleName ?? "") ||
      lastName !== (user?.lastName ?? "")
    );
  }, [firstName, middleName, lastName, user?.firstName, user?.middleName, user?.lastName]);

  const handleSave = async () => {
    if (!user) return;

    const payload = {
      firstName: firstName.trim() || null,
      middleName: middleName.trim() || null,
      lastName: lastName.trim() || null,
    };

    setSaving(true);
    try {
      await updateProfile(payload);
      await refreshProfile();
      toast.success("Профіль оновлено");
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити профіль");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Профіль</h1>
        <div className="mt-4 rounded-xl border border-border bg-card p-6">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-4 h-10 rounded bg-muted" />
          <div className="mt-3 h-10 rounded bg-muted" />
          <div className="mt-3 h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Профіль</h1>

      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Аватар"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy/10 dark:bg-brand-orange/20">
              <UserCircle className="h-6 w-6 text-brand-navy dark:text-brand-orange" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-card-foreground">{user.email}</p>
            <span className="mt-0.5 inline-block rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-semibold text-brand-navy dark:bg-brand-orange/20 dark:text-brand-orange">
              {roleName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label className="mb-1 block" htmlFor="firstName">
              Ім’я
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block" htmlFor="middleName">
              По батькові
            </Label>
            <Input
              id="middleName"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block" htmlFor="lastName">
              Прізвище
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="gap-2"
            type="button"
          >
            <Save className="h-4 w-4" />
            {saving ? "Збереження..." : "Зберегти"}
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </Button>
        </div>
      </div>
    </div>
  );
}
