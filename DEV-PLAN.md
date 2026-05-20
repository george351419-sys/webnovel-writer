# DEV-PLAN.md — WebNovel Writer

> 纯前端 SPA，面向网文写手的 AI 写作工作台（BYOK）
> Version: 1.0.0
> Created: 2026-05-20
> 依赖: docs/superpowers/specs/2026-05-20-webnovel-writer-design.md

---

## 0. 技术栈

```
React 18 + Vite 5 + TypeScript 5
Tailwind CSS 3（Catppuccin Mocha 暗色主题）
TipTap 2（富文本编辑器）
Zustand 4（状态管理 + persist）
Dexie.js 3（IndexedDB ORM）
OpenAI JS SDK（dangerouslyAllowBrowser，BYOK）
React Router 6（HashRouter）
Lucide React（图标）
```

## 1. 项目结构

```
webnovel-writer/
├── src/
│   ├── components/
│   │   ├── layout/       # 三栏布局
│   │   ├── editor/       # TipTap 编辑器
│   │   ├── ai-panel/     # 右栏流水线面板
│   │   ├── truth-files/  # 真相文件编辑器
│   │   └── ui/           # 通用组件（Button, Modal...）
│   ├── engine/
│   │   ├── pipeline/     # 5段状态机
│   │   ├── audit/        # 33维审稿
│   │   ├── memory/       # 真相文件更新器
│   │   └── style/        # 风格指纹
│   ├── genres/           # 6题材 Prompt
│   ├── db/               # Dexie.js schema + hooks
│   ├── store/            # Zustand stores
│   ├── model/            # OpenAI SDK 路由层
│   ├── pages/            # 路由页面
│   └── types/            # TypeScript 类型
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Phase 1: 工程脚手架 + Catppuccin 主题

**目标**: `npm run dev` 启动能看到暗色主题骨架页，路由可切换

**验收**: 三栏布局框架可见，Catppuccin Mocha 配色正确，路由无报错

---

### Task 1.1: Vite + React + TypeScript 初始化（2h）
- **新增**: `package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`src/main.tsx`、`src/App.tsx`
- **依赖**: react@18、react-dom@18、typescript@5、vite@5、@vitejs/plugin-react
- **自检**: `npm run dev` 启动、`npm run build` 通过

### Task 1.2: Tailwind + Catppuccin Mocha 主题配置（2h）
- **新增**: `tailwind.config.ts`（Catppuccin Mocha 色板作为 tokens）、`src/styles/global.css`
- **Catppuccin Mocha 核心色**:
  - Base `#1e1e2e`、Mantle `#181825`、Crust `#11111b`
  - Surface0 `#313244`、Surface1 `#45475a`
  - Text `#cdd6f4`、Subtext1 `#bac2de`、Overlay2 `#9399b2`
  - Mauve `#cba6f7`（主色）、Blue `#89b4fa`、Green `#a6e3a1`
  - Red `#f38ba8`、Yellow `#f9e2af`、Peach `#fab387`
- **自检**: `npm run build` 通过，样式文件含自定义 tokens

### Task 1.3: React Router + 页面骨架（2h）
- **新增**: `src/router.tsx`、`src/pages/Home.tsx`、`src/pages/Project.tsx`、`src/pages/Settings.tsx`
- **路由**: `/` Home | `/project/:id` Project | `/settings` Settings
- **依赖**: react-router-dom@6（HashRouter）、lucide-react
- **自检**: 路由切换无报错，三个页面各显示占位文本

### Task 1.4: 三栏布局框架（3h）
- **新增**: `src/components/layout/WorkspaceLayout.tsx`（160px/flex-1/280px）
  - `src/components/layout/LeftSidebar.tsx`（文件树占位）
  - `src/components/layout/EditorArea.tsx`（编辑器占位）
  - `src/components/layout/RightPanel.tsx`（AI 面板占位）
- **样式**: 全暗色，Catppuccin Mantle 背景，分隔线 Surface0
- **自检**: 三栏布局正确，宽度比例正确，overflow 处理正确

---

## Phase 2: 数据层 + 状态管理

**目标**: IndexedDB schema 建好，Zustand store 就绪，CRUD 基础可用

**验收**: 可在 DevTools IndexedDB 看到表结构，store 读写无报错

---

### Task 2.1: Dexie.js Schema 初始化（2h）
- **新增**: `src/db/schema.ts`（Project/Chapter/TruthFile 表定义）
  - `src/db/index.ts`（Dexie 实例，版本迁移）
- **依赖**: dexie@3
- **数据模型**: 严格按设计文档 §4.1
- **自检**: `npm run build` 通过，DevTools IndexedDB 可见三张表

### Task 2.2: Zustand Store（项目 + 章节 + 真相文件）（3h）
- **新增**: 
  - `src/store/projects.ts`（项目 CRUD + 当前项目）
  - `src/store/chapters.ts`（章节 CRUD + 当前章节 + 流水线状态）
  - `src/store/truthFiles.ts`（7个真相文件读写）
  - `src/store/ui.ts`（侧边栏展开状态、右栏 tab 等）
- **依赖**: zustand@4
- **自检**: store action 调用后 IndexedDB 数据正确变化

### Task 2.3: 模型路由层（BYOK）（2h）
- **新增**: `src/model/client.ts`（OpenAI SDK 实例工厂，读 localStorage config）
  - `src/model/router.ts`（writing/audit/revise 三路由）
  - `src/store/modelConfig.ts`（配置 persist 到 localStorage）
- **依赖**: openai@4（dangerouslyAllowBrowser）
- **自检**: 配置写入后 client.ts 能用对应 model 调用，`npm run build` 通过

---

## Phase 3: 核心 UI — 首页 + 新建项目向导

**目标**: 用户能创建项目，三步向导（题材→设定→模型配置）走通

**验收**: 创建项目写入 IndexedDB，进入工作区路由

---

### Task 3.1: 首页（项目列表 + 新建按钮）（3h）
- **新增**: `src/pages/Home.tsx`（项目卡片网格，显示总字数/最后更新时间）
  - `src/components/home/ProjectCard.tsx`
  - `src/components/home/EmptyState.tsx`
- **自检**: 空状态显示、项目卡片点击跳转工作区

### Task 3.2: 新建项目向导（3h）
- **新增**: `src/pages/NewProject.tsx`（3步 wizard）
  - Step 1: 题材选择（6张卡片）
  - Step 2: 项目名称 + 基础设定
  - Step 3: 模型配置（跳过或填写）
- **路由**: `/new` 
- **自检**: 三步流畅跳转，最终写入 IndexedDB，跳转到 `/project/:id`

### Task 3.3: 左侧文件树（3h）
- **新增**: `src/components/layout/LeftSidebar.tsx`（完整实现）
  - 节: 🧠 真相文件（7项展开/收起）、📖 正文（章节列表 + 流水线状态图标）
  - `src/components/sidebar/TruthFileList.tsx`
  - `src/components/sidebar/ChapterList.tsx`（含 ✓/⟳ 状态图标）
- **自检**: 点击文件树节点，中栏内容切换

---

## Phase 4: TipTap 编辑器 + 真相文件编辑器

**目标**: 编辑器可用，真相文件（Markdown）可编辑

**验收**: 章节正文可输入，真相文件可编辑并保存到 IndexedDB

---

### Task 4.1: TipTap 编辑器集成（3h）
- **新增**: `src/components/editor/Editor.tsx`
  - 扩展: StarterKit + Placeholder + CharacterCount + Markdown import
  - 底部字数统计栏
- **依赖**: @tiptap/react@2、@tiptap/pm、@tiptap/starter-kit、@tiptap/extension-placeholder、@tiptap/extension-character-count
- **自检**: 可输入，Cmd+B/I 有效，字数实时更新

### Task 4.2: 章节内容自动保存（2h）
- **新增**: `src/hooks/useAutoSave.ts`（1s 防抖 → 写 IndexedDB）
  - 编辑器顶部保存状态指示条（idle/saving/saved）
- **自检**: 输入停止 1s 后写入，刷新页面内容恢复

### Task 4.3: 真相文件编辑器（3h）
- **新增**: `src/components/truth-files/TruthFileEditor.tsx`
  - 7 个文件类型的 icon + 标题
  - Markdown 简单编辑（TipTap 带 Heading/List/Blockquote）
  - 保存按钮 + 快捷键 Cmd+S
- **自检**: 编辑后保存，切换回来内容保留

---

## Phase 5: 5 段写作流水线

**目标**: 右栏显示流水线进度，草稿生成流式写入编辑器，审稿结果可显示

**验收**: 点击「生成草稿」→ 流式输出到编辑器 → 点击「开始审稿」→ 显示问题列表 → 点击「自动修订」→ 修订稿写入编辑器 → 点击「确认」→ 状态变 confirmed

---

### Task 5.1: 流水线状态机（2h）
- **新增**: `src/engine/pipeline/stateMachine.ts`
  - 状态: `planning → drafting → auditing → revising → confirmed`
  - actions: `startDraft / startAudit / startRevise / confirm / rollback`
  - 状态存 `chapters` store 的 `status` 字段
- **自检**: 状态只能单向推进，rollback 回到上一步

### Task 5.2: 右栏流水线面板 UI（3h）
- **新增**: `src/components/ai-panel/PipelinePanel.tsx`
  - 5步进度条（步骤圆圈 + 连线）
  - 当前步骤操作区域（章节规划表单 / 生成按钮 / 审稿报告 / 修订按钮 / 确认按钮）
  - `src/components/ai-panel/AuditReport.tsx`（问题列表，severity 颜色）
- **自检**: 流水线步骤高亮正确，按钮状态正确

### Task 5.3: 草稿生成（流式）（4h）
- **新增**: `src/engine/pipeline/drafter.ts`
  - 组装 prompt: 前 N 章摘要 + 相关真相文件 + 题材 Prompt + 风格指纹 + 章节规划
  - 调用 `model/router.ts` writingModel，stream 输出
  - 流式 chunk → 追加到 TipTap 编辑器
- **自检**: 流式输出平滑，中途可停止（AbortController），内容写入 Chapter.draft

### Task 5.4: 33 维审稿引擎（4h）
- **新增**: `src/engine/audit/dimensions.ts`（33个维度定义，分5组）
  - `src/engine/audit/auditor.ts`（构造审稿 prompt，调用 auditModel，解析结构化响应）
  - `src/engine/audit/parser.ts`（解析 JSON 格式的 AuditIssue[]）
- **自检**: 审稿返回可解析的问题列表，每个问题含 dimension/severity/description/suggestion

### Task 5.5: 自动修订（4h）
- **新增**: `src/engine/pipeline/reviser.ts`
  - 构造修订 prompt: 原稿 + 审稿报告（高/中 severity 问题）
  - 调用 reviseModel，流式输出到 `Chapter.revised`
- **自检**: 修订稿输出，章节状态变 `revising`

### Task 5.6: 确认 + 真相文件自动更新（3h）
- **新增**: `src/engine/memory/updater.ts`
  - confirmed 时，调用模型提取本章新信息 → 追加/更新相关真相文件
  - 更新字段: summaries（本章摘要必更新）+ 其他按内容判断
- **自检**: 确认后，chapters_summary 真相文件新增本章摘要

---

## Phase 6: 6 大题材写作马具

**目标**: 6个题材 Prompt 文件，切换题材后生成风格显著不同

**验收**: 同一章节规划在玄幻/言情题材下输出有显著差异

---

### Task 6.1: 题材 Prompt 数据结构（1h）
- **新增**: `src/genres/types.ts`（GenrePrompt 接口）
  - 字段: id/name/color/爽点公式/人物套路/境界系统规范/禁忌词表/节奏公式/systemPrompt

### Task 6.2: 玄幻/修仙题材（2h）
- **新增**: `src/genres/xuanhuan.ts`
- **内容**: 升级流/境界体系/灵根天赋/门派/功法/炼丹炼器/爽点节奏

### Task 6.3: 系统流题材（2h）
- **新增**: `src/genres/system.ts`
- **内容**: 系统面板格式/任务体系/奖励机制/签到套路/数据化成长

### Task 6.4: 都市题材（2h）
- **新增**: `src/genres/urban.ts`
- **内容**: 打脸节奏/赘婿/商战/强者归来/豪门恩怨/情感推进

### Task 6.5: 星际/科幻题材（2h）
- **新增**: `src/genres/scifi.ts`
- **内容**: 星际联邦/机甲/进化/星际商战/种族体系/科技树

### Task 6.6: 历史/穿越题材（2h）
- **新增**: `src/genres/history.ts`
- **内容**: 朝代背景/穿越套路/古代礼仪/宫斗/经商/科举

### Task 6.7: 言情/甜宠题材（2h）
- **新增**: `src/genres/romance.ts`
- **内容**: 甜宠节奏/虐恋/双向救赎/霸总/玛丽苏/情感弧线

---

## Phase 7: 风格指纹 + 模型配置页

**目标**: 用户能配置 BYOK，上传风格参考文本注入生成

**验收**: 模型配置保存后 `npm run build` 通过，测试连通性有反馈，风格指纹注入生成 prompt

---

### Task 7.1: 模型配置页（3h）
- **新增**: `src/pages/Settings.tsx`（完整实现）
  - 三个模型配置组: 写作模型 / 审稿模型 / 修订模型
  - 字段: BaseURL / API Key / Model 名称 / Temperature
  - 「测试连通性」按钮（发送一个 "hello" 调用验证）
- **自检**: 配置保存到 localStorage，测试按钮返回成功/失败

### Task 7.2: 风格指纹提取 + 注入（3h）
- **新增**: `src/engine/style/fingerprint.ts`
  - 上传参考文本 → 调用模型提取写作风格特征（句式偏好、词汇选择、节奏感）
  - 特征存入 `Project.styleFingerprint`
  - `drafter.ts` 注入风格指纹到生成 prompt
- **新增**: `src/components/truth-files/StyleFingerprintEditor.tsx`（上传入口 + 预览）
- **自检**: 有/无风格指纹的输出有可见差异

---

## Phase 8: 打磨 + 部署

**目标**: 错误处理完善，可部署到 Vercel

**验收**: 无模型配置时有友好提示，Vercel 部署成功可访问

---

### Task 8.1: Toast 通知 + 错误处理（2h）
- **新增**: `src/components/ui/Toast.tsx`（Zustand 驱动）
  - API Key 无效、网络超时、IndexedDB 失败 等场景
- **自检**: 5种错误场景都有友好 Toast

### Task 8.2: 空状态与引导（2h）
- **新增**: 无模型配置时右栏提示「先去设置配置 API Key」
  - 首次使用引导（3步轻提示）
- **自检**: 未配置状态下流水线按钮不可点，提示清晰

### Task 8.3: 导出章节文本（2h）
- **新增**: `src/engine/export.ts`（章节文本 + 真相文件 → .txt / .md 文件）
  - 章节内容菜单「导出本章 / 导出全文」
- **自检**: 导出文件名格式正确，内容完整

### Task 8.4: Vercel 部署配置（1h）
- **新增**: `vercel.json`（SPA fallback 配置）、`README.md`（部署说明）
- **自检**: `npm run build` 产物可部署到 Vercel

---

## 当前状态

- [x] 设计文档 v1.0 ✅
- [x] Phase 1: 工程脚手架 + 主题（4/4）✅
- [x] Phase 2: 数据层（3/3）✅
- [x] Phase 3: 首页 + 向导（3/3）✅
- [x] Phase 4: 编辑器（3/3）✅
- [x] Phase 5: 写作流水线（6/6）✅
- [x] Phase 6: 题材马具（7/7）✅
- [x] Phase 7: 风格指纹 + 模型配置（2/2）✅
- [x] Phase 8: 打磨 + 部署（4/4）✅

---

*跨 session 接续锚点：新开 session 先读本文档，从「当前状态」找到下一个未完成 Task*
