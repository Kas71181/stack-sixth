export function withoutLongDashes(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[–—]\s*/g, ", ");
}

export function sanitizeAiContent(value) {
  if (typeof value === "string") return withoutLongDashes(value);
  if (Array.isArray(value)) return value.map(sanitizeAiContent);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeAiContent(item)]));
  }
  return value;
}