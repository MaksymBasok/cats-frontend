import { api } from "./client";
import type { ProductTypeDto, CreateProductTypeDto, UpdateProductTypeDto } from "@/shared/types";

export async function getProductTypes(): Promise<ProductTypeDto[]> {
  return api<ProductTypeDto[]>("/product-types");
}

export async function getProductType(id: string): Promise<ProductTypeDto> {
  return api<ProductTypeDto>(`/product-types/${id}`);
}

export async function createProductType(data: CreateProductTypeDto): Promise<ProductTypeDto> {
  return api<ProductTypeDto>("/product-types", { method: "POST", body: data });
}

export async function updateProductType(id: string, data: UpdateProductTypeDto): Promise<ProductTypeDto> {
  return api<ProductTypeDto>(`/product-types/${id}`, { method: "PUT", body: data });
}

export async function deleteProductType(id: string): Promise<void> {
  return api<void>(`/product-types/${id}`, { method: "DELETE" });
}
