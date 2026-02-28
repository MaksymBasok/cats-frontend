"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Box, Users, Package, User, Shapes, FlaskConical, BellRing } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const mainLinks: NavItem[] = [
  { href: "/", label: "Тара", icon: Box },
  { href: "/products", label: "Продукти", icon: Package },
  { href: "/reminders", label: "Технологічні дати", icon: BellRing },
];

const adminLinks: NavItem[] = [
  { href: "/admin", label: "Користувачі", icon: Users },
  { href: "/product-types", label: "Типи продуктів", icon: FlaskConical },
  { href: "/container-types", label: "Типи тари", icon: Shapes },
];

const bottomLinks: NavItem[] = [{ href: "/profile", label: "Профіль", icon: User }];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === "/"
      ? pathname === "/" || pathname.startsWith("/containers")
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-primary/10 text-primary shadow-[var(--neon-glow)]"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:translate-x-1",
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive ? "" : "group-hover:scale-110")} />
      <span className={cn(isActive ? "font-semibold" : "")}>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden md:flex md:w-72 md:shrink-0 md:flex-col md:px-4 md:py-4">
      <div className="glass flex h-full flex-col rounded-[28px] px-4 py-5 shadow-[var(--luxury-shadow)]">
        <div className="border-b border-border/70 pb-4">
          <Link
            href="/"
            className="cats-logo-wrap flex w-full items-center gap-3 rounded-[24px] p-4 text-left transition-all hover:-translate-y-0.5"
          >
            <div className="rounded-2xl bg-gradient-to-br from-[#0891b2] to-[#22d3ee] p-2 shadow-md shadow-primary/20">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={36}
                height={36}
                className="cats-logo-glow h-9 w-9 object-contain"
                quality={100}
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="block text-xl font-bold tracking-tight gradient-text-animated">CATS</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Tracking System
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto">
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Основне
            </p>
            <div className="space-y-1.5">
              {mainLinks.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          {isAdmin ? (
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Адміністрування
              </p>
              <div className="space-y-1.5">
                {adminLinks.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border/70 pt-4">
          {bottomLinks.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    </aside>
  );
}
