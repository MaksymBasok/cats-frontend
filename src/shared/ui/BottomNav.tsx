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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/70 backdrop-blur-xl md:hidden">
      <div
        className="grid items-stretch gap-1 px-2 py-2"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
      >
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
                "relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary shadow-[var(--neon-glow)]"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
              )}
            >
              {isActive ? (
                <span className="absolute left-1/2 top-0 h-1 w-8 -translate-x-1/2 rounded-b-full bg-primary" />
              ) : null}
              <link.icon className={cn("h-4 w-4", isActive ? "animate-icon-bounce" : "")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
