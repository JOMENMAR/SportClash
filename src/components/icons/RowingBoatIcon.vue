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
    <!-- Oars -->
    <path d="M6 6l6 8" />
    <path d="M18 6l-6 8" />
    <path d="M5 6.2l2.4 1.6" />
    <path d="M19 6.2l-2.4 1.6" />

    <!-- Boat -->
    <path d="M6 15.5h12" />
    <path d="M4 17c2.2 2 5.2 3 8 3s5.8-1 8-3" />

    <!-- Seat / rower hint -->
    <path d="M12 13v2.5" />
  </svg>
</template>
