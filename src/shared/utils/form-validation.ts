import { normalizeUnit } from "@/shared/constants/units";
import type {
  CreateContainerDto,
  CreateContainerTypeDto,
  CreateInvitationDto,
  CreateProductDto,
  CreateProductTypeDto,
  CreateUserDto,
  FillContainerDto,
  UpdateContainerDto,
  UpdateContainerFillDto,
  UpdateContainerTypeDto,
  UpdateProductDto,
  UpdateProductTypeDto,
  UpdateProfileDto,
  UserRole,
} from "@/shared/types";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: string[] };

type ContainerInput = {
  code?: string;
  name: string;
  volume: string;
  unit: string;
  containerTypeId: string;
  meta?: string;
};

type ProductInput = {
  name: string;
  description?: string;
  productTypeId: string;
  shelfLifeDays: string;
  shelfLifeHours: string;
};

type ProductTypeInput = {
  name: string;
  shelfLifeDays: string;
  shelfLifeHours: string;
  meta?: string;
};

type ContainerTypeInput = {
  name: string;
  codePrefix?: string;
  defaultUnit: string;
  meta?: string;
  allowedProductTypeIds?: number[];
};

type FillInput = {
  productId: string;
  quantity: string;
  unit: string;
  productionDate: string;
  expirationDate: string;
  requireExpirationDate?: boolean;
};

type InvitationInput = {
  email: string;
  role: UserRole;
};

type CreateUserInput = {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
};

type ProfileInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

function fail<T>(issues: string[]): ValidationResult<T> {
  return { success: false, issues };
}

function ok<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

function trimOptional(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonNegativeInteger(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return "invalid";
  }

  return parsed;
}

function isFutureDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Number.isFinite(date.getTime()) && date.getTime() > today.getTime();
}

function isAfter(left: string, right: string): boolean {
  const leftDate = new Date(`${left}T00:00:00`);
  const rightDate = new Date(`${right}T00:00:00`);
  if (!Number.isFinite(leftDate.getTime()) || !Number.isFinite(rightDate.getTime())) {
    return false;
  }
  return leftDate.getTime() > rightDate.getTime();
}

function validateEmail(email: string, issues: string[]): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    issues.push("Електронна пошта є обов'язковою.");
    return null;
  }

  if (trimmed.length > 200) {
    issues.push("Електронна пошта має містити не більше 200 символів.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    issues.push("Вкажіть коректну електронну пошту.");
  }

  return trimmed;
}

function validatePersonField(
  value: string,
  label: string,
  issues: string[],
  required = false,
): string | null {
  const trimmed = value.trim();

  if (required && !trimmed) {
    issues.push(`${label} є обов'язковим.`);
    return null;
  }

  if (!trimmed) return null;

  if (trimmed.length > 100) {
    issues.push(`${label} має містити не більше 100 символів.`);
  }

  return trimmed;
}

export function validateCreateContainer(input: ContainerInput): ValidationResult<CreateContainerDto> {
  const issues: string[] = [];
  const code = trimOptional(input.code);
  const name = input.name.trim();
  const volume = parsePositiveNumber(input.volume);
  const unit = normalizeUnit(input.unit);
  const containerTypeId = Number(input.containerTypeId);

  if (code && code.length > 50) {
    issues.push("Код тари має містити не більше 50 символів.");
  }
  if (!name) {
    issues.push("Назва тари є обов'язковою.");
  } else if (name.length > 100) {
    issues.push("Назва тари має містити не більше 100 символів.");
  }
  if (volume == null) {
    issues.push("Об'єм має бути більшим за 0.");
  }
  if (!unit) {
    issues.push("Одиниця є обов'язковою.");
  } else if (unit.length > 20) {
    issues.push("Одиниця має містити не більше 20 символів.");
  }
  if (!Number.isFinite(containerTypeId) || containerTypeId <= 0) {
    issues.push("Оберіть тип тари.");
  }

  if (issues.length > 0) return fail(issues);

  return ok({
    ...(code ? { code } : {}),
    name,
    volume: volume!,
    unit,
    containerTypeId,
    meta: trimOptional(input.meta),
  });
}

export function validateUpdateContainer(input: ContainerInput): ValidationResult<UpdateContainerDto> {
  const result = validateCreateContainer(input);
  if (!result.success) return result;

  const { code, ...data } = result.data;
  void code;
  return ok(data);
}

export function validateFillContainer(input: FillInput): ValidationResult<FillContainerDto> {
  const issues: string[] = [];
  const productId = Number(input.productId);
  const quantity = parsePositiveNumber(input.quantity);
  const unit = normalizeUnit(input.unit);
  const productionDate = input.productionDate.trim();
  const expirationDate = input.expirationDate.trim();

  if (!Number.isFinite(productId) || productId <= 0) {
    issues.push("Оберіть продукт.");
  }
  if (quantity == null) {
    issues.push("Кількість має бути більшою за 0.");
  }
  if (!unit) {
    issues.push("Одиниця є обов'язковою.");
  } else if (unit.length > 50) {
    issues.push("Одиниця має містити не більше 50 символів.");
  }
  if (!productionDate) {
    issues.push("Вкажіть дату виробництва.");
  } else if (isFutureDate(productionDate)) {
    issues.push("Дата виробництва не може бути в майбутньому.");
  }
  if (input.requireExpirationDate && !expirationDate) {
    issues.push("Вкажіть термін придатності.");
  }
  if (expirationDate && productionDate && !isAfter(expirationDate, productionDate)) {
    issues.push("Термін придатності має бути пізніше за дату виробництва.");
  }

  if (issues.length > 0) return fail(issues);

  return ok({
    productId,
    quantity: quantity!,
    unit,
    productionDate,
    expirationDate: expirationDate || null,
  });
}

export function validateUpdateContainerFill(input: FillInput): ValidationResult<UpdateContainerFillDto> {
  const result = validateFillContainer({
    ...input,
    requireExpirationDate: true,
  });
  if (!result.success) return result;

  return ok({
    ...result.data,
    expirationDate: result.data.expirationDate ?? "",
  });
}

export function validateCreateProduct(input: ProductInput): ValidationResult<CreateProductDto> {
  const issues: string[] = [];
  const name = input.name.trim();
  const description = trimOptional(input.description);
  const productTypeId = Number(input.productTypeId);
  const shelfLifeDays = parseNonNegativeInteger(input.shelfLifeDays);
  const shelfLifeHours = parseNonNegativeInteger(input.shelfLifeHours);

  if (!name) {
    issues.push("Назва продукту є обов'язковою.");
  } else if (name.length > 200) {
    issues.push("Назва продукту має містити не більше 200 символів.");
  }
  if (description && description.length > 500) {
    issues.push("Опис має містити не більше 500 символів.");
  }
  if (!Number.isFinite(productTypeId) || productTypeId <= 0) {
    issues.push("Оберіть тип продукту.");
  }
  if (shelfLifeDays === "invalid") {
    issues.push("Термін у днях не може бути від'ємним.");
  }
  if (shelfLifeHours === "invalid") {
    issues.push("Термін у годинах не може бути від'ємним.");
  }

  if (issues.length > 0) return fail(issues);

  const normalizedShelfLifeDays = shelfLifeDays === "invalid" ? null : shelfLifeDays;
  const normalizedShelfLifeHours = shelfLifeHours === "invalid" ? null : shelfLifeHours;

  return ok({
    name,
    description,
    productTypeId,
    shelfLifeDays: normalizedShelfLifeDays,
    shelfLifeHours: normalizedShelfLifeHours,
  });
}

export function validateUpdateProduct(input: ProductInput): ValidationResult<UpdateProductDto> {
  return validateCreateProduct(input);
}

export function validateProductType(
  input: ProductTypeInput,
): ValidationResult<CreateProductTypeDto | UpdateProductTypeDto> {
  const issues: string[] = [];
  const name = input.name.trim();
  const shelfLifeDays = parseNonNegativeInteger(input.shelfLifeDays);
  const shelfLifeHours = parseNonNegativeInteger(input.shelfLifeHours);

  if (!name) {
    issues.push("Назва типу продукту є обов'язковою.");
  } else if (name.length > 100) {
    issues.push("Назва типу продукту має містити не більше 100 символів.");
  }
  if (shelfLifeDays === "invalid") {
    issues.push("Термін у днях не може бути від'ємним.");
  }
  if (shelfLifeHours === "invalid") {
    issues.push("Термін у годинах не може бути від'ємним.");
  }

  if (issues.length > 0) return fail(issues);

  const normalizedShelfLifeDays = shelfLifeDays === "invalid" ? null : shelfLifeDays;
  const normalizedShelfLifeHours = shelfLifeHours === "invalid" ? null : shelfLifeHours;

  return ok({
    name,
    shelfLifeDays: normalizedShelfLifeDays,
    shelfLifeHours: normalizedShelfLifeHours,
    meta: trimOptional(input.meta),
  });
}

export function validateContainerType(
  input: ContainerTypeInput,
): ValidationResult<CreateContainerTypeDto | UpdateContainerTypeDto> {
  const issues: string[] = [];
  const name = input.name.trim();
  const defaultUnit = normalizeUnit(input.defaultUnit);

  if (!name) {
    issues.push("Назва типу тари є обов'язковою.");
  } else if (name.length > 100) {
    issues.push("Назва типу тари має містити не більше 100 символів.");
  }
  if (!defaultUnit) {
    issues.push("Одиниця за замовчуванням є обов'язковою.");
  } else if (defaultUnit.length > 20) {
    issues.push("Одиниця за замовчуванням має містити не більше 20 символів.");
  }

  if (issues.length > 0) return fail(issues);

  return ok({
    name,
    codePrefix: trimOptional(input.codePrefix),
    defaultUnit,
    meta: trimOptional(input.meta),
    allowedProductTypeIds: input.allowedProductTypeIds ?? [],
  });
}

export function validateInvitation(input: InvitationInput): ValidationResult<CreateInvitationDto> {
  const issues: string[] = [];
  const email = validateEmail(input.email, issues);

  if (issues.length > 0) return fail(issues);

  return ok({
    email,
    role: input.role,
  });
}

export function validateCreateUser(input: CreateUserInput): ValidationResult<CreateUserDto> {
  const issues: string[] = [];
  const email = validateEmail(input.email, issues);
  const firstName = validatePersonField(input.firstName, "Ім'я", issues, true);
  const middleName = validatePersonField(input.middleName ?? "", "По батькові", issues, false);
  const lastName = validatePersonField(input.lastName, "Прізвище", issues, true);

  if (issues.length > 0) return fail(issues);

  return ok({
    email,
    firstName,
    middleName,
    lastName,
    role: input.role,
    isActive: input.isActive,
  });
}

export function validateProfile(input: ProfileInput): ValidationResult<UpdateProfileDto> {
  const issues: string[] = [];
  const firstName = validatePersonField(input.firstName, "Ім'я", issues, true);
  const middleName = validatePersonField(input.middleName ?? "", "По батькові", issues, false);
  const lastName = validatePersonField(input.lastName, "Прізвище", issues, true);

  if (issues.length > 0) return fail(issues);

  return ok({
    firstName,
    middleName,
    lastName,
  });
}
