export const MEASUREMENT_UNITS = [
  "л",
  "мл",
  "кг",
  "г",
  "шт",
] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export function normalizeUnit(unit: string | null | undefined): string {
  const value = (unit ?? "").trim();
  if (MEASUREMENT_UNITS.includes(value as MeasurementUnit)) {
    return value;
  }

  return "л";
}
