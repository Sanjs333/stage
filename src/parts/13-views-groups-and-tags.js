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
        var isIP = isIPGroup(g);
        var ipBadge = isIP
          ? '<span style="display:inline-block;margin-left:4px;padding:1px 5px;background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-radius:3px;font-size:9px;vertical-align:middle;"><i class="fa-solid fa-layer-group" style="font-size:8px;margin-right:2px;"></i>IP·' +
            g.charKeys.length +
            "</span>"
          : "";
        var iconH = isIP
          ? buildGroupAvatarHTML(g, 22)
          : '<span class="ms-gitem-color" style="background:' +
            g.color +
            ";cursor:" +
            (groupSelectMode ? "default" : "pointer") +
            ';"' +
            (groupSelectMode ? "" : ' data-gid="' + g.id + '"') +
            "></span>";
        if (groupSelectMode) {
          html += `<div class="ms-gitem ${isSel ? "ms-gitem-selected" : ""}" data-gid="${g.id}"><div class="ms-gitem-check"><i class="fa-solid fa-check"></i></div>${iconH}<span class="ms-gitem-name">${esc(g.name)}${ipBadge}${g.note ? "<br><span style='font-size:10px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;'>" + esc(truncate(g.note, 30)) + "</span>" : ""}</span><span class="ms-gitem-cnt">${cnt}</span></div>`;
        } else {
          html += `<div class="ms-gitem">${iconH}<span class="ms-gitem-name">${esc(g.name)}${ipBadge}${g.note ? "<br><span style='font-size:10px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;'>" + esc(truncate(g.note, 30)) + "</span>" : ""}</span><span class="ms-gitem-cnt">${cnt}</span><button class="ms-gitem-btn" data-action="rename" data-gid="${g.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-gitem-btn danger" data-action="delete-group" data-gid="${g.id}"><i class="fa-solid fa-trash"></i></button></div>`;
          if (expandedColorId === g.id) {
            html += buildColorPickerHTML(g.color, "data-gid", g.id);
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
    else toast("info", "至少需要2个分组才能排序");
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
      msConfirm(msg, {
        title: "批量删除分组",
        dangerous: true,
        okText: "删除",
      }).then(function (ok) {
        if (!ok) return;
        selectedGroupIds.forEach((gid) => deleteGroup(gid));
        selectedGroupIds.clear();
        groupSelectMode = false;
        renderGroups();
        toast("success", "已删除");
      });
    });
  } else {
    $p.find("#ms-body").on("click.ms", ".ms-gitem-btn", function (e) {
      e.stopPropagation();
      const a = $(this).data("action"),
        gid = $(this).data("gid");
      if (a === "rename") navigateTo({ name: "group-edit", groupId: gid });
      else if (a === "delete-group") {
        const cnt = getPromptsInGroup(gid).length;
        msConfirm(
          cnt > 0
            ? `分组下有 ${cnt} 条，删除后变为未分组。确定？`
            : "确定删除该分组吗？",
          { title: "删除分组", dangerous: true, okText: "删除" },
        ).then(function (ok) {
          if (!ok) return;
          deleteGroup(gid);
          renderGroups();
        });
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
  var g = v.groupId ? getGroup(v.groupId) : null,
    isNew = !g;
  if (v.groupId === "_builtin_guide_group") {
    toast("info", "使用指南是内置分组，不可编辑哦");
    navigateBack();
    return;
  }
  if (!isNew && !Array.isArray(g.charKeys)) g.charKeys = [];
  var editCharKeys = isNew ? [] : g.charKeys.slice();
  var editColor = isNew
    ? GROUP_COLORS[data.groups.length % GROUP_COLORS.length]
    : g.color;
  var editIconMode = isNew ? "group" : g.iconMode || "group";
  var editIconFallbackMode =
    editIconMode && editIconMode !== "custom" ? editIconMode : "group";
  var editIconUrl = isNew ? "" : g.iconUrl || "";
  var editIconCharKey = isNew ? "" : g.iconCharKey || "";
  var showCharSection = !isNew && editCharKeys.length > 0;
  var _searchKw = "";

  var $p = setupPage(
    isNew ? "新建分组" : "编辑分组",
    (isNew ? "新建" : "编辑") + "分组",
  );

  function getBoundCharKeysFromPrompts() {
    if (!v.groupId) return [];
    var set = new Set();
    data.prompts.forEach(function (p) {
      if (
        p.groupId === v.groupId &&
        p.character &&
        isLocalCharKey(p.character)
      ) {
        set.add(p.character);
      }
    });
    return Array.from(set);
  }

  function getMergedCharKeys() {
    var merged = new Set(editCharKeys.filter(isLocalCharKey));
    getBoundCharKeysFromPrompts().forEach(function (k) {
      merged.add(k);
    });
    return Array.from(merged);
  }

  function isIPContext() {
    return getMergedCharKeys().length > 0;
  }

  function buildBody() {
    var isCustomColor = !GROUP_COLORS.includes(editColor);
    var ipMode = isIPContext();

    var colorH = "";
    if (!ipMode && editIconMode !== "custom") {
      colorH =
        '<div class="ms-field"><label>颜色</label><div class="ms-color-picker" style="padding:4px 0;">';
      GROUP_COLORS.forEach(function (c) {
        colorH +=
          '<span class="ms-color-opt' +
          (editColor === c ? " selected" : "") +
          '" data-gedit-color="' +
          c +
          '" style="background:' +
          c +
          '"></span>';
      });
      colorH +=
        '<span class="ms-color-opt ms-color-custom' +
        (isCustomColor ? " selected" : "") +
        '" title="+自定义"><input type="color" id="ms-gedit-custom-color" value="' +
        editColor +
        '"></span>';
      colorH += "</div></div>";
    }

    var iconSectionH = '<div class="ms-field"><label>图标样式</label>';
    iconSectionH +=
      '<div class="ms-tag-row" style="gap:6px;margin-bottom:4px;">';
    if (ipMode) {
      iconSectionH +=
        '<span class="ms-tag-toggle' +
        (editIconMode === "group" ? " active" : "") +
        '" data-gedit-iconmode="group" style="' +
        (editIconMode === "group"
          ? "background:var(--ms-accent);color:#fff;"
          : "") +
        '"><i class="fa-solid fa-users" style="margin-right:3px;font-size:10px;"></i>群聊头像</span>';
      iconSectionH +=
        '<span class="ms-tag-toggle' +
        (editIconMode === "char" ? " active" : "") +
        '" data-gedit-iconmode="char" style="' +
        (editIconMode === "char"
          ? "background:var(--ms-accent);color:#fff;"
          : "") +
        '"><i class="fa-solid fa-user" style="margin-right:3px;font-size:10px;"></i>单个角色</span>';
    } else {
      iconSectionH +=
        '<span class="ms-tag-toggle' +
        (editIconMode !== "custom" ? " active" : "") +
        '" data-gedit-iconmode="group" style="' +
        (editIconMode !== "custom"
          ? "background:var(--ms-accent);color:#fff;"
          : "") +
        '"><i class="fa-solid fa-folder" style="margin-right:3px;font-size:10px;"></i>文件夹颜色</span>';
    }
    iconSectionH +=
      '<span class="ms-tag-toggle' +
      (editIconMode === "custom" ? " active" : "") +
      '" data-gedit-iconmode="custom" style="' +
      (editIconMode === "custom"
        ? "background:var(--ms-accent);color:#fff;"
        : "") +
      '"><i class="fa-solid fa-image" style="margin-right:3px;font-size:10px;"></i>自定义图片</span>';
    iconSectionH += "</div>";

    if (editIconMode === "custom") {
      iconSectionH +=
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;">URL</span>' +
        '<input type="text" id="ms-gedit-icon-url" placeholder="粘贴图片直链（例如图床地址）..." value="' +
        esc(editIconUrl) +
        '" style="flex:1;">';
      if (editIconUrl) {
        iconSectionH +=
          '<img src="' +
          esc(editIconUrl) +
          '" style="width:33px;height:33px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.05);flex-shrink:0;" onerror="this.style.display=\'none\';" title="预览图标">';
      }
      iconSectionH += "</div>";
    } else if (editIconMode === "char" && ipMode) {
      var merged = getMergedCharKeys();
      iconSectionH +=
        '<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:140px;overflow-y:auto;">';
      merged.forEach(function (k) {
        var dn = getCharDisplayName(k);
        var ap = getCharAvatarPathSafe(k);
        var isSel = editIconCharKey === k;
        var avH = ap
          ? '<img src="' +
            esc(ap) +
            '" loading="lazy" decoding="async" style="width:20px;height:20px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:4px;">'
          : '<i class="fa-solid fa-user" style="font-size:11px;margin-right:4px;"></i>';
        iconSectionH +=
          '<span class="ms-tag-toggle' +
          (isSel ? " active" : "") +
          '" data-gedit-iconchar="' +
          esc(k) +
          '" style="padding:3px 8px;' +
          (isSel ? "background:var(--ms-accent);color:#fff;" : "") +
          '">' +
          avH +
          esc(dn) +
          "</span>";
      });
      iconSectionH += "</div>";
      if (!editIconCharKey) {
        iconSectionH +=
          '<div style="margin-top:4px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;">选一个角色，会用 TA 的头像作为本分组图标</div>';
      }
    }
    iconSectionH += "</div>";

    var charSectionH = "";
    if (showCharSection) {
      var allChars = [];
      try {
        if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
          allChars = SillyTavern.characters
            .map(function (c) {
              return c.avatar;
            })
            .filter(Boolean);
        }
      } catch (e) {}
      var charMap3 = getAllCharactersWithStages();
      Object.keys(charMap3).forEach(function (k) {
        if (allChars.indexOf(k) < 0) allChars.push(k);
      });
      var boundFromPrompts = getBoundCharKeysFromPrompts();
      var lkw = _searchKw.toLowerCase();
      var filteredChars = allChars.filter(function (k) {
        if (!lkw) return true;
        return getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0;
      });
      var mergedCount = getMergedCharKeys().length;

      charSectionH += '<div class="ms-divider"></div>';
      charSectionH +=
        '<div class="ms-section-label" style="display:flex;align-items:center;gap:6px;"><span>包含角色 (' +
        mergedCount +
        ')</span><span style="font-size:9px;font-weight:normal;opacity:0.6;">勾选显式成员 · 剧场绑定的角色会自动标出</span></div>';
      charSectionH +=
        '<div style="padding:0 14px 6px;"><input type="text" id="ms-gedit-char-search" class="ms-search" placeholder="搜索角色..." value="' +
        esc(_searchKw) +
        '"></div>';
      charSectionH +=
        '<div id="ms-gedit-charlist-scroll" style="max-height:260px;overflow-y:auto;padding:0 14px;">';
      if (filteredChars.length === 0) {
        charSectionH +=
          '<div class="ms-empty" style="padding:16px;"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的角色</div>';
      } else {
        filteredChars.forEach(function (k) {
          var inThis = editCharKeys.indexOf(k) >= 0;
          var isBoundByPrompt = boundFromPrompts.indexOf(k) >= 0;
          var otherG = !inThis ? getCharGroupOfChar(k) : null;
          var otherIsMe = otherG && v.groupId && otherG.id === v.groupId;
          if (otherIsMe) otherG = null;
          var disabled = otherG ? " disabled" : "";
          var noteH = "";
          if (otherG) {
            noteH =
              '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-left:4px;">已在「' +
              esc(otherG.name) +
              "」</span>";
          } else if (isBoundByPrompt && !inThis) {
            noteH =
              '<span style="font-size:10px;color:var(--ms-accent);margin-left:4px;">剧场绑定</span>';
          } else if (isBoundByPrompt && inThis) {
            noteH =
              '<span style="font-size:10px;color:var(--ms-accent);opacity:0.7;margin-left:4px;">显式 + 剧场</span>';
          }
          var dn = getCharDisplayName(k);
          var avP = getCharAvatarPathSafe(k);
          var avM = avP
            ? '<img src="' +
              esc(avP) +
              '" loading="lazy" decoding="async" style="width:20px;height:20px;border-radius:4px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="width:20px;color:#b48cc8;flex-shrink:0;"></i>';
          charSectionH +=
            '<label class="ms-check-item" style="padding:4px 0;display:flex;align-items:center;gap:8px;' +
            (otherG ? "opacity:0.5;" : "") +
            '"><input type="checkbox" class="ms-gedit-char-cb" data-key="' +
            esc(k) +
            '"' +
            (inThis ? " checked" : "") +
            disabled +
            ">" +
            avM +
            "<span>" +
            esc(dn) +
            "</span>" +
            noteH +
            "</label>";
        });
      }
      charSectionH += "</div>";
    }
    var multiPrefixSectionH = "";
    if (!isNew && v.groupId) {
      var groupPrompts = getPromptsInGroup(v.groupId);
      var multiPrefixEnabled = g && g.multiPrefixEnabled;
      var prefixTemplates =
        g && Array.isArray(g.prefixTemplates) ? g.prefixTemplates : [];
      var prefixAssignments = (g && g.prefixAssignments) || {};
      multiPrefixSectionH +=
        '<div class="ms-section-label" style="display:flex;align-items:center;gap:8px;padding:8px 14px 4px;">' +
        '<label class="ms-switch" style="margin:0;"><input type="checkbox" id="ms-gedit-multi-prefix-toggle" ' +
        (multiPrefixEnabled ? "checked" : "") +
        '><span class="ms-switch-slider"></span></label>' +
        '<span style="font-weight:600;text-transform:none;letter-spacing:0;font-size:11px;color:var(--SmartThemeQuoteColor,#888);">多前缀模式</span>' +
        '<span style="font-size:9px;font-weight:normal;opacity:0.6;text-transform:none;letter-spacing:0;">(创建多套前缀模板，适用于分组内多条剧场不同前缀)</span>' +
        "</div>";
      if (multiPrefixEnabled) {
        var tplToPrompts = {};
        Object.keys(prefixAssignments).forEach(function (pid) {
          var tid = prefixAssignments[pid];
          if (!tplToPrompts[tid]) tplToPrompts[tid] = [];
          tplToPrompts[tid].push(pid);
        });
        multiPrefixSectionH +=
          '<div style="padding:4px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;line-height:1.6;">' +
          '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>没被任何模板勾选的剧场，会自动用上方「注入前缀指令」作为分组默认' +
          "</div>";
        multiPrefixSectionH +=
          '<div style="padding:4px 14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<button class="ms-tbtn" id="ms-gedit-add-template" style="font-size:11px;padding:4px 10px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:3px;"></i>添加前缀模板</button>' +
          '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">' +
          prefixTemplates.length +
          " 个模板，" +
          groupPrompts.length +
          " 条剧场</span>" +
          "</div>";
        if (prefixTemplates.length === 0) {
          multiPrefixSectionH +=
            '<div class="ms-empty" style="padding:14px;font-size:11px;"><i class="fa-solid fa-file-lines"></i>还没有模板，点上面「添加前缀模板」开始创建</div>';
        } else {
          multiPrefixSectionH +=
            '<div id="ms-gedit-template-list" style="padding:0 14px;display:flex;flex-direction:column;gap:10px;">';
          prefixTemplates.forEach(function (tpl, tplIdx) {
            var assignedIds = tplToPrompts[tpl.id] || [];
            multiPrefixSectionH +=
              '<div class="ms-prefix-tpl-item" data-tpl-id="' +
              tpl.id +
              '" style="padding:6px 0 10px;border-bottom:1px dashed rgba(255,255,255,0.06);">' +
              '<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">' +
              '<span style="font-size:10px;color:var(--ms-accent);font-weight:600;flex-shrink:0;min-width:28px;">#' +
              (tplIdx + 1) +
              "</span>" +
              '<input type="text" class="ms-prefix-tpl-name" data-tpl-id="' +
              tpl.id +
              '" value="' +
              esc(tpl.name || "未命名模板") +
              '" placeholder="模板名" style="flex:1;min-width:0;padding:3px 8px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:4px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;outline:none;">' +
              '<i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-tpl-content-' +
              tpl.id +
              '" data-fs-title="编辑模板「' +
              esc(truncate(tpl.name || "未命名模板", 20)) +
              '」" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.65;font-size:11px;padding:4px;border-radius:3px;flex-shrink:0;"></i>' +
              '<i class="fa-solid fa-trash ms-prefix-tpl-del" data-tpl-id="' +
              tpl.id +
              '" title="删除模板" style="cursor:pointer;color:var(--ms-danger);opacity:0.65;font-size:11px;padding:4px;border-radius:3px;flex-shrink:0;"></i>' +
              "</div>" +
              '<textarea class="ms-prefix-tpl-content" id="ms-tpl-content-' +
              tpl.id +
              '" data-tpl-id="' +
              tpl.id +
              '" style="min-height:54px;width:100%;font-family:Consolas,monospace;font-size:11px;line-height:1.5;resize:vertical;box-sizing:border-box;margin-bottom:6px;" placeholder="模板内容，可用 {\u200B{stage}}、{\u200B{stage_title}} 等宏">' +
              esc(tpl.content || "") +
              "</textarea>";
            if (groupPrompts.length === 0) {
              multiPrefixSectionH +=
                '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;padding-left:32px;">本分组还没有剧场</div>';
            } else {
              multiPrefixSectionH +=
                '<button class="ms-tbtn ms-prefix-tpl-config" data-tpl-id="' +
                tpl.id +
                '" style="width:100%;text-align:center;font-size:11px;padding:5px 10px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
                '<i class="fa-solid fa-list-check" style="color:var(--ms-accent);"></i>' +
                "<span>配置适用剧场</span>" +
                (assignedIds.length > 0
                  ? '<span style="font-size:11px;color:var(--ms-accent);font-weight:600;">已选 ' +
                    assignedIds.length +
                    " 条</span>"
                  : '<span style="font-size:10px;opacity:0.55;">未配置</span>') +
                "</button>";
            }
            multiPrefixSectionH += "</div>";
          });
          multiPrefixSectionH += "</div>";
        }
        if (groupPrompts.length === 0 && prefixTemplates.length > 0) {
          multiPrefixSectionH +=
            '<div class="ms-empty" style="padding:14px;font-size:11px;margin:6px 14px 0;"><i class="fa-solid fa-folder-open"></i>本分组还没有剧场，添加剧场后再来分配模板</div>';
        }
      }
    }
    var toggleCharSectionH =
      '<button class="ms-tbtn" id="ms-gedit-toggle-charsection" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-' +
      (showCharSection ? "chevron-up" : "layer-group") +
      '"></i> ' +
      (showCharSection ? "隐藏角色列表" : "设为 IP 分组（包含角色）") +
      "</button>";

    return (
      '<div class="ms-form">' +
      '<div class="ms-field"><label>名称</label><input type="text" id="ms-gedit-name" value="' +
      esc(g ? g.name : "") +
      '"></div>' +
      iconSectionH +
      colorH +
      '<div class="ms-field"><label>备注</label><input type="text" id="ms-gedit-note" placeholder="可选的简短说明" value="' +
      esc(g ? g.note : "") +
      '"></div>' +
      '<div class="ms-field"><label>默认作者</label><input type="text" id="ms-gedit-author" placeholder="该分组下新建时自动填入" value="' +
      esc(g ? g.defaultAuthor || "" : "") +
      '"></div>' +
      '<div class="ms-field"><label>注入前缀指令 <span style="font-weight:350;opacity:0.5;">(可选，留空用全局默认，用 {\u200B{stage}} 标记剧场插入位置)</span> <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-gedit-prefix" data-fs-title="编辑分组前缀指令" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i></label><textarea id="ms-gedit-prefix" style="min-height:50px;resize:vertical;" placeholder="该分组的剧场注入时使用此前缀">' +
      esc(g ? g.stagePrefix || "" : "") +
      "</textarea></div>" +
      '<div class="ms-field"><label>多条外壳模板（本组）<span style="font-weight:350;opacity:0.5;">(选多条本组剧场时的整体结构，留空使用全局默认；用 {\u200B{stage_count}} 表示数量、{\u200B{stage_tasks}} 表示所有任务块)</span> <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-gedit-multi-shell" data-fs-title="编辑分组多条外壳模板" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i></label><textarea id="ms-gedit-multi-shell" style="min-height:60px;resize:vertical;" placeholder="留空使用全局默认；多条剧场全在本组时才生效">' +
      esc(g ? g.multiStagePrefix || "" : "") +
      "</textarea></div>" +
      multiPrefixSectionH +
      toggleCharSectionH +
      charSectionH +
      (!isNew
        ? '<button class="ms-tbtn" id="ms-group-set-all-author" style="width:100%;text-align:center;"><i class="fa-solid fa-user-pen"></i> 批量设置本组作者</button>'
        : "") +
      (isNew
        ? '<div class="ms-form-btns"><button class="ms-btn" id="ms-gedit-cancel">取消</button><button class="ms-btn primary" id="ms-gedit-save">保存</button></div>'
        : "") +
      "</div>"
    );
  }

  $p.find("#ms-body").html(buildBody());
  $p.find("#ms-footer").hide();
  bindAllEvents();
  groupEditDirty = false;
  var _gdSaveTimer = null;
  function _saveGroupEditNow() {
    if (!v.groupId) return false;
    var _curView = currentView();
    if (
      !_curView ||
      _curView.name !== "group-edit" ||
      _curView.groupId !== v.groupId
    )
      return false;
    var _g = getGroup(v.groupId);
    if (!_g) return false;
    var $name = $p.find("#ms-gedit-name");
    if (!$name.length) return false;
    var name = ($name.val() || "").trim();
    if (!name) return false;
    _collectMultiPrefixFromUI();
    var stagePrefix = $p.find("#ms-gedit-prefix").val() || "";
    var multiStagePrefix = $p.find("#ms-gedit-multi-shell").val() || "";
    var finalIconUrl = $p.find("#ms-gedit-icon-url").length
      ? $p.find("#ms-gedit-icon-url").val().trim()
      : editIconUrl;
    var payload = {
      name: name,
      note: ($p.find("#ms-gedit-note").val() || "").trim(),
      color: editColor,
      defaultAuthor: ($p.find("#ms-gedit-author").val() || "").trim(),
      stagePrefix: stagePrefix,
      multiStagePrefix: multiStagePrefix,
      iconMode: editIconMode,
      iconUrl: editIconMode === "custom" ? finalIconUrl : "",
      iconCharKey: editIconMode === "char" ? editIconCharKey : "",
      charKeys: editCharKeys.slice(),
      multiPrefixEnabled: editMultiPrefixEnabled,
      prefixTemplates: editPrefixTemplates,
      prefixAssignments: editPrefixAssignments,
    };
    data.groups.forEach(function (og) {
      if (og.id === v.groupId) return;
      if (!Array.isArray(og.charKeys)) return;
      og.charKeys = og.charKeys.filter(function (k) {
        return editCharKeys.indexOf(k) < 0;
      });
    });
    updateGroup(v.groupId, payload);
    _invalidateCharGroupCache();
    return true;
  }
  function _saveGroupEditDebounced() {
    if (_gdSaveTimer) clearTimeout(_gdSaveTimer);
    _gdSaveTimer = setTimeout(function () {
      _gdSaveTimer = null;
      _saveGroupEditNow();
    }, 350);
  }
  flushGroupEdit = function () {
    if (_gdSaveTimer) {
      clearTimeout(_gdSaveTimer);
      _gdSaveTimer = null;
    }
    var ok = _saveGroupEditNow();
    if (ok && v.groupId) groupEditDirty = false;
    return ok;
  };
  if (isNew) {
    $p.find("#ms-body").on(
      "input.ms-gd change.ms-gd",
      "input, textarea, select",
      function () {
        groupEditDirty = true;
      },
    );
    $p.find("#ms-body").on(
      "click.ms-gd",
      "[data-gedit-color], [data-gedit-iconmode], [data-gedit-iconchar], #ms-gedit-custom-icon-toggle, #ms-gedit-toggle-charsection, #ms-gedit-add-template, .ms-prefix-tpl-del, .ms-gedit-char-cb",
      function () {
        groupEditDirty = true;
      },
    );
  } else {
    $p.find("#ms-body").on("input.ms-gd", "input, textarea", function () {
      _saveGroupEditDebounced();
    });
    $p.find("#ms-body").on(
      "change.ms-gd",
      "input, textarea, select",
      function () {
        if (_gdSaveTimer) {
          clearTimeout(_gdSaveTimer);
          _gdSaveTimer = null;
        }
        _saveGroupEditNow();
      },
    );
    $p.find("#ms-body").on("focusout.ms-gd", "input, textarea", function () {
      if (_gdSaveTimer) {
        clearTimeout(_gdSaveTimer);
        _gdSaveTimer = null;
      }
      _saveGroupEditNow();
    });
    $p.find("#ms-body").on(
      "click.ms-gd",
      "[data-gedit-color], [data-gedit-iconmode], [data-gedit-iconchar], #ms-gedit-custom-icon-toggle, #ms-gedit-add-template, .ms-prefix-tpl-del, .ms-gedit-char-cb",
      function () {
        setTimeout(_saveGroupEditNow, 0);
      },
    );
  }

  function refreshBody() {
    var $body = $p.find("#ms-body");
    var sc = $body.scrollTop();
    var $charList = $p.find("#ms-gedit-charlist-scroll");
    var charListSc = $charList.length ? $charList.scrollTop() : 0;
    var nameVal = $p.find("#ms-gedit-name").val();
    var noteVal = $p.find("#ms-gedit-note").val();
    var authorVal = $p.find("#ms-gedit-author").val();
    var prefixVal = $p.find("#ms-gedit-prefix").val();
    var iconUrlVal = $p.find("#ms-gedit-icon-url").length
      ? $p.find("#ms-gedit-icon-url").val()
      : undefined;
    var searchFocused = $p.find("#ms-gedit-char-search").is(":focus");
    var searchSelStart = 0;
    if (searchFocused) {
      try {
        searchSelStart =
          $p.find("#ms-gedit-char-search")[0].selectionStart || 0;
      } catch (e) {}
    }
    $body.html(buildBody());
    if (nameVal !== undefined) $p.find("#ms-gedit-name").val(nameVal);
    if (noteVal !== undefined) $p.find("#ms-gedit-note").val(noteVal);
    if (authorVal !== undefined) $p.find("#ms-gedit-author").val(authorVal);
    if (prefixVal !== undefined) $p.find("#ms-gedit-prefix").val(prefixVal);
    if (iconUrlVal !== undefined && $p.find("#ms-gedit-icon-url").length) {
      $p.find("#ms-gedit-icon-url").val(iconUrlVal);
    }
    $body.scrollTop(sc);
    var $newCharList = $p.find("#ms-gedit-charlist-scroll");
    if ($newCharList.length) $newCharList.scrollTop(charListSc);
    requestAnimationFrame(function () {
      $body.scrollTop(sc);
      var $cl = $p.find("#ms-gedit-charlist-scroll");
      if ($cl.length) $cl.scrollTop(charListSc);
      if (searchFocused) {
        var el = $p.find("#ms-gedit-char-search")[0];
        if (el) {
          el.focus();
          try {
            el.setSelectionRange(searchSelStart, searchSelStart);
          } catch (e) {}
        }
      }
    });
  }
  var editMultiPrefixEnabled = !isNew && g && g.multiPrefixEnabled;
  var editPrefixTemplates =
    !isNew && g && Array.isArray(g.prefixTemplates)
      ? JSON.parse(JSON.stringify(g.prefixTemplates))
      : [];
  var editPrefixAssignments =
    !isNew && g && g.prefixAssignments
      ? Object.assign({}, g.prefixAssignments)
      : {};
  function _collectMultiPrefixFromUI() {
    $p.find(".ms-prefix-tpl-name").each(function () {
      var tid = $(this).data("tpl-id");
      var tpl = editPrefixTemplates.find(function (t) {
        return t.id === tid;
      });
      if (tpl) tpl.name = $(this).val();
    });
    $p.find(".ms-prefix-tpl-content").each(function () {
      var tid = $(this).data("tpl-id");
      var tpl = editPrefixTemplates.find(function (t) {
        return t.id === tid;
      });
      if (tpl) tpl.content = $(this).val();
    });
  }
  function _syncMultiPrefixToGroup() {
    if (!g) return;
    g.multiPrefixEnabled = editMultiPrefixEnabled;
    g.prefixTemplates = editPrefixTemplates;
    g.prefixAssignments = editPrefixAssignments;
  }
  function _refreshMultiPrefixUI() {
    _collectMultiPrefixFromUI();
    var $body = $p.find("#ms-body");
    var sc = $body.scrollTop();
    _syncMultiPrefixToGroup();
    $body.html(buildBody());
    $body.scrollTop(sc);
  }
  $p.find("#ms-body").on(
    "change.ms",
    "#ms-gedit-multi-prefix-toggle",
    function () {
      editMultiPrefixEnabled = $(this).is(":checked");
      _refreshMultiPrefixUI();
    },
  );
  $p.find("#ms-body").on("click.ms", "#ms-gedit-add-template", function () {
    _collectMultiPrefixFromUI();
    var newTpl = {
      id: uid(),
      name: "模板 " + (editPrefixTemplates.length + 1),
      content: "",
    };
    editPrefixTemplates.push(newTpl);
    _refreshMultiPrefixUI();
  });
  $p.find("#ms-body").on("input.ms", ".ms-prefix-tpl-name", function () {
    var tid = $(this).data("tpl-id");
    var tpl = editPrefixTemplates.find(function (t) {
      return t.id === tid;
    });
    if (tpl) tpl.name = $(this).val();
  });
  $p.find("#ms-body").on("input.ms", ".ms-prefix-tpl-content", function () {
    var tid = $(this).data("tpl-id");
    var tpl = editPrefixTemplates.find(function (t) {
      return t.id === tid;
    });
    if (tpl) tpl.content = $(this).val();
  });
  $p.find("#ms-body").on("click.ms", ".ms-prefix-tpl-del", function () {
    var tid = $(this).data("tpl-id");
    var tpl = editPrefixTemplates.find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    var usedCount = 0;
    Object.keys(editPrefixAssignments).forEach(function (pid) {
      if (editPrefixAssignments[pid] === tid) usedCount++;
    });
    var msg =
      usedCount > 0
        ? "确定删除模板「" +
          (tpl.name || "未命名") +
          "」吗？\n\n有 " +
          usedCount +
          " 条剧场分配了这个模板，删除后会自动改用分组默认前缀。"
        : "确定删除模板「" + (tpl.name || "未命名") + "」吗？";
    msConfirm(msg, {
      title: "删除模板",
      dangerous: true,
      okText: "删除",
    }).then(function (ok) {
      if (!ok) return;
      editPrefixTemplates = editPrefixTemplates.filter(function (t) {
        return t.id !== tid;
      });
      Object.keys(editPrefixAssignments).forEach(function (pid) {
        if (editPrefixAssignments[pid] === tid)
          delete editPrefixAssignments[pid];
      });
      _refreshMultiPrefixUI();
    });
  });
  $p.find("#ms-body").on("click.ms", ".ms-prefix-tpl-config", function () {
    var tid = $(this).data("tpl-id");
    if (!tid) return;
    var tpl = editPrefixTemplates.find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    _collectMultiPrefixFromUI();
    var groupPromptsForCfg = getPromptsInGroup(v.groupId);
    var workingAssignments = Object.assign({}, editPrefixAssignments);
    var cfgSearchKw = "";

    function buildTplCfgModalBody() {
      var lkw = cfgSearchKw.toLowerCase();
      var filtered = groupPromptsForCfg.filter(function (p) {
        if (!lkw) return true;
        return (
          (p.title || "").toLowerCase().indexOf(lkw) >= 0 ||
          (p.content || "").toLowerCase().indexOf(lkw) >= 0
        );
      });
      var assignedToThisCount = 0;
      var occupiedByOthersCount = 0;
      groupPromptsForCfg.forEach(function (p) {
        if (workingAssignments[p.id] === tid) assignedToThisCount++;
        else if (workingAssignments[p.id]) occupiedByOthersCount++;
      });
      var html = "";
      html +=
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;line-height:1.6;">';
      html +=
        '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>';
      html +=
        "勾选要使用「<strong>" +
        esc(tpl.name || "未命名") +
        "</strong>」前缀的剧场。被其他模板占用的会显示灰色，可点击以更改至当前模板。";
      html += "</div>";
      html +=
        '<input type="text" class="ms-modal-search" id="ms-tpl-cfg-search" placeholder="搜索剧场..." value="' +
        esc(cfgSearchKw) +
        '">';
      html +=
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;flex-wrap:wrap;">';
      html +=
        '<span style="color:var(--SmartThemeQuoteColor,#888);flex:1;min-width:0;">共 ' +
        groupPromptsForCfg.length +
        ' 条 · 当前模板已选 <strong style="color:var(--ms-accent);">' +
        assignedToThisCount +
        "</strong> 条" +
        (occupiedByOthersCount > 0
          ? ' · <span style="color:var(--ms-accent);opacity:0.85;">' +
            occupiedByOthersCount +
            " 条被其他模板占用</span>"
          : "") +
        "</span>";
      html +=
        '<button class="ms-tbtn" data-tpl-cfg-action="select-free" style="font-size:10px;padding:3px 8px;flex-shrink:0;" title="只勾选未被任何模板占用的剧场">勾选空闲</button>';
      html +=
        '<button class="ms-tbtn" data-tpl-cfg-action="clear" style="font-size:10px;padding:3px 8px;color:var(--ms-danger);border-color:var(--ms-danger);flex-shrink:0;" title="把当前模板下的剧场全部释放">清空</button>';
      html += "</div>";
      if (filtered.length === 0) {
        html +=
          '<div class="ms-empty" style="padding:20px;font-size:11px;"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的剧场</div>';
      } else {
        html +=
          '<div id="ms-tpl-cfg-list" style="max-height:50vh;overflow-y:auto;display:flex;flex-direction:column;gap:3px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;padding:6px;">';
        filtered.forEach(function (p) {
          var assignedTo = workingAssignments[p.id];
          var isAssignedToThis = assignedTo === tid;
          var isAssignedToOther = assignedTo && assignedTo !== tid;
          var otherTpl = isAssignedToOther
            ? editPrefixTemplates.find(function (t) {
                return t.id === assignedTo;
              })
            : null;
          var rowBg = isAssignedToThis
            ? "background:rgba(var(--ms-accent-rgb),0.12);"
            : isAssignedToOther
              ? "background:rgba(255,255,255,0.02);opacity:0.6;"
              : "";
          var checkBg = isAssignedToThis
            ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
            : "";
          var noteH = "";
          if (isAssignedToOther && otherTpl) {
            noteH =
              '<span style="font-size:9px;color:var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.12);padding:1px 6px;border-radius:3px;flex-shrink:0;" title="点击会更改到当前模板">已属于「' +
              esc(truncate(otherTpl.name || "未命名", 12)) +
              "」</span>";
          }
          var seriesH = "";
          if (p.series && String(p.series).trim()) {
            seriesH =
              '<div style="font-size:9px;color:var(--ms-accent);opacity:0.75;display:flex;align-items:center;gap:3px;line-height:1.3;margin-bottom:2px;"><i class="fa-solid fa-layer-group" style="font-size:8px;"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              esc(String(p.series).trim()) +
              "</span></div>";
          }
          html +=
            '<div class="ms-tpl-cfg-row" data-pid="' +
            p.id +
            '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;transition:background 0.12s;' +
            rowBg +
            '">';
          html +=
            '<div class="ms-gitem-check" style="' +
            checkBg +
            '"><i class="fa-solid fa-check"></i></div>';
          html += '<div style="flex:1;min-width:0;overflow:hidden;">';
          html += seriesH;
          html +=
            '<div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--SmartThemeBodyColor,#ddd);">' +
            esc(p.title || "未命名") +
            "</div>";
          html += "</div>";
          html += noteH;
          html +=
            '<button class="ms-card-qbtn ms-tpl-cfg-preview" data-pid="' +
            p.id +
            '" title="预览剧场内容" style="flex-shrink:0;width:24px;height:24px;font-size:10px;"><i class="fa-solid fa-eye"></i></button>';
          html += "</div>";
        });
        html += "</div>";
      }
      return html;
    }

    function refreshTplCfgBody($overlay, keepFocus) {
      var $oldInput = $overlay.find("#ms-tpl-cfg-search");
      var caretPos = -1;
      if (keepFocus && $oldInput.is(":focus") && $oldInput[0]) {
        caretPos = $oldInput[0].selectionStart || 0;
      }
      var $oldList = $overlay.find("#ms-tpl-cfg-list");
      var savedScroll = $oldList.length ? $oldList[0].scrollTop : 0;
      $overlay.find(".ms-modal-body").html(buildTplCfgModalBody());
      var $newList = $overlay.find("#ms-tpl-cfg-list");
      if ($newList.length && savedScroll > 0) {
        $newList[0].scrollTop = savedScroll;
      }
      if (caretPos >= 0) {
        var $newInput = $overlay.find("#ms-tpl-cfg-search");
        if ($newInput.length) {
          $newInput.focus();
          try {
            $newInput[0].setSelectionRange(caretPos, caretPos);
          } catch (e) {}
        }
      }
    }

    showModal({
      title: "配置「" + truncate(tpl.name || "未命名", 18) + "」的适用剧场",
      iconType: "info",
      icon: "fa-list-check",
      modalStyle: "min-width:380px;max-width:94vw;width:520px;",
      body: buildTplCfgModalBody(),
      buttons: [
        { text: "取消", value: null },
        {
          text: "保存",
          cls: "primary",
          primary: true,
          action: function () {
            editPrefixAssignments = workingAssignments;
            _refreshMultiPrefixUI();
            groupEditDirty = true;
            return true;
          },
        },
      ],
      cancelValue: null,
      onShow: function ($overlay) {
        $overlay.on("input", "#ms-tpl-cfg-search", function () {
          cfgSearchKw = $(this).val();
          refreshTplCfgBody($overlay, true);
        });
        $overlay.on("click", ".ms-tpl-cfg-preview", function (e) {
          e.stopPropagation();
          var pid = $(this).data("pid");
          if (!pid) return;
          var pp = getPrompt(pid);
          if (!pp) return;
          showModal({
            title: "预览：" + truncate(pp.title || "未命名", 24),
            iconType: "info",
            icon: "fa-eye",
            modalStyle:
              "min-width:340px;max-width:92vw;width:480px;max-height:80vh;",
            body:
              '<div class="ms-preview-content" style="padding:0;font-size:13px;">' +
              renderMd(pp.content || "") +
              "</div>",
            buttons: [
              { text: "关闭", cls: "primary", primary: true, value: true },
            ],
          });
        });
        $overlay.on("click", ".ms-tpl-cfg-row", function () {
          var pid = $(this).data("pid");
          if (!pid) return;
          if (workingAssignments[pid] === tid) {
            delete workingAssignments[pid];
          } else {
            workingAssignments[pid] = tid;
          }
          refreshTplCfgBody($overlay, false);
        });
        $overlay.on(
          "click",
          '[data-tpl-cfg-action="select-free"]',
          function () {
            groupPromptsForCfg.forEach(function (p) {
              if (!workingAssignments[p.id]) {
                workingAssignments[p.id] = tid;
              }
            });
            refreshTplCfgBody($overlay, false);
          },
        );
        $overlay.on("click", '[data-tpl-cfg-action="clear"]', function () {
          groupPromptsForCfg.forEach(function (p) {
            if (workingAssignments[p.id] === tid) {
              delete workingAssignments[p.id];
            }
          });
          refreshTplCfgBody($overlay, false);
        });
      },
    });
  });
  $p.find("#ms-body").on("change.ms", ".ms-prefix-assign-sel", function () {
    var pid = $(this).data("pid");
    var val = $(this).val();
    if (val) editPrefixAssignments[pid] = val;
    else delete editPrefixAssignments[pid];
    var tid = val;
    var $row = $(this).closest(".ms-prefix-assign-item");
    $row.css(
      "background",
      val ? "rgba(var(--ms-accent-rgb),0.06)" : "rgba(255,255,255,0.02)",
    );
    var $tplList = $p.find("#ms-gedit-template-list");
    if ($tplList.length) {
      editPrefixTemplates.forEach(function (tpl) {
        var usedCount = 0;
        Object.keys(editPrefixAssignments).forEach(function (ppid) {
          if (editPrefixAssignments[ppid] === tpl.id) usedCount++;
        });
        var $badge = $tplList
          .find('.ms-prefix-tpl-item[data-tpl-id="' + tpl.id + '"] span')
          .first();
        if ($badge.length) {
          $badge.text(usedCount > 0 ? "已用 " + usedCount : "未使用");
          $badge.css(
            "color",
            usedCount > 0
              ? "var(--ms-accent)"
              : "var(--SmartThemeQuoteColor,#666)",
          );
          $badge.css(
            "background",
            "rgba(var(--ms-accent-rgb)," +
              (usedCount > 0 ? "0.12" : "0.04") +
              ")",
          );
        }
      });
    }
  });
  $p.find("#ms-body").on("click.ms", "[data-bulk-assign]", function () {
    var target = $(this).data("bulk-assign");
    var groupPrompts = getPromptsInGroup(v.groupId);
    if (target === "default") {
      groupPrompts.forEach(function (p) {
        delete editPrefixAssignments[p.id];
      });
    } else {
      groupPrompts.forEach(function (p) {
        editPrefixAssignments[p.id] = target;
      });
    }
    _refreshMultiPrefixUI();
  });
  $p.find("#ms-body").on("click.ms", "#ms-gedit-cancel", navigateBack);

  $p.find("#ms-body").on("click.ms", "[data-gedit-color]", function () {
    editColor = $(this).data("gedit-color");
    $p.find("[data-gedit-color]").removeClass("selected");
    $(this).addClass("selected");
    $p.find(".ms-color-custom").removeClass("selected");
  });
  $p.find("#ms-body").on("change.ms", "#ms-gedit-custom-color", function () {
    var c = $(this).val();
    if (c) {
      editColor = c;
      $p.find("[data-gedit-color]").removeClass("selected");
      $p.find(".ms-color-custom").addClass("selected");
    }
  });

  $p.find("#ms-body").on("click.ms", "[data-gedit-iconmode]", function () {
    editIconMode = $(this).data("gedit-iconmode");
    if (editIconMode !== "custom") editIconFallbackMode = editIconMode;
    refreshBody();
  });

  $p.find("#ms-body").on("click.ms", "[data-gedit-iconchar]", function () {
    editIconCharKey = $(this).data("gedit-iconchar");
    refreshBody();
  });

  var _iconUrlTimer = null;
  $p.find("#ms-body").on("input.ms", "#ms-gedit-icon-url", function () {
    var val = $(this).val().trim();
    editIconUrl = val;
    if (_iconUrlTimer) clearTimeout(_iconUrlTimer);
    _iconUrlTimer = setTimeout(function () {
      refreshBody();
    }, 700);
  });

  $p.find("#ms-body").on(
    "click.ms",
    "#ms-gedit-toggle-charsection",
    function () {
      showCharSection = !showCharSection;
      refreshBody();
    },
  );

  $p.find("#ms-body").on("change.ms", ".ms-gedit-char-cb", function () {
    var k = $(this).data("key");
    var checked = $(this).is(":checked");
    if (checked) {
      if (editCharKeys.indexOf(k) < 0) editCharKeys.push(k);
    } else {
      var idx = editCharKeys.indexOf(k);
      if (idx >= 0) editCharKeys.splice(idx, 1);
    }
    refreshBody();
  });

  var _charSearchTimer = null;
  $p.find("#ms-body").on("input.ms", "#ms-gedit-char-search", function () {
    var val = $(this).val();
    if (_charSearchTimer) clearTimeout(_charSearchTimer);
    _charSearchTimer = setTimeout(function () {
      _searchKw = val;
      refreshBody();
    }, 200);
  });

  $p.find("#ms-body").on("click.ms", "#ms-group-set-all-author", () => {
    msPrompt("", {
      title: "批量设置本组作者",
      placeholder: "留空则清除作者",
      icon: "fa-user-pen",
    }).then(function (authorVal) {
      if (authorVal === null) return;
      const prompts = getPromptsInGroup(v.groupId);
      prompts.forEach((p) => {
        p.author = authorVal.trim();
      });
      saveData();
      toast("success", `已为${prompts.length} 条设置作者`);
    });
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
    var multiStagePrefix = $p.find("#ms-gedit-multi-shell").val() || "";
    var finalIconUrl = $p.find("#ms-gedit-icon-url").length
      ? $p.find("#ms-gedit-icon-url").val().trim()
      : editIconUrl;
    _collectMultiPrefixFromUI();
    var payload = {
      name: n,
      note: note,
      color: editColor,
      defaultAuthor: defAuthor,
      stagePrefix: stagePrefix,
      multiStagePrefix: multiStagePrefix,
      iconMode: editIconMode,
      iconUrl: editIconMode === "custom" ? finalIconUrl : "",
      iconCharKey: editIconMode === "char" ? editIconCharKey : "",
      charKeys: editCharKeys.slice(),
      multiPrefixEnabled: editMultiPrefixEnabled,
      prefixTemplates: editPrefixTemplates,
      prefixAssignments: editPrefixAssignments,
    };
    data.groups.forEach(function (og) {
      if (v.groupId && og.id === v.groupId) return;
      if (!Array.isArray(og.charKeys)) return;
      og.charKeys = og.charKeys.filter(function (k) {
        return editCharKeys.indexOf(k) < 0;
      });
    });
    if (v.groupId) {
      updateGroup(v.groupId, payload);
    } else {
      const ng = createGroup(n);
      updateGroup(ng.id, payload);
    }
    _invalidateCharGroupCache();
    groupEditDirty = false;
    flushGroupEdit = null;
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
            html += buildColorPickerHTML(t.color, "data-tid", t.id);
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
    else toast("info", "至少需要2个标签才能排序");
  });
  $p.find("#ms-toolbar").on("click.ms", "#ms-tag-add-btn", () => {
    msPrompt("", {
      title: "新建标签",
      placeholder: "请输入新标签名称",
      validate: function (v) {
        if (!v || !v.trim()) return "名称不能为空";
        return null;
      },
    }).then(function (n) {
      if (!n || !n.trim()) return;
      createTag(n.trim());
      renderTagManage();
    });
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
      msConfirm(msg, {
        title: "批量删除标签",
        dangerous: true,
        okText: "删除",
      }).then(function (ok) {
        if (!ok) return;
        selectedTagIds.forEach((tid) => deleteTag(tid));
        selectedTagIds.clear();
        tagSelectMode = false;
        renderTagManage();
        toast("success", "已删除");
      });
    });
  } else {
    $p.find("#ms-body").on(
      "click.ms",
      "[data-action='rename-tag']",
      function (e) {
        e.stopPropagation();
        const t = getTag($(this).data("tid"));
        if (!t) return;
        msPrompt("", {
          title: "重命名标签",
          defaultValue: t.name,
          validate: function (v) {
            if (!v || !v.trim()) return "名称不能为空";
            return null;
          },
        }).then(function (n) {
          if (!n || !n.trim()) return;
          updateTag(t.id, { name: n.trim() });
          renderTagManage();
        });
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      "[data-action='delete-tag']",
      function (e) {
        e.stopPropagation();
        var tid = $(this).data("tid");
        var t = getTag(tid);
        var usageCount = data.prompts.filter((p) =>
          (p.tags || []).includes(tid),
        ).length;
        var confirmMsg = "确定删除标签「" + (t ? t.name : "") + "」吗？";
        if (usageCount > 0) {
          confirmMsg +=
            "\n\n共有 " +
            usageCount +
            " 条剧场使用了此标签，删除后将一并移除。";
        }
        msConfirm(confirmMsg, {
          title: "删除标签",
          dangerous: true,
          okText: "删除",
        }).then(function (ok) {
          if (!ok) return;
          deleteTag(tid);
          renderTagManage();
        });
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
  const $p = setupPage("使用统计");

  const totalPrompts = data.prompts.length;
  const totalGroups = data.groups.length;
  const totalTags = data.settings.definedTags.length;
  const totalUsage = data.prompts.reduce((s, p) => s + (p.usageCount || 0), 0);
  const starredCount = data.prompts.filter((p) => p.starred).length;
  const usedPrompts = data.prompts.filter((p) => p.usageCount > 0);
  const avgUsage =
    usedPrompts.length > 0 ? (totalUsage / usedPrompts.length).toFixed(1) : "0";

  let html = `<div class="ms-stats-grid">
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-masks-theater"></i></span><span class="ms-stat-value">${totalPrompts}</span><span class="ms-stat-label">总剧场数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-paper-plane"></i></span><span class="ms-stat-value">${totalUsage}</span><span class="ms-stat-label">总使用次数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-star"></i></span><span class="ms-stat-value">${starredCount}</span><span class="ms-stat-label">收藏数</span></div>
      <div class="ms-stats-card"><span class="ms-stat-icon"><i class="fa-solid fa-chart-line"></i></span><span class="ms-stat-value">${avgUsage}</span><span class="ms-stat-label">平均使用次数</span></div>
    </div>`;

  var ck = data.settings.checkin || {};
  if (ck.totalDays > 0) {
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    var streakActive = ck.lastDate === todayStr;
    var yest = new Date(today.getTime() - 86400000);
    var yestStr =
      yest.getFullYear() +
      "-" +
      String(yest.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(yest.getDate()).padStart(2, "0");
    var streakHint = streakActive
      ? "今天已打卡 ✓"
      : ck.lastDate === yestStr
        ? "再用一次就续上啦"
        : "连续中断了哦 💔";
    html +=
      '<div class="ms-stats-section">打卡</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:0 14px 4px;">' +
      '<div class="ms-stats-card">' +
      '<span class="ms-stat-icon"><i class="fa-solid fa-fire" style="color:' +
      (streakActive ? "#ff8c69" : "#888") +
      ';"></i></span>' +
      '<span class="ms-stat-value">' +
      (ck.currentStreak || 0) +
      "</span>" +
      '<span class="ms-stat-label">连续天数</span>' +
      "</div>" +
      '<div class="ms-stats-card">' +
      '<span class="ms-stat-icon"><i class="fa-solid fa-calendar-check"></i></span>' +
      '<span class="ms-stat-value">' +
      (ck.totalDays || 0) +
      "</span>" +
      '<span class="ms-stat-label">累计打卡</span>' +
      '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:4px;text-align:center;white-space:nowrap;">' +
      streakHint +
      "</span>" +
      "</div>" +
      '<div class="ms-stats-card">' +
      '<span class="ms-stat-icon"><i class="fa-solid fa-trophy"></i></span>' +
      '<span class="ms-stat-value">' +
      (ck.maxStreak || 0) +
      "</span>" +
      '<span class="ms-stat-label">历史最长</span>' +
      "</div>" +
      "</div>";
  }
  var dailyUsage = data.settings.dailyUsage || {};
  var heatDays = 90;
  var heatToday = new Date();
  var heatMax = 0;
  var heatData = [];
  for (var hi = heatDays - 1; hi >= 0; hi--) {
    var d = new Date(heatToday.getTime() - hi * 86400000);
    var ds =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    var c = dailyUsage[ds] || 0;
    if (c > heatMax) heatMax = c;
    heatData.push({ d: d, str: ds, count: c });
  }
  if (heatMax > 0) {
    html += '<div class="ms-stats-section">最近 90 天活跃热力图</div>';
    html +=
      '<div style="padding:6px 14px;display:flex;flex-wrap:wrap;gap:2px;align-items:flex-start;">';
    heatData.forEach(function (h) {
      var lvl =
        h.count === 0
          ? 0
          : h.count <= heatMax * 0.25
            ? 1
            : h.count <= heatMax * 0.5
              ? 2
              : h.count <= heatMax * 0.75
                ? 3
                : 4;
      var bgs = [
        "rgba(255,255,255,0.04)",
        "rgba(var(--ms-accent-rgb),0.20)",
        "rgba(var(--ms-accent-rgb),0.40)",
        "rgba(var(--ms-accent-rgb),0.65)",
        "rgba(var(--ms-accent-rgb),0.95)",
      ];
      html +=
        '<div style="width:11px;height:11px;border-radius:2px;background:' +
        bgs[lvl] +
        ';" title="' +
        h.str +
        ": " +
        h.count +
        ' 次"></div>';
    });
    html +=
      '</div><div style="padding:0 14px 6px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);display:flex;align-items:center;gap:6px;justify-content:flex-end;">少 <div style="display:flex;gap:2px;"><div style="width:9px;height:9px;border-radius:2px;background:rgba(255,255,255,0.04);"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(var(--ms-accent-rgb),0.20);"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(var(--ms-accent-rgb),0.40);"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(var(--ms-accent-rgb),0.65);"></div><div style="width:9px;height:9px;border-radius:2px;background:rgba(var(--ms-accent-rgb),0.95);"></div></div> 多</div>';
  }
  var monthly = {};
  data.prompts.forEach(function (p) {
    if (!p.createdAt) return;
    var d = new Date(p.createdAt);
    var k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    monthly[k] = (monthly[k] || 0) + 1;
  });
  var mKeys = Object.keys(monthly).sort();
  if (mKeys.length >= 2) {
    var recentMonths = mKeys.slice(-12);
    var mMax = Math.max.apply(
      null,
      recentMonths.map(function (k) {
        return monthly[k];
      }),
    );
    html +=
      '<div class="ms-stats-section" style="margin-bottom:6px;">创作时间轴 (近 12 个月)</div>';
    html +=
      '<div style="padding:6px 14px 8px;display:flex;align-items:flex-end;gap:6px;height:100px;justify-content:flex-start;">';
    recentMonths.forEach(function (k) {
      var v = monthly[k];
      var hh = Math.max(4, Math.round((v / mMax) * 60));
      var mm = k.split("-")[1];
      html +=
        '<div style="flex:1 1 0;max-width:32px;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;" title="' +
        k +
        ": 创建 " +
        v +
        ' 条"><div style="width:100%;max-width:24px;height:' +
        hh +
        'px;background:linear-gradient(180deg,var(--ms-accent),rgba(var(--ms-accent-rgb),0.4));border-radius:3px 3px 0 0;"></div><div style="font-size:9px;color:var(--SmartThemeQuoteColor,#888);white-space:nowrap;">' +
        parseInt(mm) +
        "月</div></div>";
    });
    html += "</div>";
  }
  var upcoming = getUpcomingBirthdayChars(7);
  if (upcoming.length > 0) {
    html +=
      '<div class="ms-stats-section" style="margin-top:6px;">即将到来的生日</div><div style="padding:6px 14px;">';
    upcoming
      .sort(function (a, b) {
        return a.daysLeft - b.daysLeft;
      })
      .forEach(function (u) {
        html +=
          '<div style="padding:4px 0;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);"><i class="fa-solid fa-cake-candles" style="color:#e88aaa;margin-right:4px;"></i>' +
          esc(u.name) +
          " · " +
          esc(u.mmdd) +
          " · " +
          (u.daysLeft === 1 ? "明天" : u.daysLeft + " 天后") +
          "</div>";
      });
    html += "</div>";
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
      html += `<div class="ms-stats-rank-item"><span class="ms-stats-rank-pos ${posCls}">${i + 1}</span><div class="ms-stats-rank-info"><div class="ms-stats-rank-name">${esc(p.title)}</div><div class="ms-stats-rank-meta">${gLabel}</div></div><div class="ms-stats-rank-bar-wrap"><div class="ms-stats-rank-bar" style="width:${barW}%;"></div></div><span class="ms-stats-rank-count">${p.usageCount}次</span></div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="ms-stats-section">最常使用</div><div class="ms-stats-empty">还没有使用记录，快去发送一条剧场吧～</div>`;
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

  var _ipGroupsForStats = getIPGroups();
  if (_ipGroupsForStats.length > 0) {
    var cgUsage = _ipGroupsForStats
      .map(function (cg) {
        var charsInCg = cg.charKeys || [];
        var totalU = 0,
          totalE = 0;
        data.prompts.forEach(function (p) {
          if (p.usageByCharacter) {
            charsInCg.forEach(function (k) {
              if (p.usageByCharacter[k]) totalU += p.usageByCharacter[k];
            });
          }
          if (p.character && charsInCg.indexOf(p.character) >= 0) totalE++;
        });
        return { cg: cg, usage: totalU, exclusive: totalE };
      })
      .filter(function (it) {
        return it.usage > 0 || it.exclusive > 0;
      })
      .sort(function (a, b) {
        return b.usage + b.exclusive - (a.usage + a.exclusive);
      });
    if (cgUsage.length > 0) {
      var cgMax = Math.max.apply(
        null,
        cgUsage.map(function (it) {
          return it.usage + it.exclusive;
        }),
      );
      html +=
        '<div class="ms-stats-section" style="margin-top:6px;">IP 排行</div><div class="ms-stats-rank">';
      cgUsage.slice(0, 5).forEach(function (it, i) {
        var posCls =
          i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "normal";
        var barW = Math.max(((it.usage + it.exclusive) / cgMax) * 100, 5);
        var cgAvatarH = buildGroupAvatarHTML(it.cg, 24);
        html +=
          '<div class="ms-stats-rank-item"><span class="ms-stats-rank-pos ' +
          posCls +
          '">' +
          (i + 1) +
          "</span>" +
          cgAvatarH +
          '<div class="ms-stats-rank-info"><div class="ms-stats-rank-name">' +
          esc(it.cg.name) +
          '</div><div class="ms-stats-rank-meta">' +
          (it.cg.charKeys || []).length +
          " 角色 · " +
          it.exclusive +
          ' 专属</div></div><div class="ms-stats-rank-bar-wrap"><div class="ms-stats-rank-bar" style="width:' +
          barW +
          "%;background:" +
          it.cg.color +
          ';"></div></div><span class="ms-stats-rank-count">' +
          it.usage +
          "次</span></div>";
      });
      html += "</div>";
    }
  }

  var charExclusive = {};
  data.prompts.forEach(function (p) {
    if (p.character && p.character.trim()) {
      var n = p.character.trim();
      charExclusive[n] = (charExclusive[n] || 0) + 1;
    }
  });
  var topExclusive = Object.keys(charExclusive)
    .map(function (n) {
      return { name: n, count: charExclusive[n] };
    })
    .sort(function (a, b) {
      return b.count - a.count;
    })
    .slice(0, 4);
  if (topExclusive.length > 0 && topExclusive[0].count > 0) {
    var maxExc = topExclusive[0].count;
    var charUsageForExc = {};
    data.prompts.forEach(function (p) {
      if (p.usageByCharacter) {
        Object.keys(p.usageByCharacter).forEach(function (cn) {
          charUsageForExc[cn] =
            (charUsageForExc[cn] || 0) + p.usageByCharacter[cn];
        });
      }
    });
    html +=
      '<div class="ms-stats-section" style="margin-top:6px;">专属剧场最多 TOP ' +
      topExclusive.length +
      '</div><div class="ms-stats-rank">';
    topExclusive.forEach(function (c, i) {
      var posCls =
        i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "normal";
      var barW = Math.max((c.count / maxExc) * 100, 5);
      var usedTotal = charUsageForExc[c.name] || 0;
      var avatarPath = getCharAvatarPathSafe(c.name);
      var avatarH = avatarPath
        ? '<div style="width:24px;height:24px;border-radius:4px;overflow:hidden;flex-shrink:0;background:rgba(180,140,200,0.15);"><img src="' +
          esc(avatarPath) +
          '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;"></div>'
        : '<div style="width:24px;height:24px;border-radius:4px;flex-shrink:0;background:rgba(180,140,200,0.15);display:flex;align-items:center;justify-content:center;color:#b48cc8;font-size:11px;"><i class="fa-solid fa-user-tag"></i></div>';
      html +=
        '<div class="ms-stats-rank-item"><span class="ms-stats-rank-pos ' +
        posCls +
        '">' +
        (i + 1) +
        "</span>" +
        avatarH +
        '<div class="ms-stats-rank-info"><div class="ms-stats-rank-name">' +
        esc(getCharDisplayName(c.name)) +
        '</div><div class="ms-stats-rank-meta">' +
        (usedTotal > 0 ? "互动 " + usedTotal + " 次" : "尚未使用") +
        '</div></div><div class="ms-stats-rank-bar-wrap"><div class="ms-stats-rank-bar" style="width:' +
        barW +
        '%;background:#b48cc8;"></div></div><span class="ms-stats-rank-count">' +
        c.count +
        "条</span></div>";
    });
    html += "</div>";
  }

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
  var charNameCount = Object.keys(getAllCharactersWithStages()).length;
  html +=
    '<div style="padding:12px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#555);text-align:center;">' +
    totalGroups +
    " 个分组 · " +
    totalTags +
    " 个标签 · " +
    charNameCount +
    " 个角色 · " +
    usedPrompts.length +
    "/" +
    totalPrompts +
    " 条曾被使用</div>";

  $p.find("#ms-body").html(html);
  $p.find("#ms-footer").hide();
  bindAllEvents();
}
