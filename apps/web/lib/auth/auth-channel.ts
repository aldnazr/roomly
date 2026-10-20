const AUTH_CHANNEL_NAME = "auth_channel";

export const AUTH_EVENT = {
  LOGOUT: "LOGOUT",
} as const;

export type AuthEvent = (typeof AUTH_EVENT)[keyof typeof AUTH_EVENT];

type AuthMessage = {
  event: AuthEvent;
  source: string;
};

const tabId = createTabId();
let channel: BroadcastChannel | null = null;

function createTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  channel ??= new BroadcastChannel(AUTH_CHANNEL_NAME);

  return channel;
}

export function broadcastAuthEvent(event: AuthEvent): void {
  const message: AuthMessage = { event, source: tabId };
  getChannel()?.postMessage(message);
}

export function subscribeAuthEvents(handler: (event: AuthEvent) => void): () => void {
  const activeChannel = getChannel();

  if (!activeChannel) {
    return () => { };
  }

  const handleMessage = (message: MessageEvent<AuthMessage>) => {
    const payload = message.data;

    if (!payload || payload.source === tabId) {
      return;
    }

    handler(payload.event);
  };

  activeChannel.addEventListener("message", handleMessage);

  return () => {
    activeChannel.removeEventListener("message", handleMessage);
  };
}
