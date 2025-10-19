<template>
  <div class="page">
    <section class="hero">
      <h1>Wainao HotKey 浮动层演示</h1>
      <p>
        这是开发调试时的指引页面，用于说明如何在桌面环境中测试浮动层效果。
        当应用以 Electron 模式运行时，长按 <kbd>Command ⌘</kbd> 键即可看到悬浮提示层。
      </p>
      <ol>
        <li>保持本窗口处于前台。</li>
        <li>按住并持续长按 Command 键约 0.5 秒。</li>
        <li>浮动层将在屏幕中央出现，松开则隐藏。</li>
      </ol>
      <p class="tip">
        * 当前数据为模拟内容，用来验证视觉与交互流程。后续会接入真实快捷键扫描结果。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useCommandOverlay } from '../hooks/useCommandOverlay';

useCommandOverlay();

onMounted(() => {
  document.body.classList.add('demo-background');
});

onUnmounted(() => {
  document.body.classList.remove('demo-background');
});
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 96px;
}

.hero {
  background: rgba(15, 23, 42, 0.74);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.5);
}

.hero h1 {
  margin-top: 0;
  font-size: 32px;
  font-weight: 600;
}

.hero ol {
  margin: 16px 0;
  padding-left: 20px;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.4);
  font-family: 'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.tip {
  margin-top: 12px;
  font-size: 14px;
  color: #94a3b8;
}
</style>
