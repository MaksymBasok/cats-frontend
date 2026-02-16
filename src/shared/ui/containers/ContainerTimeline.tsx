// src/shared/ui/containers/ContainerTimeline.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Package, MapPin, CheckCircle, User, Truck } from "lucide-react";


export type TimelineEventType =
  | "STATUS_CHANGE"
  | "LOCATION_UPDATE"
  | "OWNERSHIP_TRANSFER"
  | "CREATED"
  | "UPDATED"
  | "SCANNED"
  | "FILL"
  | "EMPTY"
  | "EDIT_FILL";

export type TimelineEvent = {
  id: string | number;
  type: TimelineEventType | string;
  timestamp: string; // ISO
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  performedBy?: { id?: string | null; name?: string | null } | null;
};

interface ContainerTimelineProps {
  events: TimelineEvent[];
}

const eventIcons: Record<string, React.ElementType> = {
  STATUS_CHANGE: Package,
  LOCATION_UPDATE: MapPin,
  OWNERSHIP_TRANSFER: User,
  CREATED: CheckCircle,
  UPDATED: Package,
  SCANNED: Truck,
  FILL: Package,
  EMPTY: Package,
  EDIT_FILL: Package,
};

const eventBadgeClasses: Record<string, string> = {
  STATUS_CHANGE: "bg-blue-500 text-white",
  LOCATION_UPDATE: "bg-emerald-600 text-white",
  OWNERSHIP_TRANSFER: "bg-purple-600 text-white",
  CREATED: "bg-muted text-foreground",
  UPDATED: "bg-amber-500 text-white",
  SCANNED: "bg-orange-500 text-white",
  FILL: "bg-blue-500 text-white",
  EMPTY: "bg-gray-600 text-white",
  EDIT_FILL: "bg-amber-500 text-white",
};

function humanizeType(t: string) {
  const map: Record<string, string> = {
    STATUS_CHANGE: "Зміна статусу",
    LOCATION_UPDATE: "Оновлення локації",
    OWNERSHIP_TRANSFER: "Передача власника",
    CREATED: "Створено",
    UPDATED: "Оновлено",
    SCANNED: "Сканування",
    FILL: "Заповнення",
    EMPTY: "Спорожнення",
    EDIT_FILL: "Редагування вмісту",
  };
  return map[t] ?? t.replace(/_/g, " ").toLowerCase();
}

function safeDate(d: string) {
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    return x;
  } catch {
    return null;
  }
}

export function ContainerTimeline({ events }: ContainerTimelineProps) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = safeDate(a.timestamp)?.getTime() ?? 0;
      const db = safeDate(b.timestamp)?.getTime() ?? 0;
      return db - da;
    });
  }, [events]);

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Подій поки немає</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative space-y-4">
          {/* вертикальна лінія */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {sorted.map((event) => {
            const type = String(event.type);
            const Icon = eventIcons[type] ?? Package;
            const badgeClass = eventBadgeClasses[type] ?? "bg-muted text-foreground";
            const dt = safeDate(event.timestamp);

            return (
              <div key={String(event.id)} className="relative flex items-start gap-4">
                {/* Icon bubble */}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${badgeClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {humanizeType(type)}
                      </h4>
                      <Badge variant="secondary" className="text-[11px]">
                        {type}
                      </Badge>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {dt ? format(dt, "dd.MM.yyyy HH:mm", { locale: uk }) : "—"}
                    </span>
                  </div>

                  {event.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  ) : null}

                  {event.metadata && Object.keys(event.metadata).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {event.performedBy?.name ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Виконав(ла): {event.performedBy.name}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
