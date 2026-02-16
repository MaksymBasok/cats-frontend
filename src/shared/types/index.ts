// src/shared/types/index.ts

// === Enums ===
export type ContainerStatus = "Empty" | "Full";
export type UserRole = "Operator" | "Admin";

// === Container Types ===
export interface ContainerTypeDto {
  id: number;
  name: string | null;
  codePrefix: string | null;
  defaultUnit: string | null;
  meta: string | null;
  createdAt: string;
  allowedProductTypeNames: string[] | null;
}

export interface CreateContainerTypeDto {
  name?: string | null;
  codePrefix?: string | null;
  defaultUnit?: string | null;
  meta?: string | null;
  allowedProductTypeIds?: number[] | null;
}

export interface UpdateContainerTypeDto {
  name?: string | null;
  codePrefix?: string | null;
  defaultUnit?: string | null;
  meta?: string | null;
  allowedProductTypeIds?: number[] | null;
}

// === Product Types ===
export interface ProductTypeDto {
  id: number;
  name: string | null;
  shelfLifeDays: number | null;
  shelfLifeHours: number | null;
  meta: string | null;
  createdAt: string;
}

export interface CreateProductTypeDto {
  name?: string | null;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
  meta?: string | null;
}

export interface UpdateProductTypeDto {
  name?: string | null;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
  meta?: string | null;
}

// === Products ===
export interface ProductDto {
  id: number;
  name: string | null;
  description: string | null;
  productTypeId: number;
  productTypeName: string | null;
  shelfLifeDays: number | null;
  shelfLifeHours: number | null;
  createdAt: string;
}

export interface CreateProductDto {
  name: string | null;
  description?: string | null;
  productTypeId: number;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
}

export interface UpdateProductDto {
  name: string | null;
  description?: string | null;
  productTypeId: number;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
}

// === Containers ===
export interface ContainerFillDto {
  id: number;

  containerId: number;
  containerCode: string | null;

  productId: number;
  productName: string | null;

  quantity: number;
  unit: string | null;

  productionDate: string; // date-time
  filledDate: string; // date-time
  expirationDate: string; // date-time

  emptiedDate: string | null; // date-time | null

  filledByUserId: string; // uuid
  emptiedByUserId: string | null; // uuid | null
}

export interface ContainerDto {
  id: number;

  code: string | null;
  name: string | null;

  volume: number;
  unit: string | null;

  containerTypeId: number;
  containerTypeName: string | null;

  status: ContainerStatus | null;

  currentProductId: number | null;
  currentProductName: string | null;
  currentQuantity: number | null;
  currentProductionDate: string | null; // date-time
  currentExpirationDate: string | null; // date-time
  currentFilledAt: string | null; // date-time

  meta: string | null;
  createdAt: string; // date-time
}

export interface CreateContainerDto {
  code?: string | null;
  name?: string | null;
  volume: number;
  unit?: string | null;
  containerTypeId: number;
  meta?: string | null;
}

export interface UpdateContainerDto {
  name?: string | null;
  volume: number;
  unit?: string | null;
  containerTypeId: number;
  meta?: string | null;
}

export interface FillContainerDto {
  productId: number;
  quantity: number;
  unit?: string | null;
  productionDate: string; // date-time
  expirationDate?: string | null; // date-time | null
}

export interface UpdateContainerFillDto {
  productId?: number | null;
  quantity: number;
  unit?: string | null;
  productionDate: string; // date-time
  expirationDate: string; // date-time (required in OpenAPI)
}

export interface SearchContainersParams {
  searchTerm?: string;
  containerTypeId?: number;
  status?: ContainerStatus;

  productionDate?: string; // date-time
  currentProductId?: number;
  currentProductTypeId?: number;
  lastProductId?: number;

  showExpired?: boolean;
  filledToday?: string; // date-time
}

export interface SearchContainerFillsParams {
  containerId?: number;
  productId?: number;
  productTypeId?: number;
  fromDate?: string; // date-time
  toDate?: string; // date-time
  onlyActive?: boolean;
}

// === Users ===
export interface UserDto {
  id: string; // uuid
  email: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface CreateUserDto {
  email?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserDto {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  role?: UserRole | null;
}

export interface UpdateProfileDto {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}

// === Invitations ===
export interface CreateInvitationDto {
  email?: string | null;
  role: UserRole;
}
