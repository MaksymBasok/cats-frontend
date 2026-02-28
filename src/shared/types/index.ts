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
  createdById?: string | null;
  createdByName?: string | null;
  updatedAt?: string | null;
  lastModifiedById?: string | null;
  lastModifiedByName?: string | null;
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
  productionDate: string;
  filledDate: string;
  expirationDate: string;
  emptiedDate: string | null;
  filledByUserId: string;
  filledByUserName?: string | null;
  emptiedByUserId: string | null;
  emptiedByUserName?: string | null;
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
  currentProductionDate: string | null;
  currentExpirationDate: string | null;
  currentFilledAt: string | null;
  meta: string | null;
  createdAt: string;
  createdById?: string | null;
  createdByName?: string | null;
  updatedAt?: string | null;
  lastModifiedById?: string | null;
  lastModifiedByName?: string | null;
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
  productionDate: string;
  expirationDate?: string | null;
}

export interface UpdateContainerFillDto {
  productId?: number | null;
  quantity: number;
  unit?: string | null;
  productionDate: string;
  expirationDate: string;
}

export interface SearchContainersParams {
  searchTerm?: string;
  containerTypeId?: number;
  status?: ContainerStatus;
  productionDate?: string;
  currentProductId?: number;
  currentProductTypeId?: number;
  lastProductId?: number;
  showExpired?: boolean;
  filledToday?: string;
}

export interface SearchContainerFillsParams {
  containerId?: number;
  productId?: number;
  productTypeId?: number;
  fromDate?: string;
  toDate?: string;
  onlyActive?: boolean;
}

// === Users ===
export interface UserDto {
  id: string;
  email: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  picture?: string | null;
  imageUrl?: string | null;
}

export interface CreateUserDto {
  email?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  picture?: string | null;
  imageUrl?: string | null;
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
