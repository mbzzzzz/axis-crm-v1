import browser from "webextension-polyfill";
import type { RuntimeMessage, RuntimeMessageResponse } from "./types";

export function sendRuntimeMessage<T extends RuntimeMessageResponse = RuntimeMessageResponse>(
  message: RuntimeMessage,
) {
  return browser.runtime.sendMessage(message) as Promise<T>;
}

