<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[10000] overflow-hidden"
      @keydown.esc.prevent="onCancel"
      @click.self="onCancel"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        class="absolute inset-0 grid items-start justify-items-center p-4 pt-[12vh]"
      >
        <div
          class="relative w-full overflow-hidden border shadow-2xl rounded-2xl border-white/10 bg-gray-950/80 ring-1 ring-white/5"
          style="width: min(92vw, 32rem)"
        >
          <div class="p-4 border-b border-white/10 bg-white/5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-white">
                  {{ title || "Confirmar" }}
                </div>
                <div v-if="subtitle" class="mt-1 text-xs text-white/60">
                  {{ subtitle }}
                </div>
              </div>
              <button
                type="button"
                class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                @click="onCancel"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div class="p-4">
            <div class="text-sm text-white/80">
              <slot>
                {{ message }}
              </slot>
            </div>

            <div
              class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                class="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                @click="onCancel"
              >
                {{ cancelText || "Cancelar" }}
              </button>
              <button
                ref="primaryBtn"
                type="button"
                class="w-full sm:w-auto px-4 py-2 text-sm font-semibold transition rounded-xl ring-1 disabled:opacity-60"
                :class="
                  danger
                    ? 'bg-rose-500/80 text-white ring-rose-400/30 hover:bg-rose-500'
                    : 'bg-emerald-300 text-gray-950 ring-emerald-200/30 hover:opacity-95'
                "
                :disabled="busy"
                @click="onConfirm"
              >
                {{ busy ? "..." : confirmText || "Confirmar" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  message: { type: String, default: "" },
  confirmText: { type: String, default: "" },
  cancelText: { type: String, default: "" },
  danger: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel", "update:open"]);

const primaryBtn = ref(null);

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    nextTick(() => primaryBtn.value?.focus?.());
  },
);

function onCancel() {
  if (props.busy) return;
  emit("update:open", false);
  emit("cancel");
}

function onConfirm() {
  if (props.busy) return;
  emit("confirm");
}
</script>
