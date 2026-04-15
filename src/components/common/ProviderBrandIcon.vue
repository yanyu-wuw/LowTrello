<template>
  <svg v-if="providerId === 'phone'" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="2" width="12" height="20" rx="3" fill="#1f6feb" />
    <rect x="8" y="4.5" width="8" height="13" rx="1.5" fill="#ffffff" />
    <circle cx="12" cy="19" r="1.2" fill="#ffffff" />
  </svg>

  <svg v-else-if="providerId === 'wechat'" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="10" cy="10" r="6" fill="#07c160" />
    <circle cx="16.5" cy="14" r="4.5" fill="#1aad19" />
    <circle cx="8.2" cy="9.7" r="0.8" fill="#ffffff" />
    <circle cx="11.8" cy="9.7" r="0.8" fill="#ffffff" />
    <circle cx="15.2" cy="13.7" r="0.7" fill="#ffffff" />
    <circle cx="17.8" cy="13.7" r="0.7" fill="#ffffff" />
  </svg>

  <svg v-else-if="providerId === 'qrcode'" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="1.5" y="1.5" width="21" height="21" rx="3" fill="#ffffff" stroke="#111111" stroke-width="1" />
    <rect x="4" y="4" width="6" height="6" fill="#111111" />
    <rect x="14" y="4" width="6" height="6" fill="#111111" />
    <rect x="4" y="14" width="6" height="6" fill="#111111" />
    <rect x="15" y="15" width="2" height="2" fill="#111111" />
    <rect x="18" y="12" width="2" height="2" fill="#111111" />
    <rect x="12" y="18" width="2" height="2" fill="#111111" />
  </svg>

  <svg v-else-if="providerId === 'qq'" viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="12" cy="8" rx="5" ry="4.4" fill="#111111" />
    <ellipse cx="12" cy="15" rx="6" ry="6.2" fill="#111111" />
    <ellipse cx="12" cy="15.4" rx="3.5" ry="4.2" fill="#ffffff" />
    <circle cx="10" cy="8" r="0.8" fill="#ffffff" />
    <circle cx="14" cy="8" r="0.8" fill="#ffffff" />
    <ellipse cx="9" cy="21" rx="2.2" ry="1.3" fill="#ff9f1c" />
    <ellipse cx="15" cy="21" rx="2.2" ry="1.3" fill="#ff9f1c" />
  </svg>

  <svg v-else-if="providerId === 'passkey'" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="11" r="4" fill="#2f6fec" />
    <circle cx="8" cy="11" r="1.8" fill="#ffffff" />
    <rect x="12" y="10" width="8" height="2" rx="1" fill="#2f6fec" />
    <rect x="17" y="8.5" width="1.8" height="1.8" rx="0.4" fill="#2f6fec" />
    <rect x="19" y="12" width="1.8" height="1.8" rx="0.4" fill="#2f6fec" />
  </svg>

  <svg v-else-if="providerId === 'google'" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285f4" d="M21.6 12.3c0-.7-.06-1.2-.2-1.8H12v3.5h5.4c-.11.9-.72 2.2-2.1 3.1l3 2.3c1.8-1.7 2.8-4.1 2.8-7.1z" />
    <path fill="#34a853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3-2.3c-.8.6-1.9 1.1-3.6 1.1-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C4.8 19.8 8.1 22 12 22z" />
    <path fill="#fbbc04" d="M6.3 14.1c-.2-.6-.4-1.3-.4-2.1s.1-1.4.4-2.1L3.2 7.5C2.5 8.9 2 10.4 2 12s.5 3.1 1.2 4.5z" />
    <path fill="#ea4335" d="M12 5.7c1.9 0 3.2.8 4 1.5l2.9-2.9C17.1 2.7 14.7 2 12 2c-3.9 0-7.2 2.2-8.8 5.5l3.1 2.4c.8-2.4 3-4.2 5.7-4.2z" />
  </svg>

  <svg v-else-if="providerId === 'microsoft'" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" fill="#f35325" />
    <rect x="13" y="2" width="9" height="9" fill="#81bc06" />
    <rect x="2" y="13" width="9" height="9" fill="#05a6f0" />
    <rect x="13" y="13" width="9" height="9" fill="#ffba08" />
  </svg>

  <svg v-else-if="providerId === 'apple'" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#111111" d="M16.9 12.4c0-2.2 1.8-3.3 1.9-3.4-1.1-1.6-2.7-1.8-3.3-1.8-1.4-.1-2.7.8-3.4.8-.8 0-1.9-.8-3.1-.7-1.6 0-3 0.9-3.9 2.2-1.7 2.9-.4 7.2 1.2 9.4.8 1.1 1.7 2.3 2.9 2.2 1.2-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1-.1-2.4-1-2.4-3.9z" />
    <path fill="#111111" d="M14.9 5.8c.6-.7 1.1-1.7 1-2.8-.9.1-1.8.6-2.4 1.3-.6.7-1.1 1.6-1 2.7.9.1 1.8-.4 2.4-1.2z" />
  </svg>

  <svg v-else-if="providerId === 'slack'" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="10" width="4" height="10" rx="2" fill="#36c5f0" />
    <rect x="5" y="3" width="10" height="4" rx="2" fill="#2eb67d" />
    <rect x="10" y="4" width="4" height="10" rx="2" fill="#ecb22e" />
    <rect x="4" y="10" width="10" height="4" rx="2" fill="#e01e5a" />
    <rect x="17" y="4" width="4" height="10" rx="2" fill="#36c5f0" />
    <rect x="10" y="17" width="10" height="4" rx="2" fill="#2eb67d" />
    <rect x="4" y="17" width="4" height="4" rx="2" fill="#ecb22e" />
    <rect x="17" y="10" width="4" height="4" rx="2" fill="#e01e5a" />
  </svg>

  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#5b6c84" />
  </svg>
</template>

<script setup>
defineProps({
  providerId: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
