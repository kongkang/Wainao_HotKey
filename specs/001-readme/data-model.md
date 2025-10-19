# Data Model: macOS 快捷键统一管理 MVP

## ShortcutEntry

- **描述**: 单个快捷键记录，代表系统、应用或网页来源的可触发操作。
- **字段**
  - `id` (UUID string): 唯一标识，基于来源 + 组合键 + 目标生成。
  - `scope` (enum: `system`, `app`, `web`): 快捷键所属范围。
  - `bundleId` (string, optional): 对应应用 Bundle ID 或浏览器扩展标识。
  - `appName` (string, optional): 展示名称。
  - `rawCombo` (string): 原始组合键文本（来自数据源）。
  - `normalizedCombo` (string): 标准化组合键（统一顺序 + 修饰符符号）。
  - `humanLabel` (string): 将组合键与操作名称组合后的人类可读描述。
  - `target` (string): 菜单路径、命令描述或页面作用域。
  - `sourceFile` (string): 数据来源文件/路径（如 plist 路径、JS 报告标识）。
  - `editable` (boolean): 是否支持在工具内直接修改。
  - `lastSeenAt` (datetime): 最近一次扫描发现时间。
  - `metadata` (JSON object): 存储上下文类型、需要额外权限等扩展信息。
- **验证**
  - `normalizedCombo` 必须符合统一语法（修饰符排序、大小写）。
  - 同一 `bundleId` + `normalizedCombo` 组合只能出现一次（重复视为覆盖而非新增）。
  - `editable` 为 true 时必须存在可跳转或直接操作的路径（如设置页 URL）。
- **关系**
  - 多个 `ShortcutEntry` 可关联到一个 `ConflictGroup`。
  - 与 `ContextSnapshot` 通过视图映射（非直接存储关系）。

## ConflictGroup

- **描述**: 将共享同一 `normalizedCombo` 的多个快捷键条目聚合，并标记冲突等级。
- **字段**
  - `id` (UUID string): 冲突组唯一标识。
  - `normalizedCombo` (string): 冲突组合键。
  - `level` (enum: `none`, `intra-app`, `inter-app`, `system-vs-app`, `web-vs-app`): 冲突等级。
  - `entryIds` (array<UUID>): 关联的 `ShortcutEntry` 列表。
  - `firstDetectedAt` (datetime): 首次检测到冲突的时间。
  - `notes` (string, optional): 分析备注或用户标注。
- **验证**
  - `level` 必须依据关联条目动态计算；存储时作为冗余字段需与计算结果一致。
  - `entryIds` 数量 >= 1；当数量 == 1 时 `level` 强制为 `none`。
- **关系**
  - 由一个或多个 `ShortcutEntry` 组成。
  - 可关联到用户自定义的解决方案记录（未来扩展）。

## ContextSnapshot

- **描述**: 记录浮动层展示时的当前上下文，用于查询最相关的快捷键集合。
- **字段**
  - `id` (UUID string): 快照识别号。
  - `appName` (string): 当前前台应用名称。
  - `bundleId` (string): 当前前台应用 ID。
  - `windowTitle` (string): 活动窗口标题。
  - `focusedElementType` (enum: `menu`, `text-input`, `editor`, `browser`, `other`): 焦点类型。
  - `timestamp` (datetime): 采集时间。
  - `keyProbe` (JSON object, optional): 探针模式下的按键捕获详情。
- **验证**
  - `bundleId` 必须存在于 `ShortcutEntry` 或系统映射表中。
  - `timestamp` 需接近实时（与当前时间差不超过 5 秒）方可用于浮动层展示。
- **关系**
  - 不持久化历史记录，仅短期缓存，用于查询 `ShortcutEntry`。

## State Transitions

- **扫描管线**
  1. `raw` 数据 → 标准化生成 `ShortcutEntry`。
  2. 通过组合键分组计算 `ConflictGroup`。
  3. 更新 SQLite 表时使用 upsert，保持 `lastSeenAt`。

- **浮动层上下文**
  1. 捕获当前应用，生成 `ContextSnapshot`。
  2. 查询 `ShortcutEntry` 按 `normalizedCombo` + `bundleId` 匹配。
  3. 输出渲染模型供浮动层/稳定窗口使用。
