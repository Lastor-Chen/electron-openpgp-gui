// oxlint-disable-next-line import/no-unassigned-import
import 'vue-router'

// extends vue router type
// https://router.vuejs.org/guide/advanced/meta.html#TypeScript
declare module 'vue-router' {
  interface RouteMeta {
    // add custom props...
  }
}
