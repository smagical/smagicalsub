import type { RenderSubscriptionBaseInput } from "./types";
import { getRawUri } from "./utils";

export function renderPlainSubscription(input: RenderSubscriptionBaseInput): string {
  return input.nodes.map(getRawUri).filter((uri): uri is string => uri !== null).join("\n");
}

export function renderV2rayNSubscription(input: RenderSubscriptionBaseInput): string {
  const plain = renderPlainSubscription(input);
  return encodeBase64(plain ? `${plain}\n` : "");
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return globalThis.btoa(binary);
}

