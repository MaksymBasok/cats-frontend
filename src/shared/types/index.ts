// === Enums ===

export enum ContainerStatus {
  Empty = 0,
  Full = 1,
}

export enum UserRole {
  Admin = 0,
  Operator = 1,
}

// === Container Types ===

export interface ContainerTypeDto {
  id: string;
  name: string;
  codePrefix: string;
  defaultUnit: string;
  meta: string | null;
  allowedProductTypeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContainerTypeDto {
  name: string;
  codePrefix: string;
  defaultUnit: string;
  meta?: string | null;
  allowedProductTypeIds: string[];
}

export interface UpdateContainerTypeDto {
  name: string;
  codePrefix: string;
  defaultUnit: string;
  meta?: string | null;
  allowedProductTypeIds: string[];
}

// === Product Types ===

export interface ProductTypeDto {
  id: string;
  name: string;
  shelfLifeDays: number | null;
  shelfLifeHours: number | null;
  meta: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductTypeDto {
  name: string;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
  meta?: string | null;
}

export interface UpdateProductTypeDto {
  name: string;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
  meta?: string | null;
}

// === Products ===

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  productTypeId: string;
  productTypeName: string;
  shelfLifeDays: number | null;
  shelfLifeHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  productTypeId: string;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
}

export interface UpdateProductDto {
  name: string;
  description?: string | null;
  productTypeId: string;
  shelfLifeDays?: number | null;
  shelfLifeHours?: number | null;
}

// === Containers ===

export interface ContainerFillDto {
  id: string;
  productId: string;
  productName: string;
  productTypeName: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expirationDate: string | null;
  filledAt: string;
  filledByUserName: string;
  emptiedAt: string | null;
  emptiedByUserName: string | null;
}

export interface ContainerDto {
  id: string;
  code: string;
  name: string;
  volume: number;
  unit: string;
  containerTypeId: string;
  containerTypeName: string;
  status: ContainerStatus;
  meta: string | null;
  currentFill: ContainerFillDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContainerDto {
  code?: string | null;
  name: string;
  volume: number;
  unit: string;
  containerTypeId: string;
  meta?: string | null;
}

export interface UpdateContainerDto {
  name: string;
  volume: number;
  unit: string;
  containerTypeId: string;
  meta?: string | null;
}

export interface FillContainerDto {
  productId: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expirationDate?: string | null;
}

export interface UpdateContainerFillDto {
  productId: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expirationDate?: string | null;
}

export interface SearchContainersParams {
  searchTerm?: string;
  containerTypeId?: string;
  status?: ContainerStatus;
  productionDate?: string;
  currentProductId?: string;
  currentProductTypeId?: string;
  lastProductId?: string;
  showExpired?: boolean;
  filledToday?: boolean;
}

export interface SearchContainerFillsParams {
  containerId?: string;
  productId?: string;
  productTypeId?: string;
  fromDate?: string;
  toDate?: string;
}

// === Users ===

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  role?: UserRole;
}

export interface UpdateProfileDto {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

// === Invitations ===

export interface InvitationDto {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  isUsed: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface CreateInvitationDto {
  email: string;
  role: UserRole;
}
