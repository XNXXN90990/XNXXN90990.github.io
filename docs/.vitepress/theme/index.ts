import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import PrivateLock from './PrivateLock.vue'
import PrivateIndex from './PrivateIndex.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: any) {
    // 私密文章 md 中会直接用到这两个组件
    app.component('PrivateLock', PrivateLock)
    app.component('PrivateIndex', PrivateIndex)
  }
}
