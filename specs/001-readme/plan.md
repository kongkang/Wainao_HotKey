# Implementation Plan: macOS 快捷键统一管理 MVP

**Branch**: `001-readme` | **Date**: 2025-10-19 | **Spec**: [/Users/kongkang/Developer/Wainao_HotKey/specs/001-readme/spec.md](/Users/kongkang/Developer/Wainao_HotKey/specs/001-readme/spec.md)  
**Input**: Feature specification from `/specs/001-readme/spec.md`

## Summary

实现一款面向 macOS 的快捷键统一管理工具，核心能力包括：长按 Command 呼出的上下文浮动层、集中化的稳定窗口索引，以及冲突检测与导出。技术方案基于 Electron + Vue 3 构建桌面界面，Node.js/TypeScript 负责权限检测、快捷键扫描、索引与冲突分析，结合本地只读元数据存储，确保 1 秒响应和高覆盖率扫描。

## Technical Context

**Language/Version**: TypeScript 5.x（主逻辑），JavaScript (ES2022) 辅助脚本  
**Primary Dependencies**: Electron 31、Vue 3、Pinia、Vite、Node-API bindings（Accessibility / plist 读写库）  
**Storage**: 本地嵌入式 SQLite 数据库（better-sqlite3 绑定）  
**Testing**: Vitest（单元）、Playwright（端到端）、自定义可访问性探针回归脚本  
**Target Platform**: macOS 13+ 桌面  
**Project Type**: 桌面（Electron 主进程 + 前端 UI）  
**Performance Goals**: 浮动层首次响应 <1s；全量扫描 <3min；稳定窗口检索 <200ms  
**Constraints**: 只读扫描优先、不得破坏原有快捷键行为、最小权限（Accessibility + 偏好读取）  
**Scale/Scope**: 单机单用户，覆盖系统 + 常用应用 + 浏览器扩展快捷键

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

当前 constitution (`.specify/memory/constitution.md`) 未定义具体原则与强制门控，仅保留占位符。记录状态：无显式治理要求，默认通过。本次规划仍遵循“无实现细节进入规范、先研究后设计、保持简化结构”的通用约束。  
**Phase 1 复核**：设计阶段引入的模块划分与 SQLite 持久层保持简洁结构，无额外宪章冲突，门控继续通过。

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```
app/
├── main/                 # Electron 主进程与权限管理
├── preload/              # 预加载脚本，隔离 Node API
└── renderer/             # Vue 3 前端（浮动层 + 稳定窗口）

core/
├── scanner/              # 系统、App、浏览器快捷键采集模块
├── normalizer/           # 组合键标准化与本地化描述
├── indexer/              # 索引构建与冲突分析
└── storage/              # 本地持久层（挂接 SQLite/JSON）

packages/
└── cli/                  # 调试与导出工具（JSON/CSV 导出）

tests/
├── unit/                 # Vitest 单元测试
├── integration/          # 扫描 + 索引端到端验证
└── e2e/                  # Playwright 驱动的 UI 测试
```

**Structure Decision**: 采用单仓多模块布局：`app/` 负责 Electron 外壳与 UI，`core/` 承载可测试的领域逻辑并暴露服务接口，`packages/cli` 提供调试导出入口，`tests/` 独立分类测试类型，便于后续自动化流水线集成。

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
