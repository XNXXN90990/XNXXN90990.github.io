<template>
  <h2 class="title">友链</h2>
  <p class="sub">友链的增删改查。从主站读取 /links 渲染。</p>
  <el-card shadow="never">
    <el-button type="primary" plain>+ 新增</el-button>
    <ul style="margin-top: 14px;">
      <li>Wcowin — wcowin.work</li>
      <li>阿叶 — ayeez.cn</li>
    </ul>
  </el-card>
</template>

<style scoped>
.title { margin: 0 0 6px; font-size: 1.25rem; }
.sub { color: var(--ning-text-2); margin-bottom: 16px; }
</style>
