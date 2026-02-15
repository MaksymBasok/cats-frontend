import { api } from "./client";
import type { ProductDto, CreateProductDto, UpdateProductDto } from "@/shared/types";

export async function getProducts(): Promise<ProductDto[]> {
  return api<ProductDto[]>("/products");
}

export async function searchProducts(search?: string, productTypeId?: string): Promise<ProductDto[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (productTypeId) query.set("productTypeId", productTypeId);
  const qs = query.toString();
  return api<ProductDto[]>(`/products/search${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: string): Promise<ProductDto> {
  return api<ProductDto>(`/products/${id}`);
}

export async function createProduct(data: CreateProductDto): Promise<ProductDto> {
  return api<ProductDto>("/products", { method: "POST", body: data });
}

export async function updateProduct(id: string, data: UpdateProductDto): Promise<ProductDto> {
  return api<ProductDto>(`/products/${id}`, { method: "PUT", body: data });
}

export async function deleteProduct(id: string): Promise<void> {
  return api<void>(`/products/${id}`, { method: "DELETE" });
}
