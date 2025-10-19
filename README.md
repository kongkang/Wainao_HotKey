项目文档：macOS 快捷键统一管理工具

⸻

一、项目背景与问题现状

在 macOS 系统中，不同层级的软件与系统服务都会注册快捷键（Hotkey）。
长期使用后，用户常见问题包括：
	1.	冲突难查：多个 App 或系统功能使用相同快捷键，导致部分功能失效或行为异常。
	2.	来源难辨：无法快速判断某个快捷键属于哪个软件或模块。
	3.	管理分散：系统快捷键、App 自定义快捷键、网页快捷键分散在不同位置。
	4.	上下文复杂：同一 App 的不同区域快捷键行为不同，用户难以预期。
	5.	修改风险高：修改快捷键时容易破坏系统或 App 配置，不易追踪。

⸻

二、项目目标

设计并实现一个面向 macOS 的“快捷键统一管理工具”，目标为：
	1.	统一查看：整合系统与应用快捷键信息，快速定位冲突与来源。
	2.	上下文感知：实时显示当前焦点下可用快捷键。
	3.	安全修改：在后续版本中提供统一的快捷键修改、迁移与冲突解决入口。
	4.	快捷访问：用户长按 Command 键即可调出浮动层，随时查看当前可用快捷键。
	5.	读写分离：优先实现只读扫描与索引，之后再提供安全的修改功能。

⸻

三、核心功能概述

工具分为两部分：

Part 1：全局快捷键集合（索引视图）

目标：建立全局可搜索的快捷键信息库。

功能：
	•	扫描系统级与 App 自定义快捷键；
	•	统一标准化组合键格式；
	•	检测并标记冲突（同一组合多方占用）；
	•	展示快捷键来源（系统/App/菜单路径）；
	•	支持搜索、过滤与导出。

Part 2：Command 长按浮动层（上下文即时视图）

目标：用户长按 Command 时显示当前上下文快捷键提示层。

功能：
	•	侦测当前前台 App、窗口、焦点元素；
	•	实时显示当前上下文下可用快捷键；
	•	显示来源（系统 / App / 网页扩展）；
	•	按优先级排序（系统 > App > 网页）；
	•	在浮动层中点击某项可打开稳定窗口；
	•	稳定窗口可查看、搜索并修改快捷键；
	•	若快捷键无法直接修改，可跳转对应 App 设置页；
	•	松开 Command 或未操作则自动关闭浮动层；
	•	探针模式：用户按键时显示被哪个程序捕获。

⸻

四、数据来源与采集方式

层级	来源说明	获取方式
系统快捷键	系统功能（Spotlight、截图、Mission Control）	读取 com.apple.symbolichotkeys.plist
App 自定义快捷键	用户定义或默认菜单快捷键	defaults read <bundleId> NSUserKeyEquivalents
菜单项快捷键	菜单树中的默认快捷键	Accessibility API 获取
焦点元素信息	当前窗口与焦点类型	AXUIElement 查询
网页快捷键	JS 注册与浏览器扩展快捷键	浏览器扩展 + Content Script
全局占用检测	判断是否注册相同组合	尝试注册全局热键测试冲突


⸻

五、数据结构与索引设计

interface ShortcutEntry {
  id: string;
  scope: "system" | "app";
  bundleId?: string;
  appName?: string;
  rawCombo: string;
  normalizedCombo: string;
  target: string;
  sourceFile: string;
  editable: boolean;
}

interface ConflictGroup {
  normalizedCombo: string;
  entries: ShortcutEntry[];
  level: "none" | "intra-app" | "inter-app" | "system-vs-app";
}


⸻

六、关键技术路线

1. 前端框架
	•	Electron + Vue 3 + TypeScript
	•	负责渲染浮动层与索引窗口；
	•	支持快捷搜索、冲突高亮与修改入口；
	•	调用 Node 层 API 执行扫描与写入。

2. 后端逻辑（Node/TypeScript）

模块划分：
	•	scanner/：扫描系统与 App 快捷键；
	•	normalizer/：符号（如 @~^$）标准化；
	•	indexer/：建立快捷键倒排与正排索引；
	•	context/：检测当前焦点与可用菜单项；
	•	probe/：探针模式记录按键消费方。

⸻

七、系统交互与命令调用

任务	命令 / API
列出偏好域	/usr/bin/defaults domains
读取 App 快捷键	/usr/bin/defaults read <domain> NSUserKeyEquivalents
写回快捷键	defaults write <domain> NSUserKeyEquivalents -dict-add "<菜单>" "<组合>"
删除快捷键	defaults delete <domain> NSUserKeyEquivalents "<菜单>"
打开系统设置页	open "x-apple.systempreferences:com.apple.preference.keyboard?Shortcuts"
检测焦点与菜单	Accessibility API (AXUIElement)


⸻

八、浮动层与窗口交互逻辑

1. Command 长按触发机制
	•	系统全局监听 Command 键状态；
	•	若按住超过设定阈值（约 400–600ms），显示浮动层；
	•	若同时按其他键，则忽略触发（正常快捷键行为不受影响）。

2. 浮动层
	•	显示内容：
当前 App 名称、窗口标题、焦点类型；
	•	列表展示：
当前上下文可用快捷键 + 来源；
	•	操作：
	•	点击快捷键 → 打开稳定窗口；
	•	松开 Command → 自动关闭；
	•	ESC → 手动关闭；
	•	Command+Option → 进入探针模式。

3. 稳定窗口（快捷键管理中心）
	•	可查看所有系统与 App 快捷键；
	•	支持搜索、过滤、冲突高亮；
	•	可直接修改或跳转至系统/应用设置；
	•	支持导出、导入、撤销修改。

⸻

九、浏览器扩展交互
	•	Content Script 监听 keydown 事件；
	•	上报：
	•	焦点类型（input、textarea、contenteditable）；
	•	是否 preventDefault；
	•	当前 URL；
	•	是否被扩展或网页占用；
	•	与桌面端通过原生消息端口通信，实现统一索引。

⸻

十、权限与安全
	•	需要开启 Accessibility 权限；
	•	仅读写用户目录下偏好文件；
	•	禁止修改系统受保护区域；
	•	所有写入操作可撤销、可备份；
	•	探针与监听功能仅在授权下启用。

⸻

十一、实现原则
	1.	读写分离：先实现只读索引，再扩展写入功能。
	2.	最小入侵：不注册全局热键，不劫持系统事件。
	3.	用户可解释性：明确显示快捷键来源与冲突原因。
	4.	渐进增强：MVP 先实现静态索引与 Command 浮动层。

⸻

十二、未来扩展方向
	•	实时监听偏好文件变化；
	•	键盘布局可视化（标出占用区域）；
	•	云端同步（iCloud / 自建服务器）；
	•	快捷键推荐与冲突自动优化；
	•	导出 Karabiner 配置；
	•	AI 辅助优化：自动建议更合理的快捷键组合。

⸻

十三、总结

该工具通过“长按 Command 呼出浮动层 + 全局索引窗口”的双层结构，为 macOS 用户提供一个随时可查、上下文感知的快捷键观察与管理系统。
它让用户在任何场景下都能即时获知当前可用快捷键、其来源及冲突情况，并在稳定窗口中进行进一步管理和修改。