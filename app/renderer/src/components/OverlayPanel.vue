<template>
  <transition name="fade-scale">
    <div v-if="store.isVisible" class="overlay">
      <header>
        <div class="app-info">
          <h2>{{ store.context?.appName ?? '未知应用' }}</h2>
          <p class="window-title">{{ store.context?.windowTitle }}</p>
        </div>
        <span class="focused">焦点：{{ store.context?.focusedElementType }}</span>
      </header>
      <section v-if="store.shortcuts.length" class="shortcut-list">
        <article v-for="shortcut in store.shortcuts" :key="shortcut.id" class="shortcut-item">
          <div class="combo">{{ shortcut.normalizedCombo }}</div>
          <div class="detail">
            <p class="label">{{ shortcut.humanLabel ?? shortcut.target }}</p>
            <p class="meta">
              来源：{{ shortcut.appName ?? shortcut.scope }}
              <span v-if="shortcut.metadata?.conflictLevel" class="badge">
                冲突：{{ shortcut.metadata.conflictLevel }}
              </span>
            </p>
          </div>
        </article>
      </section>
      <section v-else class="empty">
        <p>当前上下文未检测到快捷键</p>
      </section>
      <footer>
        <span>松开 Command 键或按 Esc 可关闭浮动层</span>
        <button class="primary">打开快捷键中心</button>
      </footer>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useContextStore } from '../stores/context';
import { useOverlayBootstrap } from '../hooks/useOverlayBootstrap';

const store = useContextStore();
useOverlayBootstrap();
</script>

<style scoped>
.overlay {
  width: 480px;
  padding: 24px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(18px);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.app-info h2 {
  margin: 0;
  font-size: 24px;
}

.window-title {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 14px;
}

.focused {
  font-size: 12px;
  color: #cbd5f5;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(30, 64, 175, 0.25);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.shortcut-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.combo {
  font-family: 'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  font-size: 18px;
}

.label {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.badge {
  margin-left: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(248, 113, 113, 0.35);
  color: #fecaca;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  color: #94a3b8;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #94a3b8;
}

.primary {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.18s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
