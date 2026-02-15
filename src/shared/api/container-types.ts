import { api } from "./client";
import type { ContainerTypeDto, CreateContainerTypeDto, UpdateContainerTypeDto } from "@/shared/types";

export async function getContainerTypes(): Promise<ContainerTypeDto[]> {
  return api<ContainerTypeDto[]>("/container-types");
}

export async function getContainerType(id: string): Promise<ContainerTypeDto> {
  return api<ContainerTypeDto>(`/container-types/${id}`);
}

export async function createContainerType(data: CreateContainerTypeDto): Promise<ContainerTypeDto> {
  return api<ContainerTypeDto>("/container-types", { method: "POST", body: data });
}

export async function updateContainerType(id: string, data: UpdateContainerTypeDto): Promise<ContainerTypeDto> {
  return api<ContainerTypeDto>(`/container-types/${id}`, { method: "PUT", body: data });
}

export async function deleteContainerType(id: string): Promise<void> {
  return api<void>(`/container-types/${id}`, { method: "DELETE" });
}
