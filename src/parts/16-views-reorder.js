function renderReorderList(opts) {
  const $p = setupPage(opts.title);
  let multiMode = false;
  const multiSelected = new Set();
  let rangeMode = false;
  let rangeAnchor = null;

  $p.find("#ms-toolbar").append(
    '<div class="ms-toolbar-actions">' +
      '<button class="ms-tbtn" id="ms-reorder-range" title="范围选择模式" style="display:none;"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>' +
      '<button class="ms-tbtn" id="ms-reorder-multi" title="多选批量调序"><i class="fa-solid fa-check-double"></i></button>' +
      "</div>",
  );

  function getItemId(item, i) {
    return item.id !== undefined ? String(item.id) : "idx_" + i;
  }

  function buildReorderBody() {
    let html = "";
    const list = opts.getList();
    if (multiMode && rangeMode) {
      html +=
        '<div style="padding:8px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;"><i class="fa-solid fa-arrows-left-right-to-line" style="color:var(--ms-accent);margin-right:4px;"></i>范围模式：' +
        (rangeAnchor === null
          ? "点选第一项确定锚点"
          : "已锚定，再次点选可扩展或收缩范围") +
        ' · <span style="opacity:0.75;">长按某条目可改锚点到该处</span>' +
        "</div>";
    }
    list.forEach((item, i) => {
      const itemId = getItemId(item, i);
      const isAnchor = rangeMode && rangeAnchor === itemId;
      if (multiMode) {
        const isSelected = multiSelected.has(itemId);
        const checkBg = isSelected
          ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
          : "";
        const rowBg = isSelected
          ? "background:rgba(var(--ms-accent-rgb),0.10);"
          : "";
        const anchorBadge = isAnchor
          ? '<i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;margin-left:4px;" title="锚点"></i>'
          : "";
        html += `<div class="ms-reorder-item" data-ridx="${i}" data-rid="${itemId}" style="cursor:pointer;${rowBg}">
            <div class="ms-gitem-check" style="${checkBg}"><i class="fa-solid fa-check"></i></div>
            ${opts.renderIcon(item)}
            <span class="ms-reorder-name">${esc(item.name)}${anchorBadge}</span>
          </div>`;
      } else {
        html += `<div class="ms-reorder-item" data-ridx="${i}">
            <i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="${i}"></i>
            ${opts.renderIcon(item)}
            <span class="ms-reorder-name">${esc(item.name)}</span>
            <div class="ms-reorder-arrows">
              <button data-dir="up" data-ridx="${i}" ${i === 0 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-up"></i></button>
              <button data-dir="down" data-ridx="${i}" ${i === list.length - 1 ? "disabled style='opacity:0.3;'" : ""}><i class="fa-solid fa-angle-down"></i></button>
            </div>
          </div>`;
      }
    });
    return html;
  }

  var $body = $p.find("#ms-body");

  function buildFooter() {
    if (multiMode) {
      const cnt = multiSelected.size;
      const list = opts.getList();
      const allSel =
        list.length > 0 &&
        list.every((item, i) => multiSelected.has(getItemId(item, i)));
      const selIcon = allSel
        ? "fa-solid fa-square-check"
        : cnt === 0
          ? "fa-regular fa-square"
          : "fa-solid fa-square-minus";
      const selLabel = allSel ? "取消全选" : "全选";
      return `<div class="ms-batch-bar">
          <span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ${cnt}</span>
          <button class="ms-batch-btn" data-mbatch="selectall"><i class="${selIcon}"></i><span class="ms-btn-label"> ${selLabel}</span></button>
          <button class="ms-batch-btn" data-mbatch="top"${cnt === 0 ? " disabled" : ""}><i class="fa-solid fa-angles-up"></i><span class="ms-btn-label"> 置顶</span></button>
          <button class="ms-batch-btn" data-mbatch="up"${cnt === 0 ? " disabled" : ""}><i class="fa-solid fa-angle-up"></i><span class="ms-btn-label"> 上移</span></button>
          <button class="ms-batch-btn" data-mbatch="down"${cnt === 0 ? " disabled" : ""}><i class="fa-solid fa-angle-down"></i><span class="ms-btn-label"> 下移</span></button>
          <button class="ms-batch-btn" data-mbatch="bottom"${cnt === 0 ? " disabled" : ""}><i class="fa-solid fa-angles-down"></i><span class="ms-btn-label"> 置底</span></button>
          <button class="ms-batch-btn" data-mbatch="insert"${cnt === 0 ? " disabled" : ""}><i class="fa-solid fa-arrow-right-to-bracket"></i><span class="ms-btn-label"> 插入到</span></button>
        </div>`;
    }
    return `<span>拖拽或点击箭头调整顺序，右上角 <i class="fa-solid fa-check-double"></i> 进入批量模式</span>`;
  }

  function refresh() {
    $body.html(buildReorderBody());
    $p.find("#ms-footer").html(buildFooter()).show();
    $p.find("#ms-reorder-multi").toggleClass("active", multiMode);
    $p.find("#ms-reorder-range")
      .toggleClass("active", rangeMode)
      .toggle(multiMode);
    if (!multiMode) {
      bindReorderDrag($body, function (fromEl, targetEl) {
        var fromIdx = parseInt(fromEl.getAttribute("data-ridx"));
        var targetIdx = parseInt(targetEl.getAttribute("data-ridx"));
        if (isNaN(fromIdx) || isNaN(targetIdx)) return;
        var list = opts.getList();
        var moved = list.splice(fromIdx, 1)[0];
        var insertIdx = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
        list.splice(insertIdx, 0, moved);
        if (opts.afterChange) opts.afterChange();
        saveData();
        refresh();
      });
    } else {
      if (bindReorderDrag._cleanup) {
        bindReorderDrag._cleanup();
        bindReorderDrag._cleanup = null;
      }
    }
  }

  bindAllEvents();

  $p.find("#ms-toolbar").on("click.ms", "#ms-reorder-multi", function () {
    multiMode = !multiMode;
    multiSelected.clear();
    rangeMode = false;
    rangeAnchor = null;
    refresh();
  });

  $p.find("#ms-toolbar").on("click.ms", "#ms-reorder-range", function () {
    rangeMode = !rangeMode;
    if (rangeMode && multiSelected.size > 0) {
      var list = opts.getList();
      for (var i = 0; i < list.length; i++) {
        var rid = getItemId(list[i], i);
        if (multiSelected.has(rid)) {
          rangeAnchor = rid;
          break;
        }
      }
    } else {
      rangeAnchor = null;
    }
    refresh();
  });

  $p.find("#ms-body").on("pointerdown.ms", ".ms-reorder-item", function (e) {
    if (!multiMode || !rangeMode) return;
    if ($(e.target).closest(".ms-reorder-arrows, .ms-reorder-grip").length)
      return;
    var $el = $(this);
    var rid = $el.attr("data-rid");
    if (rid === undefined) return;
    var sx = e.clientX || 0,
      sy = e.clientY || 0;
    var lpTimer = setTimeout(function () {
      lpTimer = null;
      $el.data("ms-ro-lp-fired", true);
      if (navigator.vibrate) navigator.vibrate(30);
      var list = opts.getList();
      var newAnchorIdx = -1;
      for (var idx = 0; idx < list.length; idx++) {
        if (getItemId(list[idx], idx) === rid) {
          newAnchorIdx = idx;
          break;
        }
      }
      var farEndIdx = -1;
      if (newAnchorIdx >= 0 && rangeAnchor !== null && multiSelected.size > 0) {
        var oldAnchorIdx = -1;
        for (var idx2 = 0; idx2 < list.length; idx2++) {
          if (getItemId(list[idx2], idx2) === rangeAnchor) {
            oldAnchorIdx = idx2;
            break;
          }
        }
        if (oldAnchorIdx >= 0) {
          var selIdxArr = [];
          for (var idx3 = 0; idx3 < list.length; idx3++) {
            if (multiSelected.has(getItemId(list[idx3], idx3)))
              selIdxArr.push(idx3);
          }
          if (selIdxArr.length > 0) {
            var selMin = Math.min.apply(null, selIdxArr);
            var selMax = Math.max.apply(null, selIdxArr);
            if (selMin < oldAnchorIdx) farEndIdx = selMin;
            else if (selMax > oldAnchorIdx) farEndIdx = selMax;
          }
        }
      }
      rangeAnchor = rid;
      multiSelected.clear();
      if (farEndIdx >= 0 && newAnchorIdx >= 0) {
        var lo = Math.min(newAnchorIdx, farEndIdx);
        var hi = Math.max(newAnchorIdx, farEndIdx);
        for (var ii = lo; ii <= hi; ii++)
          multiSelected.add(getItemId(list[ii], ii));
      } else {
        multiSelected.add(rid);
      }
      refresh();
      toast("info", "已设为新锚点");
    }, 600);
    var onMove = function (ev) {
      if (!lpTimer) return;
      var dx = (ev.clientX || 0) - sx,
        dy = (ev.clientY || 0) - sy;
      if (dx * dx + dy * dy > 100) {
        clearTimeout(lpTimer);
        lpTimer = null;
      }
    };
    var onUp = function () {
      if (lpTimer) {
        clearTimeout(lpTimer);
        lpTimer = null;
      }
      $p.off("pointermove.ms-rolp pointerup.ms-rolp pointercancel.ms-rolp");
    };
    $p.off("pointermove.ms-rolp pointerup.ms-rolp pointercancel.ms-rolp")
      .on("pointermove.ms-rolp", onMove)
      .on("pointerup.ms-rolp pointercancel.ms-rolp", onUp);
  });

  $p.find("#ms-body").on("click.ms", ".ms-reorder-item", function (e) {
    if (!multiMode) return;
    if ($(this).data("ms-ro-lp-fired")) {
      $(this).removeData("ms-ro-lp-fired");
      return;
    }
    if ($(e.target).closest(".ms-reorder-arrows, .ms-reorder-grip").length)
      return;
    const rid = $(this).attr("data-rid");
    if (rid === undefined) return;
    const list = opts.getList();
    if (rangeMode) {
      if (
        rangeAnchor === null ||
        !list.some((it, i) => getItemId(it, i) === rangeAnchor)
      ) {
        rangeAnchor = rid;
        multiSelected.clear();
        multiSelected.add(rid);
      } else if (rangeAnchor === rid) {
        rangeAnchor = null;
        multiSelected.clear();
      } else {
        const ai = list.findIndex((it, i) => getItemId(it, i) === rangeAnchor);
        const yi = list.findIndex((it, i) => getItemId(it, i) === rid);
        if (ai < 0 || yi < 0) return;
        const lo = Math.min(ai, yi),
          hi = Math.max(ai, yi);
        multiSelected.clear();
        for (let i = lo; i <= hi; i++) multiSelected.add(getItemId(list[i], i));
      }
    } else {
      if (multiSelected.has(rid)) multiSelected.delete(rid);
      else multiSelected.add(rid);
    }
    refresh();
  });

  $p.find("#ms-body").on("click.ms", ".ms-reorder-arrows button", function () {
    const idx = parseInt($(this).data("ridx")),
      dir = $(this).data("dir");
    var list = opts.getList();
    if (dir === "up" && idx > 0) {
      [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
    } else if (dir === "down" && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    }
    if (opts.afterChange) opts.afterChange();
    saveData();
    refresh();
  });

  $p.find("#ms-footer").on("click.ms", "[data-mbatch]", function () {
    const action = $(this).data("mbatch");
    var list = opts.getList();

    if (action === "selectall") {
      const allSel =
        list.length > 0 &&
        list.every((item, i) => multiSelected.has(getItemId(item, i)));
      if (allSel) {
        multiSelected.clear();
        rangeAnchor = null;
      } else {
        multiSelected.clear();
        list.forEach((item, i) => multiSelected.add(getItemId(item, i)));
      }
      refresh();
      return;
    }

    if (multiSelected.size === 0) return;

    if (action === "up") {
      for (let i = 1; i < list.length; i++) {
        if (
          multiSelected.has(getItemId(list[i], i)) &&
          !multiSelected.has(getItemId(list[i - 1], i - 1))
        ) {
          [list[i - 1], list[i]] = [list[i], list[i - 1]];
        }
      }
    } else if (action === "down") {
      for (let i = list.length - 2; i >= 0; i--) {
        if (
          multiSelected.has(getItemId(list[i], i)) &&
          !multiSelected.has(getItemId(list[i + 1], i + 1))
        ) {
          [list[i], list[i + 1]] = [list[i + 1], list[i]];
        }
      }
    } else if (action === "top") {
      const selectedItems = list.filter((item, i) =>
        multiSelected.has(getItemId(item, i)),
      );
      const otherItems = list.filter(
        (item, i) => !multiSelected.has(getItemId(item, i)),
      );
      list.length = 0;
      list.push(...selectedItems, ...otherItems);
    } else if (action === "bottom") {
      const selectedItems = list.filter((item, i) =>
        multiSelected.has(getItemId(item, i)),
      );
      const otherItems = list.filter(
        (item, i) => !multiSelected.has(getItemId(item, i)),
      );
      list.length = 0;
      list.push(...otherItems, ...selectedItems);
    } else if (action === "insert") {
      const scopeItems = list.map((item, i) => ({
        name: item.name,
        isSelected: multiSelected.has(getItemId(item, i)),
      }));
      showInsertDialog({
        title: "插入到指定位置",
        scopeItems: scopeItems,
        onConfirm: function (targetPos) {
          const selectedItems = list.filter((item, i) =>
            multiSelected.has(getItemId(item, i)),
          );
          const otherItems = list.filter(
            (item, i) => !multiSelected.has(getItemId(item, i)),
          );
          const newList = [
            ...otherItems.slice(0, targetPos),
            ...selectedItems,
            ...otherItems.slice(targetPos),
          ];
          list.length = 0;
          list.push(...newList);
          if (opts.afterChange) opts.afterChange();
          saveData();
          refresh();
        },
      });
      return;
    }

    if (opts.afterChange) opts.afterChange();
    saveData();
    refresh();
  });

  refresh();
}

function renderReorderGroups() {
  renderReorderList({
    title: "调整分组顺序",
    getList: function () {
      return data.groups;
    },
    renderIcon: function (g) {
      var useAvatar =
        isIPGroup(g) ||
        (g.iconMode === "custom" && g.iconUrl) ||
        (g.iconMode === "char" && g.iconCharKey);
      return useAvatar
        ? buildGroupAvatarHTML(g, 22)
        : `<span class="ms-gitem-color" style="background:${g.color};cursor:default;"></span>`;
    },
  });
}

function renderReorderTags() {
  renderReorderList({
    title: "调整标签顺序",
    getList: function () {
      return data.settings.definedTags;
    },
    renderIcon: function (t) {
      return `<span class="ms-gitem-color" style="background:${t.color};cursor:default;"></span>`;
    },
    afterChange: function () {
      _tagOrderVersion++;
    },
  });
}

function renderReorderPrompts(v) {
  if (data.settings.sortMode !== "custom") {
    data.settings.sortMode = "custom";
    saveData();
  }
  var g = getGroup(v.groupId);
  var title = g ? g.name : "条目";
  var $p = setupPage("调整条目顺序", "调整 " + esc(title) + " 内顺序");
  var groupPrompts = data.prompts.filter(function (p) {
    return p.groupId === v.groupId;
  });

  function buildItemBody(p, anchorBadge, smaller, hideSeries, hideCharacter) {
    anchorBadge = anchorBadge || "";
    var titleSize = smaller ? "12px" : "13px";
    var preview = (p.content || "").replace(/\s+/g, " ").trim();
    var previewH = preview
      ? '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;">' +
        esc(truncate(preview, 60)) +
        "</div>"
      : "";
    var metaParts = [];
    if (!hideSeries && p.series && p.series.trim()) {
      metaParts.push(
        '<span style="color:var(--ms-accent);opacity:0.75;display:inline-flex;align-items:center;gap:2px;font-size:9px;"><i class="fa-solid fa-layer-group" style="font-size:8px;"></i>' +
          esc(p.series.trim()) +
          "</span>",
      );
    }
    if (!hideCharacter && p.character && isLocalCharKey(p.character)) {
      metaParts.push(
        '<span style="color:#b48cc8;display:inline-flex;align-items:center;gap:2px;font-size:9px;"><i class="fa-solid fa-user" style="font-size:8px;"></i>' +
          esc(getCharDisplayName(p.character)) +
          "</span>",
      );
    }
    var tagsH = "";
    sortTagIds(p.tags || [])
      .slice(0, 3)
      .forEach(function (tid) {
        var t = getTag(tid);
        if (t)
          tagsH +=
            '<span class="ms-tag-chip ms-tag-chip-sm" style="background:' +
            t.color +
            ';">' +
            esc(t.name) +
            "</span>";
      });
    var ts =
      p.updatedAt && p.updatedAt !== p.createdAt ? p.updatedAt : p.createdAt;
    var tsH = "";
    if (ts) {
      var d = new Date(ts);
      if (!isNaN(d.getTime())) {
        var now = new Date();
        var shortDate =
          d.getFullYear() === now.getFullYear()
            ? String(d.getMonth() + 1).padStart(2, "0") +
              "/" +
              String(d.getDate()).padStart(2, "0")
            : String(d.getFullYear()).slice(2) +
              "/" +
              String(d.getMonth() + 1).padStart(2, "0") +
              "/" +
              String(d.getDate()).padStart(2, "0");
        tsH =
          '<span style="font-size:9px;color:var(--SmartThemeQuoteColor,#666);opacity:0.7;white-space:nowrap;flex-shrink:0;margin-left:auto;">' +
          shortDate +
          "</span>";
      }
    }
    var bottomRow = "";
    if (metaParts.length > 0 || tagsH || tsH) {
      bottomRow =
        '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">' +
        metaParts.join("") +
        tagsH +
        tsH +
        "</div>";
    }
    return (
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;overflow:hidden;">' +
      '<div style="font-size:' +
      titleSize +
      ';font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--SmartThemeBodyColor,#ddd);">' +
      esc(p.title) +
      anchorBadge +
      "</div>" +
      previewH +
      bottomRow +
      "</div>"
    );
  }

  let multiMode = v._reorderMultiMode || false;
  const multiSelected = new Set(v._reorderMultiSelected || []);
  let multiScope = v._reorderMultiScope || null;
  let rangeMode = v._reorderRangeMode || false;
  let rangeAnchor = v._reorderRangeAnchor || null;

  $p.find("#ms-toolbar").html(
    '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button>' +
      '<div class="ms-toolbar-actions">' +
      '<button class="ms-tbtn" id="ms-reorder-prompts-range" title="范围选择模式" style="display:none;"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>' +
      '<button class="ms-tbtn" id="ms-reorder-prompts-multi" title="多选批量调序"><i class="fa-solid fa-check-double"></i></button>' +
      '<button class="ms-tbtn" id="ms-reorder-series-first" title="把所有系列条目自动排到前面"><i class="fa-solid fa-layer-group"></i> 系列优先</button>' +
      "</div>",
  );

  var isIP = g && isIPGroup(g);
  var expandedSeries = new Set(v._reorderExpandedSeries || []);
  var collapsedSections = new Set(v._reorderCollapsedSections || []);

  function partitionByCharacter() {
    var general = [];
    var byChar = {};
    groupPrompts.forEach(function (p) {
      if (p.character && isLocalCharKey(p.character)) {
        if (!byChar[p.character]) byChar[p.character] = [];
        byChar[p.character].push(p);
      } else {
        general.push(p);
      }
    });
    var order = g ? getCharDisplayOrder(g) : [];
    var orderedChars = [];
    order.forEach(function (k) {
      if (byChar[k]) orderedChars.push(k);
    });
    Object.keys(byChar).forEach(function (k) {
      if (orderedChars.indexOf(k) < 0) orderedChars.push(k);
    });
    return { general: general, byChar: byChar, orderedChars: orderedChars };
  }

  function buildBlocksFromList(list) {
    var blocks = [];
    var rendered = new Set();
    list.forEach(function (p) {
      if (rendered.has(p.id)) return;
      if (p.series && p.series.trim()) {
        var seriesName = p.series.trim();
        var items = list.filter(function (q) {
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

  function getScopeLabel(scope) {
    if (!scope) return "未选定";
    if (scope === "_all") return "全部";
    if (scope.indexOf("::series::") >= 0) {
      var parts = scope.split("::series::");
      var section = parts[0];
      var sn = parts[1];
      var sectionLabel =
        section === "_general"
          ? "通用剧场"
          : section.indexOf("char_") === 0
            ? "角色「" + getCharDisplayName(section.substring(5)) + "」"
            : section;
      return sectionLabel + " · 系列「" + sn + "」内";
    }
    if (scope === "_general") return "通用剧场";
    if (scope.indexOf("char_") === 0) {
      return "角色「" + getCharDisplayName(scope.substring(5)) + "」";
    }
    return scope;
  }

  function getScopeOrderedRids(scope) {
    var result = [];
    if (!scope) return result;
    if (scope.indexOf("::series::") >= 0) {
      var partsS = scope.split("::series::");
      var sectionListS = getListForSection(partsS[0]);
      sectionListS.forEach(function (p) {
        if (p.series && p.series.trim() === partsS[1]) {
          result.push("c_" + p.id);
        }
      });
    } else {
      var sectionListT = getListForSection(scope);
      var blocksT = buildBlocksFromList(sectionListT);
      blocksT.forEach(function (block) {
        if (block.type === "single") result.push("p_" + block.item.id);
        if (block.type === "series")
          result.push("s_" + scope + "_" + block.name);
      });
    }
    return result;
  }

  function renderBlocks(blocks, sectionKey) {
    var html = "";
    var hideCharInBody = sectionKey && sectionKey.indexOf("char_") === 0;
    blocks.forEach(function (block, bi) {
      if (block.type === "single") {
        var rid = "p_" + block.item.id;
        var scope = sectionKey;
        if (multiMode) {
          var inScope = !multiScope || scope === multiScope;
          var isSel = multiSelected.has(rid);
          var isAnchorP = rangeMode && rangeAnchor === rid;
          var checkBg = isSel
            ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
            : "";
          var rowBg = isSel
            ? "background:rgba(var(--ms-accent-rgb),0.10);"
            : "";
          var rowOpa = inScope ? "" : "opacity:0.35;pointer-events:none;";
          var anchorBadgeP = isAnchorP
            ? ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>'
            : "";
          html +=
            '<div class="ms-reorder-item" data-rid="' +
            rid +
            '" data-pid="' +
            block.item.id +
            '" data-scope="' +
            esc(scope) +
            '" style="cursor:pointer;' +
            rowBg +
            rowOpa +
            '">' +
            '<div class="ms-gitem-check" style="' +
            checkBg +
            '"><i class="fa-solid fa-check"></i></div>' +
            buildItemBody(
              block.item,
              anchorBadgeP,
              false,
              false,
              hideCharInBody,
            ) +
            '<button class="ms-card-qbtn" data-preview-pid="' +
            block.item.id +
            '" title="查看预览" style="flex-shrink:0;"><i class="fa-solid fa-eye"></i></button>' +
            "</div>";
        } else {
          html +=
            '<div class="ms-reorder-item" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '" data-type="single" data-pid="' +
            block.item.id +
            '"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"></i>' +
            buildItemBody(block.item, "", false, false, hideCharInBody) +
            '<button class="ms-card-qbtn" data-preview-pid="' +
            block.item.id +
            '" title="查看预览" style="flex-shrink:0;"><i class="fa-solid fa-eye"></i></button>' +
            '<div class="ms-reorder-arrows"><button data-dir="up" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"' +
            (bi === 0 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-up"></i></button><button data-dir="down" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"' +
            (bi === blocks.length - 1 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-down"></i></button></div></div>';
        }
      } else {
        var sRid = "s_" + sectionKey + "_" + block.name;
        var sScope = sectionKey;
        var seriesScope = sectionKey + "::series::" + block.name;
        var sidKey = sectionKey + "||" + block.name;
        var isOpen = expandedSeries.has(sidKey);
        var sid = "ms-ro-series-" + simpleHash(sidKey);

        if (multiMode) {
          var inScope2 = !multiScope || sScope === multiScope;
          var isSel2 = multiSelected.has(sRid);
          var isAnchorS = rangeMode && rangeAnchor === sRid;
          var checkBg2 = isSel2
            ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
            : "";
          var rowBg2 = isSel2
            ? "background:rgba(var(--ms-accent-rgb),0.18);"
            : "background:rgba(var(--ms-accent-rgb),0.04);";
          var rowOpa2 = inScope2 ? "" : "opacity:0.35;pointer-events:none;";
          var anchorBadgeS = isAnchorS
            ? ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>'
            : "";
          html +=
            '<div class="ms-reorder-item" data-rid="' +
            sRid +
            '" data-scope="' +
            esc(sScope) +
            '" style="cursor:pointer;' +
            rowBg2 +
            rowOpa2 +
            '">' +
            '<div class="ms-gitem-check" style="' +
            checkBg2 +
            '"><i class="fa-solid fa-check"></i></div>' +
            '<i class="fa-solid fa-angle-right ms-series-arrow' +
            (isOpen ? " open" : "") +
            '" data-ro-series-toggle="' +
            sid +
            '" data-sid-key="' +
            esc(sidKey) +
            '" style="cursor:pointer;font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;width:14px;transition:transform 0.2s;"></i>' +
            '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:12px;flex-shrink:0;"></i>' +
            '<span class="ms-reorder-name" style="font-weight:500;">' +
            esc(block.name) +
            ' <span style="font-weight:400;font-size:11px;color:var(--SmartThemeQuoteColor,#777);">(' +
            block.items.length +
            " 条)</span>" +
            anchorBadgeS +
            "</span>" +
            "</div>";
        } else {
          html +=
            '<div class="ms-reorder-item" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '" data-type="series" data-series-name="' +
            esc(block.name) +
            '" style="background:rgba(var(--ms-accent-rgb),0.04);"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"></i><i class="fa-solid fa-angle-right ms-series-arrow' +
            (isOpen ? " open" : "") +
            '" data-ro-series="' +
            sid +
            '" data-sid-key="' +
            esc(sidKey) +
            '" style="cursor:pointer;font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;width:14px;transition:transform 0.2s;"></i><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:12px;flex-shrink:0;"></i><span class="ms-reorder-name" style="font-weight:500;">' +
            esc(block.name) +
            ' <span style="font-weight:400;font-size:11px;color:var(--SmartThemeQuoteColor,#777);">(' +
            block.items.length +
            ' 条)</span></span><div class="ms-reorder-arrows"><button data-dir="up" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"' +
            (bi === 0 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-up"></i></button><button data-dir="down" data-ridx="' +
            bi +
            '" data-section="' +
            esc(sectionKey) +
            '"' +
            (bi === blocks.length - 1 ? " disabled style='opacity:0.3;'" : "") +
            '><i class="fa-solid fa-angle-down"></i></button></div></div>';
        }

        html +=
          '<div id="' +
          sid +
          '" style="display:' +
          (isOpen ? "block" : "none") +
          ';border-left:2px solid rgba(var(--ms-accent-rgb),0.2);margin-left:14px;">';
        block.items.forEach(function (item, ii) {
          var crid = "c_" + item.id;
          var cscope = seriesScope;

          if (multiMode) {
            var inScopeC = !multiScope || cscope === multiScope;
            var sParentRid = "s_" + sectionKey + "_" + block.name;
            var isSelC =
              multiSelected.has(crid) || multiSelected.has(sParentRid);
            var isAnchorC = rangeMode && rangeAnchor === crid;
            var checkBgC = isSelC
              ? "background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;"
              : "";
            var rowBgC = isSelC
              ? "background:rgba(var(--ms-accent-rgb),0.10);"
              : "";
            var rowOpaC = inScopeC ? "" : "opacity:0.35;pointer-events:none;";
            var anchorBadgeC = isAnchorC
              ? ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>'
              : "";
            html +=
              '<div class="ms-reorder-item" data-rid="' +
              crid +
              '" data-pid="' +
              item.id +
              '" data-scope="' +
              esc(cscope) +
              '" style="cursor:pointer;' +
              rowBgC +
              rowOpaC +
              '">' +
              '<div class="ms-gitem-check" style="' +
              checkBgC +
              '"><i class="fa-solid fa-check"></i></div>' +
              buildItemBody(item, anchorBadgeC, true, true, hideCharInBody) +
              '<button class="ms-card-qbtn" data-preview-pid="' +
              item.id +
              '" title="查看预览" style="flex-shrink:0;width:22px;height:22px;font-size:9px;"><i class="fa-solid fa-eye"></i></button>' +
              "</div>";
          } else {
            html +=
              '<div class="ms-reorder-item" data-type="series-child" data-pid="' +
              item.id +
              '" data-parent-series="' +
              esc(block.name) +
              '" data-parent-section="' +
              esc(sectionKey) +
              '" data-child-idx="' +
              ii +
              '"><i class="fa-solid fa-grip-vertical ms-reorder-grip" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '" data-parent-section="' +
              esc(sectionKey) +
              '"></i>' +
              buildItemBody(item, "", true, true, hideCharInBody) +
              '<button class="ms-card-qbtn" data-preview-pid="' +
              item.id +
              '" title="查看预览" style="flex-shrink:0;width:22px;height:22px;font-size:9px;"><i class="fa-solid fa-eye"></i></button>' +
              '<div class="ms-reorder-arrows"><button data-sdir="up" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '" data-parent-section="' +
              esc(sectionKey) +
              '"' +
              (ii === 0 ? " disabled style='opacity:0.3;'" : "") +
              '><i class="fa-solid fa-angle-up"></i></button><button data-sdir="down" data-child-idx="' +
              ii +
              '" data-parent-series="' +
              esc(block.name) +
              '" data-parent-section="' +
              esc(sectionKey) +
              '"' +
              (ii === block.items.length - 1
                ? " disabled style='opacity:0.3;'"
                : "") +
              '><i class="fa-solid fa-angle-down"></i></button></div></div>';
          }
        });
        html += "</div>";
      }
    });
    return html;
  }

  function buildReorderBody() {
    if (groupPrompts.length === 0) {
      return '<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>该分组没有条目</div>';
    }
    var prefix = "";
    if (multiMode) {
      var rangeHint = "";
      if (rangeMode) {
        rangeHint =
          '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed rgba(var(--ms-accent-rgb),0.25);font-size:10px;color:var(--ms-accent);"><i class="fa-solid fa-arrows-left-right-to-line" style="margin-right:3px;"></i>范围模式：' +
          (rangeAnchor === null
            ? "点选第一项确定锚点"
            : "已锚定，再次点选可扩展或收缩范围") +
          ' · <span style="opacity:0.85;">长按某条目可改锚点到该处</span>' +
          "</div>";
      }
      var ipHint = "";
      if (isIP) {
        ipHint =
          '<div style="margin-top:4px;padding-top:4px;border-top:1px dashed rgba(255,255,255,0.08);font-size:10px;color:var(--SmartThemeQuoteColor,#999);"><i class="fa-solid fa-circle-info" style="margin-right:3px;color:#f0a040;"></i>多选模式仅支持<strong>同一范围内</strong>移动，不支持跨角色移动条目。如需跨角色移动或交换角色顺序，请回到单选拖拽模式</div>';
      }
      prefix =
        '<div style="padding:8px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;"><i class="fa-solid fa-bullseye" style="color:var(--ms-accent);margin-right:4px;"></i>批量范围: <strong>' +
        esc(getScopeLabel(multiScope)) +
        "</strong>" +
        (multiScope
          ? " · 已选 <strong>" + multiSelected.size + "</strong> 项"
          : " · 点选第一项以确定范围（其他范围的项会变灰）") +
        ipHint +
        rangeHint +
        "</div>";
    }
    if (!isIP) {
      var blocks = buildBlocksFromList(groupPrompts);
      return prefix + renderBlocks(blocks, "_all");
    }
    var parts = partitionByCharacter();
    var html = prefix;
    if (parts.general.length > 0) {
      var generalCollapsed = collapsedSections.has("_general");
      html +=
        '<div class="ms-reorder-section-header" data-section-key="_general" style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(var(--ms-accent-rgb),0.08);border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;user-select:none;"><i class="fa-solid fa-angle-' +
        (generalCollapsed ? "right" : "down") +
        '" style="font-size:10px;color:var(--ms-accent);width:12px;"></i><i class="fa-solid fa-scroll" style="color:var(--ms-accent);font-size:12px;"></i><span style="flex:1;font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);">通用剧场 (' +
        parts.general.length +
        " 条)</span><span style='font-size:10px;color:var(--SmartThemeQuoteColor,#666);'>固定置顶</span></div>";
      if (!generalCollapsed) {
        var blocks2 = buildBlocksFromList(parts.general);
        html += renderBlocks(blocks2, "_general");
      }
    }
    parts.orderedChars.forEach(function (k, ci) {
      var ps = parts.byChar[k];
      var dn = getCharDisplayName(k);
      var ap = getCharAvatarPathSafe(k);
      var avH = ap
        ? '<img src="' +
          esc(ap) +
          '" style="width:20px;height:20px;border-radius:4px;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
        : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:13px;"></i>';
      var isCollapsed = collapsedSections.has("char_" + k);
      var sectionKey = "char_" + k;
      var charGripHtml = multiMode
        ? ""
        : '<i class="fa-solid fa-grip-vertical ms-char-section-grip" data-char-key="' +
          esc(k) +
          '" data-char-idx="' +
          ci +
          '" style="cursor:grab;color:var(--SmartThemeQuoteColor,#888);font-size:12px;" title="拖动调整角色顺序"></i>';
      var charArrowsHtml = multiMode
        ? ""
        : '<div class="ms-reorder-arrows"><button data-char-dir="up" data-char-idx="' +
          ci +
          '"' +
          (ci === 0 ? " disabled style='opacity:0.3;'" : "") +
          '><i class="fa-solid fa-angle-up"></i></button><button data-char-dir="down" data-char-idx="' +
          ci +
          '"' +
          (ci === parts.orderedChars.length - 1
            ? " disabled style='opacity:0.3;'"
            : "") +
          '><i class="fa-solid fa-angle-down"></i></button></div>';
      html +=
        '<div class="ms-reorder-section-header" data-section-key="' +
        esc(sectionKey) +
        '" data-char-key="' +
        esc(k) +
        '" data-char-idx="' +
        ci +
        '" style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(180,140,200,0.08);border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;user-select:none;">' +
        charGripHtml +
        '<i class="fa-solid fa-angle-' +
        (isCollapsed ? "right" : "down") +
        '" style="font-size:10px;color:#b48cc8;width:12px;"></i>' +
        avH +
        '<span style="flex:1;font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);">' +
        esc(dn) +
        " (" +
        ps.length +
        " 条)</span>" +
        charArrowsHtml +
        "</div>";
      if (!isCollapsed) {
        var blocks3 = buildBlocksFromList(ps);
        html += renderBlocks(blocks3, sectionKey);
      }
    });
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

  function getListForSection(sectionKey) {
    if (!isIP || sectionKey === "_all") return groupPrompts;
    if (sectionKey === "_general") {
      return groupPrompts.filter(function (p) {
        return !(p.character && isLocalCharKey(p.character));
      });
    }
    if (sectionKey && sectionKey.indexOf("char_") === 0) {
      var ck = sectionKey.substring(5);
      return groupPrompts.filter(function (p) {
        return p.character === ck;
      });
    }
    return groupPrompts;
  }

  function applySectionList(sectionKey, newList) {
    if (!isIP || sectionKey === "_all") {
      groupPrompts.length = 0;
      newList.forEach(function (p) {
        groupPrompts.push(p);
      });
      return;
    }
    var parts = partitionByCharacter();
    if (sectionKey === "_general") parts.general = newList;
    else if (sectionKey.indexOf("char_") === 0) {
      var ck = sectionKey.substring(5);
      parts.byChar[ck] = newList;
    }
    var merged = [];
    parts.general.forEach(function (p) {
      merged.push(p);
    });
    parts.orderedChars.forEach(function (k) {
      (parts.byChar[k] || []).forEach(function (p) {
        merged.push(p);
      });
    });
    groupPrompts.length = 0;
    merged.forEach(function (p) {
      groupPrompts.push(p);
    });
  }

  function buildFooter() {
    if (!multiMode) {
      return (
        "<span>拖拽 / 箭头调序 · " +
        (isIP ? "跨角色拖动会确认改绑 · " : "") +
        '右上角 <i class="fa-solid fa-check-double"></i> 进入批量模式</span>'
      );
    }
    var cnt = multiSelected.size;
    var disabled = cnt === 0 ? " disabled" : "";
    var allSel = false;
    if (multiScope) {
      var orderedRids = getScopeOrderedRids(multiScope);
      allSel =
        orderedRids.length > 0 &&
        orderedRids.every(function (rid) {
          return multiSelected.has(rid);
        });
    }
    var selIcon = allSel
      ? "fa-solid fa-square-check"
      : cnt === 0
        ? "fa-regular fa-square"
        : "fa-solid fa-square-minus";
    var selLabel = allSel ? "取消全选" : "全选范围";
    return (
      '<div class="ms-batch-bar">' +
      '<span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ' +
      cnt +
      "</span>" +
      '<button class="ms-batch-btn" data-pmbatch="selectall"><i class="' +
      selIcon +
      '"></i><span class="ms-btn-label"> ' +
      selLabel +
      "</span></button>" +
      '<button class="ms-batch-btn" data-pmbatch="top"' +
      disabled +
      '><i class="fa-solid fa-angles-up"></i><span class="ms-btn-label"> 置顶</span></button>' +
      '<button class="ms-batch-btn" data-pmbatch="up"' +
      disabled +
      '><i class="fa-solid fa-angle-up"></i><span class="ms-btn-label"> 上移</span></button>' +
      '<button class="ms-batch-btn" data-pmbatch="down"' +
      disabled +
      '><i class="fa-solid fa-angle-down"></i><span class="ms-btn-label"> 下移</span></button>' +
      '<button class="ms-batch-btn" data-pmbatch="bottom"' +
      disabled +
      '><i class="fa-solid fa-angles-down"></i><span class="ms-btn-label"> 置底</span></button>' +
      '<button class="ms-batch-btn" data-pmbatch="insert"' +
      disabled +
      '><i class="fa-solid fa-arrow-right-to-bracket"></i><span class="ms-btn-label"> 插入到</span></button>' +
      "</div>"
    );
  }

  var $body = $p.find("#ms-body");
  function refreshPrompts() {
    $body.html(buildReorderBody());
    $p.find("#ms-footer").html(buildFooter()).show();
    $p.find("#ms-reorder-prompts-multi").toggleClass("active", multiMode);
    $p.find("#ms-reorder-prompts-range")
      .toggleClass("active", rangeMode)
      .toggle(multiMode);
    if (v._lastViewedId) {
      var lastId = v._lastViewedId;
      delete v._lastViewedId;
      setTimeout(function () {
        var $target = $body.find('[data-pid="' + lastId + '"]').first();
        if ($target.length) {
          var $parentSeries = $target.closest('div[id^="ms-ro-series-"]');
          if ($parentSeries.length && $parentSeries.css("display") === "none") {
            var sid = $parentSeries.attr("id");
            $parentSeries.show();
            $body
              .find(
                '[data-ro-series="' +
                  sid +
                  '"], [data-ro-series-toggle="' +
                  sid +
                  '"]',
              )
              .addClass("open");
            var sidKey = $body
              .find("[data-sid-key]")
              .filter(function () {
                return $(this).is(
                  '[data-ro-series="' +
                    sid +
                    '"], [data-ro-series-toggle="' +
                    sid +
                    '"]',
                );
              })
              .first()
              .attr("data-sid-key");
            if (sidKey) expandedSeries.add(sidKey);
          }
          $target.addClass("ms-just-viewed");
          var elRect = $target[0].getBoundingClientRect();
          var bodyRect = $body[0].getBoundingClientRect();
          var relativeTop = elRect.top - bodyRect.top;
          var elH = $target.outerHeight();
          var bodyH = $body.height();
          if (relativeTop < 0 || relativeTop + elH > bodyH) {
            $body.scrollTop($body.scrollTop() + relativeTop - bodyH * 0.3);
          }
        }
      }, 100);
    }

    if (multiMode) {
      if (bindReorderDrag._cleanup) {
        bindReorderDrag._cleanup();
        bindReorderDrag._cleanup = null;
      }
      return;
    }

    bindReorderDrag($body, function (fromEl, targetEl) {
      var fromType = fromEl.getAttribute("data-type");
      var targetType = targetEl.getAttribute("data-type");
      var fromSection =
        fromEl.getAttribute("data-section") ||
        fromEl.getAttribute("data-parent-section");
      var targetSection =
        targetEl.getAttribute("data-section") ||
        targetEl.getAttribute("data-parent-section");

      if (fromType === "series-child" && targetType === "series-child") {
        var fromSeries = fromEl.getAttribute("data-parent-series");
        var targetSeries = targetEl.getAttribute("data-parent-series");
        if (fromSeries !== targetSeries || fromSection !== targetSection)
          return;
        var fromCi = parseInt(fromEl.getAttribute("data-child-idx"));
        var targetCi = parseInt(targetEl.getAttribute("data-child-idx"));
        if (isNaN(fromCi) || isNaN(targetCi)) return;
        var sectionList = getListForSection(fromSection);
        var seriesItems = sectionList.filter(function (p) {
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
        if (gpTarget < 0) groupPrompts.push(movedItem);
        else groupPrompts.splice(gpTarget, 0, movedItem);
        syncGroupPrompts();
        saveData();
        refreshPrompts();
        return;
      }

      if (fromType === "series-child" || targetType === "series-child") return;

      if (fromSection === targetSection) {
        var fromIdx = parseInt(fromEl.getAttribute("data-ridx"));
        var targetIdx = parseInt(targetEl.getAttribute("data-ridx"));
        if (isNaN(fromIdx) || isNaN(targetIdx)) return;
        var sectionList2 = getListForSection(fromSection);
        var blocks = buildBlocksFromList(sectionList2);
        if (
          fromIdx < 0 ||
          fromIdx >= blocks.length ||
          targetIdx < 0 ||
          targetIdx >= blocks.length
        )
          return;
        var movedBlock = blocks.splice(fromIdx, 1)[0];
        var newTargetIdx = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
        blocks.splice(newTargetIdx, 0, movedBlock);
        var newSectionList = [];
        blocks.forEach(function (b) {
          if (b.type === "single") newSectionList.push(b.item);
          else
            b.items.forEach(function (it) {
              newSectionList.push(it);
            });
        });
        applySectionList(fromSection, newSectionList);
        syncGroupPrompts();
        saveData();
        refreshPrompts();
        return;
      }

      if (!isIP) return;
      var fromIdx2 = parseInt(fromEl.getAttribute("data-ridx"));
      if (isNaN(fromIdx2)) return;
      var fromSectionList = getListForSection(fromSection);
      var fromBlocks = buildBlocksFromList(fromSectionList);
      if (fromIdx2 < 0 || fromIdx2 >= fromBlocks.length) return;
      var block = fromBlocks[fromIdx2];
      var fromItems =
        block.type === "single" ? [block.item] : block.items.slice();
      var targetCharKey = null;
      var targetLabel = "";
      if (targetSection === "_general") {
        targetCharKey = "";
        targetLabel = "通用剧场（解除角色绑定）";
      } else if (targetSection && targetSection.indexOf("char_") === 0) {
        targetCharKey = targetSection.substring(5);
        targetLabel = "角色「" + getCharDisplayName(targetCharKey) + "」";
      } else {
        return;
      }
      var cnt = fromItems.length;
      var confirmMsg =
        "确定要把 " +
        cnt +
        " 条剧场" +
        (cnt > 1 ? "（包括系列内所有条目）" : "") +
        " 改绑到 " +
        targetLabel +
        " 吗？\n\n这会修改这些剧场的「角色绑定」字段。";
      msConfirm(confirmMsg, {
        title: "改绑角色",
        type: "warning",
        okText: "改绑",
      }).then(function (ok) {
        if (!ok) {
          refreshPrompts();
          return;
        }
        fromItems.forEach(function (p) {
          p.character = targetCharKey || "";
        });
        fromItems.forEach(function (p) {
          var idx = groupPrompts.indexOf(p);
          if (idx >= 0) groupPrompts.splice(idx, 1);
        });
        var targetSectionPrompts = groupPrompts.filter(function (p) {
          if (targetCharKey === "")
            return !(p.character && isLocalCharKey(p.character));
          return p.character === targetCharKey;
        });
        if (targetSectionPrompts.length === 0) {
          groupPrompts.push.apply(groupPrompts, fromItems);
        } else {
          var lastInTarget =
            targetSectionPrompts[targetSectionPrompts.length - 1];
          var insertAt = groupPrompts.indexOf(lastInTarget) + 1;
          groupPrompts.splice.apply(
            groupPrompts,
            [insertAt, 0].concat(fromItems),
          );
        }
        syncGroupPrompts();
        saveData();
        toast("success", "已改绑到 " + targetLabel);
        refreshPrompts();
      });
    });
  }

  bindAllEvents();

  function doReorderSeriesFirst() {
    function sortSeriesFirst(list) {
      var s = [],
        l = [];
      list.forEach(function (p) {
        if (p.series && p.series.trim()) s.push(p);
        else l.push(p);
      });
      return s.concat(l);
    }
    if (isIP) {
      var parts = partitionByCharacter();
      parts.general = sortSeriesFirst(parts.general);
      Object.keys(parts.byChar).forEach(function (k) {
        parts.byChar[k] = sortSeriesFirst(parts.byChar[k]);
      });
      groupPrompts.length = 0;
      parts.general.forEach(function (p) {
        groupPrompts.push(p);
      });
      parts.orderedChars.forEach(function (k) {
        (parts.byChar[k] || []).forEach(function (p) {
          groupPrompts.push(p);
        });
      });
    } else {
      var sorted = sortSeriesFirst(groupPrompts);
      groupPrompts.length = 0;
      sorted.forEach(function (p) {
        groupPrompts.push(p);
      });
    }
    syncGroupPrompts();
    saveData();
    refreshPrompts();
    toast("success", "已重新排序");
  }

  $p.find("#ms-toolbar").on(
    "click.ms",
    "#ms-reorder-series-first",
    function () {
      msConfirm(
        "会把所有属于系列的剧场自动排到前面（同系列保持现有相对顺序），不在系列里的散条排在后面，确定吗？",
        { title: "系列优先排序", okText: "排序" },
      ).then(function (ok) {
        if (!ok) return;
        doReorderSeriesFirst();
      });
    },
  );

  $p.find("#ms-toolbar").on(
    "click.ms",
    "#ms-reorder-prompts-multi",
    function () {
      multiMode = !multiMode;
      multiSelected.clear();
      multiScope = null;
      rangeMode = false;
      rangeAnchor = null;
      refreshPrompts();
    },
  );

  $p.find("#ms-toolbar").on(
    "click.ms",
    "#ms-reorder-prompts-range",
    function () {
      rangeMode = !rangeMode;
      if (rangeMode && multiSelected.size > 0 && multiScope) {
        var orderedRids = getScopeOrderedRids(multiScope);
        rangeAnchor = null;
        for (var i = 0; i < orderedRids.length; i++) {
          if (multiSelected.has(orderedRids[i])) {
            rangeAnchor = orderedRids[i];
            break;
          }
        }
      } else {
        rangeAnchor = null;
      }
      refreshPrompts();
    },
  );

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-reorder-section-header",
    function (e) {
      if (
        $(e.target).closest(".ms-reorder-arrows, .ms-char-section-grip").length
      )
        return;
      var key = $(this).data("section-key");
      if (collapsedSections.has(key)) collapsedSections.delete(key);
      else collapsedSections.add(key);
      refreshPrompts();
    },
  );

  $p.find("#ms-body").on("click.ms", "[data-char-dir]", function (e) {
    e.stopPropagation();
    var dir = $(this).data("char-dir");
    var ci = parseInt($(this).data("char-idx"));
    var parts = partitionByCharacter();
    var order = parts.orderedChars.slice();
    var swapCi = dir === "up" ? ci - 1 : ci + 1;
    if (swapCi < 0 || swapCi >= order.length) return;
    var tmp = order[ci];
    order[ci] = order[swapCi];
    order[swapCi] = tmp;
    if (g) {
      g.charDisplayOrder = order;
      saveData();
    }
    refreshPrompts();
  });

  $p.find("#ms-body").on(
    "pointerdown.msdrag2",
    ".ms-char-section-grip",
    function (e) {
      if (multiMode) return;
      var oe = e.originalEvent || e;
      if (oe.pointerType === "mouse" && oe.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      var fromCi = parseInt($(this).data("char-idx"));
      var gripEl = this;
      var dragging = true;
      var panelEl = $("#" + PANEL_ID)[0];
      var ownerDoc = panelEl ? panelEl.ownerDocument : document;
      try {
        gripEl.setPointerCapture(oe.pointerId);
      } catch (ex) {}
      function onMove(ev) {
        if (!dragging) return;
        ev.preventDefault();
        var el = ownerDoc.elementFromPoint(ev.clientX, ev.clientY);
        var targetHdr = el ? el.closest(".ms-reorder-section-header") : null;
        $body.find(".ms-reorder-section-header").removeClass("ms-drag-over");
        if (targetHdr) targetHdr.classList.add("ms-drag-over");
      }
      function onEnd(ev) {
        if (!dragging) return;
        dragging = false;
        $body.find(".ms-reorder-section-header").removeClass("ms-drag-over");
        gripEl.removeEventListener("pointermove", onMove);
        gripEl.removeEventListener("pointerup", onEnd);
        gripEl.removeEventListener("pointercancel", onEnd);
        gripEl.removeEventListener("lostpointercapture", onEnd);
        if (!ev || ev.type === "lostpointercapture") return;
        var el = ownerDoc.elementFromPoint(ev.clientX, ev.clientY);
        var targetHdr = el ? el.closest(".ms-reorder-section-header") : null;
        if (!targetHdr) return;
        var targetCharKey = targetHdr.getAttribute("data-char-key");
        if (!targetCharKey) {
          toast("info", "通用剧场固定在第一位");
          return;
        }
        var targetCi = parseInt(targetHdr.getAttribute("data-char-idx"));
        if (isNaN(targetCi) || targetCi === fromCi) return;
        var parts = partitionByCharacter();
        var order = parts.orderedChars.slice();
        var moved = order.splice(fromCi, 1)[0];
        var insertIdx = fromCi < targetCi ? targetCi - 1 : targetCi;
        order.splice(insertIdx, 0, moved);
        if (g) {
          g.charDisplayOrder = order;
          saveData();
        }
        refreshPrompts();
      }
      gripEl.addEventListener("pointermove", onMove);
      gripEl.addEventListener("pointerup", onEnd);
      gripEl.addEventListener("pointercancel", onEnd);
      gripEl.addEventListener("lostpointercapture", onEnd);
    },
  );

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-reorder-item[data-type='series']",
    function (e) {
      if ($(e.target).closest(".ms-reorder-grip, .ms-reorder-arrows").length)
        return;
      var $arrow = $(this).find("[data-ro-series]");
      var sid = $arrow.data("ro-series");
      var sidKey = $arrow.data("sid-key");
      $arrow.toggleClass("open");
      $p.find("#" + sid).toggle();
      if (expandedSeries.has(sidKey)) expandedSeries.delete(sidKey);
      else expandedSeries.add(sidKey);
    },
  );

  $p.find("#ms-body").on("click.ms", "[data-ro-series-toggle]", function (e) {
    e.stopPropagation();
    var sid = $(this).data("ro-series-toggle");
    var sidKey = $(this).data("sid-key");
    $(this).toggleClass("open");
    $p.find("#" + sid).toggle();
    if (expandedSeries.has(sidKey)) expandedSeries.delete(sidKey);
    else expandedSeries.add(sidKey);
  });

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-reorder-arrows button[data-dir]",
    function (e) {
      e.stopPropagation();
      var idx = parseInt($(this).data("ridx"));
      var sectionKey = $(this).data("section");
      var dir = $(this).data("dir");
      var sectionList = getListForSection(sectionKey);
      var blocks = buildBlocksFromList(sectionList);
      if (idx < 0 || idx >= blocks.length) return;
      var swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= blocks.length) return;
      var temp = blocks[idx];
      blocks[idx] = blocks[swapIdx];
      blocks[swapIdx] = temp;
      var newSectionList = [];
      blocks.forEach(function (b) {
        if (b.type === "single") newSectionList.push(b.item);
        else
          b.items.forEach(function (it) {
            newSectionList.push(it);
          });
      });
      applySectionList(sectionKey, newSectionList);
      syncGroupPrompts();
      saveData();
      refreshPrompts();
    },
  );

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-reorder-arrows button[data-sdir]",
    function (e) {
      e.stopPropagation();
      var ci = parseInt($(this).data("child-idx"));
      var sn = $(this).data("parent-series");
      var sectionKey = $(this).data("parent-section");
      var dir = $(this).data("sdir");
      var sectionList = getListForSection(sectionKey);
      var seriesItems = sectionList.filter(function (p) {
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
  $p.find("#ms-body").on(
    "pointerdown.ms",
    ".ms-reorder-item[data-rid]",
    function (e) {
      if (!multiMode || !rangeMode) return;
      if ($(e.target).closest("[data-ro-series-toggle]").length) return;
      var $el = $(this);
      var rid = $el.attr("data-rid");
      var scope = $el.attr("data-scope");
      if (!rid || !scope) return;
      var sx = e.clientX || 0,
        sy = e.clientY || 0;
      var lpTimer = setTimeout(function () {
        lpTimer = null;
        $el.data("ms-rop-lp-fired", true);
        if (navigator.vibrate) navigator.vibrate(30);
        var farEndRid = null;
        if (
          multiScope === scope &&
          rangeAnchor !== null &&
          multiSelected.size > 0
        ) {
          var orderedRids = getScopeOrderedRids(scope);
          var newAnchorIdx = orderedRids.indexOf(rid);
          var oldAnchorIdx = orderedRids.indexOf(rangeAnchor);
          if (newAnchorIdx >= 0 && oldAnchorIdx >= 0) {
            var selIdxArr = [];
            orderedRids.forEach(function (r, i) {
              if (multiSelected.has(r)) selIdxArr.push(i);
            });
            if (selIdxArr.length > 0) {
              var selMin = Math.min.apply(null, selIdxArr);
              var selMax = Math.max.apply(null, selIdxArr);
              var farIdx = -1;
              if (selMin < oldAnchorIdx) farIdx = selMin;
              else if (selMax > oldAnchorIdx) farIdx = selMax;
              if (farIdx >= 0) farEndRid = orderedRids[farIdx];
            }
          }
        }
        multiScope = scope;
        rangeAnchor = rid;
        multiSelected.clear();
        if (farEndRid !== null) {
          var orderedRids2 = getScopeOrderedRids(scope);
          var ai = orderedRids2.indexOf(rid);
          var fi = orderedRids2.indexOf(farEndRid);
          if (ai >= 0 && fi >= 0) {
            var lo = Math.min(ai, fi);
            var hi = Math.max(ai, fi);
            for (var ii = lo; ii <= hi; ii++)
              multiSelected.add(orderedRids2[ii]);
          } else {
            multiSelected.add(rid);
          }
        } else {
          multiSelected.add(rid);
        }
        refreshPrompts();
        toast("info", "已设为新锚点");
      }, 600);
      var onMove = function (ev) {
        if (!lpTimer) return;
        var dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (dx * dx + dy * dy > 100) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
      };
      var onUp = function () {
        if (lpTimer) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
        $p.off(
          "pointermove.ms-roplp pointerup.ms-roplp pointercancel.ms-roplp",
        );
      };
      $p.off("pointermove.ms-roplp pointerup.ms-roplp pointercancel.ms-roplp")
        .on("pointermove.ms-roplp", onMove)
        .on("pointerup.ms-roplp pointercancel.ms-roplp", onUp);
    },
  );

  $p.find("#ms-body").on(
    "click.ms",
    ".ms-reorder-item[data-rid]",
    function (e) {
      if (!multiMode) return;
      if ($(this).data("ms-rop-lp-fired")) {
        $(this).removeData("ms-rop-lp-fired");
        return;
      }
      if ($(e.target).closest("[data-ro-series-toggle]").length) return;
      var rid = $(this).attr("data-rid");
      var scope = $(this).attr("data-scope");
      if (!rid || !scope) return;

      if (multiScope && scope !== multiScope) {
        toast(
          "info",
          "当前批量范围是「" +
            getScopeLabel(multiScope) +
            "」，要选别的范围请先取消已选项",
        );
        return;
      }

      if (rangeMode) {
        if (!multiScope) multiScope = scope;
        var orderedRids = getScopeOrderedRids(scope);
        if (rangeAnchor === null || orderedRids.indexOf(rangeAnchor) < 0) {
          rangeAnchor = rid;
          multiSelected.clear();
          multiSelected.add(rid);
        } else if (rangeAnchor === rid) {
          rangeAnchor = null;
          multiSelected.clear();
          multiScope = null;
        } else {
          var ai = orderedRids.indexOf(rangeAnchor);
          var yi = orderedRids.indexOf(rid);
          if (ai < 0 || yi < 0) return;
          var lo = Math.min(ai, yi),
            hi = Math.max(ai, yi);
          multiSelected.clear();
          for (var i = lo; i <= hi; i++) multiSelected.add(orderedRids[i]);
        }
      } else {
        if (multiSelected.has(rid)) {
          multiSelected.delete(rid);
          if (multiSelected.size === 0) multiScope = null;
        } else {
          if (!multiScope) multiScope = scope;
          multiSelected.add(rid);
        }
      }
      refreshPrompts();
    },
  );

  $p.find("#ms-footer").on("click.ms", "[data-pmbatch]", function () {
    var action = $(this).data("pmbatch");

    if (action === "selectall") {
      if (!multiScope) {
        if (!isIP) {
          multiScope = "_all";
        } else {
          var _ssParts = partitionByCharacter();
          if (_ssParts.general.length > 0) {
            multiScope = "_general";
          } else if (_ssParts.orderedChars.length > 0) {
            multiScope = "char_" + _ssParts.orderedChars[0];
          } else {
            return;
          }
        }
      }
      var orderedRids = getScopeOrderedRids(multiScope);
      var allSel =
        orderedRids.length > 0 &&
        orderedRids.every(function (rid) {
          return multiSelected.has(rid);
        });
      if (allSel) {
        multiSelected.clear();
        multiScope = null;
        rangeAnchor = null;
      } else {
        orderedRids.forEach(function (rid) {
          multiSelected.add(rid);
        });
      }
      refreshPrompts();
      return;
    }

    if (multiSelected.size === 0 || !multiScope) return;

    function reorderArr(items, isSelectedFn, act, insertPos) {
      if (act === "top") {
        var sel = items.filter(isSelectedFn);
        var others = items.filter(function (i) {
          return !isSelectedFn(i);
        });
        return sel.concat(others);
      }
      if (act === "bottom") {
        var sel = items.filter(isSelectedFn);
        var others = items.filter(function (i) {
          return !isSelectedFn(i);
        });
        return others.concat(sel);
      }
      if (act === "insert") {
        var sel = items.filter(isSelectedFn);
        var others = items.filter(function (i) {
          return !isSelectedFn(i);
        });
        return others
          .slice(0, insertPos)
          .concat(sel)
          .concat(others.slice(insertPos));
      }
      if (act === "up") {
        var result = items.slice();
        for (var i = 1; i < result.length; i++) {
          if (isSelectedFn(result[i]) && !isSelectedFn(result[i - 1])) {
            var t = result[i - 1];
            result[i - 1] = result[i];
            result[i] = t;
          }
        }
        return result;
      }
      if (act === "down") {
        var result = items.slice();
        for (var i = result.length - 2; i >= 0; i--) {
          if (isSelectedFn(result[i]) && !isSelectedFn(result[i + 1])) {
            var t = result[i];
            result[i] = result[i + 1];
            result[i + 1] = t;
          }
        }
        return result;
      }
      return items;
    }

    function applyReorder(act, insertPos) {
      if (multiScope.indexOf("::series::") >= 0) {
        var parts2 = multiScope.split("::series::");
        var sectionKey2 = parts2[0];
        var seriesName2 = parts2[1];
        var sectionList3 = getListForSection(sectionKey2);
        var seriesItems2 = sectionList3.filter(function (p) {
          return p.series && p.series.trim() === seriesName2;
        });
        var reordered = reorderArr(
          seriesItems2,
          function (p) {
            return multiSelected.has("c_" + p.id);
          },
          act,
          insertPos,
        );
        var ridx = 0;
        var newSectionList3 = sectionList3.map(function (p) {
          if (p.series && p.series.trim() === seriesName2) {
            return reordered[ridx++];
          }
          return p;
        });
        applySectionList(sectionKey2, newSectionList3);
      } else {
        var sectionKey3 = multiScope;
        var sectionList4 = getListForSection(sectionKey3);
        var blocks4 = buildBlocksFromList(sectionList4);
        var reorderedBlocks = reorderArr(
          blocks4,
          function (block) {
            if (block.type === "single")
              return multiSelected.has("p_" + block.item.id);
            if (block.type === "series")
              return multiSelected.has("s_" + sectionKey3 + "_" + block.name);
            return false;
          },
          act,
          insertPos,
        );
        var newSectionList4 = [];
        reorderedBlocks.forEach(function (b) {
          if (b.type === "single") newSectionList4.push(b.item);
          else
            b.items.forEach(function (it) {
              newSectionList4.push(it);
            });
        });
        applySectionList(sectionKey3, newSectionList4);
      }
      syncGroupPrompts();
      saveData();
      refreshPrompts();
    }

    if (action === "insert") {
      var scopeItems;
      var selSet = multiSelected;
      var ctxSectionKey =
        multiScope.indexOf("::series::") >= 0
          ? multiScope.split("::series::")[0]
          : multiScope;
      var ctxCharKey =
        ctxSectionKey && ctxSectionKey.indexOf("char_") === 0
          ? ctxSectionKey.substring(5)
          : null;
      function _resolveCharKey(p) {
        if (ctxCharKey) return ctxCharKey;
        if (p && p.character && isLocalCharKey(p.character)) return p.character;
        return null;
      }
      if (multiScope.indexOf("::series::") >= 0) {
        var partsI = multiScope.split("::series::");
        var sectionListI = getListForSection(partsI[0]);
        scopeItems = sectionListI
          .filter(function (p) {
            return p.series && p.series.trim() === partsI[1];
          })
          .map(function (p) {
            return {
              type: "single",
              name: p.title || "未命名",
              desc: truncate((p.content || "").replace(/\s+/g, " ").trim(), 50),
              tags: p.tags || [],
              charKey: _resolveCharKey(p),
              isSelected: selSet.has("c_" + p.id),
            };
          });
      } else {
        var sectionListJ = getListForSection(multiScope);
        var blocksJ = buildBlocksFromList(sectionListJ);
        scopeItems = blocksJ.map(function (block) {
          if (block.type === "single") {
            return {
              type: "single",
              name: block.item.title || "未命名",
              desc: truncate(
                (block.item.content || "").replace(/\s+/g, " ").trim(),
                50,
              ),
              tags: block.item.tags || [],
              charKey: _resolveCharKey(block.item),
              isSelected: selSet.has("p_" + block.item.id),
            };
          }
          var children = block.items.map(function (it) {
            return {
              name: it.title || "未命名",
              desc: truncate(
                (it.content || "").replace(/\s+/g, " ").trim(),
                40,
              ),
              tags: it.tags || [],
              charKey: _resolveCharKey(it),
            };
          });
          return {
            type: "series",
            name: block.name + " (" + block.items.length + " 条)",
            iconClass: "fa-layer-group",
            charKey: ctxCharKey,
            children: children,
            isSelected: selSet.has("s_" + multiScope + "_" + block.name),
          };
        });
      }
      showInsertDialog({
        title: "插入到指定位置",
        scopeItems: scopeItems,
        onConfirm: function (insertPos) {
          applyReorder("insert", insertPos);
        },
      });
      return;
    }

    applyReorder(action);
  });

  $p.find("#ms-body").on("pointerdown.ms", "[data-preview-pid]", function (e) {
    e.stopPropagation();
  });
  $p.find("#ms-body").on("click.ms", "[data-preview-pid]", function (e) {
    e.stopPropagation();
    var pid = $(this).attr("data-preview-pid");
    if (!pid) return;
    v._reorderMultiMode = multiMode;
    v._reorderMultiSelected = Array.from(multiSelected);
    v._reorderMultiScope = multiScope;
    v._reorderRangeMode = rangeMode;
    v._reorderRangeAnchor = rangeAnchor;
    v._reorderExpandedSeries = Array.from(expandedSeries);
    v._reorderCollapsedSections = Array.from(collapsedSections);
    var orderedIds = groupPrompts.map(function (p) {
      return p.id;
    });
    navigateTo({ name: "preview", promptId: pid, _siblingIds: orderedIds });
  });

  refreshPrompts();
}
