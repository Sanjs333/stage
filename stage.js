(function () {
  "use strict";

  const STORAGE_KEY = "miniStage_data";
  const PANEL_ID = "mini-stage-panel";
  const STYLE_ID = "mini-stage-styles";
  const GROUP_COLORS = [
    "#D6A2A2",
    "#DDAA90",
    "#D1C28D",
    "#A1BC9D",
    "#91B9B5",
    "#9FB1CD",
    "#B0ABCC",
    "#BFA3C4",
    "#CE9EA8",
    "#C49696",
    "#C7A287",
    "#C4B981",
    "#b5b06b",
    "#7ca881",
    "#6b9ea0",
    "#748eb5",
    "#9280ab",
    "#b57e97",
    "#8b5b8c",
  ];
  const TAG_COLORS = [
    "#D6A2A2",
    "#DDAA90",
    "#D1C28D",
    "#A1BC9D",
    "#91B9B5",
    "#9FB1CD",
    "#B0ABCC",
    "#BFA3C4",
    "#CE9EA8",
    "#C49696",
    "#C7A287",
    "#C4B981",
    "#b5b06b",
    "#7ca881",
    "#6b9ea0",
    "#748eb5",
    "#9280ab",
    "#b57e97",
    "#8b5b8c",
  ];
  var GUIDE_VERSION = 2.9;
  var BUILTIN_GUIDE_CONTENT = [
    "# 小剧场 使用说明",
    "",
    "## 基本概念",
    "- **剧场**：一条提示词/文本内容，是最小单位",
    '- **分组**：将相关剧场归类在一起（如"日常互动"、"战斗场景"、或作者分组）',
    "- **系列**：同一分组内，同系列的剧场会自动聚合折叠显示",
    "- **标签**：跨分组的分类标记，一条剧场可以有多个标签",
    "- **快捷短语**：编辑时可以快速插入的常用文本片段",
    "",
    "---",
    "",
    "## 打开方式",
    "点击酒馆扩展菜单（三横线→扩展）中的「小剧场」按钮打开面板。",
    "",
    "## 面板操作",
    "- **拖拽标题栏**：移动面板位置",
    "- **双击标题栏**：重置面板到默认位置",
    "- **最小化按钮（−）**：收起面板只留标题栏",
    "- **关闭按钮（×）**：关闭面板",
    "- **拖拽 .json 文件到面板上**：快速导入",
    "",
    "---",
    "",
    "## 主界面",
    "",
    "### 列表页",
    "- 显示收藏、最近使用、各分组入口",
    "- 顶部搜索框可以搜索标题、内容、作者、系列名",
    "- 点击漏斗图标可按标签/分组筛选",
    "- 标签筛选支持「任一匹配」和「全部匹配」两种模式，点击筛选面板中的按钮切换",
    "- 点击排序图标可切换多种排序方式",
    "- 点击骰子图标可随机抽取一条剧场",
    "",
    "### 分组页",
    "- 同系列的剧场会自动折叠成一个组",
    "- 点击系列标题展开/收起",
    "- 长按分组入口可直接进入分组编辑",
    "",
    "### 卡片操作",
    "- **点击卡片**：进入预览",
    "- **长按卡片**：进入多选模式",
    "- **点击星星**：收藏/取消收藏",
    "- **填入按钮**：将内容填入输入框",
    "- **发送按钮**：直接发送并触发AI生成",
    "",
    "---",
    "",
    "## 多选模式",
    "进入多选模式后（长按卡片或点击工具栏的✓✓ 按钮）：",
    "- 底栏出现批量操作按钮",
    "- **全选/取消**：选中当前可见的所有剧场",
    "- **移动**：批量移动到其他分组",
    "- **标签**：批量添加/移除标签",
    "- **作者**：批量设置作者",
    "- **系列**：批量添加/移除/设置系列名",
    "- **导出**：导出选中的剧场",
    "- **删除**：批量删除",
    "",
    "系列组左边会出现复选框，可以一键选中整个系列。",
    "",
    "---",
    "",
    "## 预览页",
    "- 支持 Markdown 渲染（粗体、斜体、标题、列表、代码块、表格、任务列表等）",
    "- 任务列表的勾选框可以直接点击切换",
    "- **填入输入框**：将内容填入 SillyTavern 的输入框",
    "- **发送并生成**：填入并自动触发 AI 生成回复",
    "- 上下箭头可在当前列表的条目间切换浏览",
    "",
    "---",
    "",
    "## 编辑器",
    "",
    "### Markdown 工具栏",
    "提供粗体、斜体、删除线、标题（多次点击切换1~6级）、引用、列表、任务列表、代码、链接、图片、分割线、表格等快捷按钮。",
    "",
    "### 快捷短语",
    "点击闪电图标弹出快捷短语面板，点击即可在光标处插入。",
    "",
    "### 查找替换",
    "- 点击放大镜或按 `Ctrl+F` 打开",
    "- 支持查找、上/下一个、替换当前、全部替换",
    "- `Enter` 跳到下一个，`Shift+Enter` 跳到上一个",
    "",
    "### 回到顶部",
    "编辑区域滚动超过一定距离后，右下角会出现回顶按钮，预览模式下同样可用。",
    "",
    "### 专注模式",
    "点击展开图标进入专注模式，面板放大到全屏只显示编辑区域，适合长文编辑。",
    "",
    "### Shift选择（移动端）",
    "移动端没有物理 Shift 键，点击方向十字图标激活 Shift 模式，再点击文本另一位置即可选中一段文字。",
    "",
    "### 快捷键",
    "- `Ctrl+S`：保存",
    "- `Ctrl+Z`：撤销",
    "- `Ctrl+Y` / `Ctrl+Shift+Z`：重做",
    "- `Ctrl+F`：打开查找",
    "- `Esc`：返回上一页/ 关闭面板",
    "- 删除本轮按钮：点击后删除聊天记录中最后两条消息（如果只剩一条则删除该条），方便编辑小剧场时测试效果。",
    "",
    "---",
    "",
    "## 版本历史",
    "- 每次保存编辑时，自动保存上一版到历史（最多保留5 条）",
    "- 可以查看历史版本、回退、或进行版本对比",
    "- 版本对比页面用颜色标记新增行和删除行",
    "- 版本历史超过一定数量时会在底栏和打开面板时给出提醒，可在设置中关闭",
    "",
    "---",
    "",
    "## 导入导出",
    "",
    "### 导出",
    "- 支持导出全部、按分组导出、批量选择导出、单条导出",
    "- 可选是否包含分组信息、标签信息、版本历史",
    "- 导出为 `.json` 文件",
    "",
    "### 导入",
    "- 支持三种模式：",
    "  - **合并更新（推荐）**：智能去重，新增添加，修改过的更新，相同的跳过",
    "  - **全部追加**：不检查直接全部添加",
    "  - **覆盖替换**：清空现有数据，完全替换",
    "- 可选是否导入分组/标签",
    "- 不导入分组时可以指定放入哪个分组",
    "",
    "---",
    "",
    "## 分组管理",
    "- 可以新建、重命名、删除、调整顺序",
    "- 每个分组可以设置颜色（预设色或自定义色，分组管理页面点击颜色圆圈）",
    "- 可以设置分组备注和默认作者",
    "- 支持多选批量删除",
    "",
    "## 标签管理",
    "- 可以新建、重命名、删除、调整顺序",
    "- 每个标签可以设置颜色",
    "- 支持多选批量删除",
    "",
    "---",
    "",
    "## 使用统计",
    "在设置页面点击「使用统计」查看：",
    "- 总剧场数、总使用次数、收藏数、平均使用次数",
    "- 分组分布柱状图",
    "- 最常使用 TOP 5",
    "- 最近使用记录",
    "",
    "## 设置",
    "- **默认作者**：新建剧场时自动填入的作者名",
    "- **自动检查间隔**：打开面板时，超过设定时间未检查的订阅会自动静默检查（默认6小时，设为0关闭）",
    "- **快捷短语管理**：管理编辑器里可快速插入的文本片段",
    "- **历史提醒开关**：可设置底栏是否在历史超过30条时变红提醒",
    "- **查看历史记录**：快速查看哪些剧场有版本历史，支持单条清空",
    "- **清空版本历史**：一键清空所有剧场的版本历史",
    "- **重置使用统计**：归零所有使用次数和最近使用时间",

    "",
    "---",
    "",
    "## 订阅功能",
    "",
    "### 什么是订阅？",
    "订阅让你可以通过一个链接持续接收其他创作者分享的剧场合集。创作者更新了内容后，你只需点击「检查更新」就能自动获取最新内容，不需要反复手动下载和导入文件。",
    "",
    "### 如何添加订阅",
    "1. 获取创作者分享的 JSON 文件链接",
    "2. 打开小剧场面板",
    "3. 底栏点击「订阅」，或进入 设置 → 订阅管理",
    "4. 点击右上角 **+** 按钮",
    "5. 填写订阅名称（随便起，方便你自己辨认）",
    "6. 粘贴 JSON 链接",
    "7. 根据需要调整导入选项：",
    "   - **导入分组信息**：是否保留创作者的分组结构",
    "   - **导入标签信息**：是否保留创作者设置的标签",
    "   - **放入分组**：不导入分组信息时，可以指定把订阅内容放入哪个分组",
    "   - **允许更新已有内容**：开启后，创作者修改过的内容会自动同步到你本地；关闭则只接收新增内容，不会覆盖你自己的修改",
    "8. 点击「添加并检查」，会立即验证链接并导入内容",
    "",
    "### 管理已有订阅",
    "在订阅列表中点击某个订阅可以：",
    "- 修改名称、链接、导入选项",
    "- 点击「检查更新」手动同步最新内容",
    "- 查看历史更新记录（每次同步的新增/更新/跳过数量）",
    "- 删除订阅（已经导入的剧场不会被删除）",
    "",
    "在订阅列表底部点击「全部检查更新」可以一次性检查所有订阅。",
    "",
    "### 自动检查",
    "打开面板时，如果有订阅超过设定时间（默认6小时）未检查过，会自动在后台静默检查。有更新才会弹提示，没更新完全无感。可以在设置中调整间隔或关闭。",
    "",
    "### 订阅的同步逻辑",
    "订阅使用与「合并更新」相同的智能同步逻辑：",
    "- **新内容**：自动添加",
    "- **已修改的内容**：如果开启了「允许更新已有内容」，会自动更新",
    "- **完全相同的内容**：自动跳过，不重复添加",
    "- **你自己的本地修改**：不会被覆盖（除非内容指纹匹配到同一条）",
    "",
    "### 更新提醒",
    "当订阅检查到有新更新时，主页底栏的「订阅」按钮旁会出现一个闪烁的小圆点提醒。进入订阅管理页面后提醒自动消失。",
    "",
    "---",
    "",
    "## 创作者订阅教程",
    "",
    "如果你想让别人能订阅你的剧场，只需要三步：导出 → 上传 → 分享链接。",
    "",
    "### 第一步：导出你的剧场",
    "1. 在小剧场中选择要分享的内容（可以按分组导出，也可以批量选择）",
    "2. 导出时建议勾选「包含分组信息」和「包含标签信息」",
    "3. 得到一个 `.json` 文件",
    "",
    "### 第二步：上传到文件托管",
    "你需要把 JSON 文件放到一个能通过链接直接访问的地方。推荐使用 **GitHub**（免费、稳定、方便更新）。",
    "",
    "#### 方式一：GitHub公开仓库",
    "1. 注册/登录 [GitHub](https://github.com)",
    "2. 点击右上角 **+** → **New repository**（新建仓库）",
    "3. 填写仓库名（如 `my-mini-stage`），选Public公开",
    "4. 点击 **Create repository**",
    "5. 在仓库页面点击 **Add file** → **Upload files**",
    "6. 把你的 `.json` 文件拖进去，点击 **Commit changes**",
    "7. 点击上传好的文件名打开它",
    "8. 点击右上角的 **Raw** 按钮",
    "9. 复制浏览器地址栏的链接，这就是你的订阅链接！",
    "",
    "链接格式：`https://raw.githubusercontent.com/你的用户名/仓库名/main/文件名.json`",
    "",
    "**国内加速（可选）**：可以把链接转成 jsDelivr CDN 格式，国内访问更快：",
    "`https://cdn.jsdelivr.net/gh/用户名/仓库名@main/文件名.json`",
    "",
    "> jsDelivr 有缓存，更新文件后可能需要等一段时间才能生效。如果需要立即生效，请使用 GitHub Raw 链接。",
    "",
    "#### 方式二：Secret Gist（不想公开内容时推荐）",
    "1. 打开 [gist.github.com](https://gist.github.com)",
    "2. 文件名填 `my-stage.json`（英文即可）",
    "3. 粘贴你导出的 JSON 文件全部内容",
    "4. 点击 **Create secret gist**（不是 public！）",
    "5. 点击右上角 **Raw** 按钮，复制地址栏链接",
    "",
    "> **注意**：复制到的原始链接中包含 commit hash（一串随机字符），每次编辑 Gist 后这段 hash 都会变化，导致旧链接失效。分享时请去掉 commit hash 部分",
    "> - 原始链接：`https://gist.githubusercontent.com/用户名/xxxxx/raw/0338784d09d734dfac0d3f741b736c3710c06ff6/my-stage.json`",
    "> - 分享链接：`https://gist.githubusercontent.com/用户名/xxxxx/raw/my-stage.json`",
    "> 去掉中间那段 hash 后，链接始终指向最新版本，更新 Gist 内容后无需重新分享链接。",
    "",
    "Secret Gist 不会出现在搜索结果中，只有知道链接的人才能访问，不需要任何认证。更新时直接编辑 Gist 内容保存即可。",
    "> **关于更新延迟**：GitHub Raw 与 Gist Raw 均有约 5 分钟的服务端缓存，更新内容后需等待 5 分钟即可同步。",
    "",
    "> 以下为上传使用教程",
    "![Secret Gist示例1](https://i.postimg.cc/Fs5YMcCH/ju-chang-shuo-ming1.png)",
    "![Secret Gist示例2](https://i.postimg.cc/rFXDBWZF/ju-chang-shuo-ming2.png)",
    "![Secret Gist示例3](https://i.postimg.cc/rp7JjbCp/IMG-20260325-215620.png)",
    "#### 其他托管方式",
    "任何能提供直接文件访问链接的服务都可以：Gitee（国内）、自己的服务器、Cloudflare R2 等。",
    "",
    "### 第三步：分享链接",
    "把链接分享给别人，别人在小剧场里添加订阅 → 粘贴你的链接 → 就能接收你的内容。",
    "",
    "### 如何更新内容",
    "1. 重新导出最新的 JSON 文件",
    "2. 在GitHub仓库中覆盖上传原来的文件（或编辑 Gist粘贴新内容）",
    "3. 提交保存",
    "4. 订阅者点击「检查更新」就能获取你的最新内容",
    "",
    "### 创作者小贴士",
    "- 给分组设置「默认作者」，新建剧场自动带上署名",
    "- 善用分组和系列功能，让合集结构清晰",
    "- 导出时包含分组和标签，订阅者体验更好",
    "- 更新后在社区通知一声，提醒大家检查更新",
    "- 上传到托管的文件名建议用英文或拼音",
    "",
    "---",
    "",
    "## 数据存储",
    "所有数据保存在 SillyTavern 的扩展设置中，跟随酒馆数据一起备份和恢复。建议定期通过导出功能备份数据。",
    "",
    "",
    "## 重要提示",
    "请定期清理版本历史，避免数据膨胀。",
  ].join("\n");

  var BUILTIN_INJECT_GUIDE_CONTENT = [
    "# 小剧场 · 注入功能指南",
    "## 一、什么是注入？",
    "注入是小剧场的核心功能之一。它允许你在发送消息给 AI 时，自动将选中的剧场内容插入到 AI 的提示词（Prompt）中。",
    "你在小剧场里选好一段内容,下次发送消息时，这段内容会自动塞进提示词中，引导AI输出完成指令。",
    "**注入 ≠ 发送：**",
    "- **发送**（填入输入框/发送并生成）：内容作为**用户消息**出现在聊天记录中",
    "- **注入**：内容作为**隐藏指令**插入到提示词中，不会出现在聊天记录里，但 AI 能看到，会随正文一起输出小剧场，**但可能会影响模型注意力，有概率降低模型正文质量**",
    "",
    "**适用场景：**",
    "- 让 AI 在回复末尾输出一段特定格式的小剧场",
    "- 给 AI 临时追加人设补充、场景描述、行为指令",
    "- 随机触发事件或彩蛋",
    "- 不想污染聊天记录，但又需要传达特定指令",
    "",
    "##二、启用注入功能",
    "### 开启步骤",
    "1. 打开小剧场面板",
    "2. 点击底栏「设置」",
    "3. 找到「注入设置」区域",
    "4. 打开「启用注入功能」开关",
    "### 开启后",
    "- 预览页面底部会多出一个「选为注入」按钮",
    "- 标题栏会显示注入状态指示器（小注射器图标 💉）",
    "- 被选中注入的剧场卡片/分组/系列左侧会有高亮标记",
    "",
    "## 三、注入模式详解",
    "小剧场提供两种注入模式，在设置中切换：",
    "",
    "### 1. 深度注入（将内容插入到聊天历史的指定深度）",
    "**深度值（Depth）：**",
    "| 深度 | 含义 |",
    "|------|------|----------|",
    "| 0 | 在聊天记录（chat history)最后，用户最新输入下 |",
    "| 1 | 聊天记录倒数第二条消息之后 |",
    "| 2+ | 越大越靠前，以此类推|",
    "",
    "**消息角色（Role）：**",
    "| 角色 | 说明 | 建议 |",
    "|------|------|------|",
    "| System | 系统指令身份 | 最常用，稳定可靠 |",
    "| User | 模拟用户消息 | 某些模型对用户消息响应更好 |",
    "| Assistant | 模拟助手回复 | 可用于引导特定输出格式 |",
    "",
    "### 2. 自定义宏模式（通过`{{stage_prompt}}`宏来手动控制插入位置）",
    "",
    "**使用方式：**",
    "在预设提示词小剧场条目区域内单独启用一条放置宏",
    "",
    "**优点：** 位置完全自定义，可以放在预设的任意位置",
    "**注意：**",
    "- 需要手动编辑预设来放置宏",
    "- 没有选中剧场时宏会替换为空字符串",
    "",
    "- 注入示例：",
    "![alt](https://i.postimg.cc/D0Vjnh7K/zhu-ru-shi-li.png)",
    "",
    "## 四、前缀指令模板",
    "前缀指令是包裹在剧场内容外面的说明书，告诉 AI 该如何处理剧场内容。",
    "",
    "### 默认前缀指令",
    "系统自带一个默认模板，在「设置 → 注入设置 → 默认前缀指令」中查看和修改。",
    "",
    "默认模板示例说明：",
    "```",
    "<stage>",
    "在正文最后输出以下剧场内容，使用以下html折叠包裹。",
    "<details>",
    "<summary>小剧场 {{random::1::2::3::4::5::6::7::8::9::10}}| {{stage_title}}</summary>",
    "在此处输出剧场内容，纯文字直接输出，网页代码上下需用代码块包裹",
    "</details>",
    "",
    "以下是需要输出的剧场内容：",
    "{{stage}}",
    "</stage>",
    "```",
    "#### 注意事项",
    "- **{{random::1::2::3::4::5::6::7::8::9::10}}为酒馆的随机数宏，用这个是为了实现折叠头随机美化效果，若无需求可删除**",
    "",
    "### 可用宏变量",
    "| 宏 | 说明 | 何时可用 |",
    "|-----|------|----------|",
    "| `{{stage}}` | 剧场原始内容（纯文本） | 前缀模板内 / 宏模式 |",
    "| `{{stage_title}}` | 当前剧场的标题 | 前缀模板内 / 宏模式 |",
    "| `{{stage_count}}` | 选中的剧场总数 | 多条外壳模板内 |",
    "| `{{stage_tasks}}` | 所有任务块的拼接体 | 多条外壳模板内 |",
    "| `{{stage_prompt}}` | 前缀指令+剧场内容的完整注入体 | 宏模式 |",
    "",
    "### `{{stage}}` 的插入逻辑",
    "- 如果前缀中**包含** `{{stage}}`：剧场内容会精确替换到 `{{stage}}` 所在位置",
    "- 如果前缀中**没有** `{{stage}}`：剧场内容自动拼接在前缀的后面（换行分隔）",
    "- 如果**没有设置前缀**：只发送剧场原始内容",
    "",
    "### 分组专属前缀",
    "每个分组可以在「分组设置 → 注入前缀指令」中设置自己的前缀。",
    "- 优先级：分组前缀 > 全局默认前缀 > 无前缀",
    "- 不同类型的剧场可以设置不同的输出格式",
    "- 根据自己**小剧场属性**编辑默认前缀，固定前缀格式可搭配**不发送剧场正则**使用。",
    "> 例如：此预设剧场格式为</stage>……</stage>**，通过此前缀，你可以很方便的指定AI按照此固定格式输出，而不用修改每条剧场指令。**",
    "> **不同作者可能存在不同格式要求，所以分组设置内也支持自定义该分组的默认前缀。发送不同分组剧场时则根据设定发送不同前缀，自动适配多样情况。**",
    "",
    "## 五、多条注入",
    "",
    "### 选择多条剧场",
    "在预览页面点击「选为注入」可以叠加选择多条剧场：",
    "- 第一次点击：选中，按钮变为「取消注入」",
    "- 按钮会显示当前已选数量，如「选为注入(+2)」",
    "- 已选中的再点击：取消该条的选中",
    "",
    "### 多条外壳模板",
    "**当选中 2 条以上剧场时，系统使用「多条外壳模板」来组织结构。**",
    "在「设置 → 注入设置 → 多条外壳模板」中可自定义。",
    "",
    "默认模板：",
    "```",
    "<stage>",
    "以下共有 {{stage_count}} 个独立小剧场任务，请在正文最后按顺序逐一完成，每条剧场单独使用对应格式包裹。",
    "",
    "{{stage_tasks}}",
    "</stage>",
    "```",
    "",
    "### 多条处理逻辑",
    "1. 每条剧场单独应用各自的前缀指令（分组前缀或默认前缀）",
    "2. 前缀最外层的 XML 标签会被自动剥离（避免嵌套标签冲突）",
    "3. 每条剧场自动编号：【任务1】、【任务2】...",
    "4. 所有任务之间用分割线 `---` 分隔",
    "5. 整体用多条外壳模板包裹",
    "",
    "### ⚠️ 重要注意",
    "- 多条外壳模板中**必须**包含 `{{stage_tasks}}`",
    "- 如果模板缺少 `{{stage_tasks}}`，系统会自动回退到内置默认模板",
    "- 只有选中 1 条时使用单条前缀逻辑，2 条及以上才使用多条外壳",
    "- 灵活使用左下角拓展菜单内的“查看提示词情况”可直观查看指令详细内容",
    "",
    "## 六、随机注入",
    "",
    "### 功能说明",
    "当你没有手动选中任何剧场时，系统可以自动从「随机池」中随机抽取一条进行注入，每次 AI 生成请求都会重新随机抽取。",
    "",
    "### 开启方式",
    "设置 → 注入设置 → 随机注入 → 打开开关",
    "",
    "### 优先级规则",
    "手动选择 > 随机注入",
    "| 状态 | 行为 |",
    "|------|------|",
    "| 手动选中了剧场 | 使用手动选中的，使用后自动清除选中状态 |",
    "| 没有手动选中 + 随机注入开启 | 从随机池随机抽取一条 |",
    "| 没有手动选中 + 随机注入关闭 | 不注入任何内容 |",
    "",
    "### 随机池管理",
    "点击「管理随机池」可以精细控制哪些剧场参与随机：",
    "",
    "- **整组排除**：取消勾选分组的复选框 → 该分组所有剧场不参与随机",
    "- **整系列排除**：取消勾选系列的复选框 → 该系列所有剧场不参与随机",
    "- **单条排除**：取消勾选某条剧场的复选框 → 该条不参与随机",
    "- **全选/全不选**：顶部按钮快速切换",
    "- **搜索/标签筛选**：可通过搜索和标签快速定位要排除的内容",
    "",
    "### 排除的层级关系",
    "分组排除 > 系列排除 > 单条排除",
    "- 排除了分组后，该分组内的系列和单条排除设置会被禁用（灰显）",
    "- 排除了系列后，该系列内的单条排除设置会被禁用",
    "",
    "## 七、注入状态指示",
    "",
    "### 标题栏指示器",
    "| 图标 | 含义 |",
    "|------|------|",
    "| 💉 + 剧场标题 | 手动选中了 1 条剧场 |",
    '| 💉 + "已选 N 条" | 手动选中了多条剧场 |',
    '| 🎲 + "随机 N 条" | 随机注入开启，显示随机池条目数 |',
    "| 无显示 | 注入功能关闭 / 没有选中内容 |",
    "",
    "### 卡片高亮",
    "被选中注入的剧场在列表中有特殊样式：",
    "- 卡片左侧有彩色边框，背景有浅色高亮",
    "- 如果在系列中，整个系列头部也会高亮。如果在分组中，分组入口也会高亮。",
    "",
    "### 点击指示器跳转",
    "- 点击标题栏的注入指示器可以快速跳转到对应剧场的预览页",
    "- 如果选中了多条，每次点击会按顺序轮流跳转到不同的剧场",
    "- 如果面板处于收起状态，点击后会自动展开面板",
    "",
    "## 八、使用技巧与注意事项",
    "- 注入内容会占用上下文窗口的空间，建议剧场指令内容与数量控制在合理长度内",
    "- 多条注入会显著影响AI输出注意力，并增加输出 token 消耗，按需选择",
  ].join("\n");

  var BUILTIN_PREVIEW_CONTENT = [
    "```",
    "你好，这是一个预览页支持的格式示例",
    "```",
    "`你好`",
    "**测试**",
    "~~测试~~",
    "> 测试",
    "- 测试",
    '"测试"',
    "\u201c测试\u201d",
    "**表格**",
    "| 列1 | 列2 |",
    "|-----|-----|",
    "| 内容 | 内容 |",
    "",
    "**任务列表**",
    "- [x] 已完成",
    "- [ ] 未完成",
    "**链接与图片**",
    "- [文字](url) →链接",
    "- ![alt](https://i.ibb.co/Fv66fS0/image.png) → 图片，只支持图床链接",
    "",
    "# 一",
    "## 二",
    "### 三",
    "#### 四",
    "##### 五",
    "###### 六",
    "",
    "**嵌套折叠 (支持原生 HTML)**",
    "<details><summary>点击展开外层</summary>",
    "这里是外层的内容，可以包含文字。",
    "  <details><summary>点击展开内层</summary>",
    "  这里是嵌套的内层内容！",
    "  </details>",
    "</details>",
    "",
    "---",
  ].join("\n");

  let data = {
    groups: [],
    prompts: [],
    settings: {
      collapsed: false,
      panelPos: null,
      sortMode: "created-desc",
      defaultAuthor: "",
      definedTags: [],
    },
    quickPhrases: [],
    subscriptions: [],
  };
  let viewStack = [{ name: "list" }];
  let searchQuery = "";
  let filterState = { tags: [], groupId: null };
  let panelVisible = false;
  let selectMode = false;
  let selectedIds = new Set();
  let shiftKeyActive = false;
  let shiftAnchor = -1;
  let groupSelectMode = false,
    selectedGroupIds = new Set();
  let tagSelectMode = false,
    selectedTagIds = new Set();
  let editDirty = false;
  let editSnapshot = "";
  let activeDropdownCleanup = null;
  let longPressTimer = null;
  let longPressTriggered = false;
  let escKeyHandler = null;
  let _currentStagePrompt = null;
  let _injectIndicatorIdx = 0;
  let _currentStagePrompts = [];
  let _skipAllInjectForNextGeneration = false;
  let _skipNextInjectPromptIds = [];
  let _pendingClearStageSelectedIds = [];
  let _macroInjectBusy = false;
  let _macroBusyWarned = false;

  function esc(s) {
    if (!s) return "";
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function truncate(s, n) {
    return !s ? "" : s.length > n ? s.substring(0, n) + "..." : s;
  }
  function getContextSnippet(text, query, maxLen) {
    if (!text || !query) return truncate(text, maxLen);
    var lowerText = text.toLowerCase();
    var lowerQuery = query.toLowerCase();
    var idx = lowerText.indexOf(lowerQuery);
    if (idx < 0) return truncate(text, maxLen);
    var padding = Math.floor((maxLen - query.length) / 2);
    var start = Math.max(0, idx - padding);
    var end = Math.min(text.length, start + maxLen);
    if (end - start < maxLen) start = Math.max(0, end - maxLen);
    var snippet = text.substring(start, end);
    var prefix = start > 0 ? "..." : "";
    var suffix = end < text.length ? "..." : "";
    return prefix + snippet + suffix;
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
  function toast(type, msg) {
    if (typeof toastr !== "undefined" && toastr[type])
      toastr[type](msg, "小剧场");
    else console.log("[小剧场]", type, msg);
  }
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  }
  function contentFingerprint(p) {
    var raw = (p.title || "") + "||" + (p.content || "");
    var h1 = simpleHash(raw);
    var h2 = simpleHash(raw.split("").reverse().join(""));
    return h1 + "_" + h2 + "_" + raw.length;
  }
  function computeLineDiff(oldText, newText) {
    var oldLines = (oldText || "").split("\n");
    var newLines = (newText || "").split("\n");
    var m = oldLines.length,
      n = newLines.length;
    if (m + n > 1000) {
      var result = [];
      var maxLen = Math.max(m, n);
      for (var i = 0; i < maxLen; i++) {
        if (i >= m) result.push({ type: "add", text: newLines[i] });
        else if (i >= n) result.push({ type: "del", text: oldLines[i] });
        else if (oldLines[i] === newLines[i])
          result.push({ type: "same", text: oldLines[i] });
        else {
          result.push({ type: "del", text: oldLines[i] });
          result.push({ type: "add", text: newLines[i] });
        }
      }
      return result;
    }
    var dp = [];
    for (var i2 = 0; i2 <= m; i2++) {
      dp[i2] = new Array(n + 1).fill(0);
    }
    for (var i3 = 1; i3 <= m; i3++) {
      for (var j = 1; j <= n; j++) {
        if (oldLines[i3 - 1] === newLines[j - 1])
          dp[i3][j] = dp[i3 - 1][j - 1] + 1;
        else dp[i3][j] = Math.max(dp[i3 - 1][j], dp[i3][j - 1]);
      }
    }
    var result2 = [];
    var ii = m,
      jj = n;
    while (ii > 0 || jj > 0) {
      if (ii > 0 && jj > 0 && oldLines[ii - 1] === newLines[jj - 1]) {
        result2.unshift({ type: "same", text: oldLines[ii - 1] });
        ii--;
        jj--;
      } else if (jj > 0 && (ii === 0 || dp[ii][jj - 1] >= dp[ii - 1][jj])) {
        result2.unshift({ type: "add", text: newLines[jj - 1] });
        jj--;
      } else {
        result2.unshift({ type: "del", text: oldLines[ii - 1] });
        ii--;
      }
    }
    return result2;
  }
  function formatTimestamp() {
    const d = new Date();
    return (
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function sanitizeFilename(s) {
    return (s || "untitled").replace(/[\\/:*?"<>|]/g, "_").substring(0, 60);
  }
  function formatDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return (
      d.getFullYear() +
      "/" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "/" +
      String(d.getDate()).padStart(2, "0") +
      " " +
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0")
    );
  }

  function copyToClipboard(text) {
    try {
      if (typeof builtin !== "undefined" && builtin.copyText) {
        builtin.copyText(text);
        return Promise.resolve();
      }
    } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText)
      return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  function syncThemeBackground() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    try {
      let parentDoc = null;
      let parentWin = null;
      try {
        if (window.parent && window.parent.document) {
          parentDoc = window.parent.document;
          parentWin = window.parent;
        }
      } catch (e) {}
      const doc = parentDoc || document;
      const win = parentWin || window;

      const samples = doc.querySelectorAll(".drawer-content");
      let bgImg = "",
        bgSize = "",
        bgPos = "",
        bgRepeat = "",
        bgAttach = "";
      for (const el of samples) {
        const cs = win.getComputedStyle(el);
        if (cs.backgroundImage && cs.backgroundImage !== "none") {
          bgImg = cs.backgroundImage;
          bgSize = cs.backgroundSize || "cover";
          bgPos = cs.backgroundPosition || "center";
          bgRepeat = cs.backgroundRepeat || "no-repeat";
          bgAttach = cs.backgroundAttachment || "fixed";
          break;
        }
      }
      if (bgImg) {
        $p.css({
          "background-image": bgImg,
          "background-size": bgSize,
          "background-position": bgPos,
          "background-repeat": bgRepeat,
          "background-attachment": bgAttach,
        });
      } else {
        $p.css({
          "background-image": "none",
          "background-size": "",
          "background-position": "",
          "background-repeat": "",
          "background-attachment": "",
        });
      }

      let rawColor = "";
      if (parentDoc) {
        const pcs = win.getComputedStyle(parentDoc.documentElement);
        rawColor = pcs.getPropertyValue("--SmartThemeBlurTintColor").trim();
      }
      if (rawColor) {
        const d = document.createElement("div");
        d.style.color = rawColor;
        d.style.display = "none";
        document.body.appendChild(d);
        const parsed = getComputedStyle(d).color;
        document.body.removeChild(d);
        const m = parsed.match(
          /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
        );
        if (m) {
          const r = m[1],
            g = m[2],
            b = m[3],
            a = m[4] !== undefined ? parseFloat(m[4]) : 1;
          const minAlpha = 0.75;
          if (a < minAlpha) {
            $p.css(
              "background-color",
              "rgba(" + r + "," + g + "," + b + "," + minAlpha + ")",
            );
          } else {
            $p[0].style.removeProperty("background-color");
          }
        }
      } else {
        $p[0].style.removeProperty("background-color");
      }
    } catch (e) {}
  }

  function updateAccentColor() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    let raw = "";
    try {
      if (window.parent && window.parent.document) {
        const pcs = getComputedStyle(window.parent.document.documentElement);
        raw =
          pcs.getPropertyValue("--SmartThemeFavColor").trim() ||
          pcs.getPropertyValue("--SmartThemeEmColor").trim();
      }
    } catch (e) {}
    if (!raw) {
      const cs = getComputedStyle(document.documentElement);
      raw =
        cs.getPropertyValue("--SmartThemeFavColor").trim() ||
        cs.getPropertyValue("--SmartThemeEmColor").trim() ||
        "#c9957a";
    }
    $p[0].style.setProperty("--ms-accent", raw);
    const d = document.createElement("div");
    d.style.color = raw;
    d.style.display = "none";
    document.body.appendChild(d);
    const parsed = getComputedStyle(d).color;
    document.body.removeChild(d);
    const m = parsed.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      $p[0].style.setProperty(
        "--ms-accent-rgb",
        m[1] + "," + m[2] + "," + m[3],
      );
    }
  }

  function syncThemeColors() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    try {
      let parentDoc = null;
      let parentWin = null;
      try {
        if (window.parent && window.parent.document) {
          parentDoc = window.parent.document;
          parentWin = window.parent;
        }
      } catch (e) {}
      const doc = parentDoc || document;
      const win = parentWin || window;
      var inputColor = "";
      var selects = doc.querySelectorAll(".drawer-content select");
      for (var i = 0; i < selects.length; i++) {
        var cs = win.getComputedStyle(selects[i]);
        if (cs.color) {
          inputColor = cs.color;
          break;
        }
      }
      if (!inputColor) {
        var textPoles = doc.querySelectorAll(".text_pole");
        for (var j = 0; j < textPoles.length; j++) {
          var cs2 = win.getComputedStyle(textPoles[j]);
          if (cs2.color) {
            inputColor = cs2.color;
            break;
          }
        }
      }
      if (inputColor) {
        $p[0].style.setProperty("--ms-themed-input-color", inputColor);
      }
    } catch (e) {}
  }

  function closeActiveDropdown() {
    const $p = $("#" + PANEL_ID);
    if ($p.length) {
      $p.find("#ms-dropdown").hide();
      $p.css("overflow", "");
    }
    if (activeDropdownCleanup) {
      activeDropdownCleanup();
      activeDropdownCleanup = null;
    }
  }

  function setupOutsideClickClose($p) {
    const handler = function (e) {
      const $dd = $p.find("#ms-dropdown");
      if (!$dd.is(":visible")) return;
      if (
        $(e.target).closest(
          "#ms-dropdown, #ms-btn-sort, [data-batch='move'], [data-batch='tag'], [data-batch='series']",
        ).length
      )
        return;
      closeActiveDropdown();
    };
    setTimeout(() => {
      $p.on("pointerdown.ms-outside", handler);
    }, 50);
    activeDropdownCleanup = function () {
      $p.off("pointerdown.ms-outside", handler);
    };
  }

  function getCtx() {
    try {
      if (typeof SillyTavern !== "undefined") {
        if (SillyTavern.extensionSettings && SillyTavern.saveSettingsDebounced)
          return {
            s: SillyTavern.extensionSettings,
            save: SillyTavern.saveSettingsDebounced,
          };
        if (typeof SillyTavern.getContext === "function") {
          const c = SillyTavern.getContext();
          if (c && c.extensionSettings)
            return { s: c.extensionSettings, save: c.saveSettingsDebounced };
        }
      }
    } catch (e) {}
    return null;
  }

  function loadData() {
    try {
      const ctx = getCtx();
      if (ctx && ctx.s[STORAGE_KEY]) {
        const stored = ctx.s[STORAGE_KEY];
        data.groups = Array.isArray(stored.groups) ? stored.groups : [];
        data.prompts = Array.isArray(stored.prompts) ? stored.prompts : [];
        data.quickPhrases = Array.isArray(stored.quickPhrases)
          ? stored.quickPhrases
          : [];
        data.subscriptions = Array.isArray(stored.subscriptions)
          ? stored.subscriptions
          : [];
        data.settings = { ...data.settings, ...(stored.settings || {}) };
        if (data.settings.autoCheckInterval === undefined)
          data.settings.autoCheckInterval = 6;
        if (data.settings.historyWarnEnabled === undefined)
          data.settings.historyWarnEnabled = true;
        if (data.settings.filterTagMode === undefined)
          data.settings.filterTagMode = "or";
        if (data.settings.subUpdatesPending === undefined)
          data.settings.subUpdatesPending = 0;
        if (data.settings.stageInjectEnabled === undefined)
          data.settings.stageInjectEnabled = false;
        if (!Array.isArray(data.settings.stageSelectedIds))
          data.settings.stageSelectedIds = data.settings.stageSelectedId
            ? [data.settings.stageSelectedId]
            : [];
        delete data.settings.stageSelectedId;
        if (data.settings.stageInjectMode === undefined)
          data.settings.stageInjectMode = "depth";
        if (data.settings.stageInjectDepth === undefined)
          data.settings.stageInjectDepth = 0;
        if (data.settings.stageInjectRole === undefined)
          data.settings.stageInjectRole = "system";
        if (data.settings.panelWasVisible === undefined)
          data.settings.panelWasVisible = false;
        if (data.settings.defaultStagePrefix === undefined)
          data.settings.defaultStagePrefix =
            "<stage>\n在正文最后输出以下剧场内容，使用以下html折叠包裹。\n<details>\n<summary>小剧场 {{random::1::2::3::4::5::6::7::8}}| {{stage_title}}</summary>\n在此处输出剧场内容，纯文字直接输出，网页代码上下需```包裹\n</details>\n\n以下是需要输出的剧场内容：\n{{stage}}\n</stage>";
        if (data.settings.multiStagePrefix === undefined)
          data.settings.multiStagePrefix =
            "<stage>\n以下共有 {{stage_count}} 个独立小剧场任务，请在正文最后按顺序逐一完成，每条剧场单独使用对应格式包裹。\n\n{{stage_tasks}}\n</stage>";
        if (data.settings.randomInject === undefined)
          data.settings.randomInject = {
            enabled: false,
            excludedGroupIds: [],
            excludedSeries: [],
            excludedPromptIds: [],
          };
        if (!Array.isArray(data.settings.definedTags))
          data.settings.definedTags = [];
        data.prompts.forEach((p) => {
          if (!Array.isArray(p.tags)) p.tags = [];
          if (p.author === undefined) p.author = "";
          if (p.pinned === undefined) p.pinned = false;
          if (p.sourceId === undefined) p.sourceId = null;
          if (!p.fingerprint) p.fingerprint = contentFingerprint(p);
          if (p.usageCount === undefined) p.usageCount = 0;
          if (p.updatedAt === undefined) p.updatedAt = p.createdAt || null;
          if (p.series === undefined) p.series = "";
          if (!Array.isArray(p.history)) p.history = [];
        });
        data.groups.forEach((g) => {
          if (g.note === undefined) g.note = "";
          if (g.defaultAuthor === undefined) g.defaultAuthor = "";
          if (g.stagePrefix === undefined) g.stagePrefix = "";
        });
        data.subscriptions.forEach(function (s) {
          if (!Array.isArray(s.updateLog)) s.updateLog = [];
          if (s.updateExisting === undefined) s.updateExisting = true;
          if (s.importGroups === undefined) s.importGroups = true;
          if (s.importTags === undefined) s.importTags = true;
          if (s.targetGroupId === undefined) s.targetGroupId = null;
        });
      }
      if (!data.settings.guideCreated && data.prompts.length === 0) {
        createBuiltinGuide();
        data.settings.guideVersion = GUIDE_VERSION;
        saveData();
      } else if (!data.settings.guideCreated) {
        data.settings.guideCreated = true;
        saveData();
      }
      if (
        data.settings.guideCreated &&
        data.settings.guideVersion !== GUIDE_VERSION
      ) {
        var guideP = data.prompts.find(function (p) {
          return p.id === "_builtin_guide";
        });
        if (guideP) {
          guideP.content = BUILTIN_GUIDE_CONTENT;
          guideP.title = "小剧场 使用说明";
          guideP.updatedAt = Date.now();
          guideP.fingerprint = contentFingerprint(guideP);
        }
        var previewP = data.prompts.find(function (p) {
          return p.id === "_builtin_preview";
        });
        if (previewP) {
          previewP.content = BUILTIN_PREVIEW_CONTENT;
          previewP.title = "预览格式示例";
          previewP.updatedAt = Date.now();
          previewP.fingerprint = contentFingerprint(previewP);
        }
        var injectGuideP = data.prompts.find(function (p) {
          return p.id === "_builtin_inject_guide";
        });
        if (injectGuideP) {
          injectGuideP.content = BUILTIN_INJECT_GUIDE_CONTENT;
          injectGuideP.title = "小剧场 注入功能指南";
          injectGuideP.updatedAt = Date.now();
          injectGuideP.fingerprint = contentFingerprint(injectGuideP);
        } else {
          var _ijgGroup = data.groups.find(function (g) {
            return g.id === "_builtin_guide_group";
          });
          if (_ijgGroup) {
            var _ijgNow = Date.now();
            var _ijgEntry = {
              id: "_builtin_inject_guide",
              title: "小剧场 注入功能指南",
              content: BUILTIN_INJECT_GUIDE_CONTENT,
              groupId: "_builtin_guide_group",
              author: "ssssan_",
              tags: [],
              starred: true,
              pinned: true,
              sourceId: null,
              createdAt: _ijgNow,
              lastUsedAt: null,
              fingerprint: "",
              usageCount: 0,
              updatedAt: _ijgNow,
              series: "",
              history: [],
            };
            _ijgEntry.fingerprint = contentFingerprint(_ijgEntry);
            data.prompts.push(_ijgEntry);
          }
        }
        data.settings.guideVersion = GUIDE_VERSION;
        saveData();
      }

      var builtinGuideIds = [
        "_builtin_guide",
        "_builtin_inject_guide",
        "_builtin_preview",
      ];
      var builtinGuideMap = {};
      data.prompts.forEach(function (p) {
        if (builtinGuideIds.indexOf(p.id) >= 0) {
          builtinGuideMap[p.id] = p;
        }
      });
      var orderedBuiltinGuides = builtinGuideIds
        .map(function (id) {
          return builtinGuideMap[id];
        })
        .filter(Boolean);
      if (orderedBuiltinGuides.length > 0) {
        data.prompts = data.prompts.filter(function (p) {
          return builtinGuideIds.indexOf(p.id) < 0;
        });
        data.prompts = orderedBuiltinGuides.concat(data.prompts);
        saveData();
      }
    } catch (e) {
      console.error("[小剧场] 加载数据失败", e);
    }
  }

  function createBuiltinGuide() {
    data.groups = data.groups.filter(function (g) {
      return g.id !== "_builtin_guide_group";
    });
    data.prompts = data.prompts.filter(function (p) {
      return (
        p.id !== "_builtin_guide" &&
        p.id !== "_builtin_preview" &&
        p.id !== "_builtin_inject_guide"
      );
    });
    var now = Date.now();
    data.groups.unshift({
      id: "_builtin_guide_group",
      name: "使用指南",
      color: "#9FB1CD",
      note: "小剧场使用说明",
      defaultAuthor: "",
    });
    data.prompts.unshift({
      id: "_builtin_preview",
      title: "预览格式示例",
      content: BUILTIN_PREVIEW_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_inject_guide",
      title: "小剧场 注入功能指南",
      content: BUILTIN_INJECT_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now - 1,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now - 1,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_guide",
      title: "小剧场 使用说明",
      content: BUILTIN_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now + 1,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now + 1,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.settings.guideCreated = true;
    saveData();
  }

  function saveData() {
    try {
      const ctx = getCtx();
      if (ctx) {
        ctx.s[STORAGE_KEY] = {
          groups: data.groups,
          prompts: data.prompts,
          quickPhrases: data.quickPhrases,
          subscriptions: data.subscriptions,
          settings: data.settings,
        };
        ctx.save();
      }
    } catch (e) {
      console.error("[小剧场] 保存数据失败", e);
    }
  }
  function saveDraft(draftData) {
    data.settings._editDraft = draftData;
    saveData();
  }
  function loadDraft() {
    return data.settings._editDraft || null;
  }
  function clearDraft() {
    if (data.settings._editDraft) {
      delete data.settings._editDraft;
      saveData();
    }
  }
  function getGroup(id) {
    return data.groups.find((g) => g.id === id) || null;
  }
  function getPrompt(id) {
    return data.prompts.find((p) => p.id === id) || null;
  }
  function getPromptsInGroup(gid) {
    return data.prompts.filter((p) => p.groupId === gid);
  }
  function getUngroupedPrompts() {
    return data.prompts.filter((p) => !p.groupId || !getGroup(p.groupId));
  }
  function getStarredPrompts() {
    return data.prompts.filter((p) => p.starred);
  }
  function getRecentPrompts() {
    return data.prompts
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, 30);
  }
  function getTag(id) {
    return data.settings.definedTags.find((t) => t.id === id) || null;
  }
  function sortTagIds(tagIds) {
    var order = {};
    data.settings.definedTags.forEach(function (t, i) {
      order[t.id] = i;
    });
    return [...tagIds].sort(function (a, b) {
      return (
        (order[a] !== undefined ? order[a] : 999) -
        (order[b] !== undefined ? order[b] : 999)
      );
    });
  }
  function sortPrompts(list) {
    const mode = data.settings.sortMode || "created-desc";
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      switch (mode) {
        case "name-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "name-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "created-asc":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "created-desc":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "edited-desc":
          return (
            (b.updatedAt || b.createdAt || 0) -
            (a.updatedAt || a.createdAt || 0)
          );
        case "edited-asc":
          return (
            (a.updatedAt || a.createdAt || 0) -
            (b.updatedAt || b.createdAt || 0)
          );
        case "used-desc":
          return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
        case "used-asc":
          return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
        case "usage-desc":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "usage-asc":
          return (a.usageCount || 0) - (b.usageCount || 0);
        case "custom":
        default:
          return 0;
      }
    });
    return sorted;
  }

  function createGroup(name) {
    const g = {
      id: uid(),
      name,
      color: GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
      note: "",
      defaultAuthor: "",
    };
    data.groups.push(g);
    saveData();
    return g;
  }
  function updateGroup(id, u) {
    const g = getGroup(id);
    if (g) {
      Object.assign(g, u);
      saveData();
    }
  }
  function deleteGroup(id) {
    data.groups = data.groups.filter((g) => g.id !== id);
    data.prompts.forEach((p) => {
      if (p.groupId === id) p.groupId = null;
    });
    data.subscriptions.forEach((s) => {
      if (s.targetGroupId === id) s.targetGroupId = null;
    });
    saveData();
  }

  function createPrompt(obj) {
    const p = {
      id: uid(),
      title: obj.title || "未命名",
      content: obj.content || "",
      groupId: obj.groupId || null,
      author: obj.author || "",
      tags: obj.tags || [],
      starred: false,
      pinned: false,
      sourceId: obj.sourceId || null,
      createdAt: Date.now(),
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: Date.now(),
      series: obj.series || "",
      history: [],
    };
    if (!p.author) {
      const g = p.groupId ? getGroup(p.groupId) : null;
      if (g && g.defaultAuthor) p.author = g.defaultAuthor;
      else if (data.settings.defaultAuthor)
        p.author = data.settings.defaultAuthor;
    }
    p.fingerprint = contentFingerprint(p);
    data.prompts.push(p);
    saveData();
    return p;
  }
  function updatePrompt(id, u) {
    const p = getPrompt(id);
    if (p) {
      Object.assign(p, u);
      if (u.title !== undefined || u.content !== undefined) {
        p.fingerprint = contentFingerprint(p);
        p.updatedAt = Date.now();
      }
      saveData();
    }
  }
  function deletePrompt(id) {
    data.prompts = data.prompts.filter((p) => p.id !== id);
    if (Array.isArray(data.settings.stageSelectedIds)) {
      data.settings.stageSelectedIds = data.settings.stageSelectedIds.filter(
        (sid) => sid !== id,
      );
    }
    saveData();
  }
  function deletePrompts(ids) {
    const s = new Set(ids);
    data.prompts = data.prompts.filter((p) => !s.has(p.id));
    if (Array.isArray(data.settings.stageSelectedIds)) {
      data.settings.stageSelectedIds = data.settings.stageSelectedIds.filter(
        (sid) => !s.has(sid),
      );
    }
    saveData();
  }
  function movePromptsToGroup(ids, gid) {
    const s = new Set(ids);
    data.prompts.forEach((p) => {
      if (s.has(p.id)) p.groupId = gid;
    });
    saveData();
  }
  function duplicatePrompt(id) {
    const p = getPrompt(id);
    if (!p) return null;
    return createPrompt({
      title: p.title + " (副本)",
      content: p.content,
      groupId: p.groupId,
      author: p.author,
      tags: [...(p.tags || [])],
      series: p.series || "",
    });
  }
  function toggleStar(id) {
    const p = getPrompt(id);
    if (p) {
      p.starred = !p.starred;
      saveData();
    }
  }
  function togglePin(id) {
    const p = getPrompt(id);
    if (p) {
      p.pinned = !p.pinned;
      saveData();
    }
  }

  function pushHistory(p) {
    if (!p) return;
    if (!Array.isArray(p.history)) p.history = [];
    p.history.push({
      title: p.title,
      content: p.content,
      author: p.author,
      savedAt: Date.now(),
    });
    if (p.history.length > 5) p.history.shift();
  }

  function createTag(name) {
    const t = {
      id: uid(),
      name,
      color: TAG_COLORS[data.settings.definedTags.length % TAG_COLORS.length],
    };
    data.settings.definedTags.push(t);
    saveData();
    return t;
  }
  function updateTag(id, u) {
    const t = getTag(id);
    if (t) {
      Object.assign(t, u);
      saveData();
    }
  }
  function deleteTag(id) {
    data.settings.definedTags = data.settings.definedTags.filter(
      (t) => t.id !== id,
    );
    data.prompts.forEach((p) => {
      p.tags = p.tags.filter((tid) => tid !== id);
    });
    saveData();
  }

  function filterPrompts(list) {
    let r = list;
    if (filterState.tags.length > 0) {
      if (data.settings.filterTagMode === "and") {
        r = r.filter(
          (p) =>
            p.tags && filterState.tags.every((tid) => p.tags.includes(tid)),
        );
      } else {
        r = r.filter(
          (p) => p.tags && filterState.tags.some((tid) => p.tags.includes(tid)),
        );
      }
    }
    if (filterState.groupId) {
      if (filterState.groupId === "_ungrouped")
        r = r.filter((p) => !p.groupId || !getGroup(p.groupId));
      else r = r.filter((p) => p.groupId === filterState.groupId);
    }
    return r;
  }
  function searchPrompts(list, q) {
    if (!q) return list;
    const lq = q.toLowerCase();
    return list.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(lq)) ||
        (p.content && p.content.toLowerCase().includes(lq)) ||
        (p.author && p.author.toLowerCase().includes(lq)) ||
        (p.series && p.series.toLowerCase().includes(lq)),
    );
  }
  function highlightText(text, query) {
    if (!query || !text) return esc(text);
    const escaped = esc(text);
    const eq = esc(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return escaped.replace(
      new RegExp(`(${eq})`, "gi"),
      '<mark class="ms-hl">$1</mark>',
    );
  }

  function getVisiblePromptIds() {
    const v = currentView();
    let list = [];
    if (v.name === "list") list = data.prompts;
    else if (v.name === "group")
      list =
        v.groupId === "_ungrouped"
          ? getUngroupedPrompts()
          : getPromptsInGroup(v.groupId);
    else if (v.name === "starred") list = getStarredPrompts();
    else if (v.name === "recent") list = getRecentPrompts();
    else return [];
    return sortPrompts(filterPrompts(searchPrompts(list, searchQuery))).map(
      (p) => p.id,
    );
  }

  function autoCollapsePanel() {
    const $panel = $("#" + PANEL_ID);
    if ($panel.length && !$panel.hasClass("ms-collapsed")) {
      $panel.addClass("ms-collapsed");
      data.settings.collapsed = true;
      $panel
        .find("#ms-btn-collapse i")
        .attr("class", "fa-solid fa-window-maximize");
      saveData();
    }
  }

  function sendToInput(id) {
    const p = getPrompt(id);
    if (!p) return;
    p.lastUsedAt = Date.now();
    p.usageCount = (p.usageCount || 0) + 1;
    saveData();
    try {
      const $ta = $("#send_textarea");
      if ($ta.length) {
        $ta.val(p.content).trigger("input").trigger("focus");
      } else toast("error", "找不到输入框");
    } catch (e) {
      toast("error", "操作失败");
    }
  }

  function sendAndGenerate(id) {
    const p = getPrompt(id);
    if (!p) return;
    try {
      if (typeof createChatMessages === "function") {
        _skipAllInjectForNextGeneration = true;

        createChatMessages([
          { role: "user", message: substitudeMacros(p.content) },
        ])
          .then(() => {
            p.lastUsedAt = Date.now();
            p.usageCount = (p.usageCount || 0) + 1;
            saveData();
            if (typeof triggerSlash === "function")
              triggerSlash("/trigger await=true");
            autoCollapsePanel();
          })
          .catch(() => {
            _skipAllInjectForNextGeneration = false;
            toast("error", "发送失败");
          });
      } else {
        const $ta = $("#send_textarea");
        if ($ta.length) {
          _skipAllInjectForNextGeneration = true;

          p.lastUsedAt = Date.now();
          p.usageCount = (p.usageCount || 0) + 1;
          saveData();
          $ta.val(p.content).trigger("input");
          setTimeout(() => {
            $("#send_but").trigger("click");
          }, 100);
          autoCollapsePanel();
        } else toast("error", "找不到输入框");
      }
    } catch (e) {
      toast("error", "发送失败");
    }
  }

  function renderMd(text) {
    if (!text) return '<span style="opacity:0.4;">空内容</span>';
    var codeBlocks = [];
    text = text.replace(
      /```(?:[^\n]*\n)?([\s\S]*?)\n?```/g,
      function (m, code) {
        var idx = codeBlocks.length;
        codeBlocks.push(code);
        return "%%CB" + idx + "%%";
      },
    );
    var detailBlocks = [];
    var _dbPrevText;
    do {
      _dbPrevText = text;
      text = text.replace(
        /<details>\s*\n?\s*<summary>((?:(?!<\/summary>)[\s\S])*)<\/summary>\s*\n?((?:(?!<details[\s>])[\s\S])*?)<\/details>/gi,
        function (m, summary, body) {
          var idx = detailBlocks.length;
          detailBlocks.push({ summary: summary.trim(), body: body.trim() });
          return "%%DB" + idx + "%%";
        },
      );
    } while (text !== _dbPrevText);
    var tmp = text;
    var inlineCodes = [];
    tmp = tmp.replace(/`([^`\n]+)`/g, function (m, code) {
      var idx = inlineCodes.length;
      inlineCodes.push(code);
      return "%%IC" + idx + "%%";
    });
    var eqBlocks = [];
    tmp = tmp.replace(/"([^"\n]*)"/g, function (m, content) {
      var idx = eqBlocks.length;
      eqBlocks.push(content);
      return "%%EQ" + idx + "%%";
    });
    var cqBlocks = [];
    tmp = tmp.replace(/\u201c([^\u201d\n]*)\u201d/g, function (m, content) {
      var idx = cqBlocks.length;
      cqBlocks.push(content);
      return "%%CQ" + idx + "%%";
    });
    tmp = tmp.replace(/^(\s*)> /gm, function (m, sp) {
      return sp + "%%BQPFX%%";
    });
    var h = esc(tmp);
    h = h.replace(/^\s*(\*{3,}|-{3,})\s*$/gm, '<hr class="ms-md-hr">');
    h = h.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*(?!\s)([\s\S]+?)(?<!\s)\*/g, "<em>$1</em>");
    h = h.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
    h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (m, alt, url) {
      return (
        '<img class="ms-md-img" src="' +
        url.replace(/&/g, "&") +
        '" alt="' +
        alt +
        '" loading="lazy">'
      );
    });
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, text, url) {
      return (
        '<a class="ms-md-link" href="' +
        url.replace(/&/g, "&") +
        '" target="_blank" rel="noopener">' +
        text +
        "</a>"
      );
    });
    h = h.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
    h = h.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
    h = h.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    h = h.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    h = h.replace(/%%BQPFX%%(.*)/gm, "<blockquote>$1</blockquote>");
    h = h.replace(/<\/blockquote>\s*(<br>)?\s*<blockquote>/g, "<br>");
    var taskIdx = 0;
    h = h.replace(/^\s*- \[([ x])\] (.+)$/gm, function (m, check, txt) {
      var done = check === "x";
      var i = taskIdx++;
      return (
        '<li class="ms-task' +
        (done ? " ms-task-done" : "") +
        '"><input type="checkbox"' +
        (done ? " checked" : "") +
        ' class="ms-task-cb" data-task-idx="' +
        i +
        '"> ' +
        txt +
        "</li>"
      );
    });
    h = h.replace(/^\s*- (.+)$/gm, "<li>$1</li>");
    h = h.replace(
      /^(\|.+\|)\n\|[\s\-:|]+\|\n((?:\|.+\|\n?)+)/gm,
      function (match, headerRow, bodySection) {
        var headers = headerRow.split("|").filter(function (c) {
          return c.trim() !== "";
        });
        var thead =
          "<thead><tr>" +
          headers
            .map(function (c) {
              return "<th>" + c.trim() + "</th>";
            })
            .join("") +
          "</tr></thead>";
        var rows = bodySection.trim().split("\n");
        var tbody =
          "<tbody>" +
          rows
            .map(function (row) {
              var cells = row.split("|").filter(function (c) {
                return c.trim() !== "";
              });
              return (
                "<tr>" +
                cells
                  .map(function (c) {
                    return "<td>" + c.trim() + "</td>";
                  })
                  .join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody>";
        return '<table class="ms-md-table">' + thead + tbody + "</table>";
      },
    );
    h = h.replace(/\n/g, "<br>");
    h = h.replace(
      /(<br>\s*)+(<(h[1-6]|blockquote|li|table|hr)[>\s\/])/gi,
      "$2",
    );
    h = h.replace(/(<\/(h[1-6]|blockquote|li|table)>)\s*(<br>)+/gi, "$1");
    h = h.replace(/(<hr[^>]*>)\s*(<br>)+/gi, "$1");
    eqBlocks.forEach(function (content, idx) {
      h = h.replace(
        "%%EQ" + idx + "%%",
        '<span class="ms-quote-text">"' + esc(content) + '"</span>',
      );
    });
    cqBlocks.forEach(function (content, idx) {
      h = h.replace(
        "%%CQ" + idx + "%%",
        '<span class="ms-quote-text">\u201c' + esc(content) + "\u201d</span>",
      );
    });
    inlineCodes.forEach(function (code, idx) {
      h = h.replace(
        "%%IC" + idx + "%%",
        "<code class='ms-ic'>" + esc(code) + "</code>",
      );
    });
    codeBlocks.forEach(function (code, idx) {
      h = h.replace(
        "%%CB" + idx + "%%",
        "<pre class='ms-codeblock'><code>" +
          esc(code).replace(/\n/g, "<br>") +
          "</code></pre>",
      );
    });
    var renderedDetailBlocks = [];
    for (var _dbIdx = 0; _dbIdx < detailBlocks.length; _dbIdx++) {
      var block = detailBlocks[_dbIdx];
      var bodyParts = block.body.split(/(%%DB\d+%%)/);
      var innerHtml = bodyParts
        .map(function (part) {
          if (!part) return "";
          var m = part.match(/^%%DB(\d+)%%$/);
          if (m) {
            return renderedDetailBlocks[parseInt(m[1])] || "";
          }
          return renderMd(part);
        })
        .join("");
      renderedDetailBlocks[_dbIdx] =
        '<details class="ms-details"><summary class="ms-summary">' +
        esc(block.summary) +
        '</summary><div class="ms-details-body">' +
        innerHtml +
        "</div></details>";
    }
    for (var _dbIdx2 = detailBlocks.length - 1; _dbIdx2 >= 0; _dbIdx2--) {
      h = h.replace("%%DB" + _dbIdx2 + "%%", renderedDetailBlocks[_dbIdx2]);
    }
    return h;
  }

  function wrapSelection(ta, before, after) {
    if (!ta) return;
    const s = ta.selectionStart,
      e = ta.selectionEnd,
      v = ta.value,
      sel = v.substring(s, e) || "文本";
    var _st = ta.scrollTop;
    ta.value = v.substring(0, s) + before + sel + after + v.substring(e);
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function prependLine(ta, prefix) {
    if (!ta) return;
    const s = ta.selectionStart,
      v = ta.value,
      ls = v.lastIndexOf("\n", s - 1) + 1;
    var _st = ta.scrollTop;
    ta.value = v.substring(0, ls) + prefix + v.substring(ls);
    ta.selectionStart = ta.selectionEnd = s + prefix.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function insertAtCursor(ta, text) {
    if (!ta) return;
    const s = ta.selectionStart,
      e = ta.selectionEnd,
      v = ta.value;
    var _st = ta.scrollTop;
    ta.value = v.substring(0, s) + text + v.substring(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function createUndoManager(getTa) {
    const stack = [],
      redoStack = [];
    let timer = null,
      lastSaved = "";
    function capture() {
      const ta = getTa();
      if (!ta) return;
      if (ta.value === lastSaved && stack.length > 0) return;
      stack.push({ v: ta.value, s: ta.selectionStart, e: ta.selectionEnd });
      lastSaved = ta.value;
      if (stack.length > 80) stack.shift();
      redoStack.length = 0;
    }
    function scheduleCapture() {
      clearTimeout(timer);
      timer = setTimeout(capture, 350);
    }

    function undo() {
      const ta = getTa();
      if (!ta) return;
      if (ta.value !== lastSaved) capture();
      if (stack.length <= 1) return;
      redoStack.push(stack.pop());
      const prev = stack[stack.length - 1];
      var _st = ta.scrollTop;
      ta.value = prev.v;
      ta.selectionStart = prev.s;
      ta.selectionEnd = prev.e;
      ta.scrollTop = _st;
      lastSaved = ta.value;
      ta.focus();
    }

    function redo() {
      const ta = getTa();
      if (!ta) return;
      if (redoStack.length === 0) return;
      const next = redoStack.pop();
      stack.push(next);
      var _st = ta.scrollTop;
      ta.value = next.v;
      ta.selectionStart = next.s;
      ta.selectionEnd = next.e;
      ta.scrollTop = _st;
      lastSaved = ta.value;
      ta.focus();
    }
    const ta = getTa();
    if (ta) {
      stack.push({ v: ta.value, s: 0, e: 0 });
      lastSaved = ta.value;
    }
    function getState() {
      return {
        stack: stack.map(function (s) {
          return { v: s.v, s: s.s, e: s.e };
        }),
        redoStack: redoStack.map(function (s) {
          return { v: s.v, s: s.s, e: s.e };
        }),
        lastSaved: lastSaved,
      };
    }
    function setState(st) {
      stack.length = 0;
      redoStack.length = 0;
      if (st.stack)
        st.stack.forEach(function (s) {
          stack.push({ v: s.v, s: s.s, e: s.e });
        });
      if (st.redoStack)
        st.redoStack.forEach(function (s) {
          redoStack.push({ v: s.v, s: s.s, e: s.e });
        });
      lastSaved = st.lastSaved || "";
    }
    return { capture, scheduleCapture, undo, redo, getState, setState };
  }

  function buildExportPayload(
    exportPrompts,
    includeGroups,
    includeTags,
    includeHistory,
  ) {
    const gidSet = new Set(exportPrompts.map((p) => p.groupId).filter(Boolean));
    const exportGroups = includeGroups
      ? data.groups.filter((g) => gidSet.has(g.id))
      : [];
    const tagIds = new Set();
    exportPrompts.forEach((p) =>
      (p.tags || []).forEach((tid) => tagIds.add(tid)),
    );
    const exportTags = includeTags
      ? data.settings.definedTags.filter((t) => tagIds.has(t.id))
      : [];
    const finalPrompts = exportPrompts.map((p) => {
      if (includeHistory) return p;
      const cp = { ...p };
      delete cp.history;
      return cp;
    });
    return {
      _miniStage: true,
      version: 3,
      exportedAt: new Date().toISOString(),
      groups: exportGroups,
      prompts: finalPrompts,
      tags: exportTags,
    };
  }

  function downloadJSON(obj, filename) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    let targetDoc = document;
    try {
      if (
        window.parent &&
        window.parent.document &&
        window.parent.document.body
      ) {
        targetDoc = window.parent.document;
      }
    } catch (e) {}
    const a = targetDoc.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
    targetDoc.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        targetDoc.body.removeChild(a);
      } catch (e) {}
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function doExportSingle(pr) {
    navigateTo({ name: "export-single-options", promptId: pr.id });
  }

  function doExportGroup(groupId) {
    const g = getGroup(groupId);
    const prompts = getPromptsInGroup(groupId);
    if (prompts.length === 0) {
      toast("warning", "该分组没有剧场");
      return;
    }
    navigateTo({
      name: "export-group-options",
      groupId,
      groupName: g ? g.name : "未知",
    });
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.prompts && !imported.groups)
          throw new Error("无效的小剧场数据");
        navigateTo({
          name: "import-confirm",
          importedGroups: imported.groups || [],
          importedPrompts: imported.prompts || [],
          importedTags: imported.tags || [],
        });
      } catch (err) {
        toast("error", "文件解析失败: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function executeImport(
    mode,
    ig,
    ip,
    itags,
    useGroups,
    useTags,
    targetGroupId,
  ) {
    let importMsg = "导入完成";
    if (mode === "replace") {
      if (useTags) {
        data.settings.definedTags = [];
      }
      const replaceTagIdMap = {};
      if (useTags && itags.length) {
        itags.forEach((t) => {
          const nt = { ...t, id: t.id || uid() };
          data.settings.definedTags.push(nt);
          replaceTagIdMap[t.id] = nt.id;
        });
      }
      data.groups = useGroups ? ig : data.groups;
      data.prompts = ip.map((p) => {
        const np = {
          ...p,
          id: p.id || uid(),
          sourceId: p.sourceId || p.id || null,
          tags: useTags
            ? (p.tags || []).map((tid) => replaceTagIdMap[tid] || tid)
            : [],
          author: p.author || "",
          pinned: p.pinned || false,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        };
        np.fingerprint = contentFingerprint(np);
        if (!useGroups) np.groupId = targetGroupId || null;
        return np;
      });
    } else if (mode === "merge") {
      const sourceIdIndex = {};
      data.prompts.forEach((p) => {
        if (p.sourceId) sourceIdIndex[p.sourceId] = p;
      });
      data.prompts.forEach((p) => {
        if (!sourceIdIndex[p.id]) sourceIdIndex[p.id] = p;
      });
      const existFingerprints = new Set(
        data.prompts.map((p) => {
          if (!p.fingerprint) {
            p.fingerprint = contentFingerprint(p);
          }
          return p.fingerprint;
        }),
      );
      const gidMap = {};
      if (useGroups) {
        ig.forEach((g) => {
          const ex = data.groups.find((eg) => eg.name === g.name);
          if (ex) gidMap[g.id] = ex.id;
          else {
            const ng = { ...g, id: uid() };
            data.groups.push(ng);
            gidMap[g.id] = ng.id;
          }
        });
      }
      const tagIdMap = {};
      if (useTags && itags.length) {
        itags.forEach((t) => {
          const ex = data.settings.definedTags.find((et) => et.name === t.name);
          if (ex) tagIdMap[t.id] = ex.id;
          else {
            const nt = { ...t, id: uid() };
            data.settings.definedTags.push(nt);
            tagIdMap[t.id] = nt.id;
          }
        });
      }
      let addedCount = 0,
        updatedCount = 0,
        skippedCount = 0;
      ip.forEach((p) => {
        const importSourceId = p.sourceId || p.id;
        const fp = contentFingerprint(p);
        const existingBySource = sourceIdIndex[importSourceId];
        if (existingBySource) {
          const existingFp =
            existingBySource.fingerprint ||
            contentFingerprint(existingBySource);
          if (fp === existingFp) {
            skippedCount++;
            return;
          }
          existingBySource.title = p.title || existingBySource.title;
          existingBySource.content =
            p.content !== undefined ? p.content : existingBySource.content;
          existingBySource.author = p.author || existingBySource.author;
          existingBySource.series =
            p.series !== undefined ? p.series : existingBySource.series;
          existingBySource.fingerprint = fp;
          existingBySource.updatedAt = Date.now();
          if (useGroups && p.groupId)
            existingBySource.groupId = gidMap[p.groupId] || p.groupId;
          if (useTags && p.tags)
            existingBySource.tags = p.tags.map((tid) => tagIdMap[tid] || tid);
          updatedCount++;
          return;
        }
        if (existFingerprints.has(fp)) {
          skippedCount++;
          return;
        }
        const np = {
          ...p,
          id: uid(),
          sourceId: importSourceId,
          author: p.author || "",
          pinned: p.pinned || false,
          fingerprint: fp,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        };
        np.groupId = useGroups
          ? gidMap[p.groupId] || p.groupId || null
          : targetGroupId || null;
        np.tags = useTags
          ? (p.tags || []).map((tid) => tagIdMap[tid] || tid)
          : [];
        data.prompts.push(np);
        existFingerprints.add(fp);
        addedCount++;
      });
      const parts = [];
      if (addedCount > 0) parts.push("新增 " + addedCount + " 条");
      if (updatedCount > 0) parts.push("更新 " + updatedCount + " 条");
      if (skippedCount > 0) parts.push("跳过 " + skippedCount + " 条");
      importMsg =
        "导入完成：" + (parts.length > 0 ? parts.join("，") : "无变化");
    } else {
      const gidMap = {};
      if (useGroups) {
        ig.forEach((g) => {
          const ng = { ...g, id: uid() };
          data.groups.push(ng);
          gidMap[g.id] = ng.id;
        });
      }
      const tagIdMap = {};
      if (useTags && itags.length) {
        itags.forEach((t) => {
          const nt = { ...t, id: uid() };
          data.settings.definedTags.push(nt);
          tagIdMap[t.id] = nt.id;
        });
      }
      ip.forEach((p) => {
        const np = {
          ...p,
          id: uid(),
          author: p.author || "",
          pinned: p.pinned || false,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        };
        np.fingerprint = contentFingerprint(np);
        np.sourceId = p.sourceId || p.id || null;
        np.groupId = useGroups
          ? gidMap[p.groupId] || null
          : targetGroupId || null;
        np.tags = useTags
          ? (p.tags || []).map((tid) => tagIdMap[tid] || tid)
          : [];
        data.prompts.push(np);
      });
    }
    saveData();
    toast("success", importMsg);
    navigateTo({ name: "list" }, true);
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
  }

  function exitFocusMode() {
    const $panel = $("#" + PANEL_ID);
    if (!$panel.hasClass("ms-focus-mode")) return;
    const el = $panel[0];
    $panel.removeClass("ms-focus-mode");
    const saved = $panel.data("ms-focus-saved-pos");
    if (saved) {
      if (saved.left) el.style.setProperty("left", saved.left, "important");
      else el.style.removeProperty("left");
      if (saved.top) el.style.setProperty("top", saved.top, "important");
      else el.style.removeProperty("top");
      if (saved.transform)
        el.style.setProperty("transform", saved.transform, "important");
      else el.style.removeProperty("transform");
      data.settings.panelPos = saved.panelPos || null;
      saveData();
    } else {
      el.style.removeProperty("left");
      el.style.removeProperty("top");
      el.style.removeProperty("transform");
    }
    $panel.removeData("ms-focus-saved-pos");
  }

  function updateInjectIndicator() {
    var $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    var $ind = $p.find("#ms-inject-indicator");
    if (!data.settings.stageInjectEnabled) {
      $ind.removeClass("visible").empty();
      return;
    }
    var sids = data.settings.stageSelectedIds || [];
    sids = sids.filter(function (sid) {
      return getPrompt(sid);
    });
    if (sids.length !== (data.settings.stageSelectedIds || []).length) {
      data.settings.stageSelectedIds = sids;
      saveData();
    }
    if (sids.length > 0) {
      var label =
        sids.length === 1
          ? esc(truncate(getPrompt(sids[0]).title, 16))
          : "已选 " + sids.length + " 条";
      $ind
        .html('<i class="fa-solid fa-syringe"></i><span>' + label + "</span>")
        .addClass("visible");
    } else if (
      data.settings.randomInject &&
      data.settings.randomInject.enabled
    ) {
      var poolCount = data.prompts.filter(function (p) {
        return isInRandomPool(p);
      }).length;
      $ind
        .html(
          '<i class="fa-solid fa-dice"></i><span>随机 ' +
            poolCount +
            "条</span>",
        )
        .addClass("visible");
    } else {
      $ind.removeClass("visible").empty();
    }
  }
  function isInRandomPool(p) {
    var ri = data.settings.randomInject;
    if (!ri) return true;
    var effectiveGid =
      p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
    if (ri.excludedGroupIds && ri.excludedGroupIds.indexOf(effectiveGid) >= 0)
      return false;
    var sn = (p.series || "").trim();
    if (
      sn &&
      ri.excludedSeries &&
      ri.excludedSeries.some(function (s) {
        return s.groupId === effectiveGid && s.seriesName === sn;
      })
    )
      return false;
    if (ri.excludedPromptIds && ri.excludedPromptIds.indexOf(p.id) >= 0)
      return false;
    return true;
  }

  function buildStageContent(stagePrompts) {
    if (stagePrompts.length === 0) return "";
    if (stagePrompts.length === 1) {
      var pr = stagePrompts[0];
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var prefix = "";
      if (g && g.stagePrefix) prefix = g.stagePrefix;
      else if (data.settings.defaultStagePrefix)
        prefix = data.settings.defaultStagePrefix;
      var result = "";
      if (prefix) {
        if (/\{\{stage\}\}/i.test(prefix)) {
          result = prefix.replace(/\{\{stage\}\}/gi, function () {
            return pr.content;
          });
        } else {
          result = prefix + "\n" + pr.content;
        }
      } else {
        result = pr.content;
      }
      return result.replace(/\{\{stage_title\}\}/gi, pr.title || "");
    }
    var taskBlocks = [];
    stagePrompts.forEach(function (pr, idx) {
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var rawPrefix = "";
      if (g && g.stagePrefix) rawPrefix = g.stagePrefix;
      else if (data.settings.defaultStagePrefix)
        rawPrefix = data.settings.defaultStagePrefix;
      var innerPrefix = rawPrefix
        .replace(/^\s*<[A-Za-z_][\w-]*[^>]*>\s*\n?/, "")
        .replace(/\n?\s*<\/[A-Za-z_][\w-]*>\s*$/, "");
      var taskContent = "";
      if (innerPrefix) {
        if (/\{\{stage\}\}/i.test(innerPrefix)) {
          taskContent = innerPrefix.replace(/\{\{stage\}\}/gi, function () {
            return pr.content;
          });
        } else {
          taskContent = innerPrefix + "\n" + pr.content;
        }
      } else {
        taskContent = pr.content;
      }
      taskContent = taskContent.replace(/\{\{stage_title\}\}/gi, function () {
        return pr.title || "";
      });
      taskBlocks.push(
        "\u3010\u4efb\u52a1" + (idx + 1) + "\u3011\n" + taskContent,
      );
    });
    var tasksStr = taskBlocks.join("\n\n---\n\n");
    var wrapper = data.settings.multiStagePrefix || "";
    if (!wrapper || wrapper.indexOf("{{stage_tasks}}") < 0) {
      wrapper =
        "<stage>\n\u4ee5\u4e0b\u5171\u6709 {{stage_count}} \u4e2a\u72ec\u7acb\u5c0f\u5267\u573a\u4efb\u52a1\uff0c\u8bf7\u5728\u6b63\u6587\u6700\u540e\u6309\u987a\u5e8f\u9010\u4e00\u5b8c\u6210\uff0c\u6bcf\u6761\u5267\u573a\u5355\u72ec\u4f7f\u7528\u5bf9\u5e94\u683c\u5f0f\u5305\u88f9\u3002\n\n{{stage_tasks}}\n</stage>";
    }
    var result = wrapper
      .replace(/\{\{stage_count\}\}/gi, function () {
        return String(stagePrompts.length);
      })
      .replace(/\{\{stage_tasks\}\}/gi, function () {
        return tasksStr;
      });
    return result;
  }

  function getRandomStagePrompt() {
    var pool = data.prompts.filter(function (p) {
      return isInRandomPool(p);
    });
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function currentView() {
    return viewStack[viewStack.length - 1];
  }

  function navigateTo(view, reset) {
    if (
      currentView().name === "edit" &&
      editDirty &&
      view.name !== "quick-phrases"
    ) {
      if (!confirm("编辑内容尚未保存，确定要离开吗？")) return;
    }
    editDirty = false;
    closeActiveDropdown();
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (!reset) {
      currentView()._savedSearch = searchQuery;
      currentView()._savedFilter = JSON.parse(JSON.stringify(filterState));
      var $scrollBody = $("#" + PANEL_ID + " #ms-body");
      if ($scrollBody.length) {
        currentView()._savedScrollTop = $scrollBody.scrollTop();
      }
      var _openSeries = [];
      $("#" + PANEL_ID + " .ms-series-body.open").each(function () {
        _openSeries.push(this.id);
      });
      currentView()._expandedSeries = _openSeries;
      currentView()._filterPanelOpen = $(
        "#" + PANEL_ID + " #ms-filter-panel",
      ).hasClass("open");
    }
    if (view.name === "preview" && !view._siblingIds) {
      view._siblingIds = getVisiblePromptIds();
    }
    if (reset) {
      viewStack = [view];
      exitSelectMode();
    } else viewStack.push(view);
    searchQuery = "";
    filterState = { tags: [], groupId: null };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function navigateBack() {
    if (currentView().name === "edit" && editDirty) {
      if (!confirm("编辑内容尚未保存，确定要离开吗？")) return;
    }
    editDirty = false;
    closeActiveDropdown();
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (viewStack.length > 1) {
      var leavingView = viewStack.pop();
      if (leavingView.name === "preview" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
      if (leavingView.name === "edit" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
    }
    var restoredView = viewStack[viewStack.length - 1];
    searchQuery = restoredView._savedSearch || "";
    filterState = restoredView._savedFilter || { tags: [], groupId: null };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function countStats(text) {
    if (!text) return { chars: 0, lines: 0 };
    return { chars: text.length, lines: text.split("\n").length };
  }

  function getCSS() {
    return `
#${PANEL_ID}{--ms-accent:var(--SmartThemeFavColor,#c9957a);--ms-accent-rgb:201,149,122;--ms-danger:#e55;--ms-danger-rgb:238,85,85;--ms-success:#5cb85c;}
#${PANEL_ID}{position:fixed;z-index:9998;background-color:var(--SmartThemeBlurTintColor,#1a1a2e);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.45);display:none;flex-direction:column;color:var(--SmartThemeBodyColor,#ccc);font-family:inherit;font-size:14px;overflow:hidden;width:440px;max-width:92vw;max-height:82vh;min-width:300px;left:50%;top:60px;transform:translateX(-50%);}
#${PANEL_ID}.ms-visible{display:flex;}
#${PANEL_ID}.ms-collapsed .ms-body,#${PANEL_ID}.ms-collapsed .ms-toolbar,#${PANEL_ID}.ms-collapsed .ms-footer,#${PANEL_ID}.ms-collapsed .ms-filter-panel{display:none!important;}
#${PANEL_ID}.ms-collapsed .ms-header{border-bottom:none;padding:1px 10px;min-height:18px;}
#${PANEL_ID}.ms-collapsed .ms-hbtn{width:18px;height:18px;font-size:10px;}
.ms-header{display:flex;align-items:center;min-height:28px;padding:3px 10px;cursor:move;user-select:none;border-bottom:1px solid var(--SmartThemeBorderColor,#333);gap:6px;flex-shrink:0;touch-action:none;}
.ms-header .ms-drag-handle{color:var(--SmartThemeBodyColor,#888);font-size:12px;opacity:0.4;flex-shrink:0;}
.ms-header .ms-title{font-weight:600;font-size:14px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-header .ms-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;}
.ms-hbtn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:13px;flex-shrink:0;padding:0;transition:background 0.15s;}
.ms-hbtn:hover{background:rgba(255,255,255,0.08);}
.ms-toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;flex-wrap:wrap;}
.ms-search{flex:1;min-width:100px;padding:6px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:13px;font-family:inherit;outline:none;}
.ms-search:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-toolbar-actions{display:flex;gap:4px;margin-left:auto;flex-shrink:0;}
.ms-tbtn{padding:5px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;transition:background 0.15s,color 0.15s;}
.ms-tbtn:hover{background:rgba(255,255,255,0.06);}
.ms-tbtn.danger{color:var(--ms-danger);border-color:rgba(var(--ms-danger-rgb),0.3);}
.ms-tbtn.danger:hover{background:rgba(var(--ms-danger-rgb),0.08);border-color:var(--ms-danger);}
.ms-tbtn.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 0;min-height:80px;}
.ms-body::-webkit-scrollbar{width:5px;}
.ms-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} textarea::-webkit-scrollbar,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar{width:5px;}
#${PANEL_ID} textarea::-webkit-scrollbar-thumb,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} .ms-footer{padding:5px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;display:flex;flex-direction:row!important;align-items:center;justify-content:space-between;gap:6px;min-height:28px;flex-wrap:nowrap!important;overflow:hidden;}
#${PANEL_ID}:not(.ms-collapsed) .ms-footer[style*="block"]{display:flex!important;}
.ms-footer>span:first-child{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;}
#${PANEL_ID} .ms-footer-btns{display:flex;gap:6px;flex-shrink:0;flex-wrap:nowrap!important;white-space:nowrap;justify-content:flex-end;}
.ms-footer-btns a{color:var(--SmartThemeQuoteColor,#777);cursor:pointer;font-size:11px;text-decoration:none;transition:color 0.15s;white-space:nowrap;}
.ms-footer-btns a:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-batch-bar{display:flex;gap:4px;width:100%;align-items:center;flex-wrap:nowrap;}
.ms-batch-bar .ms-batch-count{font-size:12px;color:var(--SmartThemeBodyColor,#ccc);white-space:nowrap;margin-right:auto;}
.ms-batch-btn{padding:4px 7px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;transition:background 0.15s;white-space:nowrap;display:inline-flex;align-items:center;gap:3px;}
.ms-batch-btn:hover{background:rgba(255,255,255,0.06);}
.ms-batch-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-batch-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-nav-item{display:flex;align-items:center;padding:10px 14px;cursor:pointer;gap:10px;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-nav-item:hover{background:rgba(255,255,255,0.04);}
.ms-nav-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.ms-nav-info{flex:1;min-width:0;}
.ms-nav-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-nav-note{font-size:10px;color:var(--SmartThemeQuoteColor,#555);margin-top:1px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-nav-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;margin-left:auto;padding-left:8px;}
.ms-nav-chevron{color:var(--SmartThemeQuoteColor,#555);font-size:11px;flex-shrink:0;}
.ms-nav-sel-badge{font-size:9px;color:var(--ms-accent);flex-shrink:0;margin-left:4px;}
.ms-card{display:flex;flex-wrap:wrap;align-items:center;padding:8px 14px;gap:6px;transition:background 0.12s;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.03);position:relative;}
.ms-card:hover{background:rgba(255,255,255,0.04);}
.ms-card.ms-just-viewed{animation:ms-flash-highlight 1.5s ease-out;}
.ms-card.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-nav-item.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-series-group.ms-stage-injecting>.ms-series-header{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
@keyframes ms-flash-highlight{0%{background:rgba(var(--ms-accent-rgb),0.18);}100%{background:transparent;}}
.ms-card.selected{background:rgba(var(--ms-accent-rgb),0.1);}
.ms-card-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;}
.ms-card.selected .ms-card-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-card-star{flex-shrink:0;width:20px;text-align:center;cursor:pointer;}
.ms-card-star .fa-star{font-size:12px;color:var(--SmartThemeBorderColor,#3a3a3a);opacity:0.25;transition:all 0.15s;}
.ms-card-star.active .fa-star{color:var(--ms-accent);opacity:1;}
.ms-card-star:hover .fa-star{opacity:0.6;}
.ms-card-pin{flex-shrink:0;width:16px;text-align:center;font-size:10px;color:var(--ms-accent);opacity:0.7;}
.ms-card-info{flex:1;min-width:0;}
.ms-card-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-card-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.ms-card-series{font-size:10px;color:var(--ms-accent);opacity:0.75;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;}
.ms-card-series i{font-size:9px;flex-shrink:0;}
.ms-card-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);overflow:hidden;text-overflow:ellipsis;margin-top:2px;white-space:nowrap;}
.ms-card-preview.ms-has-search{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.ms-card-quick{display:flex;gap:2px;flex-shrink:0;}
.ms-card-qbtn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#666);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;transition:background 0.12s,color 0.12s;padding:0;}
.ms-card-qbtn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ccc);}
.ms-card-tags-row{width:100%;display:flex;justify-content:flex-end;gap:4px;flex-wrap:wrap;padding-left:38px;margin-top:-2px;}
.ms-tag-chip{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;line-height:1.4;color:#fff;white-space:nowrap;}
.ms-tag-chip-sm{font-size:8px;padding:0 4px;}
.ms-empty{text-align:center;padding:40px 20px;color:var(--SmartThemeQuoteColor,#555);font-size:13px;}
.ms-empty i{font-size:32px;opacity:0.25;display:block;margin-bottom:12px;}
.ms-section-label{padding:10px 14px 4px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#666);text-transform:uppercase;letter-spacing:0.03em;}
.ms-divider{height:1px;background:var(--SmartThemeBorderColor,#333);margin:6px 14px;}
.ms-hl{background:rgba(var(--ms-accent-rgb),0.3);color:inherit;padding:0 1px;border-radius:2px;}
.ms-preview-content{padding:14px;line-height:1.7;font-size:13px;color:var(--SmartThemeBodyColor,#ccc);overflow-wrap:break-word;word-break:break-word;}
.ms-preview-content>:first-child{margin-top:0!important;}
.ms-preview-content h1{font-size:1.5em;font-weight:700;margin:0.7em 0 0.3em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h2{font-size:1.35em;font-weight:700;margin:0.6em 0 0.25em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h3{font-size:1.2em;font-weight:600;margin:0.5em 0 0.2em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h4{font-size:1.08em;font-weight:600;margin:0.4em 0 0.15em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h5{font-size:0.95em;font-weight:600;margin:0.3em 0 0.1em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h6{font-size:0.85em;font-weight:600;margin:0.25em 0 0.1em;color:var(--SmartThemeQuoteColor,#bbb);line-height:1.3;}
.ms-preview-content strong{color:var(--SmartThemeEmColor,var(--ms-accent));font-weight:700;}
.ms-preview-content em{color:var(--SmartThemeEmColor,var(--ms-accent));font-style:italic;}
.ms-preview-content u{text-decoration-color:var(--SmartThemeUnderlineColor,var(--ms-accent));}
.ms-preview-content del{opacity:0.5;}
.ms-preview-content .ms-quote-text{color:var(--SmartThemeQuoteColor,#999);}
.ms-md-link{color:var(--ms-accent);text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer;}
.ms-md-link:hover{opacity:0.8;}
.ms-md-img{max-width:100%;border-radius:6px;margin:4px 0;display:block;}
.ms-md-hr{border:none;border-top:1px solid var(--SmartThemeBorderColor,#444);margin:10px 0;}
.ms-md-table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px;}
.ms-md-table th,.ms-md-table td{border:1px solid var(--SmartThemeBorderColor,#444);padding:6px 10px;text-align:left;}
.ms-md-table th{background:rgba(255,255,255,0.04);font-weight:600;color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-table td{color:var(--SmartThemeBodyColor,#ccc);}
.ms-task{list-style:none;margin-left:0!important;display:flex;align-items:flex-start;gap:6px;padding:2px 0;}
.ms-task input[type="checkbox"]{margin-top:3px;flex-shrink:0;cursor:pointer;}
.ms-task-done{opacity:0.55;}
.ms-task-done>span,.ms-task-done>strong,.ms-task-done>em{text-decoration:line-through;}
.ms-preview-content blockquote{border-left:3px solid var(--SmartThemeQuoteColor,var(--ms-accent));background:var(--SmartThemeBlurTintColor,rgba(var(--ms-accent-rgb),0.05));padding:5px 10px;margin:0.3em 0;color:var(--SmartThemeQuoteColor,#999);font-style:italic;border-radius:0 4px 4px 0;}
.ms-preview-content li{margin-left:18px;margin-bottom:0;padding:0;line-height:1.6;}
.ms-preview-content code.ms-ic{background:var(--SmartThemeBlurTintColor,rgba(128,128,128,0.2));color:var(--SmartThemeEmColor,var(--ms-accent));border:1px solid var(--SmartThemeBorderColor,rgba(128,128,128,0.3));padding:1px 5px;border-radius:3px;font-size:12px;word-break:break-all;}
.ms-preview-content pre.ms-codeblock{background:var(--SmartThemeBlurTintColor,rgba(0,0,0,0.3));border:1px solid var(--SmartThemeBorderColor,#444);box-shadow:inset 0 0 10px var(--SmartThemeShadowColor,transparent);border-radius:6px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-size:12px;line-height:1.5;}
.ms-preview-content pre.ms-codeblock code{color:var(--SmartThemeBodyColor,#ccc);font-family:Consolas,"Courier New",monospace;white-space:pre-wrap;word-break:break-word;background:none;border:none;padding:0;border-radius:0;font-size:12px;}
.ms-details{margin:4px 0;}
.ms-summary{padding:2px 0px;cursor:pointer;font-weight:600;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);transition:background 0.15s;user-select:none;}
.ms-summary::marker{color:var(--ms-accent);}
.ms-summary::-webkit-details-marker{color:var(--ms-accent);}
.ms-summary:hover{opacity:0.8;}
.ms-details-body{padding:2px 0 2px 16px;line-height:1.7;}
.ms-details-body>:first-child{margin-top:0!important;}
.ms-pv-meta{flex:1;display:flex;flex-wrap:wrap;gap:4px;align-items:center;min-width:0;}
.ms-pv-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;color:var(--SmartThemeQuoteColor,#999);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);white-space:nowrap;}
.ms-pv-chip i{font-size:9px;flex-shrink:0;}
.ms-preview-actions{display:flex;gap:4px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-pa{padding:5px 12px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s;display:flex;align-items:center;gap:5px;}
.ms-pa:hover{background:rgba(255,255,255,0.06);}
.ms-pa.starred{color:var(--ms-accent);}
.ms-pa.danger:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-preview-send{display:flex;gap:4px;padding:8px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;}
.ms-send-btn{flex:1;padding:8px 4px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.03);color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;text-align:center;transition:background 0.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
.ms-send-btn:hover{background:rgba(255,255,255,0.08);}
.ms-send-btn i{margin-right:3px;}
.ms-form{padding:12px 14px;display:flex;flex-direction:column;gap:10px;}
.ms-form-edit{padding:10px 14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;flex:1;}
.ms-form-edit::-webkit-scrollbar{width:5px;}
.ms-form-edit::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-form-title{font-size:14px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-form-row{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.ms-field{display:flex;flex-direction:column;gap:3px;}
.ms-field label{font-size:12px;color:var(--SmartThemeQuoteColor,#888);font-weight:500;}
.ms-field input,.ms-field select,.ms-field textarea{padding:7px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:13px;font-family:inherit;outline:none;width:100%;box-sizing:border-box;}
.ms-field input,.ms-field select{height:33px;}
.ms-field input:focus,.ms-field select:focus,.ms-field textarea:focus{border-color:var(--SmartThemeQuoteColor,#777);}
.ms-field textarea{min-height:180px;max-height:60vh;resize:vertical;line-height:1.6;border-radius:0 0 8px 8px;overflow-y:auto;width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;}
.ms-content-field{position:relative!important;}
.ms-edit-scroll-top{position:absolute;bottom:10px;right:14px;width:28px;height:28px;border-radius:50%;background:transparent;border:none;color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:10;opacity:0.4;transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-edit-scroll-top:hover{background:rgba(var(--ms-accent-rgb,201,149,122),0.15);opacity:1;}
.ms-edit-scroll-top.visible{display:flex;}
.ms-md-toolbar{display:flex;gap:2px;padding:2px 3px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;border-radius:8px 8px 0 0;flex-wrap:wrap;flex-shrink:0;}
.ms-md-btn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;border-radius:4px;font-size:12px;display:flex;align-items:center;justify-content:center;transition:background 0.12s,color 0.12s;}
.ms-md-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-btn.active{background:rgba(var(--ms-accent-rgb),0.2);color:var(--ms-accent);}
.ms-md-sep{width:1px;height:18px;background:var(--SmartThemeBorderColor,#444);margin:0 2px;flex-shrink:0;}
.ms-char-count{font-size:11px;color:var(--SmartThemeQuoteColor,#666);text-align:right;padding:2px 4px;flex-shrink:0;}
.ms-form-btns{display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;}
.ms-btn{padding:8px 20px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;transition:background 0.15s;}
.ms-btn:hover{background:rgba(255,255,255,0.06);}
.ms-btn.primary{background:var(--SmartThemeQuoteColor,#555);color:var(--SmartThemeBodyColor,#eee);border-color:var(--SmartThemeQuoteColor,#555);}
.ms-btn.primary:hover{filter:brightness(1.15);}
.ms-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-tag-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex-shrink:0;max-height:80px;overflow-y:auto;}
.ms-tag-toggle{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px solid var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#888);background:transparent;transition:all 0.15s;user-select:none;}
.ms-tag-toggle:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-tag-toggle.active{color:#fff;border-color:transparent;}
.ms-tag-toggle .ms-tag-x{margin-left:2px;font-size:9px;opacity:0.6;}
.ms-add-tag-btn{padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px dashed var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#666);background:transparent;}
.ms-add-tag-btn:hover{border-color:var(--SmartThemeQuoteColor,#888);color:var(--SmartThemeBodyColor,#aaa);}
.ms-filter-panel{padding:8px 12px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);display:none;flex-direction:column;gap:6px;flex-shrink:0;max-height:30vh;overflow-y:auto;}
.ms-filter-panel.open{display:flex;}
.ms-filter-section{font-size:10px;color:var(--SmartThemeQuoteColor,#666);font-weight:600;text-transform:uppercase;margin-top:2px;}
.ms-gitem{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-gitem-color{width:16px;height:16px;border-radius:50%;flex-shrink:0;cursor:pointer;border:2px solid transparent;}
.ms-gitem-color:hover{border-color:rgba(255,255,255,0.3);}
.ms-gitem-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-gitem-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#666);}
.ms-gitem-btn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-gitem-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-gitem-btn.danger:hover{color:var(--ms-danger);}
.ms-gitem.ms-gitem-selected{background:rgba(var(--ms-accent-rgb),0.10);}
.ms-gitem-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-gitem.ms-gitem-selected .ms-gitem-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-color-picker{display:flex;gap:5px;flex-wrap:wrap;padding:8px 14px;}
.ms-color-opt{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;}
.ms-color-opt:hover{border-color:rgba(255,255,255,0.4);}
.ms-color-opt.selected{border-color:#fff;}
.ms-color-custom{background:conic-gradient(from 45deg,hsl(0,55%,68%),hsl(45,55%,68%),hsl(90,55%,68%),hsl(150,55%,68%),hsl(210,55%,68%),hsl(270,55%,68%),hsl(330,55%,68%),hsl(360,55%,68%))!important;position:relative;overflow:hidden;box-shadow:inset 0 0 2px rgba(0,0,0,0.3);}
.ms-color-custom input[type="color"]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;margin:0;}
.ms-color-custom::after{content:"+";color:#fff;font-size:13px;font-weight:bold;text-shadow:0 0 3px rgba(0,0,0,0.7);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;line-height:1;}
.ms-color-custom.selected::after{content:"✓";}
.ms-color-inline{display:flex;gap:5px;flex-wrap:wrap;padding:6px 14px 6px 50px;border-bottom:1px solid rgba(255,255,255,0.03);background:rgba(255,255,255,0.02);}
.ms-check-item{display:flex;align-items:center;gap:8px;padding:2px 14px;cursor:pointer;transition:background 0.12s;font-size:13px;}
.ms-check-item:hover{background:rgba(255,255,255,0.03);}
.ms-export-opts-tight{display:flex;flex-direction:column;gap:2px;}
.ms-import-opt{padding:12px 14px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;transition:background 0.15s,border-color 0.15s;margin-bottom:6px;}
.ms-import-opt:hover{background:rgba(255,255,255,0.04);border-color:var(--SmartThemeQuoteColor,#666);}
.ms-import-opt-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);}
.ms-import-opt-desc{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;}
.ms-dropdown{position:absolute;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:5002;min-width:140px;padding:4px 0;display:none;max-height:60vh;overflow-y:auto;}
.ms-dropdown::-webkit-scrollbar{width:4px;}
.ms-dropdown::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-dropdown-item{padding:7px 14px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:background 0.12s;white-space:nowrap;}
.ms-dropdown-item:hover{background:rgba(255,255,255,0.06);}
.ms-dropdown-item.active{color:var(--ms-accent);}
.ms-batch-tag-item{display:flex;align-items:center;gap:8px;padding:6px 12px;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-batch-tag-item:last-child{border-bottom:none;}
.ms-batch-tag-info{flex:1;display:flex;align-items:center;gap:6px;min-width:0;}
.ms-batch-tag-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;}
.ms-batch-tag-btn{width:24px;height:24px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px;transition:background 0.12s;flex-shrink:0;}
.ms-batch-tag-btn:hover{background:rgba(255,255,255,0.08);}
.ms-batch-tag-btn.add-btn:hover{color:var(--ms-success);border-color:var(--ms-success);}
.ms-batch-tag-btn.rm-btn:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-qp-item{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-qp-header{display:flex;align-items:center;padding:8px 14px;cursor:pointer;gap:8px;transition:background 0.12s;}
.ms-qp-header:hover{background:rgba(255,255,255,0.03);}
.ms-qp-header i.ms-qp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-qp-header i.ms-qp-arrow.open{transform:rotate(90deg);}
.ms-qp-header .ms-qp-title{flex:1;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-body{display:none;padding:6px 14px 10px 36px;font-size:12px;color:var(--SmartThemeQuoteColor,#999);line-height:1.5;overflow-wrap:break-word;word-break:break-word;}
.ms-qp-body.open{display:block;}
.ms-qp-insert{margin-top:6px;padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;}
.ms-qp-insert:hover{background:rgba(255,255,255,0.06);}
.ms-qp-popup{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#444);border-top:none;align-items:center;flex-shrink:0;max-height:120px;overflow-y:auto;}
.ms-qp-popup::-webkit-scrollbar{width:4px;}
.ms-qp-popup::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
@media(max-width:768px){.ms-qp-chip{padding:3px 8px;font-size:11px;max-width:140px;}}
.ms-qp-chip{padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.04);color:var(--SmartThemeBodyColor,#ccc);border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s,border-color 0.15s,color 0.15s;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-chip:hover{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-qp-chip:active{transform:scale(0.95);}
.ms-qp-popup-manage{font-size:11px;color:var(--SmartThemeQuoteColor,#777);cursor:pointer;margin-left:auto;white-space:nowrap;text-decoration:none;transition:color 0.15s;}
.ms-qp-popup-manage:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-imp-preview{padding:8px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:8px;margin:6px 0;}
.ms-imp-preview-title{font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:6px;}
.ms-imp-preview-list{font-size:11px;color:var(--SmartThemeQuoteColor,#999);line-height:1.6;}
.ms-imp-preview-list span{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;color:#fff;margin:1px 2px;}
.ms-exp-group-toggle{display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-exp-group-toggle:hover{background:rgba(255,255,255,0.03);}
.ms-exp-group-toggle i.ms-exp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-exp-group-toggle i.ms-exp-arrow.open{transform:rotate(90deg);}
.ms-exp-group-body{display:none;padding:4px 14px 8px 40px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.6;max-height:150px;overflow-y:auto;}
.ms-exp-group-body.open{display:block;}
.ms-exp-group-body::-webkit-scrollbar{width:4px;}
.ms-exp-group-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-exp-prompt-item{padding:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-reorder-item{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.12s;}
.ms-reorder-item:hover{background:rgba(255,255,255,0.03);}
.ms-reorder-item.ms-drag-over{box-shadow:inset 0 2px 0 0 var(--ms-accent);}
.ms-reorder-grip{cursor:grab;color:var(--SmartThemeQuoteColor,#555);font-size:12px;flex-shrink:0;padding:4px;touch-action:none;}
.ms-reorder-grip:active{cursor:grabbing;}
.ms-reorder-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-reorder-arrows{display:flex;gap:2px;flex-shrink:0;}
.ms-reorder-arrows button{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-reorder-arrows button:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-history-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.12s;}
.ms-history-item:hover{background:rgba(255,255,255,0.04);}
.ms-history-info{flex:1;min-width:0;}
.ms-history-title{font-size:12px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-history-date{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;}
.ms-history-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.ms-history-actions{display:flex;gap:2px;flex-shrink:0;}
.ms-diff-header{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-diff-label{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
.ms-diff-label.old{background:rgba(238,85,85,0.10);color:#e88;}
.ms-diff-label.new{background:rgba(92,184,92,0.10);color:#7dce7d;}
.ms-diff-meta{padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-del-text{color:#e88;text-decoration:line-through;}
.ms-diff-add-text{color:#7dce7d;}
.ms-diff-stats{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;flex-wrap:wrap;}
.ms-diff-stat-add{color:#7dce7d;}
.ms-diff-stat-del{color:#e88;}
.ms-diff-stat-same{color:var(--SmartThemeQuoteColor,#888);}
.ms-diff-toggle{padding:2px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeQuoteColor,#888);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;margin-left:auto;transition:background 0.15s,color 0.15s;}
.ms-diff-toggle:hover{background:rgba(255,255,255,0.06);color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-toggle.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-diff-body{padding:0;font-size:12px;line-height:1.7;}
.ms-diff-line{display:flex;padding:1px 14px;min-height:22px;align-items:flex-start;transition:background 0.1s;}
.ms-diff-line.add{background:rgba(92,184,92,0.06);}
.ms-diff-line.del{background:rgba(238,85,85,0.06);}
.ms-diff-line.add:hover{background:rgba(92,184,92,0.12);}
.ms-diff-line.del:hover{background:rgba(238,85,85,0.12);}
.ms-diff-sign{width:20px;flex-shrink:0;text-align:center;font-weight:700;font-size:13px;line-height:1.7;user-select:none;}
.ms-diff-line.add .ms-diff-sign{color:#7dce7d;}
.ms-diff-line.del .ms-diff-sign{color:#e88;}
.ms-diff-line.same .ms-diff-sign{color:transparent;}
.ms-diff-text{flex:1;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;}
.ms-diff-line.add .ms-diff-text{color:#7dce7d;}
.ms-diff-line.del .ms-diff-text{color:#e88;text-decoration:line-through;opacity:0.8;}
.ms-diff-line.same .ms-diff-text{color:var(--SmartThemeBodyColor,#ccc);opacity:0.45;}
.ms-diff-body.ms-diff-changes-only .ms-diff-line.same{display:none;}
#${PANEL_ID} input[type="checkbox"]{-webkit-appearance:none;appearance:none;width:16px;height:16px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;background:transparent;cursor:pointer;position:relative;flex-shrink:0;transition:all 0.15s;vertical-align:middle;}
#${PANEL_ID} input[type="checkbox"]:checked{background:var(--ms-accent);border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]::before{content:none!important;}
#${PANEL_ID} input[type="checkbox"]::after{content:none!important;}
#${PANEL_ID} input[type="checkbox"]:checked::after{content:"\\2713"!important;position:absolute!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;color:#fff!important;font-size:10px!important;font-weight:bold!important;line-height:1!important;}#${PANEL_ID} input[type="checkbox"]:hover{border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]:disabled{opacity:0.4;cursor:default;}
#${PANEL_ID} input[type="checkbox"]:disabled:hover{border-color:var(--SmartThemeBorderColor,#555);}
#${PANEL_ID}.ms-drag-hover::before{content:"";position:absolute;inset:0;background:rgba(var(--ms-accent-rgb),0.08);border:2px dashed var(--ms-accent);border-radius:10px;z-index:5010;pointer-events:none;}
#${PANEL_ID}.ms-drag-hover::after{content:"\\f56f";font-family:"Font Awesome 6 Free";font-weight:900;position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);color:var(--ms-accent);font-size:32px;z-index:5011;pointer-events:none;opacity:0.7;}
.ms-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;}
.ms-stats-card{background:rgba(255,255,255,0.03);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.ms-stats-card .ms-stat-value{font-size:24px;font-weight:700;color:var(--SmartThemeBodyColor,#eee);line-height:1;}
.ms-stats-card .ms-stat-label{font-size:10px;color:var(--SmartThemeQuoteColor,#888);text-transform:uppercase;letter-spacing:0.05em;}
.ms-stats-card .ms-stat-icon{font-size:16px;margin-bottom:2px;opacity:0.5;}
.ms-stats-section{padding:10px 14px 4px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#666);text-transform:uppercase;letter-spacing:0.03em;}
.ms-stats-rank{padding:0 14px;}
.ms-stats-rank-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-stats-rank-item:last-child{border-bottom:none;}
.ms-stats-rank-pos{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.ms-stats-rank-pos.gold{background:rgba(255,215,0,0.15);color:#ffd700;}
.ms-stats-rank-pos.silver{background:rgba(192,192,192,0.12);color:#c0c0c0;}
.ms-stats-rank-pos.bronze{background:rgba(205,127,50,0.12);color:#cd7f32;}
.ms-stats-rank-pos.normal{background:rgba(255,255,255,0.05);color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-rank-info{flex:1;min-width:0;}
.ms-stats-rank-name{font-size:12px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-stats-rank-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#777);margin-top:1px;}
.ms-stats-rank-bar-wrap{width:60px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;flex-shrink:0;}
.ms-stats-rank-bar{height:100%;border-radius:3px;background:var(--ms-accent);transition:width 0.4s ease;}
.ms-stats-rank-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;min-width:28px;text-align:right;}
.ms-stats-group-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 14px 4px;}
.ms-stats-group-seg{height:100%;transition:width 0.4s ease;min-width:2px;}
.ms-stats-group-legend{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-group-legend-item{display:flex;align-items:center;gap:4px;}
.ms-stats-group-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.ms-stats-empty{text-align:center;padding:20px 14px;color:var(--SmartThemeQuoteColor,#555);font-size:12px;font-style:italic;}
.ms-series-group{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-series-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-series-check.ms-sc-all{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-series-check.ms-sc-some{border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-series-header{display:flex;align-items:center;padding:6px 14px 6px 10px;cursor:pointer;gap:6px;transition:background 0.12s;}
.ms-series-header:hover{background:rgba(255,255,255,0.03);}
.ms-series-arrow{font-size:9px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:10px;flex-shrink:0;}
.ms-series-arrow.open{transform:rotate(90deg);}
.ms-series-title{flex:1;font-size:12px;color:var(--SmartThemeBodyColor,#ddd);font-weight:500;}
.ms-series-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;}
.ms-series-body{display:none;border-left:2px solid rgba(var(--ms-accent-rgb),0.2);margin-left:14px;}
.ms-series-body.open{display:block;}
.ms-find-bar{display:flex;align-items:center;gap:4px;padding:4px 6px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;flex-shrink:0;flex-wrap:wrap;}
.ms-find-input{flex:1;padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:4px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;font-family:inherit;outline:none;min-width:60px;}
.ms-find-input:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-find-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);white-space:nowrap;min-width:32px;text-align:center;flex-shrink:0;}
.ms-find-count.no-match{color:var(--ms-danger);}
#${PANEL_ID}.ms-focus-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-focus-mode .ms-header .ms-count{display:none;}
#${PANEL_ID}.ms-focus-mode .ms-body{overflow:hidden!important;padding:0!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit{padding:6px 10px!important;flex:1!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;min-height:0!important;gap:6px!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-field:not(.ms-content-field){display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-form-row{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field{flex:1!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field>label{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit textarea{flex:1!important;min-height:0!important;max-height:none!important;resize:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-edit-preview-pane{flex:1!important;min-height:0!important;max-height:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-char-count{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-form-btns{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode #ms-footer{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-filter-panel{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-toolbar .ms-form-title{display:none;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode{width:440px!important;max-width:92vw!important;height:auto!important;max-height:none!important;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-body,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-toolbar,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-footer,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-filter-panel{display:none!important;}
.ms-scroll-top{position:absolute;bottom:44px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);color: var(--ms-accent, var(--SmartThemeBodyColor, #aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-scroll-top:hover{background:rgba(255,255,255,0.1);}
.ms-scroll-top.visible{display:flex;}
.ms-sub-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ms-accent);margin-left:3px;vertical-align:middle;animation:ms-sub-pulse 2s ease-in-out infinite;}
@keyframes ms-sub-pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
#${PANEL_ID}.ms-collapsed .ms-scroll-top{display:none!important;}
@media(max-width:768px){
  #${PANEL_ID}{width:92vw!important;left:50%!important;transform:translateX(-50%)!important;}
  .ms-batch-bar .ms-batch-btn .ms-btn-label{display:none!important;}
  .ms-batch-bar .ms-batch-count{font-size:11px;}
  .ms-batch-bar{gap:3px;}
  .ms-batch-btn{padding:4px 8px;font-size:10px;}
  .ms-footer-btns{gap:5px;}.ms-footer-btns a{font-size:0px;}.ms-footer-btns a i{font-size:12px;}
  #${PANEL_ID}.ms-focus-mode{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;top:0!important;left:0!important;transform:none!important;border-radius:0!important;}
}
@media(max-width:500px){.ms-search{flex:1 1 100%;}}
.ms-switch{position:relative;display:inline-block;width:28px;height:14px;flex-shrink:0;vertical-align:middle;}
.ms-switch input{opacity:0;width:0;height:0;position:absolute;}
.ms-switch-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--SmartThemeBorderColor,#555);border-radius:14px;transition:0.25s;}
.ms-switch-slider:before{content:"";position:absolute;height:10px;width:10px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:0.25s;}
.ms-switch input:checked+.ms-switch-slider{background:var(--ms-accent);}
.ms-switch input:checked+.ms-switch-slider:before{transform:translateX(14px);}
.ms-filter-mode-btn{padding:1px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(var(--ms-accent-rgb),0.08);color:var(--ms-accent);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;transition:all 0.15s;line-height:1.4;}
.ms-filter-mode-btn:hover{background:rgba(var(--ms-accent-rgb),0.18);border-color:var(--ms-accent);}
.ms-inject-indicator{display:none;align-items:center;gap:4px;font-size:11px;color:var(--ms-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;flex-shrink:1;min-width:0;}
.ms-inject-indicator.visible{display:inline-flex;cursor:pointer;}
.ms-inject-indicator i{font-size:10px;flex-shrink:0;}
#${PANEL_ID}.ms-collapsed .ms-inject-indicator{max-width:140px;}
.ms-send-btn.ms-inject-active{background:rgba(var(--ms-accent-rgb),0.18)!important;border-color:var(--ms-accent)!important;color:var(--ms-accent)!important;box-shadow:inset 0 0 0 1px rgba(var(--ms-accent-rgb),0.3);}
.ms-rpool-group{border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-rpool-group-header{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;transition:background 0.12s;}
.ms-rpool-group-header:hover{background:rgba(255,255,255,0.03);}
.ms-rpool-group-body{padding:4px 8px 8px 18px;border-left:2px solid rgba(var(--ms-accent-rgb),0.15);margin-left:18px;}
.ms-rpool-item{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;cursor:pointer;}
.ms-rpool-item.disabled{opacity:0.35;pointer-events:none;}
.ms-rpool-series-label{display:flex;align-items:center;gap:5px;padding:5px 0 2px;font-size:12px;font-weight:500;cursor:pointer;user-select:none;}
.ms-rpool-series-items{padding-left:12px;}
.ms-rpool-excluded{opacity:0.4;text-decoration:line-through;}
.ms-inject-settings-row{display:flex;gap:8px;padding:6px 14px;align-items:center;flex-wrap:wrap;}
.ms-inject-radio{display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:all 0.15s;}
.ms-inject-radio:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-inject-radio.active{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-inject-radio input[type="radio"]{display:none;}
.ms-macro-info{padding:10px 14px;margin:6px 14px;background:rgba(var(--ms-accent-rgb),0.04);border:1px solid rgba(var(--ms-accent-rgb),0.12);border-radius:8px;font-size:11px;line-height:2;}
.ms-macro-info-title{font-weight:600;color:var(--SmartThemeBodyColor,#ddd);margin-bottom:2px;font-size:12px;}
.ms-macro-info code{background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);padding:2px 7px;border-radius:4px;font-size:11px;font-family:Consolas,"Courier New",monospace;border:1px solid rgba(var(--ms-accent-rgb),0.2);letter-spacing:0.3px;}
.ms-macro-info .ms-macro-desc{color:var(--SmartThemeQuoteColor,#999);margin-left:6px;}
`;
  }

  function getPanelHTML() {
    return `<div id="${PANEL_ID}">
      <div class="ms-header" id="ms-header">
        <i class="fa-solid fa-grip ms-drag-handle"></i>
        <span class="ms-title" id="ms-title">小剧场</span>
        <span class="ms-inject-indicator" id="ms-inject-indicator"></span><span class="ms-count" id="ms-count"></span>
        <button class="ms-hbtn" id="ms-btn-collapse" title="收起"><i class="fa-solid fa-window-minimize"></i></button><button class="ms-hbtn" id="ms-btn-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="ms-toolbar" id="ms-toolbar"></div>
      <div class="ms-filter-panel" id="ms-filter-panel"></div>
      <div class="ms-body" id="ms-body"></div>
      <div class="ms-footer" id="ms-footer"></div>
      <div class="ms-dropdown" id="ms-dropdown"></div>
      <input type="file" id="ms-file-input" accept=".json" style="display:none;"><button class="ms-scroll-top" id="ms-scroll-top" title="回到顶部"><i class="fa-solid fa-angle-up"></i></button></div>`;
  }

  function renderView() {
    if (bindReorderDrag._cleanup) {
      bindReorderDrag._cleanup();
      bindReorderDrag._cleanup = null;
    }
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    $p.find("#ms-count").text(data.prompts.length + " 条");
    $p.find("#ms-filter-panel").removeClass("open").empty();
    const v = currentView();
    const map = {
      list: renderList,
      group: renderGroup,
      starred: renderStarred,
      recent: renderRecent,
      preview: renderPreview,
      edit: renderEdit,
      groups: renderGroups,
      "group-edit": renderGroupEdit,
      "tag-manage": renderTagManage,
      export: renderExport,
      "export-single-options": renderExportSingleOptions,
      "export-group-options": renderExportGroupOptions,
      "export-batch-options": renderExportBatchOptions,
      "import-confirm": renderImportConfirm,
      "quick-phrases": renderQuickPhrases,
      "quick-phrase-edit": renderQuickPhraseEdit,
      settings: renderSettings,
      stats: renderStats,
      "reorder-groups": renderReorderGroups,
      "reorder-prompts": renderReorderPrompts,
      "reorder-tags": renderReorderTags,
      history: renderHistory,
      "history-diff": renderHistoryDiff,
      "history-list": renderHistoryList,
      subscriptions: renderSubscriptions,
      "subscription-add": renderSubscriptionAdd,
      "subscription-detail": renderSubscriptionDetail,
      "random-pool": renderRandomPool,
    };
    if (map[v.name]) map[v.name](v);
    if ($p.find("#ms-footer").css("display") === "block")
      $p.find("#ms-footer").css("display", "flex");
    var $scrollBody = $p.find("#ms-body");
    if (v._expandedSeries && v._expandedSeries.length) {
      v._expandedSeries.forEach(function (sid) {
        var $sb = $p.find("#" + sid);
        if ($sb.length) {
          $sb.addClass("open");
          var $arrow = $sb.prev(".ms-series-header").find(".ms-series-arrow");
          if ($arrow.length) {
            $arrow[0].style.transition = "none";
            $arrow.addClass("open");
          }
        }
      });
      requestAnimationFrame(function () {
        $p.find(".ms-series-arrow").css("transition", "");
      });
    }
    if (
      v._filterPanelOpen &&
      (filterState.tags.length > 0 || filterState.groupId)
    ) {
      $p.find("#ms-filter-panel").html(buildFilterPanel()).addClass("open");
      bindFilterEvents($p);
    }
    if (v._savedScrollTop !== undefined && v._savedScrollTop > 0) {
      $scrollBody.scrollTop(v._savedScrollTop);
    } else {
      $scrollBody.scrollTop(0);
    }
    updateInjectIndicator();
    if (v._lastViewedId) {
      setTimeout(function () {
        var $card = $p.find('.ms-card[data-pid="' + v._lastViewedId + '"]');
        if ($card.length) {
          $card.addClass("ms-just-viewed");
          var cardRect = $card[0].getBoundingClientRect();
          var bodyRect = $scrollBody[0].getBoundingClientRect();
          var relativeTop = cardRect.top - bodyRect.top;
          var cardH = $card.outerHeight();
          var bodyH = $scrollBody.height();
          if (relativeTop < 0 || relativeTop + cardH > bodyH) {
            $scrollBody.scrollTop(
              $scrollBody.scrollTop() + relativeTop - bodyH * 0.3,
            );
          }
        }
        delete v._lastViewedId;
      }, 50);
    }
  }

  function renderBodyOnly() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    const v = currentView(),
      $body = $p.find("#ms-body");
    var _openSeries = [];
    $body.find(".ms-series-body.open").each(function () {
      _openSeries.push(this.id);
    });
    var _scrollTop = $body.scrollTop();
    if (v.name === "list") {
      $body.html(buildListBody());
      if (selectMode) {
        $p.find("#ms-footer").html(buildBatchFooter()).show();
      } else if (
        searchQuery ||
        filterState.tags.length > 0 ||
        filterState.groupId
      ) {
        var filteredList = sortPrompts(
          filterPrompts(searchPrompts(data.prompts, searchQuery)),
        );
        $p.find("#ms-footer")
          .html(
            "<span>找到 " +
              filteredList.length +
              " / " +
              data.prompts.length +
              " 条</span>",
          )
          .show();
      } else {
        $p.find("#ms-footer").html(buildListFooter()).show();
      }
    } else if (v.name === "group") {
      const list =
        v.groupId === "_ungrouped"
          ? getUngroupedPrompts()
          : getPromptsInGroup(v.groupId);
      let f = sortPrompts(filterPrompts(searchPrompts(list, searchQuery)));
      $body.html(
        f.length > 0
          ? renderGroupBodyWithSeries(f)
          : `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>`,
      );
      $p.find("#ms-footer")
        .html(
          selectMode
            ? buildBatchFooter()
            : `<span>${f.length}/${list.length} 条</span>` +
                (v.groupId !== "_ungrouped"
                  ? `<div class="ms-footer-btns"><a data-action="group-settings"><i class="fa-solid fa-gear"></i> 分组设置</a></div>`
                  : ``),
        )
        .show();
    } else if (v.name === "starred") {
      let f = sortPrompts(
        filterPrompts(searchPrompts(getStarredPrompts(), searchQuery)),
      );
      $body.html(
        f.length > 0
          ? renderPromptCards(f, true)
          : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`,
      );
      $p.find("#ms-footer")
        .html(
          selectMode ? buildBatchFooter() : `<span>${f.length} 条收藏</span>`,
        )
        .show();
    } else if (v.name === "recent") {
      const list = sortPrompts(
        filterPrompts(searchPrompts(getRecentPrompts(), searchQuery)),
      );
      $body.html(
        list.length > 0
          ? renderPromptCards(list, true)
          : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`,
      );
      $p.find("#ms-footer")
        .find("span:first")
        .text(list.length + " 条");
    }
    _openSeries.forEach(function (sid) {
      var $sb = $p.find("#" + sid);
      if ($sb.length) {
        $sb.addClass("open");
        var $arrow = $sb.prev(".ms-series-header").find(".ms-series-arrow");
        if ($arrow.length) {
          $arrow[0].style.transition = "none";
          $arrow.addClass("open");
        }
      }
    });
    if (_openSeries.length) {
      requestAnimationFrame(function () {
        $p.find(".ms-series-arrow").css("transition", "");
      });
    }
    $body.scrollTop(_scrollTop);
    if ($p.find("#ms-footer").css("display") === "block")
      $p.find("#ms-footer").css("display", "flex");
  }

  function buildBatchFooter() {
    const vis = getVisiblePromptIds();
    const allSelected =
      vis.length > 0 && vis.every((id) => selectedIds.has(id));
    const noneSelected = selectedIds.size === 0;
    const selIcon = allSelected
      ? "fa-solid fa-square-check"
      : noneSelected
        ? "fa-regular fa-square"
        : "fa-solid fa-square-minus";
    const selColor = noneSelected
      ? "var(--SmartThemeQuoteColor,#666)"
      : "var(--ms-accent)";
    const selLabel = allSelected ? " 取消" : " 全选";
    return `<div class="ms-batch-bar">
      <span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ${selectedIds.size}</span>
      <button class="ms-batch-btn" data-batch="selectall"><i class="${selIcon}" style="color:${selColor};"></i><span class="ms-btn-label">${selLabel}</span></button>
      <button class="ms-batch-btn" data-batch="move"><i class="fa-solid fa-folder-open"></i><span class="ms-btn-label"> 移动</span></button>
      <button class="ms-batch-btn" data-batch="tag"><i class="fa-solid fa-tags"></i><span class="ms-btn-label"> 标签</span></button>
      <button class="ms-batch-btn" data-batch="author"><i class="fa-solid fa-user-pen"></i><span class="ms-btn-label"> 作者</span></button>
      <button class="ms-batch-btn" data-batch="series"><i class="fa-solid fa-layer-group"></i><span class="ms-btn-label"> 系列</span></button>
      <button class="ms-batch-btn" data-batch="export"><i class="fa-solid fa-file-export"></i><span class="ms-btn-label"> 导出</span></button>
      <button class="ms-batch-btn danger" data-batch="delete"><i class="fa-solid fa-trash"></i><span class="ms-btn-label"> 删除</span></button>
    </div>`;
  }

  function buildListBody() {
    let html = "";
    if (searchQuery || filterState.tags.length > 0 || filterState.groupId) {
      let list = sortPrompts(
        filterPrompts(searchPrompts(data.prompts, searchQuery)),
      );
      if (list.length > 0) {
        html += `<div class="ms-section-label">${searchQuery ? "搜索" : "筛选"}结果 (${list.length})</div>`;
        if (
          !searchQuery &&
          filterState.groupId &&
          filterState.groupId !== "_ungrouped"
        ) {
          html += renderGroupBodyWithSeries(list);
        } else {
          html += renderPromptCards(list, true);
        }
      } else
        html = `<div class="ms-empty"><i class="fa-solid fa-magnifying-glass"></i>没有找到匹配的内容</div>`;
      return html;
    }
    const starred = getStarredPrompts();
    if (starred.length > 0)
      html += `<div class="ms-nav-item" data-nav="starred"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);"><i class="fa-solid fa-star"></i></div><div class="ms-nav-info"><div class="ms-nav-title">收藏</div></div><span class="ms-nav-cnt">${starred.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    const recent = getRecentPrompts();
    if (recent.length > 0)
      html += `<div class="ms-nav-item" data-nav="recent"><div class="ms-nav-icon" style="background:rgba(126,168,160,0.12);color:#7ea8a0;"><i class="fa-solid fa-clock-rotate-left"></i></div><div class="ms-nav-info"><div class="ms-nav-title">最近使用</div></div><span class="ms-nav-cnt">${recent.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    if (starred.length > 0 || recent.length > 0)
      html += '<div class="ms-divider"></div>';
    data.groups.forEach((g) => {
      const cnt = getPromptsInGroup(g.id).length;
      const noteH = g.note
        ? `<div class="ms-nav-note">${esc(g.note)}</div>`
        : "";
      const selCnt = selectMode
        ? [...selectedIds].filter((pid) => {
            const p = getPrompt(pid);
            return p && p.groupId === g.id;
          }).length
        : 0;
      const selBadge =
        selCnt > 0
          ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>`
          : "";
      var _gHasStage =
        (data.settings.stageSelectedIds || []).length > 0 &&
        data.prompts.some(function (pp) {
          return (
            (data.settings.stageSelectedIds || []).indexOf(pp.id) >= 0 &&
            pp.groupId === g.id
          );
        });
      html += `<div class="ms-nav-item${_gHasStage ? " ms-stage-injecting" : ""}" data-nav="group" data-gid="${g.id}"><div class="ms-nav-icon" style="background:${g.color}22;color:${g.color};"><i class="fa-solid fa-folder"></i></div><div class="ms-nav-info"><div class="ms-nav-title">${esc(g.name)}</div>${noteH}</div>${selBadge}<span class="ms-nav-cnt">${cnt}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    });
    const ungrouped = getUngroupedPrompts();
    if (ungrouped.length > 0) {
      const selCnt = selectMode
        ? [...selectedIds].filter((pid) => {
            const p = getPrompt(pid);
            return p && (!p.groupId || !getGroup(p.groupId));
          }).length
        : 0;
      const selBadge =
        selCnt > 0
          ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>`
          : "";
      html += `<div class="ms-nav-item" data-nav="group" data-gid="_ungrouped"><div class="ms-nav-icon" style="background:rgba(255,255,255,0.05);color:var(--SmartThemeQuoteColor,#888);"><i class="fa-solid fa-inbox"></i></div><div class="ms-nav-info"><div class="ms-nav-title">未分组</div></div>${selBadge}<span class="ms-nav-cnt">${ungrouped.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    }
    if (
      data.groups.length === 0 &&
      ungrouped.length === 0 &&
      starred.length === 0
    )
      html = `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>还没有小剧场<br>点击上方 + 新建</div>`;
    return html;
  }

  function buildListFooter() {
    var subDot =
      data.settings.subUpdatesPending > 0
        ? '<span class="ms-sub-dot"></span>'
        : "";
    var historyWarn = "";
    var hTotal = data.prompts.reduce(function (s, p) {
      return s + (p.history ? p.history.length : 0);
    }, 0);
    if (hTotal > 0) {
      var isWarn = data.settings.historyWarnEnabled && hTotal > 30;
      historyWarn =
        ' · <a data-action="history-list" style="color:' +
        (isWarn ? "var(--ms-danger)" : "var(--SmartThemeQuoteColor,#666)") +
        ';text-decoration:none;cursor:pointer;"' +
        (isWarn ? ' title="建议清理版本历史"' : "") +
        ">" +
        (isWarn ? "⚠" : "") +
        "历史" +
        hTotal +
        "条</a>";
    }
    return (
      "<span>" +
      data.prompts.length +
      " 条 · " +
      data.groups.length +
      " 组" +
      historyWarn +
      '</span><div class="ms-footer-btns"><a data-action="manage-groups"><i class="fa-solid fa-folder-open"></i>分组</a> <a data-action="manage-tags"><i class="fa-solid fa-tags"></i>标签</a> <a data-action="import"><i class="fa-solid fa-file-import"></i>导入</a> <a data-action="export"><i class="fa-solid fa-file-export"></i>导出</a> <a data-action="subscriptions"><i class="fa-solid fa-rss"></i>订阅' +
      subDot +
      '</a> <a data-action="settings"><i class="fa-solid fa-gear"></i>设置</a> </div>'
    );
  }

  function buildToolbar(opts) {
    let html = "";
    if (opts.back)
      html += `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button>`;
    if (opts.search !== false)
      html += `<div style="position:relative;flex:1;min-width:100px;display:flex;align-items:center;"><input class="ms-search" id="ms-search" type="text" placeholder="${opts.searchPlaceholder || "搜索..."}" value="${esc(searchQuery)}" style="flex:1;padding-right:24px;"><span id="ms-search-clear" style="position:absolute;right:8px;cursor:pointer;color:var(--SmartThemeQuoteColor,#666);font-size:11px;display:${searchQuery ? "block" : "none"};line-height:1;">×</span></div>`;
    html += `<div class="ms-toolbar-actions">`;
    if (opts.filter)
      html += `<button class="ms-tbtn" id="ms-btn-filter" title="筛选"><i class="fa-solid fa-filter"></i></button>`;
    if (opts.select)
      html += `<button class="ms-tbtn ${selectMode ? "active" : ""}" id="ms-btn-select" title="多选"><i class="fa-solid fa-check-double"></i></button>`;
    if (opts.sort)
      html += `<button class="ms-tbtn" id="ms-btn-sort" title="排序"><i class="fa-solid fa-arrow-down-short-wide"></i></button>`;
    if (opts.random)
      html += `<button class="ms-tbtn" id="ms-btn-random" title="随机抽取"><i class="fa-solid fa-dice"></i></button>`;
    if (opts.reorder)
      html += `<button class="ms-tbtn" id="ms-btn-reorder" title="调整顺序"><i class="fa-solid fa-arrows-up-down"></i></button>`;
    if (opts.exportGroup)
      html += `<button class="ms-tbtn" id="ms-btn-export-group" title="导出本组"><i class="fa-solid fa-file-export"></i></button>`;
    if (opts.add)
      html += `<button class="ms-tbtn" id="${opts.addId || "ms-btn-new"}" title="${opts.addTitle || "新建"}"><i class="fa-solid fa-plus"></i></button>`;
    html += `</div>`;
    if (opts.extra) html += opts.extra;
    return html;
  }

  function buildFilterPanel() {
    let html = "";
    if (data.settings.definedTags.length > 0) {
      var modeLabel =
        data.settings.filterTagMode === "and" ? "全部匹配" : "任一匹配";
      html += `<div class="ms-filter-section" style="display:flex;align-items:center;gap:6px;">标签筛选（可多选）<button class="ms-filter-mode-btn" id="ms-tag-mode-toggle">${modeLabel}</button></div><div class="ms-tag-row">`;
      data.settings.definedTags.forEach((t) => {
        const a = filterState.tags.includes(t.id);
        html += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-filter-tag="${t.id}" style="${a ? "background:" + t.color + ";" : ""}">${esc(t.name)}</span>`;
      });
      html += `</div>`;
    }
    html += `<div class="ms-filter-section">分组筛选</div><div class="ms-tag-row">`;
    html += `<span class="ms-tag-toggle ${!filterState.groupId ? "active" : ""}" data-filter-group="" style="${!filterState.groupId ? "background:#666;" : ""}">全部</span>`;
    data.groups.forEach((g) => {
      const a = filterState.groupId === g.id;
      html += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-filter-group="${g.id}" style="${a ? "background:" + g.color + ";" : ""}">${esc(g.name)}</span>`;
    });
    if (getUngroupedPrompts().length > 0) {
      const a = filterState.groupId === "_ungrouped";
      html += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-filter-group="_ungrouped" style="${a ? "background:#666;" : ""}">未分组</span>`;
    }
    html += `</div>`;
    return html;
  }

  function renderPromptCards(list, showGroupLabel) {
    if (list.length === 0)
      return `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无</div>`;
    let html = "";
    list.forEach((p) => {
      const starCls = p.starred ? "active" : "",
        starIcon = p.starred ? "fa-solid" : "fa-regular",
        isSel = selectedIds.has(p.id);
      const isStageTarget =
        (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
      const g = p.groupId ? getGroup(p.groupId) : null;
      var seriesAboveH = "";
      if (showGroupLabel) {
        var _metaParts = [];
        if (g) {
          _metaParts.push(
            '<span style="color:' +
              g.color +
              ';display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-folder" style="font-size:9px;"></i>' +
              (searchQuery ? highlightText(g.name, searchQuery) : esc(g.name)) +
              "</span>",
          );
        }
        if (p.series) {
          _metaParts.push(
            '<span style="color:var(--ms-accent);opacity:0.8;display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-layer-group" style="font-size:9px;"></i>' +
              (searchQuery
                ? highlightText(p.series, searchQuery)
                : esc(p.series)) +
              "</span>",
          );
        }
        if (_metaParts.length > 0) {
          seriesAboveH =
            '<div style="font-size:10px;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">' +
            _metaParts.join(
              '<span style="color:var(--SmartThemeQuoteColor,#555);margin:0 2px;">\u00b7</span>',
            ) +
            "</div>";
        }
      }
      const titleH = searchQuery
        ? highlightText(p.title, searchQuery)
        : esc(p.title);
      const prevH = searchQuery
        ? highlightText(
            getContextSnippet(p.content, searchQuery, 50),
            searchQuery,
          )
        : esc(truncate(p.content, 50));
      const pinH = p.pinned
        ? `<span class="ms-card-pin"><i class="fa-solid fa-thumbtack"></i></span>`
        : "";
      let tagsH = "";
      sortTagIds(p.tags || []).forEach((tid) => {
        const t = getTag(tid);
        if (t)
          tagsH += `<span class="ms-tag-chip ms-tag-chip-sm" style="background:${t.color};">${esc(t.name)}</span>`;
      });
      if (selectMode) {
        html += `<div class="ms-card ${isSel ? "selected" : ""}${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><div class="ms-card-check"><i class="fa-solid fa-check"></i></div>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div>`;
        if (tagsH) html += `<div class="ms-card-tags-row">${tagsH}</div>`;
        html += `</div>`;
      } else {
        html += `<div class="ms-card${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><span class="ms-card-star ${starCls}" data-pid="${p.id}"><i class="${starIcon} fa-star"></i></span>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div><div class="ms-card-quick"><button class="ms-card-qbtn" data-qaction="send" data-pid="${p.id}" title="填入输入框"><i class="fa-solid fa-right-to-bracket"></i></button><button class="ms-card-qbtn" data-qaction="send-gen" data-pid="${p.id}" title="发送并生成"><i class="fa-solid fa-paper-plane"></i></button></div><i class="fa-solid fa-angle-right" style="color:var(--SmartThemeQuoteColor,#555);font-size:10px;flex-shrink:0;"></i>`;
        if (tagsH) html += `<div class="ms-card-tags-row">${tagsH}</div>`;
        html += `</div>`;
      }
    });
    return html;
  }

  function renderGroupBodyWithSeries(list) {
    if (searchQuery) return renderPromptCards(list, false);
    var rendered = new Set();
    var html = "";
    list.forEach(function (p) {
      if (rendered.has(p.id)) return;
      if (p.series && p.series.trim()) {
        var seriesName = p.series.trim();
        var seriesItems = list.filter(function (q) {
          return (
            q.series && q.series.trim() === seriesName && !rendered.has(q.id)
          );
        });
        if (seriesItems.length > 1) {
          var sid =
            "ms-series-" +
            simpleHash(
              seriesName + "||" + (p.groupId || "") + "||" + seriesItems.length,
            );
          var headerExtra = "";
          if (selectMode) {
            var allSel = seriesItems.every(function (q) {
              return selectedIds.has(q.id);
            });
            var someSel =
              !allSel &&
              seriesItems.some(function (q) {
                return selectedIds.has(q.id);
              });
            var cIcon = allSel
              ? "fa-solid fa-square-check"
              : someSel
                ? "fa-solid fa-square-minus"
                : "fa-regular fa-square";
            var cColor =
              allSel || someSel
                ? "var(--ms-accent)"
                : "var(--SmartThemeQuoteColor,#666)";
            var scCls = allSel ? " ms-sc-all" : someSel ? " ms-sc-some" : "";
            headerExtra =
              '<div class="ms-series-check' +
              scCls +
              "\" data-series-ids='" +
              JSON.stringify(
                seriesItems.map(function (q) {
                  return q.id;
                }),
              ) +
              "'><i class=\"fa-solid " +
              (someSel && !allSel ? "fa-minus" : "fa-check") +
              '"></i></div>';
          }
          var _seriesHasStage =
            (data.settings.stageSelectedIds || []).length > 0 &&
            seriesItems.some(function (si) {
              return (data.settings.stageSelectedIds || []).indexOf(si.id) >= 0;
            });
          html +=
            '<div class="ms-series-group' +
            (_seriesHasStage ? " ms-stage-injecting" : "") +
            '"><div class="ms-series-header" data-series-id="' +
            sid +
            '">' +
            headerExtra +
            '<i class="fa-solid fa-angle-right ms-series-arrow"></i>' +
            '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:13px;"></i><span class="ms-series-title">' +
            esc(seriesName) +
            '</span><span class="ms-series-cnt">' +
            seriesItems.length +
            " 条</span></div>" +
            '<div class="ms-series-body" id="' +
            sid +
            '">' +
            renderPromptCards(seriesItems, false) +
            "</div></div>";
          seriesItems.forEach(function (q) {
            rendered.add(q.id);
          });
        } else {
          if (p.series && p.series.trim()) {
            var fullSeriesCount = data.prompts.filter(function (q) {
              return (
                q.series &&
                q.series.trim() === seriesName &&
                q.groupId === p.groupId
              );
            }).length;
            if (fullSeriesCount > 1) {
              var sid2 =
                "ms-series-" +
                simpleHash(seriesName + "||" + (p.groupId || "") + "||_f");
              var headerExtra2 = "";
              if (selectMode) {
                var isSel2 = selectedIds.has(p.id);
                var cIcon2 = isSel2
                  ? "fa-solid fa-square-check"
                  : "fa-regular fa-square";
                var scCls2 = isSel2 ? " ms-sc-all" : "";
                headerExtra2 =
                  '<div class="ms-series-check' +
                  scCls2 +
                  "\" data-series-ids='" +
                  JSON.stringify([p.id]) +
                  '\'><i class="fa-solid fa-check"></i></div>';
              }
              var _singleHasStage =
                (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
              html +=
                '<div class="ms-series-group' +
                (_singleHasStage ? " ms-stage-injecting" : "") +
                '"><div class="ms-series-header" data-series-id="' +
                sid2 +
                '">' +
                headerExtra2 +
                '<i class="fa-solid fa-angle-right ms-series-arrow open"></i>' +
                '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:12px;"></i>' +
                '<span class="ms-series-title">' +
                esc(seriesName) +
                "</span>" +
                '<span class="ms-series-cnt" style="opacity:0.6;">筛选 1/' +
                fullSeriesCount +
                "</span>" +
                '</div><div class="ms-series-body open" id="' +
                sid2 +
                '">' +
                renderPromptCards([p], false) +
                "</div></div>";
              rendered.add(p.id);
              return;
            }
          }
          html += renderPromptCards([p], false);
          rendered.add(p.id);
        }
      } else {
        html += renderPromptCards([p], false);
        rendered.add(p.id);
      }
    });
    return html;
  }

  function showSortDropdown($p) {
    const $dd = $p.find("#ms-dropdown");
    if ($dd.is(":visible")) {
      closeActiveDropdown();
      return;
    }
    const modes = [
      ["custom", "自定义顺序"],
      ["created-desc", "最新创建"],
      ["created-asc", "最早创建"],
      ["edited-desc", "最新编辑"],
      ["edited-asc", "最早编辑"],
      ["name-asc", "名称 A→Z"],
      ["name-desc", "名称 Z→A"],
      ["used-desc", "最近使用"],
      ["used-asc", "最早使用"],
      ["usage-desc", "使用最多"],
      ["usage-asc", "使用最少"],
    ];
    $dd.html(
      modes
        .map(
          (m) =>
            `<div class="ms-dropdown-item${(data.settings.sortMode || "created-desc") === m[0] ? " active" : ""}" data-sort="${m[0]}">${m[1]}</div>`,
        )
        .join(""),
    );
    $dd.css({ top: 80, right: 14, left: "auto", bottom: "auto" }).show();
    $p.css("overflow", "visible");
    setupOutsideClickClose($p);
    $dd.off("click").on("click.sort", ".ms-dropdown-item", function () {
      data.settings.sortMode = $(this).data("sort");
      saveData();
      closeActiveDropdown();
      $dd.hide();
      renderBodyOnly();
    });
  }

  function showMoveDropdown($p) {
    const $dd = $p.find("#ms-dropdown");
    if ($dd.is(":visible")) {
      closeActiveDropdown();
      return;
    }
    let html = `<div class="ms-dropdown-item" data-moveto="">未分组</div>`;
    data.groups.forEach((g) => {
      html += `<div class="ms-dropdown-item" data-moveto="${g.id}">${esc(g.name)}</div>`;
    });
    html += `<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>`;
    html += `<div class="ms-dropdown-item" data-moveto="_new" style="color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建分组</div>`;
    const panelH = $p[0].getBoundingClientRect().height;
    const ddMaxH = Math.max(150, panelH - 80);
    $dd
      .html(html)
      .css({
        bottom: 40,
        right: 14,
        left: "auto",
        top: "auto",
        maxHeight: ddMaxH + "px",
      })
      .show();
    $p.css("overflow", "visible");
    setupOutsideClickClose($p);
    $dd.off("click").on("click.move", ".ms-dropdown-item", function () {
      const target = $(this).data("moveto");
      if (target === "_new") {
        const name = prompt("新分组名称:");
        if (!name || !name.trim()) return;
        const ng = createGroup(name.trim());
        movePromptsToGroup([...selectedIds], ng.id);
        toast("success", `已创建分组并移动 ${selectedIds.size} 项`);
      } else {
        movePromptsToGroup([...selectedIds], target || null);
        toast("success", `已移动 ${selectedIds.size} 项`);
      }
      exitSelectMode();
      closeActiveDropdown();
      $dd.hide();
      renderView();
    });
  }

  function showBatchTagDropdown($p) {
    const $dd = $p.find("#ms-dropdown");
    if ($dd.is(":visible")) {
      closeActiveDropdown();
      return;
    }
    if (data.settings.definedTags.length === 0) {
      toast("warning", "还没有标签，请先在标签管理中创建");
      return;
    }
    function buildTagContent() {
      let html = `<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量标签管理 · 已选 ${selectedIds.size} 项</div>`;
      data.settings.definedTags.forEach((t) => {
        let cnt = 0;
        selectedIds.forEach((pid) => {
          const p = getPrompt(pid);
          if (p && p.tags && p.tags.includes(t.id)) cnt++;
        });
        html += `<div class="ms-batch-tag-item">
          <div class="ms-batch-tag-info"><span class="ms-tag-chip" style="background:${t.color};">${esc(t.name)}</span><span class="ms-batch-tag-cnt">${cnt}/${selectedIds.size}</span></div>
          <button class="ms-batch-tag-btn add-btn" data-tagid="${t.id}" title="添加"><i class="fa-solid fa-plus"></i></button>
          <button class="ms-batch-tag-btn rm-btn" data-tagid="${t.id}" title="移除"><i class="fa-solid fa-minus"></i></button>
        </div>`;
      });
      html += `<div class="ms-batch-tag-item" style="border-top:1px solid var(--SmartThemeBorderColor,#444);">
        <div class="ms-batch-tag-info" style="cursor:pointer;color:var(--ms-accent);" id="ms-batch-new-tag"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建标签</div>
      </div>`;
      return html;
    }
    const panelH = $p[0].getBoundingClientRect().height;
    const ddMaxH = Math.max(150, panelH - 80);
    $dd
      .html(buildTagContent())
      .css({
        bottom: 40,
        right: 14,
        left: "auto",
        top: "auto",
        minWidth: "220px",
        maxHeight: ddMaxH + "px",
      })
      .show();
    $p.css("overflow", "visible");
    setupOutsideClickClose($p);
    $dd.off("click");
    $dd.on("click.btag", "#ms-batch-new-tag", function (e) {
      e.stopPropagation();
      const name = prompt("新标签名称:");
      if (!name || !name.trim()) return;
      createTag(name.trim());
      $dd.html(buildTagContent());
      renderBodyOnly();
    });
    $dd.on("click.btag", ".ms-batch-tag-btn", function (e) {
      e.stopPropagation();
      const tid = $(this).data("tagid");
      const isAdd = $(this).hasClass("add-btn");
      selectedIds.forEach((pid) => {
        const p = getPrompt(pid);
        if (!p) return;
        if (isAdd) {
          if (!p.tags.includes(tid)) p.tags.push(tid);
        } else {
          p.tags = p.tags.filter((id) => id !== tid);
        }
      });
      saveData();
      $dd.html(buildTagContent());
      renderBodyOnly();
    });
  }

  function showBatchSeriesDropdown($p) {
    const $dd = $p.find("#ms-dropdown");
    if ($dd.is(":visible")) {
      closeActiveDropdown();
      return;
    }
    const seriesNames = [
      ...new Set(
        data.prompts
          .map(function (p) {
            return (p.series || "").trim();
          })
          .filter(Boolean),
      ),
    ].sort();
    let html =
      '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置系列 · 已选 ' +
      selectedIds.size +
      " 项</div>";
    if (seriesNames.length > 0) {
      seriesNames.forEach(function (name) {
        html +=
          '<div class="ms-dropdown-item" data-series-name="' +
          esc(name) +
          '"><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;margin-right:6px;font-size:11px;"></i>' +
          esc(name) +
          "</div>";
      });
      html +=
        '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
    }
    html +=
      '<div class="ms-dropdown-item" data-series-action="custom" style="color:var(--ms-accent);"><i class="fa-solid fa-pen" style="margin-right:6px;font-size:11px;"></i>自定义系列名</div>';
    html +=
      '<div class="ms-dropdown-item" data-series-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;font-size:11px;"></i>清除系列</div>';
    const panelH = $p[0].getBoundingClientRect().height;
    const ddMaxH = Math.max(150, panelH - 80);
    $dd
      .html(html)
      .css({
        bottom: 40,
        right: 14,
        left: "auto",
        top: "auto",
        maxHeight: ddMaxH + "px",
      })
      .show();
    $p.css("overflow", "visible");
    setupOutsideClickClose($p);
    $dd.off("click").on("click.series", ".ms-dropdown-item", function () {
      const seriesName = $(this).data("series-name");
      const action = $(this).data("series-action");
      if (action === "custom") {
        const name = prompt("输入系列名称:");
        if (name === null) return;
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) p.series = name.trim();
        });
        saveData();
        toast(
          "success",
          name.trim() ? "已设置系列: " + name.trim() : "已清除系列",
        );
      } else if (action === "clear") {
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) p.series = "";
        });
        saveData();
        toast("success", "已清除 " + selectedIds.size + " 项的系列");
      } else if (seriesName !== undefined) {
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) p.series = seriesName;
        });
        saveData();
        toast("success", "已设置系列: " + seriesName);
      }
      closeActiveDropdown();
      $dd.hide();
      renderBodyOnly();
    });
  }

  function showBatchAuthorDialog() {
    const currentAuthor = prompt("输入要设置的作者名（留空则清除作者）:");
    if (currentAuthor === null) return;
    selectedIds.forEach((pid) => {
      const p = getPrompt(pid);
      if (p) p.author = currentAuthor.trim();
    });
    saveData();
    toast("success", `已为 ${selectedIds.size} 项设置作者`);
    renderBodyOnly();
  }

  function doRandomPick() {
    const ids = getVisiblePromptIds();
    if (ids.length === 0) {
      toast("warning", "当前没有可选的剧场");
      return;
    }
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    navigateTo({ name: "preview", promptId: randomId });
  }

  function bindAllEvents() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-body, #ms-toolbar, #ms-footer, #ms-filter-panel").off(".ms");
    $p.find("#ms-toolbar").on("compositionstart.ms", "#ms-search", function () {
      this._composing = true;
    });
    $p.find("#ms-toolbar").on("compositionend.ms", "#ms-search", function () {
      this._composing = false;
      searchQuery = $(this).val();
      $p.find("#ms-search-clear").toggle(!!searchQuery);
      renderBodyOnly();
    });
    $p.find("#ms-toolbar").on("input.ms", "#ms-search", function () {
      if (this._composing) return;
      searchQuery = $(this).val();
      $p.find("#ms-search-clear").toggle(!!searchQuery);
      renderBodyOnly();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-search-clear", function () {
      searchQuery = "";
      $p.find("#ms-search").val("").focus();
      $(this).hide();
      renderBodyOnly();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-new", () =>
      navigateTo({ name: "edit", promptId: null, defaultGroupId: null }),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-sort", () =>
      showSortDropdown($p),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-random", () =>
      doRandomPick(),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-select", () => {
      selectMode = !selectMode;
      if (!selectMode) selectedIds.clear();
      renderBodyOnly();
      $p.find("#ms-btn-select").toggleClass("active", selectMode);
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-filter", () => {
      const $fp = $p.find("#ms-filter-panel");
      if ($fp.hasClass("open")) $fp.removeClass("open");
      else {
        $fp.html(buildFilterPanel()).addClass("open");
        bindFilterEvents($p);
      }
    });
    $p.find("#ms-body").on(
      "pointerdown.ms",
      ".ms-nav-item[data-nav='group']",
      function (e) {
        if ($(e.target).closest("button, a, input").length) return;
        var gid = $(this).data("gid");
        if (!gid || gid === "_ungrouped") return;
        $(this).data("ms-nav-press-time", Date.now());
        var $el = $(this);
        var sx = e.clientX || 0,
          sy = e.clientY || 0;
        var navTimer = setTimeout(function () {
          $el.data("ms-nav-lp-fired", true);
          if (navigator.vibrate) navigator.vibrate(30);
          navigateTo({ name: "group-edit", groupId: gid });
        }, 600);
        var onMove2 = function (ev) {
          var dx = (ev.clientX || 0) - sx,
            dy = (ev.clientY || 0) - sy;
          if (dx * dx + dy * dy > 100) {
            clearTimeout(navTimer);
            navTimer = null;
          }
        };
        var onUp2 = function () {
          if (navTimer) {
            clearTimeout(navTimer);
            navTimer = null;
          }
          $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp");
        };
        $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp")
          .on("pointermove.msnlp", onMove2)
          .on("pointerup.msnlp pointercancel.msnlp", onUp2);
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-nav-item", function () {
      var nav = $(this).data("nav");
      if ($(this).data("ms-nav-lp-fired")) {
        $(this).removeData("ms-nav-lp-fired");
        return;
      }
      var pressTime = $(this).data("ms-nav-press-time") || 0;
      if (pressTime && Date.now() - pressTime > 600) {
        $(this).removeData("ms-nav-press-time");
        return;
      }
      $(this).removeData("ms-nav-press-time");
      if (nav === "starred") navigateTo({ name: "starred" });
      else if (nav === "recent") navigateTo({ name: "recent" });
      else if (nav === "group")
        navigateTo({ name: "group", groupId: $(this).data("gid") });
    });
    $p.find("#ms-body").on("contextmenu.ms", ".ms-card", function (e) {
      e.preventDefault();
    });
    $p.find("#ms-body").on("pointerdown.ms", ".ms-card", function (e) {
      if (selectMode) return;
      if ($(e.target).closest(".ms-card-star,.ms-card-qbtn").length) return;
      const pid = $(this).data("pid");
      longPressTriggered = false;
      $p.data("ms-card-press-time", Date.now());
      const sx = e.clientX || 0,
        sy = e.clientY || 0;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        longPressTimer = null;
        selectMode = true;
        selectedIds.add(pid);
        if (navigator.vibrate) navigator.vibrate(30);
        renderBodyOnly();
        $p.find("#ms-btn-select").addClass("active");
      }, 600);
      const onMove = (ev) => {
        if (!longPressTimer) return;
        const dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (dx * dx + dy * dy > 100) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };
      const onUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        $p.off("pointermove.mslp pointerup.mslp pointercancel.mslp");
      };
      $p.off("pointermove.mslp pointerup.mslp pointercancel.mslp")
        .on("pointermove.mslp", onMove)
        .on("pointerup.mslp pointercancel.mslp", onUp);
    });
    $p.find("#ms-body").on("click.ms", ".ms-card", function (e) {
      if ($(e.target).closest(".ms-card-star,.ms-card-qbtn").length) return;
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }
      const pid = $(this).data("pid");
      if (selectMode) {
        if (selectedIds.has(pid)) selectedIds.delete(pid);
        else selectedIds.add(pid);
        renderBodyOnly();
        return;
      }
      var pressTime = $p.data("ms-card-press-time") || 0;
      if (pressTime && Date.now() - pressTime > 600) {
        return;
      }
      navigateTo({ name: "preview", promptId: pid });
    });
    $p.find("#ms-body").on("click.ms", ".ms-series-header", function (e) {
      if ($(e.target).closest(".ms-series-check").length) return;
      var sid = $(this).data("series-id");
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find("#" + sid).toggleClass("open");
    });
    $p.find("#ms-body").on("click.ms", ".ms-series-check", function (e) {
      e.stopPropagation();
      if (!selectMode) return;
      var ids;
      try {
        ids = JSON.parse($(this).attr("data-series-ids"));
      } catch (ex) {
        return;
      }
      var allSel = ids.every(function (id) {
        return selectedIds.has(id);
      });
      ids.forEach(function (id) {
        if (allSel) selectedIds.delete(id);
        else selectedIds.add(id);
      });
      renderBodyOnly();
    });
    $p.find("#ms-body").on("click.ms", ".ms-card-star", function (e) {
      e.stopPropagation();
      toggleStar($(this).data("pid"));
      renderBodyOnly();
    });
    $p.find("#ms-body").on("click.ms", ".ms-card-qbtn", function (e) {
      e.stopPropagation();
      const action = $(this).data("qaction"),
        pid = $(this).data("pid");
      if (action === "send") sendToInput(pid);
      else if (action === "send-gen") sendAndGenerate(pid);
    });
    $p.find("#ms-footer").on("click.ms", "[data-action='manage-groups']", () =>
      navigateTo({ name: "groups" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='manage-tags']", () =>
      navigateTo({ name: "tag-manage" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='import']", () =>
      $p.find("#ms-file-input").trigger("click"),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='export']", () =>
      navigateTo({ name: "export" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='settings']", () =>
      navigateTo({ name: "settings" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='history-list']", () =>
      navigateTo({ name: "history-list" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='subscriptions']", () =>
      navigateTo({ name: "subscriptions" }),
    );
    $p.find("#ms-footer").on("click.ms", "[data-batch='selectall']", () => {
      const vis = getVisiblePromptIds();
      if (vis.length > 0 && vis.every((id) => selectedIds.has(id)))
        vis.forEach((id) => selectedIds.delete(id));
      else vis.forEach((id) => selectedIds.add(id));
      renderBodyOnly();
    });
    $p.find("#ms-footer").on("click.ms", "[data-batch='delete']", () => {
      if (selectedIds.size === 0) return;
      if (confirm(`确定删除选中的 ${selectedIds.size} 项吗？`)) {
        deletePrompts([...selectedIds]);
        exitSelectMode();
        renderView();
      }
    });
    $p.find("#ms-footer").on("click.ms", "[data-batch='move']", () =>
      showMoveDropdown($p),
    );
    $p.find("#ms-footer").on("click.ms", "[data-batch='tag']", () =>
      showBatchTagDropdown($p),
    );
    $p.find("#ms-footer").on("click.ms", "[data-batch='author']", () =>
      showBatchAuthorDialog(),
    );
    $p.find("#ms-footer").on("click.ms", "[data-batch='series']", () =>
      showBatchSeriesDropdown($p),
    );
    $p.find("#ms-footer").on("click.ms", "[data-batch='export']", () => {
      if (selectedIds.size === 0) {
        toast("warning", "请先选择");
        return;
      }
      navigateTo({ name: "export-batch-options" });
    });
    $p.off("change.ms-file").on(
      "change.ms-file",
      "#ms-file-input",
      function () {
        if (this.files[0]) doImport(this.files[0]);
        this.value = "";
      },
    );
    $p.off("click.ms-collapse").on(
      "click.ms-collapse",
      "#ms-btn-collapse",
      toggleCollapse,
    );
    $p.off("click.ms-close").on("click.ms-close", "#ms-btn-close", hidePanel);
    $p.off("click.ms-back").on("click.ms-back", "#ms-go-back", navigateBack);
    $p.find("#ms-body")
      .off("scroll.ms-scroll-top")
      .on("scroll.ms-scroll-top", function () {
        var $btn = $p.find("#ms-scroll-top");
        if (this.scrollTop > 150) $btn.addClass("visible");
        else $btn.removeClass("visible");
      });
    $p.off("click.ms-scroll-top").on(
      "click.ms-scroll-top",
      "#ms-scroll-top",
      function () {
        $p.find("#ms-body").animate({ scrollTop: 0 }, 200);
      },
    );
  }

  function bindFilterEvents($p) {
    $p.find("#ms-filter-panel")
      .off(".msf")
      .on("click.msf", "[data-filter-tag]", function () {
        const tid = $(this).data("filter-tag"),
          idx = filterState.tags.indexOf(tid);
        if (idx >= 0) filterState.tags.splice(idx, 1);
        else filterState.tags.push(tid);
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "#ms-tag-mode-toggle", function () {
        data.settings.filterTagMode =
          data.settings.filterTagMode === "and" ? "or" : "and";
        saveData();
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "[data-filter-group]", function () {
        var gid = $(this).data("filter-group") || null;
        filterState.groupId = filterState.groupId === gid ? null : gid;
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      });
  }

  function renderList() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("小剧场");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        search: true,
        searchPlaceholder: "搜索标题、内容或作者...",
        filter: true,
        select: true,
        sort: true,
        random: data.prompts.length > 0,
        add: true,
      }),
    );
    $p.find("#ms-body").html(buildListBody());
    $p.find("#ms-footer")
      .html(selectMode ? buildBatchFooter() : buildListFooter())
      .show();
    bindAllEvents();
  }

  function renderGroup(v) {
    const $p = $("#" + PANEL_ID),
      gid = v.groupId,
      isU = gid === "_ungrouped";
    const g = isU ? null : getGroup(gid),
      title = isU ? "未分组" : g ? g.name : "分组";
    const list = isU ? getUngroupedPrompts() : getPromptsInGroup(gid);
    const filtered = sortPrompts(
      filterPrompts(searchPrompts(list, searchQuery)),
    );
    $p.find("#ms-title").text(title);
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        filter: true,
        select: true,
        sort: true,
        random: list.length > 0,
        reorder: !isU && list.length > 1,
        exportGroup: !isU,
        add: true,
        addId: "ms-btn-new-in-group",
      }),
    );
    $p.find("#ms-body").html(
      filtered.length > 0
        ? renderGroupBodyWithSeries(filtered)
        : `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>`,
    );
    $p.find("#ms-footer")
      .html(
        selectMode
          ? buildBatchFooter()
          : `<span>${filtered.length}/${list.length} 条</span>` +
              (!isU
                ? `<div class="ms-footer-btns"><a data-action="group-settings"><i class="fa-solid fa-gear"></i> 分组设置</a></div>`
                : ``),
      )
      .show();
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-new-in-group", () =>
      navigateTo({
        name: "edit",
        promptId: null,
        defaultGroupId: isU ? null : gid,
      }),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-export-group", () => {
      if (!isU && gid) doExportGroup(gid);
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-reorder", () => {
      if (!isU && gid) navigateTo({ name: "reorder-prompts", groupId: gid });
    });
    if (!isU) {
      $p.find("#ms-footer").on(
        "click.ms",
        "[data-action='group-settings']",
        function () {
          navigateTo({ name: "group-edit", groupId: gid });
        },
      );
    }
  }

  function renderStarred() {
    const $p = $("#" + PANEL_ID),
      list = sortPrompts(
        filterPrompts(searchPrompts(getStarredPrompts(), searchQuery)),
      );
    $p.find("#ms-title").text("收藏");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        filter: true,
        select: true,
        sort: true,
        random: list.length > 0,
      }),
    );
    $p.find("#ms-body").html(
      list.length > 0
        ? renderPromptCards(list, true)
        : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`,
    );
    $p.find("#ms-footer")
      .html(
        selectMode ? buildBatchFooter() : `<span>${list.length} 条收藏</span>`,
      )
      .show();
    bindAllEvents();
  }

  function renderRecent() {
    const $p = $("#" + PANEL_ID),
      list = searchPrompts(getRecentPrompts(), searchQuery);
    $p.find("#ms-title").text("最近使用");
    $p.find("#ms-toolbar").html(buildToolbar({ back: true, search: true }));
    $p.find("#ms-body").html(
      list.length > 0
        ? renderPromptCards(list, true)
        : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`,
    );
    $p.find("#ms-footer")
      .html(
        `<span>${list.length} 条</span><div class="ms-footer-btns">${list.length > 0 ? '<a data-action="clear-recent"><i class="fa-solid fa-broom"></i> 清空记录</a>' : ""}</div>`,
      )
      .show();
    bindAllEvents();
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-recent']",
      function () {
        if (!confirm("确定清空所有最近使用记录吗？\n（不会影响使用次数统计）"))
          return;
        data.prompts.forEach(function (p) {
          p.lastUsedAt = null;
        });
        saveData();
        toast("success", "已清空");
        renderRecent();
      },
    );
  }

  function renderPreview(v) {
    const $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    const siblingIds = v._siblingIds || [];
    const currentIdx = siblingIds.indexOf(pr.id);
    const prevId = currentIdx > 0 ? siblingIds[currentIdx - 1] : null;
    const nextId =
      currentIdx >= 0 && currentIdx < siblingIds.length - 1
        ? siblingIds[currentIdx + 1]
        : null;
    const g = pr.groupId ? getGroup(pr.groupId) : null,
      groupL = g ? g.name : "未分组";
    var metaChips =
      '<span class="ms-pv-chip"><i class="fa-solid fa-folder" style="color:' +
      (g ? g.color : "var(--SmartThemeQuoteColor,#888)") +
      ';"></i>' +
      esc(groupL) +
      "</span>";
    if (pr.series)
      metaChips +=
        '<span class="ms-pv-chip"><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;"></i>' +
        esc(pr.series) +
        "</span>";
    if (pr.author)
      metaChips +=
        '<span class="ms-pv-chip"><i class="fa-solid fa-user"></i>' +
        esc(pr.author) +
        "</span>";
    const starIcon = pr.starred ? "fa-solid" : "fa-regular",
      starLabel = pr.starred ? "取消收藏" : "收藏",
      starCls = pr.starred ? " starred" : "";
    const pinLabel = pr.pinned ? "取消置顶" : "置顶",
      pinIcon = "fa-solid fa-thumbtack";
    let tagsH = "";
    sortTagIds(pr.tags || []).forEach((tid) => {
      const t = getTag(tid);
      if (t)
        tagsH += `<span class="ms-tag-chip" style="background:${t.color};margin-right:4px;">${esc(t.name)}</span>`;
    });
    const stats = countStats(pr.content);
    const historyCount = (pr.history || []).length;
    $p.find("#ms-title").text(pr.title);
    const navPosH =
      siblingIds.length > 1
        ? `<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;white-space:nowrap;">${currentIdx + 1}/${siblingIds.length}</span>`
        : "";
    const navPrevH =
      siblingIds.length > 1
        ? `<button class="ms-hbtn" id="ms-prev-prompt" title="上一条"${prevId ? "" : ' disabled style="opacity:0.2;"'}><i class="fa-solid fa-angle-up"></i></button>`
        : "";
    const navNextH =
      siblingIds.length > 1
        ? `<button class="ms-hbtn" id="ms-next-prompt" title="下一条"${nextId ? "" : ' disabled style="opacity:0.2;"'}><i class="fa-solid fa-angle-down"></i></button>`
        : "";
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><div class="ms-pv-meta">${metaChips}</div>${navPosH}${navPrevH}${navNextH}`,
    );
    $p.find("#ms-body").html(`
      <div class="ms-preview-actions">
        <button class="ms-pa${starCls}" data-action="star"><i class="${starIcon} fa-star"></i> ${starLabel}</button>
        <button class="ms-pa" data-action="pin"><i class="${pinIcon}"></i> ${pinLabel}</button>
        <button class="ms-pa" data-action="edit"><i class="fa-solid fa-pen"></i>编辑</button>
        <button class="ms-pa" data-action="copy"><i class="fa-solid fa-copy"></i> 复制</button>
        <button class="ms-pa" data-action="duplicate"><i class="fa-solid fa-clone"></i> 副本</button>
        <button class="ms-pa" data-action="export-single"><i class="fa-solid fa-file-export"></i> 导出</button>
        ${historyCount > 0 ? `<button class="ms-pa" data-action="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史 (${historyCount})</button>` : ""}<button class="ms-pa danger" data-action="delete"><i class="fa-solid fa-trash"></i> 删除</button>
      </div>
      ${tagsH ? `<div style="padding:6px 14px;">${tagsH}</div>` : ""}
      <div style="padding:2px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);display:flex;justify-content:space-between;align-items:center;"><span>${stats.chars} 字 · ${stats.lines} 行${pr.usageCount ? " · 使用 " + pr.usageCount + " 次" : ""}</span>${pr.updatedAt && pr.updatedAt !== pr.createdAt ? '<span style="opacity:0.7;" title="修改日期"><i class="fa-solid fa-pen-to-square" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.updatedAt) + '</span>' : pr.createdAt ? '<span style="opacity:0.7;" title="创建日期"><i class="fa-solid fa-calendar-plus" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.createdAt) + '</span>' : ''}</div>
      <div class="ms-preview-content">${renderMd(pr.content)}</div>`);
    var _isInjected =
      (data.settings.stageSelectedIds || []).indexOf(pr.id) >= 0;
    var _injectCount = (data.settings.stageSelectedIds || []).length;
    var _injectBtnLabel = _isInjected
      ? '<i class="fa-solid fa-syringe"></i>取消注入' +
        (_injectCount > 1 ? "(" + _injectCount + ")" : "")
      : '<i class="fa-solid fa-syringe"></i>选为注入' +
        (_injectCount > 0 ? "(+" + _injectCount + ")" : "");
    var _injectBtnCls = _isInjected ? " ms-inject-active" : "";
    var _injectBtnH = data.settings.stageInjectEnabled
      ? '<button class="ms-send-btn' +
        _injectBtnCls +
        '" data-action="toggle-inject">' +
        _injectBtnLabel +
        "</button>"
      : "";
    $p.find("#ms-footer")
      .html(
        '<div class="ms-preview-send" style="border:none;padding:0;width:100%;gap:4px;">' +
          '<button class="ms-send-btn" data-action="send-input"><i class="fa-solid fa-right-to-bracket"></i>填入输入框</button>' +
          _injectBtnH +
          '<button class="ms-send-btn" data-action="send-gen" style="background:rgba(var(--ms-accent-rgb),0.1);border-color:var(--ms-accent);color:var(--ms-accent);"><i class="fa-solid fa-paper-plane"></i>发送并生成</button>' +
          "</div>",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "[data-action='star']", () => {
      toggleStar(pr.id);
      renderPreview(v);
    });
    $p.find("#ms-body").on("click.ms", "[data-action='pin']", () => {
      togglePin(pr.id);
      renderPreview(v);
    });
    $p.find("#ms-body").on("click.ms", "[data-action='edit']", () =>
      navigateTo({ name: "edit", promptId: pr.id }),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='copy']", () =>
      copyToClipboard(pr.content)
        .then(() => toast("success", "已复制"))
        .catch(() => toast("error", "复制失败")),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='duplicate']", () => {
      duplicatePrompt(pr.id);
      navigateBack();
    });
    $p.find("#ms-body").on("click.ms", "[data-action='export-single']", () =>
      doExportSingle(pr),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='history']", () =>
      navigateTo({ name: "history", promptId: pr.id }),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='delete']", () => {
      if (confirm("确定删除？")) {
        deletePrompt(pr.id);
        navigateBack();
      }
    });
    $p.find("#ms-footer").on("click.ms", "[data-action='send-input']", () =>
      sendToInput(pr.id),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='send-gen']", () =>
      sendAndGenerate(pr.id),
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='toggle-inject']",
      function () {
        if (!Array.isArray(data.settings.stageSelectedIds))
          data.settings.stageSelectedIds = [];
        var idx = data.settings.stageSelectedIds.indexOf(pr.id);
        if (idx >= 0) {
          data.settings.stageSelectedIds.splice(idx, 1);
        } else {
          data.settings.stageSelectedIds.push(pr.id);
        }
        saveData();
        updateInjectIndicator();
        var _isNowInjected = data.settings.stageSelectedIds.indexOf(pr.id) >= 0;
        var _nowCount = data.settings.stageSelectedIds.length;
        var $btn = $p.find("[data-action='toggle-inject']");
        if (_isNowInjected) {
          $btn
            .addClass("ms-inject-active")
            .html(
              '<i class="fa-solid fa-syringe"></i>取消注入' +
                (_nowCount > 1 ? "(" + _nowCount + ")" : ""),
            );
        } else {
          $btn
            .removeClass("ms-inject-active")
            .html(
              '<i class="fa-solid fa-syringe"></i>选为注入' +
                (_nowCount > 0 ? "(+" + _nowCount + ")" : ""),
            );
        }
      },
    );
    $p.find("#ms-body").on("change.ms", ".ms-task-cb", function () {
      var idx = parseInt($(this).data("task-idx"));
      var isChecked = $(this).is(":checked");
      var lines = pr.content.split("\n");
      var taskCount = 0;
      for (var i = 0; i < lines.length; i++) {
        if (/^\s*- \[[ x]\] /.test(lines[i])) {
          if (taskCount === idx) {
            if (isChecked) lines[i] = lines[i].replace("- [ ] ", "- [x] ");
            else lines[i] = lines[i].replace("- [x] ", "- [ ] ");
            break;
          }
          taskCount++;
        }
      }
      pr.content = lines.join("\n");
      pr.fingerprint = contentFingerprint(pr);
      saveData();
      $p.find(".ms-preview-content").html(renderMd(pr.content));
    });
    if (prevId) {
      $p.find("#ms-toolbar").on("click.ms", "#ms-prev-prompt", function () {
        viewStack[viewStack.length - 1] = {
          name: "preview",
          promptId: prevId,
          _siblingIds: siblingIds,
        };
        renderView();
      });
    }
    if (nextId) {
      $p.find("#ms-toolbar").on("click.ms", "#ms-next-prompt", function () {
        viewStack[viewStack.length - 1] = {
          name: "preview",
          promptId: nextId,
          _siblingIds: siblingIds,
        };
        renderView();
      });
    }
    $p.off("keydown.ms-preview-nav").on("keydown.ms-preview-nav", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (prevId) {
          e.preventDefault();
          viewStack[viewStack.length - 1] = {
            name: "preview",
            promptId: prevId,
            _siblingIds: siblingIds,
          };
          renderView();
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (nextId) {
          e.preventDefault();
          viewStack[viewStack.length - 1] = {
            name: "preview",
            promptId: nextId,
            _siblingIds: siblingIds,
          };
          renderView();
        }
      }
    });
  }

  function renderHistory(v) {
    const $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    const history = pr.history || [];
    $p.find("#ms-title").text("版本历史");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">版本历史 · ${esc(truncate(pr.title, 20))}</span>`,
    );
    let html = "";
    if (history.length === 0) {
      html = `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有历史版本</div>`;
    } else {
      [...history].reverse().forEach((h, ri) => {
        const idx = history.length - 1 - ri;
        html += `<div class="ms-history-item" data-hidx="${idx}">
          <div class="ms-history-info">
            <div class="ms-history-title">${esc(h.title || "未命名")}${h.author ? ` · ${esc(h.author)}` : ""}</div>
            <div class="ms-history-date">${formatDate(h.savedAt)}</div>
            <div class="ms-history-preview">${esc(truncate(h.content, 80))}</div>
          </div>
          <div class="ms-history-actions">
            <button class="ms-card-qbtn" data-haction="diff" data-hidx="${idx}" title="与当前版本对比"><i class="fa-solid fa-right-left"></i></button><button class="ms-card-qbtn" data-haction="restore" data-hidx="${idx}" title="回退到此版本"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="ms-card-qbtn" data-haction="delete" data-hidx="${idx}" title="删除此记录"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        `<span>${history.length}/5 条历史</span><div class="ms-footer-btns">${history.length > 0 ? '<a data-action="clear-history"><i class="fa-solid fa-broom"></i> 清空</a>' : ""}</div>`,
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      "[data-haction='restore']",
      function (e) {
        e.stopPropagation();
        const idx = parseInt($(this).data("hidx"));
        const h = pr.history[idx];
        if (!h) return;
        if (!confirm("回退后当前内容会被保存到历史中，确定吗？")) return;
        pushHistory(pr);
        pr.history.splice(idx, 1);
        pr.title = h.title;
        pr.content = h.content;
        pr.author = h.author || pr.author;
        pr.fingerprint = contentFingerprint(pr);
        saveData();
        navigateBack();
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-haction='delete']", function (e) {
      e.stopPropagation();
      const idx = parseInt($(this).data("hidx"));
      if (confirm("确定删除此历史记录？")) {
        pr.history.splice(idx, 1);
        saveData();
        renderHistory(v);
      }
    });
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-history']",
      function () {
        if (!confirm("确定清空本条剧场的所有版本历史吗？")) return;
        pr.history = [];
        saveData();
        toast("success", "已清空");
        renderHistory(v);
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-haction='diff']", function (e) {
      e.stopPropagation();
      var idx = parseInt($(this).data("hidx"));
      navigateTo({
        name: "history-diff",
        promptId: v.promptId,
        historyIdx: idx,
      });
    });
  }

  function renderHistoryDiff(v) {
    var $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    var h = (pr.history || [])[v.historyIdx];
    if (!h) {
      navigateBack();
      return;
    }
    var diff = computeLineDiff(h.content || "", pr.content || "");
    var addCount = diff.filter(function (d) {
      return d.type === "add";
    }).length;
    var delCount = diff.filter(function (d) {
      return d.type === "del";
    }).length;
    var sameCount = diff.filter(function (d) {
      return d.type === "same";
    }).length;
    $p.find("#ms-title").text("版本对比");
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">版本对比</span>',
    );
    var metaH = "";
    if ((h.title || "") !== (pr.title || "")) {
      metaH +=
        '<div style="padding:2px 0;font-size:12px;"><span style="opacity:0.5;">标题:</span> <span class="ms-diff-del-text">' +
        esc(h.title || "未命名") +
        '</span> <i class="fa-solid fa-arrow-right" style="font-size:9px;opacity:0.4;margin:0 4px;"></i> <span class="ms-diff-add-text">' +
        esc(pr.title || "未命名") +
        "</span></div>";
    }
    if ((h.author || "") !== (pr.author || "")) {
      metaH +=
        '<div style="padding:2px 0;font-size:12px;"><span style="opacity:0.5;">作者:</span> <span class="ms-diff-del-text">' +
        esc(h.author || "无") +
        '</span> <i class="fa-solid fa-arrow-right" style="font-size:9px;opacity:0.4;margin:0 4px;"></i> <span class="ms-diff-add-text">' +
        esc(pr.author || "无") +
        "</span></div>";
    }
    var html =
      '<div class="ms-diff-header">' +
      '<div class="ms-diff-label old"><i class="fa-solid fa-clock-rotate-left"></i> 历史版本</div>' +
      '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);">' +
      formatDate(h.savedAt) +
      "</div>" +
      '<i class="fa-solid fa-arrow-right" style="font-size:10px;opacity:0.3;"></i>' +
      '<div class="ms-diff-label new"><i class="fa-solid fa-file-lines"></i> 当前版本</div>' +
      "</div>";
    if (metaH) {
      html += '<div class="ms-diff-meta">' + metaH + "</div>";
    }
    html +=
      '<div class="ms-diff-stats">' +
      '<span class="ms-diff-stat-add">+ ' +
      addCount +
      " 行新增</span>" +
      '<span class="ms-diff-stat-del">- ' +
      delCount +
      " 行删除</span>" +
      '<span class="ms-diff-stat-same">' +
      sameCount +
      " 行不变</span>" +
      (sameCount > 0
        ? '<button class="ms-diff-toggle" id="ms-diff-toggle-ctx">只看改动</button>'
        : "") +
      "</div>";
    if (addCount === 0 && delCount === 0) {
      html +=
        '<div class="ms-empty" style="padding:30px 20px;"><i class="fa-solid fa-equals" style="font-size:24px;opacity:0.3;display:block;margin-bottom:10px;"></i>内容完全相同' +
        (metaH
          ? '<br><span style="font-size:11px;opacity:0.6;">仅标题或作者有变化</span>'
          : "") +
        "</div>";
    } else {
      html += '<div class="ms-diff-body" id="ms-diff-body">';
      diff.forEach(function (d) {
        var sign = d.type === "add" ? "+" : d.type === "del" ? "−" : " ";
        var lineText = d.text !== undefined ? d.text : "";
        if (lineText === "" && d.type === "same") lineText = " ";
        html +=
          '<div class="ms-diff-line ' +
          d.type +
          '"><span class="ms-diff-sign">' +
          sign +
          '</span><span class="ms-diff-text">' +
          esc(lineText || " ") +
          "</span></div>";
      });
      html += "</div>";
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        "<span>" +
          diff.length +
          " 行对比 · " +
          addCount +
          " 增 · " +
          delCount +
          " 删</span>",
      )
      .show();
    bindAllEvents();
    var showAll = true;
    $p.find("#ms-body").on("click.ms", "#ms-diff-toggle-ctx", function () {
      showAll = !showAll;
      $(this).text(showAll ? "只看改动" : "显示全部");
      $(this).toggleClass("active", !showAll);
      if (showAll) {
        $p.find("#ms-diff-body").removeClass("ms-diff-changes-only");
      } else {
        $p.find("#ms-diff-body").addClass("ms-diff-changes-only");
      }
    });
  }

  function renderEdit(v) {
    const $p = $("#" + PANEL_ID),
      pr = v.promptId ? getPrompt(v.promptId) : null,
      isNew = !pr;
    const title = isNew ? "" : pr.title,
      content = isNew ? "" : pr.content;
    const groupId = isNew ? v.defaultGroupId || "" : pr.groupId || "";
    const g = groupId ? getGroup(groupId) : null;
    const author = isNew
      ? g && g.defaultAuthor
        ? g.defaultAuthor
        : data.settings.defaultAuthor || ""
      : pr.author || "";
    const series = isNew ? "" : pr.series || "";
    const promptTags = isNew ? [] : pr.tags || [];
    if (!v._savedEditState && !v._draftChecked) {
      v._draftChecked = true;
      var draft = loadDraft();
      if (draft && draft.savedAt && Date.now() - draft.savedAt < 86400000) {
        var draftHasContent =
          (draft.title && draft.title.trim()) ||
          (draft.content && draft.content.trim());
        if (draftHasContent) {
          v._pendingDraft = draft;
        }
      }
    }

    editDirty = false;
    editSnapshot = JSON.stringify({
      title,
      content,
      groupId,
      author,
      series,
      tags: promptTags,
    });
    $p.find("#ms-title").text(isNew ? "新建小剧场" : "编辑");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">${isNew ? "新建小剧场" : "编辑小剧场"}</span>`,
    );
    let groupOpts = `<option value="">未分组</option>`;
    data.groups.forEach((gg) => {
      groupOpts += `<option value="${gg.id}" ${groupId === gg.id ? "selected" : ""}>${esc(gg.name)}</option>`;
    });
    let editTags = [...promptTags];
    const stats = countStats(content);
    function buildTagsUI() {
      let h = "";
      data.settings.definedTags.forEach((t) => {
        const a = editTags.includes(t.id);
        h += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-tag-id="${t.id}" style="${a ? "background:" + t.color + ";" : ""}">${esc(t.name)}${a ? '<i class="fa-solid fa-xmark ms-tag-x"></i>' : ""}</span>`;
      });
      h += `<span class="ms-add-tag-btn" id="ms-quick-add-tag"><i class="fa-solid fa-plus"></i></span>`;
      return h;
    }
    function markDirty() {
      const cur = JSON.stringify({
        title: $p.find("#ms-edit-title").val() || "",
        content: $p.find("#ms-edit-content").val() || "",
        groupId: $p.find("#ms-edit-group").val() || "",
        author: $p.find("#ms-edit-author").val() || "",
        series: $p.find("#ms-edit-series").val() || "",
        tags: editTags,
      });
      editDirty = cur !== editSnapshot;
    }
    var _draftBannerH = "";
    if (v._pendingDraft) {
      var _d = v._pendingDraft;
      var _dAge = Math.round((Date.now() - _d.savedAt) / 60000);
      var _dTimeStr =
        _dAge < 60 ? _dAge + " 分钟前" : Math.round(_dAge / 60) + " 小时前";
      var _dMatch = _d.promptId === (v.promptId || null);
      _draftBannerH =
        '<div id="ms-draft-banner" style="padding:8px 12px;background:rgba(var(--ms-accent-rgb),0.10);border:1px solid rgba(var(--ms-accent-rgb),0.25);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--ms-accent);flex-shrink:0;"></i><span style="flex:1;min-width:0;color:var(--SmartThemeBodyColor,#ccc);">检测到 ' +
        _dTimeStr +
        " 的未保存草稿" +
        (_dMatch
          ? ""
          : "（来自另一条剧场「" + esc(truncate(_d.title, 15)) + "」）") +
        '</span><button class="ms-tbtn" id="ms-draft-restore" style="padding:3px 10px;font-size:11px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-rotate-left" style="margin-right:3px;"></i>恢复</button><button class="ms-tbtn" id="ms-draft-discard" style="padding:3px 10px;font-size:11px;"><i class="fa-solid fa-xmark" style="margin-right:3px;"></i>丢弃</button></div>';
    }
    $p.find("#ms-body").html(`<div class="ms-form-edit">${_draftBannerH}
      <div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>标题</label><input type="text" id="ms-edit-title" placeholder="小剧场名字" value="${esc(title)}"></div><div class="ms-field" style="flex:1;"><label>系列 <span style="font-weight:350;opacity:0.5;">(同系列自动聚合)</span></label><input type="text" id="ms-edit-series" placeholder="如：「衣柜大公开」" value="${esc(series)}"></div></div>
      <div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>分组</label><select id="ms-edit-group">${groupOpts}</select></div><div class="ms-field" style="flex:1;"><label>作者</label><input type="text" id="ms-edit-author" placeholder="署名" value="${esc(author)}"></div></div>
      <div class="ms-field"><label>标签</label><div class="ms-tag-row" id="ms-edit-tags">${buildTagsUI()}</div></div>
      <div class="ms-field ms-content-field">
        <label>内容</label>
        <div class="ms-md-toolbar">
          <button class="ms-md-btn" data-md="bold" title="粗体"><i class="fa-solid fa-bold"></i></button>
          <button class="ms-md-btn" data-md="italic" title="斜体"><i class="fa-solid fa-italic"></i></button>
          <button class="ms-md-btn" data-md="strike" title="删除线"><i class="fa-solid fa-strikethrough"></i></button>
          <button class="ms-md-btn" data-md="heading" title="标题(多次点击切换#1~6级)"><i class="fa-solid fa-heading"></i></button>
          <button class="ms-md-btn" data-md="quote" title="引用"><i class="fa-solid fa-quote-left"></i></button>
          <button class="ms-md-btn" data-md="list" title="列表"><i class="fa-solid fa-list"></i></button>
          <button class="ms-md-btn" data-md="task" title="任务列表"><i class="fa-solid fa-square-check"></i></button>
          <button class="ms-md-btn" data-md="code" title="代码"><i class="fa-solid fa-code"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="link" title="链接"><i class="fa-solid fa-link"></i></button>
          <button class="ms-md-btn" data-md="image" title="图片"><i class="fa-solid fa-image"></i></button>
          <button class="ms-md-btn" data-md="hr" title="分割线"><i class="fa-solid fa-minus"></i></button>
          <button class="ms-md-btn" data-md="table" title="表格"><i class="fa-solid fa-table"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="quick-phrases" title="快捷短语"><i class="fa-solid fa-bolt"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="undo" title="撤销"><i class="fa-solid fa-rotate-left"></i></button>
          <button class="ms-md-btn" data-md="redo" title="重做"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="ms-md-btn" data-md="selectall" title="全选"><i class="fa-solid fa-object-group"></i></button>
          <button class="ms-md-btn" data-md="find" title="查找"><i class="fa-solid fa-magnifying-glass"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="shift" title="Shift选择(移动端)"><i class="fa-solid fa-up-down-left-right"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="preview-toggle" title="预览"><i class="fa-solid fa-eye"></i></button>
          <span class="ms-md-sep"></span>
          <button class="ms-md-btn" data-md="focus" title="专注编辑"><i class="fa-solid fa-expand"></i></button></div>
        <div class="ms-find-bar" id="ms-find-bar" style="display:none;">
          <input type="text" id="ms-find-input" class="ms-find-input" placeholder="查找...">
          <span class="ms-find-count" id="ms-find-count"></span>
          <button class="ms-md-btn" id="ms-find-prev" title="上一个 (Shift+Enter)"><i class="fa-solid fa-angle-up"></i></button>
          <button class="ms-md-btn" id="ms-find-next" title="下一个 (Enter)"><i class="fa-solid fa-angle-down"></i></button>
          <button class="ms-md-btn" id="ms-find-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
          <div style="display:flex;gap:4px;align-items:center;width:100%;"><input type="text" id="ms-replace-input" class="ms-find-input" placeholder="替换为..."><button class="ms-md-btn" id="ms-replace-one" title="替换当前"><i class="fa-solid fa-right-left"></i></button><button class="ms-md-btn" id="ms-replace-all" title="全部替换"><i class="fa-solid fa-arrows-rotate"></i></button></div>
        </div>
        <textarea id="ms-edit-content" placeholder="输入提示词内容...">${esc(content)}</textarea>
        <button class="ms-edit-scroll-top" id="ms-edit-scroll-top" title="回到顶部"><i class="fa-solid fa-angle-up"></i></button>
      </div>
      <div class="ms-char-count" id="ms-char-count">${stats.chars} 字 · ${stats.lines} 行</div>
      <div class="ms-form-btns"><button class="ms-btn" id="ms-edit-cancel">取消</button><button class="ms-btn primary" id="ms-edit-save">保存</button></div>
    </div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    const getTa = () => $p.find("#ms-edit-content")[0];
    let um = null;
    if (!v._savedEditState) um = createUndoManager(getTa);
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    if (isMobile) {
      $p.find("#ms-body").on("focus.ms", "#ms-edit-content", function () {
        const ta = this;
        setTimeout(() => {
          ta.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 350);
      });
    }
    $p.find("#ms-body").on("click.ms", "#ms-draft-restore", function () {
      var draft = v._pendingDraft;
      if (!draft) return;
      $p.find("#ms-edit-title").val(draft.title || "");
      $p.find("#ms-edit-content").val(draft.content || "");
      $p.find("#ms-edit-group").val(draft.groupId || "");
      $p.find("#ms-edit-author").val(draft.author || "");
      $p.find("#ms-edit-series").val(draft.series || "");
      editTags = draft.tags ? [...draft.tags] : [];
      $p.find("#ms-edit-tags").html(buildTagsUI());
      var rs = countStats(draft.content || "");
      $p.find("#ms-char-count").text(rs.chars + " 字 · " + rs.lines + " 行");
      markDirty();
      $p.find("#ms-draft-banner").slideUp(200, function () {
        $(this).remove();
      });
      delete v._pendingDraft;
      clearDraft();
      toast("success", "草稿已恢复");
    });
    $p.find("#ms-body").on("click.ms", "#ms-draft-discard", function () {
      $p.find("#ms-draft-banner").slideUp(200, function () {
        $(this).remove();
      });
      delete v._pendingDraft;
      clearDraft();
    });

    $p.find("#ms-body").on(
      "click.ms",
      "#ms-edit-tags .ms-tag-toggle",
      function () {
        const tid = $(this).data("tag-id"),
          idx = editTags.indexOf(tid);
        if (idx >= 0) editTags.splice(idx, 1);
        else editTags.push(tid);
        $p.find("#ms-edit-tags").html(buildTagsUI());
        markDirty();
      },
    );
    $p.find("#ms-body").on("click.ms", "#ms-quick-add-tag", function () {
      const n = prompt("新标签名称:");
      if (n && n.trim()) {
        const t = createTag(n.trim());
        editTags.push(t.id);
        $p.find("#ms-edit-tags").html(buildTagsUI());
        markDirty();
      }
    });
    var _draftTimer = null;
    function scheduleDraftSave() {
      clearTimeout(_draftTimer);
      _draftTimer = setTimeout(function () {
        saveDraft({
          promptId: v.promptId || null,
          title: $p.find("#ms-edit-title").val() || "",
          content: $p.find("#ms-edit-content").val() || "",
          groupId: $p.find("#ms-edit-group").val() || "",
          author: $p.find("#ms-edit-author").val() || "",
          series: $p.find("#ms-edit-series").val() || "",
          tags: editTags,
          savedAt: Date.now(),
        });
      }, 2000);
    }
    $p.find("#ms-body").on("input.ms", "#ms-edit-content", function () {
      um.scheduleCapture();
      const s = countStats(this.value);
      $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
      markDirty();
      scheduleDraftSave();
    });
    $p.find("#ms-body").on(
      "input.ms",
      "#ms-edit-title, #ms-edit-author, #ms-edit-series",
      function () {
        markDirty();
        scheduleDraftSave();
      },
    );
    $p.find("#ms-body").on("change.ms", "#ms-edit-group", function () {
      if (isNew && !$p.find("#ms-edit-author").val().trim()) {
        const selGid = $(this).val();
        const selG = selGid ? getGroup(selGid) : null;
        if (selG && selG.defaultAuthor)
          $p.find("#ms-edit-author").val(selG.defaultAuthor);
        else if (data.settings.defaultAuthor)
          $p.find("#ms-edit-author").val(data.settings.defaultAuthor);
      }
      markDirty();
    });
    $p.find("#ms-body").on("click.ms", "#ms-edit-content", function () {
      if (shiftKeyActive) {
        const ta = this,
          cur = ta.selectionStart;
        if (shiftAnchor >= 0 && shiftAnchor !== cur)
          ta.setSelectionRange(
            Math.min(shiftAnchor, cur),
            Math.max(shiftAnchor, cur),
          );
        shiftKeyActive = false;
        shiftAnchor = -1;
        $p.find("[data-md='shift']").removeClass("active");
      }
    });
    $p.find("#ms-body").on("mousedown.ms", ".ms-md-btn", function (e) {
      const md = $(this).data("md");
      if (md !== "shift") {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    $p.find("#ms-body").on("click.ms", ".ms-md-btn", function (e) {
      e.preventDefault();
      const ta = getTa();
      if (!ta) return;
      const md = $(this).data("md");
      if (md === "undo") {
        um.undo();
        const s = countStats(ta.value);
        $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
        markDirty();
        return;
      }
      if (md === "redo") {
        um.redo();
        const s = countStats(ta.value);
        $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
        markDirty();
        return;
      }
      if (md === "selectall") {
        ta.focus();
        ta.selectionStart = 0;
        ta.selectionEnd = ta.value.length;
        return;
      }
      if (md === "shift") {
        if (!shiftKeyActive) {
          shiftAnchor = ta.selectionStart;
          shiftKeyActive = true;
          $(this).addClass("active");
          toast("info", "Shift激活，点击文本另一位置");
        } else {
          shiftKeyActive = false;
          shiftAnchor = -1;
          $(this).removeClass("active");
        }
        return;
      }
      if (md === "find") {
        const $bar = $p.find("#ms-find-bar");
        if ($bar.is(":visible")) {
          $bar.hide();
          $(this).removeClass("active");
          getTa()?.focus();
        } else {
          $bar.show();
          $(this).addClass("active");
          $bar.find("#ms-find-input").val("").focus();
          $p.find("#ms-find-count").text("").removeClass("no-match");
        }
        return;
      }
      if (md === "preview-toggle") {
        var $taWrap = $p.find(".ms-content-field");
        var $ta = $p.find("#ms-edit-content");
        var taEl = $ta[0];
        var $existPreview = $taWrap.find("#ms-edit-preview-pane");

        function getScrollRatio(el) {
          if (!el) return 0;
          var max = el.scrollHeight - el.clientHeight;
          if (max <= 0) return 0;
          return el.scrollTop / max;
        }

        function setScrollByRatio(el, ratio) {
          if (!el) return;
          var max = el.scrollHeight - el.clientHeight;
          if (max <= 0) {
            el.scrollTop = 0;
            return;
          }
          el.scrollTop = max * ratio;
        }

        if ($existPreview.length) {
          var previewEl = $existPreview[0];
          var previewRatio = getScrollRatio(previewEl);

          $existPreview.remove();
          $p.find("#ms-preview-scroll-top").remove();
          $ta.show();

          if ($p.find("[data-md='find']").hasClass("active")) {
            $p.find(".ms-find-bar").show();
          }

          requestAnimationFrame(function () {
            setScrollByRatio(taEl, previewRatio);
            $ta.trigger("scroll");
          });

          $(this).removeClass("active");
          $(this).find("i").attr("class", "fa-solid fa-eye");
        } else {
          var taRatio = getScrollRatio(taEl);
          var previewHtml = renderMd($ta.val());

          $ta.hide();
          $p.find(".ms-find-bar").hide();
          $p.find("#ms-edit-scroll-top").removeClass("visible");

          $taWrap.append(
            '<div id="ms-edit-preview-pane" class="ms-preview-content" style="flex:1;overflow-y:auto;min-height:180px;max-height:60vh;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:0 0 8px 8px;padding:14px;">' +
              previewHtml +
              "</div>",
          );
          $taWrap.append(
            '<button class="ms-edit-scroll-top" id="ms-preview-scroll-top" title="回到顶部"><i class="fa-solid fa-angle-up"></i></button>',
          );

          var previewEl2 = $p.find("#ms-edit-preview-pane")[0];

          requestAnimationFrame(function () {
            setScrollByRatio(previewEl2, taRatio);
            $(previewEl2).trigger("scroll");
          });

          $p.find("#ms-edit-preview-pane").on("scroll", function () {
            var $btn = $p.find("#ms-preview-scroll-top");
            if (this.scrollTop > 150) $btn.addClass("visible");
            else $btn.removeClass("visible");
          });

          $p.find("#ms-preview-scroll-top").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            $p.find("#ms-edit-preview-pane").animate({ scrollTop: 0 }, 200);
          });

          $(this).addClass("active");
          $(this).find("i").attr("class", "fa-solid fa-eye-slash");
        }
        return;
      }
      if (md === "focus") {
        const $panel = $("#" + PANEL_ID);
        const el = $panel[0];
        if ($panel.hasClass("ms-focus-mode")) {
          exitFocusMode();
          $(this).removeClass("active");
          $(this).find("i").attr("class", "fa-solid fa-expand");
          $(this).attr("title", "专注编辑");
        } else {
          $panel.data("ms-focus-saved-pos", {
            left: el.style.getPropertyValue("left"),
            top: el.style.getPropertyValue("top"),
            transform: el.style.getPropertyValue("transform"),
            panelPos: data.settings.panelPos
              ? { ...data.settings.panelPos }
              : null,
          });
          el.style.removeProperty("left");
          el.style.removeProperty("top");
          el.style.removeProperty("transform");
          $panel.addClass("ms-focus-mode");
          $(this).addClass("active");
          $(this).find("i").attr("class", "fa-solid fa-compress");
          $(this).attr("title", "退出专注");
        }
        return;
      }
      if (md === "quick-phrases") {
        var $popup = $p.find("#ms-qp-popup");
        if ($popup.length) {
          $popup.remove();
          $(this).removeClass("active");
          ta.focus();
          return;
        }
        $(this).addClass("active");
        var popupHtml = '<div id="ms-qp-popup" class="ms-qp-popup">';
        if (data.quickPhrases.length === 0) {
          popupHtml +=
            '<span style="font-size:12px;color:var(--SmartThemeQuoteColor,#666);font-style:italic;">还没有快捷短语～</span>';
        } else {
          data.quickPhrases.forEach(function (qp) {
            var label = qp.content.length <= 100 ? qp.content : qp.title;
            popupHtml +=
              '<button class="ms-qp-chip" data-qpid="' +
              qp.id +
              '" title="' +
              esc(truncate(qp.content, 100)) +
              '">' +
              esc(truncate(label, 24)) +
              "</button>";
          });
        }
        popupHtml +=
          '<a class="ms-qp-popup-manage" id="ms-qp-goto-manage"><i class="fa-solid fa-gear" style="margin-right:3px;"></i>管理</a></div>';
        $p.find(".ms-md-toolbar").after(popupHtml);
        $p.find("#ms-qp-popup").on("click", ".ms-qp-chip", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var qpId = $(this).data("qpid");
          var qp = data.quickPhrases.find(function (q) {
            return q.id === qpId;
          });
          if (qp && ta) {
            ta.focus();
            insertAtCursor(ta, qp.content);
            um.capture();
            var s3 = countStats(ta.value);
            $p.find("#ms-char-count").text(
              s3.chars + " 字 · " + s3.lines + " 行",
            );
            markDirty();
          }
        });
        var closeQpPopup = function () {
          var $pop = $p.find("#ms-qp-popup");
          if ($pop.length) {
            $pop.remove();
            $p.find("[data-md='quick-phrases']").removeClass("active");
          }
          $p.off("pointerdown.ms-qp-close");
        };
        setTimeout(function () {
          $p.on("pointerdown.ms-qp-close", function (ev) {
            if (
              $(ev.target).closest(
                "#ms-qp-popup, [data-md='quick-phrases'], .ms-form-edit, .ms-md-toolbar, .ms-find-bar",
              ).length
            )
              return;
            closeQpPopup();
          });
        }, 50);
        $p.find("#ms-qp-goto-manage").on("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          $p.find("#ms-qp-popup").remove();
          $p.find("[data-md='quick-phrases']").removeClass("active");
          v._savedEditState = {
            title: $p.find("#ms-edit-title").val() || "",
            content: $p.find("#ms-edit-content").val() || "",
            groupId: $p.find("#ms-edit-group").val() || "",
            author: $p.find("#ms-edit-author").val() || "",
            series: $p.find("#ms-edit-series").val() || "",
            tags: [...editTags],
            cursorPos: ta.selectionStart,
            focusMode: $p.hasClass("ms-focus-mode"),
            findBarOpen: $p.find("#ms-find-bar").is(":visible"),
            findQuery: $p.find("#ms-find-input").val() || "",
            undoState: um ? um.getState() : null,
          };
          navigateTo({
            name: "quick-phrases",
            returnToEdit: v,
            editTaId: "ms-edit-content",
          });
        });
        return;
      }
      ta.focus();
      um.capture();
      if (md === "bold") wrapSelection(ta, "**", "**");
      else if (md === "italic") wrapSelection(ta, "*", "*");
      else if (md === "strike") wrapSelection(ta, "~~", "~~");
      else if (md === "heading") {
        var hs = ta.selectionStart,
          hv = ta.value;
        var hls = hv.lastIndexOf("\n", hs - 1) + 1;
        var hle = hv.indexOf("\n", hs);
        if (hle === -1) hle = hv.length;
        var hline = hv.substring(hls, hle);
        var hm = hline.match(/^(#{1,6})\s/);
        var _hst = ta.scrollTop;
        if (!hm) {
          ta.value = hv.substring(0, hls) + "# " + hv.substring(hls);
          ta.selectionStart = ta.selectionEnd = hs + 2;
        } else if (hm[1].length < 6) {
          ta.value = hv.substring(0, hls) + "#" + hv.substring(hls);
          ta.selectionStart = ta.selectionEnd = hs + 1;
        } else {
          var hrl = hm[0].length;
          ta.value =
            hv.substring(0, hls) + hline.substring(hrl) + hv.substring(hle);
          ta.selectionStart = ta.selectionEnd = Math.max(hls, hs - hrl);
        }
        ta.scrollTop = _hst;
        ta.focus();
      } else if (md === "quote") prependLine(ta, "> ");
      else if (md === "list") prependLine(ta, "- ");
      else if (md === "task") prependLine(ta, "- [ ] ");
      else if (md === "code") wrapSelection(ta, "`", "`");
      else if (md === "link") {
        var ls = ta.selectionStart,
          le = ta.selectionEnd;
        var lsel = ta.value.substring(ls, le) || "链接文字";
        var lins = "[" + lsel + "](url)";
        var _lst = ta.scrollTop;
        ta.value = ta.value.substring(0, ls) + lins + ta.value.substring(le);
        ta.selectionStart = ls + lsel.length + 3;
        ta.selectionEnd = ls + lsel.length + 6;
        ta.scrollTop = _lst;
        ta.focus();
      } else if (md === "image") {
        var is = ta.selectionStart,
          ie = ta.selectionEnd;
        var isel = ta.value.substring(is, ie) || "图片描述";
        var iins = "![" + isel + "](url)";
        var _ist = ta.scrollTop;
        ta.value = ta.value.substring(0, is) + iins + ta.value.substring(ie);
        ta.selectionStart = is + isel.length + 4;
        ta.selectionEnd = is + isel.length + 7;
        ta.scrollTop = _ist;
        ta.focus();
      } else if (md === "hr") {
        insertAtCursor(ta, "\n---\n");
      } else if (md === "table") {
        insertAtCursor(
          ta,
          "\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n",
        );
      }
      um.capture();
      const s2 = countStats(ta.value);
      var $pvPane = $p.find("#ms-edit-preview-pane");
      if ($pvPane.length) {
        $pvPane.html(renderMd(ta.value));
      }
      $p.find("#ms-char-count").text(s2.chars + " 字 · " + s2.lines + " 行");
      markDirty();
    });
    $p.find("#ms-body").on(
      "keydown.ms",
      "#ms-edit-title, #ms-edit-author, #ms-edit-series",
      function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          $p.find("#ms-edit-save").trigger("click");
        }
      },
    );
    $p.find("#ms-body").on("keydown.ms", "#ms-edit-content", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        um.undo();
        markDirty();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        um.redo();
        markDirty();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        $p.find("#ms-edit-save").trigger("click");
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertAtCursor(this, "  ");
        um.capture();
        markDirty();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const $bar = $p.find("#ms-find-bar");
        $bar.show();
        $p.find("[data-md='find']").addClass("active");
        const ta = getTa();
        if (ta && ta.selectionStart !== ta.selectionEnd) {
          $bar
            .find("#ms-find-input")
            .val(ta.value.substring(ta.selectionStart, ta.selectionEnd));
          findMatchIdx = 0;
          updateFindDisplay();
        }
        $bar.find("#ms-find-input").focus().select();
      }
    });
    let findMatchIdx = 0;

    function scrollTaToPos(ta, pos) {
      if (!ta) return;
      var text = ta.value.substring(0, pos);
      var lineCount = text.split("\n").length;
      var style = window.getComputedStyle(ta);
      var lineHeight = parseFloat(style.lineHeight);
      if (isNaN(lineHeight)) {
        lineHeight = parseFloat(style.fontSize) * 1.6;
      }
      var targetTop = (lineCount - 1) * lineHeight;
      var visibleTop = ta.scrollTop;
      var visibleBottom = ta.scrollTop + ta.clientHeight;
      if (
        targetTop < visibleTop + lineHeight ||
        targetTop > visibleBottom - lineHeight * 2
      ) {
        ta.scrollTop = Math.max(0, targetTop - ta.clientHeight / 3);
      }
    }

    function getFindPositions(query) {
      const ta = getTa();
      if (!ta || !query) return [];
      const text = ta.value.toLowerCase();
      const q = query.toLowerCase();
      const positions = [];
      let pos = 0;
      while ((pos = text.indexOf(q, pos)) !== -1) {
        positions.push(pos);
        pos += 1;
      }
      return positions;
    }
    function updateFindDisplay() {
      const query = $p.find("#ms-find-input").val();
      const positions = getFindPositions(query);
      const $cnt = $p.find("#ms-find-count");
      if (!query) {
        $cnt.text("").removeClass("no-match");
        findMatchIdx = 0;
      } else if (positions.length === 0) {
        $cnt.text("0/0").addClass("no-match");
        findMatchIdx = 0;
      } else {
        if (findMatchIdx >= positions.length) findMatchIdx = 0;
        $cnt
          .text(findMatchIdx + 1 + "/" + positions.length)
          .removeClass("no-match");
      }
    }
    function jumpToMatch(dir) {
      const query = $p.find("#ms-find-input").val();
      const positions = getFindPositions(query);
      if (positions.length === 0) return;
      if (dir === "next") findMatchIdx++;
      else if (dir === "prev") findMatchIdx--;
      findMatchIdx =
        ((findMatchIdx % positions.length) + positions.length) %
        positions.length;
      const ta = getTa();
      if (ta) {
        ta.focus();
        ta.setSelectionRange(
          positions[findMatchIdx],
          positions[findMatchIdx] + query.length,
        );
        scrollTaToPos(ta, positions[findMatchIdx]);
      }
      $p.find("#ms-find-count")
        .text(findMatchIdx + 1 + "/" + positions.length)
        .removeClass("no-match");
    }
    $p.find("#ms-body").on("input.ms", "#ms-find-input", function () {
      findMatchIdx = 0;
      updateFindDisplay();
    });
    $p.find("#ms-body").on("keydown.ms", "#ms-find-input", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        $p.find("#ms-edit-save").trigger("click");
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        jumpToMatch(e.shiftKey ? "prev" : "next");
      }
      if (e.key === "Escape") {
        $p.find("#ms-find-bar").hide();
        $p.find("[data-md='find']").removeClass("active");
        getTa()?.focus();
      }
    });
    $p.find("#ms-body").on(
      "mousedown.ms",
      "#ms-find-prev, #ms-find-next, #ms-replace-one, #ms-replace-all",
      function (e) {
        e.preventDefault();
      },
    );
    $p.find("#ms-body").on("click.ms", "#ms-find-prev", function () {
      jumpToMatch("prev");
    });
    $p.find("#ms-body").on("click.ms", "#ms-find-next", function () {
      jumpToMatch("next");
    });
    $p.find("#ms-body").on("click.ms", "#ms-find-close", function () {
      $p.find("#ms-find-bar").hide();
      $p.find("[data-md='find']").removeClass("active");
      getTa()?.focus();
    });
    $p.find("#ms-body").on("click.ms", "#ms-replace-one", function () {
      var query = $p.find("#ms-find-input").val();
      var replaceText = $p.find("#ms-replace-input").val() || "";
      var positions = getFindPositions(query);
      if (positions.length === 0 || !query) return;
      if (findMatchIdx >= positions.length) findMatchIdx = 0;
      var ta = getTa();
      if (!ta) return;
      var pos = positions[findMatchIdx];
      var _rst = ta.scrollTop;
      ta.value =
        ta.value.substring(0, pos) +
        replaceText +
        ta.value.substring(pos + query.length);
      ta.scrollTop = _rst;
      um.capture();
      var s = countStats(ta.value);
      $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
      markDirty();
      var newPositions = getFindPositions(query);
      if (newPositions.length > 0) {
        if (findMatchIdx >= newPositions.length) findMatchIdx = 0;
        ta.focus();
        ta.setSelectionRange(
          newPositions[findMatchIdx],
          newPositions[findMatchIdx] + query.length,
        );
        scrollTaToPos(ta, newPositions[findMatchIdx]);
      }
      updateFindDisplay();
    });
    $p.find("#ms-body").on("click.ms", "#ms-replace-all", function () {
      var query = $p.find("#ms-find-input").val();
      var replaceText = $p.find("#ms-replace-input").val() || "";
      if (!query) return;
      var ta = getTa();
      if (!ta) return;
      var before = ta.value;
      var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var _rast = ta.scrollTop;
      ta.value = ta.value.replace(new RegExp(escaped, "gi"), function () {
        return replaceText;
      });
      ta.scrollTop = _rast;
      if (ta.value !== before) {
        um.capture();
        var s = countStats(ta.value);
        $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
        markDirty();
        var cnt = (before.match(new RegExp(escaped, "gi")) || []).length;
        toast("success", "已替换 " + cnt + " 处");
      } else {
        toast("info", "没有找到匹配内容");
      }
      findMatchIdx = 0;
      updateFindDisplay();
    });
    $p.find("#ms-body").on("keydown.ms", "#ms-replace-input", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        $p.find("#ms-edit-save").trigger("click");
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        $p.find("#ms-replace-one").trigger("click");
      }
      if (e.key === "Escape") {
        $p.find("#ms-find-bar").hide();
        $p.find("[data-md='find']").removeClass("active");
        getTa()?.focus();
      }
    });
    $p.find("#ms-edit-content").on("scroll.ms-edit-st", function () {
      var $btn = $p.find("#ms-edit-scroll-top");
      if (this.scrollTop > 150) $btn.addClass("visible");
      else $btn.removeClass("visible");
    });
    $p.find("#ms-edit-scroll-top").on("click.ms", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $p.find("#ms-edit-content").animate({ scrollTop: 0 }, 200);
    });
    $p.find("#ms-body").on("click.ms", "#ms-edit-cancel", function () {
      clearDraft();
      navigateBack();
    });
    $p.find("#ms-body").on("click.ms", "#ms-edit-save", () => {
      const t = $p.find("#ms-edit-title").val().trim(),
        c = $p.find("#ms-edit-content").val().trim(),
        g2 = $p.find("#ms-edit-group").val() || null,
        a = $p.find("#ms-edit-author").val().trim(),
        sr = $p.find("#ms-edit-series").val().trim();
      if (!t && !c) {
        toast("warning", "标题和内容不能都为空");
        return;
      }
      editDirty = false;
      clearDraft();
      if (v.promptId) {
        const existingP = getPrompt(v.promptId);
        if (
          existingP &&
          (existingP.title !== (t || "未命名") || existingP.content !== c)
        ) {
          pushHistory(existingP);
        }
        updatePrompt(v.promptId, {
          title: t || "未命名",
          content: c,
          groupId: g2,
          author: a,
          series: sr,
          tags: editTags,
        });
      } else {
        var newPr = createPrompt({
          title: t || "未命名",
          content: c,
          groupId: g2,
          author: a,
          series: sr,
          tags: editTags,
        });
        v.promptId = newPr.id;
      }
      navigateBack();
    });
    if (v._savedEditState) {
      var ss = v._savedEditState;
      $p.find("#ms-edit-title").val(ss.title);
      $p.find("#ms-edit-content").val(ss.content);
      $p.find("#ms-edit-group").val(ss.groupId);
      $p.find("#ms-edit-author").val(ss.author);
      $p.find("#ms-edit-series").val(ss.series || "");
      editTags = ss.tags ? [...ss.tags] : [];
      $p.find("#ms-edit-tags").html(buildTagsUI());
      var rs = countStats(ss.content);
      $p.find("#ms-char-count").text(rs.chars + " 字 · " + rs.lines + " 行");
      um = createUndoManager(getTa);
      if (ss.undoState) um.setState(ss.undoState);
      if (v._pendingInsert) {
        var ta2 = getTa();
        if (ta2) {
          var pos =
            ss.cursorPos !== undefined ? ss.cursorPos : ta2.value.length;
          ta2.selectionStart = ta2.selectionEnd = pos;
          insertAtCursor(ta2, v._pendingInsert);
          um.capture();
          var rs2 = countStats(ta2.value);
          $p.find("#ms-char-count").text(
            rs2.chars + " 字 · " + rs2.lines + " 行",
          );
        }
        delete v._pendingInsert;
      }
      delete v._savedEditState;
      markDirty();
      if (ss.findBarOpen) {
        $p.find("#ms-find-bar").show();
        $p.find("[data-md='find']").addClass("active");
        if (ss.findQuery) $p.find("#ms-find-input").val(ss.findQuery);
      }
      if (ss.focusMode) {
        var el2 = $p[0];
        $p.data("ms-focus-saved-pos", {
          left: el2.style.getPropertyValue("left"),
          top: el2.style.getPropertyValue("top"),
          transform: el2.style.getPropertyValue("transform"),
          panelPos: data.settings.panelPos
            ? { ...data.settings.panelPos }
            : null,
        });
        el2.style.removeProperty("left");
        el2.style.removeProperty("top");
        el2.style.removeProperty("transform");
        $p.addClass("ms-focus-mode");
        var $focusBtn = $p.find("[data-md='focus']");
        $focusBtn.addClass("active").attr("title", "退出专注");
        $focusBtn.find("i").attr("class", "fa-solid fa-compress");
      }
    }
  }

  function renderQuickPhrases(v) {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("快捷短语");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: false,
        add: true,
        addId: "ms-qp-add",
      }),
    );
    let html = "";
    if (data.quickPhrases.length === 0)
      html = `<div class="ms-empty"><i class="fa-solid fa-bolt"></i>还没有快捷短语</div>`;
    else
      data.quickPhrases.forEach((qp) => {
        html += `<div class="ms-qp-item"><div class="ms-qp-header"><i class="fa-solid fa-angle-right ms-qp-arrow"></i><span class="ms-qp-title">${esc(qp.title)}</span><div style="display:flex;gap:2px;"><button class="ms-card-qbtn" data-qp-action="edit" data-qpid="${qp.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-card-qbtn" data-qp-action="delete" data-qpid="${qp.id}"><i class="fa-solid fa-trash"></i></button></div></div><div class="ms-qp-body"><div>${esc(truncate(qp.content, 200))}</div>${v.editTaId ? `<button class="ms-qp-insert" data-qpid="${qp.id}"><i class="fa-solid fa-arrow-turn-down"></i> 插入到编辑器</button>` : ""}</div></div>`;
      });
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(`<span>${data.quickPhrases.length} 条短语</span>`)
      .show();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", ".ms-qp-header", function (e) {
      if ($(e.target).closest(".ms-card-qbtn").length) return;
      $(this).closest(".ms-qp-item").find(".ms-qp-body").toggleClass("open");
      $(this).find(".ms-qp-arrow").toggleClass("open");
    });
    $p.find("#ms-body").on("click.ms", "[data-qp-action='edit']", function (e) {
      e.stopPropagation();
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: $(this).data("qpid"),
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      });
    });
    $p.find("#ms-body").on(
      "click.ms",
      "[data-qp-action='delete']",
      function (e) {
        e.stopPropagation();
        if (confirm("确定删除？")) {
          data.quickPhrases = data.quickPhrases.filter(
            (q) => q.id !== $(this).data("qpid"),
          );
          saveData();
          renderQuickPhrases(v);
        }
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-qp-insert", function (e) {
      e.stopPropagation();
      const qp = data.quickPhrases.find((q) => q.id === $(this).data("qpid"));
      if (!qp) return;
      if (v.returnToEdit) {
        v.returnToEdit._pendingInsert = qp.content;
      }
      navigateBack();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-qp-add", () =>
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: null,
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      }),
    );
  }

  function renderQuickPhraseEdit(v) {
    const $p = $("#" + PANEL_ID),
      qp = v.phraseId
        ? data.quickPhrases.find((q) => q.id === v.phraseId)
        : null,
      isNew = !qp;
    $p.find("#ms-title").text(isNew ? "新建短语" : "编辑短语");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">${isNew ? "新建" : "编辑"}快捷短语</span>`,
    );
    $p.find("#ms-body").html(
      `<div class="ms-form"><div class="ms-field"><label>标题</label><input type="text" id="ms-qpe-title" value="${esc(qp ? qp.title : "")}"></div><div class="ms-field"><label>内容</label><textarea id="ms-qpe-content" style="min-height:140px;">${esc(qp ? qp.content : "")}</textarea></div><div class="ms-form-btns"><button class="ms-btn" id="ms-qpe-cancel">取消</button><button class="ms-btn primary" id="ms-qpe-save">保存</button></div></div>`,
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-qpe-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-qpe-save", () => {
      const t = $p.find("#ms-qpe-title").val().trim(),
        c = $p.find("#ms-qpe-content").val().trim();
      if (!t && !c) {
        toast("warning", "不能都为空");
        return;
      }
      if (v.phraseId) {
        const i = data.quickPhrases.findIndex((q) => q.id === v.phraseId);
        if (i >= 0) {
          data.quickPhrases[i].title = t || "未命名";
          data.quickPhrases[i].content = c;
        }
      } else
        data.quickPhrases.push({ id: uid(), title: t || "未命名", content: c });
      saveData();
      toast("success", isNew ? "已创建" : "已保存");
      navigateBack();
    });
  }

  function renderGroups() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("分组管理");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">分组管理</span><div class="ms-toolbar-actions"><button class="ms-tbtn ${groupSelectMode ? "active" : ""}" id="ms-group-select" title="多选"><i class="fa-solid fa-check-double"></i></button><button class="ms-tbtn" id="ms-group-reorder" title="调整顺序"><i class="fa-solid fa-arrows-up-down"></i></button><button class="ms-tbtn" id="ms-group-add"><i class="fa-solid fa-plus"></i> 新建</button></div>`,
    );
    let expandedColorId = null;
    function buildGroupsBody() {
      let html = "";
      if (data.groups.length === 0)
        html = `<div class="ms-empty"><i class="fa-solid fa-folder-open"></i>还没有分组</div>`;
      else
        data.groups.forEach((g) => {
          const cnt = getPromptsInGroup(g.id).length;
          const isSel = selectedGroupIds.has(g.id);
          if (groupSelectMode) {
            html += `<div class="ms-gitem ${isSel ? "ms-gitem-selected" : ""}" data-gid="${g.id}"><div class="ms-gitem-check"><i class="fa-solid fa-check"></i></div><span class="ms-gitem-color" style="background:${g.color};cursor:default;"></span><span class="ms-gitem-name">${esc(g.name)}${g.note ? "<br><span style='font-size:10px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;'>" + esc(truncate(g.note, 30)) + "</span>" : ""}</span><span class="ms-gitem-cnt">${cnt}</span></div>`;
          } else {
            html += `<div class="ms-gitem"><span class="ms-gitem-color" style="background:${g.color}" data-gid="${g.id}"></span><span class="ms-gitem-name">${esc(g.name)}${g.note ? "<br><span style='font-size:10px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;'>" + esc(truncate(g.note, 30)) + "</span>" : ""}</span><span class="ms-gitem-cnt">${cnt}</span><button class="ms-gitem-btn" data-action="rename" data-gid="${g.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-gitem-btn danger" data-action="delete-group" data-gid="${g.id}"><i class="fa-solid fa-trash"></i></button></div>`;
            if (expandedColorId === g.id) {
              const isCustomGroupColor = !GROUP_COLORS.includes(g.color);
              html += `<div class="ms-color-inline">${GROUP_COLORS.map((c) => `<span class="ms-color-opt ${g.color === c ? "selected" : ""}" data-color="${c}" data-gid="${g.id}" style="background:${c}"></span>`).join("")}<span class="ms-color-opt ms-color-custom ${isCustomGroupColor ? "selected" : ""}" data-gid="${g.id}" title="+自定义"><input type="color" class="ms-custom-color-input" data-gid="${g.id}" value="${g.color}"></span></div>`;
            }
          }
        });
      return html;
    }
    function buildGroupBatchFooter() {
      const allSel =
        data.groups.length > 0 &&
        data.groups.every((g) => selectedGroupIds.has(g.id));
      const noneSel = selectedGroupIds.size === 0;
      const selIcon = allSel
        ? "fa-solid fa-square-check"
        : noneSel
          ? "fa-regular fa-square"
          : "fa-solid fa-square-minus";
      const selColor = noneSel
        ? "var(--SmartThemeQuoteColor,#666)"
        : "var(--ms-accent)";
      const selLabel = allSel ? " 取消" : " 全选";
      return `<div class="ms-batch-bar"><span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ${selectedGroupIds.size}</span><button class="ms-batch-btn" data-gbatch="selectall"><i class="${selIcon}" style="color:${selColor};"></i><span class="ms-btn-label">${selLabel}</span></button><button class="ms-batch-btn danger" data-gbatch="delete"><i class="fa-solid fa-trash"></i><span class="ms-btn-label"> 删除</span></button></div>`;
    }
    $p.find("#ms-body").html(buildGroupsBody());
    if (groupSelectMode) {
      $p.find("#ms-footer").html(buildGroupBatchFooter()).show();
    } else {
      $p.find("#ms-footer").hide();
    }
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-group-select", () => {
      groupSelectMode = !groupSelectMode;
      if (!groupSelectMode) selectedGroupIds.clear();
      renderGroups();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-group-add", () =>
      navigateTo({ name: "group-edit", groupId: null }),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-group-reorder", () => {
      if (data.groups.length > 1) navigateTo({ name: "reorder-groups" });
      else toast("info", "至少需要2个分组才能排序哦");
    });
    if (groupSelectMode) {
      $p.find("#ms-body").on("click.ms", ".ms-gitem", function () {
        const gid = $(this).data("gid");
        if (!gid) return;
        if (selectedGroupIds.has(gid)) selectedGroupIds.delete(gid);
        else selectedGroupIds.add(gid);
        $p.find("#ms-body").html(buildGroupsBody());
        $p.find("#ms-footer").html(buildGroupBatchFooter());
      });
      $p.find("#ms-footer").on("click.ms", "[data-gbatch='selectall']", () => {
        const allSel =
          data.groups.length > 0 &&
          data.groups.every((g) => selectedGroupIds.has(g.id));
        if (allSel) selectedGroupIds.clear();
        else data.groups.forEach((g) => selectedGroupIds.add(g.id));
        $p.find("#ms-body").html(buildGroupsBody());
        $p.find("#ms-footer").html(buildGroupBatchFooter());
      });
      $p.find("#ms-footer").on("click.ms", "[data-gbatch='delete']", () => {
        if (selectedGroupIds.size === 0) return;
        let totalPrompts = 0;
        selectedGroupIds.forEach((gid) => {
          totalPrompts += getPromptsInGroup(gid).length;
        });
        const msg =
          totalPrompts > 0
            ? `确定删除选中的 ${selectedGroupIds.size} 个分组吗？\n其中共有 ${totalPrompts} 条剧场会变为未分组。`
            : `确定删除选中的 ${selectedGroupIds.size} 个分组吗？`;
        if (confirm(msg)) {
          selectedGroupIds.forEach((gid) => deleteGroup(gid));
          selectedGroupIds.clear();
          groupSelectMode = false;
          renderGroups();
          toast("success", "已删除");
        }
      });
    } else {
      $p.find("#ms-body").on("click.ms", ".ms-gitem-btn", function (e) {
        e.stopPropagation();
        const a = $(this).data("action"),
          gid = $(this).data("gid");
        if (a === "rename") navigateTo({ name: "group-edit", groupId: gid });
        else if (a === "delete-group") {
          const cnt = getPromptsInGroup(gid).length;
          if (
            confirm(
              cnt > 0
                ? `分组下有 ${cnt} 条，删除后变为未分组。确定？`
                : "确定删除？",
            )
          ) {
            deleteGroup(gid);
            renderGroups();
          }
        }
      });
      $p.find("#ms-body").on("click.ms", ".ms-gitem-color", function (e) {
        e.stopPropagation();
        const gid = $(this).data("gid");
        expandedColorId = expandedColorId === gid ? null : gid;
        var _gst = $p.find("#ms-body").scrollTop();
        $p.find("#ms-body").html(buildGroupsBody());
        $p.find("#ms-body").scrollTop(_gst);
      });
      $p.find("#ms-body").on(
        "click.ms",
        ".ms-color-inline .ms-color-opt:not(.ms-color-custom)",
        function (e) {
          e.stopPropagation();
          updateGroup($(this).data("gid"), { color: $(this).data("color") });
          var _gst = $p.find("#ms-body").scrollTop();
          $p.find("#ms-body").html(buildGroupsBody());
          $p.find("#ms-body").scrollTop(_gst);
        },
      );
      $p.find("#ms-body").on(
        "change.ms",
        ".ms-custom-color-input[data-gid]",
        function (e) {
          e.stopPropagation();
          const gid = $(this).data("gid");
          const color = $(this).val();
          if (gid && color) {
            updateGroup(gid, { color: color });
            var _gst = $p.find("#ms-body").scrollTop();
            $p.find("#ms-body").html(buildGroupsBody());
            $p.find("#ms-body").scrollTop(_gst);
          }
        },
      );
    }
  }

  function renderGroupEdit(v) {
    const $p = $("#" + PANEL_ID),
      g = v.groupId ? getGroup(v.groupId) : null,
      isNew = !g;
    $p.find("#ms-title").text(isNew ? "新建分组" : "编辑分组");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">${isNew ? "新建" : "编辑"}分组</span>`,
    );
    $p.find("#ms-body").html(`<div class="ms-form">
      <div class="ms-field"><label>名称</label><input type="text" id="ms-gedit-name" value="${esc(g ? g.name : "")}"></div>
      <div class="ms-field"><label>备注</label><input type="text" id="ms-gedit-note" placeholder="可选的简短说明" value="${esc(g ? g.note : "")}"></div>
      <div class="ms-field"><label>默认作者</label><input type="text" id="ms-gedit-author" placeholder="该分组下新建时自动填入" value="${esc(g ? g.defaultAuthor || "" : "")}"></div>
      <div class="ms-field"><label>注入前缀指令 <span style="font-weight:350;opacity:0.5;">(可选，留空用全局默认，用 {{stage}} 标记剧场插入位置)</span></label><textarea id="ms-gedit-prefix" style="min-height:50px;resize:vertical;" placeholder="该分组的剧场注入时使用此前缀">${esc(g ? g.stagePrefix || "" : "")}</textarea></div>
      ${!isNew ? `<div class="ms-divider"></div><button class="ms-tbtn" id="ms-group-set-all-author" style="width:100%;text-align:center;"><i class="fa-solid fa-user-pen"></i> 批量设置本组作者</button>` : ""}
      <div class="ms-form-btns"><button class="ms-btn" id="ms-gedit-cancel">取消</button><button class="ms-btn primary" id="ms-gedit-save">保存</button></div></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-gedit-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-group-set-all-author", () => {
      const authorVal = prompt("将本组所有剧场的作者统一设置为：");
      if (authorVal === null) return;
      const prompts = getPromptsInGroup(v.groupId);
      prompts.forEach((p) => {
        p.author = authorVal.trim();
      });
      saveData();
      toast("success", `已为${prompts.length} 条设置作者`);
    });
    $p.find("#ms-body").on("click.ms", "#ms-gedit-save", () => {
      const n = $p.find("#ms-gedit-name").val().trim(),
        note = $p.find("#ms-gedit-note").val().trim(),
        defAuthor = $p.find("#ms-gedit-author").val().trim();
      if (!n) {
        toast("warning", "名称不能为空");
        return;
      }
      var stagePrefix = $p.find("#ms-gedit-prefix").val() || "";
      if (v.groupId) {
        updateGroup(v.groupId, {
          name: n,
          note,
          defaultAuthor: defAuthor,
          stagePrefix: stagePrefix,
        });
      } else {
        const ng = createGroup(n);
        updateGroup(ng.id, {
          note,
          defaultAuthor: defAuthor,
          stagePrefix: stagePrefix,
        });
      }
      navigateBack();
    });
  }

  function renderTagManage() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("标签管理");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">标签管理</span><div class="ms-toolbar-actions"><button class="ms-tbtn ${tagSelectMode ? "active" : ""}" id="ms-tag-select" title="多选"><i class="fa-solid fa-check-double"></i></button><button class="ms-tbtn" id="ms-tag-reorder" title="调整顺序"><i class="fa-solid fa-arrows-up-down"></i></button><button class="ms-tbtn" id="ms-tag-add-btn"><i class="fa-solid fa-plus"></i> 新建</button></div>`,
    );
    let expandedColorId = null;
    function buildTagsBody() {
      let html = "";
      if (data.settings.definedTags.length === 0)
        html = `<div class="ms-empty"><i class="fa-solid fa-tags"></i>还没有标签</div>`;
      else
        data.settings.definedTags.forEach((t) => {
          const cnt = data.prompts.filter(
            (p) => p.tags && p.tags.includes(t.id),
          ).length;
          const isSel = selectedTagIds.has(t.id);
          if (tagSelectMode) {
            html += `<div class="ms-gitem ${isSel ? "ms-gitem-selected" : ""}" data-tid="${t.id}"><div class="ms-gitem-check"><i class="fa-solid fa-check"></i></div><span class="ms-gitem-color" style="background:${t.color};cursor:default;"></span><span class="ms-gitem-name">${esc(t.name)}</span><span class="ms-gitem-cnt">${cnt}</span></div>`;
          } else {
            html += `<div class="ms-gitem"><span class="ms-gitem-color" style="background:${t.color}" data-tid="${t.id}"></span><span class="ms-gitem-name">${esc(t.name)}</span><span class="ms-gitem-cnt">${cnt}</span><button class="ms-gitem-btn" data-action="rename-tag" data-tid="${t.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-gitem-btn danger" data-action="delete-tag" data-tid="${t.id}"><i class="fa-solid fa-trash"></i></button></div>`;
            if (expandedColorId === t.id) {
              const isCustomTagColor = !TAG_COLORS.includes(t.color);
              html += `<div class="ms-color-inline">${TAG_COLORS.map((c) => `<span class="ms-color-opt ${t.color === c ? "selected" : ""}" data-color="${c}" data-tid="${t.id}" style="background:${c}"></span>`).join("")}<span class="ms-color-opt ms-color-custom ${isCustomTagColor ? "selected" : ""}" data-tid="${t.id}" title="+自定义"><input type="color" class="ms-custom-color-input" data-tid="${t.id}" value="${t.color}"></span></div>`;
            }
          }
        });
      return html;
    }
    function buildTagBatchFooter() {
      const allSel =
        data.settings.definedTags.length > 0 &&
        data.settings.definedTags.every((t) => selectedTagIds.has(t.id));
      const noneSel = selectedTagIds.size === 0;
      const selIcon = allSel
        ? "fa-solid fa-square-check"
        : noneSel
          ? "fa-regular fa-square"
          : "fa-solid fa-square-minus";
      const selColor = noneSel
        ? "var(--SmartThemeQuoteColor,#666)"
        : "var(--ms-accent)";
      const selLabel = allSel ? " 取消" : " 全选";
      return `<div class="ms-batch-bar"><span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ${selectedTagIds.size}</span><button class="ms-batch-btn" data-tbatch="selectall"><i class="${selIcon}" style="color:${selColor};"></i><span class="ms-btn-label">${selLabel}</span></button><button class="ms-batch-btn danger" data-tbatch="delete"><i class="fa-solid fa-trash"></i><span class="ms-btn-label"> 删除</span></button></div>`;
    }
    $p.find("#ms-body").html(buildTagsBody());
    if (tagSelectMode) {
      $p.find("#ms-footer").html(buildTagBatchFooter()).show();
    } else {
      $p.find("#ms-footer").hide();
    }
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-tag-select", () => {
      tagSelectMode = !tagSelectMode;
      if (!tagSelectMode) selectedTagIds.clear();
      renderTagManage();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-tag-reorder", () => {
      if (data.settings.definedTags.length > 1)
        navigateTo({ name: "reorder-tags" });
      else toast("info", "至少需要2个标签才能排序哦");
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-tag-add-btn", () => {
      const n = prompt("新标签名称:");
      if (n && n.trim()) {
        createTag(n.trim());
        renderTagManage();
      }
    });
    if (tagSelectMode) {
      $p.find("#ms-body").on("click.ms", ".ms-gitem", function () {
        const tid = $(this).data("tid");
        if (!tid) return;
        if (selectedTagIds.has(tid)) selectedTagIds.delete(tid);
        else selectedTagIds.add(tid);
        $p.find("#ms-body").html(buildTagsBody());
        $p.find("#ms-footer").html(buildTagBatchFooter());
      });
      $p.find("#ms-footer").on("click.ms", "[data-tbatch='selectall']", () => {
        const allSel =
          data.settings.definedTags.length > 0 &&
          data.settings.definedTags.every((t) => selectedTagIds.has(t.id));
        if (allSel) selectedTagIds.clear();
        else data.settings.definedTags.forEach((t) => selectedTagIds.add(t.id));
        $p.find("#ms-body").html(buildTagsBody());
        $p.find("#ms-footer").html(buildTagBatchFooter());
      });
      $p.find("#ms-footer").on("click.ms", "[data-tbatch='delete']", () => {
        if (selectedTagIds.size === 0) return;
        let totalUsed = 0;
        selectedTagIds.forEach((tid) => {
          totalUsed += data.prompts.filter(
            (p) => p.tags && p.tags.includes(tid),
          ).length;
        });
        const msg =
          totalUsed > 0
            ? `确定删除选中的 ${selectedTagIds.size} 个标签吗？\n共有 ${totalUsed} 条剧场使用了这些标签，标签将从它们身上移除。`
            : `确定删除选中的 ${selectedTagIds.size} 个标签吗？`;
        if (confirm(msg)) {
          selectedTagIds.forEach((tid) => deleteTag(tid));
          selectedTagIds.clear();
          tagSelectMode = false;
          renderTagManage();
          toast("success", "已删除");
        }
      });
    } else {
      $p.find("#ms-body").on(
        "click.ms",
        "[data-action='rename-tag']",
        function (e) {
          e.stopPropagation();
          const t = getTag($(this).data("tid"));
          if (!t) return;
          const n = prompt("重命名:", t.name);
          if (n && n.trim()) {
            updateTag(t.id, { name: n.trim() });
            renderTagManage();
          }
        },
      );
      $p.find("#ms-body").on(
        "click.ms",
        "[data-action='delete-tag']",
        function (e) {
          e.stopPropagation();
          if (confirm("删除标签？")) {
            deleteTag($(this).data("tid"));
            renderTagManage();
          }
        },
      );
      $p.find("#ms-body").on(
        "click.ms",
        ".ms-gitem-color[data-tid]",
        function (e) {
          e.stopPropagation();
          const tid = $(this).data("tid");
          expandedColorId = expandedColorId === tid ? null : tid;
          var _tst = $p.find("#ms-body").scrollTop();
          $p.find("#ms-body").html(buildTagsBody());
          $p.find("#ms-body").scrollTop(_tst);
        },
      );
      $p.find("#ms-body").on(
        "click.ms",
        ".ms-color-inline .ms-color-opt:not(.ms-color-custom)",
        function (e) {
          e.stopPropagation();
          updateTag($(this).data("tid"), { color: $(this).data("color") });
          var _tst = $p.find("#ms-body").scrollTop();
          $p.find("#ms-body").html(buildTagsBody());
          $p.find("#ms-body").scrollTop(_tst);
        },
      );
      $p.find("#ms-body").on(
        "change.ms",
        ".ms-custom-color-input[data-tid]",
        function (e) {
          e.stopPropagation();
          const tid = $(this).data("tid");
          const color = $(this).val();
          if (tid && color) {
            updateTag(tid, { color: color });
            var _tst = $p.find("#ms-body").scrollTop();
            $p.find("#ms-body").html(buildTagsBody());
            $p.find("#ms-body").scrollTop(_tst);
          }
        },
      );
    }
  }

  function renderStats() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("使用统计");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">使用统计</span>`,
    );

    const totalPrompts = data.prompts.length;
    const totalGroups = data.groups.length;
    const totalTags = data.settings.definedTags.length;
    const totalUsage = data.prompts.reduce(
      (s, p) => s + (p.usageCount || 0),
      0,
    );
    const starredCount = data.prompts.filter((p) => p.starred).length;
    const usedPrompts = data.prompts.filter((p) => p.usageCount > 0);
    const avgUsage =
      usedPrompts.length > 0
        ? (totalUsage / usedPrompts.length).toFixed(1)
        : "0";

    let html = `<div class="ms-stats-grid">
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-masks-theater"></i></span><span class="ms-stat-value">${totalPrompts}</span><span class="ms-stat-label">总剧场数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-paper-plane"></i></span><span class="ms-stat-value">${totalUsage}</span><span class="ms-stat-label">总使用次数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-star"></i></span><span class="ms-stat-value">${starredCount}</span><span class="ms-stat-label">收藏数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-chart-line"></i></span><span class="ms-stat-value">${avgUsage}</span><span class="ms-stat-label">平均使用次数</span></div>
    </div>`;

    if (totalGroups > 0 && totalPrompts > 0) {
      const groupStats = data.groups.map((g) => ({
        name: g.name,
        color: g.color,
        count: getPromptsInGroup(g.id).length,
      }));
      const ungroupedCount = getUngroupedPrompts().length;
      if (ungroupedCount > 0)
        groupStats.push({
          name: "未分组",
          color: "#888",
          count: ungroupedCount,
        });
      html += `<div class="ms-stats-section">分组分布</div><div class="ms-stats-group-bar">`;
      groupStats.forEach((gs) => {
        const pct = Math.max((gs.count / totalPrompts) * 100, 1);
        html += `<div class="ms-stats-group-seg" style="width:${pct}%;background:${gs.color};" title="${esc(gs.name)}: ${gs.count}"></div>`;
      });
      html += `</div><div class="ms-stats-group-legend">`;
      groupStats.forEach((gs) => {
        html += `<span class="ms-stats-group-legend-item"><span class="ms-stats-group-legend-dot" style="background:${gs.color};"></span>${esc(gs.name)} (${gs.count})</span>`;
      });
      html += `</div>`;
    }

    const topUsed = [...data.prompts]
      .filter((p) => p.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
    const maxUsage = topUsed.length > 0 ? topUsed[0].usageCount : 1;

    if (topUsed.length > 0) {
      html += `<div class="ms-stats-section">最常使用 TOP ${topUsed.length}</div><div class="ms-stats-rank">`;
      topUsed.forEach((p, i) => {
        const posCls =
          i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "normal";
        const barW = Math.max((p.usageCount / maxUsage) * 100, 5);
        const g = p.groupId ? getGroup(p.groupId) : null;
        const gLabel = g ? esc(g.name) : "未分组";
        html += `<div class="ms-stats-rank-item">
          <span class="ms-stats-rank-pos ${posCls}">${i + 1}</span>
          <div class="ms-stats-rank-info"><div class="ms-stats-rank-name">${esc(p.title)}</div><div class="ms-stats-rank-meta">${gLabel}</div></div>
          <div class="ms-stats-rank-bar-wrap"><div class="ms-stats-rank-bar" style="width:${barW}%;"></div></div>
          <span class="ms-stats-rank-count">${p.usageCount}次</span>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="ms-stats-section">最常使用</div><div class="ms-stats-empty">还没有使用记录，快去发送一条剧场吧～</div>`;
    }

    const recentUsed = [...data.prompts]
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, 5);
    if (recentUsed.length > 0) {
      html += `<div class="ms-stats-section" style="margin-top:6px;">最近使用</div><div class="ms-stats-rank">`;
      recentUsed.forEach((p, i) => {
        const posCls = "normal";
        const g = p.groupId ? getGroup(p.groupId) : null;
        const gLabel = g ? esc(g.name) : "未分组";
        const timeAgo = formatDate(p.lastUsedAt);
        html += `<div class="ms-stats-rank-item">
          <span class="ms-stats-rank-pos ${posCls}"><i class="fa-solid fa-clock" style="font-size:9px;"></i></span>
          <div class="ms-stats-rank-info"><div class="ms-stats-rank-name">${esc(p.title)}</div><div class="ms-stats-rank-meta">${gLabel} · ${timeAgo}</div></div>
          <span class="ms-stats-rank-count">${p.usageCount || 0}次</span>
        </div>`;
      });
      html += `</div>`;
    }

    if (totalTags > 0 && totalPrompts > 0) {
      var tagStats = data.settings.definedTags
        .map(function (t) {
          return {
            name: t.name,
            color: t.color,
            count: data.prompts.filter(function (p) {
              return p.tags && p.tags.includes(t.id);
            }).length,
          };
        })
        .filter(function (ts) {
          return ts.count > 0;
        })
        .sort(function (a, b) {
          return b.count - a.count;
        });
      if (tagStats.length > 0) {
        html +=
          '<div class="ms-stats-section">标签分布</div><div class="ms-stats-group-bar">';
        var tagTotal = tagStats.reduce(function (s, ts) {
          return s + ts.count;
        }, 0);
        tagStats.forEach(function (ts) {
          var pct = Math.max((ts.count / tagTotal) * 100, 1);
          html +=
            '<div class="ms-stats-group-seg" style="width:' +
            pct +
            "%;background:" +
            ts.color +
            ';" title="' +
            esc(ts.name) +
            ": " +
            ts.count +
            '"></div>';
        });
        html += '</div><div class="ms-stats-group-legend">';
        tagStats.forEach(function (ts) {
          html +=
            '<span class="ms-stats-group-legend-item"><span class="ms-stats-group-legend-dot" style="background:' +
            ts.color +
            ';"></span>' +
            esc(ts.name) +
            " (" +
            ts.count +
            ")</span>";
        });
        html += "</div>";
      }
    }

    var allSeries = {};
    data.prompts.forEach(function (p) {
      if (p.series && p.series.trim()) {
        var sn = p.series.trim();
        allSeries[sn] = (allSeries[sn] || 0) + 1;
      }
    });
    var seriesNames = Object.keys(allSeries);
    if (seriesNames.length > 0) {
      var topSeries = seriesNames
        .map(function (n) {
          return { name: n, count: allSeries[n] };
        })
        .sort(function (a, b) {
          return b.count - a.count;
        })
        .slice(0, 5);
      html +=
        '<div class="ms-stats-section">热门系列 TOP ' +
        topSeries.length +
        '</div><div class="ms-stats-rank">';
      topSeries.forEach(function (s, i) {
        var posCls =
          i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "normal";
        html +=
          '<div class="ms-stats-rank-item"><span class="ms-stats-rank-pos ' +
          posCls +
          '">' +
          (i + 1) +
          '</span><div class="ms-stats-rank-info"><div class="ms-stats-rank-name"><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:11px;margin-right:4px;"></i>' +
          esc(s.name) +
          '</div></div><span class="ms-stats-rank-count">' +
          s.count +
          " 条</span></div>";
      });
      html += "</div>";
    }

    var totalChars = data.prompts.reduce(function (s, p) {
      return s + (p.content || "").length;
    }, 0);
    var unusedCount = data.prompts.filter(function (p) {
      return !p.usageCount || p.usageCount === 0;
    }).length;
    var longestPrompt = data.prompts.reduce(
      function (max, p) {
        return (p.content || "").length > (max.content || "").length ? p : max;
      },
      { content: "" },
    );
    var funFacts = [];
    funFacts.push(
      '<i class="fa-solid fa-pen-nib" style="margin-right:4px;color:var(--ms-accent);"></i>累计创作了 <strong>' +
        totalChars.toLocaleString() +
        "</strong> 个字符",
    );
    if (totalChars > 10000)
      funFacts.push("约 " + Math.round(totalChars / 500) + " 页 A4 纸");
    funFacts.push(
      '<i class="fa-solid fa-layer-group" style="margin-right:4px;color:var(--ms-accent);"></i>共有 <strong>' +
        seriesNames.length +
        "</strong> 个系列",
    );
    if (unusedCount > 0)
      funFacts.push(
        '<i class="fa-solid fa-ghost" style="margin-right:4px;opacity:0.5;"></i>还有 <strong>' +
          unusedCount +
          "</strong> 条从未被使用过",
      );
    if (longestPrompt.title)
      funFacts.push(
        '<i class="fa-solid fa-ruler" style="margin-right:4px;opacity:0.5;"></i>最长的剧场是「' +
          esc(truncate(longestPrompt.title, 15)) +
          "」共 " +
          (longestPrompt.content || "").length +
          " 字",
      );

    html +=
      '<div class="ms-stats-section" style="margin-top:6px;">趣味事实</div>';
    html += '<div style="padding:6px 14px;">';
    funFacts.forEach(function (f) {
      html +=
        '<div style="padding:4px 0;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;">' +
        f +
        "</div>";
    });
    html += "</div>";
    var sortedByDate = []
      .concat(data.prompts)
      .filter(function (p) {
        return p.createdAt;
      })
      .sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });
    if (sortedByDate.length >= 2) {
      var firstDate = new Date(sortedByDate[0].createdAt);
      var lastDate = new Date(sortedByDate[sortedByDate.length - 1].createdAt);
      var daysDiff = Math.max(1, Math.round((lastDate - firstDate) / 86400000));
      var rate = (totalPrompts / daysDiff).toFixed(1);
      html +=
        '<div class="ms-stats-section" style="margin-top:6px;">创作时间线</div>';
      html +=
        '<div style="padding:6px 14px;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;">';
      html +=
        '<div style="padding:2px 0;"><i class="fa-solid fa-calendar-day" style="margin-right:4px;color:var(--ms-accent);"></i>首次创作:<strong>' +
        formatDate(sortedByDate[0].createdAt) +
        "</strong></div>";
      html +=
        '<div style="padding:2px 0;"><i class="fa-solid fa-calendar-check" style="margin-right:4px;color:var(--ms-accent);"></i>最近创作: <strong>' +
        formatDate(sortedByDate[sortedByDate.length - 1].createdAt) +
        "</strong></div>";
      html +=
        '<div style="padding:2px 0;"><i class="fa-solid fa-chart-simple" style="margin-right:4px;color:var(--ms-accent);"></i>跨度 <strong>' +
        daysDiff +
        "</strong> 天，平均每天 <strong>" +
        rate +
        "</strong> 条</div>";
      html += "</div>";
    }
    html +=
      '<div style="padding:12px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#555);text-align:center;">' +
      totalGroups +
      " 个分组 · " +
      totalTags +
      " 个标签 · " +
      usedPrompts.length +
      "/" +
      totalPrompts +
      " 条曾被使用</div>";

    $p.find("#ms-body").html(html);
    $p.find("#ms-footer").hide();
    bindAllEvents();
  }

  function renderSettings() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("设置");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">设置</span>`,
    );
    $p.find("#ms-body").html(
      `<div class="ms-form"><div class="ms-field"><label>默认作者署名</label><input type="text" id="ms-default-author" placeholder="新建时自动填入" value="${esc(data.settings.defaultAuthor || "")}"></div><div class="ms-divider"></div><div class="ms-section-label">注入设置</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-inject-enabled-toggle" ${data.settings.stageInjectEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">启用注入功能</span></div><div style="padding:4px 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>选中剧场后，内容会随下一次发送注入到 AI 提示词中</div><div id="ms-inject-details" style="${data.settings.stageInjectEnabled ? "" : "display:none;"}"><div class="ms-inject-settings-row"><label class="ms-inject-radio${data.settings.stageInjectMode === "depth" ? " active" : ""}" data-mode="depth"><input type="radio" name="ms-inject-mode" value="depth" ${data.settings.stageInjectMode === "depth" ? "checked" : ""}><i class="fa-solid fa-layer-group" style="margin-right:3px;font-size:11px;"></i>深度注入</label><label class="ms-inject-radio${data.settings.stageInjectMode === "macro" ? " active" : ""}" data-mode="macro"><input type="radio" name="ms-inject-mode" value="macro" ${data.settings.stageInjectMode === "macro" ? "checked" : ""}><i class="fa-solid fa-code" style="margin-right:3px;font-size:11px;"></i>自定义宏 {{stage}}</label></div><div class="ms-macro-info"><div class="ms-macro-info-title"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px;color:var(--ms-accent);"></i>可用宏</div><div><code>{{stage}}</code><span class="ms-macro-desc">剧场原始内容</span></div><div><code>{{stage_title}}</code><span class="ms-macro-desc">剧场标题</span></div><div><code>{{stage_count}}</code><span class="ms-macro-desc">选中的剧场总数</span></div><div><code>{{stage_tasks}}</code><span class="ms-macro-desc">所有任务块的拼接体</span></div><div><code>{{stage_prompt}}</code><span class="ms-macro-desc">前缀指令+剧场内容（完整注入体）</span></div></div><div id="ms-depth-opts" style="${data.settings.stageInjectMode === "depth" ? "" : "display:none;"}padding:0 14px;"><div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>注入深度</label><input type="number" id="ms-inject-depth" min="0" max="999" value="${data.settings.stageInjectDepth || 0}" style="width:100%;"></div><div class="ms-field" style="flex:1;"><label>消息角色</label><select id="ms-inject-role" style="width:100%;"><option value="system"${data.settings.stageInjectRole === "system" ? " selected" : ""}>System</option><option value="user"${data.settings.stageInjectRole === "user" ? " selected" : ""}>User</option><option value="assistant"${data.settings.stageInjectRole === "assistant" ? " selected" : ""}>Assistant</option></select></div></div></div><div class="ms-field" style="padding:6px 14px 0;"><label>默认前缀指令 <span style="font-weight:350;opacity:0.5;">(用 {{stage}} 标记剧场插入位置，不写则拼接在末尾)</span></label><textarea id="ms-default-prefix" style="min-height:120px;resize:vertical;" placeholder="例：在正文最后输出以下剧场内容...">${esc(data.settings.defaultStagePrefix || "")}</textarea></div><div class="ms-field" style="padding:6px 14px 0;"><label>多条外壳模板 <span style="font-weight:350;opacity:0.5;">(选多条剧场时的整体结构，用 {{stage_count}} 表示数量，{{stage_tasks}} 表示所有任务块)</span></label><textarea id="ms-multi-prefix" style="min-height:80px;resize:vertical;" placeholder="留空使用内置默认模板">${esc(data.settings.multiStagePrefix || "")}</textarea><div style="padding:4px 2px;font-size:10px;color:var(--ms-danger);line-height:1.5;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:3px;"></i>多条外壳模板中必须包含 \{\{stage_tasks\}\}，否则会自动回退使用内置默认模板</div></div><div class="ms-section-label" style="margin-top:6px;">随机注入</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-random-toggle" ${data.settings.randomInject && data.settings.randomInject.enabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">没有手动选中时，自动从随机池中抽取</span></div><button class="ms-tbtn" id="ms-go-random-pool" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-sliders"></i> 管理随机池</button></div><div class="ms-divider"></div><button class="ms-tbtn" id="ms-go-qp" style="width:100%;text-align:center;"><i class="fa-solid fa-bolt"></i> 管理快捷短语(${data.quickPhrases.length})</button><button class="ms-tbtn" id="ms-go-stats" style="width:100%;text-align:center;"><i class="fa-solid fa-chart-bar"></i> 使用统计</button><button class="ms-tbtn" id="ms-go-subs" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-rss"></i> 订阅管理 (${data.subscriptions.length})</button><div class="ms-divider"></div><div class="ms-section-label">订阅设置</div><div class="ms-field"><label>自动检查间隔 <span style="font-weight:350;opacity:0.5;">(打开面板时，超过此时间未检查的订阅会自动静默检查)</span></label><div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-auto-check-interval" min="0" max="168" step="1" value="${data.settings.autoCheckInterval || 6}" style="width:80px;"><span style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);">小时（设为 0 关闭自动检查）</span></div></div><div class="ms-divider"></div><div class="ms-section-label">使用说明</div><button class="ms-tbtn" id="ms-regen-guide" style="width:100%;text-align:center;"><i class="fa-solid fa-book"></i> 重新生成使用说明</button><div class="ms-divider"></div><div class="ms-section-label">脚本更新</div><button class="ms-tbtn" id="ms-update-script" style="width:100%;text-align:center;"><i class="fa-solid fa-arrows-rotate"></i> 检查脚本更新</button><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);padding:4px 14px;line-height:1.5;">刷新浏览器缓存并重载脚本，获取最新版本。</div><div class="ms-divider"></div><div class="ms-section-label">数据管理</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-history-warn-toggle" ${data.settings.historyWarnEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">历史超过30条时在底栏变红提醒</span></div><button class="ms-tbtn" id="ms-go-history-list" style="width:100%;text-align:center;margin-bottom:6px;"><i class="fa-solid fa-clock-rotate-left"></i> 查看有历史记录的剧场(${
        data.prompts.filter(function (p) {
          return p.history && p.history.length > 0;
        }).length
      } 条)</button><button class="ms-tbtn danger" id="ms-clear-all-history" style="width:100%;text-align:center;"><i class="fa-solid fa-broom"></i> 清空全部版本历史</button><button class="ms-tbtn danger" id="ms-reset-usage" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-rotate"></i> 重置使用统计</button></div>`,
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on(
      "change.ms",
      "#ms-inject-enabled-toggle",
      function () {
        data.settings.stageInjectEnabled = $(this).is(":checked");
        saveData();
        updateInjectIndicator();
        $p.find("#ms-inject-details").toggle($(this).is(":checked"));
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-inject-radio", function () {
      var mode = $(this).data("mode");
      data.settings.stageInjectMode = mode;
      saveData();
      $p.find(".ms-inject-radio").removeClass("active");
      $(this).addClass("active");
      if (mode === "depth") $p.find("#ms-depth-opts").show();
      else $p.find("#ms-depth-opts").hide();
    });
    $p.find("#ms-body").on("input.ms", "#ms-inject-depth", function () {
      var val = parseInt($(this).val());
      if (isNaN(val) || val < 0) val = 0;
      data.settings.stageInjectDepth = val;
      saveData();
    });
    $p.find("#ms-body").on("change.ms", "#ms-inject-role", function () {
      data.settings.stageInjectRole = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-default-prefix", function () {
      data.settings.defaultStagePrefix = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-multi-prefix", function () {
      data.settings.multiStagePrefix = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on("change.ms", "#ms-random-toggle", function () {
      if (!data.settings.randomInject)
        data.settings.randomInject = {
          enabled: false,
          excludedGroupIds: [],
          excludedSeries: [],
          excludedPromptIds: [],
        };
      data.settings.randomInject.enabled = $(this).is(":checked");
      saveData();
      updateInjectIndicator();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-random-pool", function () {
      navigateTo({ name: "random-pool" });
    });
    $p.find("#ms-body").on("input.ms", "#ms-default-author", function () {
      data.settings.defaultAuthor = $(this).val().trim();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-auto-check-interval", function () {
      var val = parseInt($(this).val());
      if (isNaN(val) || val < 0) val = 0;
      if (val > 168) val = 168;
      data.settings.autoCheckInterval = val;
      saveData();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-qp", () =>
      navigateTo({ name: "quick-phrases" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-go-stats", () =>
      navigateTo({ name: "stats" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-go-subs", () =>
      navigateTo({ name: "subscriptions" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-regen-guide", function () {
      if (
        confirm(
          "将在「使用指南」分组中重新生成使用说明和预览示例。\n如果已存在会先删除旧的再重建，确定吗？",
        )
      ) {
        createBuiltinGuide();
        toast("success", "使用说明已生成，请在分组列表中查看");
      }
    });
    $p.find("#ms-body").on("click.ms", "#ms-update-script", async function () {
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html('<i class="fa-solid fa-spinner fa-spin"></i> 正在更新...');
      try {
        await fetch("https://cdn.jsdelivr.net/gh/Sanjs333/stage/stage.js", {
          cache: "reload",
        });
        toast("success", "缓存已刷新，3秒后自动刷新页面...");
        setTimeout(function () {
          try {
            triggerSlash("/reload-page");
          } catch (e2) {
            window.location.reload();
          }
        }, 2000);
      } catch (e) {
        toast("error", "更新失败: " + e.message);
        $btn
          .prop("disabled", false)
          .html('<i class="fa-solid fa-arrows-rotate"></i> 检查脚本更新');
      }
    });
    $p.find("#ms-body").on("change.ms", "#ms-history-warn-toggle", function () {
      data.settings.historyWarnEnabled = $(this).is(":checked");
      saveData();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-history-list", () =>
      navigateTo({ name: "history-list" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-clear-all-history", function () {
      var total = data.prompts.reduce(function (s, p) {
        return s + (p.history ? p.history.length : 0);
      }, 0);
      if (total === 0) {
        toast("info", "没有需要清空的历史");
        return;
      }
      if (
        !confirm(
          "确定清空所有剧场的版本历史吗？\n共" +
            total +
            " 条历史记录将被删除，此操作不可撤销。",
        )
      )
        return;
      data.prompts.forEach(function (p) {
        p.history = [];
      });
      saveData();
      toast("success", "已清空全部版本历史（" + total + " 条）");
    });
    $p.find("#ms-body").on("click.ms", "#ms-reset-usage", function () {
      var usedCount = data.prompts.filter(function (p) {
        return p.usageCount > 0 || p.lastUsedAt;
      }).length;
      if (usedCount === 0) {
        toast("info", "没有需要重置的记录");
        return;
      }
      if (
        !confirm(
          "确定重置所有使用统计吗？\n" +
            usedCount +
            " 条剧场的使用次数和最近使用时间将归零，此操作不可撤销。",
        )
      )
        return;
      data.prompts.forEach(function (p) {
        p.usageCount = 0;
        p.lastUsedAt = null;
      });
      saveData();
      toast("success", "已重置（" + usedCount + " 条）");
    });
  }

  function renderExport() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("导出");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">选择导出内容</span>`,
    );
    let exportSet = new Set(data.prompts.map((p) => p.id));
    let allChecked = true;
    function buildExportBody() {
      let html = `<div class="ms-form"><label class="ms-check-item"><input type="checkbox" id="ms-exp-all" ${allChecked ? "checked" : ""}> 全部导出 (${data.prompts.length} 条)</label><div class="ms-divider"></div>`;
      const grouped = {};
      data.groups.forEach((g) => {
        grouped[g.id] = getPromptsInGroup(g.id);
      });
      const ungrouped = getUngroupedPrompts();
      data.groups.forEach((g) => {
        const items = grouped[g.id] || [];
        if (items.length === 0) return;
        const checkedCount = items.filter((p) => exportSet.has(p.id)).length;
        const allIn = checkedCount === items.length;
        const gid = g.id;
        html += `<div><div class="ms-exp-group-toggle" data-exp-gid="${gid}"><i class="fa-solid fa-angle-right ms-exp-arrow" data-exp-gid="${gid}"></i><input type="checkbox" class="ms-exp-gcb" data-gid="${gid}" ${allIn ? "checked" : ""} ${allChecked ? "disabled" : ""} style="accent-color:var(--SmartThemeQuoteColor,#888);"><span style="flex:1;font-size:13px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-folder" style="color:${g.color};"></i> ${esc(g.name)} <span class="ms-exp-gcnt" data-gid="${gid}">(${checkedCount}/${items.length})</span></span></div>`;
        html += `<div class="ms-exp-group-body" data-exp-body="${gid}">`;
        var _expShown = {};
        items.forEach((p) => {
          const pc = exportSet.has(p.id);
          var cs = (p.series || "").trim();
          if (cs && !_expShown[cs]) {
            _expShown[cs] = true;
            html +=
              '<div style="font-size:11px;color:var(--ms-accent);padding:5px 0 2px;font-weight:500;"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:3px;"></i>' +
              esc(p.series) +
              "</div>";
          }
          var pl = cs ? "padding:3px 0 3px 18px;" : "padding:3px 0;";
          html += `<label class="ms-check-item" style="${pl}"><input type="checkbox" class="ms-exp-pcb" data-pid="${p.id}" data-gid="${gid}" ${pc ? "checked" : ""} ${allChecked ? "disabled" : ""}> ${esc(truncate(p.title, 40))}</label>`;
        });
        html += `</div></div>`;
      });
      if (ungrouped.length > 0) {
        const checkedCount = ungrouped.filter((p) =>
          exportSet.has(p.id),
        ).length;
        const allIn = checkedCount === ungrouped.length;
        html += `<div><div class="ms-exp-group-toggle" data-exp-gid="_ungrouped"><i class="fa-solid fa-angle-right ms-exp-arrow" data-exp-gid="_ungrouped"></i><input type="checkbox" class="ms-exp-gcb" data-gid="_ungrouped" ${allIn ? "checked" : ""} ${allChecked ? "disabled" : ""} style="accent-color:var(--SmartThemeQuoteColor,#888);"><span style="flex:1;font-size:13px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-inbox"></i> 未分组 <span class="ms-exp-gcnt" data-gid="_ungrouped">(${checkedCount}/${ungrouped.length})</span></span></div>`;
        html += `<div class="ms-exp-group-body" data-exp-body="_ungrouped">`;
        ungrouped.forEach((p) => {
          const pc = exportSet.has(p.id);
          html += `<label class="ms-check-item" style="padding:3px 0;"><input type="checkbox" class="ms-exp-pcb" data-pid="${p.id}" data-gid="_ungrouped" ${pc ? "checked" : ""} ${allChecked ? "disabled" : ""}> ${esc(truncate(p.title, 40))}</label>`;
        });
        html += `</div></div>`;
      }
      html += `<div class="ms-divider"></div><div class="ms-section-label">导出选项</div><div class="ms-export-opts-tight"><label class="ms-check-item"><input type="checkbox" id="ms-exp-groups" checked> 包含分组信息</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-exp-tags" checked> 包含标签信息</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-exp-history"> 包含版本历史</label>
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-export-cancel">取消</button><button class="ms-btn primary" id="ms-export-go"><i class="fa-solid fa-download"></i> 导出 (${exportSet.size})</button></div></div>`;
      return html;
    }

    $p.find("#ms-body").html(buildExportBody());
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function updateExpCounts() {
      $p.find(".ms-exp-gcnt").each(function () {
        var gid = $(this).data("gid");
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        var cnt = items.filter(function (p) {
          return exportSet.has(p.id);
        }).length;
        $(this).text("(" + cnt + "/" + items.length + ")");
      });
      $p.find("#ms-export-go").html(
        '<i class="fa-solid fa-download"></i> 导出 (' + exportSet.size + ")",
      );
    }
    $p.find("#ms-body")
      .off(".mse")
      .on("change.mse", "#ms-exp-all", function () {
        allChecked = $(this).is(":checked");
        if (allChecked) {
          exportSet = new Set(
            data.prompts.map(function (p) {
              return p.id;
            }),
          );
          $p.find(".ms-exp-gcb, .ms-exp-pcb")
            .prop("checked", true)
            .prop("disabled", true);
        } else {
          exportSet.clear();
          $p.find(".ms-exp-gcb, .ms-exp-pcb")
            .prop("checked", false)
            .prop("disabled", false);
        }
        updateExpCounts();
      })
      .on("change.mse", ".ms-exp-gcb", function (e) {
        e.stopPropagation();
        var gid = $(this).data("gid"),
          checked = $(this).is(":checked");
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        items.forEach(function (p) {
          if (checked) exportSet.add(p.id);
          else exportSet.delete(p.id);
        });
        $p.find('.ms-exp-pcb[data-gid="' + gid + '"]').prop("checked", checked);
        updateExpCounts();
      })
      .on("change.mse", ".ms-exp-pcb", function (e) {
        e.stopPropagation();
        var pid = $(this).data("pid"),
          gid = $(this).data("gid");
        if ($(this).is(":checked")) exportSet.add(pid);
        else exportSet.delete(pid);
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        var allIn = items.every(function (p) {
          return exportSet.has(p.id);
        });
        $p.find('.ms-exp-gcb[data-gid="' + gid + '"]').prop("checked", allIn);
        updateExpCounts();
      })
      .on("click.mse", ".ms-exp-group-toggle", function (e) {
        if ($(e.target).is("input[type='checkbox']")) return;
        var gid = $(this).data("exp-gid");
        $(this).find(".ms-exp-arrow").toggleClass("open");
        $p.find('[data-exp-body="' + gid + '"]').toggleClass("open");
      })
      .on("click.mse", "#ms-export-cancel", navigateBack)
      .on("click.mse", "#ms-export-go", function () {
        var prompts = data.prompts.filter(function (p) {
          return exportSet.has(p.id);
        });
        if (prompts.length === 0) {
          toast("warning", "请至少选择一条剧场");
          return;
        }
        var inclG = $p.find("#ms-exp-groups").is(":checked"),
          inclT = $p.find("#ms-exp-tags").is(":checked"),
          inclH = $p.find("#ms-exp-history").is(":checked");
        var payload = buildExportPayload(prompts, inclG, inclT, inclH);
        var expName = (function () {
          if (prompts.length === 1) {
            return "剧场_" + sanitizeFilename(prompts[0].title) + ".json";
          }
          var gids = new Set(
            prompts
              .map(function (p) {
                return p.groupId;
              })
              .filter(Boolean),
          );
          if (gids.size === 1) {
            var sameGroup = getGroup([...gids][0]);
            if (sameGroup) {
              return (
                "【" +
                sanitizeFilename(sameGroup.name) +
                "】剧场合集[" +
                prompts.length +
                "个]_" +
                formatTimestamp() +
                ".json"
              );
            }
          }
          return (
            "剧场合集[" + prompts.length + "个]_" + formatTimestamp() + ".json"
          );
        })();
        downloadJSON(payload, expName);
        toast("success", "导出成功");
        navigateBack();
      });
  }

  function renderExportSingleOptions(v) {
    const $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    const g = pr.groupId ? getGroup(pr.groupId) : null;
    const tagNames = (pr.tags || []).map((tid) => getTag(tid)).filter(Boolean);
    const hasHistory = (pr.history || []).length > 0;
    $p.find("#ms-title").text("导出选项");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导出: ${esc(truncate(pr.title, 20))}</span>`,
    );
    let infoH = `<div style="font-size:13px;padding:6px 0;">即将导出:<strong>${esc(pr.title)}</strong></div>`;
    if (g)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);">所属分组: <span style="color:var(--SmartThemeBodyColor,#ccc);">${esc(g.name)}</span></div>`;
    if (tagNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
    $p.find("#ms-body")
      .html(`<div class="ms-form">${infoH}<div class="ms-divider"></div>
      <div class="ms-export-opts-tight">
        <label class="ms-check-item"><input type="checkbox" id="ms-exps-groups" ${g ? "checked" : "disabled"}> 包含分组信息${g ? "" : " (无分组)"}</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-exps-tags" ${tagNames.length > 0 ? "checked" : "disabled"}> 包含标签信息${tagNames.length > 0 ? "" : " (无标签)"}</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-exps-history" ${hasHistory ? "" : "disabled"}> 包含版本历史${hasHistory ? "" : " (无历史)"}</label>
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-exps-cancel">取消</button><button class="ms-btn primary" id="ms-exps-go"><i class="fa-solid fa-download"></i> 导出</button></div></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-exps-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-exps-go", () => {
      const inclG = $p.find("#ms-exps-groups").is(":checked"),
        inclT = $p.find("#ms-exps-tags").is(":checked"),
        inclH = $p.find("#ms-exps-history").is(":checked");
      const payload = buildExportPayload([pr], inclG, inclT, inclH);
      downloadJSON(payload, "剧场_" + sanitizeFilename(pr.title) + ".json");
      toast("success", "导出成功");
      navigateBack();
    });
  }

  function renderExportGroupOptions(v) {
    const $p = $("#" + PANEL_ID),
      allPrompts = getPromptsInGroup(v.groupId);
    const tagIds = new Set();
    allPrompts.forEach((p) => (p.tags || []).forEach((tid) => tagIds.add(tid)));
    const tagNames = [...tagIds].map((tid) => getTag(tid)).filter(Boolean);
    let exportSet = new Set(allPrompts.map((p) => p.id));
    $p.find("#ms-title").text("导出分组");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导出分组: ${esc(v.groupName)}</span>`,
    );
    function buildBody() {
      let infoH = `<div style="font-size:13px;padding:6px 0;">分组 <strong>${esc(v.groupName)}</strong> 共 ${allPrompts.length} 条剧场</div>`;
      if (tagNames.length > 0)
        infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">涉及标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
      const allChecked =
        allPrompts.length > 0 && allPrompts.every((p) => exportSet.has(p.id));
      let listH = `<div class="ms-imp-preview"><div class="ms-imp-preview-title">选择要导出的剧场 (${exportSet.size}/${allPrompts.length})</div><label class="ms-check-item" style="padding:4px 0;margin-bottom:4px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);"><input type="checkbox" id="ms-expg-selall" ${allChecked ? "checked" : ""}> 全选</label><div class="ms-imp-preview-list" style="max-height:150px;overflow-y:auto;">`;
      var _grpShown = {};
      allPrompts.forEach((p) => {
        const checked = exportSet.has(p.id);
        var cs = (p.series || "").trim();
        if (cs && !_grpShown[cs]) {
          _grpShown[cs] = true;
          listH +=
            '<div style="font-size:11px;color:var(--ms-accent);padding:5px 0 2px;font-weight:500;"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:3px;"></i>' +
            esc(p.series) +
            "</div>";
        }
        var pl = cs ? "padding:3px 0 3px 18px;" : "padding:3px 0;";
        listH += `<label class="ms-check-item" style="${pl}"><input type="checkbox" class="ms-expg-pcb" data-pid="${p.id}" ${checked ? "checked" : ""}> ${esc(truncate(p.title, 40))}</label>`;
      });
      listH += `</div></div>`;
      return `<div class="ms-form">${infoH}${listH}<div class="ms-divider"></div><div class="ms-export-opts-tight">
          <label class="ms-check-item"><input type="checkbox" id="ms-expg-groups" checked> 包含分组信息</label>
          <label class="ms-check-item"><input type="checkbox" id="ms-expg-tags" ${tagNames.length > 0 ? "checked" : "disabled"}> 包含标签信息${tagNames.length > 0 ? "" : " (无标签)"}</label>
          <label class="ms-check-item"><input type="checkbox" id="ms-expg-history"> 包含版本历史</label>
        </div>
        <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-expg-cancel">取消</button><button class="ms-btn primary" id="ms-expg-go"><i class="fa-solid fa-download"></i> 导出 (${exportSet.size})</button></div></div>`;
    }
    $p.find("#ms-body").html(buildBody());
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function rebindExport() {
      $p.find("#ms-body")
        .off(".mseg")
        .on("change.mseg", "#ms-expg-selall", function () {
          var checked = $(this).is(":checked");
          if (checked)
            allPrompts.forEach(function (p) {
              exportSet.add(p.id);
            });
          else exportSet.clear();
          $p.find(".ms-expg-pcb").prop("checked", checked);
          $p.find(".ms-imp-preview-title").text(
            "选择要导出的剧场(" +
              exportSet.size +
              "/" +
              allPrompts.length +
              ")",
          );
          $p.find("#ms-expg-go").html(
            '<i class="fa-solid fa-download"></i> 导出 (' +
              exportSet.size +
              ")",
          );
        })
        .on("change.mseg", ".ms-expg-pcb", function () {
          var pid = $(this).data("pid");
          if ($(this).is(":checked")) exportSet.add(pid);
          else exportSet.delete(pid);
          $p.find("#ms-expg-selall").prop(
            "checked",
            allPrompts.length > 0 &&
              allPrompts.every(function (p) {
                return exportSet.has(p.id);
              }),
          );
          $p.find(".ms-imp-preview-title").text(
            "选择要导出的剧场 (" +
              exportSet.size +
              "/" +
              allPrompts.length +
              ")",
          );
          $p.find("#ms-expg-go").html(
            '<i class="fa-solid fa-download"></i> 导出 (' +
              exportSet.size +
              ")",
          );
        })
        .on("click.mseg", "#ms-expg-cancel", navigateBack)
        .on("click.mseg", "#ms-expg-go", () => {
          const prompts = allPrompts.filter((p) => exportSet.has(p.id));
          if (prompts.length === 0) {
            toast("warning", "请至少选择一条剧场");
            return;
          }
          const inclG = $p.find("#ms-expg-groups").is(":checked"),
            inclT = $p.find("#ms-expg-tags").is(":checked"),
            inclH = $p.find("#ms-expg-history").is(":checked");
          const payload = buildExportPayload(prompts, inclG, inclT, inclH);
          downloadJSON(
            payload,
            prompts.length === 1
              ? "剧场_" + sanitizeFilename(prompts[0].title) + ".json"
              : "【" +
                  sanitizeFilename(v.groupName) +
                  "】剧场合集[" +
                  prompts.length +
                  "个]_" +
                  formatTimestamp() +
                  ".json",
          );
          toast("success", "导出成功");
          navigateBack();
        });
    }
    rebindExport();
  }

  function renderExportBatchOptions() {
    const $p = $("#" + PANEL_ID),
      ps = data.prompts.filter((p) => selectedIds.has(p.id));
    const gidSet = new Set(ps.map((p) => p.groupId).filter(Boolean));
    const groupNames = [...gidSet].map((gid) => getGroup(gid)).filter(Boolean);
    const tagIds = new Set();
    ps.forEach((p) => (p.tags || []).forEach((tid) => tagIds.add(tid)));
    const tagNames = [...tagIds].map((tid) => getTag(tid)).filter(Boolean);
    $p.find("#ms-title").text("批量导出选项");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">批量导出 (${ps.length} 条)</span>`,
    );
    let infoH = `<div style="font-size:13px;padding:6px 0;">已选 <strong>${ps.length}</strong> 条剧场</div>`;
    if (groupNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);">涉及分组: ${groupNames.map((g) => `<span class="ms-tag-chip" style="background:${g.color};margin:1px 2px;">${esc(g.name)}</span>`).join("")}</div>`;
    if (tagNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">涉及标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
    let listH = `<div class="ms-imp-preview"><div class="ms-imp-preview-title">包含剧场:</div><div class="ms-imp-preview-list" style="max-height:120px;overflow-y:auto;">`;
    var _batchShown = {};
    ps.forEach((p) => {
      if (p.series && p.series.trim()) {
        var sn = p.series.trim();
        if (!_batchShown[sn]) {
          _batchShown[sn] = true;
          listH +=
            '<div style="font-size:9px;color:var(--ms-accent);opacity:0.7;padding:4px 0 1px;margin-top:2px;"><i class="fa-solid fa-layer-group" style="font-size:8px;margin-right:2px;"></i>' +
            esc(p.series) +
            "</div>";
        }
        listH += `<div class="ms-exp-prompt-item">· ${esc(truncate(p.title, 40))}</div>`;
      } else {
        listH += `<div class="ms-exp-prompt-item">${esc(truncate(p.title, 40))}</div>`;
      }
    });
    listH += `</div></div>`;
    $p.find("#ms-body")
      .html(`<div class="ms-form">${infoH}${listH}<div class="ms-divider"></div>
      <div class="ms-export-opts-tight">
        <label class="ms-check-item"><input type="checkbox" id="ms-expb-groups" ${groupNames.length > 0 ? "checked" : "disabled"}> 包含分组信息${groupNames.length > 0 ? "" : " (无分组)"}</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-expb-tags" ${tagNames.length > 0 ? "checked" : "disabled"}> 包含标签信息${tagNames.length > 0 ? "" : " (无标签)"}</label>
        <label class="ms-check-item"><input type="checkbox" id="ms-expb-history"> 包含版本历史</label>
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-expb-cancel">取消</button><button class="ms-btn primary" id="ms-expb-go"><i class="fa-solid fa-download"></i> 导出</button></div></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-expb-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-expb-go", () => {
      const inclG = $p.find("#ms-expb-groups").is(":checked"),
        inclT = $p.find("#ms-expb-tags").is(":checked"),
        inclH = $p.find("#ms-expb-history").is(":checked");
      const payload = buildExportPayload(ps, inclG, inclT, inclH);
      const expName = (() => {
        if (ps.length === 1) {
          return "剧场_" + sanitizeFilename(ps[0].title) + ".json";
        }
        const gids = new Set(ps.map((p) => p.groupId).filter(Boolean));
        if (gids.size === 1) {
          const sameGroup = getGroup([...gids][0]);
          if (sameGroup) {
            return (
              "【" +
              sanitizeFilename(sameGroup.name) +
              "】剧场合集[" +
              ps.length +
              "个]_" +
              formatTimestamp() +
              ".json"
            );
          }
        }
        return "剧场合集[" + ps.length + "个]_" + formatTimestamp() + ".json";
      })();
      downloadJSON(payload, expName);
      toast("success", "导出成功");
      navigateBack();
    });
  }

  function renderImportConfirm(v) {
    const $p = $("#" + PANEL_ID);
    const ig = v.importedGroups || [],
      ip = v.importedPrompts || [],
      itags = v.importedTags || [];
    $p.find("#ms-title").text("导入");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导入数据</span>`,
    );
    const authors = [...new Set(ip.map((p) => p.author).filter(Boolean))];
    let previewH = "";
    if (ig.length > 0)
      previewH += `<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-folder" style="margin-right:4px;"></i>包含 ${ig.length} 个分组</div><div class="ms-imp-preview-list">${ig.map((g) => `<span style="background:${g.color || "#666"};">${esc(g.name)}</span>`).join("")}</div></div>`;
    if (itags.length > 0)
      previewH += `<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-tags" style="margin-right:4px;"></i>包含 ${itags.length} 个标签</div><div class="ms-imp-preview-list">${itags.map((t) => `<span style="background:${t.color || "#666"};">${esc(t.name)}</span>`).join("")}</div></div>`;
    let authorH =
      authors.length > 0
        ? `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">作者: <strong style="color:var(--SmartThemeBodyColor,#ccc);">${authors.map(esc).join(", ")}</strong></div>`
        : "";
    let groupOpts = `<option value="">未分组</option>`;
    data.groups.forEach((g) => {
      groupOpts += `<option value="${g.id}">${esc(g.name)}</option>`;
    });
    groupOpts += `<option value="_new">+ 新建分组</option>`;
    $p.find("#ms-body").html(`<div class="ms-form">
      <div style="font-size:13px;padding:6px 0;">检测到 <strong>${ip.length}</strong> 条小剧场</div>${authorH}
      ${previewH}
      <div class="ms-divider"></div><div class="ms-section-label">导入选项</div>
      <label class="ms-check-item"><input type="checkbox" id="ms-imp-groups" ${ig.length > 0 ? "checked" : "disabled"}> 导入分组信息 (${ig.length} 个)${ig.length === 0 ? " — 文件中无分组" : ""}</label>
      <label class="ms-check-item"><input type="checkbox" id="ms-imp-tags" ${itags.length > 0 ? "checked" : "disabled"}> 导入标签 (${itags.length} 个)${itags.length === 0 ? " — 文件中无标签" : ""}</label>
      <div class="ms-field" id="ms-imp-target-wrap" style="display:none;padding:0 14px;"><label>放入分组</label><select id="ms-imp-target">${groupOpts}</select></div>
      <div class="ms-divider"></div><div class="ms-section-label">导入方式</div>
      <div class="ms-import-opt" data-mode="merge"><div class="ms-import-opt-title"><i class="fa-solid fa-code-merge"></i> 合并更新 <span style="font-size:10px;color:#c9957a;font-weight:normal;">推荐</span></div><div class="ms-import-opt-desc">智能检测 — 新内容添加，作者修改过的自动更新，完全相同的跳过</div></div>
      <div class="ms-import-opt" data-mode="append"><div class="ms-import-opt-title"><i class="fa-solid fa-plus"></i> 全部追加</div><div class="ms-import-opt-desc">不做任何检查，全部作为新内容添加（可能产生重复）</div></div>
      <div class="ms-import-opt" data-mode="replace"><div class="ms-import-opt-title"><i class="fa-solid fa-rotate"></i> 覆盖替换</div><div class="ms-import-opt-desc"><i class="fa-solid fa-triangle-exclamation" style="color:#e55;margin-right:3px;"></i>清空所有现有数据，完全用导入数据替换</div></div>
      <button class="ms-btn" id="ms-import-cancel" style="width:100%;">取消</button></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleTarget() {
      $p.find("#ms-imp-target-wrap").toggle(
        !$p.find("#ms-imp-groups").is(":checked"),
      );
    }
    toggleTarget();
    $p.find("#ms-body").on("change.ms", "#ms-imp-groups", toggleTarget);
    $p.find("#ms-body").on("click.ms", "#ms-import-cancel", navigateBack);
    $p.find("#ms-body").on("change.ms", "#ms-imp-target", function () {
      if ($(this).val() === "_new") {
        const n = prompt("新分组名称:");
        if (n && n.trim()) {
          const ng = createGroup(n.trim());
          let opts = `<option value="">未分组</option>`;
          data.groups.forEach((g) => {
            opts += `<option value="${g.id}" ${g.id === ng.id ? "selected" : ""}>${esc(g.name)}</option>`;
          });
          opts += `<option value="_new">+ 新建分组</option>`;
          $(this).html(opts);
        } else $(this).val("");
      }
    });
    $p.find("#ms-body").on("click.ms", ".ms-import-opt", function () {
      const mode = $(this).data("mode");
      if (mode === "replace" && !confirm("覆盖将清空所有现有数据，确定吗？"))
        return;
      const useG = $p.find("#ms-imp-groups").is(":checked"),
        useT = $p.find("#ms-imp-tags").is(":checked");
      let targetGid = null;
      if (!useG) {
        targetGid = $p.find("#ms-imp-target").val();
        if (targetGid === "_new") targetGid = null;
      }
      executeImport(mode, ig, ip, itags, useG, useT, targetGid);
    });
  }

  function bindReorderDrag($body, onDrop) {
    if (bindReorderDrag._cleanup) {
      bindReorderDrag._cleanup();
      bindReorderDrag._cleanup = null;
    }

    var active = false;
    var fromEl = null;
    var rafId = null;
    var lastClientX = 0;
    var lastClientY = 0;
    var scrollDir = 0;
    var scrollSpeed = 0;
    var capturedGrip = null;

    var panelEl = $("#" + PANEL_ID)[0];
    var ownerDoc = panelEl ? panelEl.ownerDocument : document;

    function updateHighlight() {
      var el = ownerDoc.elementFromPoint(lastClientX, lastClientY);
      var item = el ? el.closest(".ms-reorder-item") : null;
      $body.find(".ms-reorder-item").removeClass("ms-drag-over");
      if (item && item !== fromEl) item.classList.add("ms-drag-over");
    }

    function scrollFrame() {
      if (!active) return;
      if (scrollDir !== 0 && scrollSpeed > 0) {
        $body[0].scrollTop += scrollDir * scrollSpeed;
        updateHighlight();
      }
      rafId = requestAnimationFrame(scrollFrame);
    }

    function stopScroll() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      scrollDir = 0;
      scrollSpeed = 0;
    }

    function onMove(ev) {
      if (!active) return;
      ev.preventDefault();
      lastClientX = ev.clientX;
      lastClientY = ev.clientY;

      var bodyEl = $body[0];
      var rect = bodyEl.getBoundingClientRect();
      var edge = 70;
      var minSpd = 1,
        maxSpd = 5;

      scrollDir = 0;
      scrollSpeed = 0;

      if (ev.clientY < rect.top + edge && bodyEl.scrollTop > 0) {
        scrollDir = -1;
        var d = rect.top + edge - ev.clientY;
        scrollSpeed = minSpd + (maxSpd - minSpd) * Math.min(d / edge, 3);
      } else if (
        ev.clientY > rect.bottom - edge &&
        bodyEl.scrollTop < bodyEl.scrollHeight - bodyEl.clientHeight
      ) {
        scrollDir = 1;
        var d2 = ev.clientY - (rect.bottom - edge);
        scrollSpeed = minSpd + (maxSpd - minSpd) * Math.min(d2 / edge, 3);
      }
      updateHighlight();
    }

    function endDrag(ev) {
      if (!active) return;
      active = false;
      stopScroll();
      $body.find(".ms-reorder-item").removeClass("ms-drag-over");

      if (ev && ev.type !== "lostpointercapture") {
        var el = ownerDoc.elementFromPoint(ev.clientX, ev.clientY);
        var targetEl = el ? el.closest(".ms-reorder-item") : null;
        if (targetEl && fromEl && targetEl !== fromEl) {
          onDrop(fromEl, targetEl);
        }
      }

      detachGrip();
      fromEl = null;
    }

    function detachGrip() {
      if (!capturedGrip) return;
      capturedGrip.removeEventListener("pointermove", onMove);
      capturedGrip.removeEventListener("pointerup", endDrag);
      capturedGrip.removeEventListener("pointercancel", endDrag);
      capturedGrip.removeEventListener("lostpointercapture", endDrag);
      capturedGrip = null;
    }

    $body.on("pointerdown.msdrag", ".ms-reorder-grip", function (e) {
      var oe = e.originalEvent || e;
      if (oe.pointerType === "mouse" && oe.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      fromEl = this.closest(".ms-reorder-item");
      if (!fromEl) return;

      active = true;
      capturedGrip = this;

      try {
        this.setPointerCapture(oe.pointerId);
      } catch (ex) {}

      this.addEventListener("pointermove", onMove);
      this.addEventListener("pointerup", endDrag);
      this.addEventListener("pointercancel", endDrag);
      this.addEventListener("lostpointercapture", endDrag);

      stopScroll();
      rafId = requestAnimationFrame(scrollFrame);
    });

    bindReorderDrag._cleanup = function () {
      $body.off(".msdrag");
      stopScroll();
      detachGrip();
      active = false;
      fromEl = null;
    };
  }

  function renderReorderGroups() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("调整分组顺序");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">调整分组顺序</span>`,
    );
    function buildReorderBody() {
      let html = "";
      data.groups.forEach((g, i) => {
        html += `<div class="ms-reorder-item" data-ridx="${i}">
          <i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="${i}"></i>
          <span class="ms-gitem-color" style="background:${g.color};cursor:default;"></span>
          <span class="ms-reorder-name">${esc(g.name)}</span>
          <div class="ms-reorder-arrows">
            <button data-dir="up" data-ridx="${i}" ${i === 0 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-up"></i></button>
            <button data-dir="down" data-ridx="${i}" ${i === data.groups.length - 1 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-down"></i></button>
          </div>
        </div>`;
      });
      return html;
    }
    var $body = $p.find("#ms-body");
    function refreshGroups() {
      $body.html(buildReorderBody());
      bindReorderDrag($body, function (fromEl, targetEl) {
        var fromIdx = parseInt(fromEl.getAttribute("data-ridx"));
        var targetIdx = parseInt(targetEl.getAttribute("data-ridx"));
        if (isNaN(fromIdx) || isNaN(targetIdx)) return;
        var moved = data.groups.splice(fromIdx, 1)[0];
        var insertIdx = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
        data.groups.splice(insertIdx, 0, moved);
        saveData();
        refreshGroups();
      });
    }
    $p.find("#ms-footer").html(`<span>拖拽或点击箭头调整顺序</span>`).show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-arrows button",
      function () {
        const idx = parseInt($(this).data("ridx")),
          dir = $(this).data("dir");
        if (dir === "up" && idx > 0) {
          [data.groups[idx - 1], data.groups[idx]] = [
            data.groups[idx],
            data.groups[idx - 1],
          ];
        } else if (dir === "down" && idx < data.groups.length - 1) {
          [data.groups[idx], data.groups[idx + 1]] = [
            data.groups[idx + 1],
            data.groups[idx],
          ];
        }
        saveData();
        refreshGroups();
      },
    );
    refreshGroups();
  }
  function renderReorderTags() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("调整标签顺序");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">调整标签顺序</span>`,
    );
    function buildReorderBody() {
      let html = "";
      data.settings.definedTags.forEach((t, i) => {
        html += `<div class="ms-reorder-item" data-ridx="${i}">
          <i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="${i}"></i>
          <span class="ms-gitem-color" style="background:${t.color};cursor:default;"></span>
          <span class="ms-reorder-name">${esc(t.name)}</span>
          <div class="ms-reorder-arrows">
            <button data-dir="up" data-ridx="${i}" ${i === 0 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-up"></i></button>
            <button data-dir="down" data-ridx="${i}" ${i === data.settings.definedTags.length - 1 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-down"></i></button>
          </div>
        </div>`;
      });
      return html;
    }
    var $body = $p.find("#ms-body");
    function refreshTags() {
      $body.html(buildReorderBody());
      bindReorderDrag($body, function (fromEl, targetEl) {
        var fromIdx = parseInt(fromEl.getAttribute("data-ridx"));
        var targetIdx = parseInt(targetEl.getAttribute("data-ridx"));
        if (isNaN(fromIdx) || isNaN(targetIdx)) return;
        var moved = data.settings.definedTags.splice(fromIdx, 1)[0];
        var insertIdx = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
        data.settings.definedTags.splice(insertIdx, 0, moved);
        saveData();
        refreshTags();
      });
    }
    $p.find("#ms-footer").html(`<span>拖拽或点击箭头调整顺序</span>`).show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-arrows button",
      function () {
        const idx = parseInt($(this).data("ridx")),
          dir = $(this).data("dir");
        if (dir === "up" && idx > 0) {
          [data.settings.definedTags[idx - 1], data.settings.definedTags[idx]] =
            [
              data.settings.definedTags[idx],
              data.settings.definedTags[idx - 1],
            ];
        } else if (
          dir === "down" &&
          idx < data.settings.definedTags.length - 1
        ) {
          [data.settings.definedTags[idx], data.settings.definedTags[idx + 1]] =
            [
              data.settings.definedTags[idx + 1],
              data.settings.definedTags[idx],
            ];
        }
        saveData();
        refreshTags();
      },
    );
    refreshTags();
  }

  function renderReorderPrompts(v) {
    const $p = $("#" + PANEL_ID);
    if (data.settings.sortMode !== "custom") {
      data.settings.sortMode = "custom";
      saveData();
    }
    const g = getGroup(v.groupId);
    const title = g ? g.name : "条目";
    $p.find("#ms-title").text("调整条目顺序");
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">调整 ' +
        esc(title) +
        " 内顺序</span>",
    );
    var groupPrompts = data.prompts.filter(function (p) {
      return p.groupId === v.groupId;
    });

    function buildSeriesBlocks() {
      var blocks = [];
      var rendered = new Set();
      groupPrompts.forEach(function (p) {
        if (rendered.has(p.id)) return;
        if (p.series && p.series.trim()) {
          var seriesName = p.series.trim();
          var items = groupPrompts.filter(function (q) {
            return (
              q.series && q.series.trim() === seriesName && !rendered.has(q.id)
            );
          });
          if (items.length > 1) {
            blocks.push({ type: "series", name: seriesName, items: items });
            items.forEach(function (q) {
              rendered.add(q.id);
            });
          } else {
            blocks.push({ type: "single", item: p });
            rendered.add(p.id);
          }
        } else {
          blocks.push({ type: "single", item: p });
          rendered.add(p.id);
        }
      });
      return blocks;
    }

    var expandedSeries = new Set();

    function buildReorderBody() {
      var blocks = buildSeriesBlocks();
      var html = "";
      blocks.forEach(function (block, bi) {
        if (block.type === "single") {
          html +=
            '<div class="ms-reorder-item" data-ridx="' +
            bi +
            '" data-type="single" data-pid="' +
            block.item.id +
            '"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="' +
            bi +
            '"></i><span class="ms-reorder-name">' +
            esc(block.item.title) +
            '</span><div class="ms-reorder-arrows"><button data-dir="up" data-ridx="' +
            bi +
            '"' +
            (bi === 0 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-up"></i></button><button data-dir="down" data-ridx="' +
            bi +
            '"' +
            (bi === blocks.length - 1 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-down"></i></button></div></div>';
        } else {
          var isOpen = expandedSeries.has(block.name);
          var sid = "ms-ro-series-" + simpleHash(block.name);
          html +=
            '<div class="ms-reorder-item" data-ridx="' +
            bi +
            '" data-type="series" data-series-name="' +
            esc(block.name) +
            '" style="background:rgba(var(--ms-accent-rgb),0.04);"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="' +
            bi +
            '"></i><i class="fa-solid fa-angle-right ms-series-arrow' +
            (isOpen ? " open" : "") +
            '" data-ro-series="' +
            sid +
            '" style="cursor:pointer;font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;width:14px;transition:transform 0.2s;"></i><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:12px;flex-shrink:0;"></i><span class="ms-reorder-name" style="font-weight:500;">' +
            esc(block.name) +
            '<span style="font-weight:400;font-size:11px;color:var(--SmartThemeQuoteColor,#777);">(' +
            block.items.length +
            " 条)</span></span>" +
            '<div class="ms-reorder-arrows"><button data-dir="up" data-ridx="' +
            bi +
            '"' +
            (bi === 0 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-up"></i></button><button data-dir="down" data-ridx="' +
            bi +
            '"' +
            (bi === blocks.length - 1 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-down"></i></button></div></div>';
          html +=
            '<div id="' +
            sid +
            '" style="display:' +
            (isOpen ? "block" : "none") +
            ';border-left:2px solid rgba(var(--ms-accent-rgb),0.2);margin-left:14px;">';
          block.items.forEach(function (item, ii) {
            html +=
              '<div class="ms-reorder-item" data-type="series-child" data-pid="' +
              item.id +
              '" data-parent-series="' +
              esc(block.name) +
              '" data-child-idx="' +
              ii +
              '"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '"></i><span class="ms-reorder-name" style="font-size:12px;">' +
              esc(item.title) +
              '</span><div class="ms-reorder-arrows"><button data-sdir="up" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '"' +
              (ii === 0 ? " disabled style='opacity:0.3;'" : "") +
              '><i class="fa-solid fa-angle-up"></i></button><button data-sdir="down" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '"' +
              (ii === block.items.length - 1
                ? " disabled style='opacity:0.3;'"
                : "") +
              '><i class="fa-solid fa-angle-down"></i></button></div></div>';
          });
          html += "</div>";
        }
      });
      if (groupPrompts.length === 0)
        html =
          '<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>该分组没有条目</div>';
      return html;
    }

    function syncGroupPrompts() {
      var positions = [];
      data.prompts.forEach(function (p, i) {
        if (p.groupId === v.groupId) positions.push(i);
      });
      positions.forEach(function (pos, i) {
        data.prompts[pos] = groupPrompts[i];
      });
    }

    var $body = $p.find("#ms-body");
    function refreshPrompts() {
      $body.html(buildReorderBody());
      var blocks = buildSeriesBlocks();
      bindReorderDrag($body, function (fromEl, targetEl) {
        var fromType = fromEl.getAttribute("data-type");
        var targetType = targetEl.getAttribute("data-type");

        if (fromType === "series-child" && targetType === "series-child") {
          var fromSeries = fromEl.getAttribute("data-parent-series");
          var targetSeries = targetEl.getAttribute("data-parent-series");
          if (fromSeries !== targetSeries) return;
          var fromCi = parseInt(fromEl.getAttribute("data-child-idx"));
          var targetCi = parseInt(targetEl.getAttribute("data-child-idx"));
          if (isNaN(fromCi) || isNaN(targetCi)) return;
          var seriesItems = groupPrompts.filter(function (p) {
            return p.series && p.series.trim() === fromSeries;
          });
          if (fromCi >= seriesItems.length || targetCi >= seriesItems.length)
            return;
          var movedItem = seriesItems[fromCi];
          var gpFrom = groupPrompts.indexOf(movedItem);
          if (gpFrom < 0) return;
          groupPrompts.splice(gpFrom, 1);
          var targetItem = seriesItems[targetCi];
          var gpTarget = groupPrompts.indexOf(targetItem);
          if (gpTarget < 0) {
            groupPrompts.push(movedItem);
          } else {
            groupPrompts.splice(gpTarget, 0, movedItem);
          }
          syncGroupPrompts();
          saveData();
          refreshPrompts();
          return;
        }

        if (fromType === "series-child" || targetType === "series-child")
          return;

        var fromIdx = parseInt(fromEl.getAttribute("data-ridx"));
        var targetIdx = parseInt(targetEl.getAttribute("data-ridx"));
        if (
          isNaN(fromIdx) ||
          isNaN(targetIdx) ||
          fromIdx < 0 ||
          fromIdx >= blocks.length ||
          targetIdx < 0 ||
          targetIdx >= blocks.length
        )
          return;
        var movedBlock = blocks.splice(fromIdx, 1)[0];
        var newTargetIdx = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
        blocks.splice(newTargetIdx, 0, movedBlock);
        groupPrompts.length = 0;
        blocks.forEach(function (block) {
          if (block.type === "single") {
            groupPrompts.push(block.item);
          } else {
            block.items.forEach(function (item) {
              groupPrompts.push(item);
            });
          }
        });
        syncGroupPrompts();
        saveData();
        refreshPrompts();
      });
    }
    $p.find("#ms-footer").html("<span>拖拽或点击箭头调整顺序</span>").show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-item[data-type='series']",
      function (e) {
        if ($(e.target).closest(".ms-reorder-grip, .ms-reorder-arrows").length)
          return;
        var $arrow = $(this).find("[data-ro-series]");
        var sid = $arrow.data("ro-series");
        $arrow.toggleClass("open");
        var $target = $p.find("#" + sid);
        $target.toggle();
        var seriesName = $(this).data("series-name");
        if ($target.is(":visible")) expandedSeries.add(seriesName);
        else expandedSeries.delete(seriesName);
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-arrows button[data-dir]",
      function () {
        var idx = parseInt($(this).data("ridx"));
        var dir = $(this).data("dir");
        var blocks = buildSeriesBlocks();
        if (idx < 0 || idx >= blocks.length) return;
        var swapIdx = dir === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= blocks.length) return;
        var temp = blocks[idx];
        blocks[idx] = blocks[swapIdx];
        blocks[swapIdx] = temp;
        groupPrompts.length = 0;
        blocks.forEach(function (block) {
          if (block.type === "single") {
            groupPrompts.push(block.item);
          } else {
            block.items.forEach(function (item) {
              groupPrompts.push(item);
            });
          }
        });
        syncGroupPrompts();
        saveData();
        refreshPrompts();
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-arrows button[data-sdir]",
      function () {
        var ci = parseInt($(this).data("child-idx"));
        var sn = $(this).data("parent-series");
        var dir = $(this).data("sdir");
        var seriesItems = groupPrompts.filter(function (p) {
          return p.series && p.series.trim() === sn;
        });
        var swapCi = dir === "up" ? ci - 1 : ci + 1;
        if (swapCi < 0 || swapCi >= seriesItems.length) return;
        var idxA = data.prompts.indexOf(seriesItems[ci]);
        var idxB = data.prompts.indexOf(seriesItems[swapCi]);
        if (idxA >= 0 && idxB >= 0) {
          var tmp = data.prompts[idxA];
          data.prompts[idxA] = data.prompts[idxB];
          data.prompts[idxB] = tmp;
        }
        var gpA = groupPrompts.indexOf(seriesItems[ci]);
        var gpB = groupPrompts.indexOf(seriesItems[swapCi]);
        if (gpA >= 0 && gpB >= 0) {
          var tmp2 = groupPrompts[gpA];
          groupPrompts[gpA] = groupPrompts[gpB];
          groupPrompts[gpB] = tmp2;
        }
        saveData();
        refreshPrompts();
      },
    );
    refreshPrompts();
  }

  function mergeSubscriptionData(sub, imported) {
    var ig = imported.groups || [];
    var ip = imported.prompts || [];
    var itags = imported.tags || [];
    var sourceIdIndex = {};
    data.prompts.forEach(function (p) {
      if (p.sourceId) sourceIdIndex[p.sourceId] = p;
    });
    data.prompts.forEach(function (p) {
      if (!sourceIdIndex[p.id]) sourceIdIndex[p.id] = p;
    });
    var existFingerprints = new Set(
      data.prompts.map(function (p) {
        if (!p.fingerprint) p.fingerprint = contentFingerprint(p);
        return p.fingerprint;
      }),
    );
    var gidMap = {};
    if (sub.importGroups) {
      ig.forEach(function (g) {
        var ex = data.groups.find(function (eg) {
          return eg.name === g.name;
        });
        if (ex) gidMap[g.id] = ex.id;
        else {
          var ng = Object.assign({}, g, { id: uid() });
          data.groups.push(ng);
          gidMap[g.id] = ng.id;
        }
      });
    }
    var tagIdMap = {};
    if (sub.importTags && itags.length) {
      itags.forEach(function (t) {
        var ex = data.settings.definedTags.find(function (et) {
          return et.name === t.name;
        });
        if (ex) tagIdMap[t.id] = ex.id;
        else {
          var nt = Object.assign({}, t, { id: uid() });
          data.settings.definedTags.push(nt);
          tagIdMap[t.id] = nt.id;
        }
      });
    }
    var added = 0,
      updated = 0,
      skipped = 0;
    ip.forEach(function (p) {
      var importSourceId = p.sourceId || p.id;
      var fp = contentFingerprint(p);
      var existingBySource = sourceIdIndex[importSourceId];
      if (existingBySource) {
        var existingFp =
          existingBySource.fingerprint || contentFingerprint(existingBySource);
        if (fp === existingFp) {
          skipped++;
          return;
        }
        if (sub.updateExisting === false) {
          skipped++;
          return;
        }
        existingBySource.title = p.title || existingBySource.title;
        existingBySource.content =
          p.content !== undefined ? p.content : existingBySource.content;
        existingBySource.author = p.author || existingBySource.author;
        existingBySource.series =
          p.series !== undefined ? p.series : existingBySource.series;
        existingBySource.fingerprint = fp;
        existingBySource.updatedAt = Date.now();
        if (sub.importGroups && p.groupId)
          existingBySource.groupId = gidMap[p.groupId] || p.groupId;
        if (sub.importTags && p.tags)
          existingBySource.tags = p.tags.map(function (tid) {
            return tagIdMap[tid] || tid;
          });
        updated++;
        return;
      }
      if (existFingerprints.has(fp)) {
        skipped++;
        return;
      }
      var np = Object.assign({}, p, {
        id: uid(),
        sourceId: importSourceId,
        author: p.author || "",
        starred: p.starred || false,
        pinned: false,
        fingerprint: fp,
        usageCount: 0,
        lastUsedAt: null,
        history: [],
        updatedAt: Date.now(),
      });

      np.groupId = sub.importGroups
        ? gidMap[p.groupId] || p.groupId || null
        : sub.targetGroupId || null;
      np.tags = sub.importTags
        ? (p.tags || []).map(function (tid) {
            return tagIdMap[tid] || tid;
          })
        : [];
      if (!Array.isArray(np.tags)) np.tags = [];
      data.prompts.push(np);
      existFingerprints.add(fp);
      added++;
    });
    saveData();
    return { added: added, updated: updated, skipped: skipped };
  }

  async function checkSubscription(subId, quiet) {
    var sub = data.subscriptions.find(function (s) {
      return s.id === subId;
    });
    if (!sub) return null;
    try {
      if (!quiet) toast("info", "正在检查: " + sub.name);
      var cleanUrl = sub.url.replace(
        /^(https?:\/\/gist\.githubusercontent\.com\/[^\/]+\/[^\/]+\/raw)\/[0-9a-f]{6,40}\//i,
        "$1/",
      );
      var fetchUrl =
        cleanUrl +
        (cleanUrl.indexOf("?") >= 0 ? "&" : "?") +
        "_t=" +
        Date.now();
      var response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("HTTP " + response.status);
      var rawText = await response.text();
      var imported;
      try {
        imported = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error("JSON解析失败: " + parseErr.message);
      }
      if (!imported.prompts && !imported.groups)
        throw new Error("无效的小剧场数据");
      var newHash = simpleHash(
        JSON.stringify({
          groups: imported.groups || [],
          prompts: imported.prompts || [],
          tags: imported.tags || [],
        }),
      );
      if (newHash === sub.lastHash) {
        sub.lastChecked = Date.now();
        saveData();
        if (!quiet) toast("info", sub.name + ": 没有新更新");
        return { added: 0, updated: 0, skipped: 0 };
      }
      var result = mergeSubscriptionData(sub, imported);
      sub.lastChecked = Date.now();
      sub.lastHash = newHash;
      if (!Array.isArray(sub.updateLog)) sub.updateLog = [];
      sub.updateLog.push({
        time: Date.now(),
        added: result.added,
        updated: result.updated,
        skipped: result.skipped,
      });
      if (sub.updateLog.length > 20) sub.updateLog.shift();
      if (result.added > 0 || result.updated > 0) {
        data.settings.subUpdatesPending =
          (data.settings.subUpdatesPending || 0) +
          result.added +
          result.updated;
      }
      saveData();
      if (!quiet) {
        var parts = [];
        if (result.added > 0) parts.push("新增 " + result.added + " 条");
        if (result.updated > 0) parts.push("更新 " + result.updated + " 条");
        if (result.skipped > 0) parts.push("跳过 " + result.skipped + " 条");
        toast(
          "success",
          sub.name + ": " + (parts.length > 0 ? parts.join("，") : "无变化"),
        );
      }
      return result;
    } catch (e) {
      if (!quiet) toast("error", sub.name + " 检查失败: " + e.message);
      return null;
    }
  }

  async function checkAllSubscriptions(silent) {
    if (data.subscriptions.length === 0) {
      if (!silent) toast("info", "没有订阅");
      return;
    }
    if (!silent)
      toast("info", "正在检查" + data.subscriptions.length + " 个订阅...");
    var totalAdded = 0,
      totalUpdated = 0,
      totalSkipped = 0,
      errors = 0;
    for (var i = 0; i < data.subscriptions.length; i++) {
      var result = await checkSubscription(data.subscriptions[i].id, true);
      if (result) {
        totalAdded += result.added;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
      } else errors++;
    }
    var parts = [];
    if (totalAdded > 0) parts.push("新增 " + totalAdded + " 条");
    if (totalUpdated > 0) parts.push("更新 " + totalUpdated + " 条");
    if (errors > 0) parts.push(errors + " 个失败");
    if (parts.length === 0) parts.push("全部已是最新");
    if (!silent || totalAdded > 0 || totalUpdated > 0 || errors > 0) {
      toast(
        errors > 0 ? "warning" : "success",
        (silent ? "订阅自动检查: " : "检查完毕: ") + parts.join("，"),
      );
    }
    if (currentView().name === "subscriptions") renderView();
  }

  async function autoCheckSubscriptions() {
    if (data.subscriptions.length === 0) return;
    var interval = (data.settings.autoCheckInterval || 6) * 3600000;
    if (interval <= 0) return;
    var now = Date.now();
    var needsCheck = data.subscriptions.some(function (s) {
      return !s.lastChecked || now - s.lastChecked > interval;
    });
    if (!needsCheck) return;
    await checkAllSubscriptions(true);
  }

  function renderHistoryList() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("有历史记录的剧场");
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">有历史记录的剧场</span>',
    );
    var withHistory = data.prompts.filter(function (p) {
      return p.history && p.history.length > 0;
    });
    var totalH = withHistory.reduce(function (s, p) {
      return s + p.history.length;
    }, 0);
    var html = "";
    if (withHistory.length === 0) {
      html =
        '<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>没有任何剧场有历史记录</div>';
    } else {
      withHistory
        .sort(function (a, b) {
          return (
            (b.history ? b.history.length : 0) -
            (a.history ? a.history.length : 0)
          );
        })
        .forEach(function (p) {
          var g = p.groupId ? getGroup(p.groupId) : null;
          var gLabel = g
            ? '<span style="color:' +
              g.color +
              ';"><i class="fa-solid fa-folder" style="font-size:9px;margin-right:2px;"></i>' +
              esc(g.name) +
              "</span>"
            : '<span style="opacity:0.5;">未分组</span>';
          var lastSaved =
            p.history.length > 0
              ? formatDate(p.history[p.history.length - 1].savedAt)
              : "";
          html +=
            '<div class="ms-card" data-pid="' +
            p.id +
            '" style="cursor:pointer;">' +
            '<div class="ms-card-info" style="flex:1;min-width:0;">' +
            '<div class="ms-card-title">' +
            esc(p.title) +
            "</div>" +
            '<div class="ms-card-meta" style="gap:6px;">' +
            gLabel +
            '<span style="color:var(--ms-accent);">' +
            p.history.length +
            "/5 条历史</span>" +
            (lastSaved
              ? '<span style="opacity:0.6;">' + lastSaved + "</span>"
              : "") +
            "</div></div>" +
            '<div style="display:flex;gap:2px;flex-shrink:0;">' +
            '<button class="ms-card-qbtn" data-hlist-action="view" data-pid="' +
            p.id +
            '" title="查看历史"><i class="fa-solid fa-clock-rotate-left"></i></button>' +
            '<button class="ms-card-qbtn" data-hlist-action="clear" data-pid="' +
            p.id +
            '" title="清空此条历史"><i class="fa-solid fa-trash" style="color:var(--ms-danger);"></i></button>' +
            "</div></div>";
        });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        "<span>" +
          withHistory.length +
          " 条剧场 · 共 " +
          totalH +
          " 条历史</span>" +
          (withHistory.length > 0
            ? '<div class="ms-footer-btns"><a data-action="clear-all-h"><i class="fa-solid fa-broom"></i> 全部清空</a></div>'
            : ""),
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      "[data-hlist-action='view']",
      function (e) {
        e.stopPropagation();
        navigateTo({ name: "history", promptId: $(this).data("pid") });
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      "[data-hlist-action='clear']",
      function (e) {
        e.stopPropagation();
        var pid = $(this).data("pid");
        var pr = getPrompt(pid);
        if (!pr) return;
        if (!confirm("确定清空「" + pr.title + "」的所有版本历史吗？")) return;
        pr.history = [];
        saveData();
        toast("success", "已清空");
        renderHistoryList();
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-all-h']",
      function () {
        if (
          !confirm(
            "确定清空所有剧场的版本历史吗？共 " + totalH + " 条历史记录。",
          )
        )
          return;
        data.prompts.forEach(function (p) {
          p.history = [];
        });
        saveData();
        toast("success", "已全部清空");
        renderHistoryList();
      },
    );
  }

  function renderRandomPool() {
    var $p = $("#" + PANEL_ID);
    var ri = data.settings.randomInject;
    if (!ri) {
      ri = {
        enabled: false,
        excludedGroupIds: [],
        excludedSeries: [],
        excludedPromptIds: [],
      };
      data.settings.randomInject = ri;
    }
    $p.find("#ms-title").text("随机池管理");
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">随机注入池</span>',
    );
    var _expandedGroups = new Set();
    var _expandedRpoolSeries = new Set();
    var _rpoolSearch = "";
    var _rpoolFilterTags = [];
    function matchesRpoolFilter(p) {
      if (_rpoolSearch) {
        var lq = _rpoolSearch.toLowerCase();
        if (
          !(p.title && p.title.toLowerCase().indexOf(lq) >= 0) &&
          !(p.content && p.content.toLowerCase().indexOf(lq) >= 0) &&
          !(p.author && p.author.toLowerCase().indexOf(lq) >= 0) &&
          !(p.series && p.series.toLowerCase().indexOf(lq) >= 0)
        )
          return false;
      }
      if (_rpoolFilterTags.length > 0) {
        if (data.settings.filterTagMode === "and") {
          if (
            !p.tags ||
            !_rpoolFilterTags.every(function (tid) {
              return p.tags.indexOf(tid) >= 0;
            })
          )
            return false;
        } else {
          if (
            !p.tags ||
            !_rpoolFilterTags.some(function (tid) {
              return p.tags.indexOf(tid) >= 0;
            })
          )
            return false;
        }
      }
      return true;
    }
    var poolCount = data.prompts.filter(function (p) {
      return isInRandomPool(p);
    }).length;
    function isGroupExcluded(gid) {
      return ri.excludedGroupIds && ri.excludedGroupIds.indexOf(gid) >= 0;
    }
    function isSeriesExcluded(gid, sn) {
      return (
        ri.excludedSeries &&
        ri.excludedSeries.some(function (s) {
          return s.groupId === gid && s.seriesName === sn;
        })
      );
    }
    function isPromptExcluded(pid) {
      return ri.excludedPromptIds && ri.excludedPromptIds.indexOf(pid) >= 0;
    }
    function toggleGroupExclude(gid) {
      if (!ri.excludedGroupIds) ri.excludedGroupIds = [];
      var idx = ri.excludedGroupIds.indexOf(gid);
      if (idx >= 0) ri.excludedGroupIds.splice(idx, 1);
      else ri.excludedGroupIds.push(gid);
      saveData();
    }
    function toggleSeriesExclude(gid, sn) {
      if (!ri.excludedSeries) ri.excludedSeries = [];
      var idx = ri.excludedSeries.findIndex(function (s) {
        return s.groupId === gid && s.seriesName === sn;
      });
      if (idx >= 0) ri.excludedSeries.splice(idx, 1);
      else ri.excludedSeries.push({ groupId: gid, seriesName: sn });
      saveData();
    }
    function togglePromptExclude(pid) {
      if (!ri.excludedPromptIds) ri.excludedPromptIds = [];
      var idx = ri.excludedPromptIds.indexOf(pid);
      if (idx >= 0) ri.excludedPromptIds.splice(idx, 1);
      else ri.excludedPromptIds.push(pid);
      saveData();
    }
    function buildPoolBody() {
      var hasFilter = _rpoolSearch || _rpoolFilterTags.length > 0;
      var allExcluded =
        ri.excludedGroupIds.length > 0 ||
        ri.excludedSeries.length > 0 ||
        ri.excludedPromptIds.length > 0;
      var html = '<div style="padding:8px 14px 4px;">';
      html +=
        '<div style="position:relative;display:flex;align-items:center;"><input class="ms-search" id="ms-rpool-search" type="text" placeholder="搜索标题、内容、作者、系列..." value="' +
        esc(_rpoolSearch) +
        '" style="flex:1;padding-right:24px;"><span id="ms-rpool-search-clear" style="position:absolute;right:8px;cursor:pointer;color:var(--SmartThemeQuoteColor,#666);font-size:11px;display:' +
        (_rpoolSearch ? "block" : "none") +
        ';line-height:1;">×</span></div>';
      if (data.settings.definedTags.length > 0) {
        var modeLabel =
          data.settings.filterTagMode === "and" ? "全部匹配" : "任一匹配";
        html +=
          '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;align-items:center;">';
        html +=
          '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;margin-right:2px;"><i class="fa-solid fa-tags" style="margin-right:2px;"></i></span>';
        data.settings.definedTags.forEach(function (t) {
          var isActive = _rpoolFilterTags.indexOf(t.id) >= 0;
          html +=
            '<span class="ms-tag-toggle' +
            (isActive ? " active" : "") +
            '" data-rpool-filter-tag="' +
            t.id +
            '" style="font-size:10px;padding:2px 6px;' +
            (isActive ? "background:" + t.color + ";" : "") +
            '">' +
            esc(t.name) +
            "</span>";
        });
        if (_rpoolFilterTags.length > 0) {
          html +=
            '<span style="font-size:10px;color:var(--ms-accent);cursor:pointer;margin-left:2px;" id="ms-rpool-clear-tags">× 清除</span>';
          html +=
            '<button class="ms-filter-mode-btn" id="ms-rpool-tag-mode" style="margin-left:4px;">' +
            modeLabel +
            "</button>";
        }
        html += "</div>";
      }
      html += "</div>";
      html +=
        '<div style="padding:4px 14px 4px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="flex:1;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>' +
        (hasFilter ? "筛选结果中，" : "") +
        '取消勾选即排除，被排除的内容不会被随机抽到</span><button class="ms-tbtn" id="ms-rpool-selall" style="font-size:10px;padding:3px 8px;">' +
        (allExcluded
          ? '<i class="fa-solid fa-check-double" style="margin-right:3px;"></i>全选'
          : '<i class="fa-solid fa-xmark" style="margin-right:3px;"></i>全不选') +
        "</button></div>";
      function buildGroupBlock(gid, gName, gColor, prompts) {
        var displayPrompts = hasFilter
          ? prompts.filter(matchesRpoolFilter)
          : prompts;
        if (hasFilter && displayPrompts.length === 0) return "";
        var gExcluded = isGroupExcluded(gid);
        var gCls = gExcluded ? " ms-rpool-excluded" : "";
        var gChecked = gExcluded ? "" : " checked";
        var isOpen = _expandedGroups.has(gid) || hasFilter;
        var blockH =
          '<div class="ms-rpool-group"><div class="ms-rpool-group-header" data-rpool-gid="' +
          gid +
          '"><input type="checkbox" class="ms-rpool-gcb" data-gid="' +
          gid +
          '"' +
          gChecked +
          '><i class="fa-solid fa-folder" style="color:' +
          gColor +
          ';font-size:13px;"></i><span style="flex:1;font-size:13px;" class="' +
          gCls +
          '">' +
          esc(gName) +
          '</span><span style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);">' +
          (hasFilter
            ? displayPrompts.length + "/" + prompts.length
            : prompts.length) +
          " 条</span>" +
          '<i class="fa-solid fa-angle-right ms-series-arrow' +
          (isOpen ? " open" : "") +
          '" style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);flex-shrink:0;transition:transform 0.2s;"></i></div>';
        blockH +=
          '<div class="ms-rpool-group-body" style="display:' +
          (isOpen ? "block" : "none") +
          ';" data-rpool-body="' +
          gid +
          '">';
        var seriesMap = {};
        var noSeries = [];
        displayPrompts.forEach(function (p) {
          var sn = (p.series || "").trim();
          if (sn) {
            if (!seriesMap[sn]) seriesMap[sn] = [];
            seriesMap[sn].push(p);
          } else {
            noSeries.push(p);
          }
        });
        Object.keys(seriesMap).forEach(function (sn) {
          var sExcluded = isSeriesExcluded(gid, sn);
          var sChecked = sExcluded ? "" : " checked";
          var sCls = sExcluded || gExcluded ? " ms-rpool-excluded" : "";
          var sDisabled = gExcluded ? " disabled" : "";
          var _rpSid = gid + "_s_" + simpleHash(sn);
          var _rpSOpen = _expandedRpoolSeries.has(_rpSid) || hasFilter;
          blockH +=
            '<div class="ms-rpool-series-label' +
            (gExcluded ? " ms-rpool-excluded" : "") +
            '" data-rpool-series-id="' +
            _rpSid +
            '">' +
            '<input type="checkbox" class="ms-rpool-scb" data-gid="' +
            gid +
            '" data-sn="' +
            esc(sn) +
            '"' +
            sChecked +
            sDisabled +
            '><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:11px;"></i><span class="' +
            sCls +
            '">' +
            esc(sn) +
            " (" +
            seriesMap[sn].length +
            ')</span><i class="fa-solid fa-angle-right ms-series-arrow' +
            (_rpSOpen ? " open" : "") +
            '" style="font-size:9px;margin-left:auto;"></i></div>';
          blockH +=
            '<div class="ms-rpool-series-items" data-rpool-series-body="' +
            _rpSid +
            '" style="display:' +
            (_rpSOpen ? "block" : "none") +
            ';">';
          seriesMap[sn].forEach(function (p) {
            var pExcluded = isPromptExcluded(p.id);
            var pChecked = pExcluded ? "" : " checked";
            var pCls =
              pExcluded || sExcluded || gExcluded ? " ms-rpool-excluded" : "";
            var pDisabled = gExcluded || sExcluded ? " disabled" : "";
            blockH +=
              '<div class="ms-rpool-item' +
              (gExcluded || sExcluded ? " disabled" : "") +
              '"><input type="checkbox" class="ms-rpool-pcb" data-pid="' +
              p.id +
              '"' +
              pChecked +
              pDisabled +
              '><span class="' +
              pCls +
              '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              (hasFilter && _rpoolSearch
                ? highlightText(p.title, _rpoolSearch)
                : esc(truncate(p.title, 30))) +
              "</span></div>";
          });
          blockH += "</div>";
        });
        noSeries.forEach(function (p) {
          var pExcluded = isPromptExcluded(p.id);
          var pChecked = pExcluded ? "" : " checked";
          var pCls = pExcluded || gExcluded ? " ms-rpool-excluded" : "";
          var pDisabled = gExcluded ? " disabled" : "";
          blockH +=
            '<div class="ms-rpool-item' +
            (gExcluded ? " disabled" : "") +
            '"><input type="checkbox" class="ms-rpool-pcb" data-pid="' +
            p.id +
            '"' +
            pChecked +
            pDisabled +
            '><span class="' +
            pCls +
            '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            (hasFilter && _rpoolSearch
              ? highlightText(p.title, _rpoolSearch)
              : esc(truncate(p.title, 30))) +
            "</span></div>";
        });
        blockH += "</div></div>";
        return blockH;
      }
      var hasContent = false;
      data.groups.forEach(function (g) {
        var gPrompts = getPromptsInGroup(g.id);
        if (gPrompts.length === 0) return;
        var block = buildGroupBlock(g.id, g.name, g.color, gPrompts);
        if (block) {
          html += block;
          hasContent = true;
        }
      });
      var ungrouped = getUngroupedPrompts();
      if (ungrouped.length > 0) {
        var block = buildGroupBlock("_ungrouped", "未分组", "#888", ungrouped);
        if (block) {
          html += block;
          hasContent = true;
        }
      }
      if (data.prompts.length === 0) {
        html =
          '<div class="ms-empty"><i class="fa-solid fa-dice"></i>还没有剧场</div>';
      } else if (hasFilter && !hasContent) {
        html +=
          '<div class="ms-empty" style="padding:20px;"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的内容</div>';
      }
      return html;
    }
    function refreshPool() {
      poolCount = data.prompts.filter(function (p) {
        return isInRandomPool(p);
      }).length;
      var scrollTop = $p.find("#ms-body").scrollTop();
      var $oldSearch = $p.find("#ms-rpool-search");
      var wasFocused = $oldSearch.is(":focus");
      var cursorPos = 0;
      if (wasFocused && $oldSearch[0]) {
        cursorPos = $oldSearch[0].selectionStart || 0;
      }
      $p.find("#ms-body").html(buildPoolBody());
      $p.find("#ms-body").scrollTop(scrollTop);
      if (wasFocused) {
        var $newSearch = $p.find("#ms-rpool-search");
        $newSearch.focus();
        try {
          $newSearch[0].setSelectionRange(cursorPos, cursorPos);
        } catch (e) {}
      }
      var hasFilter = _rpoolSearch || _rpoolFilterTags.length > 0;
      if (hasFilter) {
        var filteredTotal = data.prompts.filter(matchesRpoolFilter).length;
        $p.find("#ms-rpool-footer-count").text(
          "筛选 " +
            filteredTotal +
            " 条 · 可用 " +
            poolCount +
            " / " +
            data.prompts.length +
            " 条",
        );
      } else {
        $p.find("#ms-rpool-footer-count").text(
          "可用 " + poolCount + " / " + data.prompts.length + " 条",
        );
      }
      updateInjectIndicator();
    }
    $p.find("#ms-body").html(buildPoolBody());
    $p.find("#ms-footer")
      .html(
        '<span id="ms-rpool-footer-count">可用 ' +
          poolCount +
          " / " +
          data.prompts.length +
          " 条</span>",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "compositionstart.ms",
      "#ms-rpool-search",
      function () {
        this._composing = true;
      },
    );
    $p.find("#ms-body").on(
      "compositionend.ms",
      "#ms-rpool-search",
      function () {
        this._composing = false;
        _rpoolSearch = $(this).val();
        refreshPool();
      },
    );
    $p.find("#ms-body").on("input.ms", "#ms-rpool-search", function () {
      if (this._composing) return;
      _rpoolSearch = $(this).val();
      $p.find("#ms-rpool-search-clear").toggle(!!_rpoolSearch);
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-search-clear", function () {
      _rpoolSearch = "";
      $p.find("#ms-rpool-search").val("").focus();
      $(this).hide();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "[data-rpool-filter-tag]", function () {
      var tid = $(this).data("rpool-filter-tag");
      var idx = _rpoolFilterTags.indexOf(tid);
      if (idx >= 0) _rpoolFilterTags.splice(idx, 1);
      else _rpoolFilterTags.push(tid);
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-clear-tags", function () {
      _rpoolFilterTags = [];
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-tag-mode", function () {
      data.settings.filterTagMode =
        data.settings.filterTagMode === "and" ? "or" : "and";
      saveData();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-selall", function () {
      var allExcluded =
        ri.excludedGroupIds.length > 0 ||
        ri.excludedSeries.length > 0 ||
        ri.excludedPromptIds.length > 0;

      if (allExcluded) {
        ri.excludedGroupIds = [];
        ri.excludedSeries = [];
        ri.excludedPromptIds = [];
      } else {
        var visiblePromptIds = data.prompts
          .filter(matchesRpoolFilter)
          .map(function (p) {
            return p.id;
          });

        if (!Array.isArray(ri.excludedPromptIds)) {
          ri.excludedPromptIds = [];
        }

        ri.excludedPromptIds = Array.from(
          new Set(ri.excludedPromptIds.concat(visiblePromptIds)),
        );
      }

      saveData();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", ".ms-rpool-group-header", function (e) {
      if ($(e.target).is("input[type='checkbox']")) return;
      var gid = $(this).data("rpool-gid");
      var isNowOpen = !_expandedGroups.has(gid);
      if (isNowOpen) _expandedGroups.add(gid);
      else _expandedGroups.delete(gid);
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find('[data-rpool-body="' + gid + '"]').toggle();
    });
    $p.find("#ms-body").on("click.ms", ".ms-rpool-series-label", function (e) {
      if ($(e.target).is("input[type='checkbox']")) return;
      var seriesId = $(this).data("rpool-series-id");
      if (!seriesId) return;
      $(this).find(".ms-series-arrow").toggleClass("open");
      var $sbody = $p.find('[data-rpool-series-body="' + seriesId + '"]');
      $sbody.toggle();
      if ($sbody.is(":visible")) _expandedRpoolSeries.add(seriesId);
      else _expandedRpoolSeries.delete(seriesId);
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-gcb", function (e) {
      e.stopPropagation();
      var gid = $(this).data("gid");
      toggleGroupExclude(gid);
      refreshPool();
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-scb", function (e) {
      e.stopPropagation();
      var gid = $(this).data("gid");
      var sn = $(this).data("sn");
      toggleSeriesExclude(gid, sn);
      refreshPool();
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-pcb", function (e) {
      e.stopPropagation();
      var pid = $(this).data("pid");
      togglePromptExclude(pid);
      refreshPool();
    });
  }

  function renderSubscriptions() {
    var $p = $("#" + PANEL_ID);
    if (data.settings.subUpdatesPending > 0) {
      data.settings.subUpdatesPending = 0;
      saveData();
    }
    $p.find("#ms-title").text("订阅管理");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: false,
        add: true,
        addId: "ms-sub-add",
        addTitle: "添加订阅",
      }),
    );
    var html = "";
    if (data.subscriptions.length === 0) {
      html =
        '<div class="ms-empty"><i class="fa-solid fa-rss"></i>还没有订阅<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">粘贴作者分享的 JSON 链接<br>即可一键同步更新</span></div>';
    } else {
      data.subscriptions.forEach(function (sub) {
        var lastCheck = sub.lastChecked
          ? formatDate(sub.lastChecked)
          : "从未检查";
        var lastLog =
          sub.updateLog && sub.updateLog.length > 0
            ? sub.updateLog[sub.updateLog.length - 1]
            : null;
        var statusH = "";
        if (lastLog) {
          var ps = [];
          if (lastLog.added > 0) ps.push("+" + lastLog.added);
          if (lastLog.updated > 0) ps.push("↑" + lastLog.updated);
          if (ps.length > 0)
            statusH =
              '<span style="color:var(--ms-accent);font-size:10px;">' +
              ps.join(" ") +
              "</span>";
        }
        html +=
          '<div class="ms-nav-item" data-sub-id="' +
          sub.id +
          '">' +
          '<div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);"><i class="fa-solid fa-rss"></i></div>' +
          '<div class="ms-nav-info"><div class="ms-nav-title">' +
          esc(sub.name) +
          "</div>" +
          '<div class="ms-nav-note">' +
          lastCheck +
          (statusH ? " · " + statusH : "") +
          "</div></div>" +
          '<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>';
      });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        data.subscriptions.length > 0
          ? "<span>" +
              data.subscriptions.length +
              ' 个订阅</span><div class="ms-footer-btns"><a data-action="check-all-subs"><i class="fa-solid fa-arrows-rotate"></i> 全部检查更新</a></div>'
          : "",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-sub-add", function () {
      navigateTo({ name: "subscription-add" });
    });
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-nav-item[data-sub-id]",
      function () {
        navigateTo({
          name: "subscription-detail",
          subId: $(this).data("sub-id"),
        });
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='check-all-subs']",
      async function () {
        var $a = $(this);
        $a.html('<i class="fa-solid fa-spinner fa-spin"></i> 检查中...');
        await checkAllSubscriptions();
      },
    );
  }

  function renderSubscriptionAdd() {
    var $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("添加订阅");
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">添加订阅</span>',
    );
    var groupOpts = '<option value="">不指定 (未分组)</option>';
    data.groups.forEach(function (g) {
      groupOpts += '<option value="' + g.id + '">' + esc(g.name) + "</option>";
    });
    $p.find("#ms-body").html(
      '<div class="ms-form">' +
        '<div style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 8px;line-height:1.6;">' +
        '<i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>' +
        "将作者分享的 JSON 文件链接粘贴到下方即可。<br>" +
        '<span style="font-size:10px;opacity:0.7;">支持 jsDelivr CDN、GitHub Raw或任意可公开访问的链接</span></div>' +
        '<div class="ms-field"><label>订阅名称</label><input type="text" id="ms-sub-name" placeholder="例：某作者的剧场合集"></div>' +
        '<div class="ms-field"><label>JSON 链接</label><input type="text" id="ms-sub-url" placeholder="https://..."></div>' +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">导入选项</div>' +
        '<div class="ms-export-opts-tight">' +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-opt-groups" checked> 导入分组信息</label>' +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-opt-tags" checked> 导入标签信息</label>' +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-opt-update" checked> 允许更新已有内容 <span style="font-size:10px;opacity:0.5;">(关闭则只接收新增，不覆盖本地修改)</span></label>' +
        "</div>" +
        '<div class="ms-field" id="ms-sub-target-wrap" style="display:none;"><label>放入分组 <span style="font-weight:350;opacity:0.5;">(不导入分组时，新内容放入此分组)</span></label><select id="ms-sub-target">' +
        groupOpts +
        "</select></div>" +
        '<div class="ms-form-btns"><button class="ms-btn" id="ms-sub-cancel">取消</button><button class="ms-btn primary" id="ms-sub-save"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>添加并检查</button></div>' +
        "</div>",
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleSubTarget() {
      $p.find("#ms-sub-target-wrap").toggle(
        !$p.find("#ms-sub-opt-groups").is(":checked"),
      );
    }
    toggleSubTarget();
    $p.find("#ms-body").on("change.ms", "#ms-sub-opt-groups", toggleSubTarget);
    $p.find("#ms-body").on("click.ms", "#ms-sub-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-sub-save", async function () {
      var name = $p.find("#ms-sub-name").val().trim();
      var url = $p.find("#ms-sub-url").val().trim();
      if (!name) {
        toast("warning", "请输入订阅名称");
        return;
      }
      if (!url) {
        toast("warning", "请输入链接");
        return;
      }
      if (!/^https?:\/\//i.test(url)) {
        toast("warning", "请输入有效的HTTP(S) 链接");
        return;
      }
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html(
          '<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>验证中...',
        );
      try {
        var fetchUrl =
          url + (url.indexOf("?") >= 0 ? "&" : "?") + "_t=" + Date.now();
        var response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var imported = await response.json();
        if (!imported.prompts && !imported.groups)
          throw new Error("不是有效的小剧场数据格式");
        var useGroups = $p.find("#ms-sub-opt-groups").is(":checked");
        var sub = {
          id: uid(),
          name: name,
          url: url,
          importGroups: useGroups,
          importTags: $p.find("#ms-sub-opt-tags").is(":checked"),
          updateExisting: $p.find("#ms-sub-opt-update").is(":checked"),
          targetGroupId: !useGroups
            ? $p.find("#ms-sub-target").val() || null
            : null,
          lastChecked: null,
          lastHash: "",
          addedAt: Date.now(),
          updateLog: [],
        };
        data.subscriptions.push(sub);
        var result = mergeSubscriptionData(sub, imported);
        sub.lastChecked = Date.now();
        sub.lastHash = simpleHash(
          JSON.stringify({
            groups: imported.groups || [],
            prompts: imported.prompts || [],
            tags: imported.tags || [],
          }),
        );
        sub.updateLog.push({
          time: Date.now(),
          added: result.added,
          updated: result.updated,
          skipped: result.skipped,
        });
        saveData();
        var parts = [];
        if (result.added > 0) parts.push("新增 " + result.added + " 条");
        if (result.updated > 0) parts.push("更新 " + result.updated + " 条");
        if (result.skipped > 0) parts.push("跳过 " + result.skipped + " 条");
        toast(
          "success",
          "订阅成功！" + (parts.length > 0 ? parts.join("，") : "数据已是最新"),
        );
        navigateBack();
      } catch (e) {
        toast("error", "验证失败: " + e.message);
        $btn
          .prop("disabled", false)
          .html(
            '<i class="fa-solid fa-plus" style="margin-right:4px;"></i>添加并检查',
          );
      }
    });
  }

  function renderSubscriptionDetail(v) {
    var $p = $("#" + PANEL_ID);
    var sub = data.subscriptions.find(function (s) {
      return s.id === v.subId;
    });
    if (!sub) {
      navigateBack();
      return;
    }
    $p.find("#ms-title").text(sub.name);
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">' +
        esc(truncate(sub.name, 20)) +
        "</span>",
    );
    var logs = sub.updateLog || [];
    var logH = "";
    if (logs.length === 0) {
      logH =
        '<div style="text-align:center;padding:12px;font-size:12px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;">暂无更新记录</div>';
    } else {
      var revLogs = [].concat(logs).reverse();
      revLogs.forEach(function (log) {
        var ps = [];
        if (log.added > 0)
          ps.push(
            '<span style="color:#7dce7d;">+' + log.added + " 新增</span>",
          );
        if (log.updated > 0)
          ps.push(
            '<span style="color:var(--ms-accent);">↑' +
              log.updated +
              " 更新</span>",
          );
        if (log.skipped > 0)
          ps.push(
            '<span style="color:var(--SmartThemeQuoteColor,#888);">' +
              log.skipped +
              " 跳过</span>",
          );
        logH +=
          '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;">' +
          '<span style="color:var(--SmartThemeQuoteColor,#666);font-size:11px;flex-shrink:0;">' +
          formatDate(log.time) +
          "</span>" +
          '<span style="flex:1;">' +
          (ps.length > 0 ? ps.join(" · ") : "无变化") +
          "</span></div>";
      });
    }
    var groupOpts = '<option value="">不指定 (未分组)</option>';
    data.groups.forEach(function (g) {
      groupOpts +=
        '<option value="' +
        g.id +
        '"' +
        (sub.targetGroupId === g.id ? " selected" : "") +
        ">" +
        esc(g.name) +
        "</option>";
    });
    $p.find("#ms-body").html(
      '<div class="ms-form">' +
        '<div class="ms-field"><label>名称</label><input type="text" id="ms-sub-d-name" value="' +
        esc(sub.name) +
        '"></div>' +
        '<div class="ms-field"><label>链接</label><div style="display:flex;gap:4px;"><input type="text" id="ms-sub-d-url" value="' +
        esc(sub.url) +
        '" style="flex:1;"><button class="ms-tbtn" id="ms-sub-copy-url" title="复制链接" style="flex-shrink:0;"><i class="fa-solid fa-copy"></i></button></div></div>' +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">导入选项</div>' +
        '<div class="ms-export-opts-tight">' +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-d-groups" ' +
        (sub.importGroups ? "checked" : "") +
        "> 导入分组信息</label>" +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-d-tags" ' +
        (sub.importTags ? "checked" : "") +
        "> 导入标签信息</label>" +
        '<label class="ms-check-item"><input type="checkbox" id="ms-sub-d-update" ' +
        (sub.updateExisting !== false ? "checked" : "") +
        "> 允许更新已有内容</label>" +
        "</div>" +
        '<div class="ms-field" id="ms-sub-d-target-wrap" style="' +
        (sub.importGroups ? "display:none;" : "") +
        '"><label>放入分组 <span style="font-weight:350;opacity:0.5;">(不导入分组时，新内容放入此分组)</span></label><select id="ms-sub-d-target">' +
        groupOpts +
        "</select></div>" +
        '<div class="ms-form-btns" style="gap:6px;">' +
        '<button class="ms-btn" id="ms-sub-d-save"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>保存设置</button>' +
        '<button class="ms-btn primary" id="ms-sub-d-check"><i class="fa-solid fa-arrows-rotate" style="margin-right:4px;"></i>检查更新</button>' +
        "</div>" +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">更新记录 (' +
        logs.length +
        "/20)</div>" +
        '<div style="padding:0 14px;max-height:200px;overflow-y:auto;">' +
        logH +
        "</div>" +
        '<div class="ms-divider"></div>' +
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);padding:4px 0;">' +
        "添加于 " +
        formatDate(sub.addedAt) +
        " · 上次检查 " +
        (sub.lastChecked ? formatDate(sub.lastChecked) : "从未") +
        "</div>" +
        '<button class="ms-btn danger" id="ms-sub-d-delete" style="width:100%;"><i class="fa-solid fa-trash" style="margin-right:4px;"></i>删除订阅<span style="font-size:10px;opacity:0.6;margin-left:6px;">(已导入的剧场不受影响)</span></button>' +
        "</div>",
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleSubTarget() {
      $p.find("#ms-sub-d-target-wrap").toggle(
        !$p.find("#ms-sub-d-groups").is(":checked"),
      );
    }
    $p.find("#ms-body").on("change.ms", "#ms-sub-d-groups", toggleSubTarget);
    $p.find("#ms-body").on("click.ms", "#ms-sub-copy-url", function () {
      copyToClipboard($p.find("#ms-sub-d-url").val() || sub.url)
        .then(function () {
          toast("success", "已复制链接");
        })
        .catch(function () {
          toast("error", "复制失败");
        });
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-save", function () {
      var newName = $p.find("#ms-sub-d-name").val().trim();
      var newUrl = $p.find("#ms-sub-d-url").val().trim();
      if (!newName) {
        toast("warning", "名称不能为空");
        return;
      }
      if (!newUrl) {
        toast("warning", "链接不能为空");
        return;
      }
      if (!/^https?:\/\//i.test(newUrl)) {
        toast("warning", "请输入有效的 HTTP(S) 链接");
        return;
      }
      sub.name = newName;
      if (newUrl !== sub.url) sub.lastHash = "";
      sub.url = newUrl;
      sub.importGroups = $p.find("#ms-sub-d-groups").is(":checked");
      sub.importTags = $p.find("#ms-sub-d-tags").is(":checked");
      sub.updateExisting = $p.find("#ms-sub-d-update").is(":checked");
      sub.targetGroupId = !sub.importGroups
        ? $p.find("#ms-sub-d-target").val() || null
        : null;
      saveData();
      toast("success", "已保存");
      $p.find("#ms-title").text(sub.name);
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-check", async function () {
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html(
          '<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>检查中...',
        );
      await checkSubscription(sub.id, false);
      renderSubscriptionDetail(v);
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-delete", function () {
      if (
        !confirm(
          "确定删除订阅「" + sub.name + "」吗？\n已导入的剧场不会被删除。",
        )
      )
        return;
      data.subscriptions = data.subscriptions.filter(function (s) {
        return s.id !== sub.id;
      });
      saveData();
      toast("success", "已删除订阅");
      navigateBack();
    });
  }

  function toggleCollapse() {
    const $p = $("#" + PANEL_ID);
    $p.toggleClass("ms-collapsed");
    data.settings.collapsed = $p.hasClass("ms-collapsed");
    $p.find("#ms-btn-collapse i").attr(
      "class",
      data.settings.collapsed
        ? "fa-solid fa-window-maximize"
        : "fa-solid fa-window-minimize",
    );
    saveData();
  }

  function resetPanelPosition() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    $p[0].style.removeProperty("left");
    $p[0].style.removeProperty("top");
    $p[0].style.removeProperty("transform");
    data.settings.panelPos = null;
    saveData();
    toast("info", "面板已回到默认位置");
  }

  function showPanel() {
    let $p = $("#" + PANEL_ID);
    if ($p.length === 0) {
      if (!$("#" + STYLE_ID).length)
        $("head").append(`<style id="${STYLE_ID}">${getCSS()}</style>`);
      $("body").append(getPanelHTML());
      $p = $("#" + PANEL_ID);
      if (data.settings.collapsed) {
        $p.addClass("ms-collapsed");
        $p.find("#ms-btn-collapse i").attr(
          "class",
          "fa-solid fa-window-maximize",
        );
      }
      if (data.settings.panelPos) {
        $p[0].style.setProperty("top", data.settings.panelPos.top, "important");
        $p[0].style.setProperty(
          "left",
          data.settings.panelPos.left,
          "important",
        );
        $p[0].style.setProperty("transform", "none", "important");
      } else {
        $p[0].style.removeProperty("left");
        $p[0].style.removeProperty("top");
        $p[0].style.removeProperty("transform");
      }
      makeDraggable();
      $p.off("click.ms-inject-ind").on(
        "click.ms-inject-ind",
        "#ms-inject-indicator",
        function () {
          var sids = (data.settings.stageSelectedIds || []).filter(
            function (sid) {
              return getPrompt(sid);
            },
          );
          if (sids.length === 0) return;
          if (_injectIndicatorIdx >= sids.length) _injectIndicatorIdx = 0;
          var sid = sids[_injectIndicatorIdx];
          _injectIndicatorIdx = (_injectIndicatorIdx + 1) % sids.length;
          if ($p.hasClass("ms-collapsed")) {
            $p.removeClass("ms-collapsed");
            data.settings.collapsed = false;
            $p.find("#ms-btn-collapse i").attr(
              "class",
              "fa-solid fa-window-minimize",
            );
            saveData();
          }
          while (
            viewStack.length > 1 &&
            viewStack[viewStack.length - 1].name === "preview"
          ) {
            viewStack.pop();
          }
          navigateTo({ name: "preview", promptId: sid });
        },
      );
      [
        "click",
        "mousedown",
        "mouseup",
        "pointerdown",
        "pointerup",
        "touchstart",
        "touchend",
      ].forEach(function (evt) {
        $p[0].addEventListener(evt, function (e) {
          e.stopPropagation();
        });
      });
    }
    if (!escKeyHandler) {
      escKeyHandler = function (e) {
        if (e.key === "Escape") {
          var $pp = $("#" + PANEL_ID);
          if (!$pp.hasClass("ms-visible")) return;
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          var $findBar = $pp.find("#ms-find-bar");
          if ($findBar.is(":visible")) {
            $findBar.hide();
            $pp.find("[data-md='find']").removeClass("active");
            var ta = $pp.find("#ms-edit-content")[0];
            if (ta) ta.focus();
            return;
          }
          var $qpPopup = $pp.find("#ms-qp-popup");
          if ($qpPopup.length) {
            $qpPopup.remove();
            $pp.find("[data-md='quick-phrases']").removeClass("active");
            var ta2 = $pp.find("#ms-edit-content")[0];
            if (ta2) ta2.focus();
            return;
          }
          if ($pp.find("#ms-dropdown").is(":visible")) {
            closeActiveDropdown();
            return;
          }
          if (viewStack.length > 1) {
            navigateBack();
            return;
          }
          hidePanel();
        }
      };
      document.addEventListener("keydown", escKeyHandler, true);
    }
    updateAccentColor();
    syncThemeBackground();
    syncThemeColors();
    if (!$p.data("ms-drop-bound")) {
      $p.data("ms-drop-bound", true);
      let dragCounter = 0;
      $p.on("dragenter", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        $p.addClass("ms-drag-hover");
      });
      $p.on("dragleave", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          $p.removeClass("ms-drag-hover");
        }
      });
      $p.on("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      $p.on("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        $p.removeClass("ms-drag-hover");
        const files =
          e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.name.endsWith(".json")) {
            doImport(file);
          } else {
            toast("warning", "请拖入 .json 文件");
          }
        }
      });
    }
    $p.addClass("ms-visible");
    panelVisible = true;
    data.settings.panelWasVisible = true;
    saveData();
    const panelRect = $p[0].getBoundingClientRect();
    const pTop = panelRect.top,
      pLeft = panelRect.left;
    const checkWin =
      ($p[0].ownerDocument && $p[0].ownerDocument.defaultView) || window;
    if (
      pTop < -10 ||
      pTop > checkWin.innerHeight - 50 ||
      pLeft < -200 ||
      pLeft > checkWin.innerWidth - 60 ||
      (pTop < 5 && pLeft < 5)
    ) {
      $p[0].style.removeProperty("left");
      $p[0].style.removeProperty("top");
      $p[0].style.removeProperty("transform");
      data.settings.panelPos = null;
      saveData();
    }
    viewStack = [{ name: "list" }];
    searchQuery = "";
    filterState = { tags: [], groupId: null };
    renderView();
    autoCheckSubscriptions();
  }

  function hidePanel() {
    if (currentView().name === "edit" && editDirty) {
      if (!confirm("编辑内容尚未保存，确定要关闭吗？")) return;
    }
    editDirty = false;
    exitFocusMode();
    $("#" + PANEL_ID).removeClass("ms-visible");
    panelVisible = false;
    data.settings.panelWasVisible = false;
    saveData();
    if (escKeyHandler) {
      document.removeEventListener("keydown", escKeyHandler, true);
      escKeyHandler = null;
    }
  }

  function togglePanel() {
    if (panelVisible) hidePanel();
    else showPanel();
  }

  function makeDraggable() {
    const $p = $("#" + PANEL_ID);
    const panelEl = $p[0];
    if (!panelEl) return;
    const ownerWin =
      (panelEl.ownerDocument && panelEl.ownerDocument.defaultView) || window;
    const headerEl = panelEl.querySelector("#ms-header");
    if (!headerEl) return;
    let dragging = false,
      sx,
      sy,
      sl,
      st;
    let _didMove = false;
    let _dblTapTime = 0;
    let _dblTapDidMove = false;
    let _origLeft = "",
      _origTop = "",
      _origTransform = "";

    headerEl.addEventListener("pointerdown", function (e) {
      var t = e.target;
      if (
        t.closest &&
        t.closest(
          ".ms-hbtn, button, input, select, textarea, a, .ms-inject-indicator",
        )
      )
        return;
      e.preventDefault();
      dragging = true;
      _didMove = false;
      _dblTapDidMove = false;
      _origLeft = panelEl.style.getPropertyValue("left");
      _origTop = panelEl.style.getPropertyValue("top");
      _origTransform = panelEl.style.getPropertyValue("transform");
      sx = e.clientX;
      sy = e.clientY;
      var rect = panelEl.getBoundingClientRect();
      sl = rect.left;
      st = rect.top;
      panelEl.style.setProperty("left", sl + "px", "important");
      panelEl.style.setProperty("top", st + "px", "important");
      panelEl.style.setProperty("transform", "none", "important");
      try {
        headerEl.setPointerCapture(e.pointerId);
      } catch (ex) {}
    });

    headerEl.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      e.preventDefault();
      if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) {
        _didMove = true;
        _dblTapDidMove = true;
      }
      if (!_didMove) return;
      var nl = sl + (e.clientX - sx),
        nt = st + (e.clientY - sy);
      nt = Math.max(0, Math.min(nt, ownerWin.innerHeight - 30));
      nl = Math.max(
        -panelEl.offsetWidth + 60,
        Math.min(nl, ownerWin.innerWidth - 60),
      );
      panelEl.style.setProperty("top", nt + "px", "important");
      panelEl.style.setProperty("left", nl + "px", "important");
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (!_dblTapDidMove) {
        var _now = Date.now();
        if (_now - _dblTapTime < 400) {
          _dblTapTime = 0;
          resetPanelPosition();
          return;
        }
        _dblTapTime = _now;
      } else {
        _dblTapTime = 0;
      }
      if (!_didMove) {
        if (_origLeft)
          panelEl.style.setProperty("left", _origLeft, "important");
        else panelEl.style.removeProperty("left");
        if (_origTop) panelEl.style.setProperty("top", _origTop, "important");
        else panelEl.style.removeProperty("top");
        if (_origTransform)
          panelEl.style.setProperty("transform", _origTransform, "important");
        else panelEl.style.removeProperty("transform");
        return;
      }
      data.settings.panelPos = {
        top: panelEl.style.getPropertyValue("top"),
        left: panelEl.style.getPropertyValue("left"),
      };
      saveData();
    }

    headerEl.addEventListener("pointerup", endDrag);
    headerEl.addEventListener("pointercancel", endDrag);
    headerEl.addEventListener("lostpointercapture", endDrag);

    headerEl.addEventListener("dblclick", function (e) {
      if (e.target.closest(".ms-hbtn, button")) return;
      resetPanelPosition();
    });
  }

  function addMenuButton() {
    const btnId = "openMiniStageButton";
    if ($("#" + btnId).length > 0) return;
    const $c = $("#extensionsMenu");
    if (!$c.length) return;
    $c.append(
      `<div id="${btnId}" class="list-group-item flex-container flexGap5 interactable" tabindex="0"><i class="fa-solid fa-masks-theater"></i><span>小剧场</span></div>`,
    );
    $("#" + btnId).on("click", togglePanel);
  }

  async function deleteLastPair() {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      toast("warning", "没有消息可以删除");
      return;
    }
    const idsToDelete = [lastId];
    if (lastId - 1 >= 0) {
      idsToDelete.push(lastId - 1);
    }
    await deleteChatMessages(idsToDelete, { refresh: "none" });
    idsToDelete.forEach(function (id) {
      $('#chat .mes[mesid="' + id + '"]').remove();
    });
    $("#chat .mes").removeClass("last_mes");
    $("#chat .mes").last().addClass("last_mes");
    var newLastId = getLastMessageId();
    if (newLastId >= 0) {
      await refreshOneMessage(newLastId);
    }
  }

  async function hideLastPair() {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      toast("warning", "没有消息可以隐藏");
      return;
    }
    const msgs = getChatMessages(-1);
    if (msgs.length === 0) {
      toast("warning", "没有消息可以隐藏");
      return;
    }
    const idsToHide = [lastId];
    if (lastId - 1 >= 0) {
      idsToHide.push(lastId - 1);
    }
    await setChatMessages(
      idsToHide.map(function (id) {
        return { message_id: id, is_hidden: true };
      }),
      { refresh: "affected" },
    );
    toast("success", "已隐藏 " + idsToHide.length + " 条消息");
  }

  function addScriptButton() {
    try {
      if (
        typeof appendInexistentScriptButtons === "function" &&
        typeof getButtonEvent === "function" &&
        typeof eventOn === "function"
      ) {
        appendInexistentScriptButtons([
          { name: "小剧场", visible: true },
          { name: "删除本轮", visible: true },
          { name: "隐藏本轮", visible: true },
        ]);
        eventOn(getButtonEvent("小剧场"), togglePanel);
        eventOn(getButtonEvent("删除本轮"), deleteLastPair);
        eventOn(getButtonEvent("隐藏本轮"), hideLastPair);
      }
    } catch (e) {}
  }

  function init() {
    const ctx = getCtx();
    if (!ctx) {
      setTimeout(init, 500);
      return;
    }
    loadData();
    addMenuButton();
    addScriptButton();
    if (data.settings.panelWasVisible) {
      setTimeout(function () {
        showPanel();
      }, 1000);
    }
    try {
      if (
        typeof eventOn === "function" &&
        typeof tavern_events !== "undefined"
      ) {
        eventOn(tavern_events.CHAT_CHANGED, function () {
          _currentStagePrompt = null;
          if (panelVisible) renderView();
        });
        eventOn(
          tavern_events.GENERATION_AFTER_COMMANDS,
          async function (type, option, dry_run) {
            if (dry_run) return;

            if (_skipAllInjectForNextGeneration) {
              _skipAllInjectForNextGeneration = false;
              _currentStagePrompt = null;
              _currentStagePrompts = [];
              return;
            }

            if (!data.settings.stageInjectEnabled) return;
            var stagePrompts = [];
            var wasManual = false;
            var sids = data.settings.stageSelectedIds || [];

            if (sids.length > 0) {
              sids.forEach(function (sid) {
                var sp = getPrompt(sid);
                if (sp) stagePrompts.push(sp);
              });
              wasManual = true;
            }

            if (
              Array.isArray(_skipNextInjectPromptIds) &&
              _skipNextInjectPromptIds.length > 0
            ) {
              stagePrompts = stagePrompts.filter(function (p) {
                return _skipNextInjectPromptIds.indexOf(p.id) < 0;
              });
              _skipNextInjectPromptIds = [];
            }

            if (
              stagePrompts.length === 0 &&
              data.settings.randomInject &&
              data.settings.randomInject.enabled
            ) {
              var rp = getRandomStagePrompt();
              if (rp) stagePrompts.push(rp);
              wasManual = false;
            }

            if (stagePrompts.length === 0) {
              _currentStagePrompt = null;
              _currentStagePrompts = [];
              _pendingClearStageSelectedIds = [];
              return;
            }

            if (data.settings.stageInjectMode === "macro") {
              if (_macroInjectBusy) {
                if (!_macroBusyWarned) {
                  _macroBusyWarned = true;
                  toast(
                    "warning",
                    "检测到并发生成，本次已跳过小剧场宏注入，避免串台",
                  );
                }
                _currentStagePrompt = null;
                _currentStagePrompts = [];
                _pendingClearStageSelectedIds = [];
                return;
              }
              _macroInjectBusy = true;
              _macroBusyWarned = false;
            }

            _currentStagePrompt =
              stagePrompts.length > 0 ? stagePrompts[0] : null;
            _currentStagePrompts = stagePrompts;

            if (wasManual) {
              _pendingClearStageSelectedIds = stagePrompts.map(function (p) {
                return p.id;
              });
            } else {
              _pendingClearStageSelectedIds = [];
            }

            if (data.settings.stageInjectMode === "depth") {
              var allContent = substitudeMacros(
                buildStageContent(stagePrompts),
              );
              injectPrompts(
                [
                  {
                    id: "mini-stage-inject",
                    position: "in_chat",
                    depth: data.settings.stageInjectDepth || 0,
                    role: data.settings.stageInjectRole || "system",
                    content: allContent,
                  },
                ],
                { once: true },
              );
            }
          },
        );
        eventOn(tavern_events.GENERATION_ENDED, function () {
          _currentStagePrompt = null;
          _currentStagePrompts = [];
          _skipAllInjectForNextGeneration = false;
          updateInjectIndicator();
        });

        eventOn(tavern_events.GENERATION_STOPPED, function () {
          _currentStagePrompt = null;
          _currentStagePrompts = [];
          _skipAllInjectForNextGeneration = false;
          updateInjectIndicator();
        });
      }
    } catch (e) {}
    try {
      if (typeof registerMacroLike === "function") {
        registerMacroLike(/\{\{stage\}\}/gi, function (context, substring) {
          if (!data.settings.stageInjectEnabled) return "";
          if (_currentStagePrompts.length === 0) return "";
          if (data.settings.stageInjectMode !== "macro") return "";
          return substitudeMacros(
            _currentStagePrompts
              .map(function (p) {
                return p.content || "";
              })
              .join("\n"),
          );
        });
        registerMacroLike(
          /\{\{stage_prompt\}\}/gi,
          function (context, substring) {
            if (!data.settings.stageInjectEnabled) return "";
            if (_currentStagePrompts.length === 0) return "";
            if (data.settings.stageInjectMode !== "macro") return "";
            return substitudeMacros(buildStageContent(_currentStagePrompts));
          },
        );
        registerMacroLike(
          /\{\{stage_title\}\}/gi,
          function (context, substring) {
            if (!data.settings.stageInjectEnabled) return "";
            if (_currentStagePrompts.length === 0) return "";
            return _currentStagePrompts
              .map(function (p) {
                return p.title || "";
              })
              .join(", ");
          },
        );
      }
    } catch (e) {}
    try {
      if (window.parent && window.parent.document) {
        let themeDebounce = null;
        const themeObs = new MutationObserver(function () {
          clearTimeout(themeDebounce);
          themeDebounce = setTimeout(function () {
            updateAccentColor();
            syncThemeBackground();
            syncThemeColors();
          }, 300);
        });
        themeObs.observe(window.parent.document.documentElement, {
          attributes: true,
          attributeFilter: ["style"],
        });
        themeObs.observe(window.parent.document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } catch (e) {}
    window.addEventListener("resize", function () {
      const $p = $("#" + PANEL_ID);
      if (!$p.length || !panelVisible) return;
      const el = $p[0];
      const w =
        ($p[0].ownerDocument && $p[0].ownerDocument.defaultView) || window;
      const rect = el.getBoundingClientRect();
      if (rect.top > w.innerHeight - 50)
        el.style.setProperty(
          "top",
          Math.max(0, w.innerHeight - 80) + "px",
          "important",
        );
      if (rect.left > w.innerWidth - 60)
        el.style.setProperty(
          "left",
          Math.max(0, w.innerWidth - 100) + "px",
          "important",
        );
      const maxW = w.innerWidth * 0.92;
      if (el.offsetWidth > maxW)
        el.style.setProperty("width", maxW + "px", "important");
    });
    $(window).on("pagehide", function () {
      if (escKeyHandler) {
        document.removeEventListener("keydown", escKeyHandler, true);
        escKeyHandler = null;
      }
    });
  }

  if (typeof $ !== "undefined" && getCtx()) $(init);
  else {
    let att = 0;
    const w = setInterval(() => {
      att++;
      if (typeof $ !== "undefined" && getCtx()) {
        clearInterval(w);
        $(init);
      } else if (att > 40) clearInterval(w);
    }, 500);
  }
})();
