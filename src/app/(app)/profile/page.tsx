"use client";

import { useAuth } from "@/shared/auth/AuthProvider";
import { updateProfile } from "@/shared/api/users";
import { UserRole } from "@/shared/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, LogOut, UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName, middleName: middleName || null, lastName });
      await refreshProfile();
      toast.success("Профіль оновлено");
    } catch {
      toast.error("Не вдалося оновити профіль");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleName = user?.role === UserRole.Admin ? "Адміністратор" : "Оператор";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Профіль
      </h1>

      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy/10">
            <UserCircle className="h-6 w-6 text-brand-navy" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {user?.email}
            </p>
            <span className="inline-block mt-0.5 rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-medium text-brand-navy">
              {roleName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              {"Ім'я"}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              По батькові
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Прізвище
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="h-4 w-4" />
            {saving ? "Зберігаємо..." : "Зберегти"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>
      </div>
    </div>
  );
}
