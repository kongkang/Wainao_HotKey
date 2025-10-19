# Research Notes: macOS 快捷键统一管理 MVP

## Task: 选择本地索引存储方案

- **Decision**: 采用嵌入式 SQLite 数据库（通过 better-sqlite3 或等价原生绑定）存储规范化快捷键索引与冲突分组。
- **Rationale**: SQLite 原生支持并发只读访问与事务型写入，能在初期只读扫描的同时为后续写入功能演进提供空间；查询性能和复杂过滤（按来源、冲突等级）优于 JSON 文件，同时具备可靠的 ACID 语义，便于导出与备份。
- **Alternatives considered**:
  - 平面 JSON/NDJSON 文件：实现简单，但在索引刷新、复杂筛选及增量更新时容易出现一致性问题；大文件加载也影响浮动层 1 秒响应目标。
  - NeDB / Lowdb 等 JS 嵌入式库：减少原生依赖但缺乏可靠事务与并发支持，对海量条目（数千快捷键）下的排序过滤表现欠佳。

## Task: Electron 桌面应用最佳实践（macOS 快捷键工具）

- **Decision**: 主进程保持最小职责（窗口生命周期、权限检测、进程间通信），浮动层使用无边框透明窗口并通过 `BrowserView` 控制层级；采用隔离上下文 + preload 渠道，遵循最小权限原则。
- **Rationale**: 减少主进程逻辑有助于稳定性与安全性；透明浮动窗配合 `alwaysOnTop` 与 `setIgnoreMouseEvents` 控制使指令层响应迅速；preload 脚本可安全暴露加密后的 IPC 接口，避免直接 Node API 暴露给渲染层。
- **Alternatives considered**:
  - 在渲染进程直接访问 Node API：开发快但安全风险高，违背 Electron 官方 sandbox 建议。
  - 独立原生应用（Swift/Obj-C）：更贴近系统但与既定 Electron + Vue 技术路线不符，增加团队学习成本。

## Task: Vue 3 + Pinia 组织方案（浮动层与稳定窗口）

- **Decision**: 使用组合式 API + Pinia store 管理上下文状态（当前应用、焦点、快捷键列表、冲突标签），通过解耦的 store/actions 支撑浮动层与稳定窗口共享数据。
- **Rationale**: Pinia 原生支持 TypeScript，方便对复杂实体（ShortcutEntry、ConflictGroup）进行类型定义；组合式 API 有利于复用渲染逻辑（例如快捷键列表组件）并保持响应式性能。
- **Alternatives considered**:
  - 仅使用 Vue 组件本地状态：简单但数据同步困难，浮动层与稳定窗口会出现状态割裂。
  - Vuex 4：成熟但与 Vue 3 官方推荐的 Pinia 相比样板代码更多且开发体验稍差。

## Task: macOS Accessibility & 偏好文件访问策略

- **Decision**: 通过 Node-API 模块调用 macOS Accessibility API（AXUIElement）与 `defaults`/`plist` 读取，主进程统一调度，确保权限状态检查与错误回退在同一通道。
- **Rationale**: Node-API 提供稳定 ABI，避免 Node 版本升级导致的重编译；集中化调度便于记录权限失败与用户提示；结合子进程调用 `defaults` 读取可覆盖大多数 App 快捷键。
- **Alternatives considered**:
  - 直接在渲染进程使用 `child_process`：安全性差且难以捕获错误；与沙箱策略冲突。
  - 纯 Swift 辅助进程：可行但引入额外项目与打包复杂度，目前阶段优先保持 Electron 单体交付。
