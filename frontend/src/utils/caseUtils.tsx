// src/utils/caseUtils.ts

// ---------- Case Converters ----------

// camelCase → snake_case
const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

// snake_case → camelCase
const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// ---------- Recursive Object Transformers ----------

/**
 * Recursively converts keys of an object from camelCase to snake_case
 * Works with nested objects and arrays
 */
export function toSnakeCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as unknown as T;
  } else if (obj !== null && typeof obj === "object") {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = toSnakeCase(value);
    });
    return result as T;
  } else {
    return obj as T; // primitive value
  }
}

/**
 * Recursively converts keys of an object from snake_case to camelCase
 * Works with nested objects and arrays
 */
export function toCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as unknown as T;
  } else if (obj !== null && typeof obj === "object") {
    const result: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = toCamelCase(value);
    });
    return result as T;
  } else {
    return obj as T; // primitive value
  }
}