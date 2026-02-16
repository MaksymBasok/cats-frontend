// src/shared/ui/containers/ContainerMap.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

type LocationEvent = {
  id: string | number;
  type: string;
  timestamp: string; // ISO
  metadata?: Record<string, unknown> | null;
};

interface ContainerMapProps {
  container?: { code?: string | null } | null;
  events: LocationEvent[];
  latitude?: number | null;
  longitude?: number | null;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function fmt6(n: number) {
  return n.toFixed(6);
}

export function ContainerMap({ container, events, latitude, longitude }: ContainerMapProps) {
  const locationEvents = useMemo(() => {
    return (events ?? [])
      .filter((e) => String(e.type) === "LOCATION_UPDATE")
      .map((e) => {
        const lat = num(e.metadata?.["latitude"]);
        const lng = num(e.metadata?.["longitude"]);
        return lat != null && lng != null
          ? { id: e.id, timestamp: e.timestamp, latitude: lat, longitude: lng }
          : null;
      })
      .filter(Boolean) as Array<{
      id: string | number;
      timestamp: string;
      latitude: number;
      longitude: number;
    }>;
  }, [events]);

  const current = useMemo(() => {
    // 1) explicit props
    if (latitude != null && longitude != null) return { latitude, longitude };

    // 2) latest location event
    if (locationEvents.length === 0) return null;

    const latest = [...locationEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return { latitude: latest.latitude, longitude: latest.longitude };
  }, [latitude, longitude, locationEvents]);

  if (!current && locationEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Дані про локацію відсутні</p>
        </CardContent>
      </Card>
    );
  }

  const code = container?.code ?? "";

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        {/* Current Location */}
        {current && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Поточна локація {code ? `(${code})` : ""}
            </h3>

            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Остання позиція</span>
              </div>

              <p className="text-sm text-muted-foreground">Широта: {fmt6(current.latitude)}</p>
              <p className="text-sm text-muted-foreground">Довгота: {fmt6(current.longitude)}</p>

              <a
                href={`https://www.google.com/maps?q=${current.latitude},${current.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Відкрити в Google Maps →
              </a>
            </div>
          </div>
        )}

        {/* Location History */}
        {locationEvents.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Історія локацій</h3>

            <div className="space-y-2">
              {locationEvents
                .slice()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((e) => (
                  <div key={String(e.id)} className="rounded-lg bg-muted p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {new Date(e.timestamp).toLocaleString("uk-UA")}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Відкрити
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmt6(e.latitude)}, {fmt6(e.longitude)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Інтерактивну карту (Leaflet/Google Maps) додамо, коли буде стабільний endpoint координат.
        </p>
      </CardContent>
    </Card>
  );
}
