"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Save, LogOut, UserCircle } from "lucide-react";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { useAuth } from "@/shared/auth/AuthProvider";
import { updateProfile } from "@/shared/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateProfile } from "@/shared/utils/form-validation";

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
    const extended = user as (typeof user & {
      avatarUrl?: string | null;
      picture?: string | null;
      imageUrl?: string | null;
    }) | null;

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

    const profileResult = validateProfile({
      firstName,
      middleName,
      lastName,
    });

    if (!profileResult.success) {
      showValidationToast(profileResult.issues);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(profileResult.data);
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
      <div className="mx-auto max-w-3xl">
        <div className="stylish-card rounded-[28px] border border-primary/10 p-6">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-6 h-24 rounded-[24px] bg-muted" />
          <div className="mt-4 h-10 rounded bg-muted" />
          <div className="mt-3 h-10 rounded bg-muted" />
          <div className="mt-3 h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20 md:pb-6">
      <section className="glass relative overflow-hidden rounded-[28px] border border-primary/10 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Аватар"
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[var(--neon-glow)]">
                <UserCircle className="h-7 w-7" />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Профіль</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{user.email}</h1>
              <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {roleName}
              </span>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 rounded-xl text-destructive hover:text-destructive"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </Button>
        </div>
      </section>

      <div className="stylish-card rounded-[28px] border border-primary/10 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block" htmlFor="firstName">
              Ім’я
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-11 rounded-2xl border-border/70 bg-background/70"
            />
          </div>

          <div>
            <Label className="mb-1.5 block" htmlFor="middleName">
              По батькові
            </Label>
            <Input
              id="middleName"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="h-11 rounded-2xl border-border/70 bg-background/70"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block" htmlFor="lastName">
              Прізвище
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-11 rounded-2xl border-border/70 bg-background/70"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2" type="button">
            <Save className="h-4 w-4" />
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </div>
    </div>
  );
}
