<template>
  <h2 class="title">设置</h2>

  <el-card shadow="never" class="card">
    <template #header>站点</template>
    <el-form label-width="120px">
      <el-form-item label="站点名">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="副标题">
        <el-input v-model="form.tagline" />
      </el-form-item>
      <el-form-item label="作者署名">
        <el-input v-model="form.author" />
      </el-form-item>
      <el-form-item label="站点生日（运行时长起点）">
        <el-date-picker v-model="form.birth" type="datetime" />
      </el-form-item>
      <el-button type="primary" @click="onSave">保存</el-button>
    </el-form>
  </el-card>

  <el-card shadow="never" class="card">
    <template #header>部署</template>
    <ul>
      <li>GitHub Pages：`xnxxn90990.github.io`（主仓库 main 分支自动部署）</li>
      <li>Cloudflare Worker：点赞 / PV / UV（下一轮接）</li>
      <li>Cloudflare Pages：admin 面板（下一轮接）</li>
    </ul>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({
  title: '寜的小站',
  tagline: "Ning's Blog",
  author: 'DBD',
  birth: new Date('2026-09-13T17:51:00+08:00'),
})

function onSave() {
  ElMessage.success('保存成功（mock）')
}
</script>

<style scoped>
.title { margin: 0 0 6px; font-size: 1.25rem; }
.card { border-radius: 12px; }
.card + .card { margin-top: 14px; }
ul { color: var(--ning-text-2); line-height: 2; padding-left: 20px; }
</style>
