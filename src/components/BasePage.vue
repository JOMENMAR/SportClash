<template>
  <div
    class="relative w-full px-4 pt-5 pb-5 overflow-x-hidden overflow-y-auto text-white"
  >
    <!-- Fondo animado global (fixed). Mantener como capa no interactiva. -->
    <div
      aria-hidden
      class="fixed inset-0 pointer-events-none animated-gradient-bg"
    />

    <!-- Contenido real de la pantalla -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Componente base para evitar repetir layout/fondo/márgenes en todas las páginas.
</script>
