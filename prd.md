# FlowPomodoro PRD（1:1复刻规范）

## 1. 产品概述
- 目标：提供轻量且极简的番茄钟（Pomodoro）与任务管理体验，加入 AI 辅助的任务拆解与引语刷新功能，支持中英文与深浅色主题。
- 平台：Web（桌面端为主，移动端可访问）。
- 架构：React 18 + Vite 6 + Tailwind（CDN 运行时配置）。
- 一致性原则：本文档用于确保任何实现者可完全 1:1 复制现有功能、UI与交互，达到像素级一致。

## 2. 技术栈与运行
- 技术：React 18.3.1、ReactDOM 18.3.1、TypeScript 5.8.x、Vite 6.x、@vitejs/plugin-react 5.x、@dnd-kit 栈（core/sortable/utilities）、@google/genai。
- 开发命令：
  - 安装：npm install
  - 本地运行：npm run dev（默认 http://localhost:3000/）
- 环境变量（Vite define 注入）：
  - GEMINI_API_KEY 或 API_KEY：用于 Gemini API 调用
- 入口文件结构：
  - index.html 中 <div id="root"></div> 与 <script type="module" src="/index.tsx"></script>
  - index.tsx 使用 ReactDOM.createRoot 挂载 App

## 3. 数据模型与业务常量
- TimerMode：WORK、SHORT_BREAK、LONG_BREAK
- Language：ZH、EN
- Task：
  - id：string（UUID）
  - title：string
  - completed：boolean
  - dueDate?: string（ISO 日期 YYYY-MM-DD）
  - estimatedPomodoros：number（>=1）
  - completedPomodoros：number（>=0）
- 默认时长（分钟）：
  - WORK=25、SHORT_BREAK=5、LONG_BREAK=15
- 本地缓存键：
  - flow_pomodoro_theme（'dark'|'light'）
  - flow_pomodoro_lang（'ZH'|'EN'）
  - flow_pomodoro_assistant_name（默认 '梦玉'）
  - flow_pomodoro_assistant_role（ZH 默认 '小宠物'；EN 默认 'pet'）
  - flow_pomodoro_quotes_cache（按 TimerMode 分类的引语缓存）
  - zen_pomodoro_settings（自定义时长：Record<TimerMode, number>）

## 4. 视觉与品牌规范
- 字体：
  - Sans：Inter、Noto Sans SC；回退 -apple-system、BlinkMacSystemFont、sans-serif
  - Mono：SF Mono、JetBrains Mono
- 主题（Tailwind 运行时配置：tailwind.config）：
  - darkMode: 'class'
  - colors.morandi：
    - base: #F5F5F7
    - darkBase: #09090b
    - text.primary: #1D1D1F
    - text.secondary: #86868B
    - text.darkPrimary: #F5F5F7
    - text.darkSecondary: #A1A1AA
    - work.DEFAULT: #E66F66；work.light: #FDECEB；work.gradient: #FF8F85
    - break.DEFAULT: #6FAF76；break.light: #E8F4EC；break.gradient: #B7E2C7
    - long.DEFAULT: #5B88D0；long.light: #E7F1FB；long.gradient: #9FC3F0
- 背景（index.html style）：
  - 浅色：base 背景 + 两个 radial-gradient（位置：15% 50%、85% 30%，rgba(214,140,131,0.08)、rgba(136,156,174,0.08)）
  - 深色：darkBase 背景 + 两个 radial-gradient（同位置，透明度 0.03）
  - 背景固定、颜色过渡 0.5s
- 阴影：
  - glass：0 8px 32px 0 rgba(31, 38, 135, 0.07)
  - glass-dark：0 8px 32px 0 rgba(0, 0, 0, 0.5)
  - ios-btn：0 2px 5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.05)
  - ios-float：0 10px 20px -5px rgba(0, 0, 0, 0.1)
- 深浅色切换：html 标签切换 class 'dark'
- 颜色使用规范：
  - 主要文案：text-morandi-text-primary（深色下 text-white 或灰 100/200）
  - 强调与按钮：morandi.work/break/long
  - 次要文案：text-morandi-text-secondary

## 5. 页面结构与布局
- 顶部工具区：
  - 右上角两个圆形按钮：
    - 主题切换（浅/月亮图标与深/太阳图标）
    - 设置入口（齿轮图标）
- 页面标题与引语卡片（Header）：
  - 左侧图标：SVG 32x32，主形填充 #E66F66，顶部有两段绿色线段（stroke #4A7156，宽度 1.8）
  - 标题：FlowPomodoro，text-2xl、font-bold
  - 引语卡片：白玻璃态（白/30、深色白/5，圆角 2rem，hover 轻微放大），内容斜体可点击换句
  - 卡片右上角悬浮操作：Like（变红）、Refresh（转圈）
- 模式切换条（Segmented Control）：
  - 背板：灰色圆角胶囊
  - 三个按钮：WORK/SHORT/LONG，被选中项白色圆角且阴影
- 计时区域：
  - 圆形计时器组件（详见组件规范）
  - 下方 4 个进度点：表示已完成 WORK 次数；点亮为 morandi.work 并带 glow
- 控制按钮区：
  - Reset（14x14 圆形，灰边白底，hover morandi.work）
  - Play/Pause（20x20 圆形，阴影 ios-float，图标颜色跟随当前模式：WORK=morandi.work、SHORT_BREAK=morandi.break、LONG_BREAK=morandi.long；图标 fill 使用 currentColor）
- 任务列表卡片：
  - 背景玻璃态（白/60 或深灰/60），圆角 2rem，阴影 glass/glass-dark
  - 内含“输入区”、“列表区”、“批量操作浮层”
- 底部批量删除浮层（选择模式时出现）：红色主按钮，居中悬浮

## 6. 组件规范
### 6.1 CircularTimer
- 尺寸与绘制：
  - 半径 radius=140，描边 stroke=12，normalizedRadius = radius - stroke
  - 外层背景圈颜色：浅色 #F0F0F2，深色 gray-700/50
  - 进度圈使用线性渐变（不同模式）：
    - WORK：start #E66F66、end #FFB8B0、shadow rgba(230,111,102,0.4)
    - SHORT_BREAK：start #6FAF76、end #CFE7DB、shadow rgba(111,175,118,0.45)
    - LONG_BREAK：start #5B88D0、end #9FC3F0、shadow rgba(91,136,208,0.45)
  - strokeDashoffset = circumference - (timeLeft/totalTime)*circumference，过渡 0.8s cubic-bezier(0.4, 0, 0.2, 1)
- 内部文案：
  - 时间文本：text-7xl、font-semibold、tracking-tighter
  - 标签胶囊：小号大写文案，active 时显示脉冲圆点（同模式色）
### 6.2 TaskList
- 输入区：
  - 文本框：左侧图标（AI加载时旋转），右侧有 AI 拆解按钮（紫色）与提交按钮（work色）
  - 日期选择胶囊：文字灰色，hover 变 work 色；真实 input[type=date] 透明覆盖（class: date-input-overlay）
  - 番茄估算胶囊：含加减按钮与当前数值（>=1）
- 列表项（支持拖拽）：
  - 左侧完成按钮：未完成白底灰边；完成后绿色（使用 morandi-break）
  - 标题：未完成为正文色；完成变灰并加删除线
  - 番茄统计徽标：🍅 completedPomodoros / estimatedPomodoros（text-[10px]）
  - 截止提醒：即将到期显示琥珀色点与“即将到期”标签
  - 快捷小控件（hover 透明度显现）：编辑、删除、拖拽柄
  - 选中模式：左侧圆形选择器，高亮背景 work/10
- 选择模式浮层：底部红色删除按钮，禁用时灰色不可点
- 排序：按日期近→远或远→近，保持未完成优先；切换按钮带方向图标
- AI 拆解：
  - 按钮点击或 Ctrl+Enter 触发
  - 返回子任务逐条生成 Task，estimatedPomodoros 默认 1，dueDate 继承输入区日期值
  - 支持“重试”：删除上次生成的子任务并重新生成
### 6.3 SettingsModal
- 模态层：白玻璃或深灰玻璃，圆角 3xl，阴影 2xl
- 设置项：
  - 计时器时长（滑杆）：
    - WORK：1–90
    - SHORT_BREAK：1–30
    - LONG_BREAK：5–60
  - 语言：中文/English 二选一
  - 助理身份与名字：文本框
  - 保存按钮：整宽，深色按钮（text 白）
- 同步逻辑：保存后更新 App 状态与 localStorage，并在非运行状态下重置当前模式剩余时间

## 7. 交互与业务流程
- 主题切换：点击右上月亮/太阳按钮切换；html.class 加/减 'dark'
- 模式切换：
  - 手动：点击 segmented 控件切换模式，并设置 timeLeft=对应时长*60、isActive=false
  - 自动：
    - WORK 完成后：completedWorkSessions +1；若达到 4，切到 LONG_BREAK 并归零计数；否则切到 SHORT_BREAK
    - BREAK 完成后：切回 WORK
- 计时控制：
  - Play/Pause：切换 isActive；启动时播放水晶提示音（WebAudio 合成）
  - Reset：重置当前模式时间、停止计时
- 完成提示：
  - 顶部弹出通知卡（8s 自动消隐），显示提醒文案
  - 同时使用 SpeechSynthesis 朗读（依据语言、assistantName、assistantRole 拼接）
- 任务操作：
  - 添加：Enter 提交
  - 完成切换：点击左侧圆形按钮
  - 编辑：点击标题进入编辑态（标题、日期、番茄估算）
  - 拖拽排序：DndKit 竖向列表
  - 批量选择/删除：进入选择模式后可全选/反选、删除选中
- 引语：
  - 点击引语文本：随机切换
  - Like：标记 isLiked，刷新时保留已喜欢
  - Refresh：触发 AI/本地刷新，保留已喜欢，列表最多 20 条

## 8. AI 集成与降级
- 任务拆解（breakDownTaskWithAI）：
  - 模型：gemini-3-flash-preview
  - 指令：将目标拆解为 3–5 个 25 分钟可执行子任务，限制 10 个词内，输出 JSON（schema：{ tasks: string[] }）
  - 响应解析：优先按 JSON 解析；失败时按行或分隔符拆解（ZH：，。；； EN：,.;）
  - 降级策略：
    - 无 API Key 或错误（含 429）：尝试分隔符拆解；否则使用本地预案（ZH：明确需求/拆分模块/搭建环境/实现核心流程/测试与优化；EN 同义）
    - Provider 日志：AI provider: GEMINI 或 LOCAL（仅控制台）
- 引语刷新（fetchQuoteBatch）：
  - 模型：gemini-3-flash-preview
  - 指令：依据模式与语言返回 7 条 JSON 数组（字符串）
  - 失败或无 Key：返回内置 FALLBACK_QUOTES（按模式与语言预置）
- 429 处理：优先降级 LOCAL；在 UI 保持功能无阻断

## 9. 文案与多语言
- 语言切换：中文（默认）与英文
- 关键文案集合（示例）：
  - 模式名称：专注/短休/长休；Focusing/Short Break/Long Break
  - 引语卡片操作：喜欢/刷新；Like/Refresh
  - 输入占位：添加新任务…；Add a new task…
  - AI 拆解按钮：AI 拆解 (Ctrl+Enter)；AI Breakdown (Ctrl+Enter)
  - 排序：按日期，从近到远/从远到近；Sort by Date, Soonest/Furthest
  - 设置标题：计时器设置；Settings
  - 保存按钮：保存设置；Save Changes
  - 通知文案（朗读+toast）：
    - 完成专注：专注结束啦，休息一下吧；Focus session completed!
    - 短休结束：短休结束啦，开始专注吧；Short break ended!
    - 长休结束：长休结束啦，精力充沛！；Long break ended!

## 10. 状态持久化
- localStorage：
  - 主题、语言、助理信息、引语缓存、计时器设置
  - 计时器运行状态（isActive）不持久化；刷新后重置
- 引语缓存更新：
  - 刷新时保留 isLiked=true 的项；合并新数据后截断至 20 条

## 11. 无障碍与可访问性
- 按键：
  - Ctrl+Enter 触发 AI 拆解
  - Enter 在日期输入框提交新增任务
- 颜色对比：浅深主题下主要文字与按钮具备足够对比度
- 动效：脉冲、弹跳不应影响操作；加载有旋转反馈

## 12. 性能与鲁棒性
- 轻量动画与阴影，避免大规模重绘
- 计时器使用 setInterval 每秒递减；结束时集中处理模式切换与提示
- AI 错误对用户无阻断；控制台记录并自动降级

## 13. 异常与边界
- 无 API Key 或额度耗尽（429）：自动降级为本地规则与预置引语
- JSON 解析失败：回退为行/分隔符拆解或预案
- 朗读不可用：静默捕获，不影响通知卡片显示
- 日期格式：要求 YYYY-MM-DD；无日期时显示“未设置/None”
- 番茄估算：最小 1；编辑/快捷操作均做边界保护

## 14. 验收标准（1:1 复刻）
- 布局与外观：
  - 背景渐变位置、透明度、过渡一致；深浅色切换一致
  - 颜色规范严格使用 morandi 设定值；组件阴影类型一致
  - 字体与字号：标题、正文、徽标、时间数值完全一致
  - 图标样式与尺寸：Header SVG、按钮图标与交互态一致
- 交互与行为：
  - 计时器：模式切换（手动/自动）、提示音、朗读与通知卡片一致
  - 任务列表：拖拽、编辑、选择/批量删除、日期与番茄估算一致
  - AI：拆解与引语刷新在有 Key 时走 GEMINI；失败自动降级 LOCAL
  - 引语缓存策略：保留 Like、合并刷新、最多 20 条一致
- 持久化：所有指定键与行为一致（含主题/语言/助理信息/设置/引语）
- 文案：中英文切换后所有文案均与规范一致
- 运行：npm run dev 启动于 3000 端口；无关键报错，HMR 正常

## 15. 开发者附录（实现提示）
- index.html：
  - 引入 tailwind CDN 与字体；设置 tailwind.config（见视觉规范）与 body 背景样式
  - 设置 .date-input-overlay 用于日期控件透明覆盖
- 组件与状态：
  - App 负责主题/语言/计时器/通知/引语缓存/任务集合等
  - CircularTimer 渲染进度环与时间文本
  - TaskList 管理输入、AI 拆解、列表项、拖拽与选择模式
  - SettingsModal 管理设置与语言/助理信息保存
- AI：
  - 使用 @google/genai GoogleGenAI({ apiKey })
  - 模型名：gemini-3-flash-preview；JSON 响应 schema 见上
  - 429 或异常时降级本地（不阻断 UI）

