import { createRouter, createWebHashHistory } from 'vue-router'

import Index from '@/pages/Keys/index.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      meta: {
        label: 'Keys',
      },
      component: Index,
    },
    {
      path: '/encrypt',
      meta: {
        label: 'Encrypt',
      },
      component: () => import('@/pages/Encrypt/index.vue'),
    },
    {
      path: '/decrypt',
      meta: {
        label: 'Decrypt',
      },
      component: () => import('@/pages/Decrypt/index.vue'),
    },
  ],
})
