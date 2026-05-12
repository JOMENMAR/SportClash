// Lightweight logger with a single toggle.
// Usage:
//   import { log, warn, error, group, groupEnd, setDebugEnabled } from './services/logger'
//   log('Auth', 'state changed', { uid })

let debugEnabled = true;

// Allow overriding from DevTools:
//   localStorage.setItem('sportclash:debug', '1')
//   localStorage.removeItem('sportclash:debug')
try {
  debugEnabled = localStorage.getItem("sportclash:debug") === "1";
} catch {
  // ignore
}

export function setDebugEnabled(enabled) {
  debugEnabled = !!enabled;
  try {
    localStorage.setItem("sportclash:debug", enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function isDebugEnabled() {
  return debugEnabled;
}

function prefix(scope) {
  return `[SportClash][${scope}]`;
}

export function log(scope, message, data) {
  if (!debugEnabled) return;
  if (data !== undefined) console.log(prefix(scope), message, data);
  else console.log(prefix(scope), message);
}

export function warn(scope, message, data) {
  if (!debugEnabled) return;
  if (data !== undefined) console.warn(prefix(scope), message, data);
  else console.warn(prefix(scope), message);
}

export function error(scope, message, data) {
  if (!debugEnabled) return;
  if (data !== undefined) console.error(prefix(scope), message, data);
  else console.error(prefix(scope), message);
}

export function group(scope, title, data) {
  if (!debugEnabled) return;
  if (console.groupCollapsed) {
    console.groupCollapsed(prefix(scope), title);
  } else {
    console.group(prefix(scope), title);
  }
  if (data !== undefined) console.log(data);
}

export function groupEnd() {
  if (!debugEnabled) return;
  console.groupEnd?.();
}
