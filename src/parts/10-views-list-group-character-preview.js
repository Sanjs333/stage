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
  const filtered = sortPrompts(filterPrompts(searchPrompts(list, searchQuery)));
  const isIP = g && isIPGroup(g);
  $p.find("#ms-title").text(title);
  if (g && g.note) {
    var $infoBtn = $p.find("#ms-title-info");
    var $noteInline = $p.find("#ms-title-note-inline");
    var $notePanel = $p.find("#ms-title-note-panel");
    var rawNote = String(g.note || "").trim();
    var _noteLinkStore = [];
    var _protectedNote = rawNote.replace(
      /(!?\[[^\]]*\]\([^)]+\))/g,
      function (m) {
        _noteLinkStore.push(m);
        return "\u0000MSLINK" + (_noteLinkStore.length - 1) + "\u0000";
      },
    );
    var noteText = _protectedNote.replace(
      /(^|[\s(（])((?:https?:\/\/|www\.)[^\s<>"'）)]+)/g,
      function (m, prefix, url) {
        var href = url.indexOf("www.") === 0 ? "https://" + url : url;
        return prefix + "[" + url + "](" + href + ")";
      },
    );
    noteText = noteText.replace(/\u0000MSLINK(\d+)\u0000/g, function (m, i) {
      return _noteLinkStore[parseInt(i)];
    });
    $notePanel.html(
      '<div class="ms-preview-content">' + renderMd(noteText) + "</div>",
    );
    var noteHasRichContent =
      /[\r\n]/.test(rawNote) ||
      /\[[^\]]+\]\([^)]+\)/.test(rawNote) ||
      /(?:https?:\/\/|www\.)/.test(rawNote);
    $noteInline.text(rawNote).data("fits-inline", false);
    requestAnimationFrame(function () {
      if (!$noteInline.length) return;
      $noteInline.addClass("open");
      var fitsInline =
        !noteHasRichContent &&
        $noteInline[0] &&
        $noteInline[0].scrollWidth <= $noteInline[0].clientWidth + 1;
      $noteInline.removeClass("open").data("fits-inline", fitsInline);
    });
    $infoBtn
      .css("display", "flex")
      .off("click.ms-note")
      .on("click.ms-note", function (e) {
        e.preventDefault();
        e.stopPropagation();
        $infoBtn.toggleClass("open");
        var showInline = $noteInline.data("fits-inline") === true;
        if (!noteHasRichContent && $noteInline[0]) {
          $noteInline.addClass("open");
          showInline =
            $noteInline[0].scrollWidth <= $noteInline[0].clientWidth + 1;
          $noteInline.removeClass("open").data("fits-inline", showInline);
        }
        if ($infoBtn.hasClass("open")) {
          if (showInline) $noteInline.addClass("open");
          else $notePanel.addClass("open");
        } else {
          $noteInline.removeClass("open");
          $notePanel.removeClass("open");
        }
      });
  }
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

  var bodyHtml = buildRangeModeHint();
  var hasAnyCharBind = list.some(function (p) {
    return p.character && isLocalCharKey(p.character);
  });
  var usingPartitioned =
    hasAnyCharBind &&
    !searchQuery &&
    filterState.includeTags.length === 0 &&
    filterState.excludeTags.length === 0 &&
    !filterState.onlyCurrentChar;

  if (isIP && !searchQuery) {
    var memberH =
      '<div style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
    var _memberKeys = getIPGroupCharKeys(g);
    memberH +=
      '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);"><i class="fa-solid fa-users" style="margin-right:3px;"></i>成员角色 (' +
      _memberKeys.length +
      ")</span>";
    _memberKeys.forEach(function (k) {
      var dn = getCharDisplayName(k);
      var ap = getCharAvatarPathSafe(k);
      var av = ap
        ? '<img src="' +
          esc(ap) +
          '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:3px;" onerror="this.style.display=\'none\';this.onerror=null;">'
        : '<i class="fa-solid fa-user" style="font-size:10px;margin-right:3px;opacity:0.6;"></i>';
      memberH +=
        '<span class="ms-tag-toggle" data-nav-char="' +
        esc(k) +
        '" title="点击查看 ' +
        esc(dn) +
        ' 的剧场，长按切换到 TA 的聊天档" style="padding:2px 8px;font-size:11px;cursor:pointer;">' +
        av +
        esc(dn) +
        "</span>";
    });
    memberH += "</div>";
    bodyHtml += memberH;
  }

  if (filtered.length === 0) {
    bodyHtml +=
      '<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>';
  } else if (usingPartitioned) {
    var generalPrompts = filtered.filter(function (p) {
      return !p.character;
    });
    var charPrompts = {};
    filtered.forEach(function (p) {
      if (p.character) {
        if (!charPrompts[p.character]) charPrompts[p.character] = [];
        charPrompts[p.character].push(p);
      }
    });
    if (generalPrompts.length > 0) {
      if (!data.settings.generalCollapsed) data.settings.generalCollapsed = {};
      var _genCollapsed = !!data.settings.generalCollapsed[gid];
      var _genSid = "ms-general-" + simpleHash(gid || "_");
      bodyHtml +=
        '<div class="ms-series-header" data-general-toggle="' +
        gid +
        '" data-general-body="' +
        _genSid +
        '" style="padding:6px 14px;background:rgba(var(--ms-accent-rgb),0.04);">' +
        '<i class="fa-solid fa-angle-right ms-series-arrow' +
        (_genCollapsed ? "" : " open") +
        '"></i>' +
        '<i class="fa-solid fa-scroll" style="color:var(--ms-accent);font-size:12px;opacity:0.8;"></i>' +
        '<span class="ms-series-title" style="font-weight:500;">通用剧场</span>' +
        '<span class="ms-series-cnt">' +
        generalPrompts.length +
        " 条</span></div>" +
        '<div class="ms-series-body' +
        (_genCollapsed ? "" : " open") +
        '" id="' +
        _genSid +
        '">' +
        renderGroupBodyWithSeries(generalPrompts) +
        "</div>";
    }
    var orderedKeys = [];
    var currentKey2 = getCurrentCharKeySafe();
    var _userOrder = g ? getCharDisplayOrder(g) : [];
    var _hasUserOrder =
      g && Array.isArray(g.charDisplayOrder) && g.charDisplayOrder.length > 0;
    if (!_hasUserOrder && currentKey2 && charPrompts[currentKey2]) {
      orderedKeys.push(currentKey2);
    }
    _userOrder.forEach(function (k) {
      if (orderedKeys.indexOf(k) < 0 && charPrompts[k]) orderedKeys.push(k);
    });
    Object.keys(charPrompts).forEach(function (k) {
      if (orderedKeys.indexOf(k) < 0) orderedKeys.push(k);
    });
    orderedKeys.forEach(function (k) {
      var ps = charPrompts[k];
      var dn = getCharDisplayName(k);
      var ap = getCharAvatarPathSafe(k);
      var sid = "ms-charsec-" + simpleHash(k);
      var avH = ap
        ? '<img src="' +
          esc(ap) +
          '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
        : '<i class="fa-solid fa-user" style="font-size:11px;opacity:0.6;"></i>';
      var isCur = k === currentKey2;
      var cnt2 = ps.length;
      bodyHtml +=
        '<div class="ms-series-group">' +
        '<div class="ms-series-header" data-charsec-id="' +
        sid +
        '" style="padding:6px 14px;">' +
        '<i class="fa-solid fa-angle-right ms-series-arrow' +
        (isCur ? " open" : "") +
        '"></i>' +
        avH +
        '<span class="ms-series-title" style="font-weight:500;' +
        (isCur ? "color:var(--ms-accent);" : "") +
        '">' +
        esc(dn) +
        (isCur
          ? ' <span style="font-size:9px;opacity:0.7;">(当前)</span>'
          : "") +
        "</span>" +
        '<span class="ms-series-cnt">' +
        cnt2 +
        " 条</span>" +
        "</div>" +
        '<div class="ms-series-body' +
        (isCur ? " open" : "") +
        '" id="' +
        sid +
        '">' +
        renderGroupBodyWithSeries(ps) +
        "</div></div>";
    });
  } else {
    bodyHtml += _applyPagedRender(getGroupBodySeriesBlocks(filtered));
  }

  $p.find("#ms-body").html(bodyHtml);
  $p.find("#ms-footer")
    .html(
      selectMode
        ? buildBatchFooter()
        : `<span>${filtered.length}/${list.length} 条${isIP ? " · IP 分组" : ""}</span>` +
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
  $p.find("#ms-body").on(
    "pointerdown.ms",
    ".ms-tag-toggle[data-nav-char]",
    function (e) {
      var $el = $(this);
      var charKey = $el.data("nav-char");
      if (!charKey) return;
      var sx = e.clientX || 0,
        sy = e.clientY || 0;
      var timer = setTimeout(function () {
        timer = null;
        $el.data("ms-mblp-fired", true);
        if (navigator.vibrate) navigator.vibrate(30);
        try {
          if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
            var charIdx = SillyTavern.characters.findIndex(function (c) {
              return c && c.avatar === charKey;
            });
            if (
              charIdx >= 0 &&
              typeof SillyTavern.selectCharacterById === "function"
            ) {
              if (String(SillyTavern.characterId) === String(charIdx)) {
                toast(
                  "info",
                  "现在就在「" + getCharDisplayName(charKey) + "」的聊天里哦",
                );
              } else {
                SillyTavern.selectCharacterById(charIdx);
                toast(
                  "success",
                  "已切换到「" + getCharDisplayName(charKey) + "」的聊天",
                );
              }
            } else {
              toast("warning", "本地没有这张角色卡");
            }
          } else {
            toast("warning", "无法切换角色");
          }
        } catch (err) {
          toast("error", "切换失败: " + err.message);
        }
      }, 600);
      var onMove = function (ev) {
        if (!timer) return;
        var dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (dx * dx + dy * dy > 100) {
          clearTimeout(timer);
          timer = null;
        }
      };
      var onUp = function () {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        $p.off("pointermove.ms-mblp pointerup.ms-mblp pointercancel.ms-mblp");
      };
      $p.off("pointermove.ms-mblp pointerup.ms-mblp pointercancel.ms-mblp")
        .on("pointermove.ms-mblp", onMove)
        .on("pointerup.ms-mblp pointercancel.ms-mblp", onUp);
    },
  );
  $p.find("#ms-body").on("click.ms", "[data-nav-char]", function () {
    if ($(this).data("ms-mblp-fired")) {
      $(this).removeData("ms-mblp-fired");
      return;
    }
    navigateTo({ name: "character", charKey: $(this).data("nav-char") });
  });

  $p.find("#ms-body").on("click.ms", "[data-general-toggle]", function () {
    var ggid = $(this).data("general-toggle");
    var bodyId = $(this).data("general-body");
    $(this).find(".ms-series-arrow").toggleClass("open");
    $p.find("#" + bodyId).toggleClass("open");
    if (!data.settings.generalCollapsed) data.settings.generalCollapsed = {};
    data.settings.generalCollapsed[ggid] = !$p
      .find("#" + bodyId)
      .hasClass("open");
    saveData();
  });

  $p.find("#ms-body").on("click.ms", "[data-charsec-id]", function () {
    var sid = $(this).data("charsec-id");
    $(this).find(".ms-series-arrow").toggleClass("open");
    $p.find("#" + sid).toggleClass("open");
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
  var _starredHtml =
    list.length > 0
      ? _applyPagedRender(getPromptCardBlocks(list, true))
      : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`;
  $p.find("#ms-body").html(buildRangeModeHint() + _starredHtml);
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
  var _recentHtml =
    list.length > 0
      ? _applyPagedRender(getPromptCardBlocks(list, true))
      : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`;
  $p.find("#ms-body").html(_recentHtml);
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
      msConfirm("确定清空所有最近使用记录吗？\n\n（不会影响使用次数统计）", {
        title: "清空最近使用",
        dangerous: true,
        okText: "清空",
      }).then(function (ok) {
        if (!ok) return;
        data.prompts.forEach(function (p) {
          p.lastUsedAt = null;
        });
        saveData();
        toast("success", "已清空");
        renderRecent();
      });
    },
  );
}

function renderCharacters() {
  const $p = $("#" + PANEL_ID);
  $p.find("#ms-title").text("角色专属");
  $p.find("#ms-toolbar").html(
    buildToolbar({
      back: true,
      search: true,
      searchPlaceholder: "搜索角色名...",
    }),
  );
  const charMap = getAllCharactersWithStages();
  const currentKey = getCurrentCharKeySafe();
  const currentName = currentKey ? getCharDisplayName(currentKey) : null;
  let keys = Object.keys(charMap);
  if (searchQuery) {
    const lq = searchQuery.toLowerCase();
    keys = keys.filter(function (k) {
      return getCharDisplayName(k).toLowerCase().indexOf(lq) >= 0;
    });
  }
  keys.sort(function (a, b) {
    var au = 0,
      bu = 0;
    (charMap[a] || []).forEach(function (p) {
      au += p.usageCount || 0;
    });
    (charMap[b] || []).forEach(function (p) {
      bu += p.usageCount || 0;
    });
    if (au !== bu) return bu - au;
    return getCharDisplayName(a).localeCompare(getCharDisplayName(b));
  });
  let html = "";
  if (currentKey && !searchQuery) {
    const myList = charMap[currentKey] || [];
    if (myList.length > 0) {
      html += `<div class="ms-nav-item" data-nav-char-cur="exists" style="background:rgba(var(--ms-accent-rgb),0.06);"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.18);color:var(--ms-accent);"><i class="fa-solid fa-user-check"></i></div><div class="ms-nav-info"><div class="ms-nav-title">当前角色：${esc(currentName)}</div><div class="ms-nav-note">查看 ${myList.length} 条专属剧场</div></div><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    } else {
      html += `<div class="ms-nav-item" data-nav-char-cur="empty" style="background:rgba(var(--ms-accent-rgb),0.06);"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.18);color:var(--ms-accent);"><i class="fa-solid fa-user-plus"></i></div><div class="ms-nav-info"><div class="ms-nav-title">为「${esc(currentName)}」创建专属</div><div class="ms-nav-note">还没有专属剧场，去新建一条？</div></div><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    }
    html += '<div class="ms-divider"></div>';
  } else if (!currentKey && !searchQuery) {
    html += `<div style="padding:8px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>当前未打开任何角色卡</div>`;
  }
  var _ipGroupsForList = getIPGroups();
  if (!searchQuery && _ipGroupsForList.length > 0) {
    html += '<div class="ms-section-label">IP 分组</div>';
    _ipGroupsForList.forEach(function (cg) {
      var charsInGroup = getIPGroupCharKeys(cg).filter(function (k) {
        return charMap[k];
      });
      var totalStages = 0;
      charsInGroup.forEach(function (k) {
        totalStages += (charMap[k] || []).length;
      });
      var avatar = buildGroupAvatarHTML(cg, 32);
      html +=
        '<div class="ms-nav-item" data-nav-cg="' +
        cg.id +
        '">' +
        avatar +
        '<div class="ms-nav-info"><div class="ms-nav-title">' +
        esc(cg.name) +
        "</div>" +
        '<div class="ms-nav-note">' +
        charsInGroup.length +
        " 个角色 · " +
        totalStages +
        " 条剧场</div></div>" +
        '<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>';
    });
    html += '<div class="ms-divider"></div>';
  }
  var groupedKeys = new Set();
  _ipGroupsForList.forEach(function (cg) {
    getIPGroupCharKeys(cg).forEach(function (k) {
      groupedKeys.add(k);
    });
  });
  var ungroupedKeys = keys.filter(function (k) {
    return !groupedKeys.has(k);
  });
  var hasCharGroups = _ipGroupsForList.length > 0;
  if (!searchQuery && hasCharGroups && ungroupedKeys.length > 0) {
    html += '<div class="ms-section-label">未分组角色</div>';
  }
  var displayKeys = searchQuery ? keys : hasCharGroups ? ungroupedKeys : keys;
  if (displayKeys.length === 0 && !hasCharGroups) {
    if (searchQuery) {
      html += `<div class="ms-empty"><i class="fa-solid fa-magnifying-glass"></i>没有匹配「${esc(searchQuery)}」的角色</div>`;
    } else {
      html += `<div class="ms-empty"><i class="fa-solid fa-user-tag"></i>还没有任何角色专属剧场<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">在剧场详情页可以绑定角色</span></div>`;
    }
  } else {
    displayKeys.forEach(function (key) {
      const list = charMap[key];
      const displayName = getCharDisplayName(key);
      const avatarPath = getCharAvatarPathSafe(key);
      let avatarH;
      if (avatarPath) {
        avatarH = `<div class="ms-nav-icon" style="padding:0;overflow:hidden;background:rgba(180,140,200,0.12);"><img src="${esc(avatarPath)}" loading="eager" decoding="sync" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.onerror=null;"></div>`;
      } else {
        avatarH = `<div class="ms-nav-icon" style="background:rgba(180,140,200,0.12);color:#b48cc8;"><i class="fa-solid fa-user"></i></div>`;
      }
      var totalUse = 0;
      list.forEach(function (p) {
        totalUse += p.usageCount || 0;
      });
      var nameH = searchQuery
        ? highlightText(displayName, searchQuery)
        : esc(displayName);
      var noteH =
        totalUse > 0
          ? `<div class="ms-nav-note">互动 ${totalUse} 次</div>`
          : "";
      var fnameTip = String(key).replace(/\.[^.]+$/, "");
      html += `<div class="ms-nav-item" data-nav-char="${esc(key)}" title="${esc(fnameTip)}">${avatarH}<div class="ms-nav-info"><div class="ms-nav-title">${nameH}</div>${noteH}</div><span class="ms-nav-cnt">${list.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    });
  }
  $p.find("#ms-body").html(html);
  const totalChars = Object.keys(charMap).length;
  const totalExclusive = data.prompts.filter(function (p) {
    return p.character && p.character.trim();
  }).length;
  $p.find("#ms-footer")
    .html(
      searchQuery
        ? `<span>找到 ${keys.length} / ${totalChars} 个角色</span>`
        : `<span>${totalChars} 个角色 · 共 ${totalExclusive} 条专属</span><div class="ms-footer-btns"><a data-action="manage-ipgroups"><i class="fa-solid fa-layer-group"></i> 管理 IP 分组</a></div>`,
    )
    .show();
  bindAllEvents();
  $p.find("#ms-body").on(
    "click.ms",
    "[data-nav-char-cur='exists']",
    function () {
      navigateTo({ name: "character", charKey: currentKey });
    },
  );
  $p.find("#ms-body").on(
    "click.ms",
    "[data-nav-char-cur='empty']",
    function () {
      navigateTo({
        name: "edit",
        promptId: null,
        defaultCharacter: currentKey,
      });
    },
  );
  $p.find("#ms-body").on("click.ms", "[data-nav-char]", function () {
    navigateTo({ name: "character", charKey: $(this).data("nav-char") });
  });
  $p.find("#ms-body").on("click.ms", "[data-nav-cg]", function () {
    navigateTo({ name: "group", groupId: $(this).data("nav-cg") });
  });
  $p.find("#ms-footer").on(
    "click.ms",
    "[data-action='manage-ipgroups']",
    function () {
      navigateTo({ name: "groups" });
    },
  );
}

function renderCharacter(v) {
  const $p = $("#" + PANEL_ID);
  const key = v.charKey || v.charName;
  const list = getPromptsByCharacter(key);
  if (list.length === 0) {
    navigateBack();
    return;
  }
  const filtered = sortPrompts(filterPrompts(searchPrompts(list, searchQuery)));
  const displayName = getCharDisplayName(key);
  var charBd = (data.settings.charBirthdays || {})[key] || "";
  var charCg = getCharGroupOfChar(key);
  var isOwnBd = !!((data.settings.ownBirthdays || {})[key] === true);
  var canEditBd = !charBd || isOwnBd;
  var isBdToday = isCharBdToday(key);
  if (isBdToday) markTodayBirthdaysUnlocked();
  var bdVersions = getDisplayableBdVersions(key);
  var hasAnyBd = bdVersions.length > 0;
  var hasShowableBd = bdVersions.some(function (it) {
    return it.unlocked;
  });
  var hasOwnBdVer = bdVersions.some(function (it) {
    return it.data.isOwn === true;
  });
  var canShowPreview = hasShowableBd;
  var isLockedByDate = hasAnyBd && !hasShowableBd;
  $p.find("#ms-title").text(displayName);
  $p.find("#ms-toolbar").html(
    buildToolbar({
      back: true,
      search: true,
      filter: true,
      select: true,
      sort: true,
      random: list.length > 0,
      add: true,
      addId: "ms-btn-new-in-char",
    }),
  );
  var _charHtml =
    filtered.length > 0
      ? _applyPagedRender(getGroupBodySeriesBlocks(filtered))
      : `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>`;
  $p.find("#ms-body").html(buildRangeModeHint() + _charHtml);
  var metaParts = [];
  if (charCg)
    metaParts.push(
      '<span style="color:' +
        charCg.color +
        ';"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:2px;"></i>' +
        esc(charCg.name) +
        "</span>",
    );
  $p.find("#ms-footer")
    .html(
      selectMode
        ? buildBatchFooter()
        : "<span>" +
            filtered.length +
            "/" +
            list.length +
            " 条 · 角色专属" +
            (metaParts.length ? " · " + metaParts.join(" · ") : "") +
            '</span><div class="ms-footer-btns">' +
            (canEditBd
              ? '<a data-action="char-bd"><i class="fa-solid fa-cake-candles"></i> ' +
                (charBd ? "改生日 " + esc(charBd) : "设生日") +
                "</a>"
              : '<span style="color:var(--SmartThemeQuoteColor,#666);font-size:11px;font-style:italic;opacity:0.7;"><i class="fa-solid fa-cake-candles" style="margin-right:3px;font-size:9px;color:#e88;"></i>生日 ' +
                esc(charBd) +
                " (作者已锁定)</span>") +
            (canShowPreview
              ? ' <a data-action="char-bd-preview"><i class="fa-solid fa-eye"></i> 预览祝福</a>'
              : "") +
            ' <a data-action="char-bd-msg"><i class="fa-solid fa-envelope-open-text"></i> ' +
            (hasOwnBdVer ? "改祝福" : hasAnyBd ? "添加祝福" : "写祝福") +
            "</a>" +
            (isLockedByDate
              ? ' <span style="color:var(--SmartThemeQuoteColor,#666);font-size:10px;font-style:italic;opacity:0.7;margin-left:6px;">🎁 生日当天解锁</span>'
              : "") +
            "</div>",
    )
    .show();
  bindAllEvents();
  $p.find("#ms-toolbar").on("click.ms", "#ms-btn-new-in-char", function () {
    var parentGid = null;
    if (viewStack.length >= 2) {
      var parentView = viewStack[viewStack.length - 2];
      if (
        parentView &&
        parentView.name === "group" &&
        parentView.groupId &&
        parentView.groupId !== "_ungrouped"
      ) {
        var parentG = getGroup(parentView.groupId);
        if (parentG && isIPGroup(parentG)) {
          parentGid = parentView.groupId;
        }
      }
    }
    navigateTo({
      name: "edit",
      promptId: null,
      defaultCharacter: key,
      defaultGroupId: parentGid,
    });
  });
  $p.find("#ms-footer").on("click.ms", "[data-action='char-bd']", function () {
    var cur = (data.settings.charBirthdays || {})[key] || "";
    msBirthdayPrompt(
      "输入「" + displayName + "」的生日\n\n格式 MM-DD（如 03-21），留空可清除",
      {
        title: "设置生日",
        icon: "fa-cake-candles",
        defaultValue: cur,
        placeholder: "MM-DD",
        validate: function (v) {
          v = (v || "").trim();
          if (!v) return null;
          if (!/^\d{2}-\d{2}$/.test(v))
            return "格式不对，要写成 MM-DD（例如 03-21）";
          var parts = v.split("-");
          var m = parseInt(parts[0]),
            d = parseInt(parts[1]);
          var maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          if (m < 1 || m > 12 || d < 1 || d > maxDays[m - 1])
            return "日期不合理";
          return null;
        },
      },
    ).then(function (input) {
      if (input === null) return;
      var v = input.trim();
      var _savedScroll = $p.find("#ms-body").scrollTop();
      function _restoreScroll() {
        setTimeout(function () {
          $p.find("#ms-body").scrollTop(_savedScroll);
        }, 30);
      }
      if (!v) {
        delete data.settings.charBirthdays[key];
        if (data.settings.ownBirthdays) delete data.settings.ownBirthdays[key];
        saveData();
        toast("success", "已清除生日");
        renderCharacter(viewStack[viewStack.length - 1]);
        _restoreScroll();
        return;
      }
      if (!data.settings.charBirthdays) data.settings.charBirthdays = {};
      if (!data.settings.ownBirthdays) data.settings.ownBirthdays = {};
      data.settings.charBirthdays[key] = v;
      data.settings.ownBirthdays[key] = true;
      saveData();
      toast("success", "已设置生日: " + v);
      renderCharacter(viewStack[viewStack.length - 1]);
      _restoreScroll();
    });
  });
  $p.find("#ms-footer").on(
    "click.ms",
    "[data-action='char-bd-preview']",
    function () {
      showBirthdayMessageView(key, displayName);
    },
  );
  $p.find("#ms-footer").on(
    "click.ms",
    "[data-action='char-bd-msg']",
    function () {
      showBirthdayMessageEditor(key, displayName);
    },
  );
}

function buildPvChip(iconCls, text, iconColor) {
  var colorCss = iconColor ? ";color:" + iconColor : "";
  return (
    '<span class="ms-pv-chip"><i class="fa-solid ' +
    iconCls +
    '" style="font-size:9px' +
    colorCss +
    ';"></i>' +
    esc(text) +
    "</span>"
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
  var metaChips = buildPvChip(
    "fa-folder",
    groupL,
    g ? g.color : "var(--SmartThemeQuoteColor,#888)",
  );
  if (pr.series)
    metaChips += buildPvChip("fa-layer-group", pr.series, "var(--ms-accent)");
  if (pr.author) metaChips += buildPvChip("fa-user", pr.author);
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
        <button class="ms-pa" data-action="quick-new" title="在当前分组下快速新建一条空白剧场"><i class="fa-solid fa-square-plus"></i> 同组新建</button>
        <button class="ms-pa${pr.character ? " starred" : ""}" data-action="bind-char" title="${pr.character ? esc(String(pr.character).replace(/\.[^.]+$/, "")) : ""}">${
          pr.character
            ? (function () {
                var ap = getCharAvatarPathSafe(pr.character);
                return ap
                  ? '<img src="' +
                      esc(ap) +
                      '" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:2px;" onerror="this.style.display=\'none\';this.onerror=null;">'
                  : '<i class="fa-solid fa-user-check"></i>';
              })()
            : '<i class="fa-solid fa-user-plus"></i>'
        } ${pr.character ? "已绑定: " + esc(truncate(getCharDisplayName(pr.character), 10)) : "绑定角色"}</button>
        <button class="ms-pa" data-action="export-single"><i class="fa-solid fa-file-export"></i> 导出</button>
        ${historyCount > 0 ? `<button class="ms-pa" data-action="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史 (${historyCount})</button>` : ""}<button class="ms-pa danger" data-action="delete"><i class="fa-solid fa-trash"></i> 删除</button>
      </div>
      ${tagsH ? `<div style="padding:6px 14px;">${tagsH}</div>` : ""}
      <div style="padding:2px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);display:flex;justify-content:space-between;align-items:center;"><span>${stats.chars} 字 · ${stats.lines} 行${pr.usageCount ? " · 使用 " + pr.usageCount + " 次" : ""}</span>${pr.updatedAt && pr.updatedAt !== pr.createdAt ? '<span style="opacity:0.7;" title="修改日期"><i class="fa-solid fa-pen-to-square" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.updatedAt) + "</span>" : pr.createdAt ? '<span style="opacity:0.7;" title="创建日期"><i class="fa-solid fa-calendar-plus" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.createdAt) + "</span>" : ""}</div>
      <div class="ms-preview-content">${renderMd(pr.content)}</div>`);
  var _isInjected = (data.settings.stageSelectedIds || []).indexOf(pr.id) >= 0;
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
        '<button class="ms-send-btn" data-action="send-gen" style="background:rgba(var(--ms-accent-rgb),0.1);border-color:var(--ms-accent);color:var(--ms-accent);"><i class="bi bi-send-fill"></i>发送并生成</button>' +
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
    toast("success", "已创建副本");
    navigateBack();
  });
  $p.find("#ms-body").on("click.ms", "[data-action='quick-new']", () => {
    navigateTo({
      name: "edit",
      promptId: null,
      defaultGroupId: pr.groupId,
      defaultSeries: pr.series || "",
      defaultCharacter: pr.character || "",
    });
  });
  $p.find("#ms-body").on("click.ms", "[data-action='export-single']", () =>
    doExportSingle(pr),
  );
  $p.find("#ms-body").on("click.ms", "[data-action='bind-char']", () =>
    showBindCharacterDropdown($p, pr.id, function () {
      renderPreview(v);
    }),
  );
  $p.find("#ms-body").on("click.ms", "[data-action='history']", () =>
    navigateTo({ name: "history", promptId: pr.id }),
  );
  $p.find("#ms-body").on("click.ms", "[data-action='delete']", () => {
    msConfirm(
      "确定删除「" + truncate(pr.title, 20) + "」吗？\n\n该操作不可撤销",
      {
        title: "删除剧场",
        dangerous: true,
        okText: "删除",
      },
    ).then(function (ok) {
      if (!ok) return;
      deletePrompt(pr.id);
      navigateBack();
    });
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
    var inCodeBlock = false;
    for (var i = 0; i < lines.length; i++) {
      if (/^\s*```/.test(lines[i])) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (/^\s*- \[[ x]\] /.test(lines[i])) {
        if (taskCount === idx) {
          if (isChecked) lines[i] = lines[i].replace("- [ ] ", "- [x] ");
          else lines[i] = lines[i].replace("- [x] ", "- [ ] ");
          break;
        }
        taskCount++;
      }
    }
    pushHistory(pr);
    var _oldContent = pr.content;
    pr.content = lines.join("\n");
    pr.fingerprint = contentFingerprint(pr);
    pr.updatedAt = Date.now();
    _invalidateLc(pr);
    if (typeof _renderMdCache !== "undefined") {
      _renderMdCache.delete(_oldContent);
    }
    saveData();
    var $li = $(this).closest("li.ms-task");
    if (isChecked) $li.addClass("ms-task-done");
    else $li.removeClass("ms-task-done");
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
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
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
  var pr = getPrompt(v.promptId);
  if (!pr) {
    navigateBack();
    return;
  }
  var history = pr.history || [];
  var $p = setupPage("版本历史", "版本历史 · " + esc(truncate(pr.title, 20)));
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
  $p.find("#ms-body").on("click.ms", "[data-haction='restore']", function (e) {
    e.stopPropagation();
    const idx = parseInt($(this).data("hidx"));
    const h = pr.history[idx];
    if (!h) return;
    msConfirm("回退后当前内容会被保存到历史中，确定吗？", {
      title: "回退到此版本",
      type: "warning",
      okText: "回退",
    }).then(function (ok) {
      if (!ok) return;
      pushHistory(pr);
      pr.history.splice(idx, 1);
      pr.title = h.title;
      pr.content = h.content;
      pr.author = h.author || pr.author;
      pr.fingerprint = contentFingerprint(pr);
      saveData();
      navigateBack();
    });
  });
  $p.find("#ms-body").on("click.ms", "[data-haction='delete']", function (e) {
    e.stopPropagation();
    const idx = parseInt($(this).data("hidx"));
    msConfirm("确定删除此历史记录？", {
      title: "删除历史",
      dangerous: true,
      okText: "删除",
    }).then(function (ok) {
      if (!ok) return;
      pr.history.splice(idx, 1);
      saveData();
      renderHistory(v);
    });
  });
  $p.find("#ms-footer").on(
    "click.ms",
    "[data-action='clear-history']",
    function () {
      msConfirm("确定清空本条剧场的所有版本历史吗？", {
        title: "清空版本历史",
        dangerous: true,
        okText: "清空",
      }).then(function (ok) {
        if (!ok) return;
        pr.history = [];
        saveData();
        toast("success", "已清空");
        renderHistory(v);
      });
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
  var pr = getPrompt(v.promptId);
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
  var $p = setupPage("版本对比");
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
