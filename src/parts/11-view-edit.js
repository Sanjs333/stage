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
    });
    var $p = setupPage(
      isNew ? "新建小剧场" : "编辑",
      isNew ? "新建小剧场" : "编辑小剧场",
    );
    var editCharacter = isNew ? v.defaultCharacter || "" : pr.character || "";
    var editCharacterIsLost = editCharacter && !isLocalCharKey(editCharacter);
    let groupOpts = `<option value="">未分组</option>`;
    data.groups.forEach((gg) => {
      groupOpts += `<option value="${gg.id}" ${groupId === gg.id ? "selected" : ""}>${esc(gg.name)}</option>`;
    });
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
        character: editCharacter,
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
      <div class="ms-field"><label>绑定角色 <span style="font-weight:350;opacity:0.5;">(可选，绑定后会出现在角色专属页)</span></label><div id="ms-edit-char-wrap" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;"></div></div>
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
      function () {
        const tid = $(this).data("tag-id"),
          idx = editTags.indexOf(tid);
        if (idx >= 0) editTags.splice(idx, 1);
        else editTags.push(tid);
        $p.find("#ms-edit-tags").html(buildTagsUI());
        markDirty();
      },
    );
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
    $p.find("#ms-body").on(
      "compositionstart.ms",
      "#ms-find-input",
      function () {
        this._composing = true;
      },
    );
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
          character: editCharacter,
        });
      } else {
        var newPr = createPrompt({
          title: t || "未命名",
          content: c,
          groupId: g2,
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

