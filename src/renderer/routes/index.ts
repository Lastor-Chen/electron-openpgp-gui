import { createRouter, createWebHashHistory } from 'vue-router'

import Index from '@/pages/index.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: Index,
    },
  ],
})
