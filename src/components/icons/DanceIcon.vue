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
    <!-- Cabeza -->
    <circle cx="10" cy="6.2" r="1.4" />

    <!-- Brazo arriba -->
    <path d="M10.6 7.8l3-1.6" />
    <path d="M13.6 6.2l1.8 1.4" />

    <!-- Torso -->
    <path d="M10 7.6l-1 3.6" />

    <!-- Piernas en movimiento -->
    <path d="M9 11.2l-2.2 2.6" />
    <path d="M9.4 11.2l2.8 2" />
    <path d="M12.2 13.2l-1 3.8" />

    <!-- Línea de suelo -->
    <path d="M4 20h16" />

    <!-- Chispa/ritmo -->
    <path d="M16.5 10.2l1.2-1.2" />
    <path d="M16.7 12.6h1.7" />
  </svg>
</template>
