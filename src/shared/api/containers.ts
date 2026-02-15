import { api } from "./client";
import type {
  ContainerDto,
  CreateContainerDto,
  UpdateContainerDto,
  FillContainerDto,
  UpdateContainerFillDto,
  ContainerFillDto,
  SearchContainersParams,
} from "@/shared/types";

export async function getContainers(): Promise<ContainerDto[]> {
  return api<ContainerDto[]>("/containers");
}

export async function searchContainers(
  params: SearchContainersParams
): Promise<ContainerDto[]> {
  const query = new URLSearchParams();
  if (params.searchTerm) query.set("SearchTerm", params.searchTerm);
  if (params.containerTypeId) query.set("ContainerTypeId", params.containerTypeId);
  if (params.status !== undefined) query.set("Status", String(params.status));
  if (params.productionDate) query.set("ProductionDate", params.productionDate);
  if (params.currentProductId) query.set("CurrentProductId", params.currentProductId);
  if (params.currentProductTypeId) query.set("CurrentProductTypeId", params.currentProductTypeId);
  if (params.lastProductId) query.set("LastProductId", params.lastProductId);
  if (params.showExpired !== undefined) query.set("ShowExpired", String(params.showExpired));
  if (params.filledToday !== undefined) query.set("FilledToday", String(params.filledToday));
  const qs = query.toString();
  return api<ContainerDto[]>(`/containers/search${qs ? `?${qs}` : ""}`);
}

export async function getContainer(id: string): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}`);
}

export async function getContainerByCode(code: string): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/code/${code}`);
}

export async function createContainer(data: CreateContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>("/containers", { method: "POST", body: data });
}

export async function updateContainer(id: string, data: UpdateContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}`, { method: "PUT", body: data });
}

export async function deleteContainer(id: string): Promise<void> {
  return api<void>(`/containers/${id}`, { method: "DELETE" });
}

export async function fillContainer(id: string, data: FillContainerDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/fill`, { method: "POST", body: data });
}

export async function emptyContainer(id: string): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/empty`, { method: "POST" });
}

export async function updateContainerFill(id: string, data: UpdateContainerFillDto): Promise<ContainerDto> {
  return api<ContainerDto>(`/containers/${id}/fill`, { method: "PUT", body: data });
}

export async function getContainerHistory(id: string): Promise<ContainerFillDto[]> {
  return api<ContainerFillDto[]>(`/containers/${id}/history`);
}
