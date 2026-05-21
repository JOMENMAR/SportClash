<template>
  <BasePage>
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
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0 cursor-pointer hover:opacity-95 transition"
            :class="accent.badgeWrapClass"
            :title="'Cambiar icono'"
            @click="iconPickerOpen = true"
          >
            <component
              v-if="profileIconComp"
              :is="profileIconComp"
              class="h-6 w-6"
              :class="accent.badgeTextClass"
              :style="badgeTextStyle"
            />
            <span
              v-else
              class="text-lg"
              :class="accent.badgeTextClass"
              :style="badgeTextStyle"
              >{{ profileBadge }}</span
            >
          </button>
          <div
            v-else
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 shrink-0"
            :class="accent.badgeWrapClass"
            aria-hidden
          >
            <component
              v-if="profileIconComp"
              :is="profileIconComp"
              class="h-6 w-6"
              :class="accent.badgeTextClass"
              :style="badgeTextStyle"
            />
            <span
              v-else
              class="text-lg"
              :class="accent.badgeTextClass"
              :style="badgeTextStyle"
              >{{ profileBadge }}</span
            >
          </div>

          <div class="min-w-0">
            <h1
              class="text-2xl font-extrabold tracking-tight leading-none truncate"
              :class="accent.titleTextClass"
              :style="titleTextStyle"
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
              <div class="text-sm text-white/70">Icono del perfil</div>
              <div
                class="mt-1 rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-white">
                      <span class="inline-flex items-center gap-2">
                        <component
                          v-if="profileIconComp"
                          :is="profileIconComp"
                          class="h-5 w-5"
                          :style="badgeTextStyle"
                        />
                        <span
                          v-else
                          class="inline-flex h-5 w-5 items-center justify-center"
                          :style="badgeTextStyle"
                          >{{ profileBadge }}</span
                        >
                      </span>
                      <span class="text-xs font-normal text-white/60">
                        (pulsa el icono de arriba para cambiarlo)
                      </span>
                    </div>
                    <div class="mt-1 text-xs text-white/60">
                      El icono se guarda como una selección (no emoji libre).
                    </div>
                  </div>
                  <button
                    type="button"
                    class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                    @click="iconPickerOpen = true"
                  >
                    Cambiar
                  </button>
                </div>
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
            </div>

            <div>
              <div class="text-sm text-white/70">Bloques del perfil</div>
              <div
                class="mt-1 rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div class="text-xs text-white/60">
                  Elige qué secciones se muestran en la columna derecha.
                </div>

                <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label
                    class="inline-flex items-center gap-2 text-sm text-white/80"
                  >
                    <input
                      v-model="showGlobalBadges"
                      type="checkbox"
                      class="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    Insignias globales
                  </label>

                  <label
                    class="inline-flex items-center gap-2 text-sm text-white/80"
                  >
                    <input
                      v-model="showLeagueBadges"
                      type="checkbox"
                      class="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    Insignias de liga
                  </label>

                  <label
                    class="inline-flex items-center gap-2 text-sm text-white/80"
                  >
                    <input
                      v-model="showBestAchievements"
                      type="checkbox"
                      class="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    Mejores logros
                  </label>

                  <label
                    class="inline-flex items-center gap-2 text-sm text-white/80"
                  >
                    <input
                      v-model="showFavoriteLeague"
                      type="checkbox"
                      class="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    Liga favorita
                  </label>
                </div>

                <div v-if="showFavoriteLeague" class="mt-3">
                  <label class="text-sm text-white/70" for="p-fav-league">
                    Liga favorita
                  </label>
                  <select
                    id="p-fav-league"
                    v-model="favoriteLeagueId"
                    class="sc-dark-select mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                    :disabled="myLeaguesLoading"
                  >
                    <option value="">Ninguna</option>
                    <option v-for="l in myLeagues" :key="l.id" :value="l.id">
                      {{ leagueOptionLabel(l) }}
                    </option>
                  </select>

                  <div
                    v-if="myLeaguesLoading"
                    class="mt-1 text-xs text-white/60"
                  >
                    Cargando tus ligas…
                  </div>
                  <div
                    v-else-if="myLeaguesError"
                    class="mt-1 text-xs text-rose-100"
                  >
                    {{ myLeaguesError }}
                  </div>
                  <div
                    v-else-if="favoriteLeagueMissing"
                    class="mt-1 text-xs text-amber-100"
                  >
                    Esa liga ya no está disponible (puede que la hayas
                    abandonado o se haya borrado). Elige otra o “Ninguna”.
                  </div>
                  <div v-else class="mt-1 text-xs text-white/60">
                    Elige una de tus ligas (pública o privada).
                  </div>
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
            v-if="showGlobalBadges"
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold tracking-tight text-white">
                  Insignias globales
                </h2>
                <p class="mt-1 text-sm text-white/60">
                  Logros generales (y algunos visibles para todos).
                </p>
              </div>

              <button
                v-if="isSelf"
                type="button"
                class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                @click="achievementsOpen = true"
              >
                Ver logros
              </button>
            </div>

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
            v-if="showBestAchievements"
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold tracking-tight text-white">
                  Mejores logros
                </h2>
                <p class="mt-1 text-sm text-white/60">
                  Un resumen rápido de tus logros.
                </p>
              </div>

              <button
                v-if="isSelf"
                type="button"
                class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
                @click="achievementsOpen = true"
              >
                Ver logros
              </button>
            </div>

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
              Cargando…
            </div>

            <div
              v-else-if="!bestAchievements.length"
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
            >
              Aún no hay logros para mostrar.
            </div>

            <div v-else class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="b in bestAchievements"
                :key="b.key"
                class="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10"
                :title="b.subtitle"
              >
                {{ b.label }}
              </span>
            </div>
          </div>

          <div
            v-if="showFavoriteLeague && (isSelf || favoriteLeagueName)"
            class="rounded-2xl border border-white/10 bg-gray-950/50 p-5 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
          >
            <h2 class="text-lg font-bold tracking-tight text-white">
              Liga favorita
            </h2>
            <p class="mt-1 text-sm text-white/60">
              Se muestra en tu perfil si la activas.
            </p>

            <div
              class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80"
            >
              <div v-if="favoriteLeagueName" class="flex items-center gap-2">
                <component
                  v-if="favoriteLeagueIconComp"
                  :is="favoriteLeagueIconComp"
                  class="h-5 w-5 text-white/80"
                />
                <span class="break-words">{{ favoriteLeagueName }}</span>
              </div>
              <template v-else>
                Aún no has configurado tu liga favorita.
              </template>
            </div>
          </div>

          <div
            v-if="showLeagueBadges"
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
                v-if="!emailVerified"
                type="button"
                class="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition disabled:opacity-60"
                :disabled="verifyBusy"
                @click="sendVerifyEmail"
              >
                {{ verifyBusy ? "Enviando…" : "Verificar email" }}
              </button>

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

      <!-- Modal: selector de icono (solo self) -->
      <div
        v-if="iconPickerOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60"
          @click="iconPickerOpen = false"
        />
        <div
          class="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-950/90 p-5 ring-1 ring-white/5 backdrop-blur-xl"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-lg font-bold tracking-tight text-white">
                Elige tu icono
              </div>
              <div class="mt-1 text-sm text-white/60">
                Se mostrará en tu perfil y en listados.
              </div>
            </div>
            <button
              type="button"
              class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="iconPickerOpen = false"
            >
              Cerrar
            </button>
          </div>

          <div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-black/20 p-2 text-center text-lg text-white hover:bg-white/10 transition"
              :class="!profileIconKey ? 'ring-2 ring-emerald-300/60' : ''"
              @click="selectProfileIcon('')"
              title="Inicial"
            >
              {{ displayName.slice(0, 1).toUpperCase() || "·" }}
            </button>

            <button
              v-for="it in PROFILE_ICON_OPTIONS"
              :key="it.key"
              type="button"
              class="rounded-xl border border-white/10 bg-black/20 p-2 text-center text-lg text-white hover:bg-white/10 transition"
              :class="
                profileIconKey === it.key ? 'ring-2 ring-emerald-300/60' : ''
              "
              @click="selectProfileIcon(it.key)"
              :title="it.label"
            >
              <component :is="it.icon" class="h-6 w-6 mx-auto" />
            </button>
          </div>

          <div class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div class="text-sm font-semibold text-white">Colores</div>
            <div class="mt-1 text-xs text-white/60">
              Personaliza el color del icono (cuando no sea inicial) y del
              título.
            </div>

            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="text-sm text-white/70" for="modal-icon-color">
                  Color del icono
                </label>
                <div class="mt-1 flex items-center gap-3">
                  <input
                    id="modal-icon-color"
                    v-model="profileIconColor"
                    type="color"
                    class="h-11 w-14 rounded-xl bg-white/10 ring-1 ring-white/10"
                  />
                  <div class="text-xs text-white/60">
                    Se aplica al icono (la “M” o icono mono-color).
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm text-white/70" for="modal-text-color">
                  Color del texto
                </label>
                <div class="mt-1 flex items-center gap-3">
                  <input
                    id="modal-text-color"
                    v-model="profileTextColor"
                    type="color"
                    class="h-11 w-14 rounded-xl bg-white/10 ring-1 ring-white/10"
                  />
                  <div class="text-xs text-white/60">
                    Se aplica al título principal del perfil.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: logros (pendientes + progreso) -->
      <div
        v-if="achievementsOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60"
          @click="achievementsOpen = false"
        />
        <div
          class="relative w-full max-w-xl rounded-2xl border border-white/10 bg-gray-950/90 p-5 ring-1 ring-white/5 backdrop-blur-xl"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-lg font-bold tracking-tight text-white">
                Logros
              </div>
              <div class="mt-1 text-sm text-white/60">
                Mira lo que tienes y lo que te falta.
              </div>
            </div>
            <button
              type="button"
              class="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15 transition"
              @click="achievementsOpen = false"
            >
              Cerrar
            </button>
          </div>

          <div v-if="achievementsLoading" class="mt-4 text-sm text-white/70">
            Cargando…
          </div>

          <template v-else>
            <div class="mt-4">
              <div class="text-xs font-semibold text-white/70">Logrados</div>
              <div
                v-if="!globalBadges.length"
                class="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
              >
                Aún no has logrado nada.
              </div>
              <div v-else class="mt-2 flex flex-wrap gap-2">
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

            <div class="mt-5">
              <div class="text-xs font-semibold text-white/70">Pendientes</div>
              <div
                v-if="!pendingAchievements.length"
                class="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70"
              >
                No tienes pendientes ahora mismo.
              </div>

              <ul v-else class="mt-2 space-y-2">
                <li
                  v-for="a in pendingAchievements"
                  :key="a.key"
                  class="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-white">
                        {{ a.label }}
                      </div>
                      <div class="mt-1 text-xs text-white/60">
                        {{ a.hint }}
                      </div>
                    </div>
                    <div class="text-xs font-semibold text-white/70">
                      {{ a.progressText }}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import BasePage from "./BasePage.vue";
import { toast } from "../services/toasts";
import ConfirmModal from "./ConfirmModal.vue";
import {
  PROFILE_BANNER_OPTIONS,
  getProfileAccent,
  getProfileBannerLayers,
  isProfileAccentKey,
  isProfileBannerKey,
} from "../services/profileDecor";
import {
  LEAGUE_ICON_OPTIONS,
  isLeagueIconKey,
  leagueIconComponent,
} from "../services/leagueIcons";
import {
  fetchLeagueAthleteAchievementsFirestore,
  fetchMyLeaguesFirestore,
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

const iconPickerOpen = ref(false);
const achievementsOpen = ref(false);
const achievementsLoading = ref(false);

const nombre = ref("");
const apodo = ref("");
const fechaNacimiento = ref("");
const profileEmoji = ref("");
const profileIconKey = ref("");
const profileBanner = ref("classic");
const profileAccent = ref("emerald");
const profileIconColor = ref("#D1FAE5");
const profileTextColor = ref("#6EE7B7");
const status = ref("");
const bio = ref("");

const showGlobalBadges = ref(true);
const showLeagueBadges = ref(true);
const showFavoriteLeague = ref(false);
const showBestAchievements = ref(false);
const favoriteLeagueId = ref("");
const favoriteLeagueName = ref("");
const favoriteLeagueIconKey = ref("");

const myLeaguesLoading = ref(false);
const myLeaguesError = ref("");
const myLeagues = ref([]);

const badgesLoading = ref(false);
const badgesError = ref("");
const badges = ref([]);

const globalBadgesLoading = ref(false);
const globalBadgesError = ref("");
const globalBadges = ref([]);

const pendingAchievements = ref([]);

const verifyBusy = ref(false);

const PROFILE_ICON_OPTIONS = LEAGUE_ICON_OPTIONS;

function isHex6(s) {
  return /^#[0-9a-fA-F]{6}$/.test(String(s || ""));
}

function defaultColorsFromAccent(key) {
  const k = String(key || "emerald");
  if (k === "sky") return { icon: "#E0F2FE", text: "#7DD3FC" };
  if (k === "rose") return { icon: "#FFE4E6", text: "#FDA4AF" };
  if (k === "neutral") return { icon: "#FFFFFF", text: "#FFFFFF" };
  // emerald (default)
  return { icon: "#D1FAE5", text: "#6EE7B7" };
}

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

const accent = computed(() => getProfileAccent(profileAccent.value));

const bannerLayers = computed(() =>
  getProfileBannerLayers(profileBanner.value).map((x) => ({
    class: String(x?.class || ""),
  })),
);

const profileBadge = computed(() => {
  const n = String(displayName.value || "").trim();
  if (!n) return "·";
  return n.slice(0, 1).toUpperCase();
});

const profileIconComp = computed(() => {
  return leagueIconComponent(profileIconKey.value);
});

const badgeTextStyle = computed(() => {
  return isHex6(profileIconColor.value)
    ? { color: profileIconColor.value }
    : {};
});

const titleTextStyle = computed(() => {
  return isHex6(profileTextColor.value)
    ? { color: profileTextColor.value }
    : {};
});

const email = computed(() => auth.currentUser?.email ?? "—");
const emailVerified = computed(() => auth.currentUser?.emailVerified ?? false);

const favoriteLeagueIconComp = computed(() => {
  return leagueIconComponent(favoriteLeagueIconKey.value);
});

const favoriteLeagueMissing = computed(() => {
  if (!isSelf.value) return false;
  if (myLeaguesLoading.value) return false;
  if (myLeaguesError.value) return false;
  const id = String(favoriteLeagueId.value || "").trim();
  if (!id) return false;
  const list = Array.isArray(myLeagues.value) ? myLeagues.value : [];
  return !list.some((x) => String(x?.id || "").trim() === id);
});

const bestAchievements = computed(() => {
  const rows = Array.isArray(globalBadges.value) ? globalBadges.value : [];
  const weight = (key) => {
    const k = String(key || "");
    if (k === "g100") return 100;
    if (k === "g50") return 90;
    if (k === "g10") return 80;
    if (k === "m60") return 70;
    if (k === "m30") return 65;
    if (k === "m10") return 60;
    if (k === "s30") return 55;
    if (k === "s7") return 50;
    if (k === "s3") return 45;
    if (k === "decor") return 10;
    if (k === "bio") return 5;
    return 20;
  };

  return [...rows].sort((a, b) => weight(b?.key) - weight(a?.key)).slice(0, 3);
});

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
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      nombre.value = data?.nombre ?? "";
      apodo.value = data?.apodo ?? "";
      fechaNacimiento.value = data?.fechaNacimiento ?? "";
      profileEmoji.value = data?.profileEmoji ?? "";
      const loadedIconKey = String(data?.profileIconKey || "").trim();
      profileIconKey.value = isLeagueIconKey(loadedIconKey)
        ? loadedIconKey
        : "";
      profileBanner.value = isProfileBannerKey(data?.profileBanner)
        ? data.profileBanner
        : "classic";
      profileAccent.value = isProfileAccentKey(data?.profileAccent)
        ? data.profileAccent
        : "emerald";

      const defaults = defaultColorsFromAccent(profileAccent.value);
      const iconC = String(data?.profileIconColor || "").trim();
      const textC = String(data?.profileTextColor || "").trim();
      profileIconColor.value = isHex6(iconC) ? iconC : defaults.icon;
      profileTextColor.value = isHex6(textC) ? textC : defaults.text;

      status.value = String(data?.status ?? "").slice(0, 40);
      bio.value = String(data?.bio ?? "").slice(0, 200);

      const blocks = data?.profileBlocks || {};
      showGlobalBadges.value =
        typeof blocks?.showGlobalBadges === "boolean"
          ? blocks.showGlobalBadges
          : true;
      showLeagueBadges.value =
        typeof blocks?.showLeagueBadges === "boolean"
          ? blocks.showLeagueBadges
          : true;
      showFavoriteLeague.value =
        typeof blocks?.showFavoriteLeague === "boolean"
          ? blocks.showFavoriteLeague
          : false;
      showBestAchievements.value =
        typeof blocks?.showBestAchievements === "boolean"
          ? blocks.showBestAchievements
          : false;

      favoriteLeagueId.value = String(data?.favoriteLeagueId ?? "").trim();
      favoriteLeagueName.value = String(data?.favoriteLeagueName ?? "")
        .trim()
        .slice(0, 80);

      const favIcon = String(data?.favoriteLeagueIconKey ?? "").trim();
      favoriteLeagueIconKey.value = isLeagueIconKey(favIcon) ? favIcon : "";

      // Compatibilidad: antes era texto libre.
      if (!favoriteLeagueName.value) {
        const legacy = String(data?.favoriteLeagueText ?? "")
          .trim()
          .slice(0, 80);
        if (legacy) favoriteLeagueName.value = legacy;
      }
      toast.info("Perfil cargado", { timeoutMs: 1400 });
    }
  } catch (e) {
    error.value = e?.message || "No se pudo cargar el perfil";
    toast.error(error.value);
  } finally {
    busy.value = false;
  }

  // Actualiza insignias globales cuando cambie el perfil.
  loadGlobalBadges();
}

function leagueOptionLabel(l) {
  const name = String(l?.name || "").trim() || "Liga";
  const vis = l?.visibility === "private" ? " (Privada)" : "";
  return `${name}${vis}`;
}

function syncFavoriteLeagueFromMyLeagues() {
  const id = String(favoriteLeagueId.value || "").trim();
  if (!id) {
    favoriteLeagueName.value = "";
    favoriteLeagueIconKey.value = "";
    return;
  }

  const list = Array.isArray(myLeagues.value) ? myLeagues.value : [];
  const found = list.find((x) => String(x?.id || "").trim() === id);
  if (!found) return;

  favoriteLeagueName.value = String(found?.name || "")
    .trim()
    .slice(0, 80);
  const icon = String(found?.iconKey || "").trim();
  favoriteLeagueIconKey.value = isLeagueIconKey(icon) ? icon : "";
}

async function loadMyLeaguesList() {
  if (!isSelf.value) return;
  myLeaguesError.value = "";
  myLeaguesLoading.value = true;
  try {
    const list = await fetchMyLeaguesFirestore({ max: 100 });
    myLeagues.value = [...(Array.isArray(list) ? list : [])].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
    syncFavoriteLeagueFromMyLeagues();
  } catch (e) {
    myLeaguesError.value = e?.message || "No se pudieron cargar tus ligas";
  } finally {
    myLeaguesLoading.value = false;
  }
}

function selectProfileIcon(key) {
  profileIconKey.value = String(key || "").trim();
  // mantenemos compatibilidad con profileEmoji, pero al elegir icono lo vaciamos.
  profileEmoji.value = "";
  iconPickerOpen.value = false;
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

  const decorChecks = [
    Boolean(String(bio.value || "").trim()),
    Boolean(String(status.value || "").trim()),
    String(profileBanner.value || "").trim() !== "none",
    Boolean(
      leagueIconComponent(profileIconKey.value) ||
      String(profileEmoji.value || "").trim(),
    ),
  ];
  const decorScore = decorChecks.filter(Boolean).length;
  const decorTotal = decorChecks.length;
  if (decorScore > 0) {
    out.push({
      key: "decor",
      label: decorScore >= decorTotal ? "Decoración completa" : "Decoración",
      subtitle:
        decorScore >= decorTotal
          ? "Tiene el perfil totalmente personalizado"
          : `Personalización: ${decorScore}/${decorTotal}`,
    });
  }

  return out;
}

function computePendingAchievements({
  totalPts,
  monthPts,
  streakLongest,
  decorScore,
  decorTotal,
}) {
  const out = [];

  const decorOk = decorScore >= decorTotal;
  if (!decorOk) {
    out.push({
      key: "decor",
      label: "Decoración del perfil",
      hint: "Completa tu bio/estado/banner/icono para tener un perfil más completo.",
      progressText: `${decorScore}/${decorTotal}`,
    });
  }

  const totalTargets = [10, 50, 100];
  for (const t of totalTargets) {
    if (totalPts >= t) continue;
    out.push({
      key: `total_${t}`,
      label: `${t}+ puntos (total)`,
      hint: `Te faltan ${t - totalPts} puntos aprobados.`,
      progressText: `${totalPts}/${t}`,
    });
  }

  const monthTargets = [10, 30, 60];
  for (const t of monthTargets) {
    if (monthPts >= t) continue;
    out.push({
      key: `month_${t}`,
      label: `${t}+ puntos (mes)`,
      hint: `Te faltan ${t - monthPts} puntos aprobados este mes.`,
      progressText: `${monthPts}/${t}`,
    });
  }

  const streakTargets = [3, 7, 30];
  for (const t of streakTargets) {
    if (streakLongest >= t) continue;
    out.push({
      key: `streak_${t}`,
      label: `Racha ${t}+ (máxima)`,
      hint: `Tu racha máxima es ${streakLongest} días.`,
      progressText: `${streakLongest}/${t}`,
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
  pendingAchievements.value = [];

  const uid = viewingUid.value;
  if (!uid) return;

  // Para perfiles ajenos: sólo insignias basadas en datos públicos del perfil.
  if (!isSelf.value) {
    globalBadges.value = computeGlobalBadgesPublic();
    return;
  }

  globalBadgesLoading.value = true;
  achievementsLoading.value = true;
  try {
    const rows = await fetchUserApprovedPointRequestsFirestore({
      uid,
      max: 800,
    });
    globalBadges.value = computeGlobalBadgesSelfFromApprovedRequests(rows);

    // Stats para pendientes
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

    const decorChecks = [
      Boolean(String(bio.value || "").trim()),
      Boolean(String(status.value || "").trim()),
      String(profileBanner.value || "").trim() !== "none",
      Boolean(
        leagueIconComponent(profileIconKey.value) ||
        String(profileEmoji.value || "").trim(),
      ),
    ];
    const decorScore = decorChecks.filter(Boolean).length;
    const decorTotal = decorChecks.length;
    pendingAchievements.value = computePendingAchievements({
      totalPts,
      monthPts,
      streakLongest: streak.longest,
      decorScore,
      decorTotal,
    });
  } catch (e) {
    globalBadgesError.value = e?.message || "No se pudieron cargar insignias";
  } finally {
    globalBadgesLoading.value = false;
    achievementsLoading.value = false;
  }
}

async function sendVerifyEmail() {
  const user = auth.currentUser;
  if (!user) return;

  verifyBusy.value = true;
  try {
    await sendEmailVerification(user);
    toast.success("Te hemos enviado un correo de verificación.");
  } catch (e) {
    toast.error(e?.message || "No se pudo enviar el email");
  } finally {
    verifyBusy.value = false;
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
      const memberId = `${leagueId}_${uid}`;
      const mSnap = await getDoc(doc(db, "leagueMembers", memberId));
      if (mSnap.exists()) role = String(mSnap.data()?.role || "");
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
    // Asegura que nombre/icono estén sincronizados con el selector.
    syncFavoriteLeagueFromMyLeagues();

    // Si se ha borrado/abandonado la liga, limpiamos la selección.
    if (showFavoriteLeague.value && favoriteLeagueMissing.value) {
      favoriteLeagueId.value = "";
      favoriteLeagueName.value = "";
      favoriteLeagueIconKey.value = "";
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        nombre: nombre.value,
        apodo: apodo.value,
        fechaNacimiento: fechaNacimiento.value,
        profileEmoji: String(profileEmoji.value || "").trim(),
        profileIconKey: String(profileIconKey.value || "").trim(),
        profileBanner: String(profileBanner.value || "classic"),
        profileAccent: String(profileAccent.value || "emerald"),
        profileIconColor: isHex6(profileIconColor.value)
          ? profileIconColor.value
          : defaultColorsFromAccent(profileAccent.value).icon,
        profileTextColor: isHex6(profileTextColor.value)
          ? profileTextColor.value
          : defaultColorsFromAccent(profileAccent.value).text,
        status: String(status.value || "")
          .trim()
          .slice(0, 40),
        bio: String(bio.value || "")
          .trim()
          .slice(0, 200),
        profileBlocks: {
          showGlobalBadges: !!showGlobalBadges.value,
          showLeagueBadges: !!showLeagueBadges.value,
          showFavoriteLeague: !!showFavoriteLeague.value,
          showBestAchievements: !!showBestAchievements.value,
        },
        favoriteLeagueId: String(favoriteLeagueId.value || "").trim(),
        favoriteLeagueName: String(favoriteLeagueName.value || "")
          .trim()
          .slice(0, 80),
        favoriteLeagueIconKey: String(favoriteLeagueIconKey.value || "")
          .trim()
          .slice(0, 40),

        // Compatibilidad con versiones anteriores (cuando era texto libre)
        favoriteLeagueText: String(favoriteLeagueName.value || "")
          .trim()
          .slice(0, 80),
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

watch(
  [isSelf, showFavoriteLeague],
  () => {
    if (isSelf.value && showFavoriteLeague.value) {
      loadMyLeaguesList();
    }
  },
  { immediate: true },
);

watch(favoriteLeagueId, () => {
  syncFavoriteLeagueFromMyLeagues();
});
</script>
