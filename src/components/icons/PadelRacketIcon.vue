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
    <!-- Cabeza de la pala -->
    <ellipse cx="10" cy="10" rx="5" ry="6" />

    <!-- Agujeros (simplificados) -->
    <circle cx="8.2" cy="8" r="0.7" />
    <circle cx="11.8" cy="8" r="0.7" />
    <circle cx="8.2" cy="12" r="0.7" />
    <circle cx="11.8" cy="12" r="0.7" />

    <!-- Mango -->
    <path d="M12.2 15.4l3.6 3.6" />
    <path d="M16.2 18.8l1.6 1.6" />

    <!-- Bola -->
    <circle cx="18.2" cy="7.2" r="2" />
  </svg>
</template>
