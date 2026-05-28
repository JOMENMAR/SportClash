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
    <!-- Pared / montaña -->
    <path d="M4 20L10 6l4 7 2-3 4 10H4z" />

    <!-- Escalador (simplificado) -->
    <circle cx="12.7" cy="8.2" r="1.2" />
    <path d="M12.4 9.8l-1.2 2.4" />
    <path d="M11.2 12.2l-2.2 1.4" />
    <path d="M12 12.4l2.2 1.2" />
    <path d="M13.6 11.2l1.8-1.4" />

    <!-- Piernas apoyadas -->
    <path d="M11.6 14l-1.4 2.2" />
    <path d="M13 13.8l.6 2.6" />

    <!-- Cuerda -->
    <path d="M14.4 10.2c1.6 1.6 1.8 3.7.6 5.6" />
  </svg>
</template>
