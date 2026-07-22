// GET 参数过滤：剔除 null/undefined，避免后端把字符串 "null" 解析为 Integer 报 400
// （沿用 FocusLab 小程序 request.js 的 bug 教训）
export function filterNulls<T extends Record<string, unknown>>(obj: T | undefined | null): Partial<T> {
  if (!obj || typeof obj !== 'object') return obj as undefined;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] != null) out[k] = obj[k];
  }
  return out as Partial<T>;
}
