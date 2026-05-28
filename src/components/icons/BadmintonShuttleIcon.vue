<template>
  <svg
    v-bind="$attrs"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Plumas -->
    <path d="M9 4l3 3" />
    <path d="M12 3l2.2 4.2" />
    <path d="M15 4l-3 3" />

    <!-- Cabeza del volante -->
    <circle cx="12" cy="8" r="1.6" />

    <!-- Faldón (cono) -->
    <path d="M10 10l-3 8c2.2 1.2 4.2 1.8 5 1.8s2.8-.6 5-1.8l-3-8" />

    <!-- Detalle de líneas -->
    <path d="M9.7 12.2l-1.4 3.8" />
    <path d="M14.3 12.2l1.4 3.8" />
  </svg>
</template>
