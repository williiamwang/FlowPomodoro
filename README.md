<div align="center">
</div>

# FlowPomodoro（中文说明）

一个极简且优雅的番茄钟应用，支持 AI 辅助的任务拆解与精选引语。基于 React + Vite 构建，专注“轻、静、美”的专注体验。

## 主要功能
- 圆形番茄钟：专注/短休/长休三种模式
- 任务列表：拖拽排序、快速编辑、截止日期、批量选择与删除
- AI 拆解：将目标拆分为 3–5 个可执行子任务
- 引语：按模式刷新精选文案，支持“喜欢”与缓存
- 主题与语言：深色/浅色，中英文切换
- 本地持久化：设置与偏好保存到浏览器

## 技术栈
- React 18、ReactDOM 18
- TypeScript 5
- Vite 6（@vitejs/plugin-react）
- @dnd-kit（拖拽）
- @google/genai（AI 集成）

## 快速开始
- 前提：已安装 Node.js（建议 >= 18）
- 安装依赖：

```bash
npm install
```

- 配置环境变量：
  - 新建 `.env.local`，写入：
    - `GEMINI_API_KEY=你的密钥`
  - `.gitignore` 已忽略 `*.local`，密钥不会被提交

- 启动开发服务：

```bash
npm run dev
```

- 访问地址：http://localhost:3000/

## 常用脚本
- `npm run dev`：开发模式
- `npm run build`：产物构建
- `npm run preview`：构建产物本地预览

## 环境与 AI 说明
- 使用 `GEMINI_API_KEY`（或 `API_KEY`）调用 Gemini
- 模型：`gemini-3-flash-preview`
- 响应：优先按 JSON schema 解析，失败则做稳健解析
- 异常或配额耗尽（429）：自动降级到本地拆解与内置引语
- 控制台会记录提供方：`AI provider: GEMINI` 或 `AI provider: LOCAL`

## 设计规范（概要）
- 字体：Inter、Noto Sans SC（含系统回退）
- 颜色（Morandi 调色）：
  - 基础：`#F5F5F7`；深色基底：`#09090b`
  - 专注：`#E66F66`（渐变 `#FFB8B0`）
  - 短休：`#6FAF76`（渐变 `#B7E2C7`）
  - 长休：`#5B88D0`（渐变 `#9FC3F0`）
- 阴影：glass、glass-dark、ios-btn、ios-float
- 背景：柔和径向渐变；深浅模式平滑过渡
- 控件配色行为：
  - 播放/暂停图标颜色跟随当前模式（WORK/SHORT_BREAK/LONG_BREAK）

## 每日提醒弹窗
- 时间规则：
  - 17:30–24:00 显示“今日总结”弹窗（今日已完成任务与未完成任务，按截止日期升序）
  - 其他时间段显示“今日待办”弹窗（未完成待办，按截止日期升序）
- 交互：
  - 两个弹窗均提供“今天不再显示”选项，勾选后当天不再弹出对应弹窗
  - 同一天各自仅展示一次
  - 视觉采用玻璃拟态卡片，条目展示标题、🍅 completed/estimated、截止日期徽标（逾期红、当天琥珀、3日内浅琥珀、其余灰）
- 键盘快捷键：
  - Ctrl+Enter：从任务输入触发 AI 拆解
  - Enter（日期输入框内）：快速添加任务

## 持久化键位
- `flow_pomodoro_theme`：'dark'|'light'
- `flow_pomodoro_lang`：'ZH'|'EN'
- `flow_pomodoro_assistant_name`：默认 '梦玉'
- `flow_pomodoro_assistant_role`：中文 '小宠物' / 英文 'pet'
- `flow_pomodoro_quotes_cache`：按模式缓存引语
- `zen_pomodoro_settings`：各模式计时设置

## 项目结构
- `index.html`：tailwind 运行时配置与根节点
- `index.tsx`：React root（StrictMode）
- `App.tsx`：主页面（计时器、任务、设置、引语）
- `components/`：`CircularTimer.tsx`、`TaskList.tsx`、`SettingsModal.tsx`
- `services/geminiService.ts`：AI 拆解与引语（含降级）
- `types.ts`：通用类型与枚举
- `vite.config.ts`：环境注入
- `prd.md`：完整 PRD（确保 1:1 复刻）

## 版本
- v0.1.0：初始公开版本
  - 包含核心计时器、任务列表、AI 拆解、引语、主题与设置

## 版权
Copyright © 2026. 保留所有权利。
