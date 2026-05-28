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
    <!-- Tres disciplinas (representación abstracta: 3 puntos + ciclo) -->
    <circle cx="12" cy="6" r="1.6" />
    <circle cx="6.8" cy="16.8" r="1.6" />
    <circle cx="17.2" cy="16.8" r="1.6" />

    <!-- Flechas de ciclo -->
    <path d="M13.3 7.2c2.6 1.1 4.3 3.5 4.6 6.3" />
    <path d="M18.1 13.5l-1.4 1.4" />
    <path d="M18.1 13.5l-1.8-.2" />

    <path d="M16 17.6c-2.7 1.4-5.8 1.4-8.6 0" />
    <path d="M8 17.6l-1.8.2" />
    <path d="M8 17.6l-1.4-1.4" />

    <path d="M6.1 15.2c.3-2.8 2-5.2 4.6-6.3" />
    <path d="M6 15.4l.2-1.8" />
    <path d="M6 15.4l1.4-1.4" />
  </svg>
</template>
