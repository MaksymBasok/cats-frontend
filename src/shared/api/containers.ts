// src/shared/api/containers.ts
import { api } from "./client";
import type {
  ContainerDto,
  CreateContainerDto,
  UpdateContainerDto,
  FillContainerDto,
  UpdateContainerFillDto,
  ContainerFillDto,
  SearchContainersParams,
  SearchContainerFillsParams,
} from "@/shared/types";

export async function getContainers(): Promise<ContainerDto[]> {
  return api<ContainerDto[]>("/containers");
}

export async function searchContainers(params: SearchContainersParams): Promise<ContainerDto[]> {
  const query = new URLSearchParams();

  if (params.searchTerm) query.set("SearchTerm", params.searchTerm);

  if (params.containerTypeId !== undefined) query.set("ContainerTypeId", String(params.containerTypeId));

  // OpenAPI: "Empty" | "Full"
  if (params.status !== undefined) query.set("Status", params.status);

  if (params.productionDate) query.set("ProductionDate", params.productionDate);

  if (params.currentProductId !== undefined) query.set("CurrentProductId", String(params.currentProductId));

  if (params.currentProductTypeId !== undefined)
    query.set("CurrentProductTypeId", String(params.currentProductTypeId));

  if (params.lastProductId !== undefined) query.set("LastProductId", String(params.lastProductId));

  if (params.showExpired !== undefined) query.set("ShowExpired", String(params.showExpired));

  // OpenAPI expects FilledToday as date-time (string)
  if (params.filledToday) query.set("FilledToday", params.filledToday);

  const qs = query.toString();
  return api<ContainerDto[]>(`/containers/search${qs ? `?${qs}` : ""}`);
}

export async function getContainer(id: number): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}`);
}

export async function getContainerByCode(code: string): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/code/${encodeURIComponent(code)}`);
}

export async function createContainer(data: CreateContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>("/containers", { method: "POST", body: data });
}

export async function updateContainer(id: number, data: UpdateContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}`, { method: "PUT", body: data });
}

export async function deleteContainer(id: number): Promise<void> {
  return api<void>(`/containers/${id}`, { method: "DELETE" });
}

export async function fillContainer(id: number, data: FillContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/fill`, { method: "POST", body: data });
}

export async function emptyContainer(id: number): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/empty`, { method: "POST" });
}

export async function updateContainerFill(id: number, data: UpdateContainerFillDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/fill`, { method: "PUT", body: data });
}

export async function getContainerHistory(id: number): Promise<ContainerFillDto[]> {
  return api<ContainerFillDto[]>(`/containers/${id}/history`);
}

// Optional helper: search fills
export async function searchContainerFills(params: SearchContainerFillsParams): Promise<ContainerFillDto[]> {
  const query = new URLSearchParams();

  if (params.productId !== undefined) query.set("ProductId", String(params.productId));
  if (params.productTypeId !== undefined) query.set("ProductTypeId", String(params.productTypeId));
  if (params.containerId !== undefined) query.set("ContainerId", String(params.containerId));
  if (params.fromDate) query.set("FromDate", params.fromDate);
  if (params.toDate) query.set("ToDate", params.toDate);
  if (params.onlyActive !== undefined) query.set("OnlyActive", String(params.onlyActive));

  const qs = query.toString();
  return api<ContainerFillDto[]>(`/containers/fills/search${qs ? `?${qs}` : ""}`);
}
