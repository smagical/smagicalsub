// Workers 运行时提供 atob；补齐 padding 后可兼容 URL-safe base64。
export function tryDecodeBase64(value: string) {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  try {
    const binary = globalThis.atob(normalized + padding);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return value;
  }
}

export function decodeMaybeBase64Url(value: string) {
  return tryDecodeBase64(value.replace(/_/g, "/").replace(/-/g, "+"));
}

// 删除空字段，让生成配置更接近客户端期望，也减少后续渲染器的特判。
export function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as T;
}

export function stringParam(params: URLSearchParams, ...names: string[]) {
  for (const name of names) {
    const value = params.get(name);

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function numberParam(params: URLSearchParams, ...names: string[]) {
  const value = stringParam(params, ...names);
  const parsed = value === undefined ? NaN : Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function booleanParam(params: URLSearchParams, ...names: string[]) {
  const value = stringParam(params, ...names);

  if (value === undefined) {
    return undefined;
  }

  return ["1", "true", "yes"].includes(value.toLowerCase());
}
