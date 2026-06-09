function renderSettings() {
  const $p = setupPage("设置");
  $p.find("#ms-body").html(
    `<div class="ms-form"><div class="ms-field"><label>默认作者署名</label><input type="text" id="ms-default-author" placeholder="新建时自动填入" value="${esc(data.settings.defaultAuthor || "")}"></div><div class="ms-section-label">注入设置</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-inject-enabled-toggle" ${data.settings.stageInjectEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">启用注入功能</span></div><div style="padding:4px 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>选中剧场后，内容会随下一次发送注入到AI提示词中</div><div id="ms-inject-details" style="${data.settings.stageInjectEnabled ? "" : "display:none;"}"><div class="ms-inject-settings-row"><label class="ms-inject-radio${data.settings.stageInjectMode === "depth" ? " active" : ""}" data-mode="depth"><input type="radio" name="ms-inject-mode" value="depth" ${data.settings.stageInjectMode === "depth" ? "checked" : ""}><i class="fa-solid fa-layer-group" style="margin-right:3px;font-size:11px;"></i>深度注入</label><label class="ms-inject-radio${data.settings.stageInjectMode === "macro" ? " active" : ""}" data-mode="macro"><input type="radio" name="ms-inject-mode" value="macro" ${data.settings.stageInjectMode === "macro" ? "checked" : ""}><i class="fa-solid fa-code" style="margin-right:3px;font-size:11px;"></i>自定义宏 {{stage}}</label></div><div class="ms-macro-info">
  <div class="ms-macro-info-title"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px;color:var(--ms-accent);"></i>可用宏</div>
  
  <div style="font-size:10px;color:var(--ms-accent);font-weight:600;margin:4px 0 2px;opacity:0.85;">全局宏（预设、世界书、聊天历史等任何地方都能用）</div>
  <div><code>{\u200B{stage}}</code><span class="ms-macro-desc">剧场原始内容</span></div>
  <div><code>{\u200B{stage_title}}</code><span class="ms-macro-desc">剧场标题</span></div>
  <div><code>{\u200B{stage_prompt}}</code><span class="ms-macro-desc">前缀+剧场内容的完整注入体</span></div>
  
  <div style="font-size:10px;color:var(--ms-accent);font-weight:600;margin:6px 0 2px;opacity:0.85;">脚本宏（仅在「前缀指令」「多条外壳模板」框里有效，写进预设无效）</div>
  <div><code>{\u200B{stages}}</code><span class="ms-macro-desc">多条任务合并插入</span></div>
  <div><code>{\u200B{stage_count}}</code><span class="ms-macro-desc">剧场总数</span></div>
  <div><code>{\u200B{stage_tasks}}</code><span class="ms-macro-desc">所有任务块拼接</span></div>
  
  <div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:6px;border-top:1px dashed rgba(255,255,255,0.08);padding-top:6px;">
    ⚠️ <code style="font-style:normal;">{\u200B{stage}}</code> 与 <code style="font-style:normal;">{\u200B{stages}}</code> 的多任务行为不同，<a href="#" id="ms-goto-inject-guide" style="color:var(--ms-accent);cursor:pointer;">查看使用说明</a>
  </div>
</div><div id="ms-depth-opts" style="${data.settings.stageInjectMode === "depth" ? "" : "display:none;"}padding:0 14px;"><div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>注入深度</label><input type="number" id="ms-inject-depth" min="0" max="999" value="${data.settings.stageInjectDepth || 0}" style="width:100%;"></div><div class="ms-field" style="flex:1;"><label>消息角色</label><select id="ms-inject-role" style="width:100%;"><option value="system"${data.settings.stageInjectRole === "system" ? " selected" : ""}>System</option><option value="user"${data.settings.stageInjectRole === "user" ? " selected" : ""}>User</option><option value="assistant"${data.settings.stageInjectRole === "assistant" ? " selected" : ""}>Assistant</option></select></div></div></div><div class="ms-field" style="padding:6px 14px 0;"><label>默认前缀指令 <span style="font-weight:350;opacity:0.5;">(用 {\u200B{stage}} 标记剧场插入位置，不写则拼接在末尾)</span><i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-default-prefix" data-fs-title="编辑默认前缀指令" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i></label><textarea id="ms-default-prefix" style="min-height:120px;resize:vertical;" placeholder="例：在正文最后输出以下剧场内容...">${esc(data.settings.defaultStagePrefix || "")}</textarea></div><div class="ms-field" style="padding:6px 14px 0;"><label>多条外壳模板 <span style="font-weight:350;opacity:0.5;">(选多条剧场时的整体结构，用 {\u200B{stage_count}} 表示数量，{\u200B{stage_tasks}} 表示所有任务块)</span> <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-multi-prefix" data-fs-title="编辑多条外壳模板" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i></label><textarea id="ms-multi-prefix" style="min-height:80px;resize:vertical;" placeholder="留空使用内置默认模板">${esc(data.settings.multiStagePrefix || "")}</textarea><div style="padding:4px 2px;font-size:10px;color:var(--ms-danger);line-height:1.5;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:3px;"></i>多条外壳模板中必须包含 {\u200B{stage_tasks}}，否则会自动回退使用内置默认模板</div></div><div class="ms-section-label" style="margin-top:6px;">生成后行为</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-clear-after-gen-toggle" ${data.settings.clearStageAfterGeneration ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">生成完成后自动清除选中的注入</span></div><div style="padding:4px 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>开启后每次成功生成会自动取消已选注入；API 报错、空回复或用户中止时不会清除，方便直接重试</div><div class="ms-section-label" style="margin-top:6px;">随机注入</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-random-toggle" ${data.settings.randomInject && data.settings.randomInject.enabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">没有手动选中时，自动从随机池中抽取</span></div><div id="ms-random-multi-wrap" style="${data.settings.randomInject && data.settings.randomInject.enabled ? "" : "display:none;"}"><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-random-multi-toggle" ${data.settings.randomInject && data.settings.randomInject.multiEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">随机抽取多条剧场</span></div><div id="ms-random-multi-count-wrap" style="${data.settings.randomInject && data.settings.randomInject.multiEnabled ? "" : "display:none;"}padding:4px 14px;"><div class="ms-field"><label>每次随机抽取的数量</label><div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-random-multi-count" min="1" max="10" step="1" value="${(data.settings.randomInject && data.settings.randomInject.multiCount) || 2}" style="width:80px;"><span style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);">条（建议 2-5 条，过多会污染上下文）</span></div></div></div></div></div><button class="ms-tbtn" id="ms-go-random-pool" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-sliders"></i> 管理随机池</button><button class="ms-tbtn" id="ms-go-qp" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-bolt"></i> 管理快捷短语 (${data.quickPhrases.length})</button><button class="ms-tbtn" id="ms-go-stats" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-chart-bar"></i> 使用统计</button><div class="ms-section-label">订阅设置</div><div class="ms-field"><label>自动检查间隔 <span style="font-weight:350;opacity:0.5;">(打开面板时，超过此时间未检查的订阅会自动静默检查)</span></label><div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-auto-check-interval" min="0" max="168" step="1" value="${data.settings.autoCheckInterval || 6}" style="width:80px;"><span style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);">小时（设为 0 关闭自动检查）</span></div></div><button class="ms-tbtn" id="ms-go-subs" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-rss"></i> 订阅管理 (${data.subscriptions.length})</button><div class="ms-section-label">界面自定义</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-ui-custom-toggle" ${data.settings.uiCustomEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">启用自定义字号和面板尺寸</span></div><div id="ms-ui-custom-details" style="${data.settings.uiCustomEnabled ? "" : "display:none;"}padding:4px 14px;"><div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>字号 (px)</label><input type="number" id="ms-ui-font-size" min="10" max="24" value="${data.settings.uiFontSize}"></div><div class="ms-field" style="flex:1;"><label>面板宽度 (px)</label><input type="number" id="ms-ui-panel-width" min="320" max="1400" value="${data.settings.uiPanelWidth}"></div><div class="ms-field" style="flex:1;"><label>最大高度 (vh)</label><input type="number" id="ms-ui-panel-height" min="40" max="100" value="${data.settings.uiPanelHeight}"></div></div></div><div class="ms-section-label">主题适配</div><button class="ms-tbtn" id="ms-tb-open" style="width:100%;text-align:center;"><i class="fa-solid fa-palette"></i> 主题绑定 (${Object.keys(data.settings.themeBindings || {}).length})</button><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);padding:4px 14px;line-height:1.5;">为抓取背景失败、撞色严重的美化主题指定面板背景和文字色。</div><div class="ms-section-label">使用说明</div><button class="ms-tbtn" id="ms-regen-guide" style="width:100%;text-align:center;"><i class="fa-solid fa-book"></i> 重新生成使用说明</button><div class="ms-section-label">脚本更新 <span style="font-weight:400;opacity:0.6;text-transform:none;letter-spacing:0;margin-left:4px;">当前 v${SCRIPT_VERSION}</span></div><button class="ms-tbtn" id="ms-update-script" style="width:100%;text-align:center;"><i class="fa-solid fa-arrows-rotate"></i> 检查脚本更新</button>
<button class="ms-tbtn" id="ms-view-changelog" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-clipboard-list"></i> 查看更新日志</button><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);padding:4px 14px;line-height:1.5;">刷新浏览器缓存并重载脚本，获取最新版本。</div><div class="ms-section-label">数据管理</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-history-warn-toggle" ${data.settings.historyWarnEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">历史超过30条时在底栏变红提醒</span></div><button class="ms-tbtn" id="ms-go-history-list" style="width:100%;text-align:center;margin-bottom:6px;"><i class="fa-solid fa-clock-rotate-left"></i> 查看有历史记录的剧场(${
      data.prompts.filter(function (p) {
        return p.history && p.history.length > 0;
      }).length
    } 条)</button><button class="ms-tbtn" id="ms-clean-lost-chars" style="width:100%;text-align:center;margin-bottom:6px;"><i class="fa-solid fa-user-slash"></i> 处理失联角色（重绑/解绑）</button><button class="ms-tbtn danger" id="ms-clear-all-history" style="width:100%;text-align:center;"><i class="fa-solid fa-broom"></i> 清空全部版本历史</button><button class="ms-tbtn danger" id="ms-wipe-all-data" style="width:100%;text-align:center;margin-top:6px;background:rgba(var(--ms-danger-rgb),0.12);border-color:var(--ms-danger);"><i class="fa-solid fa-skull-crossbones"></i> 彻底清空所有本地数据</button><div style="padding:6px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);" id="ms-data-size-info"></div></div>`,
  );
  $p.find("#ms-footer").hide();
  bindAllEvents();
  try {
    var sizeKB = Math.round(
      JSON.stringify({
        groups: data.groups,
        prompts: data.prompts,
        quickPhrases: data.quickPhrases,
        subscriptions: data.subscriptions,
        settings: data.settings,
      }).length / 1024,
    );
    var sizeText =
      sizeKB < 1024 ? sizeKB + " KB" : (sizeKB / 1024).toFixed(2) + " MB";
    var warnH =
      sizeKB > 2048
        ? ' <span style="color:var(--ms-danger);">(偏大，建议清理历史)</span>'
        : "";
    $p.find("#ms-data-size-info").html(
      '<i class="fa-solid fa-database" style="margin-right:4px;"></i>当前数据体积：<strong>' +
        sizeText +
        "</strong>" +
        warnH,
    );
  } catch (e) {}
  $p.find("#ms-body").on("click.ms", "#ms-goto-inject-guide", function (e) {
    e.preventDefault();
    if (getPrompt("_builtin_inject_guide")) {
      navigateTo({ name: "preview", promptId: "_builtin_inject_guide" });
    } else {
      toast("warning", "找不到注入功能指南，可在设置里重新生成使用说明");
    }
  });
  $p.find("#ms-body").on("change.ms", "#ms-inject-enabled-toggle", function () {
    data.settings.stageInjectEnabled = $(this).is(":checked");
    saveData();
    updateInjectIndicator();
    $p.find("#ms-inject-details").toggle($(this).is(":checked"));
  });
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
  $p.find("#ms-body").on(
    "change.ms",
    "#ms-clear-after-gen-toggle",
    function () {
      data.settings.clearStageAfterGeneration = $(this).is(":checked");
      saveData();
    },
  );

  $p.find("#ms-body").on("change.ms", "#ms-random-toggle", function () {
    if (!data.settings.randomInject)
      data.settings.randomInject = {
        enabled: false,
        excludedGroupIds: [],
        excludedSeries: [],
        excludedPromptIds: [],
        multiEnabled: false,
        multiCount: 2,
      };
    data.settings.randomInject.enabled = $(this).is(":checked");
    saveData();
    updateInjectIndicator();
    $p.find("#ms-random-multi-wrap").toggle($(this).is(":checked"));
  });
  $p.find("#ms-body").on("change.ms", "#ms-random-multi-toggle", function () {
    if (!data.settings.randomInject) return;
    data.settings.randomInject.multiEnabled = $(this).is(":checked");
    saveData();
    $p.find("#ms-random-multi-count-wrap").toggle($(this).is(":checked"));
  });
  $p.find("#ms-body").on("input.ms", "#ms-random-multi-count", function () {
    var val = parseInt($(this).val());
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10) val = 10;
    if (!data.settings.randomInject) return;
    data.settings.randomInject.multiCount = val;
    saveData();
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
  $p.find("#ms-body").on("change.ms", "#ms-ui-custom-toggle", function () {
    data.settings.uiCustomEnabled = $(this).is(":checked");
    saveData();
    $p.find("#ms-ui-custom-details").toggle($(this).is(":checked"));
    applyUICustomization();
  });
  $p.find("#ms-body").on("input.ms", "#ms-ui-font-size", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 10 && v <= 24) {
      data.settings.uiFontSize = v;
      saveData();
      applyUICustomization();
    }
  });
  $p.find("#ms-body").on("input.ms", "#ms-ui-panel-width", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 320 && v <= 1400) {
      data.settings.uiPanelWidth = v;
      saveData();
      applyUICustomization();
    }
  });
  $p.find("#ms-body").on("input.ms", "#ms-ui-panel-height", function () {
    var v = parseInt($(this).val());
    if (!isNaN(v) && v >= 40 && v <= 100) {
      data.settings.uiPanelHeight = v;
      saveData();
      applyUICustomization();
    }
  });
  $p.find("#ms-body").on("click.ms", "#ms-tb-open", function () {
    navigateTo({ name: "theme-binding" });
  });
  $p.find("#ms-body").on("click.ms", "#ms-regen-guide", function () {
    msConfirm(
      "将重置「使用指南」分组下的5个内置文档（预览示例、使用说明、注入功能指南、订阅功能指南、角色绑定指南、），并立即从云端拉取最新内容，确定吗？",
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
    });
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
  $p.find("#ms-body").on("click.ms", "#ms-view-changelog", async function () {
    var $btn = $(this);
    var origHtml = $btn.html();
    $btn
      .prop("disabled", true)
      .html('<i class="fa-solid fa-spinner fa-spin"></i> 加载中...');
    try {
      var content = await fetchRemoteGuide(GUIDE_REMOTE_URLS.changelog);
      if (!content) {
        toast("error", "更新日志加载失败，请检查网络");
        $btn.prop("disabled", false).html(origHtml);
        return;
      }
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
        buttons: [{ text: "关闭", cls: "primary", primary: true, value: true }],
      });
    } catch (e) {
      toast("error", "加载失败: " + e.message);
    }
    $btn.prop("disabled", false).html(origHtml);
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
    msConfirm(
      "确定清空所有剧场的版本历史吗？\n\n共 " +
        total +
        " 条历史记录将被删除\n此操作不可撤销",
      { title: "清空全部版本历史", dangerous: true, okText: "清空" },
    ).then(function (ok) {
      if (!ok) return;
      data.prompts.forEach(function (p) {
        p.history = [];
      });
      saveData();
      toast("success", "已清空全部版本历史（" + total + " 条）");
    });
  });
  $p.find("#ms-body").on("click.ms", "#ms-wipe-all-data", function () {
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
      "⚠️ 这会清空小剧场的所有本地数据，包括：\n" +
        "· 剧场内容、分组、标签、订阅\n" +
        "· 快捷短语、版本历史、使用统计\n" +
        "· 角色生日、祝福、打卡记录\n" +
        "· 所有界面设置和面板位置\n\n" +
        (stats ? "当前有：" + stats + "\n\n" : "") +
        "⚠️⚠️⚠️ 此操作无法撤销，强烈建议先导出备份！\n\n" +
        "如确认继续，请在下方输入「删除全部」四个字：",
      {
        title: "⚠️ 彻底清空所有数据",
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

  $p.find("#ms-body").on("click.ms", "#ms-clean-lost-chars", function () {
    navigateTo({ name: "lost-chars" });
  });

  $p.find("#ms-body").on("click.ms", "#ms-reset-usage", function () {
    var usedCount = data.prompts.filter(function (p) {
      return p.usageCount > 0 || p.lastUsedAt;
    }).length;
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
    });
  });
}
