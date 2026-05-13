<template>
  <BasePage>
    <div class="w-full max-w-5xl mx-auto">
      <header
        class="flex flex-col gap-3 p-5 border shadow-2xl rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs text-white/60">
              {{
                league?.visibility === "public"
                  ? "Liga pública"
                  : "Liga privada"
              }}
              <template v-if="roleLabel"> · {{ roleLabel }}</template>
            </div>
            <h1
              class="mt-1 text-2xl font-extrabold leading-none tracking-tight truncate text-emerald-300"
            >
              {{ league?.name || "Liga" }}
            </h1>
            <div class="mt-1 text-sm text-white/60">
              Límite diario:
              <span class="font-semibold text-white">{{
                league?.dailyPointsLimit ?? "-"
              }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
              @click="$emit('back')"
            >
              Volver
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-2">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition rounded-xl ring-1"
            :class="
              activeTab === t.key
                ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
                : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
            "
            @click="activeTab = t.key"
          >
            <span class="text-current" v-html="tabIconSvg(t.icon)" />
            {{ t.label }}
          </button>
        </div>
      </header>

      <main
        class="p-5 mt-6 border rounded-2xl border-white/10 bg-gray-950/50 ring-1 ring-white/5 backdrop-blur-xl sm:p-6"
      >
        <div
          v-if="loading"
          class="p-4 border rounded-2xl border-white/10 bg-black/20"
        >
          <div class="text-sm text-white/70">Cargando liga…</div>
        </div>

        <div
          v-else-if="error"
          class="p-4 border rounded-2xl border-rose-400/20 bg-rose-500/10"
        >
          <div class="text-sm font-semibold text-rose-100">{{ error }}</div>
          <button
            type="button"
            class="px-4 py-2 mt-3 text-sm font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
            @click="load()"
          >
            Reintentar
          </button>
        </div>

        <template v-else>
          <!-- Vista visitante (no miembro) -->
          <div v-if="!membership">
            <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
              <div class="text-sm text-white/70">
                No eres miembro todavía.
                <template v-if="league?.visibility === 'public'">
                  Puedes ver el resumen, y solicitar unirte.
                </template>
                <template v-else>
                  Necesitas solicitar unirte para acceder al contenido.
                </template>
              </div>

              <button
                type="button"
                class="mt-3 w-full rounded-xl bg-emerald-300 py-2.5 text-sm font-semibold text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 transition active:scale-[0.98]"
                :disabled="busy || myJoinRequest?.status === 'pending'"
                @click="requestJoin"
              >
                {{
                  busy
                    ? "Enviando solicitud…"
                    : myJoinRequest?.status === "pending"
                      ? "Solicitud pendiente"
                      : "Solicitar unirme"
                }}
              </button>

              <div v-if="joinMsg" class="mt-3 text-sm text-white/70">
                {{ joinMsg }}
              </div>

              <div v-else-if="myJoinRequest" class="mt-3 text-sm text-white/70">
                Estado de tu solicitud:
                <span class="font-semibold text-white">{{
                  myJoinRequest.status
                }}</span>
              </div>
            </div>

            <div
              v-if="league?.visibility === 'public'"
              class="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-2"
            >
              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Atletas</div>
                <div class="mt-1 text-sm text-white/70">
                  Visible cuando seas miembro.
                </div>
              </div>
              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Puntos</div>
                <div class="mt-1 text-sm text-white/70">
                  Visible cuando seas miembro.
                </div>
              </div>
            </div>
          </div>

          <!-- Vista miembro -->
          <div v-else>
            <div v-if="activeTab === 'athletes'" class="space-y-3">
              <div class="text-sm text-white/70">Atletas de la liga.</div>
              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="text-xs text-white/60">Tu rol</div>
                <div class="mt-1 font-semibold">{{ membership.role }}</div>
              </div>

              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-xs text-white/60">Miembros</div>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                    :disabled="membersLoading"
                    @click="loadMembers"
                  >
                    {{ membersLoading ? "Cargando…" : "Actualizar" }}
                  </button>
                </div>

                <div v-if="membersError" class="mt-2 text-sm text-rose-200">
                  {{ membersError }}
                </div>

                <div
                  v-else-if="membersLoading"
                  class="mt-2 text-sm text-white/70"
                >
                  Cargando miembros…
                </div>

                <div
                  v-else-if="!members.length"
                  class="mt-2 text-sm text-white/70"
                >
                  Aún no hay miembros (o no tienes permisos para verlos).
                </div>

                <ul v-else class="mt-3 space-y-2">
                  <li
                    v-for="m in members"
                    :key="m.id"
                    class="p-3 border rounded-xl border-white/10 bg-white/5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-white">
                          <span class="text-white/80">{{
                            userLabel(m.uid)
                          }}</span>
                          <span class="ml-2 text-xs font-normal text-white/50">
                            ({{ uidShort(m.uid) }})
                          </span>
                        </div>
                        <div class="mt-1 text-xs text-white/60">
                          rol: <span class="font-semibold">{{ m.role }}</span>
                        </div>
                      </div>
                      <div class="text-[11px] text-white/50">{{ m.id }}</div>
                    </div>

                    <div
                      v-if="canManageMembers && m.uid !== myUid"
                      class="mt-3"
                    >
                      <div
                        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div class="flex items-center gap-2">
                          <label class="text-xs text-white/60">Rol:</label>
                          <select
                            v-model="memberRoleDraft[m.id]"
                            class="px-3 py-2 text-xs text-white rounded-xl bg-white/10 ring-1 ring-white/10 focus:outline-none"
                            :disabled="
                              memberBusyId === m.id || m.role === 'owner'
                            "
                          >
                            <option value="member">member</option>
                            <option v-if="isOwner" value="admin">admin</option>
                          </select>

                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold transition rounded-xl bg-emerald-300 text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 disabled:opacity-60"
                            :disabled="
                              memberBusyId === m.id ||
                              m.role === 'owner' ||
                              memberRoleDraft[m.id] === m.role
                            "
                            @click="saveMemberRole(m)"
                          >
                            {{ memberBusyId === m.id ? "..." : "Guardar rol" }}
                          </button>
                        </div>

                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-rose-500/80 ring-1 ring-rose-400/30 hover:bg-rose-500 disabled:opacity-60"
                          :disabled="
                            memberBusyId === m.id || m.role === 'owner'
                          "
                          @click="openConfirmKick(m)"
                        >
                          {{ memberBusyId === m.id ? "..." : "Expulsar" }}
                        </button>
                      </div>

                      <div
                        v-if="membersActionMsg"
                        class="mt-2 text-xs text-white/70"
                      >
                        {{ membersActionMsg }}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div v-else-if="activeTab === 'points'" class="space-y-3">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-3 py-2 text-xs font-semibold transition rounded-xl ring-1"
                  :class="
                    pointsTab === 'mine'
                      ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
                      : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
                  "
                  @click="pointsTab = 'mine'"
                >
                  Mis solicitudes
                </button>
                <button
                  v-if="canModerate"
                  type="button"
                  class="px-3 py-2 text-xs font-semibold transition rounded-xl ring-1"
                  :class="
                    pointsTab === 'moderate'
                      ? 'bg-emerald-300 text-gray-950 ring-emerald-200/30'
                      : 'bg-white/10 text-white ring-white/10 hover:bg-white/15'
                  "
                  @click="pointsTab = 'moderate'"
                >
                  Aceptar puntos
                </button>
              </div>

              <!-- Mis puntos / solicitudes -->
              <div v-if="pointsTab === 'mine'" class="space-y-3">
                <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                  <div class="text-xs text-white/60">Solicitar puntos</div>
                  <div class="flex flex-col gap-2 mt-2 sm:flex-row">
                    <input
                      v-model="performedOn"
                      type="date"
                      class="px-3 py-2 text-sm text-white rounded-xl bg-white/10 ring-1 ring-white/10 focus:outline-none"
                    />
                    <input
                      v-model.trim="note"
                      type="text"
                      class="w-full px-3 py-2 text-sm text-white rounded-xl bg-white/10 ring-1 ring-white/10 focus:outline-none"
                      placeholder="Nota (opcional)"
                    />
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-semibold transition rounded-xl bg-emerald-300 text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95"
                      :disabled="busy"
                      @click="requestPoints"
                    >
                      {{ busy ? "Enviando…" : "Solicitar" }}
                    </button>
                  </div>
                  <div class="mt-2 text-xs text-white/60">
                    Cada solicitud vale
                    <span class="font-semibold text-white">1</span> punto.
                    <span class="block mt-1 text-white/60">
                      La fecha es obligatoria.
                    </span>
                  </div>
                  <div v-if="pointsMsg" class="mt-2 text-sm text-white/70">
                    {{ pointsMsg }}
                  </div>
                </div>

                <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-xs text-white/60">Mis solicitudes</div>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="rejectedMyRequests.length"
                        type="button"
                        class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                        @click="showRejectedModal = true"
                      >
                        Rechazadas ({{ rejectedMyRequests.length }})
                      </button>
                      <button
                        type="button"
                        class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                        :disabled="myReqLoading"
                        @click="loadMyRequests"
                      >
                        {{ myReqLoading ? "Cargando…" : "Actualizar" }}
                      </button>
                    </div>
                  </div>

                  <div v-if="myReqError" class="mt-2 text-sm text-rose-200">
                    {{ myReqError }}
                  </div>

                  <div
                    v-else-if="myReqLoading"
                    class="mt-2 text-sm text-white/70"
                  >
                    Cargando tus solicitudes…
                  </div>

                  <div
                    v-else-if="!visibleMyRequests.length"
                    class="mt-2 text-sm text-white/70"
                  >
                    No tienes solicitudes visibles.
                    <span v-if="rejectedMyRequests.length">
                      (Tienes {{ rejectedMyRequests.length }} rechazadas en el
                      historial.)
                    </span>
                  </div>

                  <ul v-else class="mt-3 space-y-2">
                    <li
                      v-for="r in visibleMyRequests"
                      :key="r.id"
                      class="p-3 border rounded-xl border-white/10 bg-white/5"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <div class="text-sm font-semibold text-white">
                            <span
                              class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-lg"
                              :class="
                                r.status === 'pending'
                                  ? 'bg-white/10 text-white'
                                  : r.status === 'approved'
                                    ? 'bg-emerald-300 text-gray-950'
                                    : 'bg-rose-500/80 text-white'
                              "
                            >
                              {{
                                r.status === "pending"
                                  ? "pendiente"
                                  : r.status === "approved"
                                    ? "aprobada"
                                    : "rechazada"
                              }}
                            </span>
                            <span
                              class="ml-2 text-xs font-normal text-white/60"
                            >
                              · +{{ r.points }}
                            </span>
                          </div>

                          <div class="mt-2">
                            <input
                              v-model.trim="myEditNote[r.id]"
                              type="text"
                              class="w-full px-3 py-2 text-sm text-white rounded-xl bg-white/10 ring-1 ring-white/10 focus:outline-none"
                              :disabled="
                                r.status !== 'pending' || myReqBusyId === r.id
                              "
                              placeholder="Nota (opcional)"
                            />
                          </div>
                        </div>

                        <div class="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
                            :disabled="
                              r.status !== 'pending' || myReqBusyId === r.id
                            "
                            @click="saveMyRequest(r)"
                          >
                            {{ myReqBusyId === r.id ? "..." : "Guardar" }}
                          </button>
                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-rose-500/80 ring-1 ring-rose-400/30 hover:bg-rose-500 disabled:opacity-60"
                            :disabled="
                              r.status !== 'pending' || myReqBusyId === r.id
                            "
                            @click="openConfirmDeleteRequest(r)"
                          >
                            {{ myReqBusyId === r.id ? "..." : "Borrar" }}
                          </button>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>

                <!-- Modal: Historial de rechazadas (overlay global) -->
                <Teleport to="body">
                  <div
                    v-if="showRejectedModal"
                    class="fixed inset-0 z-[9999] overflow-hidden"
                    @click.self="showRejectedModal = false"
                  >
                    <div
                      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <!-- Cubo centrado que NUNCA provoca scroll fuera -->
                    <div
                      class="absolute inset-0 grid items-start justify-items-center p-4 pt-[6vh] sm:pt-[8vh]"
                    >
                      <div
                        class="relative flex flex-col w-full overflow-hidden border shadow-2xl rounded-2xl border-white/10 bg-gray-950/80 ring-1 ring-white/5"
                        style="
                          width: min(92vw, 42rem);
                          max-height: min(72dvh, 560px);
                        "
                      >
                        <div
                          class="flex items-start justify-between gap-3 p-4 border-b border-white/10 bg-white/5"
                        >
                          <div>
                            <div class="text-sm font-semibold text-white">
                              Historial de rechazadas
                            </div>
                            <div class="mt-1 text-xs text-white/60">
                              Estas solicitudes no cuentan. Puedes revisarlas y
                              crear una nueva si hace falta.
                            </div>
                          </div>
                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                            @click="showRejectedModal = false"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div class="flex-1 p-4 overflow-hidden">
                          <div
                            v-if="!rejectedMyRequests.length"
                            class="text-sm text-white/70"
                          >
                            No tienes rechazadas.
                          </div>

                          <div
                            v-else
                            class="overflow-x-hidden overflow-y-auto"
                            style="max-height: 396px"
                          >
                            <ul class="flex flex-col justify-end gap-2">
                              <li
                                v-for="r in rejectedMyRequests"
                                :key="r.id"
                                class="p-3 border rounded-xl border-white/10 bg-white/5"
                              >
                                <div
                                  class="flex items-start justify-between gap-3"
                                >
                                  <div class="min-w-0">
                                    <div
                                      class="text-sm font-semibold text-white"
                                    >
                                      Rechazada · +{{ r.points }}
                                    </div>
                                    <div
                                      v-if="r.note"
                                      class="mt-1 text-xs text-white/70"
                                    >
                                      Tu nota: “{{ r.note }}”
                                    </div>
                                    <div
                                      v-if="r.rejectReason"
                                      class="p-2 mt-2 text-xs border rounded-xl border-rose-400/20 bg-rose-500/10 text-rose-100"
                                    >
                                      <span class="font-semibold">Motivo:</span>
                                      <span class="opacity-90">{{
                                        r.rejectReason
                                      }}</span>
                                    </div>
                                    <div
                                      v-if="r.rejectedOn"
                                      class="mt-2 text-[11px] text-white/60"
                                    >
                                      Rechazada el:
                                      <span class="font-semibold">{{
                                        r.rejectedOn
                                      }}</span>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Teleport>
              </div>

              <!-- Moderación (admins/mods) -->
              <div v-else class="space-y-3">
                <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-xs text-white/60">
                      Solicitudes pendientes
                    </div>
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                      :disabled="pendingLoading"
                      @click="loadPending"
                    >
                      {{ pendingLoading ? "Cargando…" : "Actualizar" }}
                    </button>
                  </div>

                  <div v-if="pendingError" class="mt-2 text-sm text-rose-200">
                    {{ pendingError }}
                  </div>

                  <div
                    v-else-if="pendingLoading"
                    class="mt-2 text-sm text-white/70"
                  >
                    Cargando solicitudes…
                  </div>

                  <div
                    v-else-if="!pendingRequests.length"
                    class="mt-2 text-sm text-white/70"
                  >
                    No hay solicitudes pendientes.
                  </div>

                  <ul v-else class="mt-3 space-y-2">
                    <li
                      v-for="r in pendingRequests"
                      :key="r.id"
                      class="p-3 border rounded-xl border-white/10 bg-white/5"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <div class="text-sm font-semibold text-white">
                            +{{ r.points }}
                            <span class="text-xs font-normal text-white/60">
                              · {{ userLabel(r.uid) }} ({{ uidShort(r.uid) }})
                            </span>
                          </div>
                          <div v-if="r.note" class="mt-1 text-xs text-white/70">
                            “{{ r.note }}”
                          </div>

                          <div class="mt-2">
                            <input
                              v-model.trim="rejectDraft[r.id]"
                              type="text"
                              class="w-full px-3 py-2 text-xs text-white rounded-xl bg-white/10 ring-1 ring-white/10 focus:outline-none"
                              :disabled="moderateBusyId === r.id"
                              placeholder="Motivo (solo si rechazas)"
                            />
                          </div>
                        </div>

                        <div class="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold transition rounded-xl bg-emerald-300 text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 disabled:opacity-60"
                            :disabled="
                              moderateBusyId === r.id ||
                              (isOwnPointRequest(r) && !canSelfModerate)
                            "
                            @click="decideRequest(r, 'approved')"
                          >
                            {{ moderateBusyId === r.id ? "..." : "Aprobar" }}
                          </button>
                          <button
                            type="button"
                            class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-rose-500/80 ring-1 ring-rose-400/30 hover:bg-rose-500 disabled:opacity-60"
                            :disabled="
                              moderateBusyId === r.id ||
                              (isOwnPointRequest(r) && !canSelfModerate)
                            "
                            @click="decideRequest(r, 'rejected')"
                          >
                            {{ moderateBusyId === r.id ? "..." : "Rechazar" }}
                          </button>
                        </div>

                        <div
                          v-if="isOwnPointRequest(r) && !canSelfModerate"
                          class="mt-2 text-[11px] text-white/50"
                        >
                          No puedes moderar tu propia solicitud.
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'ranking'" class="space-y-3">
              <div class="text-sm text-white/70">
                Ranking por puntos aprobados.
              </div>

              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-xs text-white/60">Tabla</div>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                    :disabled="rankingLoading"
                    @click="loadRanking"
                  >
                    {{ rankingLoading ? "Cargando…" : "Actualizar" }}
                  </button>
                </div>

                <div v-if="rankingError" class="mt-2 text-sm text-rose-200">
                  {{ rankingError }}
                </div>
                <div
                  v-else-if="rankingLoading"
                  class="mt-2 text-sm text-white/70"
                >
                  Cargando ranking…
                </div>
                <div
                  v-else-if="!rankingRows.length"
                  class="mt-2 text-sm text-white/70"
                >
                  Aún no hay puntos aprobados.
                </div>

                <ol v-else class="mt-3 space-y-2">
                  <li
                    v-for="row in rankingRows"
                    :key="row.uid"
                    class="p-3 border rounded-xl border-white/10 bg-white/5"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-white truncate">
                          #{{ row.rank }} · {{ userLabel(row.uid) }}
                          <span class="ml-2 text-xs font-normal text-white/50">
                            ({{ uidShort(row.uid) }})
                          </span>
                        </div>
                        <div class="mt-1 text-xs text-white/60">
                          Puntos aprobados:
                          <span class="font-semibold">{{ row.points }}</span>
                        </div>
                      </div>
                      <div class="text-lg font-extrabold text-emerald-300">
                        {{ row.points }}
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <div v-else-if="activeTab === 'history'" class="space-y-3">
              <div class="p-4 border rounded-2xl border-white/10 bg-black/20">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-xs text-white/60">Historial</div>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                    :disabled="historyLoading"
                    @click="loadHistory"
                  >
                    {{ historyLoading ? "Cargando…" : "Actualizar" }}
                  </button>
                </div>

                <div v-if="historyError" class="mt-2 text-sm text-rose-200">
                  {{ historyError }}
                </div>

                <div
                  v-else-if="historyLoading"
                  class="mt-2 text-sm text-white/70"
                >
                  Cargando historial…
                </div>

                <div
                  v-else-if="!historyItems.length"
                  class="mt-2 text-sm text-white/70"
                >
                  Aún no hay eventos.
                </div>

                <ul v-else class="mt-3 space-y-2">
                  <li
                    v-for="it in historyItems"
                    :key="it.id"
                    class="p-3 border rounded-xl border-white/10 bg-white/5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-white truncate">
                          {{ historyTitle(it) }}
                        </div>
                        <div class="mt-1 text-xs break-words text-white/60">
                          {{ historySubtitle(it) }}
                        </div>
                      </div>
                      <div class="text-[11px] text-white/50">
                        {{ historyMeta(it) }}
                      </div>
                    </div>

                    <details class="mt-2">
                      <summary class="text-xs cursor-pointer text-white/70">
                        Ver detalle
                      </summary>
                      <pre
                        class="mt-2 p-2 overflow-auto text-[11px] leading-snug rounded-lg bg-black/30 text-white/70"
                        >{{ JSON.stringify(it.payload || {}, null, 2) }}</pre
                      >
                    </details>
                  </li>
                </ul>
              </div>

              <div class="text-xs text-white/50">
                Tip: aquí verás quién solicitó, quién gestionó (aprobó/rechazó),
                y el motivo cuando exista.
              </div>
            </div>

            <div
              v-else-if="activeTab === 'join'"
              class="p-4 border rounded-2xl border-white/10 bg-black/20"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs text-white/60">Solicitudes de unión</div>
                <button
                  type="button"
                  class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                  :disabled="joinLoading"
                  @click="loadJoinRequests"
                >
                  {{ joinLoading ? "Cargando…" : "Actualizar" }}
                </button>
              </div>

              <div v-if="joinError" class="mt-2 text-sm text-rose-200">
                {{ joinError }}
              </div>

              <div v-else-if="joinLoading" class="mt-2 text-sm text-white/70">
                Cargando solicitudes…
              </div>

              <template v-else>
                <div class="mt-2 text-sm text-white/70">
                  <template v-if="!canModerate">
                    Solo admins/owners pueden moderar uniones.
                  </template>
                  <template v-else>
                    Aprueba o rechaza solicitudes pendientes para añadir
                    miembros.
                  </template>
                </div>

                <div
                  v-if="canModerate && !pendingJoinRequests.length"
                  class="mt-3 text-sm text-white/70"
                >
                  No hay solicitudes pendientes.
                </div>

                <ul v-else-if="canModerate" class="mt-3 space-y-2">
                  <li
                    v-for="r in pendingJoinRequests"
                    :key="r.id"
                    class="p-3 border rounded-xl border-white/10 bg-white/5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-white">
                          <span class="text-white/80">{{
                            userLabel(r.uid)
                          }}</span>
                          <span class="ml-2 text-xs font-normal text-white/50">
                            ({{ uidShort(r.uid) }})
                          </span>
                        </div>
                        <div class="mt-1 text-[11px] text-white/50">
                          {{ r.id }}
                        </div>
                      </div>

                      <div class="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-semibold transition rounded-xl bg-emerald-300 text-gray-950 ring-1 ring-emerald-200/30 hover:opacity-95 disabled:opacity-60"
                          :disabled="joinBusyId === r.id"
                          @click="decideJoin(r, 'approved')"
                        >
                          {{ joinBusyId === r.id ? "..." : "Aprobar" }}
                        </button>
                        <button
                          type="button"
                          class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-rose-500/80 ring-1 ring-rose-400/30 hover:bg-rose-500 disabled:opacity-60"
                          :disabled="joinBusyId === r.id"
                          @click="decideJoin(r, 'rejected')"
                        >
                          {{ joinBusyId === r.id ? "..." : "Rechazar" }}
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </template>
            </div>
          </div>
        </template>
      </main>

      <!-- Modal confirmación global -->
      <Teleport to="body">
        <div
          v-if="confirm.open"
          class="fixed inset-0 z-[10001] overflow-hidden"
          @keydown.esc.prevent="closeConfirm"
          @click.self="closeConfirm"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div class="absolute inset-0 grid p-4 place-items-center">
            <div
              class="w-full max-w-md overflow-hidden border shadow-2xl rounded-2xl border-white/10 bg-gray-950/85 ring-1 ring-white/5"
              role="dialog"
              aria-modal="true"
            >
              <div class="p-4 border-b border-white/10 bg-white/5">
                <div class="text-sm font-extrabold text-white">
                  {{ confirm.title }}
                </div>
                <div class="mt-1 text-xs text-white/60">
                  {{ confirm.subtitle }}
                </div>
              </div>

              <div class="p-4">
                <div
                  v-if="confirm.body"
                  class="text-sm leading-relaxed text-white/80"
                >
                  {{ confirm.body }}
                </div>

                <div class="flex items-center justify-end gap-2 mt-4">
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl bg-white/10 ring-1 ring-white/10 hover:bg-white/15 active:scale-[0.98]"
                    @click="closeConfirm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-semibold text-white transition rounded-xl ring-1 active:scale-[0.98]"
                    :class="
                      confirm.variant === 'danger'
                        ? 'bg-rose-500/90 ring-rose-400/30 hover:bg-rose-500'
                        : 'bg-emerald-300 text-gray-950 ring-emerald-200/30 hover:opacity-95'
                    "
                    ref="confirmPrimaryBtn"
                    @click="confirmYes"
                  >
                    {{ confirm.confirmText }}
                  </button>
                </div>

                <div class="mt-2 text-[11px] text-white/50">
                  Tip: puedes cerrar con Esc.
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
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";
import { toast } from "../services/toasts";
import {
  createPointRequestFirestore,
  decideJoinRequestFirestore,
  deleteMyPointRequestFirestore,
  decidePointRequestFirestore,
  fetchApprovedPointRequestsFirestore,
  fetchLeagueMembersFirestore,
  fetchPendingJoinRequestsFirestore,
  fetchMyPointRequestsFirestore,
  fetchPendingPointRequestsFirestore,
  fetchLeagueHistoryFirestore,
  fetchLeagueByIdFirestore,
  fetchMyJoinRequestInLeagueFirestore,
  fetchMyMembershipInLeagueFirestore,
  removeMemberFromLeagueFirestore,
  requestToJoinLeagueFirestore,
  updateMemberRoleFirestore,
  updateMyPointRequestFirestore,
} from "../services/leaguesFirestore";
import BasePage from "./BasePage.vue";
import { auth } from "../firebase";
import {
  fetchUserProfileLabels,
  formatUidShort,
} from "../services/userProfiles";

const emit = defineEmits(["back"]);

const props = defineProps({
  leagueId: {
    type: String,
    required: true,
  },
});

const league = ref(null);
const membership = ref(null);

const loading = ref(false);
const busy = ref(false);
const error = ref("");

const joinMsg = ref("");
const pointsMsg = ref("");

const historyItems = ref([]);
const historyLoading = ref(false);
const historyError = ref("");

const members = ref([]);
const membersLoading = ref(false);
const membersError = ref("");
const membersActionMsg = ref("");
const memberBusyId = ref("");
const memberRoleDraft = ref({});

const userNames = ref({});

const pendingRequests = ref([]);
const pendingLoading = ref(false);
const pendingError = ref("");
const moderateBusyId = ref("");

const pendingJoinRequests = ref([]);
const joinLoading = ref(false);
const joinError = ref("");
const joinBusyId = ref("");
const myJoinRequest = ref(null);

const myRequests = ref([]);
const myReqLoading = ref(false);
const myReqError = ref("");
const myReqBusyId = ref("");
const myEditNote = ref({});

const rejectDraft = ref({});

const showRejectedModal = ref(false);

const confirm = ref({
  open: false,
  variant: "danger", // danger|primary
  title: "",
  subtitle: "",
  body: "",
  confirmText: "Confirmar",
  action: null,
});

const confirmPrimaryBtn = ref(null);

function closeConfirm() {
  confirm.value = {
    open: false,
    variant: "danger",
    title: "",
    subtitle: "",
    body: "",
    confirmText: "Confirmar",
    action: null,
  };
}

async function confirmYes() {
  const action = confirm.value?.action;
  closeConfirm();
  if (typeof action === "function") {
    try {
      await action();
    } catch (e) {
      toast.error(e?.message || "No se pudo completar la acción");
    }
  }
}

function openConfirmKick(member) {
  const name = userLabel(member?.uid);
  confirm.value = {
    open: true,
    variant: "danger",
    title: "Expulsar miembro",
    subtitle: "Esta acción no se puede deshacer.",
    body: `¿Seguro que quieres expulsar a ${name}?`,
    confirmText: "Expulsar",
    action: () => kickMember(member),
  };
}

function openConfirmDeleteRequest(req) {
  const day = req?.performedOn ? ` (${req.performedOn})` : "";
  confirm.value = {
    open: true,
    variant: "danger",
    title: "Borrar solicitud",
    subtitle: "Se eliminará y no podrá recuperarse.",
    body: `¿Seguro que quieres borrar esta solicitud${day}?`,
    confirmText: "Borrar",
    action: () => deleteMyRequest(req),
  };
}

// Evita scroll del fondo y “saltos” raros al abrir/cerrar el modal.
watch(showRejectedModal, (open) => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = open || confirm.value.open ? "hidden" : "";
});

watch(
  () => confirm.value.open,
  (open) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow =
      open || showRejectedModal.value ? "hidden" : "";

    if (open) {
      nextTick(() => {
        confirmPrimaryBtn.value?.focus?.();
      });
    }
  },
);

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
});

const activeTab = ref("athletes");
const pointsTab = ref("mine");

const note = ref("");
const performedOn = ref(new Date().toISOString().slice(0, 10));

const rankingRows = ref([]);
const rankingLoading = ref(false);
const rankingError = ref("");

const canModerate = computed(() => {
  // Moderación de puntos
  const r = membership.value?.role;
  return r === "owner" || r === "admin";
});

const canModerateJoins = computed(() => {
  // Solicitudes de unión: sólo owner/admin
  const r = membership.value?.role;
  return r === "owner" || r === "admin";
});

const canManageMembers = computed(() => {
  // Gestión de miembros (roles/expulsión): sólo owner
  const r = membership.value?.role;
  return r === "owner";
});

const isOwner = computed(() => membership.value?.role === "owner");

const myUid = computed(() => auth.currentUser?.uid || "");

const canSelfModerate = computed(() => isOwner.value);

function isOwnPointRequest(req) {
  return String(req?.uid || "") && String(req?.uid) === String(myUid.value);
}

function uidShort(uid) {
  return formatUidShort(uid);
}

function userLabel(uid) {
  const u = String(uid || "");
  const name = userNames.value?.[u];
  return name ? name : u;
}

async function preloadUserNames(uids) {
  const map = await fetchUserProfileLabels(uids);
  userNames.value = { ...(userNames.value || {}), ...(map || {}) };
}

const roleLabel = computed(() => {
  const r = membership.value?.role;
  if (!r) return "";
  if (r === "owner") return "Owner";
  if (r === "admin") return "Admin";
  return "Miembro";
});

const tabs = computed(() => {
  const base = [
    { key: "athletes", label: "Atletas", icon: "users" },
    { key: "points", label: "Puntos", icon: "bolt" },
    { key: "ranking", label: "Ranking", icon: "trophy" },
  ];

  if (membership.value) {
    base.push({ key: "history", label: "Historial", icon: "clock" });
    if (
      membership.value.role === "owner" ||
      membership.value.role === "admin"
    ) {
      base.push({ key: "join", label: "Uniones", icon: "link" });
    }
  }

  return base;
});

function tabIconSvg(name) {
  // Inline SVGs (no deps)
  if (name === "users") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z"/><path fill-rule="evenodd" d="M5 14a4 4 0 018 0v1a1 1 0 11-2 0v-1a2 2 0 10-4 0v1a1 1 0 11-2 0v-1z" clip-rule="evenodd"/><path d="M14.5 7.5a2.5 2.5 0 11-1.5 4.55A4.98 4.98 0 0013 10a4.98 4.98 0 00-1.16-3.2A2.5 2.5 0 0114.5 7.5z"/><path d="M14 14a3 3 0 00-1.1-2.3 1 1 0 011.27-1.54A5 5 0 0118 14v1a1 1 0 11-2 0v-1z"/></svg>`;
  }
  if (name === "bolt") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M11.3 1.046a1 1 0 00-1.6.8V8H6.2a1 1 0 00-.8 1.6l5.8 9.354a1 1 0 001.6-.8V12h3.5a1 1 0 00.8-1.6L11.3 1.046z"/></svg>`;
  }
  if (name === "trophy") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7 2a1 1 0 00-1 1v1H4a1 1 0 00-1 1v1a4 4 0 003 3.874V11a4 4 0 003 3.874V16H7a1 1 0 100 2h6a1 1 0 100-2h-2v-1.126A4 4 0 0014 11V9.874A4 4 0 0017 6V5a1 1 0 00-1-1h-2V3a1 1 0 00-1-1H7zm-1 5.732A2 2 0 015 6V6h1v2.732zM14 6v2.732A2 2 0 0015 6V6h-1z" clip-rule="evenodd"/></svg>`;
  }
  if (name === "clock") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4c0 .265.105.52.293.707l2 2a1 1 0 101.414-1.414L11 10.586V7z" clip-rule="evenodd"/></svg>`;
  }
  if (name === "link") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M12.586 2.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 .75.75 0 111.06-1.06 0.5 0.5 0 00.708 0l3-3a.5.5 0 10-.708-.708l-3 3a2 2 0 01-2.828 0 2 2 0 010-2.828l3-3z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.414 17.414a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0 .75.75 0 11-1.06 1.06.5.5 0 00-.708 0l-3 3a.5.5 0 10.708.708l3-3a2 2 0 012.828 0 2 2 0 010 2.828l-3 3z" clip-rule="evenodd"/><path d="M7.75 12.25a.75.75 0 010-1.5h4.5a.75.75 0 010 1.5h-4.5z"/></svg>`;
  }
  return "";
}

const rejectedMyRequests = computed(() => {
  return (myRequests.value || [])
    .filter((r) => r?.status === "rejected")
    .slice()
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));
});

const visibleMyRequests = computed(() => {
  // No mostramos rechazadas en el listado principal.
  return (myRequests.value || [])
    .filter((r) => r?.status !== "rejected")
    .slice()
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [l, m] = await Promise.all([
      fetchLeagueByIdFirestore(props.leagueId),
      fetchMyMembershipInLeagueFirestore(props.leagueId),
    ]);
    league.value = l;
    membership.value = m;

    // Si no es miembro, mira si tiene solicitud previa.
    if (!m) {
      try {
        myJoinRequest.value = await fetchMyJoinRequestInLeagueFirestore(
          props.leagueId,
        );
      } catch {
        myJoinRequest.value = null;
      }
    }

    // Si no es miembro, la pestaña por defecto es “Puntos/Atletas” (solo placeholders)
    if (!m) activeTab.value = "athletes";

    if (m) {
      await loadHistory();
      await loadMembers();
      await loadMyRequests();
      await loadRanking();
      if (canModerate.value) {
        await loadPending();
        if (canModerateJoins.value) await loadJoinRequests();
      } else {
        pendingRequests.value = [];
        pendingJoinRequests.value = [];
      }
    } else {
      historyItems.value = [];
      members.value = [];
      pendingRequests.value = [];
      pendingJoinRequests.value = [];
      myRequests.value = [];
      rankingRows.value = [];
    }
  } catch (e) {
    error.value = e?.message || "No se pudo cargar la liga";
  } finally {
    loading.value = false;
  }
}

async function loadRanking() {
  rankingLoading.value = true;
  rankingError.value = "";
  try {
    // v1: calculamos ranking a partir de solicitudes aprobadas.
    // Si más adelante escala mal, lo movemos a agregados/Cloud Functions.
    const all = await fetchApprovedPointRequestsFirestore({
      leagueId: props.leagueId,
      max: 500,
    });
    const byUid = new Map();
    for (const r of all) {
      const u = String(r.uid || "");
      if (!u) continue;
      const pts = typeof r.points === "number" ? r.points : Number(r.points);
      byUid.set(u, (byUid.get(u) || 0) + (Number.isFinite(pts) ? pts : 0));
    }
    const rows = Array.from(byUid.entries())
      .map(([uid, points]) => ({ uid, points }))
      .sort((a, b) => b.points - a.points || a.uid.localeCompare(b.uid))
      .slice(0, 50)
      .map((x, idx) => ({ ...x, rank: idx + 1 }));

    rankingRows.value = rows;
    await preloadUserNames(rows.map((r) => r.uid));
  } catch (e) {
    rankingError.value = e?.message || "No se pudo cargar ranking";
    rankingRows.value = [];
  } finally {
    rankingLoading.value = false;
  }
}

function historyTitle(it) {
  const type = String(it?.type || "");
  const p = it?.payload || {};
  if (type === "pointRequest.decide") {
    const status = p?.status === "approved" ? "Aprobó" : "Rechazó";
    return `${status} puntos (+${p?.points ?? 1})`;
  }
  if (type === "joinRequest.decide") {
    const status = p?.status === "approved" ? "Aprobó" : "Rechazó";
    return `${status} solicitud de unión`;
  }
  if (type === "member.role.update") {
    return `Cambió rol de atleta`;
  }
  if (type === "member.remove") {
    return `Expulsó a un atleta`;
  }
  return type || "Evento";
}

function historySubtitle(it) {
  const type = String(it?.type || "");
  const p = it?.payload || {};
  const actor = userLabel(it?.actorUid);
  if (type === "pointRequest.decide") {
    const target = userLabel(p?.requestUid);
    const status = p?.status === "approved" ? "aprobada" : "rechazada";
    return `${actor} dejó la solicitud de ${target} como ${status}.`;
  }
  if (type === "joinRequest.decide") {
    const target = userLabel(p?.requestUid);
    const status = p?.status === "approved" ? "aprobada" : "rechazada";
    return `${actor} dejó la solicitud de unión de ${target} como ${status}.`;
  }
  if (type === "member.role.update") {
    const target = userLabel(p?.targetUid);
    return `${actor} cambió el rol de ${target} a “${p?.role}”.`;
  }
  if (type === "member.remove") {
    const target = userLabel(p?.targetUid);
    return `${actor} expulsó a ${target} de la liga.`;
  }
  return `Acción por ${actor}.`;
}

function historyMeta(it) {
  // Evitamos IDs largos en UI. Si el doc tiene createdAt, lo mostramos.
  const d = it?.createdAt?.toDate ? it.createdAt.toDate() : null;
  if (!d) return "";
  try {
    return d.toLocaleString();
  } catch {
    return "";
  }
}

async function loadMembers() {
  membersLoading.value = true;
  membersError.value = "";
  try {
    const items = await fetchLeagueMembersFirestore({
      leagueId: props.leagueId,
      max: 200,
    });

    // orden: owner/admin/member y luego por uid
    const roleRank = { owner: 0, admin: 1, member: 2 };
    items.sort((a, b) => {
      const ra = roleRank[String(a.role)] ?? 99;
      const rb = roleRank[String(b.role)] ?? 99;
      if (ra !== rb) return ra - rb;
      return String(a.uid || "").localeCompare(String(b.uid || ""));
    });

    members.value = items;

    // precarga nombres (apodo/nombre)
    await preloadUserNames(items.map((it) => it.uid));

    // seed draft roles
    const map = { ...(memberRoleDraft.value || {}) };
    for (const it of items) {
      if (map[it.id] === undefined) map[it.id] = it.role;
    }
    memberRoleDraft.value = map;
  } catch (e) {
    membersError.value = e?.message || "No se pudieron cargar miembros";
    members.value = [];
  } finally {
    membersLoading.value = false;
  }
}

async function saveMemberRole(member) {
  if (!member?.uid) return;
  membersActionMsg.value = "";
  memberBusyId.value = member.id;
  try {
    const nextRole = memberRoleDraft.value?.[member.id];
    await updateMemberRoleFirestore({
      leagueId: props.leagueId,
      targetUid: member.uid,
      role: nextRole,
    });
    membersActionMsg.value = "Rol actualizado.";
    await Promise.all([loadMembers(), loadHistory()]);
  } catch (e) {
    membersActionMsg.value = e?.message || "No se pudo actualizar el rol";
  } finally {
    memberBusyId.value = "";
  }
}

async function kickMember(member) {
  if (!member?.uid) return;
  membersActionMsg.value = "";
  memberBusyId.value = member.id;
  try {
    await removeMemberFromLeagueFirestore({
      leagueId: props.leagueId,
      targetUid: member.uid,
    });
    membersActionMsg.value = "Miembro expulsado.";
    await Promise.all([loadMembers(), loadHistory()]);
    league.value = await fetchLeagueByIdFirestore(props.leagueId);
  } catch (e) {
    membersActionMsg.value = e?.message || "No se pudo expulsar";
  } finally {
    memberBusyId.value = "";
  }
}

async function loadJoinRequests() {
  if (!canModerateJoins.value) {
    pendingJoinRequests.value = [];
    return;
  }
  joinLoading.value = true;
  joinError.value = "";
  try {
    pendingJoinRequests.value = await fetchPendingJoinRequestsFirestore({
      leagueId: props.leagueId,
      max: 100,
    });

    await preloadUserNames(pendingJoinRequests.value.map((r) => r.uid));
  } catch (e) {
    joinError.value = e?.message || "No se pudieron cargar solicitudes";
  } finally {
    joinLoading.value = false;
  }
}

async function decideJoin(req, status) {
  if (!req?.uid) return;
  joinBusyId.value = req.id;
  joinError.value = "";
  try {
    await decideJoinRequestFirestore({
      leagueId: props.leagueId,
      requestUid: req.uid,
      status,
    });

    // refrescos: join list + history + league summary
    await Promise.all([loadJoinRequests(), loadHistory()]);
    league.value = await fetchLeagueByIdFirestore(props.leagueId);
  } catch (e) {
    joinError.value = e?.message || "No se pudo aplicar la decisión";
  } finally {
    joinBusyId.value = "";
  }
}

async function loadHistory() {
  historyLoading.value = true;
  historyError.value = "";
  try {
    historyItems.value = await fetchLeagueHistoryFirestore({
      leagueId: props.leagueId,
      max: 50,
      viewerRole: membership.value?.role || "member",
    });

    // precarga nombres para pintar historial más humano
    const uids = new Set();
    for (const it of historyItems.value || []) {
      if (it?.actorUid) uids.add(String(it.actorUid));
      const p = it?.payload || {};
      if (p?.requestUid) uids.add(String(p.requestUid));
      if (p?.targetUid) uids.add(String(p.targetUid));
    }
    await preloadUserNames(Array.from(uids));
  } catch (e) {
    historyError.value = e?.message || "No se pudo cargar el historial";
  } finally {
    historyLoading.value = false;
  }
}

async function loadPending() {
  pendingLoading.value = true;
  pendingError.value = "";
  try {
    pendingRequests.value = await fetchPendingPointRequestsFirestore({
      leagueId: props.leagueId,
      max: 50,
    });

    await preloadUserNames(pendingRequests.value.map((r) => r.uid));

    // seed draft rejects
    const map = { ...(rejectDraft.value || {}) };
    for (const r of pendingRequests.value) {
      if (map[r.id] === undefined) map[r.id] = "";
    }
    rejectDraft.value = map;
  } catch (e) {
    pendingError.value = e?.message || "No se pudieron cargar solicitudes";
  } finally {
    pendingLoading.value = false;
  }
}

async function loadMyRequests() {
  myReqLoading.value = true;
  myReqError.value = "";
  try {
    myRequests.value = await fetchMyPointRequestsFirestore({
      leagueId: props.leagueId,
      max: 50,
    });

    // seed notes editable
    const map = { ...(myEditNote.value || {}) };
    for (const r of myRequests.value) {
      if (map[r.id] === undefined) map[r.id] = r.note || "";
    }
    myEditNote.value = map;
  } catch (e) {
    myReqError.value = e?.message || "No se pudieron cargar tus solicitudes";
  } finally {
    myReqLoading.value = false;
  }
}

async function saveMyRequest(req) {
  if (!req?.id) return;
  myReqBusyId.value = req.id;
  myReqError.value = "";
  try {
    await updateMyPointRequestFirestore({
      requestId: req.id,
      note: myEditNote.value?.[req.id] || "",
    });
    await loadMyRequests();
    toast.success("Solicitud actualizada");
  } catch (e) {
    myReqError.value = e?.message || "No se pudo guardar";
    toast.error(myReqError.value);
  } finally {
    myReqBusyId.value = "";
  }
}

async function deleteMyRequest(req) {
  if (!req?.id) return;
  myReqBusyId.value = req.id;
  myReqError.value = "";
  try {
    await deleteMyPointRequestFirestore({ requestId: req.id });
    await loadMyRequests();
    toast.success("Solicitud borrada");
  } catch (e) {
    myReqError.value = e?.message || "No se pudo borrar";
    toast.error(myReqError.value);
  } finally {
    myReqBusyId.value = "";
  }
}

async function decideRequest(req, status) {
  if (!req?.id) return;
  if (isOwnPointRequest(req) && !canSelfModerate.value) {
    pendingError.value = "No puedes aceptar/rechazar tus propios puntos.";
    toast.warning(pendingError.value);
    return;
  }
  moderateBusyId.value = req.id;
  pendingError.value = "";
  try {
    const reason =
      status === "rejected" ? rejectDraft.value?.[req.id] || "" : "";
    await decidePointRequestFirestore({
      requestId: req.id,
      status,
      leagueId: props.leagueId,
      points: typeof req.points === "number" ? req.points : Number(req.points),
      requestUid: req.uid,
      rejectReason: reason,
      rejectedOn:
        status === "rejected" ? new Date().toISOString().slice(0, 10) : null,
    });

    // refrescos
    await Promise.all([loadPending(), loadHistory()]);
    toast.success(
      status === "approved" ? "Puntos aprobados" : "Puntos rechazados",
    );
  } catch (e) {
    pendingError.value = e?.message || "No se pudo aplicar la decisión";
    toast.error(pendingError.value);
  } finally {
    moderateBusyId.value = "";
  }
}

async function requestJoin() {
  busy.value = true;
  joinMsg.value = "";
  try {
    await requestToJoinLeagueFirestore(props.leagueId);
    joinMsg.value = "Solicitud enviada. Espera a que un admin la apruebe.";
    toast.success("Solicitud de unión enviada");

    // refresca mi request local (estado pending)
    try {
      myJoinRequest.value = await fetchMyJoinRequestInLeagueFirestore(
        props.leagueId,
      );
    } catch {
      // ignore
    }
  } catch (e) {
    joinMsg.value = e?.message || "No se pudo enviar solicitud";
    toast.error(joinMsg.value);
  } finally {
    busy.value = false;
  }
}

async function requestPoints() {
  pointsMsg.value = "";
  busy.value = true;
  try {
    if (!performedOn.value) throw new Error("La fecha es obligatoria");
    await createPointRequestFirestore({
      leagueId: props.leagueId,
      note: note.value,
      performedOn: performedOn.value,
    });
    pointsMsg.value = "Solicitud enviada.";
    toast.success("Puntos solicitados");
    note.value = "";

    // recargar “pagina” (datos de solicitudes/historial/moderación)
    await Promise.all([
      loadMyRequests(),
      canModerate.value ? loadPending() : Promise.resolve(),
      loadHistory(),
    ]);
  } catch (e) {
    pointsMsg.value = e?.message || "No se pudo solicitar";
    toast.error(pointsMsg.value);
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>
