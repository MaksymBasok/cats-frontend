// src/shared/api/products.ts
import { api } from "./client";
import type { ProductDto, CreateProductDto, UpdateProductDto } from "@/shared/types";

export async function getProducts(): Promise<ProductDto[]> {
  return api<ProductDto[]>("/products");
}

export async function searchProducts(params?: {
  search?: string;
  productTypeId?: number;
}): Promise<ProductDto[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.productTypeId !== undefined)
    query.set("productTypeId", String(params.productTypeId));

  const qs = query.toString();
  return api<ProductDto[]>(`/products/search${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: number): Promise<ProductDto> {
  return api<ProductDto>(`/products/${id}`);
}

export async function createProduct(data: CreateProductDto): Promise<ProductDto> {
  return api<ProductDto>("/products", { method: "POST", body: data });
}

export async function updateProduct(id: number, data: UpdateProductDto): Promise<ProductDto> {
  return api<ProductDto>(`/products/${id}`, { method: "PUT", body: data });
}

export async function deleteProduct(id: number): Promise<void> {
  return api<void>(`/products/${id}`, { method: "DELETE" });
}
