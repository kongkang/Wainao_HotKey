<template>
  <div class="stable-window">
    <header>
      <h1>快捷键索引</h1>
      <div class="filters">
        <input v-model="search" placeholder="输入组合键或应用名称" @keyup.enter="applyFilters" />
        <select v-model="scope" @change="applyFilters">
          <option value="">全部范围</option>
          <option value="system">系统</option>
          <option value="app">应用</option>
          <option value="web">网页</option>
        </select>
        <select v-model="conflict" @change="applyFilters">
          <option value="">冲突筛选</option>
          <option value="intra-app">应用内冲突</option>
          <option value="inter-app">跨应用冲突</option>
          <option value="system-vs-app">系统 vs 应用</option>
          <option value="web-vs-app">网页 vs 应用</option>
        </select>
      </div>
    </header>
    <main>
      <div class="content">
        <table>
          <thead>
            <tr>
              <th>组合键</th>
              <th>描述</th>
              <th>来源</th>
              <th>冲突</th>
              <th>可编辑</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in store.items"
              :key="item.id"
              :class="{ conflict: item.metadata?.conflictLevel }"
              @click="selectItem(item)"
            >
              <td>{{ item.normalizedCombo }}</td>
              <td>{{ item.humanLabel ?? item.target }}</td>
              <td>{{ item.appName ?? item.scope }}</td>
              <td>{{ item.metadata?.conflictLevel ?? '无' }}</td>
              <td>{{ item.editable ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!store.items.length" class="empty">暂无数据</p>

        <aside v-if="selected" class="details">
          <h2>详情</h2>
          <p><strong>组合键：</strong>{{ selected.normalizedCombo }}</p>
          <p><strong>来源：</strong>{{ selected.appName ?? selected.scope }}</p>
          <p><strong>目标：</strong>{{ selected.target }}</p>
          <p><strong>冲突等级：</strong>{{ selected.metadata?.conflictLevel ?? '无' }}</p>
          <button @click="openSettings(selected)">打开设置页</button>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ShortcutEntry } from '../../../core/types/shortcuts';
import { useShortcutIndexStore } from '../stores/shortcut-index';

const store = useShortcutIndexStore();
const search = ref('');
const scope = ref('');
const conflict = ref('');
const selected = ref<ShortcutEntry | null>(null);

function applyFilters() {
  store.setFilters({
    normalizedCombo: search.value || undefined,
    scope: scope.value ? (scope.value as 'system' | 'app' | 'web') : undefined,
    conflict: conflict.value || undefined
  });
  store.fetch();
}

function selectItem(item: ShortcutEntry) {
  selected.value = item;
}

function openSettings(item: ShortcutEntry) {
  console.log('TODO: 打开设置路径', item.sourceFile);
}
</script>

<style scoped>
.stable-window {
  padding: 16px;
}
.filters {
  display: flex;
  gap: 12px;
}
.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
.conflict {
  background: rgba(255, 99, 71, 0.1);
}
.details {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 16px;
}
.empty {
  text-align: center;
  padding: 24px;
}
</style>
