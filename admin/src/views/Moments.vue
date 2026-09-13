<template>
  <h2 class="title">说说</h2>
  <p class="sub">朋友圈风格的说说列表。本期是占位，下一轮支持图片 / 视频 / 文件上传到 R2。</p>

  <el-card shadow="never" class="card">
    <template #header>占位说明</template>
    <ul>
      <li>列表：时间倒序 / 一条一条</li>
      <li>支持：图片 / 视频 / 文件附件</li>
      <li>后台：发帖 / 编辑 / 删除 / 置顶</li>
    </ul>
  </el-card>
</template>

<style scoped>
.title { margin: 0 0 6px; font-size: 1.25rem; }
.sub { color: var(--ning-text-2); margin-bottom: 16px; }
.card { border-radius: 12px; }
ul { color: var(--ning-text-2); line-height: 2; padding-left: 20px; }
</style>
