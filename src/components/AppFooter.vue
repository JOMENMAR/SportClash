<template>
  <footer
    class="w-full border-t border-white/10 bg-gray-950/60 backdrop-blur-xl"
  >
    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="text-sm">
        <div class="font-extrabold tracking-tight text-emerald-300">
          SportClash
        </div>
        <div class="mt-1 text-xs text-white/50">
          Ligas mensuales · Puntos verificados por admins
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:items-end">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a
            href="#"
            class="text-white/70 hover:text-white transition"
            @click.prevent
          >
            Términos
          </a>
          <a
            href="#"
            class="text-white/70 hover:text-white transition"
            @click.prevent
          >
            Privacidad
          </a>
          <a
            href="#"
            class="text-white/70 hover:text-white transition"
            @click.prevent
          >
            Contacto
          </a>
        </div>

        <div class="text-xs text-white/40">
          © {{ year }} SportClash. Próximamente: redes sociales.
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>
