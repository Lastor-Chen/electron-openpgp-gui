import { createRouter, createWebHashHistory } from 'vue-router'

import Index from '@/pages/Keys/index.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      meta: {
        navLabel: 'Keys',
      },
      component: Index,
    },
    {
      path: '/encrypt',
      meta: {
        navLabel: 'Encrypt',
      },
      component: () => import('@/pages/Encrypt/index.vue'),
    },
    {
      path: '/decrypt',
      meta: {
        navLabel: 'Decrypt',
      },
      component: () => import('@/pages/Decrypt/index.vue'),
    },
  ],
})
