<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const routes = router.options.routes

const navbar = useTemplateRef('navbar')

const activeTabRect = ref({
  width: 0,
  x: 0,
})

const underlinePosition = computed(() => ({
  width: `${activeTabRect.value.width}px`,
  transform: `translateX(${activeTabRect.value.x}px)`,
}))

const updateUnderLine = async () => {
  await nextTick() // 等 active class 被 render

  const activeTab = navbar.value?.querySelector('.active') as HTMLElement | null
  if (!activeTab) return

  activeTabRect.value = {
    width: activeTab.offsetWidth,
    x: activeTab.offsetLeft,
  }
}

watch(router.currentRoute, updateUnderLine, { immediate: true })
</script>

<template>
  <nav ref="navbar" class="relative px-4 border-b flex gap-x-2">
    <template v-for="route in routes" :key="route.path">
      <RouterLink
        :to="route.path"
        class="p-2 text-gray-400 [&.active]:text-primary hover:text-gray-600"
        active-class="active"
      >
        {{ route.meta?.navLabel }}
      </RouterLink>
    </template>
    <div
      class="absolute left-0 h-px bottom-0 bg-primary transition-[transform,width] duration-150 ease-out"
      :style="underlinePosition"
    ></div>
  </nav>
</template>
