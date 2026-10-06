import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initSmoothScroll } from './plugins/smoothScroll'
import { initTheme } from './utils/theme'
import 'lenis/dist/lenis.css'

import '@fortawesome/fontawesome-free/css/all.min.css'

import './assets/css/style.css'

// 应用主题（index.html 已提前设置过，这里兜底）
initTheme()

const app = createApp(App)

app.use(router)

app.mount('#app')

// 全站启用丝滑滚动阻尼效果（Lenis）
initSmoothScroll()
