function getPanelHTML() {
  return `<div id="${PANEL_ID}">
      <div class="ms-header" id="ms-header">
        <i class="fa-solid fa-grip ms-drag-handle"></i>
        <div class="ms-title-wrap">
          <span class="ms-title" id="ms-title">小剧场</span><button class="ms-title-info" id="ms-title-info" title="查看分组备注"><i class="fa-solid fa-circle-info"></i></button><span class="ms-title-note-inline" id="ms-title-note-inline"></span>
        </div>
        <span class="ms-inject-indicator" id="ms-inject-indicator"></span><span class="ms-count" id="ms-count"></span>
        <button class="ms-hbtn" id="ms-btn-collapse" title="收起"><i class="fa-solid fa-window-minimize"></i></button><button class="ms-hbtn" id="ms-btn-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        <div class="ms-title-note-panel" id="ms-title-note-panel"></div>
      </div>
      <div class="ms-toolbar" id="ms-toolbar"></div>
      <div class="ms-filter-panel" id="ms-filter-panel"></div>
      <div class="ms-body" id="ms-body"></div>
      <div class="ms-footer" id="ms-footer"></div>
      <div class="ms-dropdown" id="ms-dropdown"></div>
      <input type="file" id="ms-file-input" accept=".json" style="display:none;"><button class="ms-scroll-top" id="ms-scroll-top" title="回到顶部"><i class="fa-solid fa-angle-up"></i></button><button class="ms-scroll-bottom" id="ms-scroll-bottom" title="回到底部"><i class="fa-solid fa-angle-down"></i></button></div>`;
}

function renderView() {
  if (bindReorderDrag._cleanup) {
    bindReorderDrag._cleanup();
    bindReorderDrag._cleanup = null;
  }
  _clearPagedCtx();
  const $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  $p.find("#ms-count").text(data.prompts.length + " 条");
  $p.find("#ms-filter-panel").removeClass("open").empty();
  $p.find("#ms-title-info").hide().removeClass("open").off("click.ms-note");
  $p.find("#ms-title-note-inline").removeClass("open").empty();
  $p.find("#ms-title-note-panel").removeClass("open").empty();
  const v = currentView();
  if (v.name !== "group-edit") flushGroupEdit = null;
  const map = {
    "lost-chars": renderLostChars,
    list: renderList,
    group: renderGroup,
    starred: renderStarred,
    recent: renderRecent,
    characters: renderCharacters,
    character: renderCharacter,
    preview: renderPreview,
    edit: renderEdit,
    groups: renderGroups,
    "group-edit": renderGroupEdit,
    "tag-manage": renderTagManage,
    "tag-mappings": renderTagMappings,
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
    "theme-binding": renderThemeBinding,
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
    (filterState.includeTags.length > 0 ||
      filterState.excludeTags.length > 0 ||
      filterState.groupId)
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
  setTimeout(function () {
    $p.find("#ms-body").trigger("scroll");
  }, 100);
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

function refreshKeepingState() {
  var $p = $("#" + PANEL_ID);
  var v = currentView();
  var $body = $p.find("#ms-body");
  if (v.name === "group" || v.name === "character") {
    var _openSeries = [];
    $body.find(".ms-series-body.open").each(function () {
      _openSeries.push(this.id);
    });
    v._expandedSeries = _openSeries;
    v._savedScrollTop = $body.scrollTop();
    renderView();
  } else {
    renderBodyOnly();
  }
}
function rerenderAfterSelectChange() {
  refreshKeepingState();
}

function renderBodyOnly() {
  const $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  _clearPagedCtx();
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
      filterState.includeTags.length > 0 ||
      filterState.excludeTags.length > 0 ||
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
    var $oldSearch = $p.find("#ms-search");
    var _searchWasFocused = $oldSearch.is(":focus");
    var _searchStart =
      _searchWasFocused && $oldSearch[0]
        ? $oldSearch[0].selectionStart || 0
        : 0;
    var _searchEnd =
      _searchWasFocused && $oldSearch[0] ? $oldSearch[0].selectionEnd || 0 : 0;
    renderView();
    if (_searchWasFocused) {
      var $newSearch = $p.find("#ms-search");
      if ($newSearch.length) {
        $newSearch.focus();
        try {
          $newSearch[0].setSelectionRange(_searchStart, _searchEnd);
        } catch (e) {}
      }
    }
    return;
  } else if (v.name === "starred") {
    let f = sortPrompts(
      filterPrompts(searchPrompts(getStarredPrompts(), searchQuery)),
    );
    var _sf =
      f.length > 0
        ? _applyPagedRender(getPromptCardBlocks(f, true))
        : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`;
    $body.html(buildRangeModeHint() + _sf);

    $p.find("#ms-footer")
      .html(selectMode ? buildBatchFooter() : `<span>${f.length} 条收藏</span>`)
      .show();
  } else if (v.name === "recent") {
    const list = sortPrompts(
      filterPrompts(searchPrompts(getRecentPrompts(), searchQuery)),
    );
    var _rf =
      list.length > 0
        ? _applyPagedRender(getPromptCardBlocks(list, true))
        : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`;
    $body.html(buildRangeModeHint() + _rf);

    $p.find("#ms-footer")
      .find("span:first")
      .text(list.length + " 条");
  } else if (v.name === "characters") {
    var $oldSearch = $p.find("#ms-search");
    var wasFocused = $oldSearch.is(":focus");
    var cursorPos =
      wasFocused && $oldSearch[0] ? $oldSearch[0].selectionStart || 0 : 0;
    renderCharacters(v);
    if (wasFocused) {
      var $newSearch = $p.find("#ms-search");
      $newSearch.focus();
      try {
        $newSearch[0].setSelectionRange(cursorPos, cursorPos);
      } catch (e) {}
    }
    return;
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
  setTimeout(function () {
    $body.trigger("scroll");
  }, 50);
  if ($p.find("#ms-footer").css("display") === "block")
    $p.find("#ms-footer").css("display", "flex");
}
function buildRangeModeHint() {
  if (!selectMode || !rangeSelectMode) return "";
  var vis = getVisiblePromptIds();
  var anchorValid = rangeSelectAnchor && vis.indexOf(rangeSelectAnchor) >= 0;
  return (
    '<div style="padding:8px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;"><i class="fa-solid fa-arrows-left-right-to-line" style="color:var(--ms-accent);margin-right:4px;"></i>范围模式：' +
    (anchorValid ? "已锚定，再次点选可扩展或收缩范围" : "点选第一项确定锚点") +
    ' · <span style="opacity:0.75;">长按某条目可改锚点到该处</span></div>'
  );
}

function buildBatchFooter() {
  const vis = getVisiblePromptIds();
  const allSelected = vis.length > 0 && vis.every((id) => selectedIds.has(id));
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
      <button class="ms-batch-btn" data-batch="character"><i class="fa-solid fa-user-tag"></i><span class="ms-btn-label"> 角色</span></button>
      <button class="ms-batch-btn" data-batch="export"><i class="fa-solid fa-file-export"></i><span class="ms-btn-label"> 导出</span></button>
      <button class="ms-batch-btn danger" data-batch="delete"><i class="fa-solid fa-trash"></i><span class="ms-btn-label"> 删除</span></button>
    </div>`;
}

function buildListBody() {
  let html = buildRangeModeHint();
  if (
    searchQuery ||
    filterState.includeTags.length > 0 ||
    filterState.excludeTags.length > 0 ||
    filterState.groupId
  ) {
    let list = sortPrompts(
      filterPrompts(searchPrompts(data.prompts, searchQuery)),
    );
    if (list.length > 0) {
      html += `<div class="ms-section-label">${searchQuery ? "搜索" : "筛选"}结果 (${list.length})</div>`;
      var _searchBlocks;
      if (
        !searchQuery &&
        filterState.groupId &&
        filterState.groupId !== "_ungrouped"
      ) {
        _searchBlocks = getGroupBodySeriesBlocks(list);
      } else {
        _searchBlocks = getPromptCardBlocks(list, true);
      }
      html += _applyPagedRender(_searchBlocks);
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
  const charMap = getAllCharactersWithStages();
  const charCount = Object.keys(charMap).length;
  const currentCharForNav = getCurrentCharKeySafe();
  if (charCount > 0 || currentCharForNav) {
    html += `<div class="ms-nav-item" data-nav="characters"><div class="ms-nav-icon" style="background:rgba(180,140,200,0.12);color:#b48cc8;"><i class="fa-solid fa-user-tag"></i></div><div class="ms-nav-info"><div class="ms-nav-title">角色专属</div></div><span class="ms-nav-cnt">${charCount}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
  }
  if (
    starred.length > 0 ||
    recent.length > 0 ||
    charCount > 0 ||
    currentCharForNav
  )
    html += '<div class="ms-divider"></div>';
  var _gpBuckets = {};
  data.prompts.forEach(function (p) {
    var k = p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
    if (!_gpBuckets[k]) _gpBuckets[k] = [];
    _gpBuckets[k].push(p);
  });
  var _selByGroup = {};
  if (selectMode) {
    selectedIds.forEach(function (pid) {
      var _p = getPrompt(pid);
      if (!_p) return;
      var _gk = _p.groupId && getGroup(_p.groupId) ? _p.groupId : "_ungrouped";
      _selByGroup[_gk] = (_selByGroup[_gk] || 0) + 1;
    });
  }
  data.groups.forEach((g) => {
    const groupPrompts = _gpBuckets[g.id] || [];
    const cnt = groupPrompts.length;
    const charSet = new Set();
    const seriesSet = new Set();
    groupPrompts.forEach(function (p) {
      if (p.character && isLocalCharKey(p.character)) charSet.add(p.character);
      var sn = (p.series || "").trim();
      if (sn) seriesSet.add(sn);
    });
    const charCnt = charSet.size;
    const seriesCnt = seriesSet.size;
    const noteH = g.note ? `<div class="ms-nav-note">${esc(g.note)}</div>` : "";
    const selCnt = _selByGroup[g.id] || 0;
    const selBadge =
      selCnt > 0 ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>` : "";
    var _gHasStage =
      (data.settings.stageSelectedIds || []).length > 0 &&
      data.prompts.some(function (pp) {
        return (
          (data.settings.stageSelectedIds || []).indexOf(pp.id) >= 0 &&
          pp.groupId === g.id
        );
      });
    var _useAvatar =
      isIPGroup(g) ||
      (g.iconMode === "custom" && g.iconUrl) ||
      (g.iconMode === "char" && g.iconCharKey);
    var _iconH = _useAvatar
      ? buildGroupAvatarHTML(g, 32)
      : `<div class="ms-nav-icon" style="background:${g.color}22;color:${g.color};"><i class="fa-solid fa-folder" style="color:${g.color};"></i></div>`;
    var cntParts = [];
    if (charCnt > 0)
      cntParts.push(
        '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-user" style="font-size:8px;opacity:0.7;"></i>' +
          charCnt +
          "</span>",
      );
    if (seriesCnt > 0)
      cntParts.push(
        '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-layer-group" style="font-size:8px;opacity:0.7;"></i>' +
          seriesCnt +
          "</span>",
      );
    cntParts.push(
      '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-masks-theater" style="font-size:8px;opacity:0.7;"></i>' +
        cnt +
        "</span>",
    );
    var cntHtml =
      '<span class="ms-nav-cnt" style="display:inline-flex;align-items:center;gap:5px;font-size:10px;">' +
      cntParts.join('<span style="opacity:0.35;">·</span>') +
      "</span>";
    html += `<div class="ms-swipe-wrap"><div class="ms-swipe-row"><div class="ms-nav-item ms-swipe-content${_gHasStage ? " ms-stage-injecting" : ""}" data-nav="group" data-gid="${g.id}">${_iconH}<div class="ms-nav-info"><div class="ms-nav-title">${esc(g.name)}</div>${noteH}</div>${selBadge}${cntHtml}<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div><button class="ms-swipe-del" data-swipe-del-gid="${g.id}"><i class="fa-solid fa-trash"></i>删除</button></div></div>`;
  });

  const ungrouped = _gpBuckets["_ungrouped"] || [];
  if (ungrouped.length > 0) {
    const selCnt = _selByGroup["_ungrouped"] || 0;
    const selBadge =
      selCnt > 0 ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>` : "";
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
  if (opts.select && selectMode)
    html += `<button class="ms-tbtn ${rangeSelectMode ? "active" : ""}" id="ms-btn-range" title="范围选择"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>`;
  if (opts.select)
    html += `<button class="ms-tbtn ${selectMode ? "active" : ""}" id="ms-btn-select" title="多选"><i class="fa-solid fa-check-double"></i></button>`;
  if (opts.sort)
    html += `<button class="ms-tbtn" id="ms-btn-sort" title="排序"><i class="fa-solid fa-arrow-down-short-wide"></i></button>`;
  if (opts.random && !selectMode)
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
  const v = currentView();
  const inGroupView = v.name === "group";
  const inCharView = v.name === "character";
  const hasAnyFilter =
    filterState.includeTags.length > 0 ||
    filterState.excludeTags.length > 0 ||
    filterState.groupId;
  var _visibleTagIds = null;
  if (v.name === "group" || v.name === "character") {
    var _scopeList;
    if (v.name === "group") {
      _scopeList =
        v.groupId === "_ungrouped"
          ? getUngroupedPrompts()
          : getPromptsInGroup(v.groupId);
    } else {
      _scopeList = getPromptsByCharacter(v.charKey || v.charName);
    }
    _visibleTagIds = new Set();
    _scopeList.forEach(function (p) {
      (p.tags || []).forEach(function (tid) {
        _visibleTagIds.add(tid);
      });
    });
  }
  var _tagsToShow = _visibleTagIds
    ? data.settings.definedTags.filter(function (t) {
        return _visibleTagIds.has(t.id);
      })
    : data.settings.definedTags;
  if (!data.settings.tagFilterExactMatch) {
    var _hideFromTags = new Set();
    var _mappings = data.settings.tagMappings || [];
    _mappings.forEach(function (mm) {
      if (Array.isArray(mm.tagIds) && mm.primaryTagId) {
        mm.tagIds.forEach(function (tid) {
          if (tid !== mm.primaryTagId) _hideFromTags.add(tid);
        });
      }
    });
    if (_hideFromTags.size > 0) {
      _tagsToShow = _tagsToShow.filter(function (t) {
        if (!_hideFromTags.has(t.id)) return true;
        return (
          filterState.includeTags.indexOf(t.id) >= 0 ||
          filterState.excludeTags.indexOf(t.id) >= 0
        );
      });
    }
  }

  if (_tagsToShow.length > 0) {
    var modeLabel =
      data.settings.filterTagMode === "and" ? "全部匹配" : "任一匹配";
    var excludeActive = filterState.tagSelectMode === "exclude";
    var isExact = data.settings.tagFilterExactMatch === true;
    var mappingCount = (data.settings.tagMappings || []).length;
    var mappingBtnTitle = isExact
      ? "当前为独立模式：只筛选你选中的标签\n点击切换到联动模式（同映射组的标签一起参与筛选）"
      : "当前为映射模式：选中标签时，同映射组的其他标签也会参与筛选\n点击切换到独立模式";
    var mappingBtnHtml =
      mappingCount > 0
        ? `<button class="ms-filter-mode-btn" id="ms-tag-mapping-toggle" title="${escAttr(mappingBtnTitle)}" style="${isExact ? "" : "background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);"}"><i class="fa-solid ${isExact ? "fa-link-slash" : "fa-link"}"></i> ${isExact ? "独立" : "映射"}</button>`
        : "";
    html += `<div class="ms-filter-section" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">标签筛选（可多选）${mappingBtnHtml}<button class="ms-filter-mode-btn" id="ms-tag-mode-toggle">${modeLabel}</button><button class="ms-filter-mode-btn ${excludeActive ? "ms-mode-exclude-active" : ""}" id="ms-tag-exclude-toggle" title="开启后点击的标签将被排除"><i class="fa-solid fa-ban"></i> 排除模式${excludeActive ? "·开" : ""}</button>${hasAnyFilter ? '<button class="ms-filter-mode-btn" id="ms-clear-filter" style="margin-left:auto;color:var(--ms-danger);border-color:rgba(var(--ms-danger-rgb),0.3);background:rgba(var(--ms-danger-rgb),0.05);"><i class="fa-solid fa-broom"></i> 清空筛选</button>' : ""}</div><div class="ms-tag-row">`;
    _tagsToShow.forEach((t) => {
      const inc = filterState.includeTags.includes(t.id);
      const exc = filterState.excludeTags.includes(t.id);
      let cls = "",
        style = "";
      if (inc) {
        cls = "active";
        style = "background:" + t.color + ";";
      } else if (exc) {
        cls = "ms-tag-excluded";
      }
      html += `<span class="ms-tag-toggle ${cls}" data-filter-tag="${t.id}" style="${style}">${esc(t.name)}</span>`;
    });
    html += `</div>`;
  }
  if (!inGroupView && !inCharView) {
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
  }
  var curK = getCurrentCharKeySafe();
  if (!inGroupView && !inCharView && curK) {
    var onlyCur = filterState.onlyCurrentChar;
    html += `<div class="ms-filter-section">当前角色</div><div class="ms-tag-row"><span class="ms-tag-toggle ${onlyCur ? "active" : ""}" id="ms-filter-only-current-char" style="${onlyCur ? "background:#b48cc8;" : ""}"><i class="fa-solid fa-user-check" style="margin-right:3px;font-size:10px;"></i>仅显示「${esc(getCharDisplayName(curK))}」专属</span></div>`;
  }
  return html;
}

function getPromptCardBlocks(list, showGroupLabel) {
  if (list.length === 0) return [];
  var blocks = [];
  list.forEach((p) => {
    const starCls = p.starred ? "active" : "",
      starIcon = p.starred ? "fa-solid" : "fa-regular",
      isSel = selectedIds.has(p.id);
    const isStageTarget =
      (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
    const isAnchor =
      selectMode && rangeSelectMode && rangeSelectAnchor === p.id;
    const anchorH = isAnchor
      ? ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;margin-left:4px;" title="锚点"></i>'
      : "";
    const g = p.groupId ? getGroup(p.groupId) : null;
    var seriesAboveH = "";
    if (showGroupLabel) {
      var _metaParts = [];
      if (g) {
        var gIconH;
        var isIPG = isIPGroup(g);
        if (
          isIPG ||
          (g.iconMode === "custom" && g.iconUrl) ||
          (g.iconMode === "char" && g.iconCharKey)
        ) {
          gIconH =
            '<span style="display:inline-flex;vertical-align:middle;">' +
            buildGroupAvatarHTML(g, 14) +
            "</span>";
        } else {
          gIconH = '<i class="fa-solid fa-folder" style="font-size:9px;"></i>';
        }
        _metaParts.push(
          '<span style="color:' +
            g.color +
            ';display:inline-flex;align-items:center;gap:3px;">' +
            gIconH +
            (searchQuery ? highlightText(g.name, searchQuery) : esc(g.name)) +
            "</span>",
        );
        if (isIPG && p.character && isLocalCharKey(p.character)) {
          var charDn = getCharDisplayName(p.character);
          var charAp = getCharAvatarPathSafe(p.character);
          var charAvH = charAp
            ? '<img src="' +
              esc(charAp) +
              '" loading="lazy" style="width:12px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="font-size:9px;opacity:0.7;"></i>';
          _metaParts.push(
            '<span style="color:#b48cc8;display:inline-flex;align-items:center;gap:3px;">' +
              charAvH +
              esc(charDn) +
              "</span>",
          );
        }
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
    var _ts =
      p.updatedAt && p.updatedAt !== p.createdAt ? p.updatedAt : p.createdAt;
    var _tsH = "";
    if (_ts) {
      var _d = new Date(_ts);
      if (!isNaN(_d.getTime())) {
        var _now = new Date();
        var _isThisYear = _d.getFullYear() === _now.getFullYear();
        var _shortDate = _isThisYear
          ? String(_d.getMonth() + 1).padStart(2, "0") +
            "/" +
            String(_d.getDate()).padStart(2, "0")
          : String(_d.getFullYear()).slice(2) +
            "/" +
            String(_d.getMonth() + 1).padStart(2, "0") +
            "/" +
            String(_d.getDate()).padStart(2, "0");
        var _isEdited = p.updatedAt && p.updatedAt !== p.createdAt;
        _tsH =
          '<span class="ms-card-ts" title="' +
          (_isEdited ? "编辑" : "创建") +
          ": " +
          formatDate(_ts) +
          '"><i class="fa-solid ' +
          (_isEdited ? "fa-pen-to-square" : "fa-calendar-plus") +
          '"></i>' +
          _shortDate +
          "</span>";
      }
    }
    var _bottomRowH = "";
    if (tagsH || _tsH) {
      _bottomRowH =
        '<div class="ms-card-tags-row">' + (tagsH || "") + _tsH + "</div>";
    }
    var cardHtml = "";
    if (selectMode) {
      cardHtml += `<div class="ms-card ${isSel ? "selected" : ""}${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><div class="ms-card-check"><i class="fa-solid fa-check"></i></div>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}${anchorH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div>`;
      if (_bottomRowH) cardHtml += _bottomRowH;
      cardHtml += `</div>`;
    } else {
      cardHtml += `<div class="ms-card${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><span class="ms-card-star ${starCls}" data-pid="${p.id}"><i class="${starIcon} fa-star"></i></span>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div><div class="ms-card-quick"><button class="ms-card-qbtn" data-qaction="send" data-pid="${p.id}" title="填入输入框"><i class="fa-solid fa-right-to-bracket"></i></button><button class="ms-card-qbtn" data-qaction="send-gen" data-pid="${p.id}" title="发送并生成"><i class="bi bi-send-fill"></i></button></div><i class="fa-solid fa-angle-right" style="color:var(--SmartThemeQuoteColor,#555);font-size:10px;flex-shrink:0;"></i>`;
      if (_bottomRowH) cardHtml += _bottomRowH;
      cardHtml += `</div>`;
    }
    blocks.push(cardHtml);
  });
  return blocks;
}

function renderPromptCards(list, showGroupLabel) {
  if (list.length === 0)
    return `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无</div>`;
  return getPromptCardBlocks(list, showGroupLabel).join("");
}

function getGroupBodySeriesBlocks(list) {
  if (searchQuery) return getPromptCardBlocks(list, true);
  var rendered = new Set();
  var blocks = [];
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
          "ms-series-" + simpleHash(seriesName + "||" + (p.groupId || ""));
        var headerExtra = "";
        var anchorBadge = "";
        if (selectMode) {
          var allSel = seriesItems.every(function (q) {
            return selectedIds.has(q.id);
          });
          var someSel =
            !allSel &&
            seriesItems.some(function (q) {
              return selectedIds.has(q.id);
            });
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
            "' data-series-key=\"" +
            esc(sid) +
            '"><i class="fa-solid ' +
            (someSel && !allSel ? "fa-minus" : "fa-check") +
            '"></i></div>';
          if (rangeSelectMode && rangeSelectAnchor === "series:" + sid) {
            anchorBadge =
              ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>';
          }
        }
        var _seriesHasStage =
          (data.settings.stageSelectedIds || []).length > 0 &&
          seriesItems.some(function (si) {
            return (data.settings.stageSelectedIds || []).indexOf(si.id) >= 0;
          });
        blocks.push(
          '<div class="ms-series-group' +
            (_seriesHasStage ? " ms-stage-injecting" : "") +
            '"><div class="ms-series-header" data-series-id="' +
            sid +
            '">' +
            headerExtra +
            '<i class="fa-solid fa-angle-right ms-series-arrow"></i>' +
            '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:13px;"></i><span class="ms-series-title">' +
            esc(seriesName) +
            anchorBadge +
            '</span><span class="ms-series-cnt">' +
            seriesItems.length +
            " 条</span></div>" +
            '<div class="ms-series-body" id="' +
            sid +
            '">' +
            renderPromptCards(seriesItems, false) +
            "</div></div>",
        );
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
            var anchorBadge2 = "";
            if (selectMode) {
              var isSel2 = selectedIds.has(p.id);
              var scCls2 = isSel2 ? " ms-sc-all" : "";
              headerExtra2 =
                '<div class="ms-series-check' +
                scCls2 +
                "\" data-series-ids='" +
                JSON.stringify([p.id]) +
                "' data-series-key=\"" +
                esc(sid2) +
                '"><i class="fa-solid fa-check"></i></div>';
              if (rangeSelectMode && rangeSelectAnchor === "series:" + sid2) {
                anchorBadge2 =
                  ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>';
              }
            }
            var _singleHasStage =
              (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
            blocks.push(
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
                anchorBadge2 +
                "</span>" +
                '<span class="ms-series-cnt" style="opacity:0.6;">筛选 1/' +
                fullSeriesCount +
                "</span>" +
                '</div><div class="ms-series-body open" id="' +
                sid2 +
                '">' +
                renderPromptCards([p], false) +
                "</div></div>",
            );
            rendered.add(p.id);
            return;
          }
        }
        var _singleBlocks1 = getPromptCardBlocks([p], false);
        if (_singleBlocks1.length > 0) blocks.push(_singleBlocks1[0]);
        rendered.add(p.id);
      }
    } else {
      var _singleBlocks2 = getPromptCardBlocks([p], false);
      if (_singleBlocks2.length > 0) blocks.push(_singleBlocks2[0]);
      rendered.add(p.id);
    }
  });
  return blocks;
}

function renderGroupBodyWithSeries(list) {
  return getGroupBodySeriesBlocks(list).join("");
}

function openDropdown($p, html, position) {
  const $dd = $p.find("#ms-dropdown");
  if ($dd.is(":visible")) {
    closeActiveDropdown();
    return null;
  }
  const panelH = $p[0].getBoundingClientRect().height;
  const ddMaxH = Math.max(150, panelH - 80);
  var pos = position || {};
  if (pos.anchor === "top") {
    $dd.css({
      top: pos.top || 80,
      right: pos.right !== undefined ? pos.right : 14,
      left: pos.left !== undefined ? pos.left : "auto",
      bottom: "auto",
      maxHeight: ddMaxH + "px",
      minWidth: pos.minWidth || "",
    });
  } else {
    $dd.css({
      bottom: pos.bottom !== undefined ? pos.bottom : 40,
      right: pos.right !== undefined ? pos.right : 14,
      left: pos.left !== undefined ? pos.left : "auto",
      top: "auto",
      maxHeight: ddMaxH + "px",
      minWidth: pos.minWidth || "",
    });
  }
  $dd.html(html).show();
  $p.css("overflow", "visible");
  setupOutsideClickClose($p);
  return $dd;
}

function showSortDropdown($p) {
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
  var html = modes
    .map(
      (m) =>
        `<div class="ms-dropdown-item${(data.settings.sortMode || "created-desc") === m[0] ? " active" : ""}" data-sort="${m[0]}">${m[1]}</div>`,
    )
    .join("");
  var $dd = openDropdown($p, html, { anchor: "top" });
  if (!$dd) return;
  $dd.off("click").on("click.sort", ".ms-dropdown-item", function () {
    data.settings.sortMode = $(this).data("sort");
    saveData();
    closeActiveDropdown();
    renderBodyOnly();
  });
}

function showMoveDropdown($p) {
  let html = `<div class="ms-dropdown-item" data-moveto="">未分组</div>`;
  data.groups.forEach((g) => {
    html += `<div class="ms-dropdown-item" data-moveto="${g.id}">${esc(g.name)}</div>`;
  });
  html += `<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>`;
  html += `<div class="ms-dropdown-item" data-moveto="_new" style="color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建分组</div>`;
  var $dd = openDropdown($p, html);
  if (!$dd) return;
  $dd.off("click").on("click.move", ".ms-dropdown-item", function () {
    const target = $(this).data("moveto");
    if (target === "_new") {
      closeActiveDropdown();
      msPrompt("", {
        title: "新建分组",
        placeholder: "请输入新分组名称",
        validate: function (v) {
          if (!v || !v.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        const ng = createGroup(name.trim());
        movePromptsToGroup([...selectedIds], ng.id);
        toast("success", `已创建分组并移动 ${selectedIds.size} 项`);
        exitSelectMode();
        renderView();
      });
      return;
    } else {
      movePromptsToGroup([...selectedIds], target || null);
      toast("success", `已移动 ${selectedIds.size} 项`);
    }
    exitSelectMode();
    closeActiveDropdown();
    renderView();
  });
}

var _batchTagSectionState = { used: true, global: true };

function showBatchTagDropdown($p) {
  if ($p.find("#ms-dropdown").is(":visible")) {
    closeActiveDropdown();
    return;
  }
  if (data.settings.definedTags.length === 0) {
    toast("warning", "还没有标签，请先在标签管理中创建");
    return;
  }

  var _expandedMappings = new Set();

  function getUsedTagIds() {
    var used = new Set();
    var involvedGroups = new Set();
    var hasUngrouped = false;
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (!p) return;
      if (p.groupId && getGroup(p.groupId)) involvedGroups.add(p.groupId);
      else hasUngrouped = true;
    });
    data.prompts.forEach(function (p) {
      if (!Array.isArray(p.tags) || p.tags.length === 0) return;
      var inScope = false;
      if (p.groupId && getGroup(p.groupId)) {
        if (involvedGroups.has(p.groupId)) inScope = true;
      } else {
        if (hasUngrouped) inScope = true;
      }
      if (!inScope) return;
      p.tags.forEach(function (tid) {
        if (getTag(tid)) used.add(tid);
      });
    });
    return used;
  }

  function getCountForTag(tid) {
    var cnt = 0;
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (p && p.tags && p.tags.includes(tid)) cnt++;
    });
    return cnt;
  }

  function getMappingInfo() {
    var primaryMap = {};
    var memberMap = {};
    var children = {};
    (data.settings.tagMappings || []).forEach(function (m) {
      if (!Array.isArray(m.tagIds) || m.tagIds.length === 0) return;
      var primary = m.primaryTagId;
      if (!primary || m.tagIds.indexOf(primary) < 0) primary = m.tagIds[0];
      if (!primary || !getTag(primary)) return;
      primaryMap[primary] = m;
      children[m.id] = [];
      m.tagIds.forEach(function (tid) {
        if (tid !== primary && getTag(tid)) {
          if (!memberMap[tid]) memberMap[tid] = m;
          children[m.id].push(tid);
        }
      });
    });
    return { primaryMap: primaryMap, memberMap: memberMap, children: children };
  }
  function buildOwnershipBadge(actualSection, currentSection) {
    if (actualSection === currentSection) return "";
    var label = actualSection === "used" ? "本组" : "全局";
    var bg =
      actualSection === "used"
        ? "background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);"
        : "background:rgba(255,255,255,0.06);color:var(--SmartThemeQuoteColor,#888);";
    return (
      '<span style="font-size:9px;padding:1px 5px;border-radius:3px;margin-left:4px;' +
      bg +
      '">' +
      label +
      "</span>"
    );
  }

  function buildTagRow(t, mappingInfo, sectionKey, options) {
    options = options || {};
    var cnt = getCountForTag(t.id);
    var mapping = !options.isChild ? mappingInfo.primaryMap[t.id] : null;
    var childIds = mapping ? mappingInfo.children[mapping.id] : null;
    var hasChildren = childIds && childIds.length > 0;
    var isExpanded = mapping && _expandedMappings.has(mapping.id);

    var indentStyle = options.isChild
      ? "padding-left:28px;background:rgba(var(--ms-accent-rgb),0.03);"
      : "";
    var ownershipBadge = options.isChild
      ? buildOwnershipBadge(options.actualSection, sectionKey)
      : "";
    var prefixH;
    if (hasChildren) {
      prefixH =
        '<i class="fa-solid fa-angle-' +
        (isExpanded ? "down" : "right") +
        ' ms-btag-toggle" data-mapping-id="' +
        mapping.id +
        '" style="cursor:pointer;font-size:11px;color:var(--ms-accent);width:14px;text-align:center;flex-shrink:0;padding:2px;"></i>';
    } else if (options.isChild) {
      prefixH =
        '<i class="fa-solid fa-link" style="font-size:9px;color:var(--ms-accent);opacity:0.5;width:14px;text-align:center;flex-shrink:0;"></i>';
    } else {
      prefixH = '<span style="width:14px;flex-shrink:0;"></span>';
    }
    var childCntBadge = hasChildren
      ? '<span style="font-size:9px;color:var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.10);padding:1px 5px;border-radius:3px;margin-left:4px;flex-shrink:0;">+' +
        childIds.length +
        "</span>"
      : "";

    return (
      '<div class="ms-batch-tag-item" data-row-tagid="' +
      t.id +
      '" style="' +
      indentStyle +
      '">' +
      prefixH +
      '<div class="ms-batch-tag-info">' +
      '<span class="ms-tag-chip" style="background:' +
      t.color +
      ';">' +
      esc(t.name) +
      "</span>" +
      childCntBadge +
      ownershipBadge +
      '<span class="ms-batch-tag-cnt">' +
      cnt +
      "/" +
      selectedIds.size +
      "</span>" +
      "</div>" +
      '<button class="ms-batch-tag-btn add-btn" data-tagid="' +
      t.id +
      '" title="添加"><i class="fa-solid fa-plus"></i></button>' +
      '<button class="ms-batch-tag-btn rm-btn" data-tagid="' +
      t.id +
      '" title="移除"><i class="fa-solid fa-minus"></i></button>' +
      "</div>"
    );
  }

  function buildSection(
    title,
    icon,
    iconColor,
    tags,
    sectionKey,
    badgeText,
    mappingInfo,
    usedIds,
  ) {
    var isOpen = _batchTagSectionState[sectionKey] !== false;
    var bodyH = "";
    if (tags.length === 0) {
      bodyH =
        '<div style="padding:10px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#666);font-style:italic;text-align:center;">' +
        (sectionKey === "used" ? "本组还没用过任何标签" : "没有其他可用标签") +
        "</div>";
    } else {
      tags.forEach(function (t) {
        bodyH += buildTagRow(t, mappingInfo, sectionKey);
        var mapping = mappingInfo.primaryMap[t.id];
        if (mapping && _expandedMappings.has(mapping.id)) {
          mappingInfo.children[mapping.id].forEach(function (childId) {
            var childTag = getTag(childId);
            if (!childTag) return;
            var actualSection = usedIds.has(childId) ? "used" : "global";
            bodyH += buildTagRow(childTag, mappingInfo, sectionKey, {
              isChild: true,
              actualSection: actualSection,
            });
          });
        }
      });
    }
    var _stickyCss =
      sectionKey === "used"
        ? "position:sticky;top:21px;z-index:9;background:rgba(var(--ms-accent-rgb),0.06);"
        : "background:rgba(var(--ms-accent-rgb),0.06);";
    return (
      '<div class="ms-btag-section" data-section-key="' +
      sectionKey +
      '">' +
      '<div class="ms-btag-section-header" data-toggle-section="' +
      sectionKey +
      '" style="display:flex;align-items:center;gap:6px;padding:7px 12px;' +
      _stickyCss +
      'cursor:pointer;user-select:none;border-bottom:1px solid var(--SmartThemeBorderColor,#444);font-size:11px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);">' +
      '<i class="fa-solid fa-angle-' +
      (isOpen ? "down" : "right") +
      '" style="font-size:10px;color:var(--ms-accent);width:10px;"></i>' +
      '<i class="fa-solid ' +
      icon +
      '" style="color:' +
      iconColor +
      ';font-size:11px;"></i>' +
      '<span style="flex:1;">' +
      title +
      "</span>" +
      '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-weight:normal;">' +
      badgeText +
      "</span>" +
      "</div>" +
      '<div class="ms-btag-section-body" data-section-body="' +
      sectionKey +
      '" style="display:' +
      (isOpen ? "block" : "none") +
      ';">' +
      bodyH +
      "</div>" +
      "</div>"
    );
  }

  function buildTagContent() {
    var usedIds = getUsedTagIds();
    var mappingInfo = getMappingInfo();
    var usedTags = [];
    var globalTags = [];
    data.settings.definedTags.forEach(function (t) {
      if (mappingInfo.memberMap[t.id]) return;
      if (usedIds.has(t.id)) usedTags.push(t);
      else globalTags.push(t);
    });

    var html =
      '<div style="position:sticky;top:-4px;z-index:10;">' +
      '<div style="padding:6px 12px;background:rgba(var(--ms-accent-rgb),0.06);font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量标签管理 · 已选 ' +
      selectedIds.size +
      " 项</div>" +
      "</div>";

    html += buildSection(
      "本组已使用标签",
      "fa-check-circle",
      "var(--ms-accent)",
      usedTags,
      "used",
      usedTags.length + " 个",
      mappingInfo,
      usedIds,
    );
    html += buildSection(
      "全局标签",
      "fa-tags",
      "var(--SmartThemeQuoteColor,#888)",
      globalTags,
      "global",
      globalTags.length + " 个",
      mappingInfo,
      usedIds,
    );

    html +=
      '<div class="ms-batch-tag-item" style="border-top:1px solid var(--SmartThemeBorderColor,#444);">' +
      '<div class="ms-batch-tag-info" style="cursor:pointer;color:var(--ms-accent);" id="ms-batch-new-tag"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建标签</div>' +
      "</div>";

    return html;
  }

  var $dd = openDropdown($p, buildTagContent(), { minWidth: "280px" });
  if (!$dd) return;
  $dd.off("click");

  $dd.on("click.btag", "[data-toggle-section]", function (e) {
    e.stopPropagation();
    var key = $(this).attr("data-toggle-section");
    var $body = $dd.find('[data-section-body="' + key + '"]');
    var $arrow = $(this).find(".fa-angle-down, .fa-angle-right");
    var isOpen = $body.is(":visible");
    if (isOpen) {
      $body.hide();
      $arrow.removeClass("fa-angle-down").addClass("fa-angle-right");
      _batchTagSectionState[key] = false;
    } else {
      $body.show();
      $arrow.removeClass("fa-angle-right").addClass("fa-angle-down");
      _batchTagSectionState[key] = true;
    }
  });
  $dd.on("click.btag", ".ms-btag-toggle", function (e) {
    e.stopPropagation();
    var mid = $(this).data("mapping-id");
    if (_expandedMappings.has(mid)) _expandedMappings.delete(mid);
    else _expandedMappings.add(mid);
    $dd.html(buildTagContent());
  });

  $dd.on("click.btag", "#ms-batch-new-tag", function (e) {
    e.stopPropagation();
    msPrompt("", {
      title: "新建标签",
      placeholder: "请输入新标签名称",
      validate: function (v) {
        if (!v || !v.trim()) return "名称不能为空";
        return null;
      },
    }).then(function (name) {
      if (!name || !name.trim()) return;
      createTag(name.trim());
      $dd.html(buildTagContent());
      refreshKeepingState();
    });
  });

  var _btagRefreshTimer = null;
  $dd.on("click.btag", ".ms-batch-tag-btn", function (e) {
    e.stopPropagation();
    var tid = $(this).data("tagid");
    var isAdd = $(this).hasClass("add-btn");
    var changed = 0;
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (!p) return;
      if (isAdd) {
        if (!p.tags.includes(tid)) {
          p.tags.push(tid);
          changed++;
        }
      } else {
        var before = p.tags.length;
        p.tags = p.tags.filter(function (id) {
          return id !== tid;
        });
        if (p.tags.length !== before) changed++;
      }
    });
    if (changed === 0) return;
    saveData();
    $dd.html(buildTagContent());

    if (_btagRefreshTimer) clearTimeout(_btagRefreshTimer);
    _btagRefreshTimer = setTimeout(function () {
      _btagRefreshTimer = null;
      refreshKeepingState();
    }, 400);
  });
}

function showBatchSeriesDropdown($p) {
  if ($p.find("#ms-dropdown").is(":visible")) {
    closeActiveDropdown();
    return;
  }
  const _selGroupIds = new Set();
  selectedIds.forEach(function (pid) {
    var p = getPrompt(pid);
    if (p) _selGroupIds.add(p.groupId || null);
  });
  var scopePrompts = data.prompts.filter(function (p) {
    return _selGroupIds.has(p.groupId || null);
  });
  var sortedScope = sortPrompts(scopePrompts);

  var seriesOptions = [];
  var seenOptKey = new Set();
  sortedScope.forEach(function (p) {
    var sn = String(p.series || "").trim();
    if (!sn) return;
    var g = p.groupId ? getGroup(p.groupId) : null;
    var isIP = g && isIPGroup(g);
    var charKey =
      isIP && p.character && isLocalCharKey(p.character) ? p.character : null;
    var optKey = sn + "||" + (charKey || "_") + "||" + (p.groupId || "_");
    if (seenOptKey.has(optKey)) return;
    seenOptKey.add(optKey);
    seriesOptions.push({ name: sn, charKey: charKey });
  });
  var seriesNames = [];
  var seenNameKey = new Set();
  sortedScope.forEach(function (p) {
    var sn = String(p.series || "").trim();
    if (!sn || seenNameKey.has(sn)) return;
    seenNameKey.add(sn);
    seriesNames.push(sn);
  });

  let html =
    '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置系列 · 已选 ' +
    selectedIds.size +
    " 项</div>";
  html +=
    '<div class="ms-dropdown-item" data-series-action="rename-existing" style="color:var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);"><i class="fa-solid fa-pen-to-square" style="margin-right:6px;font-size:11px;"></i>重命名已有系列…</div>';
  html +=
    '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
  if (seriesOptions.length > 0) {
    seriesOptions.forEach(function (opt) {
      var charPart = "";
      var charDataAttr = "";
      if (opt.charKey) {
        var dn = getCharDisplayName(opt.charKey);
        var ap = getCharAvatarPathSafe(opt.charKey);
        var avH = ap
          ? '<img src="' +
            esc(ap) +
            '" loading="lazy" style="width:12px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;margin:0 4px 0 6px;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="font-size:9px;margin:0 4px 0 6px;color:#b48cc8;opacity:0.7;"></i>';
        charPart =
          avH +
          '<span style="font-size:10px;color:#b48cc8;opacity:0.85;">' +
          esc(truncate(dn, 10)) +
          "</span>";
        charDataAttr = ' data-series-charkey="' + esc(opt.charKey) + '"';
      }
      html +=
        '<div class="ms-dropdown-item" data-series-name="' +
        esc(opt.name) +
        '"' +
        charDataAttr +
        '><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;margin-right:6px;font-size:11px;"></i>' +
        esc(opt.name) +
        charPart +
        "</div>";
    });
    html +=
      '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
  }
  html +=
    '<div class="ms-dropdown-item" data-series-action="custom" style="color:var(--ms-accent);"><i class="fa-solid fa-pen" style="margin-right:6px;font-size:11px;"></i>自定义系列名</div>';
  html +=
    '<div class="ms-dropdown-item" data-series-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;font-size:11px;"></i>清除系列</div>';

  var $dd = openDropdown($p, html);
  if (!$dd) return;
  $dd.off("click").on("click.series", ".ms-dropdown-item", function () {
    const seriesName = $(this).data("series-name");
    const charKey = $(this).attr("data-series-charkey");
    const action = $(this).data("series-action");

    if (action === "rename-existing") {
      closeActiveDropdown();
      if (seriesNames.length === 0) {
        toast("info", "暂时没有任何系列名");
        return;
      }
      var listHtml =
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;">选择要重命名的系列（会改掉所有使用该系列名的剧场）：</div>';
      listHtml +=
        '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
      seriesNames.forEach(function (sn) {
        var cnt = data.prompts.filter(function (pp) {
          return (pp.series || "").trim() === sn;
        }).length;
        listHtml +=
          '<div class="ms-modal-list-item" data-rename-src="' +
          esc(sn) +
          '"><div class="ms-modal-list-icon" style="background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);"><i class="fa-solid fa-layer-group"></i></div><div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
          esc(sn) +
          '</div><div class="ms-modal-list-desc">' +
          cnt +
          " 条剧场使用</div></div></div>";
      });
      listHtml += "</div>";
      showModal({
        title: "重命名系列",
        iconType: "info",
        icon: "fa-pen-to-square",
        modalStyle: "min-width:340px;max-width:90vw;width:400px;",
        body: listHtml,
        buttons: [{ text: "取消", value: null }],
        cancelValue: null,
        onShow: function ($overlay, close) {
          $overlay.on("click", ".ms-modal-list-item", function () {
            var src = $(this).attr("data-rename-src");
            if (!src) return;
            close("done");
            setTimeout(function () {
              msPrompt("把「" + src + "」重命名为：", {
                title: "新系列名",
                defaultValue: src,
                placeholder: "留空表示清除系列",
                validate: function (v) {
                  return null;
                },
              }).then(function (newName) {
                if (newName === null) return;
                newName = (newName || "").trim();
                if (newName === src) {
                  toast("info", "没有变化");
                  return;
                }
                var changed = 0;
                data.prompts.forEach(function (pp) {
                  if ((pp.series || "").trim() === src) {
                    pp.series = newName;
                    _invalidateLc(pp);
                    changed++;
                  }
                });
                saveData();
                toast(
                  "success",
                  newName
                    ? "已把 " + changed + " 条改为「" + newName + "」"
                    : "已清除 " + changed + " 条的系列",
                );
                refreshKeepingState();
              });
            }, 200);
          });
        },
      });
      return;
    }

    if (action === "custom") {
      closeActiveDropdown();
      msPrompt("", {
        title: "自定义系列名",
        placeholder: "留空可清除系列",
      }).then(function (name) {
        if (name === null) return;
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) {
            p.series = name.trim();
            _invalidateLc(p);
          }
        });
        saveData();
        toast(
          "success",
          name.trim() ? "已设置系列: " + name.trim() : "已清除系列",
        );
        refreshKeepingState();
      });
      return;
    } else if (action === "clear") {
      selectedIds.forEach(function (pid) {
        const p = getPrompt(pid);
        if (p) {
          p.series = "";
          _invalidateLc(p);
        }
      });
      saveData();
      toast("success", "已清除 " + selectedIds.size + " 项的系列");
    } else if (seriesName !== undefined) {
      var charChanged = 0;
      selectedIds.forEach(function (pid) {
        const p = getPrompt(pid);
        if (!p) return;
        p.series = seriesName;
        _invalidateLc(p);
        if (charKey) {
          var pg = p.groupId ? getGroup(p.groupId) : null;
          if (pg && isIPGroup(pg) && p.character !== charKey) {
            p.character = charKey;
            charChanged++;
          }
        }
      });
      if (charChanged > 0) _invalidateCharGroupCache();
      saveData();
      var msg = "已设置系列: " + seriesName;
      if (charChanged > 0) msg += "（" + charChanged + " 项已改绑到该角色）";
      toast("success", msg);
    }
    closeActiveDropdown();
    refreshKeepingState();
  });
}

function showBatchCharacterDropdown($p) {
  if ($p.find("#ms-dropdown").is(":visible")) {
    closeActiveDropdown();
    return;
  }
  if (selectedIds.size === 0) return;
  const curKey = getCurrentCharKeySafe();
  const curName = curKey ? getCharDisplayName(curKey) : "";
  let html =
    '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置角色 · 已选 ' +
    selectedIds.size +
    " 项</div>";
  if (curKey) {
    html +=
      '<div class="ms-dropdown-item" data-bchar-action="bind-current" style="color:var(--ms-accent);"><i class="fa-solid fa-user-check" style="margin-right:6px;"></i>绑定到当前角色 (' +
      esc(truncate(curName, 14)) +
      ")</div>";
  }
  html +=
    '<div class="ms-dropdown-item" data-bchar-action="search"><i class="fa-solid fa-magnifying-glass" style="margin-right:6px;"></i>搜索角色绑定</div>';
  html +=
    '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
  html +=
    '<div class="ms-dropdown-item" data-bchar-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;"></i>解绑全部</div>';
  var $dd = openDropdown($p, html, { minWidth: "200px" });
  if (!$dd) return;
  $dd.off("click").on("click.bchar", ".ms-dropdown-item", function () {
    const action = $(this).data("bchar-action");
    if (action === "bind-current") {
      if (!curKey) return;
      selectedIds.forEach(function (pid) {
        const p = getPrompt(pid);
        if (p) p.character = curKey;
      });
      saveData();
      toast("success", "已绑定 " + selectedIds.size + " 项到 " + curName);
      closeActiveDropdown();
      refreshKeepingState();
    } else if (action === "clear") {
      selectedIds.forEach(function (pid) {
        const p = getPrompt(pid);
        if (p) p.character = "";
      });
      saveData();
      toast("success", "已解绑 " + selectedIds.size + " 项");
      closeActiveDropdown();
      refreshKeepingState();
    } else if (action === "search") {
      closeActiveDropdown();
      let allKeys = [];
      try {
        if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
          allKeys = SillyTavern.characters
            .map(function (c) {
              return c.avatar;
            })
            .filter(Boolean);
        }
      } catch (e) {}
      if (allKeys.length === 0)
        allKeys = Object.keys(getAllCharactersWithStages());
      if (allKeys.length === 0) {
        toast("warning", "没有可绑定的角色");
        return;
      }
      var ipInfo = null;
      try {
        var groupCount = {};
        selectedIds.forEach(function (pid) {
          var p = getPrompt(pid);
          if (!p || !p.groupId) return;
          groupCount[p.groupId] = (groupCount[p.groupId] || 0) + 1;
        });
        var topGid = null,
          topCnt = 0;
        Object.keys(groupCount).forEach(function (gid) {
          if (groupCount[gid] > topCnt) {
            topCnt = groupCount[gid];
            topGid = gid;
          }
        });
        if (topGid) {
          var _topG = getGroup(topGid);
          if (_topG && isIPGroup(_topG)) {
            ipInfo = { name: _topG.name, keys: getIPGroupCharKeys(_topG) };
          }
        }
      } catch (e) {}
      showModal({
        title: "绑定角色 (已选 " + selectedIds.size + " 项)",
        iconType: "info",
        icon: "fa-user-tag",
        modalStyle: "min-width:380px;max-width:90vw;width:420px;",
        body: function () {
          return (
            '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-batch-char-search">' +
            '<div id="ms-batch-char-list">' +
            buildCharPickerListHTML("", allKeys, null, ipInfo) +
            "</div>"
          );
        },
        buttons: [{ text: "取消", value: null }],
        cancelValue: null,
        onShow: function ($overlay, close) {
          $overlay.find("#ms-batch-char-search").focus();
          $overlay.on("input", "#ms-batch-char-search", function () {
            $overlay
              .find("#ms-batch-char-list")
              .html(
                buildCharPickerListHTML($(this).val(), allKeys, null, ipInfo),
              );
          });
          $overlay.on("click", ".ms-modal-list-item", function () {
            var targetKey = $(this).attr("data-target-key");
            if (!targetKey) return;
            selectedIds.forEach(function (pid) {
              const p = getPrompt(pid);
              if (p) p.character = targetKey;
            });
            saveData();
            toast(
              "success",
              "已绑定 " +
                selectedIds.size +
                " 项到 " +
                getCharDisplayName(targetKey),
            );
            close("done");
            refreshKeepingState();
          });
        },
      });
    }
  });
}

function showBatchAuthorDialog() {
  const $p = $("#" + PANEL_ID);
  if ($p.find("#ms-dropdown").is(":visible")) {
    closeActiveDropdown();
    return;
  }
  var groupIds = new Set();
  selectedIds.forEach(function (pid) {
    var p = getPrompt(pid);
    if (p && p.groupId) groupIds.add(p.groupId);
  });
  var authorsInGroups = new Set();
  data.prompts.forEach(function (p) {
    if (p.author && p.author.trim() && p.groupId && groupIds.has(p.groupId)) {
      authorsInGroups.add(p.author.trim());
    }
  });
  var allAuthors = new Set();
  data.prompts.forEach(function (p) {
    if (p.author && p.author.trim()) allAuthors.add(p.author.trim());
  });
  var sortedGroupAuthors = Array.from(authorsInGroups).sort();
  var sortedOtherAuthors = Array.from(allAuthors)
    .filter(function (a) {
      return !authorsInGroups.has(a);
    })
    .sort();

  let html =
    '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置作者 · 已选 ' +
    selectedIds.size +
    " 项</div>";
  if (sortedGroupAuthors.length > 0) {
    html +=
      '<div style="padding:4px 12px 2px;font-size:10px;color:var(--ms-accent);font-weight:600;"><i class="fa-solid fa-folder" style="margin-right:3px;font-size:9px;"></i>本分组已有作者</div>';
    sortedGroupAuthors.forEach(function (name) {
      html +=
        '<div class="ms-dropdown-item" data-author-value="' +
        esc(name) +
        '"><i class="fa-solid fa-user" style="color:var(--ms-accent);opacity:0.6;margin-right:6px;font-size:11px;"></i>' +
        esc(name) +
        "</div>";
    });
  }
  if (sortedOtherAuthors.length > 0) {
    html +=
      '<div style="padding:4px 12px 2px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-weight:600;"><i class="fa-solid fa-list" style="margin-right:3px;font-size:9px;"></i>其他已有作者</div>';
    sortedOtherAuthors.forEach(function (name) {
      html +=
        '<div class="ms-dropdown-item" data-author-value="' +
        esc(name) +
        '"><i class="fa-solid fa-user" style="opacity:0.5;margin-right:6px;font-size:11px;"></i>' +
        esc(name) +
        "</div>";
    });
  }
  if (sortedGroupAuthors.length > 0 || sortedOtherAuthors.length > 0) {
    html +=
      '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
  }
  html +=
    '<div class="ms-dropdown-item" data-author-action="custom" style="color:var(--ms-accent);"><i class="fa-solid fa-pen" style="margin-right:6px;font-size:11px;"></i>自定义作者名</div>';
  html +=
    '<div class="ms-dropdown-item" data-author-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;font-size:11px;"></i>清除作者</div>';

  var $dd = openDropdown($p, html, { minWidth: "200px" });
  if (!$dd) return;

  function applyAuthor(authorName) {
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (p) {
        p.author = authorName;
        _invalidateLc(p);
      }
    });
    saveData();
    toast(
      "success",
      authorName
        ? "已为 " + selectedIds.size + " 项设置作者: " + authorName
        : "已清除 " + selectedIds.size + " 项的作者",
    );
    refreshKeepingState();
  }

  $dd.off("click").on("click.author", ".ms-dropdown-item", function () {
    var val = $(this).data("author-value");
    var action = $(this).data("author-action");
    if (action === "custom") {
      closeActiveDropdown();
      msPrompt("", {
        title: "自定义作者名",
        placeholder: "留空可清除作者",
        icon: "fa-user-pen",
      }).then(function (name) {
        if (name === null) return;
        applyAuthor(name.trim());
      });
      return;
    }
    if (action === "clear") {
      applyAuthor("");
    } else if (val !== undefined) {
      applyAuthor(String(val));
    }
    closeActiveDropdown();
  });
}

function buildCharPickerListHTML(kw, allKeys, currentKey, ipGroupInfo) {
  var lkw = (kw || "").trim().toLowerCase();
  var matched = allKeys.filter(function (k) {
    if (!lkw) return true;
    return (
      getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0 ||
      String(k).toLowerCase().indexOf(lkw) >= 0
    );
  });

  var ipKeys = [];
  var ipName = "";
  if (!lkw && ipGroupInfo && ipGroupInfo.keys && ipGroupInfo.keys.length > 0) {
    ipKeys = ipGroupInfo.keys.filter(function (k) {
      return allKeys.indexOf(k) >= 0;
    });
    ipName = ipGroupInfo.name || "";
  }

  if (matched.length === 0 && ipKeys.length === 0) {
    return '<div style="padding:20px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的角色</div>';
  }

  function renderOneChar(k, isFromIP) {
    var dn = getCharDisplayName(k);
    var fname = String(k).replace(/\.[^.]+$/, "");
    var ap = getCharAvatarPathSafe(k);
    var iconHtml = ap
      ? '<img src="' +
        esc(ap) +
        '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.onerror=null;">'
      : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:12px;"></i>';
    var isCur = currentKey === k;
    var extraBg = "";
    if (isCur) extraBg = "background:rgba(var(--ms-accent-rgb),0.15);";
    else if (isFromIP) extraBg = "background:rgba(var(--ms-accent-rgb),0.05);";
    return (
      '<div class="ms-modal-list-item" data-target-key="' +
      esc(k) +
      '" style="' +
      extraBg +
      '">' +
      '<div class="ms-modal-list-icon">' +
      iconHtml +
      "</div>" +
      '<div class="ms-modal-list-info">' +
      '<div class="ms-modal-list-name">' +
      esc(dn) +
      (isCur
        ? ' <i class="fa-solid fa-check" style="color:var(--ms-accent);font-size:10px;margin-left:4px;"></i>'
        : "") +
      "</div>" +
      '<div class="ms-modal-list-desc">' +
      esc(fname) +
      "</div>" +
      "</div></div>"
    );
  }

  var html =
    '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
  var shown = new Set();
  if (ipKeys.length > 0) {
    html +=
      '<div style="font-size:10px;color:var(--ms-accent);padding:6px 8px 4px;font-weight:600;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-layer-group" style="font-size:9px;"></i>本分组成员（' +
      esc(ipName) +
      "）</div>";
    ipKeys.forEach(function (k) {
      html += renderOneChar(k, true);
      shown.add(k);
    });
    html +=
      '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);padding:8px 8px 4px;font-weight:600;border-top:1px solid rgba(255,255,255,0.04);margin-top:4px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-list" style="font-size:9px;"></i>全部角色</div>';
  }
  var cnt = 0;
  for (var i = 0; i < matched.length && cnt < 100; i++) {
    if (shown.has(matched[i])) continue;
    html += renderOneChar(matched[i], false);
    cnt++;
  }
  var remaining = matched.length - shown.size;
  if (remaining > 100) {
    html +=
      '<div style="padding:8px;text-align:center;font-size:10px;color:var(--SmartThemeQuoteColor,#666);">仅显示前 100 个，请输入关键词缩小范围</div>';
  }
  html += "</div>";
  return html;
}

function showBindCharacterDropdown($p, pid, onChangeCallback) {
  const pr = getPrompt(pid);
  if (!pr) return;
  var allKeys = [];
  try {
    if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
      allKeys = SillyTavern.characters
        .map(function (c) {
          return c.avatar;
        })
        .filter(Boolean);
    }
  } catch (e) {}
  if (allKeys.length === 0) allKeys = Object.keys(getAllCharactersWithStages());
  if (allKeys.length === 0) {
    toast("warning", "没有可绑定的角色");
    return;
  }
  var ipInfo = null;
  if (pr.groupId) {
    var g = getGroup(pr.groupId);
    if (g && isIPGroup(g)) {
      ipInfo = { name: g.name, keys: getIPGroupCharKeys(g) };
    }
  }
  showModal({
    title: "绑定角色：" + truncate(pr.title, 20),
    iconType: "info",
    icon: "fa-user-tag",
    modalStyle: "min-width:380px;max-width:90vw;width:420px;",
    body: function () {
      var curBindHtml = "";
      if (pr.character) {
        var _cbDn = getCharDisplayName(pr.character);
        var _cbAp = getCharAvatarPathSafe(pr.character);
        var _cbIcon = _cbAp
          ? '<img src="' +
            esc(_cbAp) +
            '" style="width:20px;height:20px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="font-size:11px;margin-right:4px;opacity:0.6;"></i>';
        curBindHtml =
          '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(var(--ms-accent-rgb),0.08);border:1px solid rgba(var(--ms-accent-rgb),0.2);border-radius:6px;margin-bottom:8px;font-size:12px;">' +
          '<span style="flex:1;">当前绑定：' +
          _cbIcon +
          esc(_cbDn) +
          "</span>" +
          '<button class="ms-tbtn" id="ms-bind-unbind-btn" style="padding:3px 10px;font-size:11px;color:var(--ms-danger);border-color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:3px;"></i>解绑</button>' +
          "</div>";
      }
      return (
        curBindHtml +
        '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-bind-char-search">' +
        '<div id="ms-bind-char-list">' +
        buildCharPickerListHTML("", allKeys, pr.character, ipInfo) +
        "</div>"
      );
    },
    buttons: [{ text: "取消", value: null }],
    cancelValue: null,
    onShow: function ($overlay, close) {
      $overlay.find("#ms-bind-char-search").focus();
      $overlay.on("input", "#ms-bind-char-search", function () {
        $overlay
          .find("#ms-bind-char-list")
          .html(
            buildCharPickerListHTML(
              $(this).val(),
              allKeys,
              pr.character,
              ipInfo,
            ),
          );
      });
      $overlay.on("click", "#ms-bind-unbind-btn", function () {
        updatePrompt(pid, { character: "" });
        toast("success", "已解绑");
        close("done");
        if (typeof onChangeCallback === "function") onChangeCallback();
      });
      $overlay.on("click", ".ms-modal-list-item", function () {
        var k = $(this).attr("data-target-key");
        if (!k) return;
        updatePrompt(pid, { character: k });
        recordRecentBoundChar(k);
        toast("success", "已绑定到 " + getCharDisplayName(k));
        close("done");
        if (typeof onChangeCallback === "function") onChangeCallback();
      });
    },
  });
}

function closeAllSwipes(except) {
  var $sp = $("#" + PANEL_ID);
  $sp.find(".ms-swipe-wrap.ms-swiped").each(function () {
    if (except && this === except[0]) return;
    $(this).removeClass("ms-swiped").find(".ms-swipe-row").css("transform", "");
  });
}
