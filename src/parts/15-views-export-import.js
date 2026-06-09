  function renderExport() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("导出");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">选择导出内容</span>`,
    );
    let exportSet = new Set(data.prompts.map((p) => p.id));
    let allChecked = true;
    function buildExportBody() {
      let html = `<div class="ms-form"><label class="ms-check-item"><input type="checkbox" id="ms-exp-all" ${allChecked ? "checked" : ""}> 全部导出 (${data.prompts.length} 条)</label><div class="ms-divider"></div>`;
      const grouped = {};
      data.groups.forEach((g) => {
        grouped[g.id] = getPromptsInGroup(g.id);
      });
      const ungrouped = getUngroupedPrompts();
      function _renderExpPromptList(items, gid, extraIndent) {
        var h = "";
        var shown = {};
        items.forEach(function (p) {
          var pc = exportSet.has(p.id);
          var cs = (p.series || "").trim();
          if (cs && !shown[cs]) {
            shown[cs] = true;
            h +=
              '<div style="font-size:11px;color:var(--ms-accent);padding:5px 0 2px ' +
              (extraIndent || 0) +
              'px;font-weight:500;"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:3px;"></i>' +
              esc(p.series) +
              "</div>";
          }
          var pad = cs
            ? "padding:3px 0 3px " + ((extraIndent || 0) + 18) + "px;"
            : "padding:3px 0 3px " + (extraIndent || 0) + "px;";
          h +=
            '<label class="ms-check-item" style="' +
            pad +
            '"><input type="checkbox" class="ms-exp-pcb" data-pid="' +
            p.id +
            '" data-gid="' +
            gid +
            '" ' +
            (pc ? "checked" : "") +
            " " +
            (allChecked ? "disabled" : "") +
            "> " +
            esc(truncate(p.title, 40)) +
            "</label>";
        });
        return h;
      }
      data.groups.forEach((g) => {
        const items = grouped[g.id] || [];
        if (items.length === 0) return;
        const checkedCount = items.filter((p) => exportSet.has(p.id)).length;
        const allIn = checkedCount === items.length;
        const gid = g.id;
        var isIPG = isIPGroup(g);
        var useAvatar =
          isIPG ||
          (g.iconMode === "custom" && g.iconUrl) ||
          (g.iconMode === "char" && g.iconCharKey);
        var iconH = useAvatar
          ? buildGroupAvatarHTML(g, 20)
          : `<i class="fa-solid fa-folder" style="color:${g.color};"></i>`;
        html += `<div><div class="ms-exp-group-toggle" data-exp-gid="${gid}"><i class="fa-solid fa-angle-right ms-exp-arrow" data-exp-gid="${gid}"></i><input type="checkbox" class="ms-exp-gcb" data-gid="${gid}" ${allIn ? "checked" : ""} ${allChecked ? "disabled" : ""} style="accent-color:var(--SmartThemeQuoteColor,#888);">${iconH}<span style="flex:1;font-size:13px;display:flex;align-items:center;gap:4px;"> ${esc(g.name)}${isIPG ? ' <span style="font-size:9px;color:var(--ms-accent);opacity:0.7;">IP</span>' : ""} <span class="ms-exp-gcnt" data-gid="${gid}">(${checkedCount}/${items.length})</span></span></div>`;
        html += `<div class="ms-exp-group-body" data-exp-body="${gid}">`;
        if (isIPG) {
          var general = [];
          var byChar = {};
          items.forEach(function (p) {
            if (p.character && isLocalCharKey(p.character)) {
              if (!byChar[p.character]) byChar[p.character] = [];
              byChar[p.character].push(p);
            } else {
              general.push(p);
            }
          });
          if (general.length > 0) {
            html +=
              '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 2px;font-weight:600;"><i class="fa-solid fa-scroll" style="margin-right:3px;color:var(--ms-accent);"></i>通用剧场 (' +
              general.length +
              ")</div>";
            html += _renderExpPromptList(general, gid, 0);
          }
          var order = getCharDisplayOrder(g);
          var sortedCharKeys = [];
          order.forEach(function (k) {
            if (byChar[k]) sortedCharKeys.push(k);
          });
          Object.keys(byChar).forEach(function (k) {
            if (sortedCharKeys.indexOf(k) < 0) sortedCharKeys.push(k);
          });
          sortedCharKeys.forEach(function (ck) {
            var ps = byChar[ck];
            var dn = getCharDisplayName(ck);
            var _ap = getCharAvatarPathSafe(ck);
            var _avH = _ap
              ? '<img src="' +
                esc(_ap) +
                '" loading="lazy" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
              : '<i class="fa-solid fa-user" style="margin-right:3px;color:#b48cc8;"></i>';
            html +=
              '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 2px;font-weight:600;display:flex;align-items:center;">' +
              _avH +
              esc(dn) +
              " (" +
              ps.length +
              ")</div>";
            html += _renderExpPromptList(ps, gid, 14);
          });
        } else {
          html += _renderExpPromptList(items, gid, 0);
        }
        html += `</div></div>`;
      });
      if (ungrouped.length > 0) {
        const checkedCount = ungrouped.filter((p) =>
          exportSet.has(p.id),
        ).length;
        const allIn = checkedCount === ungrouped.length;
        html += `<div><div class="ms-exp-group-toggle" data-exp-gid="_ungrouped"><i class="fa-solid fa-angle-right ms-exp-arrow" data-exp-gid="_ungrouped"></i><input type="checkbox" class="ms-exp-gcb" data-gid="_ungrouped" ${allIn ? "checked" : ""} ${allChecked ? "disabled" : ""} style="accent-color:var(--SmartThemeQuoteColor,#888);"><span style="flex:1;font-size:13px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-inbox"></i> 未分组 <span class="ms-exp-gcnt" data-gid="_ungrouped">(${checkedCount}/${ungrouped.length})</span></span></div>`;
        html += `<div class="ms-exp-group-body" data-exp-body="_ungrouped">`;
        ungrouped.forEach((p) => {
          const pc = exportSet.has(p.id);
          html += `<label class="ms-check-item" style="padding:3px 0;"><input type="checkbox" class="ms-exp-pcb" data-pid="${p.id}" data-gid="_ungrouped" ${pc ? "checked" : ""} ${allChecked ? "disabled" : ""}> ${esc(truncate(p.title, 40))}</label>`;
        });
        html += `</div></div>`;
      }
      html += `<div class="ms-divider"></div><div class="ms-section-label">导出选项</div><div class="ms-export-opts-tight">${chk("ms-exp-groups", "checked", "包含分组信息")}
        ${chk("ms-exp-tags", "checked", "包含标签信息")}
        ${chk("ms-exp-history", "", "包含版本历史")}
        ${chk("ms-exp-character", "", "包含角色绑定信息 (勾选会同时带上角色生日和祝福)")}
        ${chk("ms-exp-cgroups", "", "包含 IP 分组 (需先勾选角色绑定)")}
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-export-cancel">取消</button><button class="ms-btn primary" id="ms-export-go"><i class="fa-solid fa-download"></i> 导出 (${exportSet.size})</button></div></div>`;
      return html;
    }

    $p.find("#ms-body").html(buildExportBody());
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function updateExpCounts() {
      $p.find(".ms-exp-gcnt").each(function () {
        var gid = $(this).data("gid");
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        var cnt = items.filter(function (p) {
          return exportSet.has(p.id);
        }).length;
        $(this).text("(" + cnt + "/" + items.length + ")");
      });
      $p.find("#ms-export-go").html(
        '<i class="fa-solid fa-download"></i> 导出 (' + exportSet.size + ")",
      );
    }
    $p.find("#ms-body")
      .off(".mse")
      .on("change.mse", "#ms-exp-all", function () {
        allChecked = $(this).is(":checked");
        if (allChecked) {
          exportSet = new Set(
            data.prompts.map(function (p) {
              return p.id;
            }),
          );
          $p.find(".ms-exp-gcb, .ms-exp-pcb")
            .prop("checked", true)
            .prop("disabled", true);
        } else {
          exportSet.clear();
          $p.find(".ms-exp-gcb, .ms-exp-pcb")
            .prop("checked", false)
            .prop("disabled", false);
        }
        updateExpCounts();
      })
      .on("change.mse", ".ms-exp-gcb", function (e) {
        e.stopPropagation();
        var gid = $(this).data("gid"),
          checked = $(this).is(":checked");
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        items.forEach(function (p) {
          if (checked) exportSet.add(p.id);
          else exportSet.delete(p.id);
        });
        $p.find('.ms-exp-pcb[data-gid="' + gid + '"]').prop("checked", checked);
        updateExpCounts();
      })
      .on("change.mse", ".ms-exp-pcb", function (e) {
        e.stopPropagation();
        var pid = $(this).data("pid"),
          gid = $(this).data("gid");
        if ($(this).is(":checked")) exportSet.add(pid);
        else exportSet.delete(pid);
        var items =
          gid === "_ungrouped" ? getUngroupedPrompts() : getPromptsInGroup(gid);
        var allIn = items.every(function (p) {
          return exportSet.has(p.id);
        });
        $p.find('.ms-exp-gcb[data-gid="' + gid + '"]').prop("checked", allIn);
        updateExpCounts();
      })
      .on("click.mse", ".ms-exp-group-toggle", function (e) {
        if ($(e.target).is("input[type='checkbox']")) return;
        var gid = $(this).data("exp-gid");
        $(this).find(".ms-exp-arrow").toggleClass("open");
        $p.find('[data-exp-body="' + gid + '"]').toggleClass("open");
      })
      .on("click.mse", "#ms-export-cancel", navigateBack)
      .on("click.mse", "#ms-export-go", function () {
        var prompts = data.prompts.filter(function (p) {
          return exportSet.has(p.id);
        });
        if (prompts.length === 0) {
          toast("warning", "请至少选择一条剧场");
          return;
        }
        var inclG = $p.find("#ms-exp-groups").is(":checked"),
          inclT = $p.find("#ms-exp-tags").is(":checked"),
          inclH = $p.find("#ms-exp-history").is(":checked");
        var inclC = $p.find("#ms-exp-character").is(":checked");
        var inclCG = $p.find("#ms-exp-cgroups").is(":checked");
        var payload = buildExportPayload(
          prompts,
          inclG,
          inclT,
          inclH,
          inclC,
          inclCG,
        );
        var expName = (function () {
          if (prompts.length === 1) {
            return "剧场_" + sanitizeFilename(prompts[0].title) + ".json";
          }
          var gids = new Set(
            prompts
              .map(function (p) {
                return p.groupId;
              })
              .filter(Boolean),
          );
          if (gids.size === 1) {
            var sameGroup = getGroup([...gids][0]);
            if (sameGroup) {
              return (
                "【" +
                sanitizeFilename(sameGroup.name) +
                "】剧场合集[" +
                prompts.length +
                "个]_" +
                formatTimestamp() +
                ".json"
              );
            }
          }
          return (
            "剧场合集[" + prompts.length + "个]_" + formatTimestamp() + ".json"
          );
        })();
        downloadJSON(payload, expName);
        toast("success", "导出成功");
        navigateBack();
      });
  }

  function renderExportSingleOptions(v) {
    const $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    const g = pr.groupId ? getGroup(pr.groupId) : null;
    const tagNames = (pr.tags || []).map((tid) => getTag(tid)).filter(Boolean);
    const hasHistory = (pr.history || []).length > 0;
    $p.find("#ms-title").text("导出选项");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导出: ${esc(truncate(pr.title, 20))}</span>`,
    );
    let infoH = `<div style="font-size:13px;padding:6px 0;">即将导出:<strong>${esc(pr.title)}</strong></div>`;
    if (g)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);">所属分组: <span style="color:var(--SmartThemeBodyColor,#ccc);">${esc(g.name)}</span></div>`;
    if (tagNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
    $p.find("#ms-body")
      .html(`<div class="ms-form">${infoH}<div class="ms-divider"></div>
      <div class="ms-export-opts-tight">
        ${chk("ms-exps-groups", g ? "checked" : "disabled", "包含分组信息" + (g ? "" : " (无分组)"))}
        ${chk("ms-exps-tags", tagNames.length > 0 ? "checked" : "disabled", "包含标签信息" + (tagNames.length > 0 ? "" : " (无标签)"))}
        ${chk("ms-exps-history", hasHistory ? "" : "disabled", "包含版本历史" + (hasHistory ? "" : " (无历史)"))}
        ${chk("ms-exps-character", pr.character ? "" : "disabled", "包含角色绑定" + (pr.character ? " (" + esc(getCharDisplayName(pr.character)) + ")" : " (未绑定)"))}
        ${chk("ms-exps-cgroups", pr.character && getCharGroupOfChar(pr.character) ? "" : "disabled", "包含 IP 分组" + (pr.character && getCharGroupOfChar(pr.character) ? " (" + esc(getCharGroupOfChar(pr.character).name) + ")" : " (无)"))}
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-exps-cancel">取消</button><button class="ms-btn primary" id="ms-exps-go"><i class="fa-solid fa-download"></i> 导出</button></div></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-exps-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-exps-go", () => {
      const inclG = $p.find("#ms-exps-groups").is(":checked"),
        inclT = $p.find("#ms-exps-tags").is(":checked"),
        inclH = $p.find("#ms-exps-history").is(":checked");
      const inclC = $p.find("#ms-exps-character").is(":checked");
      const inclCG = $p.find("#ms-exps-cgroups").is(":checked");
      const payload = buildExportPayload(
        [pr],
        inclG,
        inclT,
        inclH,
        inclC,
        inclCG,
      );
      downloadJSON(payload, "剧场_" + sanitizeFilename(pr.title) + ".json");
      toast("success", "导出成功");
      navigateBack();
    });
  }

  function renderExportGroupOptions(v) {
    const $p = $("#" + PANEL_ID),
      allPrompts = getPromptsInGroup(v.groupId);
    const tagIds = new Set();
    allPrompts.forEach((p) => (p.tags || []).forEach((tid) => tagIds.add(tid)));
    const tagNames = [...tagIds].map((tid) => getTag(tid)).filter(Boolean);
    let exportSet = new Set(allPrompts.map((p) => p.id));
    $p.find("#ms-title").text("导出分组");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导出分组: ${esc(v.groupName)}</span>`,
    );
    function buildBody() {
      let infoH = `<div style="font-size:13px;padding:6px 0;">分组 <strong>${esc(v.groupName)}</strong> 共 ${allPrompts.length} 条剧场</div>`;
      if (tagNames.length > 0)
        infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">涉及标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
      const allChecked =
        allPrompts.length > 0 && allPrompts.every((p) => exportSet.has(p.id));
      let listH = `<div class="ms-imp-preview"><div class="ms-imp-preview-title">选择要导出的剧场 (${exportSet.size}/${allPrompts.length})</div><label class="ms-check-item" style="padding:4px 0;margin-bottom:4px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);"><input type="checkbox" id="ms-expg-selall" ${allChecked ? "checked" : ""}> 全选</label><div class="ms-imp-preview-list" style="max-height:150px;overflow-y:auto;">`;
      function _renderExpgPromptList(items, baseIndent) {
        var h = "";
        var shown = {};
        items.forEach(function (p) {
          var checked = exportSet.has(p.id);
          var cs = (p.series || "").trim();
          if (cs && !shown[cs]) {
            shown[cs] = true;
            h +=
              '<div style="font-size:11px;color:var(--ms-accent);padding:5px 0 2px ' +
              (baseIndent || 0) +
              'px;font-weight:500;"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:3px;"></i>' +
              esc(p.series) +
              "</div>";
          }
          var pad = cs
            ? "padding:3px 0 3px " + ((baseIndent || 0) + 18) + "px;"
            : "padding:3px 0 3px " + (baseIndent || 0) + "px;";
          h +=
            '<label class="ms-check-item" style="' +
            pad +
            '"><input type="checkbox" class="ms-expg-pcb" data-pid="' +
            p.id +
            '" ' +
            (checked ? "checked" : "") +
            "> " +
            esc(truncate(p.title, 40)) +
            "</label>";
        });
        return h;
      }
      var _expgG = getGroup(v.groupId);
      if (_expgG && isIPGroup(_expgG)) {
        var general = [];
        var byChar = {};
        allPrompts.forEach(function (p) {
          if (p.character && isLocalCharKey(p.character)) {
            if (!byChar[p.character]) byChar[p.character] = [];
            byChar[p.character].push(p);
          } else {
            general.push(p);
          }
        });
        if (general.length > 0) {
          listH +=
            '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 2px;font-weight:600;"><i class="fa-solid fa-scroll" style="margin-right:3px;color:var(--ms-accent);"></i>通用剧场 (' +
            general.length +
            ")</div>";
          listH += _renderExpgPromptList(general, 0);
        }
        var order = getCharDisplayOrder(_expgG);
        var sortedCharKeys = [];
        order.forEach(function (k) {
          if (byChar[k]) sortedCharKeys.push(k);
        });
        Object.keys(byChar).forEach(function (k) {
          if (sortedCharKeys.indexOf(k) < 0) sortedCharKeys.push(k);
        });
        sortedCharKeys.forEach(function (ck) {
          var ps = byChar[ck];
          var dn = getCharDisplayName(ck);
          var _ap = getCharAvatarPathSafe(ck);
          var _avH = _ap
            ? '<img src="' +
              esc(_ap) +
              '" loading="lazy" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="margin-right:3px;color:#b48cc8;"></i>';
          listH +=
            '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 2px;font-weight:600;display:flex;align-items:center;">' +
            _avH +
            esc(dn) +
            " (" +
            ps.length +
            ")</div>";
          listH += _renderExpgPromptList(ps, 14);
        });
      } else {
        listH += _renderExpgPromptList(allPrompts, 0);
      }
      listH += `</div></div>`;
      return `<div class="ms-form">${infoH}${listH}<div class="ms-divider"></div><div class="ms-export-opts-tight">
          ${chk("ms-expg-groups", "checked", "包含分组信息")}
          ${chk("ms-expg-tags", tagNames.length > 0 ? "checked" : "disabled", "包含标签信息" + (tagNames.length > 0 ? "" : " (无标签)"))}
          ${chk("ms-expg-history", "", "包含版本历史")}
          ${chk("ms-expg-character", "", "包含角色绑定信息")}
          ${chk("ms-expg-cgroups", "", "包含 IP 分组 (需先勾选角色绑定)")}
        </div>
        <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-expg-cancel">取消</button><button class="ms-btn primary" id="ms-expg-go"><i class="fa-solid fa-download"></i> 导出 (${exportSet.size})</button></div></div>`;
    }
    $p.find("#ms-body").html(buildBody());
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function rebindExport() {
      $p.find("#ms-body")
        .off(".mseg")
        .on("change.mseg", "#ms-expg-selall", function () {
          var checked = $(this).is(":checked");
          if (checked)
            allPrompts.forEach(function (p) {
              exportSet.add(p.id);
            });
          else exportSet.clear();
          $p.find(".ms-expg-pcb").prop("checked", checked);
          $p.find(".ms-imp-preview-title").text(
            "选择要导出的剧场(" +
              exportSet.size +
              "/" +
              allPrompts.length +
              ")",
          );
          $p.find("#ms-expg-go").html(
            '<i class="fa-solid fa-download"></i> 导出 (' +
              exportSet.size +
              ")",
          );
        })
        .on("change.mseg", ".ms-expg-pcb", function () {
          var pid = $(this).data("pid");
          if ($(this).is(":checked")) exportSet.add(pid);
          else exportSet.delete(pid);
          $p.find("#ms-expg-selall").prop(
            "checked",
            allPrompts.length > 0 &&
              allPrompts.every(function (p) {
                return exportSet.has(p.id);
              }),
          );
          $p.find(".ms-imp-preview-title").text(
            "选择要导出的剧场 (" +
              exportSet.size +
              "/" +
              allPrompts.length +
              ")",
          );
          $p.find("#ms-expg-go").html(
            '<i class="fa-solid fa-download"></i> 导出 (' +
              exportSet.size +
              ")",
          );
        })
        .on("click.mseg", "#ms-expg-cancel", navigateBack)
        .on("click.mseg", "#ms-expg-go", () => {
          const prompts = allPrompts.filter((p) => exportSet.has(p.id));
          if (prompts.length === 0) {
            toast("warning", "请至少选择一条剧场");
            return;
          }
          const inclG = $p.find("#ms-expg-groups").is(":checked"),
            inclT = $p.find("#ms-expg-tags").is(":checked"),
            inclH = $p.find("#ms-expg-history").is(":checked");
          const inclC = $p.find("#ms-expg-character").is(":checked");
          const inclCG = $p.find("#ms-expg-cgroups").is(":checked");
          const payload = buildExportPayload(
            prompts,
            inclG,
            inclT,
            inclH,
            inclC,
            inclCG,
          );
          downloadJSON(
            payload,
            prompts.length === 1
              ? "剧场_" + sanitizeFilename(prompts[0].title) + ".json"
              : "【" +
                  sanitizeFilename(v.groupName) +
                  "】剧场合集[" +
                  prompts.length +
                  "个]_" +
                  formatTimestamp() +
                  ".json",
          );
          toast("success", "导出成功");
          navigateBack();
        });
    }
    rebindExport();
  }

  function renderExportBatchOptions() {
    const $p = $("#" + PANEL_ID),
      ps = data.prompts.filter((p) => selectedIds.has(p.id));
    const gidSet = new Set(ps.map((p) => p.groupId).filter(Boolean));
    const groupNames = [...gidSet].map((gid) => getGroup(gid)).filter(Boolean);
    const tagIds = new Set();
    ps.forEach((p) => (p.tags || []).forEach((tid) => tagIds.add(tid)));
    const tagNames = [...tagIds].map((tid) => getTag(tid)).filter(Boolean);
    $p.find("#ms-title").text("批量导出选项");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">批量导出 (${ps.length} 条)</span>`,
    );
    let infoH = `<div style="font-size:13px;padding:6px 0;">已选 <strong>${ps.length}</strong> 条剧场</div>`;
    if (groupNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);">涉及分组: ${groupNames.map((g) => `<span class="ms-tag-chip" style="background:${g.color};margin:1px 2px;">${esc(g.name)}</span>`).join("")}</div>`;
    if (tagNames.length > 0)
      infoH += `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">涉及标签: ${tagNames.map((t) => `<span class="ms-tag-chip" style="background:${t.color};margin:1px 2px;">${esc(t.name)}</span>`).join("")}</div>`;
    let listH = `<div class="ms-imp-preview"><div class="ms-imp-preview-title">包含剧场:</div><div class="ms-imp-preview-list" style="max-height:200px;overflow-y:auto;">`;
    var psByGroup = {};
    ps.forEach(function (p) {
      var gid = p.groupId || "_ungrouped";
      if (!psByGroup[gid]) psByGroup[gid] = [];
      psByGroup[gid].push(p);
    });
    var orderedGids = [];
    data.groups.forEach(function (g) {
      if (psByGroup[g.id]) orderedGids.push(g.id);
    });
    if (psByGroup["_ungrouped"]) orderedGids.push("_ungrouped");
    function _renderBatchSubSeries(items, baseIndent) {
      var h = "";
      var shown = {};
      items.forEach(function (p) {
        if (p.series && p.series.trim()) {
          if (!shown[p.series]) {
            shown[p.series] = true;
            h +=
              '<div style="font-size:9px;color:var(--ms-accent);opacity:0.7;padding:2px 0 1px ' +
              baseIndent +
              'px;"><i class="fa-solid fa-layer-group" style="font-size:8px;margin-right:2px;"></i>' +
              esc(p.series) +
              "</div>";
          }
          h +=
            '<div class="ms-exp-prompt-item" style="margin-left:' +
            (baseIndent + 12) +
            'px;">· ' +
            esc(truncate(p.title, 38)) +
            "</div>";
        } else {
          h +=
            '<div class="ms-exp-prompt-item" style="margin-left:' +
            baseIndent +
            'px;">' +
            esc(truncate(p.title, 38)) +
            "</div>";
        }
      });
      return h;
    }
    orderedGids.forEach(function (gid) {
      var gObj = gid === "_ungrouped" ? null : getGroup(gid);
      var gpItems = psByGroup[gid];
      var gName = gObj ? gObj.name : "未分组";
      var gColor = gObj ? gObj.color : "#888";
      var isIPG = gObj && isIPGroup(gObj);
      listH +=
        '<div style="font-size:11px;color:var(--SmartThemeBodyColor,#ddd);padding:6px 0 2px;font-weight:500;"><i class="fa-solid fa-folder" style="color:' +
        gColor +
        ';margin-right:3px;font-size:10px;"></i>' +
        esc(gName) +
        (isIPG
          ? ' <span style="font-size:8px;color:var(--ms-accent);opacity:0.7;">IP</span>'
          : "") +
        " (" +
        gpItems.length +
        ")</div>";
      if (isIPG) {
        var general = [];
        var byChar = {};
        gpItems.forEach(function (p) {
          if (p.character && isLocalCharKey(p.character)) {
            if (!byChar[p.character]) byChar[p.character] = [];
            byChar[p.character].push(p);
          } else {
            general.push(p);
          }
        });
        if (general.length > 0) {
          listH +=
            '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:2px 0 1px 14px;"><i class="fa-solid fa-scroll" style="margin-right:3px;font-size:9px;color:var(--ms-accent);"></i>通用 (' +
            general.length +
            ")</div>";
          listH += _renderBatchSubSeries(general, 24);
        }
        var order = getCharDisplayOrder(gObj);
        var sortedCharKeys = [];
        order.forEach(function (k) {
          if (byChar[k]) sortedCharKeys.push(k);
        });
        Object.keys(byChar).forEach(function (k) {
          if (sortedCharKeys.indexOf(k) < 0) sortedCharKeys.push(k);
        });
        sortedCharKeys.forEach(function (ck) {
          var cps = byChar[ck];
          var dn = getCharDisplayName(ck);
          var _ap = getCharAvatarPathSafe(ck);
          var _avH = _ap
            ? '<img src="' +
              esc(_ap) +
              '" loading="lazy" style="width:12px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="margin-right:3px;font-size:9px;color:#b48cc8;"></i>';
          listH +=
            '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:2px 0 1px 14px;display:flex;align-items:center;">' +
            _avH +
            esc(dn) +
            " (" +
            cps.length +
            ")</div>";
          listH += _renderBatchSubSeries(cps, 24);
        });
      } else {
        listH += _renderBatchSubSeries(gpItems, 12);
      }
    });
    listH += `</div></div>`;
    $p.find("#ms-body")
      .html(`<div class="ms-form">${infoH}${listH}<div class="ms-divider"></div>
      <div class="ms-export-opts-tight">
        ${chk("ms-expb-groups", groupNames.length > 0 ? "checked" : "disabled", "包含分组信息" + (groupNames.length > 0 ? "" : " (无分组)"))}
        ${chk("ms-expb-tags", tagNames.length > 0 ? "checked" : "disabled", "包含标签信息" + (tagNames.length > 0 ? "" : " (无标签)"))}
        ${chk("ms-expb-history", "", "包含版本历史")}
        ${chk("ms-expb-character", "", "包含角色绑定信息")}
        ${chk("ms-expb-cgroups", "", "包含 IP 分组 (需先勾选角色绑定)")}
      </div>
      <div class="ms-form-btns" style="gap:6px;"><button class="ms-btn" id="ms-expb-cancel">取消</button><button class="ms-btn primary" id="ms-expb-go"><i class="fa-solid fa-download"></i> 导出</button></div></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-expb-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-expb-go", () => {
      const inclG = $p.find("#ms-expb-groups").is(":checked"),
        inclT = $p.find("#ms-expb-tags").is(":checked"),
        inclH = $p.find("#ms-expb-history").is(":checked");
      const inclC = $p.find("#ms-expb-character").is(":checked");
      const inclCG = $p.find("#ms-expb-cgroups").is(":checked");
      const payload = buildExportPayload(
        ps,
        inclG,
        inclT,
        inclH,
        inclC,
        inclCG,
      );
      const expName = (() => {
        if (ps.length === 1) {
          return "剧场_" + sanitizeFilename(ps[0].title) + ".json";
        }
        const gids = new Set(ps.map((p) => p.groupId).filter(Boolean));
        if (gids.size === 1) {
          const sameGroup = getGroup([...gids][0]);
          if (sameGroup) {
            return (
              "【" +
              sanitizeFilename(sameGroup.name) +
              "】剧场合集[" +
              ps.length +
              "个]_" +
              formatTimestamp() +
              ".json"
            );
          }
        }
        return "剧场合集[" + ps.length + "个]_" + formatTimestamp() + ".json";
      })();
      downloadJSON(payload, expName);
      toast("success", "导出成功");
      navigateBack();
    });
  }

  function renderImportConfirm(v) {
    const $p = $("#" + PANEL_ID);
    const ig = v.importedGroups || [],
      ip = v.importedPrompts || [],
      itags = v.importedTags || [],
      icgs = v.importedCharGroups || [];
    $p.find("#ms-title").text("导入");
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">导入数据</span>`,
    );
    const authors = [...new Set(ip.map((p) => p.author).filter(Boolean))];
    let previewH = "";
    if (ig.length > 0)
      previewH += `<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-folder" style="margin-right:4px;"></i>包含 ${ig.length} 个分组</div><div class="ms-imp-preview-list">${ig.map((g) => `<span style="background:${g.color || "#666"};">${esc(g.name)}</span>`).join("")}</div></div>`;
    if (itags.length > 0)
      previewH += `<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-tags" style="margin-right:4px;"></i>包含 ${itags.length} 个标签</div><div class="ms-imp-preview-list">${itags.map((t) => `<span style="background:${t.color || "#666"};">${esc(t.name)}</span>`).join("")}</div></div>`;
    var ibdMsgCount = Object.keys(v.importedBdMessages || {}).length;
    var ibdDateCount = Object.keys(v.importedBdDates || {}).length;
    if (ibdMsgCount > 0 || ibdDateCount > 0) {
      previewH += `<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-cake-candles" style="margin-right:4px;color:#e88aaa;"></i>包含角色生日数据</div><div class="ms-imp-preview-list" style="color:var(--SmartThemeQuoteColor,#888);">${ibdDateCount > 0 ? ibdDateCount + " 个生日日期" : ""}${ibdDateCount > 0 && ibdMsgCount > 0 ? " · " : ""}${ibdMsgCount > 0 ? ibdMsgCount + " 条祝福语" : ""}</div></div>`;
    }
    var lostCharCount = 0;
    var importedCharKeys = new Set();
    if (ip && ip.length > 0) {
      ip.forEach(function (p) {
        if (p.character) importedCharKeys.add(p.character);
      });
    }
    if (icgs && icgs.length > 0) {
      icgs.forEach(function (icg) {
        (icg.charKeys || []).forEach(function (k) {
          if (k) importedCharKeys.add(k);
        });
      });
    }
    Object.keys(v.importedBdMessages || {}).forEach(function (k) {
      if (k) importedCharKeys.add(k);
    });
    Object.keys(v.importedBdDates || {}).forEach(function (k) {
      if (k) importedCharKeys.add(k);
    });
    importedCharKeys.forEach(function (k) {
      if (!isLocalCharKey(k)) lostCharCount++;
    });
    if (lostCharCount > 0) {
      previewH +=
        '<div class="ms-imp-preview" style="border-color:rgba(var(--ms-danger-rgb),0.3);"><div class="ms-imp-preview-title" style="color:var(--ms-danger);"><i class="fa-solid fa-user-slash" style="margin-right:4px;"></i>检测到 ' +
        lostCharCount +
        ' 个失联角色</div><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:2px;">本地没有对应角色卡，导入后可在「设置→处理失联角色」处理</div></div>';
    }
    if (icgs.length > 0) {
      var validIcgInfo = icgs.map(function (icg) {
        var localCount = filterValidCharKeys(icg.charKeys || []).length;
        var totalCount = (icg.charKeys || []).length;
        return {
          name: icg.name,
          color: icg.color || "#888",
          local: localCount,
          total: totalCount,
        };
      });
      var totalKeys = validIcgInfo.reduce(function (s, x) {
        return s + x.total;
      }, 0);
      var localKeys = validIcgInfo.reduce(function (s, x) {
        return s + x.local;
      }, 0);
      previewH +=
        '<div class="ms-imp-preview"><div class="ms-imp-preview-title"><i class="fa-solid fa-layer-group" style="margin-right:4px;"></i>包含 ' +
        icgs.length +
        ' 个 IP 分组 <span style="font-weight:normal;font-size:10px;opacity:0.7;">(本地匹配 ' +
        localKeys +
        "/" +
        totalKeys +
        ' 个角色)</span></div><div class="ms-imp-preview-list">';
      validIcgInfo.forEach(function (info) {
        var matchHint =
          info.local < info.total
            ? ' <span style="opacity:0.6;font-size:9px;">(' +
              info.local +
              "/" +
              info.total +
              ")</span>"
            : "";
        previewH +=
          '<span style="background:' +
          info.color +
          ';">' +
          esc(info.name) +
          matchHint +
          "</span>";
      });
      previewH += "</div></div>";
    }

    let authorH =
      authors.length > 0
        ? `<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-top:4px;">作者: <strong style="color:var(--SmartThemeBodyColor,#ccc);">${authors.map(esc).join(", ")}</strong></div>`
        : "";
    let groupOpts = `<option value="">未分组</option>`;
    data.groups.forEach((g) => {
      groupOpts += `<option value="${g.id}">${esc(g.name)}</option>`;
    });
    groupOpts += `<option value="_new">+ 新建分组</option>`;
    $p.find("#ms-body").html(`<div class="ms-form">
      <div style="font-size:13px;padding:6px 0;">检测到 <strong>${ip.length}</strong> 条小剧场</div>${authorH}
      ${previewH}
      <div class="ms-divider"></div><div class="ms-section-label">导入选项</div>
      ${chk("ms-imp-groups", ig.length > 0 ? "checked" : "disabled", "导入分组信息 (" + ig.length + " 个)" + (ig.length === 0 ? " — 文件中无分组" : ""))}
      ${chk("ms-imp-tags", itags.length > 0 ? "checked" : "disabled", "导入标签 (" + itags.length + " 个)" + (itags.length === 0 ? " — 文件中无标签" : ""))}
      ${chk("ms-imp-cgroups", icgs.length > 0 ? "checked" : "disabled", "导入 IP 分组 (" + icgs.length + " 个)" + (icgs.length === 0 ? " — 文件中无 IP 分组" : " · 仅匹配本地已有角色"))}
      <div class="ms-field" id="ms-imp-target-wrap" style="display:none;padding:0 14px;"><label>放入分组</label><select id="ms-imp-target">${groupOpts}</select></div>
      <div class="ms-divider"></div><div class="ms-section-label">导入方式</div>
      <div class="ms-import-opt" data-mode="merge"><div class="ms-import-opt-title"><i class="fa-solid fa-code-merge"></i> 合并更新 <span style="font-size:10px;color:#c9957a;font-weight:normal;">推荐</span></div><div class="ms-import-opt-desc">智能检测 — 新内容添加，作者修改过的自动更新，完全相同的跳过</div></div>
      <div class="ms-import-opt" data-mode="append"><div class="ms-import-opt-title"><i class="fa-solid fa-plus"></i> 全部追加</div><div class="ms-import-opt-desc">不做任何检查，全部作为新内容添加（可能产生重复）</div></div>
      <div class="ms-import-opt" data-mode="replace"><div class="ms-import-opt-title"><i class="fa-solid fa-rotate"></i> 覆盖替换（范围内）</div><div class="ms-import-opt-desc"><i class="fa-solid fa-triangle-exclamation" style="color:#e55;margin-right:3px;"></i>只替换导入涉及的范围——同名分组里的本地剧场会被清空再填入，<strong>其他分组和剧场保留</strong>；同名标签、涉及角色的生日/祝福也会被替换</div></div>
      <button class="ms-btn" id="ms-import-cancel" style="width:100%;">取消</button></div>`);
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleTarget() {
      $p.find("#ms-imp-target-wrap").toggle(
        !$p.find("#ms-imp-groups").is(":checked"),
      );
    }
    toggleTarget();
    $p.find("#ms-body").on("change.ms", "#ms-imp-groups", toggleTarget);
    $p.find("#ms-body").on("click.ms", "#ms-import-cancel", navigateBack);
    $p.find("#ms-body").on("change.ms", "#ms-imp-target", function () {
      var $sel = $(this);
      if ($sel.val() === "_new") {
        $sel.val("");
        msPrompt("", {
          title: "新建分组",
          placeholder: "请输入新分组名称",
          validate: function (v) {
            if (!v || !v.trim()) return "名称不能为空";
            return null;
          },
        }).then(function (n) {
          if (!n || !n.trim()) return;
          const ng = createGroup(n.trim());
          let opts = `<option value="">未分组</option>`;
          data.groups.forEach((g) => {
            opts += `<option value="${g.id}" ${g.id === ng.id ? "selected" : ""}>${esc(g.name)}</option>`;
          });
          opts += `<option value="_new">+ 新建分组</option>`;
          $sel.html(opts);
        });
      }
    });
    $p.find("#ms-body").on("click.ms", ".ms-import-opt", function () {
      const mode = $(this).data("mode");
      const useG = $p.find("#ms-imp-groups").is(":checked"),
        useT = $p.find("#ms-imp-tags").is(":checked");
      let targetGid = null;
      if (!useG) {
        targetGid = $p.find("#ms-imp-target").val();
        if (targetGid === "_new") targetGid = null;
      }
      var useCG = $p.find("#ms-imp-cgroups").is(":checked");
      function doIt() {
        executeImport(
          mode,
          ig,
          ip,
          itags,
          useG,
          useT,
          targetGid,
          icgs,
          useCG,
          v.importedBdMessages || {},
          v.importedBdDates || {},
        );
      }
      if (mode === "replace") {
        msConfirm(
          "本次导入会替换：\n· 同名分组里的剧场（清空再填入）\n· 同名标签的颜色和属性\n· 涉及角色的生日与祝福（你自己写的会有冲突提示）\n\n其它本地数据会原样保留。建议先导出备份。",
          {
            title: "覆盖替换（范围内）",
            dangerous: true,
            okText: "覆盖",
          },
        ).then(function (ok) {
          if (ok) doIt();
        });
      } else {
        doIt();
      }
    });
  }

  function bindReorderDrag($body, onDrop) {
    if (bindReorderDrag._cleanup) {
      bindReorderDrag._cleanup();
      bindReorderDrag._cleanup = null;
    }

    var active = false;
    var fromEl = null;
    var rafId = null;
    var lastClientX = 0;
    var lastClientY = 0;
    var scrollDir = 0;
    var scrollSpeed = 0;
    var capturedGrip = null;

    var panelEl = $("#" + PANEL_ID)[0];
    var ownerDoc = panelEl ? panelEl.ownerDocument : document;

    function updateHighlight() {
      var el = ownerDoc.elementFromPoint(lastClientX, lastClientY);
      var item = el ? el.closest(".ms-reorder-item") : null;
      $body.find(".ms-reorder-item").removeClass("ms-drag-over");
      if (item && item !== fromEl) item.classList.add("ms-drag-over");
    }

    function scrollFrame() {
      if (!active) return;
      if (scrollDir !== 0 && scrollSpeed > 0) {
        $body[0].scrollTop += scrollDir * scrollSpeed;
        updateHighlight();
      }
      rafId = requestAnimationFrame(scrollFrame);
    }

    function stopScroll() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      scrollDir = 0;
      scrollSpeed = 0;
    }

    function onMove(ev) {
      if (!active) return;
      ev.preventDefault();
      lastClientX = ev.clientX;
      lastClientY = ev.clientY;
      var bodyEl = $body[0];
      var rect = bodyEl.getBoundingClientRect();
      var edge = 100;
      var minSpd = 8,
        maxSpd = 45;
      scrollDir = 0;
      scrollSpeed = 0;
      if (ev.clientY < rect.top + edge && bodyEl.scrollTop > 0) {
        scrollDir = -1;
        var d = rect.top + edge - ev.clientY;
        var ratio = Math.min(d / edge, 1);
        scrollSpeed = minSpd + (maxSpd - minSpd) * ratio;
      } else if (
        ev.clientY > rect.bottom - edge &&
        bodyEl.scrollTop < bodyEl.scrollHeight - bodyEl.clientHeight
      ) {
        scrollDir = 1;
        var d2 = ev.clientY - (rect.bottom - edge);
        var ratio2 = Math.min(d2 / edge, 1);
        scrollSpeed = minSpd + (maxSpd - minSpd) * ratio2;
      }
      if (scrollDir === 0) updateHighlight();
    }

    function endDrag(ev) {
      if (!active) return;
      active = false;
      stopScroll();
      $body.find(".ms-reorder-item").removeClass("ms-drag-over");

      if (ev && ev.type !== "lostpointercapture") {
        var el = ownerDoc.elementFromPoint(ev.clientX, ev.clientY);
        var targetEl = el ? el.closest(".ms-reorder-item") : null;
        if (targetEl && fromEl && targetEl !== fromEl) {
          onDrop(fromEl, targetEl);
        }
      }

      detachGrip();
      fromEl = null;
    }

    function detachGrip() {
      if (!capturedGrip) return;
      capturedGrip.removeEventListener("pointermove", onMove);
      capturedGrip.removeEventListener("pointerup", endDrag);
      capturedGrip.removeEventListener("pointercancel", endDrag);
      capturedGrip.removeEventListener("lostpointercapture", endDrag);
      capturedGrip = null;
    }

    $body.on("pointerdown.msdrag", ".ms-reorder-grip", function (e) {
      var oe = e.originalEvent || e;
      if (oe.pointerType === "mouse" && oe.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      fromEl = this.closest(".ms-reorder-item");
      if (!fromEl) return;

      active = true;
      capturedGrip = this;

      try {
        this.setPointerCapture(oe.pointerId);
      } catch (ex) {}

      this.addEventListener("pointermove", onMove);
      this.addEventListener("pointerup", endDrag);
      this.addEventListener("pointercancel", endDrag);
      this.addEventListener("lostpointercapture", endDrag);

      stopScroll();
      rafId = requestAnimationFrame(scrollFrame);
    });

    bindReorderDrag._cleanup = function () {
      $body.off(".msdrag");
      stopScroll();
      detachGrip();
      active = false;
      fromEl = null;
    };
  }

