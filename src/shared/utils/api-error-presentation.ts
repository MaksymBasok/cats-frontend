type ErrorPayload = {
  detail?: unknown;
  title?: unknown;
  message?: unknown;
  raw?: unknown;
  errors?: Record<string, string[] | string | undefined>;
};

type ResolvedMessage = {
  title: string;
  detail?: string;
};

export type ApiErrorPresentation = {
  title: string | null;
  details: string[];
};

const FIELD_LABELS: Record<string, string> = {
  AllowedProductTypeIds: "Дозволені типи продуктів",
  Code: "Код тари",
  ContainerTypeId: "Тип тари",
  DefaultUnit: "Одиниця за замовчуванням",
  Description: "Опис",
  Email: "Електронна пошта",
  ExpirationDate: "Термін придатності",
  FirstName: "Ім'я",
  LastName: "Прізвище",
  MiddleName: "По батькові",
  Name: "Назва",
  ProductId: "Продукт",
  ProductTypeId: "Тип продукту",
  ProductionDate: "Дата виробництва",
  Quantity: "Кількість",
  Role: "Роль",
  ShelfLifeDays: "Термін у днях",
  ShelfLifeHours: "Термін у годинах",
  Unit: "Одиниця",
  Volume: "Об'єм",
};

const VALIDATION_MESSAGE_MAP: Record<string, string> = {
  "Container code must not exceed 50 characters": "Код тари має містити не більше 50 символів.",
  "Container name is required": "Назва тари є обов'язковою.",
  "Container name must not exceed 100 characters": "Назва тари має містити не більше 100 символів.",
  "Container type is required": "Оберіть тип тари.",
  "Container type name is required": "Назва типу тари є обов'язковою.",
  "Container type name must not exceed 100 characters": "Назва типу тари має містити не більше 100 символів.",
  "Default unit is required": "Одиниця за замовчуванням є обов'язковою.",
  "Default unit must not exceed 20 characters": "Одиниця за замовчуванням має містити не більше 20 символів.",
  "Description must not exceed 500 characters": "Опис має містити не більше 500 символів.",
  "Email is not valid": "Вкажіть коректну електронну пошту.",
  "Email is required": "Електронна пошта є обов'язковою.",
  "Email must not exceed 200 characters": "Електронна пошта має містити не більше 200 символів.",
  "Expiration date must be after production date": "Термін придатності має бути пізніше за дату виробництва.",
  "First name is required": "Ім'я є обов'язковим.",
  "First name must not exceed 100 characters": "Ім'я має містити не більше 100 символів.",
  "Invalid role value": "Оберіть коректну роль користувача.",
  "Last name is required": "Прізвище є обов'язковим.",
  "Last name must not exceed 100 characters": "Прізвище має містити не більше 100 символів.",
  "Middle name must not exceed 100 characters": "По батькові має містити не більше 100 символів.",
  "Product ID must be greater than 0": "Оберіть продукт.",
  "Product name is required": "Назва продукту є обов'язковою.",
  "Product name must not exceed 200 characters": "Назва продукту має містити не більше 200 символів.",
  "Product type ID must be greater than 0": "Оберіть тип продукту.",
  "Product type name is required": "Назва типу продукту є обов'язковою.",
  "Product type name must not exceed 100 characters": "Назва типу продукту має містити не більше 100 символів.",
  "Production date cannot be in the future": "Дата виробництва не може бути в майбутньому.",
  "Quantity must be greater than 0": "Кількість має бути більшою за 0.",
  "Shelf life days cannot be negative": "Термін у днях не може бути від'ємним.",
  "Shelf life hours cannot be negative": "Термін у годинах не може бути від'ємним.",
  "Unit is required": "Одиниця є обов'язковою.",
  "Unit must not exceed 20 characters": "Одиниця має містити не більше 20 символів.",
  "Unit must not exceed 50 characters": "Одиниця має містити не більше 50 символів.",
  "Volume must be greater than 0": "Об'єм має бути більшим за 0.",
};

const GENERIC_VALIDATION_TITLES = new Set([
  "One or more validation errors occurred.",
  "Validation Failed",
]);

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function humanizeField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }

  return result;
}

function resolveDomainMessage(message: string): ResolvedMessage {
  const normalized = normalizeText(message);

  const exactMatch = VALIDATION_MESSAGE_MAP[normalized];
  if (exactMatch) {
    return { title: exactMatch };
  }

  let match = normalized.match(/^Quantity \((.+)\) exceeds container volume \((.+)\)$/i);
  if (match) {
    return {
      title: "Кількість перевищує місткість тари.",
      detail: `Вказано ${match[1]}, але тара вміщує максимум ${match[2]}.`,
    };
  }

  match = normalized.match(/^Unit mismatch: expected '(.+)', got '(.+)'$/i);
  if (match) {
    return {
      title: "Одиниця не відповідає тарі.",
      detail: `Очікувана одиниця: ${match[1]}. Отримано: ${match[2]}.`,
    };
  }

  match = normalized.match(/^Product type '(.+)' is not allowed in container type '(.+)'\.?$/i);
  if (match) {
    return {
      title: "Цей продукт не сумісний з типом тари.",
      detail: `Тип продукту "${match[1]}" не дозволений для типу тари "${match[2]}".`,
    };
  }

  match = normalized.match(/^Product with ID (\d+) not found during container operation\.?$/i);
  if (match) {
    return {
      title: "Обраний продукт не знайдено.",
      detail: `Продукт з ID ${match[1]} більше недоступний. Оновіть список і спробуйте ще раз.`,
    };
  }

  match = normalized.match(/^Product with id (\d+) is in use by active containers and cannot be deleted$/i);
  if (match) {
    return {
      title: "Продукт не можна видалити.",
      detail: `Продукт використовується в активних контейнерах.`,
    };
  }

  match = normalized.match(/^Product type with id (\d+) cannot be deleted because it is used by existing products$/i);
  if (match) {
    return {
      title: "Тип продукту не можна видалити.",
      detail: "Його вже використовують існуючі продукти.",
    };
  }

  match = normalized.match(/^Container type (\d+) cannot be deleted because it contains containers\.$/i);
  if (match) {
    return {
      title: "Тип тари не можна видалити.",
      detail: "До нього вже прив'язані існуючі контейнери.",
    };
  }

  match = normalized.match(/^User with email (.+) already exists\.$/i);
  if (match) {
    return {
      title: "Користувач з цією поштою вже існує.",
      detail: `Пошта: ${match[1]}.`,
    };
  }

  match = normalized.match(/^An active invitation for (.+) already exists\.$/i);
  if (match) {
    return {
      title: "Для цієї пошти вже є активне запрошення.",
      detail: `Пошта: ${match[1]}.`,
    };
  }

  if (normalized === "Container is not empty") {
    return { title: "Тара вже заповнена." };
  }

  if (normalized === "Container is not full") {
    return { title: "Тара вже порожня." };
  }

  if (normalized === "Expiration date is required because no shelf life is defined for the product or its type.") {
    return {
      title: "Вкажіть термін придатності.",
      detail: "Для цього продукту або його типу не задано строк зберігання, тому дату потрібно ввести вручну.",
    };
  }

  if (normalized === "You cannot deactivate your own account.") {
    return { title: "Неможливо деактивувати власний акаунт." };
  }

  if (normalized === "Invalid or expired invitation.") {
    return {
      title: "Запрошення недійсне.",
      detail: "Термін дії запрошення минув або посилання некоректне.",
    };
  }

  if (normalized.startsWith("Container already exists under id ")) {
    return { title: "Така тара вже існує." };
  }

  if (normalized.startsWith("Product type already exists under id ")) {
    return { title: "Такий тип продукту вже існує." };
  }

  if (normalized.startsWith("Container type already exists under id ")) {
    return { title: "Такий тип тари вже існує." };
  }

  if (normalized.startsWith("Product not found under id ")) {
    return { title: "Продукт не знайдено." };
  }

  if (normalized.startsWith("Product type not found under id ")) {
    return { title: "Тип продукту не знайдено." };
  }

  if (normalized.startsWith("Container not found under id ")) {
    return { title: "Тару не знайдено." };
  }

  if (normalized.startsWith("Container fill with id ") && normalized.endsWith(" not found")) {
    return { title: "Запис заповнення не знайдено." };
  }

  if (normalized.startsWith("Container type not found under id ")) {
    return { title: "Тип тари не знайдено." };
  }

  if (normalized.startsWith("Container type with id ") && normalized.endsWith(" not found for container operation")) {
    return { title: "Тип тари не знайдено." };
  }

  if (normalized.startsWith("Product type with id ") && normalized.endsWith(" not found for product operation")) {
    return { title: "Тип продукту не знайдено." };
  }

  if (normalized.startsWith("User with ID ") && normalized.endsWith(" was not found.")) {
    return { title: "Користувача не знайдено." };
  }

  if (normalized.startsWith("User with email ") && normalized.endsWith(" was not found.")) {
    return { title: "Користувача не знайдено." };
  }

  if (normalized.startsWith("User ") && normalized.endsWith(" is not active.")) {
    return { title: "Користувач ще не активований." };
  }

  if (normalized === "Unexpected error occurred") {
    return { title: "Сталася неочікувана помилка на сервері." };
  }

  return { title: normalized };
}

function translateValidationMessage(message: string, field: string): string {
  const normalized = normalizeText(message);
  const exactMatch = VALIDATION_MESSAGE_MAP[normalized];
  if (exactMatch) {
    return exactMatch;
  }

  const fieldLabel = humanizeField(field);
  return `${fieldLabel}: ${normalized}`;
}

function extractValidationIssues(payload: unknown): string[] {
  if (!isObject(payload)) return [];

  const errors = (payload as ErrorPayload).errors;
  if (!errors || typeof errors !== "object") return [];

  const issues: string[] = [];
  for (const [field, value] of Object.entries(errors)) {
    const messages = Array.isArray(value) ? value : value ? [value] : [];
    for (const message of messages) {
      if (typeof message === "string" && message.trim()) {
        issues.push(translateValidationMessage(message, field));
      }
    }
  }

  return dedupe(issues);
}

function extractSummary(payload: unknown): string | null {
  if (typeof payload === "string") {
    return toMessage(payload);
  }

  if (!isObject(payload)) return null;

  const typed = payload as ErrorPayload;
  const candidates = [typed.message, typed.detail, typed.title, typed.raw];

  for (const candidate of candidates) {
    const message = toMessage(candidate);
    if (!message || GENERIC_VALIDATION_TITLES.has(message)) {
      continue;
    }

    return message;
  }

  return null;
}

export function resolveApiErrorPresentation(payload: unknown): ApiErrorPresentation {
  const issues = extractValidationIssues(payload);
  if (issues.length > 1) {
    return {
      title: "Перевірте дані форми.",
      details: issues,
    };
  }

  if (issues.length === 1) {
    return {
      title: issues[0],
      details: [],
    };
  }

  const summary = extractSummary(payload);
  if (!summary) {
    return { title: null, details: [] };
  }

  const resolved = resolveDomainMessage(summary);
  return {
    title: resolved.title,
    details: resolved.detail ? [resolved.detail] : [],
  };
}
