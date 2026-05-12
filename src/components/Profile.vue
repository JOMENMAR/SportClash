<template>
  <BasePage>
    <div class="mx-auto w-full max-w-5xl">
      <header
        class="flex flex-col gap-2 rounded-2xl border border-white/10 bg-gray-950/50 p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <h1
          class="text-2xl font-extrabold tracking-tight leading-none text-emerald-300"
        >
          Perfil
        </h1>
        <p class="mt-0 text-sm leading-snug text-white/60">
          Edita tu información básica. Más adelante aquí pondremos tus logros,
          redes sociales y ajustes.
        </p>
      </header>

      <main class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section
          class="lg:col-span-2 rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold tracking-tight text-white">Datos</h2>
              <p class="mt-1 text-sm text-white/60">
                Se guardan en tu documento de
                <span class="font-mono">users/&lt;uid&gt;</span>.
              </p>
            </div>
            <button
              type="button"
              class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="load()"
              :disabled="busy"
            >
              {{ busy ? "Cargando…" : "Recargar" }}
            </button>
          </div>

          <form class="mt-5 grid grid-cols-1 gap-4" @submit.prevent="onSave">
            <div>
              <label class="text-sm text-white/70" for="p-email">Email</label>
              <input
                id="p-email"
                :value="email"
                type="text"
                disabled
                class="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70 ring-1 ring-white/10"
              />
            </div>

            <div>
              <label class="text-sm text-white/70" for="p-nombre">Nombre</label>
              <input
                id="p-nombre"
                v-model.trim="nombre"
                type="text"
                class="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="Tu nombre"
                autocomplete="given-name"
              />
            </div>

            <div>
              <label class="text-sm text-white/70" for="p-apodo">Apodo</label>
              <input
                id="p-apodo"
                v-model.trim="apodo"
                type="text"
                class="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="Cómo te verán en la liga"
                autocomplete="nickname"
              />
            </div>

            <div>
              <label class="text-sm text-white/70" for="p-fecha"
                >Fecha de nacimiento</label
              >
              <input
                id="p-fecha"
                v-model="fechaNacimiento"
                type="date"
                class="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              />
            </div>

            <div
              v-if="error"
              class="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100"
            >
              {{ error }}
            </div>
            <div
              v-if="info"
              class="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3 text-sm text-sky-100"
            >
              {{ info }}
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="submit"
                class="w-full rounded-xl bg-emerald-300 py-3 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98] disabled:opacity-60"
                :disabled="busy"
              >
                {{ busy ? "Guardando…" : "Guardar cambios" }}
              </button>
              <button
                type="button"
                class="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                @click="$emit('back')"
              >
                Volver
              </button>
            </div>
          </form>
        </section>

        <aside
          class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
        >
          <h2 class="text-lg font-bold tracking-tight text-white">Cuenta</h2>
          <p class="mt-1 text-sm text-white/60">Estado y acciones rápidas.</p>

          <div class="mt-4 grid grid-cols-1 gap-3">
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">UID</div>
              <div class="mt-1 font-mono text-sm break-all">{{ uidLabel }}</div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Email verificado</div>
              <div class="mt-1 font-semibold">
                {{ emailVerified ? "Sí" : "No" }}
              </div>
            </div>

            <button
              type="button"
              class="w-full rounded-xl bg-rose-500/15 py-2.5 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/20 transition"
              @click="confirmLogoutOpen = true"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>
      </main>

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
    </div>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import BasePage from "./BasePage.vue";
import { toast } from "../services/toasts";
import ConfirmModal from "./ConfirmModal.vue";

const emit = defineEmits(["back", "logout"]);

const busy = ref(false);
const error = ref("");
const info = ref("");

const confirmLogoutOpen = ref(false);

const nombre = ref("");
const apodo = ref("");
const fechaNacimiento = ref("");

const uidLabel = computed(() => auth.currentUser?.uid ?? "—");
const email = computed(() => auth.currentUser?.email ?? "—");
const emailVerified = computed(() => auth.currentUser?.emailVerified ?? false);

async function load() {
  error.value = "";
  info.value = "";
  const user = auth.currentUser;
  if (!user?.uid) {
    error.value = "No hay usuario autenticado";
    toast.error(error.value);
    return;
  }

  busy.value = true;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      nombre.value = data?.nombre ?? "";
      apodo.value = data?.apodo ?? "";
      fechaNacimiento.value = data?.fechaNacimiento ?? "";
      toast.info("Perfil cargado", { timeoutMs: 1400 });
    }
  } catch (e) {
    error.value = e?.message || "No se pudo cargar el perfil";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }
}

async function onSave() {
  error.value = "";
  info.value = "";

  const user = auth.currentUser;
  if (!user?.uid) {
    error.value = "No hay usuario autenticado";
    toast.error(error.value);
    return;
  }

  busy.value = true;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        nombre: nombre.value,
        apodo: apodo.value,
        fechaNacimiento: fechaNacimiento.value,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    info.value = "Perfil actualizado.";
    toast.success(info.value);
  } catch (e) {
    error.value = e?.message || "No se pudo guardar";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  load();
});
</script>
