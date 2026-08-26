function _msSetHead(title, desc) {
  var h =
    '<div class="ms-set-head"><div class="ms-set-head-title">' +
    esc(title) +
    "</div>";
  if (desc) h += '<div class="ms-set-head-desc">' + desc + "</div>";
  return h + "</div>";
}

function _msSetRow(o) {
  var cls = "ms-set-row";
  if (o.danger) cls += " danger";
  if (o.plain) cls += " static";
  var attr = "";
  if (o.id) attr += ' id="' + o.id + '"';
  if (o.nav) attr += ' data-set-nav="' + escAttr(o.nav) + '"';
  if (o.act) attr += ' data-set-act="' + escAttr(o.act) + '"';
  var h = '<div class="' + cls + '"' + attr + ">";
  if (o.icon)
    h +=
      '<div class="ms-set-ico"><i class="fa-solid ' + o.icon + '"></i></div>';
  h +=
    '<div class="ms-set-main"><div class="ms-set-title">' + o.title + "</div>";
  if (o.desc) h += '<div class="ms-set-desc">' + o.desc + "</div>";
  h += "</div>";
  if (o.value) h += '<span class="ms-set-value">' + o.value + "</span>";
  if (o.sw)
    h +=
      '<div class="ms-adv-switch-wrap"><label class="ms-switch" style="margin:0;"><input type="checkbox" id="' +
      o.sw +
      '"' +
      (o.on ? " checked" : "") +
      '><span class="ms-switch-slider"></span></label></div>';
  if (o.nav) h += '<i class="fa-solid fa-angle-right ms-set-chev"></i>';
  return h + "</div>";
}

function _msSetField(labelHtml, inputHtml) {
  return (
    '<div class="ms-set-field"><div class="ms-field">' +
    (labelHtml ? "<label>" + labelHtml + "</label>" : "") +
    inputHtml +
    "</div></div>"
  );
}

function _msSetNote(html) {
  return '<div class="ms-set-note">' + html + "</div>";
}

function _msDataSize() {
  try {
    var kb = Math.round(
      JSON.stringify({
        groups: data.groups,
        prompts: data.prompts,
        quickPhrases: data.quickPhrases,
        subscriptions: data.subscriptions,
        settings: data.settings,
      }).length / 1024,
    );
    return {
      kb: kb,
      text: kb < 1024 ? kb + " KB" : (kb / 1024).toFixed(2) + " MB",
    };
  } catch (e) {
    return { kb: 0, text: "未知" };
  }
}

function _msHistoryTotal() {
  return data.prompts.reduce(function (s, p) {
    return s + (p.history ? p.history.length : 0);
  }, 0);
}

function _msRandomPoolCount() {
  return data.prompts.filter(function (p) {
    return isInRandomPool(p);
  }).length;
}

function _msPinnedSeqCount() {
  var pi = data.settings.pinnedInject;
  return pi && Array.isArray(pi.sequence) ? pi.sequence.length : 0;
}

function _msInjectRoleLabel() {
  var r = data.settings.stageInjectRole || "system";
  if (r === "user") return "User";
  if (r === "assistant") return "Assistant";
  return "System";
}

function _msBindSetRows($p) {
  var $body = $p.find("#ms-body");
  $body.on("click.ms", "[data-set-nav]", function (e) {
    if (
      $(e.target).closest(".ms-switch, input, select, textarea, button, a")
        .length
    )
      return;
    var n = $(this).attr("data-set-nav");
    if (n) navigateTo({ name: n });
  });
  $body.on("click.ms", ".ms-set-row", function (e) {
    if (
      $(e.target).closest(".ms-switch, input, select, textarea, button, a")
        .length
    )
      return;
    if ($(this).attr("data-set-nav")) return;
    var $sw = $(this).find('.ms-switch input[type="checkbox"]');
    if ($sw.length) $sw.prop("checked", !$sw.prop("checked")).trigger("change");
  });
}

function _msShowMacroHelp() {
  var body = stripZeroWidth(
    '<div class="ms-macro-info" style="margin:0;">' +
      '<div style="font-size:10px;color:var(--ms-accent);font-weight:600;margin:0 0 2px;opacity:0.85;">全局宏（预设、世界书、聊天历史等任何地方都能用）</div>' +
      "<div><code>{\u200B{stage}}</code><span class=\"ms-macro-desc\">剧场原始内容</span></div>" +
      "<div><code>{\u200B{stage_title}}</code><span class=\"ms-macro-desc\">剧场标题</span></div>" +
      "<div><code>{\u200B{stage_prompt}}</code><span class=\"ms-macro-desc\">前缀+剧场内容的完整注入体</span></div>" +
      '<div style="font-size:10px;color:var(--ms-accent);font-weight:600;margin:8px 0 2px;opacity:0.85;">脚本宏（仅在「前缀指令」「多条外壳模板」框里有效）</div>' +
      "<div><code>{\u200B{stages}}</code><span class=\"ms-macro-desc\">多条任务合并插入</span></div>" +
      "<div><code>{\u200B{stage_count}}</code><span class=\"ms-macro-desc\">剧场总数</span></div>" +
      "<div><code>{\u200B{stage_tasks}}</code><span class=\"ms-macro-desc\">所有任务块拼接</span></div>" +
      '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:8px;border-top:1px dashed rgba(255,255,255,0.08);padding-top:7px;line-height:1.7;">' +
      "<code style=\"font-style:normal;\">{\u200B{stage}}</code> 与 <code style=\"font-style:normal;\">{\u200B{stages}}</code> 的多任务行为不同，" +
      '<a href="#" id="ms-goto-inject-guide" style="color:var(--ms-accent);cursor:pointer;">查看完整说明</a></div>' +
      "</div>",
  );
  showModal({
    title: "可用宏速查",
    iconType: "info",
    icon: "fa-wand-magic-sparkles",
    modalStyle: "min-width:320px;max-width:92vw;width:440px;",
    body: body,
    buttons: [{ text: "知道了", cls: "primary", primary: true, value: true }],
    onShow: function ($overlay, close) {
      $overlay.on("click", "#ms-goto-inject-guide", function (e) {
        e.preventDefault();
        close(true);
        setTimeout(function () {
          if (getPrompt("_builtin_inject_guide")) {
            navigateTo({ name: "preview", promptId: "_builtin_inject_guide" });
          } else {
            toast("warning", "找不到注入功能指南，可在关于页重新生成使用说明");
          }
        }, 200);
      });
    },
  });
}

function renderSettings() {
  var $p = setupPage("设置");
  var injectOn = !!data.settings.stageInjectEnabled;
  var injectDesc;
  if (!injectOn) {
    injectDesc = "已关闭，剧场仅能手动填入输入框";
  } else if (data.settings.stageInjectMode === "macro") {
    injectDesc = "已启用 · 自定义宏模式";
  } else {
    injectDesc =
      "已启用 · 深度注入 · 深度 " +
      (data.settings.stageInjectDepth || 0) +
      " · " +
      _msInjectRoleLabel();
  }

  var ri = data.settings.randomInject || {};
  var pi = data.settings.pinnedInject || {};
  var poolParts = [];
  if (ri.enabled) {
    poolParts.push(
      "随机 " +
        (ri.multiEnabled ? (parseInt(ri.multiCount) || 2) + " 条" : "1 条"),
    );
  } else {
    poolParts.push("随机已关");
  }
  poolParts.push(
    pi.enabled ? "固定序列 " + _msPinnedSeqCount() + " 项" : "固定已关",
  );

  var appearParts = [];
  appearParts.push(
    data.settings.collapseMode === "ball" ? "悬浮球收起" : "折叠条收起",
  );
  appearParts.push(
    data.settings.uiCustomEnabled
      ? "字号 " + data.settings.uiFontSize + "px"
      : "默认尺寸",
  );
  var themeCnt = Object.keys(data.settings.themeBindings || {}).length;
  if (themeCnt > 0) appearParts.push("主题绑定 " + themeCnt);

  var sizeInfo = _msDataSize();
  var histTotal = _msHistoryTotal();

  var html = "";
  html += _msSetHead("注入", "控制剧场内容如何随发送进入 AI 的提示词");
  html += _msSetRow({
    nav: "settings-inject",
    icon: "fa-syringe",
    title: "注入功能",
    desc: esc(injectDesc),
  });
  html += _msSetRow({
    nav: "settings-pools",
    icon: "fa-dice",
    title: "随机与固定序列",
    desc: esc(poolParts.join(" · ")),
  });

  html += _msSetHead("内容");
  html += _msSetRow({
    nav: "settings-content",
    icon: "fa-pen-nib",
    title: "创作与订阅",
    desc:
      "默认作者 · 快捷短语 " +
      data.quickPhrases.length +
      " 条 · 订阅 " +
      data.subscriptions.length +
      " 个",
  });
  html += _msSetRow({
    nav: "stats",
    icon: "fa-chart-simple",
    title: "使用统计",
  });

  html += _msSetHead("外观");
  html += _msSetRow({
    nav: "settings-appearance",
    icon: "fa-palette",
    title: "界面与主题",
    desc: esc(appearParts.join(" · ")),
  });

  html += _msSetHead("数据", "备份、清理与跨端搬运");
  html += _msSetRow({
    nav: "settings-data",
    icon: "fa-database",
    title: "数据管理",
    desc:
      "占用 " +
      esc(sizeInfo.text) +
      " · 版本历史 " +
      histTotal +
      " 条" +
      (sizeInfo.kb > 2048
        ? ' · <span style="color:var(--ms-danger);">建议清理</span>'
        : ""),
  });
  html += _msSetRow({
    nav: "settings-transfer",
    icon: "fa-right-left",
    title: "格式转换台",
    desc: "与转换台交换分组、标签与剧场数据",
  });

  html += _msSetHead("关于", "");
  html += _msSetRow({
    nav: "settings-about",
    icon: "fa-circle-info",
    title: "关于与更新",
    desc: "当前版本 v" + SCRIPT_VERSION,
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);
}

function renderSettingsInject() {
  var $p = setupPage("注入功能");
  var on = !!data.settings.stageInjectEnabled;
  var isMacro = data.settings.stageInjectMode === "macro";

  var html = "";
  html += _msSetHead(
    "总开关",
    "开启后，选中的剧场会随下一次发送注入到 AI 提示词中",
  );
  html += _msSetRow({
    icon: "fa-syringe",
    title: "启用注入功能",
    sw: "ms-inject-enabled-toggle",
    on: on,
  });

  if (on) {
    html += _msSetHead(
      "注入方式",
      "深度注入由脚本插入到聊天记录中；自定义宏需要你在预设里手动放占位符",
    );
    html +=
      '<div class="ms-set-seg">' +
      '<button class="ms-set-segbtn' +
      (isMacro ? "" : " active") +
      '" data-inject-mode="depth"><i class="fa-solid fa-layer-group"></i>深度注入</button>' +
      '<button class="ms-set-segbtn' +
      (isMacro ? " active" : "") +
      '" data-inject-mode="macro"><i class="fa-solid fa-code"></i>自定义宏</button>' +
      "</div>";

    if (!isMacro) {
      html += _msSetField(
        "",
        '<div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>注入深度</label><input type="number" id="ms-inject-depth" min="0" max="999" value="' +
          (data.settings.stageInjectDepth || 0) +
          '"></div><div class="ms-field" style="flex:1;"><label>消息角色</label><select id="ms-inject-role"><option value="system"' +
          (data.settings.stageInjectRole === "system" ? " selected" : "") +
          '>System</option><option value="user"' +
          (data.settings.stageInjectRole === "user" ? " selected" : "") +
          '>User</option><option value="assistant"' +
          (data.settings.stageInjectRole === "assistant" ? " selected" : "") +
          ">Assistant</option></select></div></div>",
      );
    }

    html += _msSetRow({
      act: "macro-help",
      icon: "fa-wand-magic-sparkles",
      title: "可用宏速查",
    });

    html += _msSetHead(
      "前缀模板",
      stripZeroWidth(
        "用 <code>{\u200B{stage}}</code> 标记剧场插入位置；不写则直接拼接在末尾",
      ),
    );
    html += _msSetField(
      '默认前缀指令 <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-default-prefix" data-fs-title="编辑默认前缀指令" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i>',
      '<textarea id="ms-default-prefix" style="min-height:120px;resize:vertical;" placeholder="例：在正文最后输出以下剧场内容...">' +
        esc(data.settings.defaultStagePrefix || "") +
        "</textarea>",
    );
    html += _msSetField(
      '多条外壳模板 <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-multi-prefix" data-fs-title="编辑多条外壳模板" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i>',
      '<textarea id="ms-multi-prefix" style="min-height:80px;resize:vertical;" placeholder="留空使用内置默认模板">' +
        esc(data.settings.multiStagePrefix || "") +
        "</textarea>",
    );
    html += _msSetNote(
      stripZeroWidth(
        '<i class="fa-solid fa-triangle-exclamation" style="color:var(--ms-danger);margin-right:4px;"></i>多条外壳模板中必须包含 <code style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);padding:1px 5px;border-radius:3px;">{\u200B{stage_tasks}}</code>，否则会自动回退到内置默认模板',
      ),
    );

    html += _msSetHead(
      "生成后行为",
      "API 报错、空回复或用户中止时不会清除，方便直接重试",
    );
    html += _msSetRow({
      icon: "fa-broom",
      title: "生成完成后自动清除注入",
      sw: "ms-clear-after-gen-toggle",
      on: !!data.settings.clearStageAfterGeneration,
    });
  }

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("change.ms", "#ms-inject-enabled-toggle", function () {
    data.settings.stageInjectEnabled = $(this).is(":checked");
    saveData();
    updateInjectIndicator();
    renderSettingsInject();
  });
  $body.on("click.ms", "[data-inject-mode]", function () {
    var mode = $(this).attr("data-inject-mode");
    if (data.settings.stageInjectMode === mode) return;
    data.settings.stageInjectMode = mode;
    saveData();
    renderSettingsInject();
  });
  $body.on("input.ms", "#ms-inject-depth", function () {
    var val = parseInt($(this).val());
    if (isNaN(val) || val < 0) val = 0;
    if (val > 999) val = 999;
    data.settings.stageInjectDepth = val;
    saveData();
  });
  $body.on("change.ms", "#ms-inject-role", function () {
    data.settings.stageInjectRole = $(this).val();
    saveData();
  });
  $body.on("click.ms", "[data-set-act='macro-help']", function () {
    _msShowMacroHelp();
  });
  $body.on("input.ms", "#ms-default-prefix", function () {
    data.settings.defaultStagePrefix = $(this).val();
    saveData();
  });
  $body.on("input.ms", "#ms-multi-prefix", function () {
    data.settings.multiStagePrefix = $(this).val();
    saveData();
  });
  $body.on("change.ms", "#ms-clear-after-gen-toggle", function () {
    data.settings.clearStageAfterGeneration = $(this).is(":checked");
    saveData();
    renderSettingsInject();
  });
}

function renderSettingsPools() {
  var $p = setupPage("随机与固定序列");
  if (!data.settings.randomInject) {
    data.settings.randomInject = {
      enabled: false,
      excludedGroupIds: [],
      excludedSeries: [],
      excludedPromptIds: [],
      excludedSubGroups: [],
      multiEnabled: false,
      multiCount: 2,
    };
  }
  if (!data.settings.pinnedInject) {
    data.settings.pinnedInject = { enabled: false, sequence: [] };
  }
  var ri = data.settings.randomInject;
  var pi = data.settings.pinnedInject;
  var poolCnt = _msRandomPoolCount();

  var html = "";
  if (!data.settings.stageInjectEnabled) {
    html += _msSetNote(
      '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>注入总开关当前是关闭的，这里的设置要等开启后才会生效',
    );
  }

  html += _msSetHead("随机注入", "没有手动选中剧场时，自动从随机池里抽取");
  html += _msSetRow({
    icon: "fa-dice",
    title: "启用随机注入",
    sw: "ms-random-toggle",
    on: !!ri.enabled,
  });
  if (ri.enabled) {
    html += _msSetRow({
      icon: "fa-layer-group",
      title: "一次抽取多条",
      desc: ri.multiEnabled
        ? "每次抽取 " + (parseInt(ri.multiCount) || 2) + " 条"
        : "每次只抽 1 条",
      sw: "ms-random-multi-toggle",
      on: !!ri.multiEnabled,
    });
    if (ri.multiEnabled) {
      html += _msSetField(
        "抽取数量",
        '<div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-random-multi-count" min="1" max="10" step="1" value="' +
          (parseInt(ri.multiCount) || 2) +
          '" style="width:90px;"><span style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);">条（建议 2-5 条，过多会污染上下文）</span></div>',
      );
    }
  }
  html += _msSetRow({
    nav: "random-pool",
    icon: "fa-sliders",
    title: "管理随机池",
    desc: "按分组、文件夹、系列或单条排除内容",
    value: "可用 " + poolCnt + " 条",
  });

  html += _msSetHead(
    "固定注入",
    "没有手动选中时，按你排好的序列注入；序列里的骰子占位需要同时开启随机注入",
  );
  html += _msSetRow({
    icon: "fa-thumbtack",
    title: "启用固定序列",
    sw: "ms-pinned-toggle",
    on: !!pi.enabled,
  });
  html += _msSetRow({
    nav: "pinned-pool",
    icon: "fa-list-ol",
    title: "管理固定池",
    value: _msPinnedSeqCount() + " 项",
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("change.ms", "#ms-random-toggle", function () {
    ri.enabled = $(this).is(":checked");
    saveData();
    updateInjectIndicator();
    renderSettingsPools();
  });
  $body.on("change.ms", "#ms-random-multi-toggle", function () {
    ri.multiEnabled = $(this).is(":checked");
    saveData();
    renderSettingsPools();
  });
  $body.on("input.ms", "#ms-random-multi-count", function () {
    var val = parseInt($(this).val());
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10) val = 10;
    ri.multiCount = val;
    saveData();
  });
  $body.on("change.ms", "#ms-pinned-toggle", function () {
    pi.enabled = $(this).is(":checked");
    saveData();
    updateInjectIndicator();
    renderSettingsPools();
  });
}

function renderSettingsContent() {
  var $p = setupPage("创作与订阅");
  var html = "";

  html += _msSetHead("创作默认值", "新建剧场时自动带上的内容");
  html += _msSetField(
    "默认作者署名",
    '<input type="text" id="ms-default-author" placeholder="新建时自动填入" value="' +
      esc(data.settings.defaultAuthor || "") +
      '">',
  );
  html += _msSetRow({
    nav: "quick-phrases",
    icon: "fa-bolt",
    title: "快捷短语",
    desc: "在编辑器工具栏一键插入的常用片段",
    value: data.quickPhrases.length + " 条",
  });

  html += _msSetHead(
    "订阅",
    "打开面板时，超过设定时间未检查的订阅会自动静默检查",
  );
  html += _msSetField(
    "自动检查间隔",
    '<div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-auto-check-interval" min="0" max="168" step="1" value="' +
      (data.settings.autoCheckInterval === undefined
        ? 6
        : data.settings.autoCheckInterval) +
      '" style="width:90px;"><span style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);">小时（设为 0 关闭自动检查）</span></div>',
  );
  html += _msSetRow({
    nav: "subscriptions",
    icon: "fa-rss",
    title: "订阅管理",
    desc: "添加作者分享的链接，一键同步更新",
    value: data.subscriptions.length + " 个",
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("input.ms", "#ms-default-author", function () {
    data.settings.defaultAuthor = $(this).val().trim();
    saveData();
  });
  $body.on("input.ms", "#ms-auto-check-interval", function () {
    var val = parseInt($(this).val());
    if (isNaN(val) || val < 0) val = 0;
    if (val > 168) val = 168;
    data.settings.autoCheckInterval = val;
    saveData();
  });
}

function renderSettingsAppearance() {
  var $p = setupPage("界面与主题");
  var isBall = data.settings.collapseMode === "ball";
  var uiOn = !!data.settings.uiCustomEnabled;
  var themeCnt = Object.keys(data.settings.themeBindings || {}).length;

  var html = "";
  html += _msSetHead(
    "收起方式",
    "折叠条会把面板缩成一条标题栏；悬浮球会完全隐藏面板，只留一个可拖动的小球",
  );
  html +=
    '<div class="ms-set-seg">' +
    '<button class="ms-set-segbtn' +
    (isBall ? "" : " active") +
    '" data-collapse-mode="bar"><i class="fa-solid fa-window-minimize"></i>折叠条</button>' +
    '<button class="ms-set-segbtn' +
    (isBall ? " active" : "") +
    '" data-collapse-mode="ball"><i class="fa-solid fa-circle-dot"></i>悬浮球</button>' +
    "</div>";

  html += _msSetHead("面板尺寸", "关闭后跟随脚本默认尺寸，随窗口自适应");
  html += _msSetRow({
    icon: "fa-up-right-and-down-left-from-center",
    title: "自定义字号与尺寸",
    desc: uiOn
      ? "字号 " +
        data.settings.uiFontSize +
        "px · 宽 " +
        data.settings.uiPanelWidth +
        "px · 高 " +
        data.settings.uiPanelHeight +
        "vh"
      : "使用默认尺寸",
    sw: "ms-ui-custom-toggle",
    on: uiOn,
  });
  if (uiOn) {
    html += _msSetField(
      "",
      '<div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>字号 (px)</label><input type="number" id="ms-ui-font-size" min="10" max="24" value="' +
        data.settings.uiFontSize +
        '"></div><div class="ms-field" style="flex:1;"><label>宽度 (px)</label><input type="number" id="ms-ui-panel-width" min="320" max="1400" value="' +
        data.settings.uiPanelWidth +
        '"></div><div class="ms-field" style="flex:1;"><label>最大高度 (vh)</label><input type="number" id="ms-ui-panel-height" min="40" max="100" value="' +
        data.settings.uiPanelHeight +
        '"></div></div>',
    );
  }

  html += _msSetHead(
    "主题适配",
    "为抓取背景失败、撞色严重的美化主题单独指定面板背景与文字色",
  );
  html += _msSetRow({
    nav: "theme-binding",
    icon: "fa-palette",
    title: "主题绑定",
    desc: themeCnt > 0 ? "已为 " + themeCnt + " 个主题设定专属配色" : "尚未绑定任何主题",
    value: themeCnt + " 个",
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("click.ms", "[data-collapse-mode]", function () {
    var mode = $(this).attr("data-collapse-mode");
    if (data.settings.collapseMode === mode) return;
    data.settings.collapseMode = mode;
    var $panel = $("#" + PANEL_ID);
    if (mode === "ball") {
      data.settings.collapsed = false;
      $panel.removeClass("ms-collapsed");
      $panel
        .find("#ms-btn-collapse i")
        .attr("class", "fa-solid fa-window-minimize");
    } else {
      hideFloatBall();
    }
    saveData();
    renderSettingsAppearance();
  });
  $body.on("change.ms", "#ms-ui-custom-toggle", function () {
    data.settings.uiCustomEnabled = $(this).is(":checked");
    saveData();
    applyUICustomization();
    renderSettingsAppearance();
  });
  $body.on("input.ms", "#ms-ui-font-size", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 10 && v <= 24) {
      data.settings.uiFontSize = v;
      saveData();
      applyUICustomization();
    }
  });
  $body.on("input.ms", "#ms-ui-panel-width", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 320 && v <= 1400) {
      data.settings.uiPanelWidth = v;
      saveData();
      applyUICustomization();
    }
  });
  $body.on("input.ms", "#ms-ui-panel-height", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 40 && v <= 100) {
      data.settings.uiPanelHeight = v;
      saveData();
      applyUICustomization();
    }
  });
}

function renderSettingsData() {
  var $p = setupPage("数据管理");
  var sizeInfo = _msDataSize();
  var histTotal = _msHistoryTotal();
  var histPrompts = data.prompts.filter(function (p) {
    return p.history && p.history.length > 0;
  }).length;
  var usedCount = data.prompts.filter(function (p) {
    return p.usageCount > 0 || p.lastUsedAt;
  }).length;

  var html = "";
  html += _msSetHead(
    "存储占用",
    "数据全部保存在酒馆的扩展设置里，超过 2 MB 建议清理版本历史",
  );
  html += _msSetRow({
    plain: true,
    icon: "fa-database",
    title: "当前数据体积",
    desc:
      data.prompts.length +
      " 条剧场 · " +
      data.groups.length +
      " 个分组 · " +
      (data.settings.definedTags || []).length +
      " 个标签",
    value:
      sizeInfo.kb > 2048
        ? '<span style="color:var(--ms-danger);">' + esc(sizeInfo.text) + "</span>"
        : esc(sizeInfo.text),
  });

  html += _msSetHead("备份", "导出的 JSON 可以在其它设备或酒馆账号里导入还原");
  html += _msSetRow({
    act: "export",
    icon: "fa-file-export",
    title: "导出数据",
    desc: "自由勾选要导出的剧场、分组与标签",
  });
  html += _msSetRow({
    act: "import",
    icon: "fa-file-import",
    title: "导入数据",
    desc: "从本地 JSON 文件导入，可选择合并或覆盖",
  });

  html += _msSetHead(
    "版本历史",
    "每条剧场最多保留 5 个历史版本，是体积增长的主要来源",
  );
  html += _msSetRow({
    icon: "fa-bell",
    title: "历史过多时提醒",
    desc: "超过 30 条时在列表底栏标红提示",
    sw: "ms-history-warn-toggle",
    on: !!data.settings.historyWarnEnabled,
  });
  html += _msSetRow({
    nav: "history-list",
    icon: "fa-clock-rotate-left",
    title: "有历史记录的剧场",
    value: histPrompts + " 条 / " + histTotal + " 版",
  });
  html += _msSetRow({
    act: "clear-history",
    icon: "fa-broom",
    title: "清空全部版本历史",
    desc: "只删历史版本，剧场正文不受影响",
    danger: true,
  });

  html += _msSetHead(
    "角色数据",
    "角色卡被删除或改名后，原有绑定会变成失联状态",
  );
  html += _msSetRow({
    nav: "lost-chars",
    icon: "fa-user-slash",
    title: "处理失联角色",
    desc: "重绑到本地现有角色卡，或直接解绑",
  });

  html += _msSetHead("危险操作", "以下操作不可撤销，执行前请务必先导出备份");
  html += _msSetRow({
    act: "reset-usage",
    icon: "fa-arrow-rotate-left",
    title: "重置使用统计",
    desc:
      usedCount > 0
        ? usedCount + " 条剧场的使用次数与最近使用时间将归零"
        : "当前没有需要重置的记录",
    danger: true,
  });
  html += _msSetRow({
    act: "wipe-all",
    icon: "fa-skull-crossbones",
    title: "彻底清空所有本地数据",
    desc: "剧场、分组、标签、订阅、生日、设置全部删除",
    danger: true,
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("click.ms", "[data-set-act='export']", function () {
    navigateTo({ name: "export" });
  });
  $body.on("click.ms", "[data-set-act='import']", function () {
    $p.find("#ms-file-input").trigger("click");
  });
  $body.on("change.ms", "#ms-history-warn-toggle", function () {
    data.settings.historyWarnEnabled = $(this).is(":checked");
    saveData();
  });
  $body.on("click.ms", "[data-set-act='clear-history']", function () {
    if (histTotal === 0) {
      toast("info", "没有需要清空的历史");
      return;
    }
    msConfirm(
      "确定清空所有剧场的版本历史吗？\n\n共 " +
        histTotal +
        " 条历史记录将被删除\n此操作不可撤销",
      { title: "清空全部版本历史", dangerous: true, okText: "清空" },
    ).then(function (ok) {
      if (!ok) return;
      data.prompts.forEach(function (p) {
        p.history = [];
      });
      saveData();
      toast("success", "已清空全部版本历史（" + histTotal + " 条）");
      renderSettingsData();
    });
  });
  $body.on("click.ms", "[data-set-act='reset-usage']", function () {
    if (usedCount === 0) {
      toast("info", "没有需要重置的记录");
      return;
    }
    msConfirm(
      "确定重置所有使用统计吗？\n\n" +
        usedCount +
        " 条剧场的使用次数和最近使用时间将归零\n此操作不可撤销",
      { title: "重置使用统计", dangerous: true, okText: "重置" },
    ).then(function (ok) {
      if (!ok) return;
      data.prompts.forEach(function (p) {
        p.usageCount = 0;
        p.lastUsedAt = null;
      });
      saveData();
      toast("success", "已重置（" + usedCount + " 条）");
      renderSettingsData();
    });
  });
  $body.on("click.ms", "[data-set-act='wipe-all']", function () {
    var stats = [
      data.prompts.length + " 条剧场",
      data.groups.length + " 个分组",
      (data.settings.definedTags || []).length + " 个标签",
      data.quickPhrases.length + " 个快捷短语",
      data.subscriptions.length + " 个订阅",
      Object.keys(data.settings.charBirthdays || {}).length + " 个生日记录",
    ]
      .filter(function (s) {
        return parseInt(s) > 0;
      })
      .join("、");
    msPrompt(
      "这会清空小剧场的所有本地数据，包括：\n" +
        "· 剧场内容、分组、标签、订阅\n" +
        "· 快捷短语、版本历史、使用统计\n" +
        "· 角色生日、祝福、打卡记录\n" +
        "· 所有界面设置和面板位置\n\n" +
        (stats ? "当前有：" + stats + "\n\n" : "") +
        "此操作无法撤销，强烈建议先导出备份。\n\n" +
        "如确认继续，请在下方输入「删除全部」四个字：",
      {
        title: "彻底清空所有数据",
        icon: "fa-skull-crossbones",
        placeholder: "请输入「删除全部」",
        okText: "我已备份，立即清空",
        validate: function (v) {
          if ((v || "").trim() !== "删除全部")
            return "输入不匹配，请准确输入「删除全部」四个字";
          return null;
        },
      },
    ).then(function (input) {
      if (input === null) return;
      try {
        if (_saveTimer) {
          clearTimeout(_saveTimer);
          _saveTimer = null;
        }
        _savePending = false;
        var ctx = getCtx();
        if (ctx) {
          delete ctx.s[STORAGE_KEY];
          ctx.save();
        }
        toast("success", "已清空所有数据，3 秒后刷新页面...");
        setTimeout(function () {
          try {
            if (typeof triggerSlash === "function") {
              triggerSlash("/reload-page");
            } else {
              window.location.reload();
            }
          } catch (e) {
            try {
              window.location.reload();
            } catch (e2) {}
          }
        }, 3000);
      } catch (e) {
        toast("error", "清空失败: " + e.message);
      }
    });
  });
}

function renderSettingsTransfer() {
  var $p = setupPage("格式转换台");
  var html = "";

  html += _msSetHead(
    "自动直连",
    "在酒馆页面内全屏打开转换台，自动同步本地分组、文件夹与标签；转换台内还可直接多选读取本地世界书和聊天补全预设",
  );
  html += _msSetRow({
    act: "ts-open",
    icon: "fa-arrow-up-right-from-square",
    title: "打开转换台",
    desc: "设置完成后可直接推送回本面板",
  });

  html += _msSetHead(
    "手动交换",
    "无法自动直连，或想单独在浏览器里打开网页时使用；快照仅供转换台读取，不会修改本地数据",
  );
  html += _msSetRow({
    act: "ts-copy",
    icon: "fa-copy",
    title: "复制分组标签快照",
    desc: "复制后在转换台中粘贴",
  });
  html += _msSetRow({
    act: "ts-paste",
    icon: "fa-paste",
    title: "从剪贴板接收推送",
    desc: "与本地完全重复的剧场会自动跳过",
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("click.ms", "[data-set-act='ts-open']", function () {
    openTransferStation();
  });
  $body.on("click.ms", "[data-set-act='ts-copy']", function () {
    var snap;
    try {
      snap = buildTransferSnapshot();
    } catch (e) {
      toast("error", "生成快照失败: " + e.message);
      return;
    }
    copyToClipboard(JSON.stringify(snap))
      .then(function () {
        toast(
          "success",
          "已复制快照：" +
            snap.groups.length +
            " 个分组 · " +
            snap.tags.length +
            " 个标签",
        );
      })
      .catch(function () {
        toast("error", "复制失败，请检查浏览器剪贴板权限");
      });
  });
  $body.on("click.ms", "[data-set-act='ts-paste']", function () {
    receiveTransferFromPaste();
  });
}

function renderSettingsAbout() {
  var $p = setupPage("关于与更新");
  var html = "";

  html += _msSetHead("版本", "");
  html += _msSetRow({
    plain: true,
    icon: "fa-masks-theater",
    title: "小剧场",
    value: "v" + SCRIPT_VERSION,
  });

  html += _msSetHead("更新", "刷新浏览器缓存并重载脚本，获取最新版本");
  html += _msSetRow({
    act: "check-update",
    id: "ms-update-script",
    icon: "fa-arrows-rotate",
    title: "检查脚本更新",
    desc: "完成后会自动刷新页面",
  });
  html += _msSetRow({
    act: "changelog",
    id: "ms-view-changelog",
    icon: "fa-clipboard-list",
    title: "查看更新日志",
  });

  html += _msSetHead(
    "使用说明",
    "重置「使用指南」分组下的内置文档，并立即从云端拉取最新内容",
  );
  if (getPrompt("_builtin_guide")) {
    html += _msSetRow({
      act: "open-guide",
      icon: "fa-book-open",
      title: "打开使用说明",
    });
  }
  html += _msSetRow({
    act: "regen-guide",
    icon: "fa-book",
    title: "重新生成使用说明",
    desc: "会重置预览示例、使用说明、注入 / 订阅 / 角色绑定指南",
  });

  $p.find("#ms-body").html('<div class="ms-page-minh">' + html + "</div>");
  $p.find("#ms-footer").hide();
  bindAllEvents();
  _msBindSetRows($p);

  var $body = $p.find("#ms-body");
  $body.on("click.ms", "[data-set-act='open-guide']", function () {
    if (getPrompt("_builtin_guide")) {
      navigateTo({ name: "preview", promptId: "_builtin_guide" });
    } else {
      toast("warning", "找不到使用说明，可先重新生成");
    }
  });
  $body.on("click.ms", "[data-set-act='check-update']", async function () {
    var $row = $(this);
    var $title = $row.find(".ms-set-title");
    var $desc = $row.find(".ms-set-desc");
    if ($row.data("ms-busy")) return;
    $row.data("ms-busy", true);
    $title.html('<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>正在刷新缓存...');
    try {
      await msFetch(
        "https://cdn.jsdelivr.net/gh/Sanjs333/stage/stage.js",
        { cache: "reload" },
        15000,
      );
      $desc.text("缓存已刷新，即将重载页面");
      toast("success", "缓存已刷新，即将刷新页面");
      setTimeout(function () {
        try {
          triggerSlash("/reload-page");
        } catch (e2) {
          window.location.reload();
        }
      }, 2000);
    } catch (e) {
      if (isShutdownFetchError(e)) return;
      toast("error", "更新失败: " + e.message);
      $row.data("ms-busy", false);
      $title.text("检查脚本更新");
      $desc.text("完成后会自动刷新页面");
    }
  });
  $body.on("click.ms", "[data-set-act='changelog']", async function () {
    var $row = $(this);
    var $title = $row.find(".ms-set-title");
    if ($row.data("ms-busy")) return;
    $row.data("ms-busy", true);
    $title.html('<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>加载中...');
    try {
      var content = await fetchRemoteGuide(GUIDE_REMOTE_URLS.changelog);
      if (!content) {
        toast("error", "更新日志加载失败，请检查网络");
      } else {
        showModal({
          title: "小剧场 更新日志",
          iconType: "info",
          icon: "fa-clipboard-list",
          modalStyle:
            "min-width:400px;max-width:94vw;width:600px;max-height:80vh;",
          body:
            '<div class="ms-preview-content" style="padding:0;">' +
            renderMd(content) +
            "</div>",
          buttons: [
            { text: "关闭", cls: "primary", primary: true, value: true },
          ],
        });
      }
    } catch (e) {
      toast("error", "加载失败: " + e.message);
    }
    $row.data("ms-busy", false);
    $title.text("查看更新日志");
  });
  $body.on("click.ms", "[data-set-act='regen-guide']", function () {
    msConfirm(
      "将重置「使用指南」分组下的 5 个内置文档（预览示例、使用说明、注入功能指南、订阅功能指南、角色绑定指南），并立即从云端拉取最新内容，确定吗？",
      { title: "重新生成使用说明", okText: "生成" },
    ).then(async function (ok) {
      if (!ok) return;
      createBuiltinGuide();
      toast("info", "正在从云端拉取最新内容...");
      try {
        var allDone = await updateBuiltinGuidesFromRemote(true);
        if (allDone) {
          toast("success", "使用说明已全部更新到最新版");
        } else {
          toast(
            "warning",
            "部分指南拉取失败，下次打开面板会自动重试失败的部分",
          );
        }
      } catch (e) {
        toast("error", "拉取失败：" + e.message);
      }
      renderSettingsAbout();
    });
  });
}