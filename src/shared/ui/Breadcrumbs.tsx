"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  containers: "Тара",
  admin: "Адмін",
  users: "Користувачі",
  products: "Продукти",
  "product-types": "Типи продуктів",
  "container-types": "Типи тари",
  reminders: "Нагадування",
  profile: "Профіль",
};

function labelOf(seg: string) {
  return LABELS[seg] || decodeURIComponent(seg);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return null;

  let acc = "";
  const items = parts.map((p) => {
    acc += `/${p}`;
    return { href: acc, label: labelOf(p) };
  });

  return (
    <nav aria-label="Навігаційна стежка" className="flex items-center gap-1 text-sm">
      <Link
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        href="/"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Головна</span>
      </Link>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={it.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground">{it.label}</span>
            ) : (
              <Link
                className="text-muted-foreground hover:text-foreground transition-colors"
                href={it.href}
              >
                {it.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
