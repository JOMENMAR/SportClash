import { reactive, readonly } from "vue";

// Tiny global toast store (no deps).
// Usage:
//   import { toast } from '../services/toasts'
//   toast.success('Guardado')

let nextId = 1;

const state = reactive({
  toasts: [],
});

function push({
  type = "info",
  message = "",
  title = "",
  timeoutMs = 2500,
} = {}) {
  const id = String(nextId++);
  state.toasts.push({
    id,
    type,
    title: String(title || ""),
    message: String(message || ""),
    timeoutMs: Number(timeoutMs) || 0,
    createdAt: Date.now(),
  });

  if (timeoutMs && timeoutMs > 0) {
    setTimeout(() => remove(id), timeoutMs);
  }

  return id;
}

function remove(id) {
  const idx = state.toasts.findIndex((t) => t.id === id);
  if (idx >= 0) state.toasts.splice(idx, 1);
}

export function useToasts() {
  return {
    state: readonly(state),
    push,
    remove,
  };
}

export const toast = {
  info(message, opts = {}) {
    return push({ type: "info", message, ...opts });
  },
  success(message, opts = {}) {
    return push({ type: "success", message, ...opts });
  },
  warning(message, opts = {}) {
    return push({ type: "warning", message, ...opts });
  },
  error(message, opts = {}) {
    return push({
      type: "error",
      message,
      ...opts,
      timeoutMs: opts.timeoutMs ?? 3500,
    });
  },
};
