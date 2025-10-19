# Quickstart Guide: macOS 快捷键统一管理 MVP

## 1. 环境准备

1. 安装 Node.js 20 LTS（推荐使用 `nvm` 管理版本）。
2. 安装 Xcode Command Line Tools 以及 Homebrew（用于获取 `sqlite3`、`plist` 工具）。
3. 授予终端辅助功能与自动化权限（系统设置 → 隐私与安全性 → 辅助功能/自动化），便于调试。

## 2. 项目安装

```bash
yarn install
yarn run build:native    # 编译 Node-API 模块（如有）
```

## 3. 开发模式

```bash
# 启动核心服务（scanner + indexer watcher）
yarn dev:core

# 同时启动 Electron 主进程 + Vite 渲染进程
yarn dev:app
```

> 启动 `yarn dev:app` 后 Electron 会同时拉起桌面窗口与 Vite 服务，长按 Command 键约 0.5 秒即可看到浮动层效果。
> 首次运行可能需要较长时间下载 Electron（数百 MB），如网络较慢可使用 `yarn install --network-timeout 600000`。完成后按提示授予辅助功能权限再重新启动应用。

当 Electron 启动完毕后，按下组合键 `Command+Shift+Space` 可以在桌面唤起浮动层，`Esc` 关闭。

## 4. 关键调试命令

```bash
# 触发一次全量扫描
yarn scanner:full

# 调试浮动层（在模拟数据下）
curl -X POST http://127.0.0.1:65321/overlay/context \
  -H "Content-Type: application/json" \
  -d '{"bundleId":"com.example.demo","appName":"DemoApp","windowTitle":"Demo","focusedElementType":"other"}'

# 查看索引状态
yarn cli status

# 导出索引为 JSON
yarn cli export --format json --out ./exports/hotkeys.json

# 导出索引为 CSV
yarn cli export --format csv --out ./exports/hotkeys.csv
```

## 5. 测试

```bash
yarn test:unit        # Vitest
yarn test:integration # 扫描 + 索引回归
yarn test:e2e         # Playwright 浮动层/稳定窗口流程
```

## 6. 打包

```bash
yarn build            # 生成生产版本
yarn package          # 产出 macOS 可安装 DMG/zip
```

构建产物默认位于 `dist/`，请在系统偏好设置中确认应用已获得辅助功能许可后再体验浮动层。

## 7. 冲突排查

1. 运行 `yarn dev:core` 启动扫描服务。
2. 使用 `curl http://127.0.0.1:65321/conflicts` 查看冲突列表。
3. 在应用内打开稳定窗口，按照冲突标签过滤并点击详情中的“打开设置页”按钮跳转。
4. 如需导出报告，执行 `yarn cli export --format csv --out ./exports/conflicts.csv --no-conflicts=false`。
