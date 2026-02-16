"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Package, Shield, User, BellRing, Shapes, FlaskConical } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { cn } from "@/lib/utils";

const operatorLinks = [
  { href: "/", label: "Тара", icon: Box },
  { href: "/products", label: "Продукти", icon: Package },
  { href: "/reminders", label: "Дати", icon: BellRing },
  { href: "/profile", label: "Профіль", icon: User },
];

const adminLinks = [
  { href: "/", label: "Тара", icon: Box },
  { href: "/products", label: "Продукти", icon: Package },
  { href: "/reminders", label: "Дати", icon: BellRing },
  { href: "/admin", label: "Адмін", icon: Shield },
  { href: "/container-types", label: "Тара+", icon: Shapes },
  { href: "/product-types", label: "Типи", icon: FlaskConical },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : operatorLinks;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden">
      <div className="flex items-stretch justify-around">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/" || pathname.startsWith("/containers")
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-[10px] transition-all",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm dark:bg-brand-orange dark:text-brand-navy"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
