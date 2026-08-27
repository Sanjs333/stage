function renderEdit(v) {
  if (v.promptId && !getPrompt(v.promptId)) {
    toast("warning", "这条剧场不存在了，可能已被删除");
    navigateBack();
    return;
  }
  var pr = v.promptId ? getPrompt(v.promptId) : null,
    isNew = !pr;
  const title = isNew ? "" : pr.title,
    content = isNew ? "" : pr.content;
  const groupId = isNew ? v.defaultGroupId || "" : pr.groupId || "";
  const g = groupId ? getGroup(groupId) : null;
  var editSubGroupId = isNew ? v.defaultSubGroupId || null : pr.subGroupId || null;
  var _lastEditGid = groupId;
  const author = isNew
    ? g && g.defaultAuthor
      ? g.defaultAuthor
      : data.settings.defaultAuthor || ""
    : pr.author || "";
  const series = isNew ? v.defaultSeries || "" : pr.series || "";
  const promptTags = isNew ? [] : pr.tags || [];
  if (!v._savedEditState && !v._draftChecked) {
    v._draftChecked = true;
    var draft = loadDraft();
    if (
      draft &&
      draft.savedAt &&
      Date.now() - draft.savedAt < 86400000 &&
      Date.now() - draft.savedAt > 5000 &&
      (!draft.charKey || draft.charKey === getCurrentCharKeySafe())
    ) {
      var draftHasContent =
        (draft.title && draft.title.trim()) ||
        (draft.content && draft.content.trim());
      var draftMatchesCurrent;
      if (v.promptId) {
        draftMatchesCurrent = draft.promptId === v.promptId;
      } else {
        draftMatchesCurrent = !draft.promptId;
      }
      if (draftHasContent && draftMatchesCurrent) {
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
    character: isNew ? v.defaultCharacter || "" : pr.character || "",
    subGroupId: editSubGroupId,
  });
  var $p = setupPage(
    isNew ? "新建小剧场" : "编辑",
    isNew ? "新建小剧场" : "编辑小剧场",
  );
  var _editInitialTitleText = isNew ? "新建小剧场" : pr.title || "未命名";
  $p.find("#ms-toolbar").html(
    '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button>' +
      '<span class="ms-edit-current-title" id="ms-edit-current-title" style="flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px;">' +
      esc(_editInitialTitleText) +
      "</span>",
  );
  var editCharacter = isNew ? v.defaultCharacter || "" : pr.character || "";
  var editCharacterIsLost = editCharacter && !isLocalCharKey(editCharacter);
  function buildCharBindUI() {
    var curKey = getCurrentCharKeySafe();
    var curName = curKey ? getCharDisplayName(curKey) : "";
    var h = "";
    if (editCharacter && editCharacterIsLost) {
      var lostName = String(editCharacter).replace(/\.[^.]+$/, "");
      h +=
        '<span class="ms-tag-toggle" style="background:rgba(var(--ms-danger-rgb),0.15);color:var(--ms-danger);border-color:var(--ms-danger);cursor:default;" title="本地找不到这张卡，建议去「失联角色」处理"><i class="fa-solid fa-user-slash" style="margin-right:3px;"></i>失联：' +
        esc(truncate(lostName, 14)) +
        "</span>";
      h +=
        '<button class="ms-tbtn" id="ms-char-unbind" style="padding:3px 8px;font-size:11px;"><i class="fa-solid fa-xmark"></i> 解绑</button>';
    }
    if (editCharacter) {
      var bn = getCharDisplayName(editCharacter);
      var bnTip = String(editCharacter).replace(/\.[^.]+$/, "");
      var _editAp = getCharAvatarPathSafe(editCharacter);
      var _editAvH = _editAp
        ? '<img src="' +
          esc(_editAp) +
          '" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:3px;" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'\');">'
        : '<i class="fa-solid fa-user-check" style="margin-right:3px;"></i>';
      h +=
        '<span class="ms-tag-toggle active" title="' +
        esc(bnTip) +
        '" style="background:#b48cc8;cursor:default;">' +
        _editAvH +
        esc(bn) +
        "</span>";
      h +=
        '<button class="ms-tbtn" id="ms-char-unbind" style="padding:3px 8px;font-size:11px;"><i class="fa-solid fa-xmark"></i> 解绑</button>';
    }
    if (curKey && editCharacter !== curKey) {
      h +=
        '<button class="ms-tbtn" id="ms-char-bind-current" style="padding:3px 8px;font-size:11px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-user-plus"></i> ' +
        (editCharacter ? "改绑当前 (" : "绑定到当前 (") +
        esc(truncate(curName, 12)) +
        ")</button>";
    }
    var recent = Array.isArray(data.settings.recentBoundChars)
      ? data.settings.recentBoundChars
          .filter(function (k) {
            return (
              k && isLocalCharKey(k) && k !== editCharacter && k !== curKey
            );
          })
          .slice(0, 3)
      : [];
    recent.forEach(function (k) {
      var dn = getCharDisplayName(k);
      var ap = getCharAvatarPathSafe(k);
      var av = ap
        ? '<img src="' +
          esc(ap) +
          '" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:3px;" onerror="this.style.display=\'none\';this.onerror=null;">'
        : '<i class="fa-solid fa-user" style="font-size:10px;margin-right:3px;opacity:0.6;"></i>';
      h +=
        '<button class="ms-tbtn ms-char-bind-recent" data-rk="' +
        esc(k) +
        '" style="padding:3px 8px;font-size:11px;" title="最近：' +
        esc(dn) +
        '">' +
        av +
        esc(truncate(dn, 8)) +
        "</button>";
    });
    h +=
      '<button class="ms-tbtn" id="ms-char-bind-search" style="padding:3px 8px;font-size:11px;"><i class="fa-solid fa-magnifying-glass"></i> 搜索绑定</button>';
    if (!editCharacter && !curKey && recent.length === 0) {
      h +=
        '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-left:4px;">未打开角色卡，仅能搜索绑定</span>';
    }
    return h;
  }

  function getEditGid() {
    return $p.find("#ms-edit-group").val() || "";
  }

  function _gpCollectCounts() {
    var byGroup = Object.create(null),
      bySub = Object.create(null),
      ungrouped = 0;
    data.prompts.forEach(function (p) {
      var gid = p.groupId || "";
      if (!gid) {
        ungrouped++;
        return;
      }
      byGroup[gid] = (byGroup[gid] || 0) + 1;
      if (p.subGroupId) {
        var k = gid + "|" + p.subGroupId;
        bySub[k] = (bySub[k] || 0) + 1;
      }
    });
    return { byGroup: byGroup, bySub: bySub, ungrouped: ungrouped };
  }

  function _gpGroupStat(g, counts) {
    var subs = getSubGroups(g);
    var total = counts.byGroup[g.id] || 0;
    var inFolders = 0;
    subs.forEach(function (sg) {
      inFolders += counts.bySub[g.id + "|" + sg.id] || 0;
    });
    return {
      total: total,
      folders: subs.length,
      loose: Math.max(0, total - inFolders),
    };
  }

  function buildGroupTriggerHTML() {
    var gid = getEditGid();
    var g = gid ? getGroup(gid) : null;
    var sg = g && editSubGroupId ? getSubGroup(gid, editSubGroupId) : null;
    var h = g
      ? '<span class="ms-gp-trig-dot" style="background:' +
        escAttr(g.color || "#888") +
        ';"></span>'
      : '<span class="ms-gp-trig-dot none"></span>';
    h +=
      '<span class="ms-gp-trig-main"><span class="ms-gp-trig-name">' +
      esc(g ? g.name : "未分组") +
      "</span>";
    if (sg) {
      h +=
        '<span class="ms-gp-trig-sub" title="文件夹：' +
        escAttr(sg.name) +
        '"><i class="fa-solid fa-folder"></i><span>' +
        esc(sg.name) +
        "</span></span>";
    }
    h += '</span><i class="fa-solid fa-angle-down ms-gp-trig-chev"></i>';
    return h;
  }

  function refreshGroupTrigger() {
    $p.find("#ms-edit-group-trigger").html(buildGroupTriggerHTML());
  }

  function applyGroupPick(gid, sgid) {
    var $h = $p.find("#ms-edit-group");
    var prev = $h.val() || "";
    gid = gid || "";
    sgid = sgid || null;
    var same = prev === gid && editSubGroupId === sgid;
    $h.val(gid);
    if (prev !== gid) {
      _lastEditGid = gid;
      $h.trigger("change");
    }
    editSubGroupId = sgid;
    refreshGroupTrigger();
    if (!same) markDirty();
  }

  var _gpExpanded = new Set();
  var _gpKw = "";

  function closeGroupPicker() {
    if (!$p.find("#ms-gp-popup").length) return;
    $p.find("#ms-gp-popup").remove();
    $p.off("pointerdown.ms-gp");
    $p.off("keydown.ms-gp");
    $p.find("#ms-body").off("scroll.ms-gp");
    $p.find("#ms-edit-group-trigger").removeClass("open");
  }

  function _gpRenderList() {
    var $list = $p.find("#ms-gp-list");
    if (!$list.length) return;
    var counts = _gpCollectCounts();
    var lkw = _gpKw.trim().toLowerCase();
    var curGid = getEditGid();
    var totalFolders = 0;
    data.groups.forEach(function (g) {
      totalFolders += getSubGroups(g).length;
    });
    $p.find("#ms-gp-summary").text(
      data.groups.length + " 组 · " + totalFolders + " 文件夹",
    );
    var h = "";
    var matched = 0;
    if (!lkw || "未分组".indexOf(lkw) >= 0) {
      matched++;
      var noneSel = !curGid;
      h +=
        '<div class="ms-gp-row' +
        (noneSel ? " sel" : "") +
        '" data-gp-gid="">' +
        '<div class="ms-gp-ico"><i class="fa-solid fa-inbox"></i></div>' +
        '<div class="ms-gp-info"><div class="ms-gp-name">未分组</div>' +
        '<div class="ms-gp-meta"><span><i class="fa-solid fa-masks-theater"></i>' +
        counts.ungrouped +
        " 条剧场</span></div></div>" +
        (noneSel ? '<i class="fa-solid fa-check ms-gp-check"></i>' : "") +
        "</div>";
    }
    data.groups.forEach(function (g) {
      var subs = getSubGroups(g);
      var gHit = !lkw || (g.name || "").toLowerCase().indexOf(lkw) >= 0;
      var subHits = subs.filter(function (sg) {
        return !lkw || (sg.name || "").toLowerCase().indexOf(lkw) >= 0;
      });
      if (lkw && !gHit && subHits.length === 0) return;
      matched++;
      var st = _gpGroupStat(g, counts);
      var isCurG = curGid === g.id;
      var expanded = _gpExpanded.has(g.id) || (!!lkw && subHits.length > 0);
      h +=
        '<div class="ms-gp-row' +
        (isCurG ? " sel" : "") +
        '" data-gp-gid="' +
        escAttr(g.id) +
        '">' +
        buildGroupAvatarHTML(g, 26) +
        '<div class="ms-gp-info"><div class="ms-gp-name" title="' +
        escAttr(g.name) +
        '">' +
        esc(g.name) +
        "</div>" +
        '<div class="ms-gp-meta"><span><i class="fa-solid fa-masks-theater"></i>' +
        st.total +
        " 条</span>" +
        (st.folders > 0
          ? '<span class="ms-gp-m-fold"><i class="fa-solid fa-folder"></i>' +
            st.folders +
            " 个文件夹</span>"
          : '<span style="opacity:0.6;"><i class="fa-regular fa-folder-open"></i>无文件夹</span>') +
        (isIPGroup(g) ? '<span class="ms-gp-ipbadge">IP</span>' : "") +
        "</div></div>" +
        (isCurG && !editSubGroupId
          ? '<i class="fa-solid fa-check ms-gp-check"></i>'
          : "") +
        (lkw
          ? ""
          : '<button type="button" class="ms-gp-exp' +
            (expanded ? " open" : "") +
            '" data-gp-exp="' +
            escAttr(g.id) +
            '" title="展开/收起文件夹"><i class="fa-solid fa-angle-right"></i></button>') +
        "</div>";
      if (!expanded) return;
      h += '<div class="ms-gp-subs">';
      subHits.forEach(function (sg) {
        var c = counts.bySub[g.id + "|" + sg.id] || 0;
        var sSel = isCurG && editSubGroupId === sg.id;
        h +=
          '<div class="ms-gp-srow' +
          (sSel ? " sel" : "") +
          '" data-gp-gid="' +
          escAttr(g.id) +
          '" data-gp-sgid="' +
          escAttr(sg.id) +
          '">' +
          '<i class="fa-solid fa-folder ms-gp-sico"' +
          (sg.color ? ' style="color:' + escAttr(sg.color) + ';"' : "") +
          "></i>" +
          '<div class="ms-gp-sname" title="' +
          escAttr(sg.name) +
          '">' +
          esc(sg.name) +
          "</div>" +
          '<span class="ms-gp-scnt">' +
          c +
          "</span>" +
          '<div class="ms-gp-sacts">' +
          '<button type="button" class="ms-gp-sbtn" data-gp-ren="' +
          escAttr(sg.id) +
          '" data-gp-g="' +
          escAttr(g.id) +
          '" title="重命名文件夹"><i class="fa-solid fa-pen"></i></button>' +
          '<button type="button" class="ms-gp-sbtn del" data-gp-del="' +
          escAttr(sg.id) +
          '" data-gp-g="' +
          escAttr(g.id) +
          '" title="删除文件夹"><i class="fa-solid fa-trash"></i></button>' +
          "</div>" +
          (sSel ? '<i class="fa-solid fa-check ms-gp-check"></i>' : "") +
          "</div>";
      });
      if (!lkw) {
        var looseSel = isCurG && !editSubGroupId;
        h +=
          '<div class="ms-gp-srow none' +
          (looseSel ? " sel" : "") +
          '" data-gp-gid="' +
          escAttr(g.id) +
          '" data-gp-sgid="">' +
          '<i class="fa-solid fa-folder-open ms-gp-sico"></i>' +
          '<div class="ms-gp-sname">未分类</div>' +
          '<span class="ms-gp-scnt">' +
          st.loose +
          "</span>" +
          (looseSel ? '<i class="fa-solid fa-check ms-gp-check"></i>' : "") +
          "</div>";
        h +=
          '<button type="button" class="ms-gp-addfold" data-gp-addfold="' +
          escAttr(g.id) +
          '"><i class="fa-solid fa-folder-plus"></i>在此分组新建文件夹</button>';
      }
      h += "</div>";
    });
    if (matched === 0) {
      h +=
        '<div class="ms-gp-empty"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的分组或文件夹</div>';
    } else if (!lkw && data.groups.length === 0) {
      h +=
        '<div class="ms-gp-empty" style="padding:12px 10px;"><i class="fa-regular fa-folder-open"></i>还没有任何分组，点下方按钮新建</div>';
    }
    $list.html(h);
  }

  function _gpPosition() {
    var $pop = $p.find("#ms-gp-popup");
    var $trig = $p.find("#ms-edit-group-trigger");
    if (!$pop.length || !$trig.length) return;
    var tr = $trig[0].getBoundingClientRect();
    var pr = $p[0].getBoundingClientRect();
    var $list = $pop.find("#ms-gp-list");
    // 面板本身 overflow:hidden，浮层必须夹在面板可视区内，否则会被裁掉
    $list.css("max-height", "");
    /* rect 是视口像素（已乘过面板的 zoom），而 offsetHeight/offsetWidth 和写回
       css 的 top/left 都是布局像素。两者混用会让浮层在开了「自定义字号与尺寸」
       （zoom ≠ 1）时整体偏移，所以先把 rect 换算回布局像素。 */
    var _z = 1;
    try {
      _z = parseFloat(getComputedStyle($p[0]).zoom) || 1;
    } catch (e) {}
    var trTop = (tr.top - pr.top) / _z;
    var trBottom = (tr.bottom - pr.top) / _z;
    var trLeft = (tr.left - pr.left) / _z;
    var prH = pr.height / _z;
    var prW = pr.width / _z;
    var below = prH - trBottom - 11;
    var above = trTop - 11;
    var openUp = false;
    if ($pop[0].offsetHeight > below && above > below) openUp = true;
    var room = Math.max(96, openUp ? above : below);
    var chrome = $pop[0].offsetHeight - ($list[0].offsetHeight || 0);
    if ($pop[0].offsetHeight > room) {
      $list.css("max-height", Math.max(64, room - chrome) + "px");
    }
    var popH = $pop[0].offsetHeight;
    var popW = $pop[0].offsetWidth || 296;
    var left = trLeft;
    var maxLeft = prW - popW - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    var top = openUp ? trTop - popH - 5 : trBottom + 5;
    if (top < 6) top = 6;
    $pop.css({ top: top + "px", left: left + "px" });
  }

  function openGroupPicker() {
    closeGroupPicker();
    closeSeriesPicker();
    $p.find("#ms-char-search-popup").remove();
    _gpKw = "";
    var curGid = getEditGid();
    if (curGid) _gpExpanded.add(curGid);
    $p.append(
      '<div id="ms-gp-popup">' +
        '<div class="ms-gp-head"><div class="ms-gp-head-t"><i class="fa-solid fa-layer-group"></i>选择分组 / 文件夹</div>' +
        '<span class="ms-gp-head-n" id="ms-gp-summary"></span>' +
        '<button type="button" class="ms-gp-x" id="ms-gp-close" title="关闭"><i class="fa-solid fa-xmark"></i></button></div>' +
        '<div class="ms-gp-searchwrap"><input type="text" class="ms-gp-search" id="ms-gp-search" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="search" enterkeyhint="search" placeholder="搜索分组或文件夹..."></div>' +
        '<div class="ms-gp-list" id="ms-gp-list"></div>' +
        '<div class="ms-gp-foot"><button type="button" class="ms-gp-newgroup" id="ms-gp-newgroup"><i class="fa-solid fa-plus"></i>新建分组</button></div>' +
        "</div>",
    );
    $p.find("#ms-edit-group-trigger").addClass("open");
    _gpRenderList();
    _gpPosition();
    var $pop = $p.find("#ms-gp-popup");
    $pop.addClass("visible");
    var $selRow = $pop.find(".ms-gp-row.sel").first();
    if ($selRow.length) {
      var lEl = $pop.find("#ms-gp-list")[0];
      var off = $selRow[0].offsetTop - 40;
      if (off > 0) lEl.scrollTop = off;
    }
    $pop.on("click", "#ms-gp-close", function () {
      closeGroupPicker();
    });
    $pop.on("input", "#ms-gp-search", function () {
      _gpKw = $(this).val() || "";
      _gpRenderList();
      _gpPosition();
    });
    $pop.on("click", "[data-gp-exp]", function (e) {
      e.stopPropagation();
      var gid = $(this).attr("data-gp-exp");
      if (_gpExpanded.has(gid)) _gpExpanded.delete(gid);
      else _gpExpanded.add(gid);
      _gpRenderList();
      _gpPosition();
    });
    $pop.on("click", ".ms-gp-srow", function (e) {
      e.stopPropagation();
      applyGroupPick(
        $(this).attr("data-gp-gid") || "",
        $(this).attr("data-gp-sgid") || null,
      );
      closeGroupPicker();
    });
    $pop.on("click", ".ms-gp-row", function () {
      applyGroupPick($(this).attr("data-gp-gid") || "", null);
      closeGroupPicker();
    });
    $pop.on("click", "[data-gp-ren]", function (e) {
      e.stopPropagation();
      var sgid = $(this).attr("data-gp-ren");
      var gid = $(this).attr("data-gp-g");
      var sg = getSubGroup(gid, sgid);
      if (!sg) return;
      msPrompt("", {
        title: "重命名文件夹",
        defaultValue: sg.name || "",
        placeholder: "文件夹名称",
        validate: function (val) {
          if (!val || !val.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        updateSubGroup(gid, sgid, { name: name.trim() });
        _gpRenderList();
        _gpPosition();
        refreshGroupTrigger();
        toast("success", "已重命名");
      });
    });
    $pop.on("click", "[data-gp-del]", function (e) {
      e.stopPropagation();
      var sgid = $(this).attr("data-gp-del");
      var gid = $(this).attr("data-gp-g");
      var sg = getSubGroup(gid, sgid);
      if (!sg) return;
      var cnt = getPromptsInSubGroup(gid, sgid).length;
      msConfirm(
        cnt > 0
          ? "其中 " +
              cnt +
              " 条剧场会移出文件夹，变为「未分类」，剧场本身不会被删除。"
          : "这个空文件夹将被删除。",
        {
          title: "删除文件夹「" + truncate(sg.name, 14) + "」？",
          type: "danger",
          dangerous: true,
          okText: "删除",
        },
      ).then(function (ok) {
        if (!ok) return;
        deleteSubGroup(gid, sgid, "none");
        if (editSubGroupId === sgid) {
          editSubGroupId = null;
          refreshGroupTrigger();
          markDirty();
        }
        _gpRenderList();
        _gpPosition();
        toast("success", "已删除文件夹");
      });
    });
    $pop.on("click", "[data-gp-addfold]", function (e) {
      e.stopPropagation();
      var gid = $(this).attr("data-gp-addfold");
      msPrompt("", {
        title: "新建文件夹",
        placeholder: "例如：日常 / 剧情 / 节日",
        validate: function (val) {
          if (!val || !val.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        var sg = createSubGroup(gid, name.trim());
        if (!sg) return;
        _gpExpanded.add(gid);
        applyGroupPick(gid, sg.id);
        _gpRenderList();
        _gpPosition();
        toast("success", "已新建文件夹并选中");
      });
    });
    $pop.on("click", "#ms-gp-newgroup", function (e) {
      e.stopPropagation();
      msPrompt("", {
        title: "新建分组",
        placeholder: "分组名称",
        validate: function (val) {
          if (!val || !val.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        var g = createGroup(name.trim());
        if (!g) return;
        _gpExpanded.add(g.id);
        applyGroupPick(g.id, null);
        _gpRenderList();
        _gpPosition();
        toast("success", "已新建分组并选中");
      });
    });
    setTimeout(function () {
      $p.on("pointerdown.ms-gp", function (ev) {
        if (
          $(ev.target).closest(
            "#ms-gp-popup, #ms-edit-group-trigger, .ms-modal-overlay",
          ).length
        )
          return;
        closeGroupPicker();
      });
      $p.find("#ms-body").on("scroll.ms-gp", function () {
        closeGroupPicker();
      });
      $p.on("keydown.ms-gp", function (ev) {
        if (ev.key === "Escape" || ev.key === "Esc") {
          ev.stopPropagation();
          closeGroupPicker();
          $p.find("#ms-edit-group-trigger").focus();
        }
      });
    }, 50);
  }
  var _spKw = "";

  function getEditSeries() {
    return $p.find("#ms-edit-series").val() || "";
  }

  function _spCollectSeries() {
    var gid = getEditGid();
    // 裸对象会让「constructor」「toString」这类系列名命中原型属性，于是
    // map[sn] 判真但从未初始化，下一行读 undefined.subs 会直接抛 TypeError
    var map = Object.create(null);
    var order = [];
    data.prompts.forEach(function (p) {
      if ((p.groupId || "") !== gid) return;
      var sn = String(p.series || "").trim();
      if (!sn) return;
      if (!map[sn]) {
        map[sn] = { name: sn, count: 0, subs: {} };
        order.push(sn);
      }
      map[sn].count++;
      var sgk =
        p.subGroupId && getSubGroup(gid, p.subGroupId) ? p.subGroupId : "";
      map[sn].subs[sgk] = (map[sn].subs[sgk] || 0) + 1;
    });
    return { map: map, order: order };
  }

  function _spSubLabel(gid, subs) {
    var keys = Object.keys(subs || {});
    if (keys.length === 0) return "";
    var names = keys.map(function (k) {
      if (!k) return "未分类";
      var sg = getSubGroup(gid, k);
      return sg ? sg.name : "未分类";
    });
    if (names.length <= 2) return names.join("、");
    return names.slice(0, 2).join("、") + " 等 " + names.length + " 处";
  }

  function buildSeriesTriggerHTML() {
    var cur = getEditSeries();
    if (!cur) {
      return (
        '<span class="ms-gp-trig-dot none"></span>' +
        '<span class="ms-gp-trig-main"><span class="ms-gp-trig-name" style="opacity:0.7;">无系列</span></span>' +
        '<i class="fa-solid fa-angle-down ms-gp-trig-chev"></i>'
      );
    }
    var gid = getEditGid();
    var info = _spCollectSeries();
    var item = info.map[cur];
    var badge = item
      ? '<span class="ms-gp-trig-sub" title="本组内共 ' +
        escAttr(String(item.count)) +
        ' 条使用这个系列"><i class="fa-solid fa-masks-theater"></i><span>' +
        item.count +
        " 条</span></span>"
      : '<span class="ms-gp-trig-sub" title="本组内还没有其它剧场用这个系列名"><i class="fa-solid fa-plus"></i><span>新系列</span></span>';
    return (
      '<span class="ms-gp-trig-dot" style="background:var(--ms-accent);"></span>' +
      '<span class="ms-gp-trig-main"><span class="ms-gp-trig-name" title="' +
      escAttr(cur) +
      '">' +
      esc(cur) +
      "</span>" +
      badge +
      '</span><i class="fa-solid fa-angle-down ms-gp-trig-chev"></i>'
    );
  }

  function refreshSeriesTrigger() {
    $p.find("#ms-edit-series-trigger").html(buildSeriesTriggerHTML());
  }

  function applySeriesPick(name) {
    var next = String(name || "").trim();
    var prev = getEditSeries();
    $p.find("#ms-edit-series").val(next);
    refreshSeriesTrigger();
    if (next !== prev) markDirty();
  }

  function closeSeriesPicker() {
    if (!$p.find("#ms-sp-popup").length) return;
    $p.find("#ms-sp-popup").remove();
    $p.off("pointerdown.ms-sp");
    $p.off("keydown.ms-sp");
    $p.find("#ms-body").off("scroll.ms-sp");
    $p.find("#ms-edit-series-trigger").removeClass("open");
  }

  function _spRenderList() {
    var $list = $p.find("#ms-sp-list");
    if (!$list.length) return;
    var gid = getEditGid();
    var g = gid ? getGroup(gid) : null;
    var info = _spCollectSeries();
    var cur = getEditSeries();
    var names = info.order.slice();
    if (cur && names.indexOf(cur) < 0) names.push(cur);
    names.sort(function (a, b) {
      if (a === cur) return -1;
      if (b === cur) return 1;
      var ca = info.map[a] ? info.map[a].count : 0;
      var cb = info.map[b] ? info.map[b].count : 0;
      if (ca !== cb) return cb - ca;
      return a.localeCompare(b, "zh-CN");
    });
    $p.find("#ms-sp-summary").text(
      (g ? truncate(g.name, 8) : "未分组") +
        " · " +
        info.order.length +
        " 个系列",
    );
    var lkw = _spKw.trim().toLowerCase();
    var h = "";
    var matched = 0;
    if (!lkw || "无系列".indexOf(lkw) >= 0) {
      matched++;
      var noneSel = !cur;
      h +=
        '<div class="ms-gp-row' +
        (noneSel ? " sel" : "") +
        '" data-sp-name="">' +
        '<div class="ms-gp-ico"><i class="fa-solid fa-ban"></i></div>' +
        '<div class="ms-gp-info"><div class="ms-gp-name">无系列</div>' +
        '<div class="ms-gp-meta"><span>不归入任何系列，在列表里单独显示</span></div></div>' +
        (noneSel ? '<i class="fa-solid fa-check ms-gp-check"></i>' : "") +
        "</div>";
    }
    names.forEach(function (sn) {
      if (lkw && sn.toLowerCase().indexOf(lkw) < 0) return;
      matched++;
      var item = info.map[sn];
      var cnt = item ? item.count : 0;
      var isSel = cur === sn;
      var subLabel = item ? _spSubLabel(gid, item.subs) : "";
      h +=
        '<div class="ms-gp-row' +
        (isSel ? " sel" : "") +
        '" data-sp-name="' +
        escAttr(sn) +
        '">' +
        '<div class="ms-gp-ico" style="color:var(--ms-accent);"><i class="fa-solid fa-layer-group"></i></div>' +
        '<div class="ms-gp-info"><div class="ms-gp-name" title="' +
        escAttr(sn) +
        '">' +
        esc(sn) +
        "</div>" +
        '<div class="ms-gp-meta">' +
        (cnt > 0
          ? '<span><i class="fa-solid fa-masks-theater"></i>' +
            cnt +
            " 条</span>"
          : '<span style="opacity:0.7;"><i class="fa-solid fa-plus"></i>新系列</span>') +
        (subLabel
          ? '<span class="ms-gp-m-fold"><i class="fa-solid fa-folder"></i>' +
            esc(subLabel) +
            "</span>"
          : "") +
        "</div></div>" +
        (cnt > 0
          ? '<div class="ms-gp-sacts">' +
            '<button type="button" class="ms-gp-sbtn" data-sp-ren="' +
            escAttr(sn) +
            '" title="重命名本组内的这个系列"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" class="ms-gp-sbtn del" data-sp-clr="' +
            escAttr(sn) +
            '" title="移除本组内的这个系列"><i class="fa-solid fa-trash"></i></button>' +
            "</div>"
          : "") +
        (isSel ? '<i class="fa-solid fa-check ms-gp-check"></i>' : "") +
        "</div>";
    });
    if (matched === 0) {
      h +=
        '<div class="ms-gp-empty"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的系列' +
        (lkw
          ? '<br><span style="font-size:10px;opacity:0.8;">按回车即可用这个名字新建</span>'
          : "") +
        "</div>";
    } else if (!lkw && info.order.length === 0) {
      h +=
        '<div class="ms-gp-empty" style="padding:12px 10px;"><i class="fa-solid fa-layer-group"></i>本组还没有任何系列，点下方按钮新建</div>';
    }
    $list.html(h);
  }

  function _spPosition() {
    var $pop = $p.find("#ms-sp-popup");
    var $trig = $p.find("#ms-edit-series-trigger");
    if (!$pop.length || !$trig.length) return;
    var tr = $trig[0].getBoundingClientRect();
    var pr = $p[0].getBoundingClientRect();
    var $list = $pop.find("#ms-sp-list");
    $list.css("max-height", "");
    /* rect 是视口像素（已乘过面板的 zoom），而 offsetHeight/offsetWidth 和写回
       css 的 top/left 都是布局像素。两者混用会让浮层在开了「自定义字号与尺寸」
       （zoom ≠ 1）时整体偏移，所以先把 rect 换算回布局像素。 */
    var _z = 1;
    try {
      _z = parseFloat(getComputedStyle($p[0]).zoom) || 1;
    } catch (e) {}
    var trTop = (tr.top - pr.top) / _z;
    var trBottom = (tr.bottom - pr.top) / _z;
    var trLeft = (tr.left - pr.left) / _z;
    var prH = pr.height / _z;
    var prW = pr.width / _z;
    var below = prH - trBottom - 11;
    var above = trTop - 11;
    var openUp = false;
    if ($pop[0].offsetHeight > below && above > below) openUp = true;
    var room = Math.max(96, openUp ? above : below);
    var chrome = $pop[0].offsetHeight - ($list[0].offsetHeight || 0);
    if ($pop[0].offsetHeight > room) {
      $list.css("max-height", Math.max(64, room - chrome) + "px");
    }
    var popH = $pop[0].offsetHeight;
    var popW = $pop[0].offsetWidth || 296;
    var left = trLeft;
    var maxLeft = prW - popW - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    var top = openUp ? trTop - popH - 5 : trBottom + 5;
    if (top < 6) top = 6;
    $pop.css({ top: top + "px", left: left + "px" });
  }

  function openSeriesPicker() {
    closeSeriesPicker();
    closeGroupPicker();
    $p.find("#ms-char-search-popup").remove();
    _spKw = "";
    $p.append(
      '<div id="ms-sp-popup">' +
        '<div class="ms-gp-head"><div class="ms-gp-head-t"><i class="fa-solid fa-layer-group"></i>选择系列</div>' +
        '<span class="ms-gp-head-n" id="ms-sp-summary"></span>' +
        '<button type="button" class="ms-gp-x" id="ms-sp-close" title="关闭"><i class="fa-solid fa-xmark"></i></button></div>' +
        '<div class="ms-gp-searchwrap"><input type="text" class="ms-gp-search" id="ms-sp-search" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="search" enterkeyhint="search" placeholder="搜索本组系列，或输入新名称后回车..."></div>' +
        '<div class="ms-gp-list" id="ms-sp-list"></div>' +
        '<div class="ms-gp-foot"><button type="button" class="ms-gp-newgroup" id="ms-sp-newseries"><i class="fa-solid fa-plus"></i>新建系列</button></div>' +
        "</div>",
    );
    $p.find("#ms-edit-series-trigger").addClass("open");
    _spRenderList();
    _spPosition();
    var $pop = $p.find("#ms-sp-popup");
    $pop.addClass("visible");
    var $selRow = $pop.find(".ms-gp-row.sel").first();
    if ($selRow.length) {
      var lEl = $pop.find("#ms-sp-list")[0];
      var off = $selRow[0].offsetTop - 40;
      if (off > 0) lEl.scrollTop = off;
    }
    $pop.on("click", "#ms-sp-close", function () {
      closeSeriesPicker();
    });
    $pop.on("input", "#ms-sp-search", function () {
      _spKw = $(this).val() || "";
      _spRenderList();
      _spPosition();
    });
    $pop.on("keydown", "#ms-sp-search", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      var kw = ($(this).val() || "").trim();
      if (!kw) return;
      /* 列表过滤是不区分大小写的子串匹配，直接拿输入去新建会造出「衣柜」和
         「衣柜大公开」这种裂开的两个系列，所以回车先往已有系列上靠。 */
      var _spOrder = _spCollectSeries().order || [];
      var _kwLow = kw.toLowerCase();
      var _exact = null;
      var _subHits = [];
      _spOrder.forEach(function (sn) {
        var _low = String(sn).toLowerCase();
        if (_low === _kwLow) _exact = sn;
        else if (_low.indexOf(_kwLow) >= 0) _subHits.push(sn);
      });
      applySeriesPick(
        _exact || (_subHits.length === 1 ? _subHits[0] : kw),
      );
      closeSeriesPicker();
    });
    $pop.on("click", ".ms-gp-row", function () {
      applySeriesPick($(this).attr("data-sp-name") || "");
      closeSeriesPicker();
    });
    $pop.on("click", "[data-sp-ren]", function (e) {
      e.stopPropagation();
      var src = $(this).attr("data-sp-ren");
      var gid = getEditGid();
      msPrompt("把「" + src + "」重命名为：", {
        title: "重命名系列",
        icon: "fa-layer-group",
        defaultValue: src,
        placeholder: "新的系列名",
        validate: function (val) {
          if (!val || !val.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        var next = name.trim();
        if (next === src) return;
        var changed = 0;
        data.prompts.forEach(function (pp) {
          if ((pp.groupId || "") !== gid) return;
          if (String(pp.series || "").trim() !== src) return;
          pp.series = next;
          _invalidateLc(pp);
          changed++;
        });
        if (changed > 0) saveData();
        if (getEditSeries() === src) applySeriesPick(next);
        _spRenderList();
        _spPosition();
        toast("success", "已重命名 " + changed + " 条");
      });
    });
    $pop.on("click", "[data-sp-clr]", function (e) {
      e.stopPropagation();
      var src = $(this).attr("data-sp-clr");
      var gid = getEditGid();
      var affected = data.prompts.filter(function (pp) {
        return (
          (pp.groupId || "") === gid && String(pp.series || "").trim() === src
        );
      });
      msConfirm(
        "本组内 " +
          affected.length +
          " 条剧场会移出这个系列，变成「无系列」。剧场内容不会被删除。",
        {
          title: "移除系列「" + truncate(src, 14) + "」？",
          type: "danger",
          dangerous: true,
          okText: "移除",
        },
      ).then(function (ok) {
        if (!ok) return;
        affected.forEach(function (pp) {
          pp.series = "";
          _invalidateLc(pp);
        });
        saveData();
        if (getEditSeries() === src) applySeriesPick("");
        _spRenderList();
        _spPosition();
        toast("success", "已移除系列");
      });
    });
    $pop.on("click", "#ms-sp-newseries", function (e) {
      e.stopPropagation();
      msPrompt("", {
        title: "新建系列",
        icon: "fa-layer-group",
        defaultValue: _spKw.trim(),
        placeholder: "例如：衣柜大公开",
        validate: function (val) {
          if (!val || !val.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        applySeriesPick(name.trim());
        closeSeriesPicker();
      });
    });
    setTimeout(function () {
      $p.on("pointerdown.ms-sp", function (ev) {
        if (
          $(ev.target).closest(
            "#ms-sp-popup, #ms-edit-series-trigger, .ms-modal-overlay",
          ).length
        )
          return;
        closeSeriesPicker();
      });
      $p.find("#ms-body").on("scroll.ms-sp", function () {
        closeSeriesPicker();
      });
      $p.on("keydown.ms-sp", function (ev) {
        if (ev.key === "Escape" || ev.key === "Esc") {
          ev.stopPropagation();
          closeSeriesPicker();
          $p.find("#ms-edit-series-trigger").focus();
        }
      });
    }, 50);
  }
  let editTags = [...promptTags];
  const stats = countStats(content);
  let _editTagTab = "used";
  let _editTagExpandedMappings = new Set();

  function _getEditUsedTagIds() {
    var $sel = $p.find("#ms-edit-group");
    var curGid = $sel.length > 0 ? $sel.val() || null : groupId || null;
    var used = new Set();
    editTags.forEach(function (tid) {
      if (getTag(tid)) used.add(tid);
    });
    data.prompts.forEach(function (p) {
      if (v.promptId && p.id === v.promptId) return;
      var pgid = p.groupId || null;
      if (pgid !== curGid) return;
      (p.tags || []).forEach(function (tid) {
        if (getTag(tid)) used.add(tid);
      });
    });
    return used;
  }

  function _getEditMappingInfo() {
    var primaryMap = {},
      memberMap = {},
      children = {};
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

  function _buildEditTagChip(t, mappingInfo, isChild, ownershipBadge) {
    var a = editTags.includes(t.id);
    var mapping = !isChild ? mappingInfo.primaryMap[t.id] : null;
    var childIds = mapping ? mappingInfo.children[mapping.id] : null;
    var hasChildren = childIds && childIds.length > 0;
    var isExpanded = mapping && _editTagExpandedMappings.has(mapping.id);

    var bgStyle = a ? "background:" + t.color + ";" : "";
    var dashStyle = isChild ? "border-style:dashed;" : "";

    var inner = esc(t.name);
    if (hasChildren) {
      inner +=
        ' <span class="ms-edit-tag-expand" data-toggle-edit-mapping="' +
        mapping.id +
        '" style="display:inline-flex;align-items:center;gap:2px;font-size:9px;background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);padding:1px 5px;border-radius:3px;margin-left:3px;cursor:pointer;">' +
        '<i class="fa-solid fa-angle-' +
        (isExpanded ? "down" : "right") +
        '" style="font-size:8px;"></i>' +
        childIds.length +
        "</span>";
    }
    if (ownershipBadge) inner += ownershipBadge;
    if (a) inner += '<i class="fa-solid fa-xmark ms-tag-x"></i>';

    return (
      '<span class="ms-tag-toggle' +
      (a ? " active" : "") +
      '" data-tag-id="' +
      t.id +
      '" style="' +
      bgStyle +
      dashStyle +
      '">' +
      inner +
      "</span>"
    );
  }

  function buildTagsTabsHTML() {
    var usedIds = _getEditUsedTagIds();
    var mappingInfo = _getEditMappingInfo();
    var usedCount = 0,
      globalCount = 0;
    data.settings.definedTags.forEach(function (t) {
      var inGroup = usedIds.has(t.id);
      if (inGroup) {
        if (mappingInfo.memberMap[t.id]) return;
        usedCount++;
      } else {
        globalCount++;
      }
    });
    var h = "";
    h +=
      '<button class="ms-tbtn ms-edit-tag-tab' +
      (_editTagTab === "used" ? " active" : "") +
      '" data-tag-tab="used" style="padding:2px 8px;font-size:10px;"><i class="fa-solid fa-check-circle" style="margin-right:3px;font-size:9px;"></i>本组 (' +
      usedCount +
      ")</button>";
    h +=
      '<button class="ms-tbtn ms-edit-tag-tab' +
      (_editTagTab === "global" ? " active" : "") +
      '" data-tag-tab="global" style="padding:2px 8px;font-size:10px;"><i class="fa-solid fa-tags" style="margin-right:3px;font-size:9px;"></i>全局 (' +
      globalCount +
      ")</button>";
    return h;
  }

  function buildTagsUI() {
    var h = "";
    var usedIds = _getEditUsedTagIds();
    var mappingInfo = _getEditMappingInfo();
    data.settings.definedTags.forEach(function (t) {
      var actualSection = usedIds.has(t.id) ? "used" : "global";
      if (actualSection !== _editTagTab) return;
      if (_editTagTab === "used" && mappingInfo.memberMap[t.id]) return;

      h += _buildEditTagChip(t, mappingInfo, false, "");

      if (_editTagTab === "used") {
        var mapping = mappingInfo.primaryMap[t.id];
        if (mapping && _editTagExpandedMappings.has(mapping.id)) {
          mappingInfo.children[mapping.id].forEach(function (childId) {
            var childTag = getTag(childId);
            if (!childTag) return;
            var childActualSection = usedIds.has(childId) ? "used" : "global";
            var ownershipBadge = "";
            if (childActualSection !== _editTagTab) {
              var label = childActualSection === "used" ? "本组" : "全局";
              var bgC =
                childActualSection === "used"
                  ? "background:rgba(var(--ms-accent-rgb),0.22);color:var(--ms-accent);"
                  : "background:rgba(255,255,255,0.12);color:var(--SmartThemeQuoteColor,#aaa);";
              ownershipBadge =
                '<span style="font-size:8px;padding:1px 4px;border-radius:3px;margin-left:3px;' +
                bgC +
                '">' +
                label +
                "</span>";
            }
            h += _buildEditTagChip(childTag, mappingInfo, true, ownershipBadge);
          });
        }
      }
    });

    h +=
      '<span class="ms-add-tag-btn" id="ms-quick-add-tag"><i class="fa-solid fa-plus"></i></span>';

    $p.find("#ms-edit-tags-tabs").html(buildTagsTabsHTML());
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
      character: editCharacter,
      subGroupId: editSubGroupId,
    });
    editDirty = cur !== editSnapshot;
    /* 原先只有正文的 input 会排草稿。改系列/文件夹/标签/角色后若页面被关掉，
       恢复出来的草稿会把这些字段退回改动之前，而 banner 只说「已恢复草稿」。
       必须带 dirty 判断：markDirty 也会在「从子页面返回」这类净无改动的场合被
       调用，无条件排草稿会留下一份幽灵草稿，下次进来白弹一个恢复横幅。 */
    if (editDirty) {
      scheduleDraftSave();
    } else if (_editDraftTimer) {
      clearTimeout(_editDraftTimer);
      _editDraftTimer = null;
    }
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
      <div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>标题</label><input type="text" id="ms-edit-title" placeholder="小剧场名字" value="${esc(title)}"></div><div class="ms-field" style="flex:1;"><label>系列 <span style="font-weight:350;opacity:0.5;">(同系列自动聚合)</span></label><input type="hidden" id="ms-edit-series" value="${escAttr(series)}"><div class="ms-gp-trigger" id="ms-edit-series-trigger" tabindex="0" role="button" title="点击选择或新建系列"></div></div></div>
      <div class="ms-form-row ms-row-nowrap"><div class="ms-field" style="flex:1.35;"><label>分组 / 文件夹</label><input type="hidden" id="ms-edit-group" value="${escAttr(groupId || "")}"><div class="ms-gp-trigger" id="ms-edit-group-trigger" tabindex="0" role="button" title="点击选择分组或文件夹"></div></div><div class="ms-field ms-field-author" style="flex:1;"><label>作者</label><input type="text" id="ms-edit-author" placeholder="署名" value="${esc(author)}"></div></div>
      <div class="ms-field"><label>绑定角色 <span style="font-weight:350;opacity:0.5;">(可选，绑定后会出现在角色专属页)</span></label><div id="ms-edit-char-wrap" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;"></div></div>
      <div class="ms-field"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><label style="margin:0;">标签</label><div id="ms-edit-tags-tabs" style="display:flex;gap:4px;">${buildTagsTabsHTML()}</div></div><div class="ms-tag-row" id="ms-edit-tags">${buildTagsUI()}</div></div>
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
        <button class="ms-edit-scroll-bottom" id="ms-edit-scroll-bottom" title="回到底部"><i class="fa-solid fa-angle-down"></i></button>
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
      if (setupKeyboardAdapt.refresh) {
        [80, 300, 600, 1000, 1500].forEach(function (ms) {
          setTimeout(setupKeyboardAdapt.refresh, ms);
        });
      }
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
    editSubGroupId = draft.subGroupId || null;
    _lastEditGid = draft.groupId || "";
    refreshGroupTrigger();
    refreshSeriesTrigger();
    editTags = draft.tags ? [...draft.tags] : [];
    editCharacter = draft.character || "";
    if (editCharacter && !isLocalCharKey(editCharacter)) {
      editCharacter = "";
    }
    $p.find("#ms-edit-tags").html(buildTagsUI());
    $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
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
    function (e) {
      if ($(e.target).closest(".ms-edit-tag-expand").length) return;
      const tid = $(this).data("tag-id"),
        idx = editTags.indexOf(tid);
      if (idx >= 0) editTags.splice(idx, 1);
      else editTags.push(tid);
      $p.find("#ms-edit-tags").html(buildTagsUI());
      markDirty();
    },
  );
  $p.find("#ms-body").on(
    "click.ms",
    "#ms-edit-tags-tabs .ms-edit-tag-tab",
    function (e) {
      e.stopPropagation();
      e.preventDefault();
      _editTagTab = $(this).data("tag-tab");
      $p.find("#ms-edit-tags").html(buildTagsUI());
    },
  );
  $p.find("#ms-body").on(
    "click.ms",
    "#ms-edit-tags [data-toggle-edit-mapping]",
    function (e) {
      e.stopPropagation();
      e.preventDefault();
      var mid = $(this).attr("data-toggle-edit-mapping");
      if (_editTagExpandedMappings.has(mid))
        _editTagExpandedMappings.delete(mid);
      else _editTagExpandedMappings.add(mid);
      $p.find("#ms-edit-tags").html(buildTagsUI());
    },
  );
  refreshGroupTrigger();
  refreshSeriesTrigger();
  $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
  $p.find("#ms-body").on("click.ms", "#ms-char-unbind", function () {
    editCharacter = "";
    $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
    markDirty();
  });
  $p.find("#ms-body").on("click.ms", "#ms-char-bind-current", function () {
    var curKey = getCurrentCharKeySafe();
    if (!curKey) {
      toast("warning", "当前未打开角色卡");
      return;
    }
    editCharacter = curKey;
    recordRecentBoundChar(curKey);
    $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
    markDirty();
  });
  $p.find("#ms-body").on("click.ms", ".ms-char-bind-recent", function () {
    var k = $(this).data("rk");
    if (!k) return;
    editCharacter = k;
    recordRecentBoundChar(k);
    $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
    markDirty();
    toast("success", "已绑定: " + getCharDisplayName(k));
  });
  $p.find("#ms-body").on("click.ms", "#ms-char-bind-search", function () {
    if ($p.find("#ms-char-search-popup").length) {
      $p.find("#ms-char-search-popup").remove();
      $p.off("pointerdown.ms-char-search-close");
      return;
    }
    var currentGid = $p.find("#ms-edit-group").val() || "";
    var currentG = currentGid ? getGroup(currentGid) : null;
    var ipGroupKeys = [];
    var ipGroupName = "";
    if (currentG && isIPGroup(currentG)) {
      ipGroupKeys = getIPGroupCharKeys(currentG);
      ipGroupName = currentG.name;
    }
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
    if (allKeys.length === 0) {
      var historyKeys = Object.keys(getAllCharactersWithStages());
      if (historyKeys.length === 0) {
        toast("warning", "没有可绑定的角色");
        return;
      }
      allKeys = historyKeys;
    }
    $p.find("#ms-char-search-popup").remove();
    var popH =
      '<div id="ms-char-search-popup" style="position:absolute;z-index:5005;background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a));border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);width:280px;max-width:90vw;padding:8px;display:flex;flex-direction:column;gap:6px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">';
    popH +=
      '<input type="text" id="ms-char-search-input" placeholder="输入角色名搜索..." style="padding:6px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;outline:none;">';
    popH +=
      '<div id="ms-char-search-list" style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;"></div>';
    popH += "</div>";
    var btnRect = this.getBoundingClientRect();
    var panelRect = $p[0].getBoundingClientRect();
    $p.append(popH);
    var $pop = $p.find("#ms-char-search-popup");
    var topPos = btnRect.bottom - panelRect.top + 4;
    var leftPos = btnRect.left - panelRect.left;
    var maxLeft = panelRect.width - 290;
    if (leftPos > maxLeft) leftPos = maxLeft;
    if (leftPos < 8) leftPos = 8;
    $pop.css({ top: topPos + "px", left: leftPos + "px" });

    function renderCharList(kw) {
      var lkw = (kw || "").trim().toLowerCase();
      var matched = allKeys.filter(function (k) {
        if (!lkw) return true;
        return getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0;
      });
      var $list = $pop.find("#ms-char-search-list");
      var validIpKeys = !lkw
        ? ipGroupKeys.filter(function (k) {
            return allKeys.indexOf(k) >= 0;
          })
        : [];
      if (matched.length === 0 && validIpKeys.length === 0) {
        $list.html(
          '<div style="padding:12px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的角色</div>',
        );
        return;
      }
      function renderItem(k, isFromIP) {
        var dn = getCharDisplayName(k);
        var ap = getCharAvatarPathSafe(k);
        var avH = ap
          ? '<img src="' +
            esc(ap) +
            '" loading="lazy" decoding="async" style="width:24px;height:24px;border-radius:4px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:#b48cc8;flex-shrink:0;"></i>';
        var isCur = editCharacter === k;
        var bgStyle = isCur
          ? "background:rgba(var(--ms-accent-rgb),0.15);"
          : isFromIP
            ? "background:rgba(var(--ms-accent-rgb),0.05);"
            : "";
        return (
          '<div class="ms-char-search-item" data-key="' +
          esc(k) +
          '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;transition:background 0.12s;' +
          bgStyle +
          '">' +
          avH +
          '<span style="flex:1;font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          esc(dn) +
          "</span>" +
          (isCur
            ? '<i class="fa-solid fa-check" style="color:var(--ms-accent);font-size:11px;"></i>'
            : "") +
          "</div>"
        );
      }
      var listH = "";
      var renderedKeys = new Set();
      if (validIpKeys.length > 0) {
        listH +=
          '<div style="font-size:10px;color:var(--ms-accent);padding:6px 8px 4px;font-weight:600;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-layer-group" style="font-size:9px;"></i>本分组成员（' +
          esc(ipGroupName) +
          "）</div>";
        validIpKeys.forEach(function (k) {
          listH += renderItem(k, true);
          renderedKeys.add(k);
        });
        listH +=
          '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);padding:8px 8px 4px;font-weight:600;border-top:1px solid rgba(255,255,255,0.04);margin-top:4px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-list" style="font-size:9px;"></i>全部角色</div>';
      }
      var shownCount = 0;
      for (var i = 0; i < matched.length && shownCount < 50; i++) {
        if (renderedKeys.has(matched[i])) continue;
        listH += renderItem(matched[i], false);
        shownCount++;
      }
      var totalRemaining = matched.length - renderedKeys.size;
      if (totalRemaining > 50) {
        listH +=
          '<div style="padding:6px;text-align:center;font-size:10px;color:var(--SmartThemeQuoteColor,#666);">仅显示前 50 个，请继续输入缩小范围</div>';
      }
      $list.html(listH);
    }
    renderCharList("");
    $pop.find("#ms-char-search-input").focus();
    $pop.on("input", "#ms-char-search-input", function () {
      renderCharList($(this).val());
    });
    $pop.on("mouseenter", ".ms-char-search-item", function () {
      $(this).css("background", "rgba(255,255,255,0.08)");
    });
    $pop.on("mouseleave", ".ms-char-search-item", function () {
      var k = $(this).data("key");
      $(this).css(
        "background",
        editCharacter === k ? "rgba(var(--ms-accent-rgb),0.15)" : "",
      );
    });
    $pop.on("click", ".ms-char-search-item", function () {
      var k = $(this).data("key");
      editCharacter = k;
      recordRecentBoundChar(k);
      $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
      markDirty();
      toast("success", "已绑定: " + getCharDisplayName(k));
      closeCharSearchPopup();
    });
    function closeCharSearchPopup() {
      $p.find("#ms-char-search-popup").remove();
      $p.off("pointerdown.ms-char-search-close");
    }
    setTimeout(function () {
      $p.on("pointerdown.ms-char-search-close", function (ev) {
        if (
          $(ev.target).closest("#ms-char-search-popup, #ms-char-bind-search")
            .length
        )
          return;
        closeCharSearchPopup();
      });
    }, 50);
  });

  $p.find("#ms-body").on("click.ms", "#ms-quick-add-tag", function () {
    msPrompt("", {
      title: "新建标签",
      placeholder: "请输入新标签名称",
      validate: function (v) {
        if (!v || !v.trim()) return "名称不能为空";
        return null;
      },
    }).then(function (n) {
      if (!n || !n.trim()) return;
      const t = createTag(n.trim());
      editTags.push(t.id);
      $p.find("#ms-edit-tags").html(buildTagsUI());
      markDirty();
    });
  });
  function scheduleDraftSave() {
    if (_editDraftTimer) clearTimeout(_editDraftTimer);
    _editDraftTimer = setTimeout(function () {
      _editDraftTimer = null;
      saveDraft({
        promptId: v.promptId || null,
        charKey: getCurrentCharKeySafe() || null,
        title: $p.find("#ms-edit-title").val() || "",
        content: $p.find("#ms-edit-content").val() || "",
        groupId: $p.find("#ms-edit-group").val() || "",
        author: $p.find("#ms-edit-author").val() || "",
        series: $p.find("#ms-edit-series").val() || "",
        tags: editTags,
        character: editCharacter,
        subGroupId: editSubGroupId,
        savedAt: Date.now(),
      });
    }, 2000);
  }
  $p.find("#ms-body").on("input.ms", "#ms-edit-content", function () {
    um.scheduleCapture();
    const s = countStats(this.value);
    $p.find("#ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
    markDirty();
  });
  $p.find("#ms-body").on("input.ms", "#ms-edit-title", function () {
    var _v = ($(this).val() || "").trim();
    $p.find("#ms-edit-current-title").text(
      _v || (isNew ? "新建小剧场" : "未命名"),
    );
    markDirty();
  });
  $p.find("#ms-body").on("input.ms", "#ms-edit-author", function () {
    markDirty();
  });
  $p.find("#ms-body").on("click.ms", "#ms-edit-group-trigger", function (e) {
    e.stopPropagation();
    if ($p.find("#ms-gp-popup").length) closeGroupPicker();
    else openGroupPicker();
  });
  $p.find("#ms-body").on(
    "keydown.ms",
    "#ms-edit-group-trigger",
    function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (!$p.find("#ms-gp-popup").length) openGroupPicker();
      }
    },
  );
  $p.find("#ms-body").on("click.ms", "#ms-edit-series-trigger", function (e) {
    e.stopPropagation();
    if ($p.find("#ms-sp-popup").length) closeSeriesPicker();
    else openSeriesPicker();
  });
  $p.find("#ms-body").on(
    "keydown.ms",
    "#ms-edit-series-trigger",
    function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (!$p.find("#ms-sp-popup").length) openSeriesPicker();
      }
    },
  );
  $p.find("#ms-body").on("change.ms", "#ms-edit-group", function () {
    var _newGid = $(this).val() || "";
    if (_newGid !== _lastEditGid) {
      editSubGroupId = null;
      _lastEditGid = _newGid;
    }
    refreshGroupTrigger();
    closeSeriesPicker();
    refreshSeriesTrigger();
  });
  $p.find("#ms-body").on("change.ms", "#ms-edit-group", function () {
    if (isNew && !$p.find("#ms-edit-author").val().trim()) {
      const selGid = $(this).val();
      const selG = selGid ? getGroup(selGid) : null;
      if (selG && selG.defaultAuthor)
        $p.find("#ms-edit-author").val(selG.defaultAuthor);
      else if (data.settings.defaultAuthor)
        $p.find("#ms-edit-author").val(data.settings.defaultAuthor);
    }
    $p.find("#ms-edit-tags").html(buildTagsUI());
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
        $p.find("#ms-preview-scroll-bottom").remove();
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
        $taWrap.append(
          '<button class="ms-edit-scroll-bottom" id="ms-preview-scroll-bottom" title="回到底部"><i class="fa-solid fa-angle-down"></i></button>',
        );

        var previewEl2 = $p.find("#ms-edit-preview-pane")[0];

        requestAnimationFrame(function () {
          setScrollByRatio(previewEl2, taRatio);
          $(previewEl2).trigger("scroll");
        });

        $p.find("#ms-edit-preview-pane").on("scroll", function () {
          var $btnTop = $p.find("#ms-preview-scroll-top");
          var $btnBottom = $p.find("#ms-preview-scroll-bottom");
          if (this.scrollTop > 150) $btnTop.addClass("visible");
          else $btnTop.removeClass("visible");
          var distToBottom =
            this.scrollHeight - this.scrollTop - this.clientHeight;
          if (distToBottom > 150) $btnBottom.addClass("visible");
          else $btnBottom.removeClass("visible");
        });
        $p.find("#ms-preview-scroll-top").on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          $p.find("#ms-edit-preview-pane").animate({ scrollTop: 0 }, 200);
        });
        $p.find("#ms-preview-scroll-bottom").on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var $pane = $p.find("#ms-edit-preview-pane");
          $pane.animate({ scrollTop: $pane[0].scrollHeight }, 200);
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
        if (setupKeyboardAdapt.refresh)
          setTimeout(setupKeyboardAdapt.refresh, 80);
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
        el.style.removeProperty("width");
        el.style.removeProperty("max-width");
        el.style.removeProperty("height");
        el.style.removeProperty("max-height");
        el.style.removeProperty("zoom");
        $panel.addClass("ms-focus-mode");
        $(this).addClass("active");
        $(this).find("i").attr("class", "fa-solid fa-compress");
        $(this).attr("title", "退出专注");
        if (setupKeyboardAdapt.refresh)
          setTimeout(setupKeyboardAdapt.refresh, 80);
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
          character: editCharacter,
          subGroupId: editSubGroupId,
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
    "#ms-edit-title, #ms-edit-author",
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
      ((findMatchIdx % positions.length) + positions.length) % positions.length;
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
  $p.find("#ms-body").on("compositionstart.ms", "#ms-find-input", function () {
    this._composing = true;
  });
  $p.find("#ms-body").on("compositionend.ms", "#ms-find-input", function () {
    this._composing = false;
    findMatchIdx = 0;
    updateFindDisplay();
  });
  $p.find("#ms-body").on("input.ms", "#ms-find-input", function () {
    if (this._composing) return;
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
    var $btnTop = $p.find("#ms-edit-scroll-top");
    var $btnBottom = $p.find("#ms-edit-scroll-bottom");
    if (this.scrollTop > 150) $btnTop.addClass("visible");
    else $btnTop.removeClass("visible");
    var distToBottom = this.scrollHeight - this.scrollTop - this.clientHeight;
    if (distToBottom > 150) $btnBottom.addClass("visible");
    else $btnBottom.removeClass("visible");
  });
  $p.find("#ms-edit-scroll-top").on("click.ms", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $p.find("#ms-edit-content").animate({ scrollTop: 0 }, 200);
  });
  $p.find("#ms-edit-scroll-bottom").on("click.ms", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $ta = $p.find("#ms-edit-content");
    $ta.animate({ scrollTop: $ta[0].scrollHeight }, 200);
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
    var _saveSgid = editSubGroupId;
    if (_saveSgid && !getSubGroup(g2, _saveSgid)) _saveSgid = null;
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
        subGroupId: _saveSgid,
        author: a,
        series: sr,
        tags: editTags,
        character: editCharacter,
      });
    } else {
      var newPr = createPrompt({
        title: t || "未命名",
        content: c,
        groupId: g2,
        subGroupId: _saveSgid,
        author: a,
        series: sr,
        tags: editTags,
        character: editCharacter,
      });
      v.promptId = newPr.id;
    }
    if (editCharacter) recordRecentBoundChar(editCharacter);
    navigateBack();
  });
  if (v._savedEditState) {
    var ss = v._savedEditState;
    $p.find("#ms-edit-title").val(ss.title);
    $p.find("#ms-edit-content").val(ss.content);
    $p.find("#ms-edit-group").val(ss.groupId);
    $p.find("#ms-edit-author").val(ss.author);
    $p.find("#ms-edit-series").val(ss.series || "");
    if (ss.subGroupId !== undefined) editSubGroupId = ss.subGroupId;
    _lastEditGid = ss.groupId || "";
    refreshGroupTrigger();
    refreshSeriesTrigger();
    editTags = ss.tags ? [...ss.tags] : [];
    if (ss.character !== undefined) editCharacter = ss.character;
    $p.find("#ms-edit-tags").html(buildTagsUI());
    $p.find("#ms-edit-char-wrap").html(buildCharBindUI());
    var rs = countStats(ss.content);
    $p.find("#ms-char-count").text(rs.chars + " 字 · " + rs.lines + " 行");
    um = createUndoManager(getTa);
    if (ss.undoState) um.setState(ss.undoState);
    if (v._pendingInsert) {
      var ta2 = getTa();
      if (ta2) {
        var pos = ss.cursorPos !== undefined ? ss.cursorPos : ta2.value.length;
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
        panelPos: data.settings.panelPos ? { ...data.settings.panelPos } : null,
      });
      el2.style.removeProperty("left");
      el2.style.removeProperty("top");
      el2.style.removeProperty("transform");
      /* 与手动进入专注模式那条路径保持一致：键盘适配留下的尺寸内联样式要一起清掉，
         并重排一次贴合。否则从常用语页返回后面板带着专注模式的类、却没有对应的尺寸，
         要等到下一次 resize 或点进正文框才对位。 */
      el2.style.removeProperty("width");
      el2.style.removeProperty("max-width");
      el2.style.removeProperty("height");
      el2.style.removeProperty("max-height");
      el2.style.removeProperty("zoom");
      $p.addClass("ms-focus-mode");
      if (setupKeyboardAdapt.refresh)
        setTimeout(setupKeyboardAdapt.refresh, 80);
      var $focusBtn = $p.find("[data-md='focus']");
      $focusBtn.addClass("active").attr("title", "退出专注");
      $focusBtn.find("i").attr("class", "fa-solid fa-compress");
    }
  }
}
