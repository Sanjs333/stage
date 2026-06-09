async function autoCheckSubscriptions() {
  if (data.subscriptions.length === 0) return;
  if (autoCheckSubscriptions._running) return;
  var interval = (data.settings.autoCheckInterval || 6) * 3600000;
  if (interval <= 0) return;
  var now = Date.now();
  var needsCheck = data.subscriptions.some(function (s) {
    return !s.lastChecked || now - s.lastChecked > interval;
  });
  if (!needsCheck) return;
  autoCheckSubscriptions._running = true;
  try {
    await checkAllSubscriptions(true);
  } finally {
    autoCheckSubscriptions._running = false;
  }
}

function renderHistoryList() {
  const $p = setupPage("有历史记录的剧场");
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
      msConfirm("确定清空「" + pr.title + "」的所有版本历史吗？", {
        title: "清空历史",
        dangerous: true,
        okText: "清空",
      }).then(function (ok) {
        if (!ok) return;
        pr.history = [];
        saveData();
        toast("success", "已清空");
        renderHistoryList();
      });
    },
  );
  $p.find("#ms-footer").on(
    "click.ms",
    "[data-action='clear-all-h']",
    function () {
      msConfirm(
        "确定清空所有剧场的版本历史吗？\n\n共 " + totalH + " 条历史记录",
        { title: "全部清空", dangerous: true, okText: "清空" },
      ).then(function (ok) {
        if (!ok) return;
        data.prompts.forEach(function (p) {
          p.history = [];
        });
        saveData();
        toast("success", "已全部清空");
        renderHistoryList();
      });
    },
  );
}

function renderThemeBinding() {
  const $p = setupPage("主题绑定", "美化主题绑定");
  var allThemes = getAllThemeNames();
  var curTheme = getCurrentThemeName();
  if (!data.settings.themeBindings) data.settings.themeBindings = {};

  function buildBody() {
    var bindings = data.settings.themeBindings;
    var boundNames = Object.keys(bindings);
    var html = "";
    html +=
      '<div style="padding:10px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;"><i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>若主题背景缺失或文字不易辨认，可在此手动指定其面板背景与文字颜色。设置后将覆盖自动抓取，仅对该主题生效。</div>';
    html +=
      '<div style="padding:8px 14px;"><button class="ms-tbtn" id="ms-tb-add" style="width:100%;text-align:center;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>添加主题绑定</button></div>';
    if (curTheme) {
      html +=
        '<div style="padding:0 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);">当前主题：<strong style="color:var(--ms-accent);">' +
        esc(curTheme) +
        "</strong>" +
        (bindings[curTheme] ? " · 已绑定" : " · 未绑定") +
        "</div>";
    }
    if (boundNames.length === 0) {
      html +=
        '<div class="ms-empty"><i class="fa-solid fa-palette"></i>还没有绑定任何主题</div>';
    } else {
      html += '<div class="ms-section-label">已绑定主题</div>';
      boundNames.forEach(function (name) {
        var b = bindings[name];
        var bgDesc =
          b.bgMode === "image"
            ? "图片背景"
            : b.bgMode === "color"
              ? "纯色背景"
              : "默认背景";
        var swatch = "";
        if (b.bgMode === "color" && b.bgColor) {
          swatch =
            '<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:' +
            b.bgColor +
            ';vertical-align:middle;margin-right:4px;border:1px solid rgba(255,255,255,0.2);"></span>';
        } else if (b.bgMode === "image" && b.bgImage) {
          swatch =
            '<img src="' +
            escAttr(b.bgImage) +
            '" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">';
        }
        var textPart = b.textColor
          ? ' · <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' +
            b.textColor +
            ';vertical-align:middle;margin-right:3px;border:1px solid rgba(255,255,255,0.2);"></span>文字色'
          : "";
        var isCur = name === curTheme;
        html +=
          '<div class="ms-gitem"' +
          (isCur
            ? ' style="background:rgba(var(--ms-accent-rgb),0.08);"'
            : "") +
          '><span class="ms-gitem-name">' +
          esc(name) +
          (isCur
            ? ' <span style="font-size:9px;color:var(--ms-accent);">(当前)</span>'
            : "") +
          '<br><span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">' +
          swatch +
          bgDesc +
          textPart +
          "</span></span>" +
          '<button class="ms-gitem-btn" data-tb-edit="' +
          escAttr(name) +
          '"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="ms-gitem-btn danger" data-tb-del="' +
          escAttr(name) +
          '"><i class="fa-solid fa-trash"></i></button></div>';
      });
    }
    return html;
  }

  function refresh() {
    $p.find("#ms-body").html(buildBody());
  }

  function showThemePicker() {
    allThemes = getAllThemeNames();
    curTheme = getCurrentThemeName();
    if (allThemes.length === 0) {
      toast("warning", "没有读取到美化主题列表");
      return;
    }
    function buildList(kw) {
      var lkw = (kw || "").trim().toLowerCase();
      var matched = allThemes.filter(function (n) {
        return !lkw || n.toLowerCase().indexOf(lkw) >= 0;
      });
      if (matched.length === 0)
        return '<div style="padding:20px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的主题</div>';
      var html =
        '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
      matched.forEach(function (n) {
        var bound = data.settings.themeBindings[n]
          ? ' <i class="fa-solid fa-check" style="color:var(--ms-accent);font-size:10px;margin-left:4px;"></i>'
          : "";
        html +=
          '<div class="ms-modal-list-item" data-theme-name="' +
          escAttr(n) +
          '"><div class="ms-modal-list-icon" style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);"><i class="fa-solid fa-palette"></i></div><div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
          esc(n) +
          bound +
          "</div></div></div>";
      });
      html += "</div>";
      return html;
    }
    showModal({
      title: "选择要绑定的主题",
      iconType: "info",
      icon: "fa-palette",
      modalStyle: "min-width:340px;max-width:90vw;width:420px;",
      body: function () {
        return (
          '<input type="text" class="ms-modal-search" placeholder="搜索主题名..." id="ms-tb-search"><div id="ms-tb-list">' +
          buildList("") +
          "</div>"
        );
      },
      buttons: [{ text: "取消", value: null }],
      cancelValue: null,
      onShow: function ($overlay, close) {
        $overlay.find("#ms-tb-search").focus();
        $overlay.on("input", "#ms-tb-search", function () {
          $overlay.find("#ms-tb-list").html(buildList($(this).val()));
        });
        $overlay.on("click", ".ms-modal-list-item", function () {
          var name = $(this).attr("data-theme-name");
          if (!name) return;
          close("done");
          setTimeout(function () {
            showThemeBindingEditor(name);
          }, 200);
        });
      },
    });
  }

  function showThemeBindingEditor(themeName) {
    var existing = data.settings.themeBindings[themeName] || {};
    var work = {
      bgMode: existing.bgMode || "default",
      bgImage: existing.bgImage || "",
      bgColor: existing.bgColor || "#1a1a2e",
      textColor: existing.textColor || "",
      _textEnabled: !!existing.textColor,
    };

    function captureInputs($overlay) {
      if (work.bgMode === "image") {
        work.bgImage = ($overlay.find("#ms-tb-bgimg").val() || "").trim();
      } else if (work.bgMode === "color") {
        var v = $overlay.find("#ms-tb-bgcolor").val();
        if (v) work.bgColor = v;
      }
      if (work._textEnabled) {
        var tv = $overlay.find("#ms-tb-textcolor").val();
        if (tv) work.textColor = tv;
      }
    }

    function buildEditBody() {
      var html = "";
      html +=
        '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:10px;">绑定主题：<strong style="color:var(--ms-accent);">' +
        esc(themeName) +
        "</strong></div>";
      html +=
        '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:4px;display:block;">面板背景</label>';
      html += '<div class="ms-tag-row" style="gap:6px;margin-bottom:8px;">';
      [
        ["default", "跟随脚本默认", "fa-wand-magic-sparkles"],
        ["color", "纯色背景", "fa-fill-drip"],
        ["image", "图片URL", "fa-image"],
      ].forEach(function (m) {
        var active = work.bgMode === m[0];
        html +=
          '<span class="ms-tag-toggle' +
          (active ? " active" : "") +
          '" data-tb-bgmode="' +
          m[0] +
          '" style="' +
          (active ? "background:var(--ms-accent);color:#fff;" : "") +
          '"><i class="fa-solid ' +
          m[2] +
          '" style="margin-right:3px;font-size:10px;"></i>' +
          m[1] +
          "</span>";
      });
      html += "</div>";
      if (work.bgMode === "color") {
        html +=
          '<input type="color" id="ms-tb-bgcolor" value="' +
          escAttr(work.bgColor) +
          '" style="width:100%;height:36px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:transparent;cursor:pointer;margin-bottom:8px;">';
      } else if (work.bgMode === "image") {
        html +=
          '<input class="ms-modal-input" id="ms-tb-bgimg" type="text" placeholder="粘贴图片直链 URL（图床地址）..." value="' +
          escAttr(work.bgImage) +
          '" style="margin-top:0;">';
        if (work.bgImage) {
          html +=
            '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);"><span>预览：</span><img src="' +
            escAttr(work.bgImage) +
            '" style="width:48px;height:48px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.05);" onerror="this.style.display=\'none\';var s=this.nextElementSibling;if(s)s.style.display=\'inline\';"><span style="display:none;color:var(--ms-danger);">图片加载失败</span></div>';
        }
      }
      html +=
        '<div style="display:flex;align-items:center;gap:8px;margin-top:12px;"><label class="ms-switch"><input type="checkbox" id="ms-tb-text-toggle"' +
        (work._textEnabled ? " checked" : "") +
        '><span class="ms-switch-slider"></span></label><span style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);">自定义文字色</span></div>';
      if (work._textEnabled) {
        html +=
          '<input type="color" id="ms-tb-textcolor" value="' +
          escAttr(work.textColor || "#cccccc") +
          '" style="width:100%;height:36px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:transparent;cursor:pointer;margin-top:6px;">';
      }
      return html;
    }

    function refreshEdit($overlay) {
      captureInputs($overlay);
      $overlay.find(".ms-modal-body").html(buildEditBody());
    }

    var hasExisting = !!data.settings.themeBindings[themeName];
    var btns = [];
    if (hasExisting) {
      btns.push({
        text: "删除绑定",
        cls: "danger",
        action: function () {
          delete data.settings.themeBindings[themeName];
          saveData();
          if (themeName === getCurrentThemeName()) {
            syncThemeBackground();
            syncThemeColors();
          }
          toast("success", "已删除绑定");
          refresh();
          return true;
        },
      });
    }
    btns.push({ text: "取消", value: null });
    btns.push({
      text: "保存",
      cls: "primary",
      primary: true,
      action: function ($overlay) {
        captureInputs($overlay);
        var saved = {
          bgMode: work.bgMode,
          bgImage: work.bgImage || "",
          bgColor: work.bgColor || "#1a1a2e",
          textColor: work._textEnabled ? work.textColor || "#cccccc" : "",
        };
        if (saved.bgMode === "image" && !saved.bgImage) {
          toast("warning", "图片模式下请先粘贴图片 URL");
          return false;
        }
        data.settings.themeBindings[themeName] = saved;
        saveData();
        if (themeName === getCurrentThemeName()) {
          syncThemeBackground();
          syncThemeColors();
        }
        toast("success", "已保存绑定");
        refresh();
        return true;
      },
    });

    showModal({
      title: "编辑主题绑定",
      iconType: "info",
      icon: "fa-palette",
      modalStyle: "min-width:340px;max-width:90vw;width:420px;",
      body: buildEditBody(),
      buttons: btns,
      cancelValue: null,
      onShow: function ($overlay) {
        $overlay.on("click", "[data-tb-bgmode]", function () {
          captureInputs($overlay);
          work.bgMode = $(this).attr("data-tb-bgmode");
          $overlay.find(".ms-modal-body").html(buildEditBody());
        });
        $overlay.on("input", "#ms-tb-bgimg", function () {
          work.bgImage = ($(this).val() || "").trim();
        });
        $overlay.on("change", "#ms-tb-bgimg", function () {
          refreshEdit($overlay);
        });
        $overlay.on("change", "#ms-tb-text-toggle", function () {
          captureInputs($overlay);
          work._textEnabled = $(this).is(":checked");
          $overlay.find(".ms-modal-body").html(buildEditBody());
        });
      },
    });
  }

  refresh();
  bindAllEvents();
  $p.find("#ms-body").on("click.ms", "#ms-tb-add", showThemePicker);
  $p.find("#ms-body").on("click.ms", "[data-tb-edit]", function () {
    showThemeBindingEditor($(this).attr("data-tb-edit"));
  });
  $p.find("#ms-body").on("click.ms", "[data-tb-del]", function () {
    var name = $(this).attr("data-tb-del");
    msConfirm("确定删除「" + name + "」的主题绑定吗？", {
      title: "删除绑定",
      dangerous: true,
      okText: "删除",
    }).then(function (ok) {
      if (!ok) return;
      delete data.settings.themeBindings[name];
      saveData();
      if (name === getCurrentThemeName()) {
        syncThemeBackground();
        syncThemeColors();
      }
      toast("success", "已删除");
      refresh();
    });
  });
}

function renderRandomPool() {
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
  var $p = setupPage("随机池管理", "随机注入池");
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
      var gObj = gid === "_ungrouped" ? null : getGroup(gid);
      var useAvatar =
        gObj &&
        (isIPGroup(gObj) ||
          (gObj.iconMode === "custom" && gObj.iconUrl) ||
          (gObj.iconMode === "char" && gObj.iconCharKey));
      var iconH = useAvatar
        ? buildGroupAvatarHTML(gObj, 22)
        : '<i class="fa-solid fa-folder" style="color:' +
          gColor +
          ';font-size:13px;"></i>';
      var blockH =
        '<div class="ms-rpool-group"><div class="ms-rpool-group-header" data-rpool-gid="' +
        gid +
        '"><input type="checkbox" class="ms-rpool-gcb" data-gid="' +
        gid +
        '"' +
        gChecked +
        ">" +
        iconH +
        '<span style="flex:1;font-size:13px;" class="' +
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
  $p.find("#ms-body").on("compositionend.ms", "#ms-rpool-search", function () {
    this._composing = false;
    _rpoolSearch = $(this).val();
    refreshPool();
  });
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
      var visiblePrompts = data.prompts.filter(matchesRpoolFilter);
      var visibleGroupIds = new Set();
      var visibleSeriesKeys = new Set();
      visiblePrompts.forEach(function (p) {
        var gid = p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
        visibleGroupIds.add(gid);
        var sn = (p.series || "").trim();
        if (sn) visibleSeriesKeys.add(gid + "||" + sn);
      });
      if (!Array.isArray(ri.excludedGroupIds)) ri.excludedGroupIds = [];
      if (!Array.isArray(ri.excludedSeries)) ri.excludedSeries = [];
      if (!Array.isArray(ri.excludedPromptIds)) ri.excludedPromptIds = [];
      visibleGroupIds.forEach(function (gid) {
        if (ri.excludedGroupIds.indexOf(gid) < 0) ri.excludedGroupIds.push(gid);
      });
      visibleSeriesKeys.forEach(function (key) {
        var parts = key.split("||");
        var gid = parts[0],
          sn = parts.slice(1).join("||");
        var exists = ri.excludedSeries.some(function (s) {
          return s.groupId === gid && s.seriesName === sn;
        });
        if (!exists) ri.excludedSeries.push({ groupId: gid, seriesName: sn });
      });
      var visiblePromptIds = visiblePrompts.map(function (p) {
        return p.id;
      });
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

function renderLostChars() {
  var $p = setupPage("处理失联角色");
  var validKeys = new Set();
  try {
    if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
      SillyTavern.characters.forEach(function (c) {
        if (c && c.avatar) validKeys.add(c.avatar);
      });
    }
  } catch (e) {}
  if (validKeys.size === 0) {
    $p.find("#ms-body").html(
      '<div class="ms-empty"><i class="fa-solid fa-circle-exclamation"></i>当前没有读到角色卡列表<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">为了安全起见暂不能处理</span></div>',
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    return;
  }

  var lostMap = {};
  data.prompts.forEach(function (p) {
    if (p.character && !validKeys.has(p.character)) {
      if (!lostMap[p.character])
        lostMap[p.character] = { prompts: [], asMember: [], asIcon: [] };
      lostMap[p.character].prompts.push(p);
    }
  });
  if (data.settings.charBirthdays) {
    Object.keys(data.settings.charBirthdays).forEach(function (k) {
      if (k && !validKeys.has(k)) {
        if (!lostMap[k]) lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
      }
    });
  }

  if (data.settings.charBirthdayMessages) {
    Object.keys(data.settings.charBirthdayMessages).forEach(function (k) {
      if (k && !validKeys.has(k)) {
        if (!lostMap[k]) lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
      }
    });
  }
  data.groups.forEach(function (g) {
    if (Array.isArray(g.charKeys)) {
      g.charKeys.forEach(function (k) {
        if (!validKeys.has(k)) {
          if (!lostMap[k])
            lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
          if (lostMap[k].asMember.indexOf(g.id) < 0)
            lostMap[k].asMember.push(g.id);
        }
      });
    }
    if (g.iconCharKey && !validKeys.has(g.iconCharKey)) {
      if (!lostMap[g.iconCharKey])
        lostMap[g.iconCharKey] = { prompts: [], asMember: [], asIcon: [] };
      if (lostMap[g.iconCharKey].asIcon.indexOf(g.id) < 0)
        lostMap[g.iconCharKey].asIcon.push(g.id);
    }
  });
  var lostKeys = Object.keys(lostMap);

  function getDispName(key) {
    var m = String(key).match(/^(.+?)\.[^.]+$/);
    return m ? m[1] : key;
  }
  function getFileBaseName(key) {
    return String(key).replace(/\.[^.]+$/, "");
  }

  function rebindToTarget(lostKey, targetKey) {
    var info = lostMap[lostKey];
    if (!info) return;
    info.prompts.forEach(function (p) {
      p.character = targetKey;
      if (p.usageByCharacter && p.usageByCharacter[lostKey] !== undefined) {
        p.usageByCharacter[targetKey] =
          (p.usageByCharacter[targetKey] || 0) + p.usageByCharacter[lostKey];
        delete p.usageByCharacter[lostKey];
      }
    });
    data.groups.forEach(function (g) {
      if (Array.isArray(g.charKeys)) {
        var i = g.charKeys.indexOf(lostKey);
        if (i >= 0) {
          g.charKeys.splice(i, 1);
          if (g.charKeys.indexOf(targetKey) < 0) g.charKeys.push(targetKey);
        }
      }
      if (Array.isArray(g.charDisplayOrder)) {
        var oi = g.charDisplayOrder.indexOf(lostKey);
        if (oi >= 0) g.charDisplayOrder[oi] = targetKey;
      }
      if (g.iconCharKey === lostKey) g.iconCharKey = targetKey;
    });
    if (data.settings.charBirthdays && data.settings.charBirthdays[lostKey]) {
      if (!data.settings.charBirthdays[targetKey]) {
        data.settings.charBirthdays[targetKey] =
          data.settings.charBirthdays[lostKey];
      }
      delete data.settings.charBirthdays[lostKey];
    }
    if (data.settings.ownBirthdays && data.settings.ownBirthdays[lostKey]) {
      if (!data.settings.ownBirthdays[targetKey]) {
        data.settings.ownBirthdays[targetKey] = true;
      }
      delete data.settings.ownBirthdays[lostKey];
    }
    if (
      data.settings.unlockedBirthdays &&
      data.settings.unlockedBirthdays[lostKey]
    ) {
      if (!data.settings.unlockedBirthdays[targetKey]) {
        data.settings.unlockedBirthdays[targetKey] =
          data.settings.unlockedBirthdays[lostKey];
      }
      delete data.settings.unlockedBirthdays[lostKey];
    }

    if (
      data.settings.charBirthdayMessages &&
      data.settings.charBirthdayMessages[lostKey]
    ) {
      if (!data.settings.charBirthdayMessages[targetKey]) {
        data.settings.charBirthdayMessages[targetKey] =
          data.settings.charBirthdayMessages[lostKey];
      }
      delete data.settings.charBirthdayMessages[lostKey];
    }
    if (
      data.settings.dismissedBirthdays &&
      data.settings.dismissedBirthdays[lostKey]
    ) {
      if (!data.settings.dismissedBirthdays[targetKey]) {
        data.settings.dismissedBirthdays[targetKey] =
          data.settings.dismissedBirthdays[lostKey];
      }
      delete data.settings.dismissedBirthdays[lostKey];
    }
    if (Array.isArray(data.settings.recentBoundChars)) {
      data.settings.recentBoundChars = data.settings.recentBoundChars.map(
        function (k) {
          return k === lostKey ? targetKey : k;
        },
      );
    }
    delete lostMap[lostKey];
    lostKeys = Object.keys(lostMap);
    _invalidateCharGroupCache();
  }

  function unbindLostKey(lostKey) {
    var info = lostMap[lostKey];
    if (!info) return;
    info.prompts.forEach(function (p) {
      p.character = "";
      p.usageByCharacter = {};
    });
    data.groups.forEach(function (g) {
      if (Array.isArray(g.charKeys)) {
        var i = g.charKeys.indexOf(lostKey);
        if (i >= 0) g.charKeys.splice(i, 1);
      }
      if (Array.isArray(g.charDisplayOrder)) {
        var oi = g.charDisplayOrder.indexOf(lostKey);
        if (oi >= 0) g.charDisplayOrder.splice(oi, 1);
      }
      if (g.iconCharKey === lostKey) {
        g.iconCharKey = "";
        if (g.iconMode === "char") g.iconMode = "group";
      }
    });
    if (data.settings.charBirthdays)
      delete data.settings.charBirthdays[lostKey];
    if (data.settings.charBirthdayMessages)
      delete data.settings.charBirthdayMessages[lostKey];
    if (data.settings.dismissedBirthdays)
      delete data.settings.dismissedBirthdays[lostKey];
    if (data.settings.ownBirthdays) delete data.settings.ownBirthdays[lostKey];
    if (data.settings.unlockedBirthdays)
      delete data.settings.unlockedBirthdays[lostKey];
    if (Array.isArray(data.settings.recentBoundChars)) {
      data.settings.recentBoundChars = data.settings.recentBoundChars.filter(
        function (k) {
          return k !== lostKey;
        },
      );
    }
    delete lostMap[lostKey];
    lostKeys = Object.keys(lostMap);
    _invalidateCharGroupCache();
  }

  function buildList() {
    if (lostKeys.length === 0) {
      return '<div class="ms-empty"><i class="fa-solid fa-circle-check" style="color:var(--ms-success);"></i>所有失联角色已处理完毕～<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">点击左上角返回设置</span></div>';
    }
    var html =
      '<div style="padding:10px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.5;">' +
      '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>' +
      "检测到 <strong>" +
      lostKeys.length +
      "</strong> 个失联角色卡。失联通常是因为角色卡被删除、或重命名导致 avatar 文件名变化。" +
      '<br><span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">「重绑」匹配到当前的某张卡 · 「解绑」清空角色字段（剧场内容不会丢）</span>' +
      "</div>";
    lostKeys.forEach(function (lostKey) {
      var info = lostMap[lostKey];
      var dispName = getDispName(lostKey);
      var fileName = getFileBaseName(lostKey);
      var promptCnt = info.prompts.length;
      var samples = "";
      if (promptCnt > 0) {
        samples += '<div class="ms-lost-samples">';
        info.prompts.slice(0, 3).forEach(function (p) {
          var g = p.groupId ? getGroup(p.groupId) : null;
          var gLabel = g
            ? '<span style="color:' +
              g.color +
              ';opacity:0.7;">[' +
              esc(truncate(g.name, 8)) +
              "]</span> "
            : "";
          samples +=
            "<div>· " +
            gLabel +
            esc(truncate(p.title || "未命名", 30)) +
            "</div>";
        });
        if (promptCnt > 3)
          samples +=
            '<div style="opacity:0.6;">· ... 还有 ' +
            (promptCnt - 3) +
            " 条</div>";
        samples += "</div>";
      }
      var groupBadges = "";
      if (info.asMember.length > 0 || info.asIcon.length > 0) {
        groupBadges = '<div class="ms-lost-badges">';
        info.asMember.forEach(function (gid) {
          var g = getGroup(gid);
          if (g)
            groupBadges +=
              '<span class="ms-lost-badge" style="background:' +
              g.color +
              "33;color:" +
              g.color +
              ';">成员: ' +
              esc(truncate(g.name, 12)) +
              "</span>";
        });
        info.asIcon.forEach(function (gid) {
          var g = getGroup(gid);
          if (g)
            groupBadges +=
              '<span class="ms-lost-badge" style="background:rgba(255,180,80,0.15);color:#f0a040;">图标: ' +
              esc(truncate(g.name, 12)) +
              "</span>";
        });
        groupBadges += "</div>";
      }
      html +=
        '<div class="ms-lost-card" data-lost-key="' +
        esc(lostKey) +
        '">' +
        '<div class="ms-lost-meta">' +
        '<div class="ms-lost-icon"><i class="fa-solid fa-user-slash"></i></div>' +
        '<div class="ms-lost-info">' +
        '<div class="ms-lost-name">' +
        esc(dispName) +
        "</div>" +
        '<div class="ms-lost-fname" title="' +
        esc(lostKey) +
        '">' +
        esc(fileName) +
        "</div>" +
        '<div class="ms-lost-stats">' +
        (promptCnt > 0
          ? '<i class="fa-solid fa-masks-theater" style="font-size:10px;margin-right:3px;color:var(--ms-accent);"></i>' +
            promptCnt +
            " 条剧场"
          : '<span style="opacity:0.5;">无关联剧场</span>') +
        "</div>" +
        samples +
        groupBadges +
        "</div>" +
        "</div>" +
        '<div class="ms-lost-actions">' +
        '<button class="ms-tbtn" data-lost-action="rebind" data-lost-key="' +
        esc(lostKey) +
        '" style="font-size:11px;padding:5px 12px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-link" style="margin-right:3px;"></i>重绑</button>' +
        '<button class="ms-tbtn" data-lost-action="unbind" data-lost-key="' +
        esc(lostKey) +
        '" style="font-size:11px;padding:5px 12px;"><i class="fa-solid fa-link-slash" style="margin-right:3px;"></i>解绑</button>' +
        "</div>" +
        "</div>";
    });
    return html;
  }

  function refresh() {
    $p.find("#ms-body").html(buildList());
    if (lostKeys.length === 0) {
      $p.find("#ms-footer").hide();
      _invalidateCharGroupCache();
      saveData();
    } else {
      $p.find("#ms-footer span:first").text(lostKeys.length + " 个失联角色");
    }
  }

  function showRebindDialog(lostKey) {
    var allLocalKeys = Array.from(validKeys);
    var dispName = getDispName(lostKey);
    var fileName = getFileBaseName(lostKey);
    var dispLower = dispName.toLowerCase();

    function buildSearchList(kw) {
      var lkw = (kw || "").toLowerCase();
      var matched = allLocalKeys.filter(function (k) {
        if (!lkw) return true;
        return (
          getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0 ||
          String(k).toLowerCase().indexOf(lkw) >= 0
        );
      });
      matched.sort(function (a, b) {
        var aName = getCharDisplayName(a).toLowerCase();
        var bName = getCharDisplayName(b).toLowerCase();
        var aMatch =
          aName === dispLower
            ? 0
            : aName.indexOf(dispLower) === 0
              ? 1
              : aName.indexOf(dispLower) >= 0
                ? 2
                : 3;
        var bMatch =
          bName === dispLower
            ? 0
            : bName.indexOf(dispLower) === 0
              ? 1
              : bName.indexOf(dispLower) >= 0
                ? 2
                : 3;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return aName.localeCompare(bName);
      });
      if (matched.length === 0) {
        return '<div style="padding:20px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的角色</div>';
      }
      var html =
        '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
      matched.slice(0, 100).forEach(function (k) {
        var name = getCharDisplayName(k);
        var fname = getFileBaseName(k);
        var avatarPath = getCharAvatarPathSafe(k);
        var iconHtml = avatarPath
          ? '<img src="' +
            esc(avatarPath) +
            '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:12px;"></i>';
        html +=
          '<div class="ms-modal-list-item" data-target-key="' +
          esc(k) +
          '">' +
          '<div class="ms-modal-list-icon">' +
          iconHtml +
          "</div>" +
          '<div class="ms-modal-list-info">' +
          '<div class="ms-modal-list-name">' +
          esc(name) +
          "</div>" +
          '<div class="ms-modal-list-desc">' +
          esc(fname) +
          "</div>" +
          "</div>" +
          "</div>";
      });
      if (matched.length > 100) {
        html +=
          '<div style="padding:8px;text-align:center;font-size:10px;color:var(--SmartThemeQuoteColor,#666);">仅显示前 100 个，请输入关键词缩小范围</div>';
      }
      html += "</div>";
      return html;
    }

    showModal({
      title: "重绑「" + dispName + "」",
      iconType: "info",
      icon: "fa-link",
      modalStyle: "min-width:380px;max-width:90vw;width:420px;",
      body: function () {
        return (
          '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;font-family:monospace;background:rgba(255,255,255,0.04);padding:6px 8px;border-radius:4px;">原文件名: ' +
          esc(fileName) +
          "</div>" +
          '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-rebind-search">' +
          '<div id="ms-rebind-list">' +
          buildSearchList("") +
          "</div>"
        );
      },
      buttons: [{ text: "取消", value: null }],
      cancelValue: null,
      onShow: function ($overlay, close) {
        var $search = $overlay.find("#ms-rebind-search");
        $search.focus();
        $overlay.on("input", "#ms-rebind-search", function () {
          $overlay.find("#ms-rebind-list").html(buildSearchList($(this).val()));
        });
        $overlay.on("click", ".ms-modal-list-item", function () {
          var key = $(this).attr("data-target-key");
          if (!key) return;
          rebindToTarget(lostKey, key);
          toast("success", "已重绑到 " + getCharDisplayName(key));
          close("rebound");
        });
      },
    }).then(function () {
      refresh();
    });
  }

  $p.find("#ms-body").html(buildList());
  $p.find("#ms-footer")
    .html(
      "<span>" +
        lostKeys.length +
        ' 个失联角色</span><div class="ms-footer-btns">' +
        '<a data-lost-batch="auto"><i class="fa-solid fa-wand-magic-sparkles"></i> 自动匹配</a> ' +
        '<a data-lost-batch="unbind-all" style="color:var(--ms-danger);"><i class="fa-solid fa-link-slash"></i> 全部解绑</a>' +
        "</div>",
    )
    .show();
  bindAllEvents();

  $p.find("#ms-body").on(
    "click.ms",
    '[data-lost-action="rebind"]',
    function (e) {
      e.stopPropagation();
      showRebindDialog($(this).attr("data-lost-key"));
    },
  );

  $p.find("#ms-body").on(
    "click.ms",
    '[data-lost-action="unbind"]',
    function (e) {
      e.stopPropagation();
      var lostKey = $(this).attr("data-lost-key");
      var info = lostMap[lostKey];
      if (!info) return;
      var msgs = [];
      if (info.prompts.length > 0)
        msgs.push("· " + info.prompts.length + " 条剧场会清空角色绑定");
      if (info.asMember.length > 0)
        msgs.push("· 从 " + info.asMember.length + " 个分组成员中移除");
      if (info.asIcon.length > 0)
        msgs.push("· " + info.asIcon.length + " 个分组的图标会重置为群聊样式");
      msgs.push("");
      msgs.push("剧场内容本身不会被删除");
      msConfirm(
        "确定解绑「" + getDispName(lostKey) + "」吗？\n\n" + msgs.join("\n"),
        {
          title: "确认解绑",
          dangerous: true,
          okText: "解绑",
        },
      ).then(function (ok) {
        if (!ok) return;
        unbindLostKey(lostKey);
        toast("success", "已解绑");
        refresh();
      });
    },
  );

  $p.find("#ms-footer").on("click.ms", '[data-lost-batch="auto"]', function () {
    var allLocalKeys = Array.from(validKeys);
    var nameMap = {};
    allLocalKeys.forEach(function (k) {
      var name = getCharDisplayName(k);
      if (!nameMap[name]) nameMap[name] = [];
      nameMap[name].push(k);
    });

    function normalizeForFuzzy(s) {
      if (!s) return "";
      return String(s)
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[（(][^）)]*[）)]/g, "")
        .replace(/[-_·・．.、,，]/g, "")
        .trim();
    }

    var fuzzyNameMap = {};
    allLocalKeys.forEach(function (k) {
      var fn = normalizeForFuzzy(getCharDisplayName(k));
      if (!fn) return;
      if (!fuzzyNameMap[fn]) fuzzyNameMap[fn] = [];
      fuzzyNameMap[fn].push(k);
    });

    var suggestions = [];
    Object.keys(lostMap).forEach(function (lostKey) {
      var info = lostMap[lostKey];
      var fileName = getDispName(lostKey);
      var exportedName = null;
      for (var i = 0; i < info.prompts.length; i++) {
        if (info.prompts[i].character_name) {
          exportedName = info.prompts[i].character_name;
          break;
        }
      }

      var matchType = null;
      var candidates = [];

      if (exportedName && nameMap[exportedName]) {
        candidates = nameMap[exportedName].slice();
        matchType = candidates.length === 1 ? "name_exact" : "name_multi";
      }

      if (candidates.length === 0 && nameMap[fileName]) {
        candidates = nameMap[fileName].slice();
        matchType = candidates.length === 1 ? "file_exact" : "file_multi";
      }

      if (candidates.length === 0) {
        var fuzzyKey = normalizeForFuzzy(exportedName || fileName);
        if (fuzzyKey && fuzzyNameMap[fuzzyKey]) {
          candidates = fuzzyNameMap[fuzzyKey].slice();
          matchType = candidates.length === 1 ? "fuzzy_exact" : "fuzzy_multi";
        }
      }

      suggestions.push({
        lostKey: lostKey,
        lostDisplayName: exportedName || fileName,
        fileName: fileName,
        exportedName: exportedName,
        promptCount: info.prompts.length,
        candidates: candidates,
        matchType: matchType,
      });
    });

    var autoCount = suggestions.filter(function (s) {
      return (
        s.matchType === "name_exact" ||
        s.matchType === "file_exact" ||
        s.matchType === "fuzzy_exact"
      );
    }).length;
    var needPickCount = suggestions.filter(function (s) {
      return s.candidates.length > 1;
    }).length;
    var unmatchedCount = suggestions.filter(function (s) {
      return s.candidates.length === 0;
    }).length;

    if (autoCount === 0 && needPickCount === 0) {
      toast("info", "没有找到任何本地匹配的角色");
      return;
    }

    var dlgHtml =
      '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:10px;line-height:1.7;">' +
      '<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--ms-accent);margin-right:4px;"></i>' +
      "扫描完毕：<strong>" +
      autoCount +
      "</strong> 个可自动重绑，<strong>" +
      needPickCount +
      "</strong> 个有多个候选需要你选，<strong>" +
      unmatchedCount +
      "</strong> 个无匹配。<br>" +
      '<span style="opacity:0.7;">取消勾选的行不会被改动，可以稍后手动处理。</span>' +
      "</div>";
    dlgHtml += '<div style="max-height:50vh;overflow-y:auto;">';

    suggestions.forEach(function (s, idx) {
      if (s.candidates.length === 0) {
        dlgHtml +=
          '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(var(--ms-danger-rgb),0.04);opacity:0.7;">' +
          '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#bbb);">' +
          '<i class="fa-solid fa-user-slash" style="color:var(--ms-danger);margin-right:4px;"></i>' +
          esc(s.lostDisplayName) +
          '<span style="font-size:10px;opacity:0.6;margin-left:6px;">(' +
          s.promptCount +
          "条剧场)</span>" +
          "</div>" +
          '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:3px;">本地没有匹配的角色卡</div>' +
          "</div>";
        return;
      }

      var isAuto = s.candidates.length === 1;
      var typeLabel = "";
      if (s.matchType === "name_exact")
        typeLabel =
          '<span style="color:var(--ms-success);font-size:10px;">✓ 按角色名精确匹配</span>';
      else if (s.matchType === "file_exact")
        typeLabel =
          '<span style="color:var(--ms-success);font-size:10px;">✓ 按文件名精确匹配</span>';
      else if (s.matchType === "fuzzy_exact")
        typeLabel =
          '<span style="color:#f0a040;font-size:10px;">⚠ 模糊匹配（可能不准）</span>';
      else if (s.matchType === "name_multi")
        typeLabel =
          '<span style="color:#f0a040;font-size:10px;">⚠ 同名有 ' +
          s.candidates.length +
          " 个候选</span>";
      else if (s.matchType === "file_multi")
        typeLabel =
          '<span style="color:#f0a040;font-size:10px;">⚠ 同文件名有 ' +
          s.candidates.length +
          " 个候选</span>";
      else if (s.matchType === "fuzzy_multi")
        typeLabel =
          '<span style="color:#f0a040;font-size:10px;">⚠ 模糊匹配有 ' +
          s.candidates.length +
          " 个候选</span>";

      dlgHtml +=
        '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(255,255,255,0.02);">' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
        '<input type="checkbox" class="ms-auto-apply-cb" data-idx="' +
        idx +
        '"' +
        (isAuto ? " checked" : "") +
        ">" +
        '<span style="flex:1;"><strong>' +
        esc(s.lostDisplayName) +
        "</strong>" +
        '<span style="font-size:10px;opacity:0.6;margin-left:6px;">(' +
        s.promptCount +
        "条剧场)</span>" +
        "</span>" +
        typeLabel +
        "</label>";
      if (s.candidates.length === 1) {
        var k = s.candidates[0];
        var ap = getCharAvatarPathSafe(k);
        var avH = ap
          ? '<img src="' +
            esc(ap) +
            '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="font-size:10px;margin-right:4px;opacity:0.6;"></i>';
        dlgHtml +=
          '<div style="font-size:11px;color:var(--SmartThemeBodyColor,#ccc);margin-top:4px;padding-left:22px;">' +
          "→ " +
          avH +
          esc(getCharDisplayName(k)) +
          '<span style="font-size:9px;opacity:0.5;margin-left:4px;">(' +
          esc(getFileBaseName(k)) +
          ")</span>" +
          "</div>";
      } else {
        dlgHtml +=
          '<div style="margin-top:6px;padding-left:22px;display:flex;flex-direction:column;gap:3px;">';
        s.candidates.forEach(function (k, ci) {
          var ap = getCharAvatarPathSafe(k);
          var avH = ap
            ? '<img src="' +
              esc(ap) +
              '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="font-size:10px;opacity:0.6;"></i>';
          dlgHtml +=
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:var(--SmartThemeBodyColor,#ccc);">' +
            '<input type="radio" name="ms-auto-pick-' +
            idx +
            '" value="' +
            esc(k) +
            '"' +
            (ci === 0 ? " checked" : "") +
            ">" +
            avH +
            "<span>" +
            esc(getCharDisplayName(k)) +
            "</span>" +
            '<span style="font-size:9px;opacity:0.5;">(' +
            esc(getFileBaseName(k)) +
            ")</span>" +
            "</label>";
        });
        dlgHtml += "</div>";
      }
      dlgHtml += "</div>";
    });
    dlgHtml += "</div>";

    showModal({
      title: "智能匹配结果",
      iconType: "info",
      icon: "fa-wand-magic-sparkles",
      modalStyle: "min-width:420px;max-width:94vw;width:520px;",
      body: dlgHtml,
      buttons: [
        { text: "取消", value: null },
        {
          text: "应用选中项",
          cls: "primary",
          primary: true,
          action: function ($overlay) {
            var applyCount = 0;
            $overlay.find(".ms-auto-apply-cb:checked").each(function () {
              var idx = parseInt($(this).data("idx"));
              var s = suggestions[idx];
              if (!s || s.candidates.length === 0) return;
              var targetKey;
              if (s.candidates.length === 1) {
                targetKey = s.candidates[0];
              } else {
                targetKey = $overlay
                  .find('input[name="ms-auto-pick-' + idx + '"]:checked')
                  .val();
              }
              if (targetKey) {
                rebindToTarget(s.lostKey, targetKey);
                applyCount++;
              }
            });
            if (applyCount > 0) {
              toast("success", "已重绑 " + applyCount + " 个角色");
              refresh();
            } else {
              toast("info", "没有应用任何更改");
            }
            return true;
          },
        },
      ],
      cancelValue: null,
    });
  });

  $p.find("#ms-footer").on(
    "click.ms",
    '[data-lost-batch="unbind-all"]',
    function () {
      var totalPrompts = 0;
      var totalGroups = 0;
      Object.keys(lostMap).forEach(function (k) {
        totalPrompts += lostMap[k].prompts.length;
        totalGroups += lostMap[k].asMember.length + lostMap[k].asIcon.length;
      });
      msConfirm(
        "确定解绑全部 " +
          lostKeys.length +
          " 个失联角色吗？\n\n" +
          "· " +
          totalPrompts +
          " 条剧场会清空角色绑定\n" +
          "· 涉及 " +
          totalGroups +
          " 个分组的成员/图标关联\n\n" +
          "剧场内容本身不会被删除",
        { title: "确认全部解绑", dangerous: true, okText: "全部解绑" },
      ).then(function (ok) {
        if (!ok) return;
        Object.keys(lostMap)
          .slice()
          .forEach(function (lostKey) {
            unbindLostKey(lostKey);
          });
        toast("success", "已全部解绑");
        refresh();
      });
    },
  );
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
  $p.find("#ms-body").on("click.ms", ".ms-nav-item[data-sub-id]", function () {
    navigateTo({
      name: "subscription-detail",
      subId: $(this).data("sub-id"),
    });
  });
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
  var $p = setupPage("添加订阅");
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
      chk("ms-sub-opt-groups", "checked", "导入分组信息") +
      chk("ms-sub-opt-tags", "checked", "导入标签信息") +
      chk(
        "ms-sub-opt-cgroups",
        "checked",
        '接收 IP 分组 <span style="font-size:10px;opacity:0.5;">(仅匹配本地已有角色)</span>',
      ) +
      chk(
        "ms-sub-opt-update",
        "checked",
        '允许更新已有内容 <span style="font-size:10px;opacity:0.5;">(关闭则只接收新增，不覆盖本地修改)</span>',
      ) +
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
    var dup = data.subscriptions.find(function (s) {
      return s.url === url;
    });
    if (dup) {
      toast("warning", "已经订阅过这个链接了：" + dup.name);
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
      var rawText = await response.text();
      var imported = JSON.parse(rawText);
      if (!imported.prompts && !imported.groups)
        throw new Error("无效的小剧场数据");
      if (imported.prompts && !Array.isArray(imported.prompts))
        throw new Error("prompts 字段格式错误");
      if (imported.groups && !Array.isArray(imported.groups))
        throw new Error("groups 字段格式错误");
      if (imported.tags && !Array.isArray(imported.tags))
        throw new Error("tags 字段格式错误");
      if (imported.charGroups && !Array.isArray(imported.charGroups))
        throw new Error("charGroups 字段格式错误");
      var useGroups = $p.find("#ms-sub-opt-groups").is(":checked");
      var sub = {
        id: uid(),
        name: name,
        url: url,
        importGroups: useGroups,
        importTags: $p.find("#ms-sub-opt-tags").is(":checked"),
        importCharGroups: $p.find("#ms-sub-opt-cgroups").is(":checked"),
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
      sub.lastHash = computeSubscriptionHash(imported);
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
  var sub = data.subscriptions.find(function (s) {
    return s.id === v.subId;
  });
  if (!sub) {
    navigateBack();
    return;
  }
  var $p = setupPage(sub.name, esc(truncate(sub.name, 20)));
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
        ps.push('<span style="color:#7dce7d;">+' + log.added + " 新增</span>");
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
      chk(
        "ms-sub-d-groups",
        sub.importGroups ? "checked" : "",
        "导入分组信息",
      ) +
      chk("ms-sub-d-tags", sub.importTags ? "checked" : "", "导入标签信息") +
      chk(
        "ms-sub-d-cgroups",
        sub.importCharGroups !== false ? "checked" : "",
        '接收 IP 分组 <span style="font-size:10px;opacity:0.5;">(仅匹配本地已有角色)</span>',
      ) +
      chk(
        "ms-sub-d-update",
        sub.updateExisting !== false ? "checked" : "",
        "允许更新已有内容",
      ) +
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
    var dup = data.subscriptions.find(function (s) {
      return s.id !== sub.id && s.url === newUrl;
    });
    if (dup) {
      toast("warning", "已经订阅过这个链接了：" + dup.name);
      return;
    }

    sub.name = newName;
    if (newUrl !== sub.url) sub.lastHash = "";
    sub.url = newUrl;
    sub.importGroups = $p.find("#ms-sub-d-groups").is(":checked");
    sub.importTags = $p.find("#ms-sub-d-tags").is(":checked");
    sub.importCharGroups = $p.find("#ms-sub-d-cgroups").is(":checked");
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
    msConfirm(
      "确定删除订阅「" + sub.name + "」吗？\n\n已导入的剧场不会被删除",
      { title: "删除订阅", dangerous: true, okText: "删除" },
    ).then(function (ok) {
      if (!ok) return;
      data.subscriptions = data.subscriptions.filter(function (s) {
        return s.id !== sub.id;
      });
      data.settings.subUpdatesPending = 0;
      saveData();
      toast("success", "已删除订阅");
      navigateBack();
    });
  });
}
