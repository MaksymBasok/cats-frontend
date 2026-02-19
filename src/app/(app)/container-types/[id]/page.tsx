"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContainerType } from "@/shared/api/container-types";
import { searchContainers } from "@/shared/api/containers";
import type { ContainerDto, ContainerTypeDto } from "@/shared/types";
import { showErrorToast } from "@/shared/utils/errors";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

function statusLabel(status: string | null | undefined): string {
  if (status === "Full") return "Full";
  if (status === "Empty") return "Empty";
  return "-";
}

export default function ContainerTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = safeParam(params.id as string | string[] | undefined);
  const parsedId = Number(id);
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0;

  const [item, setItem] = useState<ContainerTypeDto | null>(null);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasValidId) {
      setItem(null);
      setContainers([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [typeItem, typeContainers] = await Promise.all([
        getContainerType(String(parsedId)),
        searchContainers({ containerTypeId: parsedId }),
      ]);
      setItem(typeItem);
      setContainers(typeContainers);
    } catch (error) {
      setItem(null);
      setContainers([]);
      setLoadError("Failed to load container type data.");
      showErrorToast(error, "Failed to load container type data");
    } finally {
      setLoading(false);
    }
  }, [hasValidId, parsedId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasValidId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Invalid container type ID.</p>
        <Button asChild variant="outline">
          <Link href="/container-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to container types
          </Link>
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-destructive">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
            <Button asChild variant="ghost">
              <Link href="/container-types">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Container type not found.</p>
        <Button asChild variant="outline">
          <Link href="/container-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to container types
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href="/container-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{item.name || `Type #${item.id}`}</h1>
        <Badge variant="secondary">#{item.id}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Prefix: <span className="font-medium">{item.codePrefix || "-"}</span>
          </p>
          <p>
            Default unit: <span className="font-medium">{item.defaultUnit || "-"}</span>
          </p>
          <p>
            Allowed product types:{" "}
            <span className="font-medium">{item.allowedProductTypeNames?.join(", ") || "all"}</span>
          </p>
          {item.meta && (
            <p>
              Meta: <span className="font-medium">{item.meta}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Containers of this type ({containers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {containers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No containers found for this type.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow
                    key={container.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/containers/${encodeURIComponent(container.code ?? String(container.id))}`)
                    }
                  >
                    <TableCell>{container.code ?? `#${container.id}`}</TableCell>
                    <TableCell>{container.name || "-"}</TableCell>
                    <TableCell>
                      {container.volume} {container.unit || ""}
                    </TableCell>
                    <TableCell>{statusLabel(container.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
