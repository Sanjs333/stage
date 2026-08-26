function showGroupAssignDialog(opts) {
  var allPrompts = getPromptsInGroup(opts.groupId);
  if (allPrompts.length === 0) {
    toast("info", "本分组还没有剧场");
    return;
  }
  enterBirthdayPanelMode();
  var working = {};
  allPrompts.forEach(function (p) {
    var owner = opts.getOwner(p);
    if (owner) working[p.id] = owner;
  });
  var cfgKw = "";

  function buildCfgBody() {
    var lkw = cfgKw.trim().toLowerCase();
    var filtered = allPrompts.filter(function (p) {
      if (!lkw) return true;
      return (
        (p.title || "").toLowerCase().indexOf(lkw) >= 0 ||
        (p.content || "").toLowerCase().indexOf(lkw) >= 0 ||
        (p.series || "").toLowerCase().indexOf(lkw) >= 0
      );
    });
    var mineCnt = 0;
    var otherCnt = 0;
    allPrompts.forEach(function (p) {
      if (working[p.id] === opts.ownerId) mineCnt++;
      else if (working[p.id]) otherCnt++;
    });
    var html =
      '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;line-height:1.6;"><i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>' +
      opts.desc +
      "</div>" +
      '<input type="text" class="ms-modal-search" id="ms-ga-search" placeholder="搜索剧场标题、内容、系列..." value="' +
      escAttr(cfgKw) +
      '">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;flex-wrap:wrap;">' +
      '<span style="color:var(--SmartThemeQuoteColor,#888);flex:1;min-width:0;">共 ' +
      allPrompts.length +
      ' 条 · 当前已选 <strong style="color:var(--ms-accent);">' +
      mineCnt +
      "</strong> 条" +
      (otherCnt > 0
        ? ' · <span style="color:var(--ms-accent);opacity:0.85;">' +
          otherCnt +
          " 条" +
          opts.otherLabel +
          "</span>"
        : "") +
      "</span>" +
      '<button class="ms-tbtn" data-ga-action="select-free" style="font-size:10px;padding:3px 8px;flex-shrink:0;" title="' +
      escAttr(opts.freeHint) +
      '">勾选空闲</button>' +
      '<button class="ms-tbtn" data-ga-action="clear" style="font-size:10px;padding:3px 8px;color:var(--ms-danger);border-color:var(--ms-danger);flex-shrink:0;">清空</button>' +
      "</div>";
    if (filtered.length === 0) {
      html +=
        '<div class="ms-empty" style="padding:20px;font-size:11px;"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的剧场</div>';
      return html;
    }
    html +=
      '<div id="ms-ga-list" style="min-height:44vh;max-height:50vh;overflow-y:auto;display:flex;flex-direction:column;gap:3px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;padding:6px;">';
    filtered.forEach(function (p) {
      var cur = working[p.id];
      var isMine = cur === opts.ownerId;
      var otherName =
        cur && cur !== opts.ownerId ? opts.ownerNameOf(cur) : null;
      var rowBg = isMine
        ? "background:rgba(var(--ms-accent-rgb),0.12);"
        : otherName
          ? "background:rgba(255,255,255,0.02);opacity:0.6;"
          : "";
      var metaParts = [];
      if (p.character && isLocalCharKey(p.character)) {
        metaParts.push(
          '<span style="color:#b48cc8;"><i class="fa-solid fa-user" style="font-size:8px;margin-right:2px;"></i>' +
            esc(getCharDisplayName(p.character)) +
            "</span>",
        );
      }
      if (p.series && String(p.series).trim()) {
        metaParts.push(
          '<span style="color:var(--ms-accent);opacity:0.8;"><i class="fa-solid fa-layer-group" style="font-size:8px;margin-right:2px;"></i>' +
            esc(String(p.series).trim()) +
            "</span>",
        );
      }
      html +=
        '<div class="ms-ga-row" data-pid="' +
        p.id +
        '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;transition:background 0.12s;' +
        rowBg +
        '">' +
        '<div class="ms-gitem-check" style="' +
        (isMine
          ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
          : "") +
        '"><i class="fa-solid fa-check"></i></div>' +
        '<div style="flex:1;min-width:0;overflow:hidden;">' +
        (metaParts.length > 0
          ? '<div style="font-size:9px;line-height:1.4;margin-bottom:2px;display:flex;gap:6px;flex-wrap:wrap;">' +
            metaParts.join("") +
            "</div>"
          : "") +
        '<div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--SmartThemeBodyColor,#ddd);">' +
        esc(p.title || "未命名") +
        "</div></div>" +
        (otherName
          ? '<span style="font-size:9px;color:var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.12);padding:1px 6px;border-radius:3px;flex-shrink:0;">已属于「' +
            esc(truncate(otherName, 10)) +
            "」</span>"
          : "") +
        '<button class="ms-card-qbtn ms-ga-preview" data-pid="' +
        p.id +
        '" title="预览剧场内容" style="flex-shrink:0;width:24px;height:24px;font-size:10px;"><i class="fa-solid fa-eye"></i></button>' +
        "</div>";
    });
    html += "</div>";
    return html;
  }

  function refreshCfg($overlay, keepFocus) {
    var $oldInput = $overlay.find("#ms-ga-search");
    var caret = -1;
    if (keepFocus && $oldInput.is(":focus") && $oldInput[0]) {
      caret = $oldInput[0].selectionStart || 0;
    }
    var $oldList = $overlay.find("#ms-ga-list");
    var savedScroll = $oldList.length ? $oldList[0].scrollTop : 0;
    $overlay.find(".ms-modal-body").html(buildCfgBody());
    var $newList = $overlay.find("#ms-ga-list");
    if ($newList.length && savedScroll > 0) $newList[0].scrollTop = savedScroll;
    if (caret >= 0) {
      var $newInput = $overlay.find("#ms-ga-search");
      if ($newInput.length) {
        $newInput.focus();
        try {
          $newInput[0].setSelectionRange(caret, caret);
        } catch (e) {}
      }
    }
  }

  showModal({
    title: opts.title,
    iconType: "info",
    icon: "fa-list-check",
    modalStyle: "min-width:380px;max-width:94vw;width:520px;",
    body: buildCfgBody(),
    buttons: [
      { text: "取消", value: null },
      {
        text: "保存",
        cls: "primary",
        primary: true,
        action: function () {
          opts.apply(working, allPrompts);
          return true;
        },
      },
    ],
    cancelValue: null,
    onShow: function ($overlay) {
      $overlay.on("input", "#ms-ga-search", function () {
        cfgKw = $(this).val();
        refreshCfg($overlay, true);
      });
      $overlay.on("click", ".ms-ga-preview", function (e) {
        e.stopPropagation();
        var pp = getPrompt($(this).data("pid"));
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
      $overlay.on("click", ".ms-ga-row", function () {
        var pid = $(this).data("pid");
        if (!pid) return;
        if (working[pid] === opts.ownerId) delete working[pid];
        else working[pid] = opts.ownerId;
        refreshCfg($overlay, false);
      });
      $overlay.on("click", '[data-ga-action="select-free"]', function () {
        allPrompts.forEach(function (p) {
          if (!working[p.id]) working[p.id] = opts.ownerId;
        });
        refreshCfg($overlay, false);
      });
      $overlay.on("click", '[data-ga-action="clear"]', function () {
        allPrompts.forEach(function (p) {
          if (working[p.id] === opts.ownerId) delete working[p.id];
        });
        refreshCfg($overlay, false);
      });
    },
  }).then(function () {
    exitBirthdayPanelMode();
  });
}

function showSubGroupEditDialog(gid, sgid, onDone) {
  var g = getGroup(gid);
  var sg = getSubGroup(gid, sgid);
  if (!g || !sg) return;
  var work = {
    name: sg.name || "",
    color: sg.color || GROUP_COLORS[0],
    note: sg.note || "",
  };
  var _sgeSuffix = Math.random().toString(36).slice(2);
  var nameId = "ms-sge-name-" + _sgeSuffix;
  var noteId = "ms-sge-note-" + _sgeSuffix;
  var cnt = getPromptsInSubGroup(gid, sgid).length;
  var sgTotal = getSubGroups(g).length;

  function captureInputs($overlay) {
    var $n = $overlay.find("#" + nameId);
    if ($n.length) work.name = $n.val();
    var $note = $overlay.find("#" + noteId);
    if ($note.length) work.note = $note.val();
  }

  function buildBody() {
    var isCustom = GROUP_COLORS.indexOf(work.color) < 0;
    var h = "";
    h +=
      '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;margin-bottom:10px;background:rgba(255,255,255,0.03);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);">' +
      '<i class="fa-solid fa-folder-open" id="ms-sge-preview-icon" style="color:' +
      escAttr(work.color) +
      ';font-size:13px;flex-shrink:0;"></i>' +
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      esc(g.name) +
      " · 共 " +
      sgTotal +
      " 个文件夹</span>" +
      '<span style="flex-shrink:0;"><i class="fa-solid fa-masks-theater" style="margin-right:3px;opacity:0.7;"></i>' +
      cnt +
      " 条</span></div>";
    h +=
      '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:4px;display:block;">名称</label>' +
      '<input class="ms-modal-input" id="' +
      nameId +
      '" type="text" value="' +
      escAttr(work.name) +
      '" placeholder="文件夹名称" style="margin-top:0;">';
    h +=
      '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin:10px 0 4px;display:block;">颜色</label><div class="ms-color-picker" style="padding:0;">';
    GROUP_COLORS.forEach(function (c) {
      h +=
        '<span class="ms-color-opt' +
        (work.color === c ? " selected" : "") +
        '" data-sge-color="' +
        c +
        '" style="background:' +
        c +
        '"></span>';
    });
    h +=
      '<span class="ms-color-opt ms-color-custom' +
      (isCustom ? " selected" : "") +
      '" title="+自定义"><input type="color" id="ms-sge-custom-color" value="' +
      escAttr(work.color) +
      '"></span></div>';
    h +=
      '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin:10px 0 4px;display:block;">备注 <span style="font-weight:350;opacity:0.55;">(可选，显示在文件夹页顶部)</span></label>' +
      '<textarea class="ms-modal-textarea" id="' +
      noteId +
      '" placeholder="给这个文件夹写点说明..." style="min-height:60px;margin-top:0;">' +
      esc(work.note) +
      "</textarea>";
    h +=
      '<div style="margin-top:10px;text-align:right;"><a id="ms-sge-goto-manage" style="font-size:11px;color:var(--ms-accent);cursor:pointer;text-decoration:none;"><i class="fa-solid fa-sliders" style="margin-right:4px;"></i>管理本分组全部文件夹</a></div>';
    return h;
  }

  enterBirthdayPanelMode();
  return showModal({
    title: "文件夹设置",
    iconType: "info",
    icon: "fa-folder-open",
    modalStyle: "min-width:320px;max-width:92vw;width:400px;",
    body: buildBody(),
    buttons: [
      { text: "取消", value: null },
      {
        text: "保存",
        cls: "primary",
        primary: true,
        action: function ($overlay) {
          captureInputs($overlay);
          var name = (work.name || "").trim();
          if (!name) {
            toast("warning", "名称不能为空");
            return false;
          }
          updateSubGroup(gid, sgid, {
            name: name,
            color: work.color,
            note: (work.note || "").trim(),
          });
          if (typeof onDone === "function") onDone("saved");
          return true;
        },
      },
    ],
    cancelValue: null,
    onShow: function ($overlay, close) {
      var $nameInput = $overlay.find("#" + nameId);
      $nameInput.focus();
      if ($nameInput[0]) $nameInput[0].select();
      function applyColor(c) {
        if (!c) return;
        work.color = c;
        $overlay.find("[data-sge-color]").removeClass("selected");
        $overlay.find('[data-sge-color="' + c + '"]').addClass("selected");
        $overlay
          .find(".ms-color-custom")
          .toggleClass("selected", GROUP_COLORS.indexOf(c) < 0);
        $overlay.find("#ms-sge-preview-icon").css("color", c);
      }
      $overlay.on("click", "[data-sge-color]", function () {
        applyColor($(this).attr("data-sge-color"));
      });
      $overlay.on("input change", "#ms-sge-custom-color", function () {
        applyColor($(this).val());
      });
      $overlay.on("click", "#ms-sge-goto-manage", function (e) {
        e.preventDefault();
        captureInputs($overlay);
        close(null);
        setTimeout(function () {
          navigateTo({ name: "group-subgroups", groupId: gid });
        }, 200);
      });
    },
  }).then(function () {
    exitBirthdayPanelMode();
  });
}
function renderGroupSubGroups(v) {
  var g = v.groupId ? getGroup(v.groupId) : null;
  if (!g) {
    navigateBack();
    return;
  }
  var expandedSgColorId = null;
  var $p = setupPage("文件夹", "文件夹 · " + truncate(g.name, 14));

  function buildBody() {
    return '<div class="ms-page-minh">' + buildBodyInner() + "</div>";
  }

  function buildBodyInner() {
    var gg = getGroup(v.groupId);
    if (!gg) return "";
    if (!Array.isArray(gg.subGroups)) gg.subGroups = [];
    var sgList = getSubGroups(gg);
    var html = "";
    var sgCounts = {};
    var sgNoneCount = 0;
    getPromptsInGroup(v.groupId).forEach(function (p) {
      if (p.subGroupId && getSubGroup(v.groupId, p.subGroupId)) {
        sgCounts[p.subGroupId] = (sgCounts[p.subGroupId] || 0) + 1;
      } else {
        sgNoneCount++;
      }
    });
    html +=
      '<div style="padding:6px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;line-height:1.6;">' +
      '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>未归入任何文件夹的剧场会直接列在文件夹入口下方' +
      "</div>";
    html +=
      '<div style="padding:4px 14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
      '<button class="ms-tbtn" id="ms-sgp-add" style="font-size:11px;padding:4px 10px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:3px;"></i>添加文件夹</button>' +
      (sgList.length > 1
        ? '<button class="ms-tbtn" id="ms-sgp-reorder" style="font-size:11px;padding:4px 10px;"><i class="fa-solid fa-arrows-up-down" style="margin-right:3px;"></i>拖动排序</button>'
        : "") +
      '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">' +
      sgList.length +
      " 个文件夹</span>" +
      "</div>";
    if (sgList.length === 0) {
      html +=
        '<div class="ms-empty" style="padding:14px;font-size:11px;"><i class="fa-solid fa-folder-open"></i>还没有文件夹，点上方「添加文件夹」开始创建</div>';
      return html;
    }
    html += '<div style="padding:0 14px;">';
    sgList.forEach(function (sg, sgIdx) {
      var _sgCnt = sgCounts[sg.id] || 0;
      html +=
        '<div class="ms-sg-item">' +
        '<div class="ms-sg-row">' +
        '<span class="ms-sg-idx">#' +
        (sgIdx + 1) +
        "</span>" +
        '<span class="ms-sg-dot" data-sg-color-toggle="' +
        sg.id +
        '" style="background:' +
        sg.color +
        ';" title="点击更换颜色"></span>' +
        '<input type="text" class="ms-sg-input ms-sg-name-input" data-sg-id="' +
        sg.id +
        '" value="' +
        escAttr(sg.name) +
        '" placeholder="文件夹名称">' +
        '<i class="fa-solid fa-angle-up ms-sg-icon-btn ms-sg-move" data-sg-dir="up" data-sg-id="' +
        sg.id +
        '" title="上移" style="color:var(--SmartThemeQuoteColor,#888);' +
        (sgIdx === 0 ? "opacity:0.22;pointer-events:none;" : "") +
        '"></i>' +
        '<i class="fa-solid fa-angle-down ms-sg-icon-btn ms-sg-move" data-sg-dir="down" data-sg-id="' +
        sg.id +
        '" title="下移" style="color:var(--SmartThemeQuoteColor,#888);' +
        (sgIdx === sgList.length - 1
          ? "opacity:0.22;pointer-events:none;"
          : "") +
        '"></i>' +
        '<i class="fa-solid fa-trash ms-sg-icon-btn ms-sg-del" data-sg-id="' +
        sg.id +
        '" title="删除文件夹" style="color:var(--ms-danger);"></i>' +
        "</div>";
      if (expandedSgColorId === sg.id) {
        html +=
          '<div class="ms-sg-color-wrap">' +
          buildColorPickerHTML(sg.color, "data-sg-id", sg.id) +
          "</div>";
      }
      html +=
        '<div class="ms-sg-note"><input type="text" class="ms-sg-input ms-sg-note-input" data-sg-id="' +
        sg.id +
        '" value="' +
        escAttr(sg.note || "") +
        '" placeholder="备注（可选）"></div>' +
        '<button class="ms-tbtn ms-sg-config" data-sg-id="' +
        sg.id +
        '" style="width:calc(100% - 30px);margin-left:30px;text-align:center;font-size:11px;padding:5px 10px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i class="fa-solid fa-list-check" style="color:var(--ms-accent);"></i><span>配置包含剧场</span>' +
        (_sgCnt > 0
          ? '<span style="font-size:11px;color:var(--ms-accent);font-weight:600;">已含 ' +
            _sgCnt +
            " 条</span>"
          : '<span style="font-size:10px;opacity:0.55;">暂无剧场</span>') +
        "</button></div>";
    });
    html +=
      '</div><div style="padding:2px 14px 10px;"><div class="ms-sg-nosub"><i class="fa-solid fa-inbox" style="opacity:0.6;"></i>未分类：' +
      sgNoneCount +
      " 条剧场</div></div>";
    return html;
  }

  function buildFooter() {
    var gg = getGroup(v.groupId);
    if (!gg) return "";
    var total = getPromptsInGroup(v.groupId).length;
    var cnt = Array.isArray(gg.subGroups) ? gg.subGroups.length : 0;
    return (
      '<span><i class="fa-solid fa-folder" style="color:' +
      gg.color +
      ';margin-right:4px;font-size:10px;"></i>' +
      esc(gg.name) +
      " · " +
      cnt +
      " 个文件夹 · " +
      total +
      " 条剧场</span>"
    );
  }

  function refresh() {
    var $body = $p.find("#ms-body");
    var sc = $body.scrollTop();
    $body.html(buildBody());
    $body.scrollTop(sc);
    $p.find("#ms-footer").html(buildFooter()).show();
  }

  $p.find("#ms-body").html(buildBody());
  $p.find("#ms-footer").html(buildFooter()).show();
  bindAllEvents();

  $p.find("#ms-body").on("click.ms", "#ms-sgp-add", function () {
    msPrompt("", {
      title: "新建文件夹",
      placeholder: "例如：日常 / 剧情 / 节日",
      validate: function (val) {
        if (!val || !val.trim()) return "名称不能为空";
        return null;
      },
    }).then(function (name) {
      if (!name || !name.trim()) return;
      createSubGroup(v.groupId, name.trim());
      refresh();
    });
  });

  $p.find("#ms-body").on("click.ms", "#ms-sgp-reorder", function () {
    navigateTo({ name: "reorder-subgroups", groupId: v.groupId });
  });

  $p.find("#ms-body").on("click.ms", "[data-sg-color-toggle]", function (e) {
    e.stopPropagation();
    var sgid = $(this).attr("data-sg-color-toggle");
    expandedSgColorId = expandedSgColorId === sgid ? null : sgid;
    refresh();
  });

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-sg-color-wrap .ms-color-opt:not(.ms-color-custom)",
    function (e) {
      e.stopPropagation();
      var sgid = $(this).attr("data-sg-id");
      var color = $(this).data("color");
      if (!sgid || !color) return;
      updateSubGroup(v.groupId, sgid, { color: color });
      refresh();
    },
  );

  $p.find("#ms-body").on(
    "change.ms",
    ".ms-sg-color-wrap .ms-custom-color-input",
    function (e) {
      e.stopPropagation();
      var sgid = $(this).attr("data-sg-id");
      var color = $(this).val();
      if (!sgid || !color) return;
      updateSubGroup(v.groupId, sgid, { color: color });
      refresh();
    },
  );

  $p.find("#ms-body").on("click.ms", ".ms-sg-move", function () {
    var sgid = $(this).data("sg-id");
    var dir = $(this).data("sg-dir");
    var gg = getGroup(v.groupId);
    if (!gg || !Array.isArray(gg.subGroups)) return;
    var idx = -1;
    for (var i = 0; i < gg.subGroups.length; i++) {
      if (gg.subGroups[i].id === sgid) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return;
    var swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= gg.subGroups.length) return;
    var tmp = gg.subGroups[idx];
    gg.subGroups[idx] = gg.subGroups[swap];
    gg.subGroups[swap] = tmp;
    saveData();
    refresh();
  });

  $p.find("#ms-body").on("input.ms", ".ms-sg-name-input", function () {
    var sg = getSubGroup(v.groupId, $(this).data("sg-id"));
    if (!sg) return;
    sg.name = $(this).val();
    saveData();
  });

  $p.find("#ms-body").on("change.ms", ".ms-sg-name-input", function () {
    var sg = getSubGroup(v.groupId, $(this).data("sg-id"));
    if (!sg) return;
    var val = ($(this).val() || "").trim();
    if (!val) {
      val = "未命名";
      $(this).val(val);
    }
    sg.name = val;
    saveData();
  });

  $p.find("#ms-body").on("input.ms", ".ms-sg-note-input", function () {
    var sg = getSubGroup(v.groupId, $(this).data("sg-id"));
    if (!sg) return;
    sg.note = $(this).val();
    saveData();
  });

  $p.find("#ms-body").on("click.ms", ".ms-sg-del", function () {
    var sgid = $(this).data("sg-id");
    var sg = getSubGroup(v.groupId, sgid);
    if (!sg) return;
    var sgName = sg.name;
    var affected = getPromptsInSubGroup(v.groupId, sgid);
    if (affected.length === 0) {
      msConfirm("确定删除文件夹「" + sgName + "」吗？", {
        title: "删除文件夹",
        dangerous: true,
        okText: "删除",
      }).then(function (ok) {
        if (!ok) return;
        deleteSubGroup(v.groupId, sgid);
        expandedSgColorId = null;
        refresh();
      });
      return;
    }
    var others = getSubGroups(getGroup(v.groupId)).filter(function (x) {
      return x.id !== sgid;
    });
    var moveOptsH = "";
    if (others.length > 0) {
      moveOptsH =
        '<div style="margin-top:8px;"><div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:4px;">或移动到其它文件夹：</div>';
      others.forEach(function (o) {
        moveOptsH +=
          '<div class="ms-import-opt" data-sg-del-mode="move" data-sg-del-target="' +
          o.id +
          '" style="padding:8px 12px;margin-bottom:4px;display:flex;align-items:center;gap:8px;">' +
          '<span class="ms-sg-dot" style="cursor:default;background:' +
          o.color +
          ';"></span><span style="font-size:12px;">' +
          esc(o.name) +
          "</span></div>";
      });
      moveOptsH += "</div>";
    }
    showModal({
      title: "删除文件夹",
      iconType: "warning",
      icon: "fa-folder-open",
      modalStyle: "min-width:340px;max-width:92vw;width:420px;",
      body:
        '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;margin-bottom:10px;">文件夹「<strong>' +
        esc(sgName) +
        "</strong>」下还有 <strong>" +
        affected.length +
        " 条剧场</strong>，请选择处理方式：</div>" +
        '<div class="ms-import-opt" data-sg-del-mode="detach"><div class="ms-import-opt-title"><i class="fa-solid fa-inbox"></i> 仅解除归属</div><div class="ms-import-opt-desc">剧场保留，归入「未分类」</div></div>' +
        '<div class="ms-import-opt" data-sg-del-mode="delete" style="border-color:rgba(var(--ms-danger-rgb),0.4);"><div class="ms-import-opt-title" style="color:var(--ms-danger);"><i class="fa-solid fa-trash"></i> 连剧场一起删除</div><div class="ms-import-opt-desc">' +
        affected.length +
        " 条剧场将被永久删除，不可撤销</div></div>" +
        moveOptsH,
      buttons: [{ text: "取消", value: null }],
      cancelValue: null,
      onShow: function ($overlay, close) {
        $overlay.on("click", "[data-sg-del-mode]", function () {
          var mode = $(this).attr("data-sg-del-mode");
          var target = $(this).attr("data-sg-del-target") || null;
          if (mode === "delete") {
            close(null);
            setTimeout(function () {
              msConfirm(
                "确定删除文件夹「" +
                  sgName +
                  "」及其下 " +
                  affected.length +
                  " 条剧场吗？\n\n此操作不可撤销",
                { title: "二次确认", dangerous: true, okText: "删除" },
              ).then(function (ok2) {
                if (!ok2) return;
                deleteSubGroup(v.groupId, sgid, "delete");
                expandedSgColorId = null;
                refresh();
              });
            }, 220);
            return;
          }
          deleteSubGroup(
            v.groupId,
            sgid,
            mode === "move" ? "move" : "detach",
            target,
          );
          close("done");
          expandedSgColorId = null;
          refresh();
        });
      },
    });
  });

  $p.find("#ms-body").on("click.ms", ".ms-sg-config", function () {
    var sgid = $(this).data("sg-id");
    var sg = getSubGroup(v.groupId, sgid);
    if (!sg) return;
    showGroupAssignDialog({
      title: "配置「" + truncate(sg.name, 18) + "」的包含剧场",
      groupId: v.groupId,
      ownerId: sgid,
      desc:
        "勾选要归入「<strong>" +
        esc(sg.name) +
        "</strong>」的剧场。已属于其它文件夹的显示为灰色，点击可改到当前文件夹。",
      otherLabel: "属于其它文件夹",
      freeHint: "只勾选尚未归入任何文件夹的剧场",
      getOwner: function (p) {
        if (p.subGroupId && getSubGroup(v.groupId, p.subGroupId))
          return p.subGroupId;
        return null;
      },
      ownerNameOf: function (id) {
        var o = getSubGroup(v.groupId, id);
        return o ? o.name : "";
      },
      apply: function (working, allPrompts) {
        allPrompts.forEach(function (p) {
          var target = working[p.id] || null;
          if ((p.subGroupId || null) !== target) {
            p.subGroupId = target;
            p.updatedAt = Date.now();
          }
        });
        saveData();
        refresh();
      },
    });
  });
}

function renderGroupPrefixes(v) {
  var g = v.groupId ? getGroup(v.groupId) : null;
  if (!g) {
    navigateBack();
    return;
  }
  var $p = setupPage("多前缀模式", "多前缀 · " + truncate(g.name, 14));
  var _pfxSaveTimer = null;

  function _pfxTemplates() {
    var gg = getGroup(v.groupId);
    if (!gg) return [];
    if (!Array.isArray(gg.prefixTemplates)) gg.prefixTemplates = [];
    return gg.prefixTemplates;
  }

  function _pfxAssignments() {
    var gg = getGroup(v.groupId);
    if (!gg) return {};
    if (!gg.prefixAssignments || typeof gg.prefixAssignments !== "object")
      gg.prefixAssignments = {};
    return gg.prefixAssignments;
  }

  function _pfxSaveDebounced() {
    if (_pfxSaveTimer) clearTimeout(_pfxSaveTimer);
    _pfxSaveTimer = setTimeout(function () {
      _pfxSaveTimer = null;
      saveData();
    }, 400);
  }

  function buildBody() {
    return '<div class="ms-page-minh">' + buildBodyInner() + "</div>";
  }

  function buildBodyInner() {
    var gg = getGroup(v.groupId);
    if (!gg) return "";
    var html = "";
    html +=
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);">' +
      '<label class="ms-switch" style="margin:0;"><input type="checkbox" id="ms-pfx-toggle"' +
      (gg.multiPrefixEnabled ? " checked" : "") +
      '><span class="ms-switch-slider"></span></label>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:13px;color:var(--SmartThemeBodyColor,#ddd);font-weight:500;">启用多前缀模式</div>' +
      '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:2px;">创建多套前缀模板，分组内不同剧场使用不同前缀</div></div>' +
      "</div>";
    if (!gg.multiPrefixEnabled) {
      html +=
        '<div class="ms-empty"><i class="fa-solid fa-file-lines"></i>多前缀模式未启用<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">打开上方开关后即可创建模板</span></div>';
      return html;
    }
    var templates = _pfxTemplates();
    var assignments = _pfxAssignments();
    var groupPrompts = getPromptsInGroup(v.groupId);
    var tplToPrompts = {};
    Object.keys(assignments).forEach(function (pid) {
      var tid = assignments[pid];
      if (!tplToPrompts[tid]) tplToPrompts[tid] = [];
      tplToPrompts[tid].push(pid);
    });
    html +=
      '<div style="padding:6px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;line-height:1.6;">' +
      '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>没被任何模板勾选的剧场，会自动用分组设置里的「注入前缀指令」作为默认' +
      "</div>";
    html +=
      '<div style="padding:4px 14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
      '<button class="ms-tbtn" id="ms-pfx-add" style="font-size:11px;padding:4px 10px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:3px;"></i>添加前缀模板</button>' +
      '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">' +
      templates.length +
      " 个模板，" +
      groupPrompts.length +
      " 条剧场</span>" +
      "</div>";
    if (templates.length === 0) {
      html +=
        '<div class="ms-empty" style="padding:14px;font-size:11px;"><i class="fa-solid fa-file-lines"></i>还没有模板，点上方「添加前缀模板」开始创建</div>';
      return html;
    }
    html +=
      '<div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:10px;">';
    templates.forEach(function (tpl, tplIdx) {
      var assignedIds = tplToPrompts[tpl.id] || [];
      html +=
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
        escAttr(tpl.name || "未命名模板") +
        '" placeholder="模板名" style="flex:1;min-width:0;padding:3px 8px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:4px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;outline:none;">' +
        '<i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-tpl-content-' +
        tpl.id +
        '" data-fs-title="编辑模板「' +
        escAttr(truncate(tpl.name || "未命名模板", 20)) +
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
        html +=
          '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;padding-left:32px;">本分组还没有剧场</div>';
      } else {
        html +=
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
      html += "</div>";
    });
    html += "</div>";
    if (groupPrompts.length === 0) {
      html +=
        '<div class="ms-empty" style="padding:14px;font-size:11px;margin:6px 14px 0 ;"><i class="fa-solid fa-folder-open"></i>本分组还没有剧场，添加剧场后再来分配模板</div>';
    }
    return html;
  }

  function buildFooter() {
    var gg = getGroup(v.groupId);
    if (!gg) return "";
    var total = getPromptsInGroup(v.groupId).length;
    var cnt = Array.isArray(gg.prefixTemplates)
      ? gg.prefixTemplates.length
      : 0;
    return (
      '<span><i class="fa-solid fa-folder" style="color:' +
      gg.color +
      ';margin-right:4px;font-size:10px;"></i>' +
      esc(gg.name) +
      " · " +
      cnt +
      " 个模板 · " +
      total +
      " 条剧场</span>"
    );
  }

  function refresh() {
    var $body = $p.find("#ms-body");
    var sc = $body.scrollTop();
    $body.html(buildBody());
    $body.scrollTop(sc);
    $p.find("#ms-footer").html(buildFooter()).show();
  }

  $p.find("#ms-body").html(buildBody());
  $p.find("#ms-footer").html(buildFooter()).show();
  bindAllEvents();

  $p.find("#ms-body").on("change.ms", "#ms-pfx-toggle", function () {
    var gg = getGroup(v.groupId);
    if (!gg) return;
    gg.multiPrefixEnabled = $(this).is(":checked");
    if (!Array.isArray(gg.prefixTemplates)) gg.prefixTemplates = [];
    if (!gg.prefixAssignments || typeof gg.prefixAssignments !== "object")
      gg.prefixAssignments = {};
    saveData();
    refresh();
  });

  $p.find("#ms-body").on("click.ms", "#ms-pfx-add", function () {
    var templates = _pfxTemplates();
    templates.push({
      id: uid(),
      name: "模板 " + (templates.length + 1),
      content: "",
    });
    saveData();
    refresh();
  });

  $p.find("#ms-body").on("input.ms", ".ms-prefix-tpl-name", function () {
    var tid = $(this).data("tpl-id");
    var tpl = _pfxTemplates().find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    tpl.name = $(this).val();
    _pfxSaveDebounced();
  });

  $p.find("#ms-body").on("change.ms", ".ms-prefix-tpl-name", function () {
    var tid = $(this).data("tpl-id");
    var tpl = _pfxTemplates().find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    var val = ($(this).val() || "").trim();
    if (!val) {
      val = "未命名模板";
      $(this).val(val);
    }
    tpl.name = val;
    saveData();
  });

  $p.find("#ms-body").on("input.ms", ".ms-prefix-tpl-content", function () {
    var tid = $(this).data("tpl-id");
    var tpl = _pfxTemplates().find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    tpl.content = $(this).val();
    _pfxSaveDebounced();
  });

  $p.find("#ms-body").on("change.ms", ".ms-prefix-tpl-content", function () {
    var tid = $(this).data("tpl-id");
    var tpl = _pfxTemplates().find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    tpl.content = $(this).val();
    saveData();
  });

  $p.find("#ms-body").on("click.ms", ".ms-prefix-tpl-del", function () {
    var tid = $(this).data("tpl-id");
    var templates = _pfxTemplates();
    var tpl = templates.find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    var assignments = _pfxAssignments();
    var usedCount = 0;
    Object.keys(assignments).forEach(function (pid) {
      if (assignments[pid] === tid) usedCount++;
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
      var gg = getGroup(v.groupId);
      if (!gg) return;
      gg.prefixTemplates = templates.filter(function (t) {
        return t.id !== tid;
      });
      Object.keys(assignments).forEach(function (pid) {
        if (assignments[pid] === tid) delete assignments[pid];
      });
      saveData();
      refresh();
    });
  });

  $p.find("#ms-body").on("click.ms", ".ms-prefix-tpl-config", function () {
    var tid = $(this).data("tpl-id");
    var tpl = _pfxTemplates().find(function (t) {
      return t.id === tid;
    });
    if (!tpl) return;
    showGroupAssignDialog({
      title: "配置「" + truncate(tpl.name || "未命名", 18) + "」的适用剧场",
      groupId: v.groupId,
      ownerId: tid,
      desc:
        "勾选要使用「<strong>" +
        esc(tpl.name || "未命名") +
        "</strong>」前缀的剧场。被其他模板占用的显示为灰色，点击可改到当前模板。",
      otherLabel: "被其他模板占用",
      freeHint: "只勾选未被任何模板占用的剧场",
      getOwner: function (p) {
        var assignments = _pfxAssignments();
        return assignments[p.id] || null;
      },
      ownerNameOf: function (id) {
        var o = _pfxTemplates().find(function (t) {
          return t.id === id;
        });
        return o ? o.name || "未命名" : "";
      },
      apply: function (working, allPrompts) {
        var assignments = _pfxAssignments();
        allPrompts.forEach(function (p) {
          var target = working[p.id] || null;
          if (target) assignments[p.id] = target;
          else delete assignments[p.id];
        });
        saveData();
        refresh();
      },
    });
  });
}