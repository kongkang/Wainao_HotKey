# Tasks: macOS 快捷键统一管理 MVP

**Input**: Design documents from `/specs/001-readme/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 规格未要求强制 TDD，本计划不单列测试任务；各故事的验收以独立操作验证为准。

**组织原则**: 任务按照用户故事分阶段编排，确保每个故事可独立交付与验证。

## 格式说明
- `[ID] [P?] [Story] 描述`
- `[P]` 表示任务可并行执行（不同文件、互不依赖）
- `[Story]` 指任务归属：Setup、Foundation、US1、US2、US3、Polish
- 描述中给出具体文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**目标**: 初始化仓库结构与基础开发支撑

- [X] T001 [Setup] 创建目录骨架 `app/main/`, `app/preload/`, `app/renderer/`, `core/{scanner,normalizer,indexer,storage}/`, `packages/cli/`, `tests/{unit,integration,e2e}/`
- [X] T002 [Setup] 配置 `package.json`，引入 Electron 31、Vue 3、Pinia、Vite、better-sqlite3、Vitest、Playwright 依赖并设置 Yarn workspace 脚本
- [X] T003 [P] [Setup] 新建 `tsconfig.json` 与 `tsconfig.renderer.json`，为主进程与渲染进程分别配置 TypeScript 目标与路径别名
- [X] T004 [P] [Setup] 在 `eslint.config.js` 和 `prettier.config.cjs` 中定义统一的 lint / 格式化规范，覆盖 `app/` 与 `core/`
- [X] T005 [Setup] 根据 `quickstart.md` 配置 `package.json` 中的脚本命令：`dev:core`, `dev:app`, `scanner:full`, `cli export`, `test:*`

---

## Phase 2: Foundational (Blocking Prerequisites)

**目标**: 建立对所有故事通用的底层能力（数据库、IPC、权限检测、共享类型）

⚠️ 完成前禁止进入任一用户故事

- [X] T006 [Foundation] 设计 SQLite 初始化脚本 `core/storage/schema.sql`，定义 `shortcut_entries`, `conflict_groups`, `scan_metadata` 三张表
- [X] T007 [Foundation] 实现 `core/storage/index.ts`，封装 better-sqlite3 连接、迁移执行与通用查询工具
- [X] T008 [P] [Foundation] 在 `core/types/shortcuts.ts` 中定义 `ShortcutEntry`, `ConflictGroup`, `ContextSnapshot` TypeScript 接口，保持与 data-model.md 对齐
- [X] T009 [Foundation] 开发 `core/scanner/accessibility-bridge.ts`，封装调用 macOS Accessibility API 与 `defaults` 命令的 Node-API 桥接
- [X] T010 [Foundation] 在 `app/main/ipc/server.ts` 搭建本地 IPC/HTTP 网关，实现基本路由注册与 JSON 响应封装
- [X] T011 [P] [Foundation] 实现 `app/preload/index.ts`，通过 contextBridge 暴露安全 IPC 客户端（仅允许白名单方法）
- [X] T012 [Foundation] 在 `packages/cli/src/index.ts` 中初始化 CLI 框架，预留 `export` 与 `status` 子命令结构
- [X] T013 [Foundation] 新建 `core/permissions/status-service.ts`，封装 Accessibility、Automation、偏好读取权限检测逻辑并缓存结果（满足 `/permissions/status` 契约）
- [X] T014 [Foundation] 在 `tests/integration/` 下添加基线脚本 `setup-mock-data.ts`，用于注入模拟快捷键数据供后续故事复用

**Checkpoint**: 数据存储、权限检测与 IPC 网关已就绪，可启动用户故事开发

---

## Phase 3: User Story 1 - 长按 Command 查看当前可用快捷键 (Priority: P1) 🎯 MVP

**Goal**: 用户长按 Command 时，1 秒内弹出浮动层，展示当前焦点可用快捷键并在松开时关闭

**Independent Test**: 在授权设备上运行 `yarn dev:app`，长按 Command 触发浮动层，确认展示内容与当前应用一致；松开 Command 浮动层关闭，原快捷键行为保持

### Implementation

- [X] T015 [US1] 实现 `core/scanner/context-capture.ts`，组合 AXUIElement 信息生成 `ContextSnapshot` 并调用权限检查
- [X] T016 [US1] 在 `core/indexer/query-service.ts` 中实现按 `bundleId` + `focusedElementType` 检索 `ShortcutEntry` 列表的查询方法
- [X] T017 [US1] 更新 `app/main/command-listener.ts`，监听 Command 按键长按，调用 `/overlay/context` 路由并推送到渲染进程
- [X] T018 [P] [US1] 在 `app/main/ipc/routes/overlay.ts` 中实现 `/overlay/context` 与 `/overlay/hide` 契约，返回 `OverlayPayload`
- [X] T019 [P] [US1] 构建 `app/renderer/src/stores/context.ts`（Pinia store），管理当前上下文、快捷键列表、性能预算
- [X] T020 [US1] 实现 `app/renderer/src/components/OverlayPanel.vue`，渲染快捷键卡片、焦点信息和无结果提示
- [X] T021 [US1] 在 `app/renderer/src/hooks/useCommandOverlay.ts` 中处理长按阈值逻辑、订阅 store 变化、松开时关闭
- [X] T022 [US1] 新增 `app/preload/overlay-bridge.ts`，桥接渲染层调用 IPC 接口，确保只暴露必要方法
- [X] T023 [US1] 在 `tests/integration/overlay/overlay-flow.spec.ts` 中编写端到端脚本：模拟长按、验证浮动层出现/隐藏与数据渲染
- [X] T024 [US1] 更新 `quickstart.md` 的“关键调试命令”段落，加入浮动层调试提示与已实现脚本

**Checkpoint**: US1 可独立运行，通过浮动层展示满足 P1 验收

---

## Phase 4: User Story 2 - 打开稳定窗口管理全局快捷键索引 (Priority: P2)

**Goal**: 稳定窗口集中展示与搜索全量快捷键索引，支持从浮动层跳转并查看详细信息、执行导出

**Independent Test**: 在 US1 完成的基础上，从浮动层点击任意项或菜单打开稳定窗口，检索特定组合键并导出索引，验证数据与筛选项准确

### Implementation

- [X] T025 [US2] 在 `app/main/window-manager.ts` 中创建稳定窗口生命周期管理（单例、聚焦/隐藏）
- [X] T026 [US2] 实现 `app/main/ipc/routes/shortcuts.ts`，满足 `/shortcuts` 契约（过滤、分页、统计 total）
- [X] T027 [P] [US2] 扩展 `core/indexer/query-service.ts`，加入按来源、冲突状态过滤与排序支持
- [X] T028 [P] [US2] 构建 `app/renderer/src/stores/shortcut-index.ts`，管理稳定窗口内的搜索条件与结果缓存
- [X] T029 [US2] 实现 `app/renderer/src/views/StableWindow.vue`，包含搜索输入、过滤器、结果表格、详情侧栏
- [X] T030 [US2] 在 `packages/cli/src/commands/export.ts` 中实现索引导出逻辑，调用 `/export` API 并写入文件
- [X] T031 [US2] 更新 `app/main/ipc/routes/export.ts`，调用核心导出服务并返回文件路径
- [X] T032 [US2] 在 `core/indexer/export-service.ts` 中实现 JSON/CSV 导出格式化与文件落盘
- [X] T033 [US2] 扩充 `quickstart.md` 的导出示例，记录文件输出路径与常见问题

**Checkpoint**: 稳定窗口与导出流程可独立使用，具备搜索与详情浏览能力

---

## Phase 5: User Story 3 - 识别并处理快捷键冲突 (Priority: P3)

**Goal**: 系统自动标记冲突组合，分类展示并提供跳转指引，浮动层/稳定窗口中均能识别

**Independent Test**: 注入两个不同来源的相同组合键，运行应用后在稳定窗口看到冲突标记，并在浮动层或详情页获取处理指引

### Implementation

- [X] T034 [US3] 在 `core/indexer/conflict-detector.ts` 中实现冲突分组计算与等级判定逻辑，写入 `conflict_groups`
- [X] T035 [US3] 扩展 `core/indexer/query-service.ts`，为浮动层查询追加冲突标记信息
- [X] T036 [US3] 实现 `app/main/ipc/routes/conflicts.ts`，响应 `/conflicts` 请求并返回分组列表
- [X] T037 [P] [US3] 更新 `app/renderer/src/components/OverlayPanel.vue` 显示冲突徽标与优先级排序（依赖 T035）
- [X] T038 [P] [US3] 在 `app/renderer/src/views/StableWindow.vue` 中加入冲突筛选器、冲突详情面板与设置跳转按钮
- [X] T039 [US3] 在 `core/indexer/export-service.ts` 中增加导出配置，支持选择是否包含冲突说明与处理提示
- [X] T040 [US3] 更新 `packages/cli/src/commands/status.ts`，在 CLI 状态输出中展示冲突统计摘要
- [X] T041 [US3] 扩充 `tests/integration/overlay/overlay-flow.spec.ts` 与新增 `tests/integration/stable-window/conflict-flow.spec.ts`，覆盖冲突标记场景
- [X] T042 [US3] 更新 `quickstart.md` 增加“冲突排查”章节，描述如何触发探针模式与定位冲突

**Checkpoint**: 冲突检测与展示完成，三大用户故事均可独立验证

---

## Phase 6: Polish & Cross-Cutting Concerns

**目标**: 收尾工作，确保整体体验稳定可靠

- [X] T043 [Polish] 在 `app/main/logging.ts` 中补充结构化日志与性能指标上报（响应时间、扫描耗时）
- [X] T044 [P] [Polish] 执行 `docs/` 与 `README.md` 更新，记录已实现能力与权限指引
- [X] T045 [Polish] 审核并精简 `app/renderer` 与 `core/` 中的重复代码，确保遵循最小权限原则
- [X] T046 [Polish] 运行 `yarn test:unit && yarn test:integration && yarn test:e2e`，汇总结果写入 `reports/test-summary.md`
- [X] T047 [Polish] 对 `packages/cli` 命令进行错误处理与用户提示优化，保障非技术用户可使用

**Checkpoint**: 项目达到发布标准，可进入验收/打包阶段

---

## Dependencies & Execution Order

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6（严格顺序）
2. 用户故事依赖：US1 无外部依赖；US2 依赖 US1 完成的 IPC/跳转钩子；US3 依赖 US1、US2 已建立的索引与展示组件
3. Story 完成顺序建议：US1 (MVP) → US2 → US3；若资源充足，US2、US3 可在 US1 稳定后并行推进部分子任务

---

## Parallel Opportunities per Story

- **Setup**: T003、T004 可并行（配置文件互不影响）
- **Foundation**: T008 与 T011 可与其它任务并行；其余需按依赖顺序执行
- **US1**: T018 与 T019 在不同模块可并行；T020、T021、T022 需等待 store/IPC 准备
- **US2**: T027 与 T028 可并行；T029 依赖 store 完成；T030 与 T031 并行但需先有导出服务 (T032)
- **US3**: T037 与 T038 可并行，前提是 T034–T036 完成；T041 需待相关 UI 更新结束

---

## Implementation Strategy

1. **MVP 先行**：优先完成 US1（浮动层体验），确保核心价值可验证。
2. **增量扩展**：在 US1 稳定后引入 US2 的稳定窗口与导出，随后上线冲突检测（US3）。
3. **数据驱动**：借助 SQLite 与核心索引服务，保持扫描→索引→展示的单向数据流，降低耦合。
4. **持续验证**：各阶段完成后运行 quickstart 与集成脚本，保证独立交付能力。
5. **收尾优化**：Polish 阶段聚焦日志、文档与 CLI 体验，为后续版本扩展奠定基础。
