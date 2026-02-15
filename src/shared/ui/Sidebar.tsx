"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Users,
  Package,
  Tags,
  Container,
  Clock,
  User,
} from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const mainLinks: NavItem[] = [
  { href: "/", label: "Тара", icon: Box },
];

const adminLinks: NavItem[] = [
  { href: "/admin/users", label: "Користувачі", icon: Users },
  { href: "/admin/products", label: "Продукти", icon: Package },
  { href: "/admin/product-types", label: "Типи продуктів", icon: Tags },
  { href: "/admin/container-types", label: "Типи тари", icon: Container },
  { href: "/admin/reminders", label: "Нагадування", icon: Clock },
];

const bottomLinks: NavItem[] = [
  { href: "/profile", label: "Профіль", icon: User },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === "/"
      ? pathname === "/" || pathname.startsWith("/containers")
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-brand-navy text-primary-foreground font-medium"
          : "text-foreground hover:bg-muted"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-card">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Головне
        </p>
        {mainLinks.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isAdmin && (
          <>
            <p className="mb-1 mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Адміністрування
            </p>
            {adminLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </div>

      <div className="border-t border-border px-3 py-3">
        {bottomLinks.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}
