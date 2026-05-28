<template>
  <BasePage>
    <template #bg>
      <div aria-hidden class="absolute inset-0">
        <div
          v-if="pageBgFillStyle"
          class="absolute inset-0"
          :style="pageBgFillStyle"
        />
        <div v-if="pageBgLayers.length" class="absolute inset-0">
          <div v-for="(l, i) in pageBgLayers" :key="i" :class="l.class" />
        </div>
      </div>
    </template>

    <div class="mx-auto w-full max-w-5xl">
      <header
        class="relative overflow-hidden flex flex-col gap-2 rounded-2xl border border-white/10 bg-gray-950/50 p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div
          v-if="bannerLayers.length"
          aria-hidden
          class="absolute inset-0 pointer-events-none"
        >
          <div v-for="(l, i) in bannerLayers" :key="i" :class="l.class" />
        </div>

        <div class="flex items-start gap-3">
          <button
            v-if="isSelf"
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0 transition active:scale-[0.98]"
            :class="accentBase.badgeWrapClass"
            :style="badgeWrapStyle"
            aria-label="Cambiar icono y color"
            @click="openDecor"
          >
            <component
              v-if="profileBadgeSpec.kind === 'icon'"
              :is="profileBadgeSpec.icon"
              class="h-5 w-5"
              :class="accentBase.badgeTextClass"
              :style="badgeTextStyle"
            />
            <span
              v-else
              class="text-lg"
              :class="accentBase.badgeTextClass"
              :style="badgeTextStyle"
              >{{ profileBadgeSpec.text || "·" }}</span
            >
          </button>

          <div
            v-else
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0"
            :class="accentBase.badgeWrapClass"
            :style="badgeWrapStyle"
            aria-hidden
          >
            <component
              v-if="profileBadgeSpec.kind === 'icon'"
              :is="profileBadgeSpec.icon"
              class="h-5 w-5"
              :class="accentBase.badgeTextClass"
              :style="badgeTextStyle"
            />
            <span
              v-else
              class="text-lg"
              :class="accentBase.badgeTextClass"
              :style="badgeTextStyle"
              >{{ profileBadgeSpec.text || "·" }}</span
            >
          </div>

          <div class="min-w-0">
            <h1
              class="text-2xl font-extrabold tracking-tight leading-none truncate"
              :class="accentBase.titleTextClass"
              :style="titleStyle"
            >
              {{ headerTitle }}
            </h1>
            <p class="mt-0 text-sm leading-snug text-white/60">
              {{ headerSubtitle }}
            </p>

            <div v-if="status" class="mt-2 text-xs text-white/70">
              <span
                class="inline-flex items-center rounded-lg bg-black/20 px-2 py-1 ring-1 ring-white/10"
              >
                {{ status }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section
          class="lg:col-span-2 rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold tracking-tight text-white">Datos</h2>
              <p class="mt-1 text-sm text-white/60">
                {{
                  isSelf
                    ? "Se guardan en tu documento de usuario."
                    : "Información pública del atleta."
                }}
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

          <form
            v-if="isSelf"
            class="mt-5 grid grid-cols-1 gap-4"
            @submit.prevent="onSave"
          >
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
              <label class="text-sm text-white/70">Decoración</label>
              <div class="mt-1 text-xs text-white/60">
                Pulsa la insignia (la letra) de arriba para cambiar tu icono y
                color.
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="text-sm text-white/70" for="p-banner"
                  >Banner</label
                >
                <select
                  id="p-banner"
                  v-model="profileBanner"
                  class="sc-dark-select mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                >
                  <option
                    v-for="o in PROFILE_BANNER_OPTIONS"
                    :key="o.key"
                    :value="o.key"
                  >
                    {{ o.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="text-sm text-white/70">Color</label>
                <div class="mt-1 text-xs text-white/60">
                  Se cambia desde la insignia de arriba.
                </div>
              </div>
            </div>

            <div>
              <label class="text-sm text-white/70" for="p-status">Estado</label>
              <input
                id="p-status"
                v-model.trim="status"
                type="text"
                maxlength="40"
                class="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="Ej: Entrenando para el reto"
                autocomplete="off"
              />
            </div>

            <div>
              <label class="text-sm text-white/70" for="p-bio">Bio</label>
              <textarea
                id="p-bio"
                v-model.trim="bio"
                rows="4"
                maxlength="200"
                class="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                placeholder="Cuéntanos qué deportes haces, tus metas, etc."
              />
              <div class="mt-1 text-xs text-white/60">
                {{ (bio || "").length }}/200
              </div>
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

          <div v-else class="mt-5 grid grid-cols-1 gap-4">
            <div class="rounded-xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Apodo</div>
              <div class="mt-1 text-sm font-semibold text-white/80">
                {{ apodo || "—" }}
              </div>
            </div>
            <div class="rounded-xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Nombre</div>
              <div class="mt-1 text-sm font-semibold text-white/80">
                {{ nombre || "—" }}
              </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Estado</div>
              <div class="mt-1 text-sm font-semibold text-white/80">
                {{ status || "—" }}
              </div>
            </div>

            <div class="rounded-xl border border-white/10 bg-black/20 p-4">
              <div class="text-xs text-white/60">Bio</div>
              <div class="mt-1 text-sm text-white/80 whitespace-pre-wrap">
                {{ bio || "—" }}
              </div>
            </div>

            <div
              v-if="error"
              class="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100"
            >
              {{ error }}
            </div>

            <button
              type="button"
              class="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="$emit('back')"
            >
              Volver
            </button>
          </div>
        </section>

        <aside class="space-y-4">
          <div
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <h2 class="text-lg font-bold tracking-tight text-white">
              Insignias globales
            </h2>
            <p class="mt-1 text-sm text-white/60">
              Logros generales (y algunos visibles para todos).
            </p>

            <div
              v-if="globalBadgesError"
              class="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100"
            >
              {{ globalBadgesError }}
            </div>

            <div
              v-else-if="globalBadgesLoading"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Cargando insignias…
            </div>

            <div
              v-else-if="!globalBadges.length"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Aún no hay insignias globales.
            </div>

            <div v-else class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="b in globalBadges"
                :key="b.key"
                class="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10"
                :title="b.subtitle"
              >
                {{ b.label }}
              </span>
            </div>
          </div>

          <div
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <h2 class="text-lg font-bold tracking-tight text-white">
              Insignias de liga
            </h2>
            <p class="mt-1 text-sm text-white/60">
              Solo visibles cuando abres el perfil desde una liga.
            </p>

            <div
              v-if="badgesError"
              class="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100"
            >
              {{ badgesError }}
            </div>

            <div
              v-else-if="badgesLoading"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Cargando insignias…
            </div>

            <div
              v-else-if="!leagueIdForBadges"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Abre este perfil desde una liga para ver insignias.
            </div>

            <div
              v-else-if="!badges.length"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Aún no hay insignias de liga.
            </div>

            <div v-else class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="b in badges"
                :key="b.key"
                class="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10"
                :title="b.subtitle"
              >
                {{ b.label }}
              </span>
            </div>
          </div>

          <div
            v-if="isSelf"
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <h2 class="text-lg font-bold tracking-tight text-white">Cuenta</h2>
            <p class="mt-1 text-sm text-white/60">Estado y acciones rápidas.</p>

            <div class="mt-4 grid grid-cols-1 gap-3">
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

      <!-- Panel decoración (icono + color) -->
      <Teleport to="body">
        <div
          v-if="decorOpen"
          class="fixed inset-0 z-[10002] overflow-hidden"
          @click.self="closeDecor"
          @keydown.esc.prevent="closeDecor"
          tabindex="-1"
          ref="decorOverlayEl"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div class="absolute inset-0 grid p-4 place-items-center">
            <div
              class="w-full max-w-2xl overflow-hidden border shadow-2xl rounded-2xl border-white/10 bg-gray-950/85 ring-1 ring-white/5"
              role="dialog"
              aria-modal="true"
            >
              <div class="p-4 border-b border-white/10 bg-white/5">
                <div class="text-sm font-extrabold text-white">Decoración</div>
                <div class="mt-1 text-xs text-white/60">
                  Icono, color y fondo de la página.
                </div>
              </div>

              <div class="p-4 space-y-4">
                <div>
                  <div class="text-xs text-white/60">Icono</div>
                  <div
                    class="mt-2 grid grid-cols-6 gap-2 rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition"
                      :class="
                        !profileIconKey
                          ? 'bg-emerald-300/15 text-emerald-100 ring-emerald-200/20'
                          : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10'
                      "
                      @click="profileIconKey = ''"
                      title="Sin icono (usar inicial)"
                    >
                      Aa
                    </button>

                    <button
                      v-for="opt in iconOptions"
                      :key="opt.key"
                      type="button"
                      class="inline-flex items-center justify-center rounded-xl px-2 py-2 ring-1 transition"
                      :class="
                        profileIconKey === opt.key
                          ? 'bg-emerald-300/15 text-emerald-100 ring-emerald-200/20'
                          : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10'
                      "
                      @click="profileIconKey = opt.key"
                      :title="opt.label"
                    >
                      <component :is="opt.icon" class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <div class="text-xs text-white/60">Color</div>
                      <div class="mt-1 text-xs text-white/60">
                        Puedes usar la paleta o elegir un color personalizado.
                      </div>
                    </div>
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                      @click="clearCustomAccent"
                      :disabled="!profileAccentHex"
                    >
                      Restablecer
                    </button>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      v-for="o in PROFILE_ACCENT_OPTIONS"
                      :key="o.key"
                      type="button"
                      class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition"
                      :class="
                        !profileAccentHex && profileAccent === o.key
                          ? 'bg-white/15 text-white ring-emerald-200/30'
                          : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10'
                      "
                      @click="selectAccentKey(o.key)"
                      :title="o.label"
                    >
                      <span
                        class="inline-flex h-6 w-6 rounded-lg ring-1"
                        :class="o.badgeWrapClass"
                        aria-hidden
                      />
                      <span class="truncate">{{ o.label }}</span>
                    </button>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    <label class="text-sm text-white/70">Personalizado</label>
                    <input
                      type="color"
                      class="h-10 w-14 rounded-xl bg-white/5 ring-1 ring-white/10"
                      :value="pickerColor"
                      @input="onPickColor"
                      title="Elegir color"
                    />
                    <div class="text-xs text-white/60">
                      {{ profileAccentHex || "(usando paleta)" }}
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <div class="text-xs text-white/60">
                        Fondo de la página
                      </div>
                      <div class="mt-1 text-xs text-white/60">
                        Puedes usar presets o elegir cualquier color.
                      </div>
                    </div>
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                      @click="clearCustomPageBg"
                      :disabled="!profilePageBgHex"
                    >
                      Restablecer
                    </button>
                  </div>

                  <div class="mt-2">
                    <select
                      v-model="profilePageBg"
                      class="sc-dark-select w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                      :disabled="!!profilePageBgHex"
                      title="Presets (deshabilitado si usas color personalizado)"
                    >
                      <option
                        v-for="o in PROFILE_PAGE_BG_OPTIONS"
                        :key="o.key"
                        :value="o.key"
                      >
                        {{ o.label }}
                      </option>
                    </select>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    <label class="text-sm text-white/70">Personalizado</label>
                    <input
                      type="color"
                      class="h-10 w-14 rounded-xl bg-white/5 ring-1 ring-white/10"
                      :value="pageBgPickerColor"
                      @input="onPickPageBgColor"
                      title="Elegir color de fondo"
                    />
                    <div class="text-xs text-white/60">
                      {{ profilePageBgHex || "(usando presets)" }}
                    </div>
                  </div>

                  <div class="mt-1 text-xs text-white/60">
                    Este fondo se ve detrás de toda la página del perfil.
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15 active:scale-[0.98]"
                    @click="closeDecor"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { auth } from "../firebase";
import BasePage from "./BasePage.vue";
import { toast } from "../services/toasts";
import ConfirmModal from "./ConfirmModal.vue";
import { awsFetchJson } from "../services/awsHttp";
import {
  PROFILE_ACCENT_OPTIONS,
  PROFILE_BANNER_OPTIONS,
  PROFILE_PAGE_BG_OPTIONS,
  getProfileAccent,
  getProfileBannerLayers,
  getProfilePageBgLayers,
  isProfileAccentKey,
  isProfileBannerKey,
  isProfilePageBgKey,
} from "../services/profileDecor";
import {
  LEAGUE_ICON_OPTIONS,
  isLeagueIconKey,
  leagueBadgeSpec,
} from "../services/leagueIcons";
import {
  fetchLeagueAthleteAchievementsFirestore,
  fetchMyMembershipInLeagueFirestore,
  fetchUserApprovedPointRequestsFirestore,
} from "../services/leaguesFirestore";

const props = defineProps({
  uid: { type: String, default: "" },
  leagueId: { type: String, default: "" },
});

const emit = defineEmits(["back", "logout"]);

const busy = ref(false);
const error = ref("");
const info = ref("");

const confirmLogoutOpen = ref(false);

const nombre = ref("");
const apodo = ref("");
const fechaNacimiento = ref("");
const profileEmoji = ref("");
const profileIconKey = ref("");
const profileBanner = ref("classic");
const profileAccent = ref("emerald");
const profileAccentHex = ref("");
const profilePageBg = ref("none");
const profilePageBgHex = ref("");
const status = ref("");
const bio = ref("");

const decorOpen = ref(false);
const decorOverlayEl = ref(null);

const iconOptions = LEAGUE_ICON_OPTIONS;

const badgesLoading = ref(false);
const badgesError = ref("");
const badges = ref([]);

const globalBadgesLoading = ref(false);
const globalBadgesError = ref("");
const globalBadges = ref([]);

const viewingUid = computed(() => {
  const u = String(props.uid || "").trim();
  return u || auth.currentUser?.uid || "";
});

const leagueIdForBadges = computed(() => {
  const l = String(props.leagueId || "").trim();
  return l || "";
});

const isSelf = computed(() => {
  const me = auth.currentUser?.uid || "";
  return !!me && viewingUid.value === me;
});

const displayName = computed(() => {
  const nick = String(apodo.value || "").trim();
  if (nick) return nick;
  const full = String(nombre.value || "").trim();
  if (full) return full;
  return "Atleta";
});

const headerTitle = computed(() => {
  return isSelf.value ? "Perfil" : `Perfil de ${displayName.value}`;
});

const headerSubtitle = computed(() => {
  return isSelf.value
    ? "Edita tu información básica y tu decoración."
    : "Vista de solo lectura.";
});

const accentBase = computed(() =>
  getProfileAccent(profileAccentHex.value ? "neutral" : profileAccent.value),
);

const titleStyle = computed(() => {
  const hex = String(profileAccentHex.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  return { color: hex };
});

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function rgbaFromHex(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  const a = Number.isFinite(alpha) ? alpha : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function readableTextColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  // luminancia relativa aproximada
  const y = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return y >= 140 ? "#0b0f19" : "#ffffff";
}

const badgeWrapStyle = computed(() => {
  const hex = String(profileAccentHex.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  return {
    backgroundColor: rgbaFromHex(hex, 0.18),
  };
});

const badgeTextStyle = computed(() => {
  const hex = String(profileAccentHex.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  const c = readableTextColor(hex);
  return c ? { color: c } : undefined;
});

const bannerLayers = computed(() =>
  getProfileBannerLayers(profileBanner.value).map((x) => ({
    class: String(x?.class || ""),
  })),
);

const pageBgLayers = computed(() =>
  (profilePageBgHex.value
    ? []
    : getProfilePageBgLayers(profilePageBg.value)
  ).map((x) => ({
    class: String(x?.class || ""),
  })),
);

const pageBgFillStyle = computed(() => {
  const hex = String(profilePageBgHex.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  const a1 = rgbaFromHex(hex, 0.14);
  const a2 = rgbaFromHex(hex, 0.12);
  return {
    background:
      `radial-gradient(circle at 10% 10%, ${a1} 0%, rgba(0,0,0,0) 60%),` +
      `radial-gradient(circle at 90% 90%, ${a2} 0%, rgba(0,0,0,0) 55%)`,
  };
});

function openDecor() {
  if (!isSelf.value) return;
  decorOpen.value = true;
  nextTick(() => {
    try {
      decorOverlayEl.value?.focus?.();
    } catch {
      // ignore
    }
  });
}

function closeDecor() {
  decorOpen.value = false;
}

function selectAccentKey(key) {
  profileAccentHex.value = "";
  profileAccent.value = String(key || "emerald");
}

function clearCustomAccent() {
  profileAccentHex.value = "";
}

const pickerColor = computed(() => {
  const hex = String(profileAccentHex.value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  // fallback razonable según la paleta
  const k = String(profileAccent.value || "emerald");
  if (k === "sky") return "#38bdf8";
  if (k === "rose") return "#fb7185";
  if (k === "neutral") return "#a3a3a3";
  return "#34d399";
});

function onPickColor(ev) {
  const v = String(ev?.target?.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
  profileAccentHex.value = v;
}

const pageBgPickerColor = computed(() => {
  const hex = String(profilePageBgHex.value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  // fallback según el preset
  const k = String(profilePageBg.value || "none");
  if (k === "emerald") return "#34d399";
  if (k === "sky") return "#38bdf8";
  if (k === "rose") return "#fb7185";
  if (k === "classic") return "#38bdf8";
  return "#0f172a";
});

function onPickPageBgColor(ev) {
  const v = String(ev?.target?.value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
  profilePageBgHex.value = v;
}

function clearCustomPageBg() {
  profilePageBgHex.value = "";
}

const profileBadgeSpec = computed(() => {
  return leagueBadgeSpec({
    name: displayName.value,
    iconKey: profileIconKey.value,
  });
});

const email = computed(() => auth.currentUser?.email ?? "—");
const emailVerified = computed(() => auth.currentUser?.emailVerified ?? false);

async function load() {
  error.value = "";
  info.value = "";
  const uid = viewingUid.value;
  if (!uid) {
    error.value = "No se pudo resolver el usuario";
    toast.error(error.value);
    return;
  }

  busy.value = true;
  try {
    const isMe = isSelf.value;
    const res = isMe
      ? await awsFetchJson("/me")
      : await awsFetchJson(`/users/${encodeURIComponent(String(uid))}`);
    const data = res?.user || {};

    nombre.value = data?.nombre ?? "";
    apodo.value = data?.apodo ?? "";
    fechaNacimiento.value = isMe ? (data?.fechaNacimiento ?? "") : "";
    profileEmoji.value = "";
    profileIconKey.value = isLeagueIconKey(data?.profileIconKey)
      ? String(data.profileIconKey)
      : "";
    profileBanner.value = isProfileBannerKey(data?.profileBanner)
      ? data.profileBanner
      : "classic";
    profileAccent.value = isProfileAccentKey(data?.profileAccent)
      ? data.profileAccent
      : "emerald";
    profileAccentHex.value =
      typeof data?.profileAccentHex === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(data.profileAccentHex)
        ? data.profileAccentHex
        : "";
    profilePageBg.value = isProfilePageBgKey(data?.profilePageBg)
      ? data.profilePageBg
      : "none";
    profilePageBgHex.value =
      typeof data?.profilePageBgHex === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(data.profilePageBgHex)
        ? data.profilePageBgHex
        : "";
    status.value = String(data?.status ?? "").slice(0, 40);
    bio.value = String(data?.bio ?? "").slice(0, 200);
    toast.info("Perfil cargado", { timeoutMs: 1400 });
  } catch (e) {
    error.value = e?.message || "No se pudo cargar el perfil";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }

  // Actualiza insignias globales cuando cambie el perfil.
  loadGlobalBadges();
}

function computeLeagueBadges({ uid, totalsByUid, topUid, role }) {
  const u = String(uid || "");
  const pts = Number(totalsByUid?.[u] || 0) || 0;
  const out = [];

  if (role === "owner") {
    out.push({
      key: "role-owner",
      label: "Owner",
      subtitle: "Rol dentro de la liga: owner",
    });
  } else if (role === "admin") {
    out.push({
      key: "role-admin",
      label: "Admin",
      subtitle: "Rol dentro de la liga: admin",
    });
  }

  if (pts >= 1) {
    out.push({
      key: "first",
      label: "Primer punto",
      subtitle: "Tiene al menos 1 punto aprobado",
    });
  }
  if (pts >= 10) {
    out.push({
      key: "ten",
      label: "10+ puntos",
      subtitle: "Tiene al menos 10 puntos aprobados",
    });
  }
  if (pts >= 50) {
    out.push({
      key: "fifty",
      label: "50+ puntos",
      subtitle: "Tiene al menos 50 puntos aprobados",
    });
  }
  if (pts >= 100) {
    out.push({
      key: "hundred",
      label: "100+ puntos",
      subtitle: "Tiene al menos 100 puntos aprobados",
    });
  }
  if (topUid && topUid === u) {
    out.push({
      key: "top",
      label: "Top #1",
      subtitle: "Es el atleta con más puntos aprobados en la liga",
    });
  }

  return out;
}

function computeStreakFromDateStrings(dateStrings) {
  const days = Array.from(
    new Set(
      (dateStrings || [])
        .map((d) => String(d || ""))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    ),
  ).sort();

  if (!days.length) return { longest: 0, current: 0, daysCount: 0 };

  const toEpochDay = (s) => {
    const [y, m, d] = s.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, m - 1, d));
    return Math.floor(dt.getTime() / 86400000);
  };

  const epochs = days.map(toEpochDay);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < epochs.length; i++) {
    const diff = epochs[i] - epochs[i - 1];
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else if (diff > 1) {
      run = 1;
    }
  }

  let current = 1;
  for (let i = epochs.length - 1; i > 0; i--) {
    const diff = epochs[i] - epochs[i - 1];
    if (diff === 1) current++;
    else break;
  }

  return { longest, current, daysCount: days.length };
}

function computeGlobalBadgesPublic() {
  const out = [];

  if (String(bio.value || "").trim()) {
    out.push({
      key: "bio",
      label: "Con bio",
      subtitle: "Tiene una bio configurada",
    });
  }

  if (
    String(profileIconKey.value || "").trim() ||
    String(profileEmoji.value || "").trim() ||
    String(status.value || "").trim() ||
    String(profileBanner.value || "").trim() !== "none"
  ) {
    out.push({
      key: "decor",
      label: "Perfil decorado",
      subtitle: "Tiene decoración/estado configurado",
    });
  }

  return out;
}

function computeGlobalBadgesSelfFromApprovedRequests(rows) {
  const out = [...computeGlobalBadgesPublic()];
  const safeRows = Array.isArray(rows) ? rows : [];

  let totalPts = 0;
  let monthPts = 0;
  const performedOnList = [];
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  for (const r of safeRows) {
    const pts =
      typeof r?.points === "number" ? r.points : Number(r?.points || 0);
    const n = Number.isFinite(pts) ? pts : 0;
    totalPts += n;
    const day = String(r?.performedOn || "");
    if (day) performedOnList.push(day);
    if (day.startsWith(ym)) monthPts += n;
  }

  const streak = computeStreakFromDateStrings(performedOnList);

  if (totalPts >= 10)
    out.push({
      key: "g10",
      label: "10+ puntos",
      subtitle: "Total global: 10+ puntos aprobados",
    });
  if (totalPts >= 50)
    out.push({
      key: "g50",
      label: "50+ puntos",
      subtitle: "Total global: 50+ puntos aprobados",
    });
  if (totalPts >= 100)
    out.push({
      key: "g100",
      label: "100+ puntos",
      subtitle: "Total global: 100+ puntos aprobados",
    });

  if (monthPts >= 10)
    out.push({
      key: "m10",
      label: "Mes: 10+",
      subtitle: "Este mes: 10+ puntos aprobados",
    });
  if (monthPts >= 30)
    out.push({
      key: "m30",
      label: "Mes: 30+",
      subtitle: "Este mes: 30+ puntos aprobados",
    });
  if (monthPts >= 60)
    out.push({
      key: "m60",
      label: "Mes: 60+",
      subtitle: "Este mes: 60+ puntos aprobados",
    });

  if (streak.longest >= 3)
    out.push({
      key: "s3",
      label: "Racha 3+",
      subtitle: `Racha máxima: ${streak.longest} días`,
    });
  if (streak.longest >= 7)
    out.push({
      key: "s7",
      label: "Racha 7+",
      subtitle: `Racha máxima: ${streak.longest} días`,
    });
  if (streak.longest >= 30)
    out.push({
      key: "s30",
      label: "Racha 30+",
      subtitle: `Racha máxima: ${streak.longest} días`,
    });

  return out;
}

async function loadGlobalBadges() {
  globalBadgesError.value = "";
  globalBadges.value = [];

  const uid = viewingUid.value;
  if (!uid) return;

  // Para perfiles ajenos: sólo insignias basadas en datos públicos del perfil.
  if (!isSelf.value) {
    globalBadges.value = computeGlobalBadgesPublic();
    return;
  }

  globalBadgesLoading.value = true;
  try {
    const rows = await fetchUserApprovedPointRequestsFirestore({
      uid,
      max: 800,
    });
    globalBadges.value = computeGlobalBadgesSelfFromApprovedRequests(rows);
  } catch (e) {
    globalBadgesError.value = e?.message || "No se pudieron cargar insignias";
  } finally {
    globalBadgesLoading.value = false;
  }
}

async function loadBadges() {
  badgesError.value = "";
  badges.value = [];

  const uid = viewingUid.value;
  const leagueId = leagueIdForBadges.value;
  if (!uid || !leagueId) return;

  badgesLoading.value = true;
  try {
    // Añade chapa de rol dentro de la liga (owner/admin)
    let role = "";
    try {
      const mine = await fetchMyMembershipInLeagueFirestore(leagueId);
      if (mine && String(mine?.uid || "") === uid)
        role = String(mine.role || "");
    } catch {
      role = "";
    }

    const res = await fetchLeagueAthleteAchievementsFirestore({
      leagueId,
      maxRequests: 500,
    });
    badges.value = computeLeagueBadges({
      uid,
      totalsByUid: res?.totalsByUid || {},
      topUid: res?.top?.uid ? String(res.top.uid) : "",
      role,
    });
  } catch (e) {
    badgesError.value = e?.message || "No se pudieron cargar insignias";
  } finally {
    badgesLoading.value = false;
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

  if (!isSelf.value) {
    error.value = "No puedes editar el perfil de otra persona";
    toast.error(error.value);
    return;
  }

  busy.value = true;
  try {
    await awsFetchJson("/me", {
      method: "PUT",
      body: {
        nombre: nombre.value,
        apodo: apodo.value,
        fechaNacimiento: fechaNacimiento.value,
        profileIconKey: String(profileIconKey.value || "").trim(),
        profileBanner: String(profileBanner.value || "classic"),
        profileAccent: String(profileAccent.value || "emerald"),
        profileAccentHex: String(profileAccentHex.value || "").trim(),
        profilePageBg: String(profilePageBg.value || "none"),
        profilePageBgHex: String(profilePageBgHex.value || "").trim(),
        status: String(status.value || "")
          .trim()
          .slice(0, 40),
        bio: String(bio.value || "")
          .trim()
          .slice(0, 200),
      },
    });

    info.value = "Perfil actualizado.";
    toast.success(info.value);
  } catch (e) {
    error.value = e?.message || "No se pudo guardar";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }
}

watch(
  viewingUid,
  () => {
    load();
  },
  { immediate: true },
);

watch(
  [viewingUid, leagueIdForBadges],
  () => {
    loadBadges();
  },
  { immediate: true },
);

watch(
  [viewingUid, isSelf],
  () => {
    loadGlobalBadges();
  },
  { immediate: true },
);
</script>
