import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import './style.css'

import HomeHero from './components/HomeHero.vue'
import SiteFooter from './components/SiteFooter.vue'
import RuntimeClock from './components/RuntimeClock.vue'
import DisableDevtool from './components/DisableDevtool.vue'
import PrivateIndex from './components/PrivateIndex.vue'
import PrivateLock from './components/PrivateLock.vue'

export default {
  extends: DefaultTheme,
  Layout: () => import('./Layout.vue'),
  enhanceApp({ app }) {
    // 关闭状态下不用 SSR 的组件，全部塞进 ClientOnly
    app.component('HomeHero', HomeHero)
    app.component('SiteFooter', SiteFooter)
    app.component('RuntimeClock', RuntimeClock)
    app.component('DisableDevtool', DisableDevtool)
    app.component('PrivateIndex', PrivateIndex)
    app.component('PrivateLock', PrivateLock)
  },
} satisfies Theme
