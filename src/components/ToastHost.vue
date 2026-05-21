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
                <component :is="toastIcon(t.type)" class="w-5 h-5 text-white" />
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
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToasts } from "../services/toasts";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";

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

function toastIcon(type) {
  if (type === "success") return CheckCircleIcon;
  if (type === "error") return XCircleIcon;
  if (type === "warning") return ExclamationTriangleIcon;
  return InformationCircleIcon;
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
