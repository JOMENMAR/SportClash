<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[10000] w-[min(92vw,22rem)] space-y-2">
      <TransitionGroup name="toast" tag="div" class="space-y-2">
        <div
          v-for="t in state.toasts"
          :key="t.id"
          class="p-3 border shadow-2xl rounded-2xl backdrop-blur-xl ring-1"
          :class="toastClass(t.type)"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <div class="mt-0.5">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/10"
              >
                <span class="text-white" v-html="iconSvg(t.type)" />
              </span>
            </div>

            <div class="min-w-0 flex-1">
              <div
                v-if="t.title"
                class="text-sm font-extrabold text-white truncate"
              >
                {{ t.title }}
              </div>
              <div class="text-sm text-white/85 break-words">
                {{ t.message }}
              </div>
            </div>

            <button
              type="button"
              class="px-2 py-1 text-xs font-semibold text-white/80 rounded-xl hover:bg-white/10"
              @click="remove(t.id)"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToasts } from "../services/toasts";

const { state, remove } = useToasts();

function toastClass(type) {
  switch (type) {
    case "success":
      return "border-emerald-300/20 bg-emerald-500/15 ring-emerald-200/20";
    case "error":
      return "border-rose-300/20 bg-rose-500/15 ring-rose-200/20";
    case "warning":
      return "border-amber-300/20 bg-amber-500/15 ring-amber-200/20";
    default:
      return "border-white/10 bg-gray-950/70 ring-white/10";
  }
}

function iconSvg(type) {
  // Inline SVGs to avoid dependencies.
  if (type === "success") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 01.006 1.414l-7.25 7.3a1 1 0 01-1.42-.004l-3.75-3.8a1 1 0 011.42-1.404l3.04 3.078 6.54-6.584a1 1 0 011.414-.006z" clip-rule="evenodd"/></svg>`;
  }
  if (type === "error") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.78-10.72a.75.75 0 00-1.06-1.06L10 7.94 8.28 6.22a.75.75 0 10-1.06 1.06L8.94 9l-1.72 1.72a.75.75 0 101.06 1.06L10 10.06l1.72 1.72a.75.75 0 001.06-1.06L11.06 9l1.72-1.72z" clip-rule="evenodd"/></svg>`;
  }
  if (type === "warning") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.334-.213 2.99-1.742 2.99H3.48c-1.53 0-2.492-1.656-1.743-2.99l6.52-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0010 6z" clip-rule="evenodd"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M9 9a1 1 0 112 0v6a1 1 0 11-2 0V9z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"/></svg>`;
}
</script>

<style>
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  transform: translateY(-6px);
  opacity: 0;
}
</style>
