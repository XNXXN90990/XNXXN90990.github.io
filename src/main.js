import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initSmoothScroll } from './plugins/smoothScroll'
import { initTheme, initAccent } from './utils/theme'
import 'lenis/dist/lenis.css'

import '@fortawesome/fontawesome-free/css/all.min.css'

import './assets/css/style.css'

// 应用主题（index.html 已提前设置过，这里兜底）
initTheme()
initAccent()

const app = createApp(App)

// 全局错误钩子：渲染异常不再静默吞掉（开发期排查用，线上也便于从 console 定位）
app.config.errorHandler = (err, _vm, info) => {
  console.error('[Vue errorHandler]', info, err)
}

app.use(router)

app.mount('#app')

// 全站启用丝滑滚动阻尼效果（Lenis）
initSmoothScroll()
