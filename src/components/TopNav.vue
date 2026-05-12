<template>
  <div
    class="sticky top-0 z-40 w-full border border-b border-white/10 bg-gray-950/60 backdrop-blur-md"
  >
    <div class="flex items-center w-full max-w-5xl gap-2 px-4 py-3 mx-auto">
      <div class="flex items-center gap-2">
        <div
          class="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-300/15 ring-1 ring-emerald-200/20"
        >
          <span class="font-extrabold text-emerald-200">S</span>
        </div>
        <div class="hidden sm:block">
          <div class="text-sm font-extrabold tracking-tight text-emerald-300">
            SportClash
          </div>
          <div class="text-xs text-white/50">Ligas mensuales</div>
        </div>
      </div>

      <nav class="flex items-center gap-2 ml-2">
        <button
          type="button"
          class="px-3 py-2 text-sm font-semibold transition rounded-xl ring-1"
          :class="
            active === 'home'
              ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
              : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
          "
          @click="$emit('go-home')"
        >
          Home
        </button>

        <button
          type="button"
          class="px-3 py-2 text-sm font-semibold transition rounded-xl ring-1"
          :class="
            active === 'myLeagues'
              ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
              : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
          "
          @click="$emit('go-my-leagues')"
        >
          Mis ligas
        </button>

        <button
          type="button"
          class="px-3 py-2 text-sm font-semibold transition rounded-xl ring-1"
          :class="
            active === 'global'
              ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
              : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
          "
          @click="$emit('go-global')"
        >
          Global
        </button>
      </nav>

      <div class="grow" />

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
          title="Perfil"
          @click="$emit('go-profile')"
        >
          <!-- user icon -->
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        <button
          type="button"
          class="px-3 py-2 text-sm font-semibold transition rounded-xl bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/20"
          @click="confirmLogoutOpen = true"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  </div>

  <ConfirmModal
    v-model:open="confirmLogoutOpen"
    title="Cerrar sesión"
    subtitle="Vas a salir de tu cuenta en este dispositivo."
    message="¿Quieres cerrar sesión ahora?"
    confirm-text="Sí, cerrar"
    cancel-text="Cancelar"
    danger
    @confirm="$emit('logout')"
  />
</template>

<script setup>
import { ref } from "vue";
import ConfirmModal from "./ConfirmModal.vue";

defineProps({
  active: {
    type: String,
    default: "home",
  },
});

const confirmLogoutOpen = ref(false);

defineEmits(["go-home", "go-my-leagues", "go-global", "go-profile", "logout"]);
</script>
