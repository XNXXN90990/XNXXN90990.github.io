/// <reference types="vitepress/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'virtual:private-index' {
  export const data: {
    dev: boolean
    items?: { title: string; path: string; date: string; code: string }[]
    blob?: { iv: string; ct: string }
  }
}
