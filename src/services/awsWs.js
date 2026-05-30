import { getAwsWsUrl } from "./appConfig";
import { getBearerToken } from "./cognitoAuth";

function getWsUrlBase() {
  return String(getAwsWsUrl() || "").replace(/\/+$/, "");
}

let ws = null;
let wsState = {
  leagueId: "",
  handlers: new Set(),
  reconnectTimer: null,
  reconnectMs: 500,
};

function clearReconnect() {
  if (wsState.reconnectTimer) {
    clearTimeout(wsState.reconnectTimer);
    wsState.reconnectTimer = null;
  }
}

async function openWsIfNeeded() {
  const base = getWsUrlBase();
  if (!base) return null;

  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  const token = await getBearerToken();

  const url = new URL(base);
  url.searchParams.set("token", token);

  ws = new WebSocket(url.toString());

  ws.addEventListener("message", (ev) => {
    const msg = safeJsonParse(ev.data);
    if (!msg || typeof msg !== "object") return;
    for (const fn of wsState.handlers) {
      try {
        fn(msg);
      } catch {
        // ignore
      }
    }
  });

  ws.addEventListener("open", () => {
    wsState.reconnectMs = 500;
    if (wsState.leagueId) {
      wsSend({ action: "subscribe", leagueId: wsState.leagueId });
    }
  });

  ws.addEventListener("close", () => {
    scheduleReconnect();
  });

  ws.addEventListener("error", () => {
    // close triggers reconnect
  });

  return ws;
}

function scheduleReconnect() {
  clearReconnect();
  if (wsState.handlers.size === 0) return;
  const base = getWsUrlBase();
  if (!base) return;

  const ms = Math.min(10_000, wsState.reconnectMs);
  wsState.reconnectMs = Math.min(10_000, wsState.reconnectMs * 2);
  wsState.reconnectTimer = setTimeout(() => {
    openWsIfNeeded().catch(() => {
      // keep trying; next close/error will reschedule
    });
  }, ms);
}

function wsSend(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(obj));
}

export async function subscribeLeagueAws(leagueId, onEvent) {
  const base = getWsUrlBase();
  if (!base) return () => {};

  if (typeof onEvent === "function") {
    wsState.handlers.add(onEvent);
  }

  wsState.leagueId = String(leagueId || "");

  const sock = await openWsIfNeeded();
  if (sock && sock.readyState === WebSocket.OPEN) {
    wsSend({ action: "subscribe", leagueId: wsState.leagueId });
  }

  return () => {
    if (typeof onEvent === "function") {
      wsState.handlers.delete(onEvent);
    }
    if (wsState.handlers.size === 0) {
      wsState.leagueId = "";
      wsSend({ action: "unsubscribe" });
      clearReconnect();
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    }
  };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
