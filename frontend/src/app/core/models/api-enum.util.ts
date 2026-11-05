export type NumericEnumDefinition = Readonly<Record<string, string | number>>;

export function enumValueFromApi(
  definition: NumericEnumDefinition,
  value: unknown
): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const normalizedValue = value.trim().replace(/[\s_-]/g, '').toLowerCase();
  const member = Object.entries(definition).find(
    ([name, enumValue]) =>
      typeof enumValue === 'number' &&
      name.replace(/[\s_-]/g, '').toLowerCase() === normalizedValue
  );

  if (member && typeof member[1] === 'number') {
    return member[1];
  }

  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? numericValue : undefined;
}
