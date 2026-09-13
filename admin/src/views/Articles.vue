<template>
  <h2 class="title">文章</h2>
  <div class="bar">
    <el-input v-model="q" placeholder="搜索标题" clearable style="max-width: 260px;" />
    <el-select v-model="category" placeholder="分类" clearable style="width: 160px;">
      <el-option label="全部" value="" />
      <el-option label="教程" value="tutorials" />
      <el-option label="杂谈说说" value="moments" />
      <el-option label="学习路线" value="learning-path" />
      <el-option label="随笔" value="essays" />
    </el-select>
    <el-button type="primary" @click="$router.push('/articles/new')">+ 新建</el-button>
  </div>

  <el-table :data="rows" stripe>
    <el-table-column prop="title" label="标题" />
    <el-table-column prop="category" label="分类" width="140" />
    <el-table-column prop="status" label="状态" width="120">
      <template #default="s">
        <el-tag :type="s.row.status === 'published' ? 'success' : 'info'" size="small">
          {{ s.row.status === 'published' ? '已发布' : '草稿' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="date" label="日期" width="140" />
    <el-table-column label="操作" width="200">
      <template #default="s">
        <el-button size="small" @click="$router.push(`/articles/${s.row.id}`)">编辑</el-button>
        <el-button size="small" type="danger" @click="onDelete(s.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getArticleList, deleteArticle } from '@/api'

const q = ref('')
const category = ref('')
const list = ref([])

onMounted(async () => {
  const r = await getArticleList()
  list.value = r.rows
})

const rows = computed(() => {
  return list.value.filter((x) => {
    if (q.value && !x.title.includes(q.value)) return false
    if (category.value && x.category !== category.value) return false
    return true
  })
})

async function onDelete(id) {
  try {
    await ElMessageBox.confirm('确认删除该文章吗？', '提示', { type: 'warning' })
    await deleteArticle(id)
    list.value = list.value.filter((x) => x.id !== id)
    ElMessage.success('已删除（mock）')
  } catch (_) {}
}
</script>

<style scoped>
.title { margin: 0 0 12px; font-size: 1.25rem; }
.bar { display: flex; gap: 10px; margin-bottom: 12px; }
</style>
