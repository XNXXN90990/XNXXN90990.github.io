<!-- LoadingSpinner.vue —— 开机终端风格加载动画 -->
<template>
  <div class="terminal-loader">
    <div class="terminal-header">
      <div class="header-buttons">
        <span class="button close"></span>
        <span class="button minimize"></span>
        <span class="button maximize"></span>
      </div>
      <div class="header-title">root@ning-blog: ~</div>
    </div>
    <div class="terminal-body">
      <pre ref="output" class="output"></pre>
      <div class="input-line">
        <span class="prompt">root@ning-blog:~$ </span>
        <span class="cursor"></span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TerminalLoader',
  data() {
    return {
      isAnimationFinished: false // 标记动画是否完成
    };
  },
  mounted() {
    this.simulateBootProcess();
  },
  methods: {
    simulateBootProcess() {
      const output = this.$refs.output;
      const lines = [
        '[INFO] Booting Ning\'s Blog...',
        '[OK] Content loaded.',
        '[INFO] Waking up 宁静致远 mode...',
        '[OK] Ready. Welcome!'
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < lines.length) {
          output.textContent += `${lines[index]}\n`;
          index++;
        } else {
          clearInterval(interval);
          this.showPrompt();
        }
      }, 60);
    },
   showPrompt() {
  const cursor = document.querySelector('.cursor');

  // 显示光标闪烁效果
  cursor.style.display = 'inline-block';
  setInterval(() => {
    cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
  }, 500);

  // 动画完成标志
  this.isAnimationFinished = true;
  this.$emit('animation-finished'); // 确保事件被触发
}
  }
};
</script>

<style scoped>
/* 终端保持深色（两种主题下都是终端的样子） */
.terminal-loader {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.terminal-header {
  background: #333;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #555;
}

.header-buttons .button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.close {
  background: #ff5f56;
}

.minimize {
  background: #ffbd2e;
}

.maximize {
  background: #27c93f;
}

.header-title {
  flex-grow: 1;
  text-align: center;
  font-size: 14px;
  color: #ccc;
}

.terminal-body {
  flex-grow: 1;
  padding: 16px;
  overflow-y: auto;
}

.output {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.input-line {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.prompt {
  color: #00ff00;
}

.cursor {
  display: none;
  width: 8px;
  height: 16px;
  background: #00ff00;
  margin-left: 4px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
