  function bindAllEvents() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-body, #ms-toolbar, #ms-footer, #ms-filter-panel")
      .off(".ms")
      .off(".ms-gd");
    if (bindReorderDrag._cleanup) {
      bindReorderDrag._cleanup();
      bindReorderDrag._cleanup = null;
    }
    var $body = $p.find("#ms-body"),
      $toolbar = $p.find("#ms-toolbar"),
      $footer = $p.find("#ms-footer");
    $toolbar.on("compositionstart.ms", "#ms-search", function () {
      $(this).data("ms-composing", true);
    });
    $toolbar.on("compositionend.ms", "#ms-search", function () {
      $(this).data("ms-composing", false);
      if (_searchTimer) {
        clearTimeout(_searchTimer);
        _searchTimer = null;
      }
      searchQuery = $(this).val();
      $p.find("#ms-search-clear").toggle(!!searchQuery);
      renderBodyOnly();
    });
    $toolbar.on("input.ms", "#ms-search", function () {
      if ($(this).data("ms-composing")) return;
      var val = $(this).val();
      $p.find("#ms-search-clear").toggle(!!val);
      if (_searchTimer) clearTimeout(_searchTimer);
      var delay =
        data.prompts.length > 1000
          ? 450
          : data.prompts.length > 300
            ? 300
            : 180;
      _searchTimer = setTimeout(function () {
        _searchTimer = null;
        searchQuery = val;
        renderBodyOnly();
      }, delay);
    });
    $toolbar.on("click.ms", "#ms-search-clear", function () {
      if (_searchTimer) {
        clearTimeout(_searchTimer);
        _searchTimer = null;
      }
      searchQuery = "";
      $p.find("#ms-search").val("").focus();
      $(this).hide();
      renderBodyOnly();
    });
    $toolbar.on("click.ms", "#ms-btn-new", () =>
      navigateTo({ name: "edit", promptId: null, defaultGroupId: null }),
    );
    $toolbar.on("click.ms", "#ms-btn-sort", () => showSortDropdown($p));
    $toolbar.on("click.ms", "#ms-btn-random", () => doRandomPick());
    $toolbar.on("click.ms", "#ms-btn-range", () => {
      rangeSelectMode = !rangeSelectMode;
      if (rangeSelectMode && selectedIds.size > 0) {
        var vis = getVisiblePromptIds();
        rangeSelectAnchor = null;
        rangeSelectAnchorPids = [];
        var selArr = Array.from(selectedIds);
        var firstP = selArr.length > 0 ? getPrompt(selArr[0]) : null;
        if (firstP && firstP.series && firstP.series.trim()) {
          var sname = firstP.series.trim();
          var sgid = firstP.groupId || null;
          var allSame = selArr.every(function (pid) {
            var pp = getPrompt(pid);
            return (
              pp &&
              (pp.series || "").trim() === sname &&
              (pp.groupId || null) === sgid
            );
          });
          if (allSame) {
            var seriesItemsInVis = vis.filter(function (pid) {
              var pp = getPrompt(pid);
              return (
                pp &&
                (pp.series || "").trim() === sname &&
                (pp.groupId || null) === sgid
              );
            });
            if (
              selArr.length === seriesItemsInVis.length &&
              seriesItemsInVis.length > 1
            ) {
              var _sid =
                "ms-series-" +
                simpleHash(
                  sname + "||" + (sgid || "") + "||" + seriesItemsInVis.length,
                );
              rangeSelectAnchor = "series:" + _sid;
              rangeSelectAnchorPids = seriesItemsInVis.slice();
            }
          }
        }
        if (!rangeSelectAnchor) {
          for (var i = 0; i < vis.length; i++) {
            if (selectedIds.has(vis[i])) {
              rangeSelectAnchor = vis[i];
              rangeSelectAnchorPids = [vis[i]];
              break;
            }
          }
        }
      } else {
        rangeSelectAnchor = null;
        rangeSelectAnchorPids = [];
      }
      rerenderAfterSelectChange();
    });
    $toolbar.on("click.ms", "#ms-btn-select", () => {
      selectMode = !selectMode;
      if (!selectMode) {
        selectedIds.clear();
        rangeSelectMode = false;
        rangeSelectAnchor = null;
      }
      rerenderAfterSelectChange();
      $p.find("#ms-btn-select").toggleClass("active", selectMode);
    });
    $toolbar.on("click.ms", "#ms-btn-filter", () => {
      const $fp = $p.find("#ms-filter-panel");
      if ($fp.hasClass("open")) $fp.removeClass("open");
      else {
        $fp.html(buildFilterPanel()).addClass("open");
        bindFilterEvents($p);
      }
    });
    $body.on("pointerdown.ms", ".ms-nav-item[data-nav='group']", function (e) {
      if ($(e.target).closest("button, a, input").length) return;
      var gid = $(this).data("gid");
      if (!gid || gid === "_ungrouped") return;
      if (selectMode) return;
      var $el = $(this);
      var $row = $el.closest(".ms-swipe-row");
      var $wrap = $el.closest(".ms-swipe-wrap");
      var canSwipe = $row.length > 0 && $wrap.length > 0;
      $el.data("ms-nav-press-time", Date.now());
      var sx = e.clientX || 0,
        sy = e.clientY || 0;
      var swiping = false;
      var dirLocked = false;
      var startOffset = $wrap.hasClass("ms-swiped") ? -80 : 0;
      var navTimer = setTimeout(function () {
        if (swiping) return;
        if (gid === "_builtin_guide_group") return;
        $el.data("ms-nav-lp-fired", true);
        if (navigator.vibrate) navigator.vibrate(30);
        navigateTo({ name: "group-edit", groupId: gid });
      }, 600);
      var onMove2 = function (ev) {
        var dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (!dirLocked) {
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            dirLocked = true;
            if (canSwipe && Math.abs(dx) > Math.abs(dy)) {
              swiping = true;
              $wrap.addClass("ms-swiping");
            }
            if (navTimer) {
              clearTimeout(navTimer);
              navTimer = null;
            }
          }
          return;
        }
        if (swiping) {
          ev.preventDefault();
          var off = startOffset + dx;
          if (off > 0) off = 0;
          if (off < -80) off = -80;
          $row.css("transform", "translateX(" + off + "px)");
        }
      };
      var onUp2 = function (ev) {
        if (navTimer) {
          clearTimeout(navTimer);
          navTimer = null;
        }
        if (swiping) {
          $wrap.removeClass("ms-swiping");
          var dx =
            (ev && typeof ev.clientX === "number" ? ev.clientX : sx) - sx;
          var open;
          if (startOffset < 0) {
            open = !(dx > 20);
          } else {
            open = dx < -40;
          }
          closeAllSwipes($wrap);
          if (open) {
            $wrap.addClass("ms-swiped");
            $row.css("transform", "translateX(-80px)");
          } else {
            $wrap.removeClass("ms-swiped");
            $row.css("transform", "");
          }
          $el.data("ms-swipe-just", true);
          setTimeout(function () {
            $el.removeData("ms-swipe-just");
          }, 350);
        }
        $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp");
      };
      $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp")
        .on("pointermove.msnlp", onMove2)
        .on("pointerup.msnlp pointercancel.msnlp", onUp2);
    });
    $body.on("click.ms", ".ms-nav-item", function () {
      var nav = $(this).data("nav");
      if ($(this).data("ms-swipe-just")) {
        $(this).removeData("ms-swipe-just");
        return;
      }
      var $swWrap = $(this).closest(".ms-swipe-wrap");
      if ($swWrap.length && $swWrap.hasClass("ms-swiped")) {
        closeAllSwipes();
        return;
      }
      if ($(this).data("ms-nav-lp-fired")) {
        $(this).removeData("ms-nav-lp-fired");
        return;
      }
      var pressTime = $(this).data("ms-nav-press-time") || 0;
      if (pressTime && Date.now() - pressTime > 600) {
        $(this).removeData("ms-nav-press-time");
        return;
      }
      $(this).removeData("ms-nav-press-time");
      if (nav === "starred") navigateTo({ name: "starred" });
      else if (nav === "recent") navigateTo({ name: "recent" });
      else if (nav === "characters") navigateTo({ name: "characters" });
      else if (nav === "group")
        navigateTo({ name: "group", groupId: $(this).data("gid") });
    });
    $body.on("click.ms", ".ms-swipe-del", function (e) {
      e.stopPropagation();
      var gid = $(this).data("swipe-del-gid");
      var g = getGroup(gid);
      if (!g) return;
      var cnt = getPromptsInGroup(gid).length;
      var isGuide = gid === "_builtin_guide_group";
      var msg;
      if (isGuide) {
        msg =
          "确定删除「" +
          g.name +
          "」分组吗？\n\n这是内置使用指南，里面的说明文档会一起删除。\n删除后可在「设置 → 重新生成使用说明」里恢复。";
      } else if (cnt > 0) {
        msg =
          "确定删除「" +
          g.name +
          "」分组吗？\n\n分组下的 " +
          cnt +
          " 条剧场会一起被删除，此操作不可撤销！";
      } else {
        msg = "确定删除「" + g.name + "」分组吗？";
      }
      msConfirm(msg, {
        title: "删除分组",
        dangerous: true,
        okText: "删除",
      }).then(function (ok) {
        if (!ok) {
          closeAllSwipes();
          return;
        }
        deleteGroupWithPrompts(gid);
        renderView();
      });
    });
    $body.on("contextmenu.ms", ".ms-card", function (e) {
      e.preventDefault();
    });
    $body.on("pointerdown.ms", ".ms-card", function (e) {
      if ($(e.target).closest(".ms-card-star,.ms-card-qbtn").length) return;
      if (selectMode && rangeSelectMode) {
        const lpPid = $(this).data("pid");
        var $lpEl = $(this);
        var lpSx = e.clientX || 0,
          lpSy = e.clientY || 0;
        var lpTimer = setTimeout(function () {
          lpTimer = null;
          $lpEl.data("ms-rng-lp-fired", true);
          if (navigator.vibrate) navigator.vibrate(30);
          var vis = getVisiblePromptIds();
          var newAnchorIdx = vis.indexOf(lpPid);
          var farEndIdx = -1;
          if (
            newAnchorIdx >= 0 &&
            rangeSelectAnchorPids.length > 0 &&
            selectedIds.size > 0
          ) {
            var anchorIndices = rangeSelectAnchorPids
              .map(function (p) {
                return vis.indexOf(p);
              })
              .filter(function (x) {
                return x >= 0;
              });
            if (anchorIndices.length > 0) {
              var anchorMin = Math.min.apply(null, anchorIndices);
              var anchorMax = Math.max.apply(null, anchorIndices);
              var selIndices = [];
              selectedIds.forEach(function (pid) {
                var i = vis.indexOf(pid);
                if (i >= 0) selIndices.push(i);
              });
              if (selIndices.length > 0) {
                var selMin = Math.min.apply(null, selIndices);
                var selMax = Math.max.apply(null, selIndices);
                if (selMin < anchorMin) farEndIdx = selMin;
                else if (selMax > anchorMax) farEndIdx = selMax;
              }
            }
          }
          rangeSelectAnchor = lpPid;
          rangeSelectAnchorPids = [lpPid];
          selectedIds.clear();
          if (farEndIdx >= 0 && newAnchorIdx >= 0) {
            var lo = Math.min(newAnchorIdx, farEndIdx);
            var hi = Math.max(newAnchorIdx, farEndIdx);
            for (var i = lo; i <= hi; i++) selectedIds.add(vis[i]);
          } else {
            selectedIds.add(lpPid);
          }
          rerenderAfterSelectChange();
          toast("info", "已设为新锚点");
        }, 600);
        var lpOnMove = function (ev) {
          if (!lpTimer) return;
          var dx = (ev.clientX || 0) - lpSx,
            dy = (ev.clientY || 0) - lpSy;
          if (dx * dx + dy * dy > 100) {
            clearTimeout(lpTimer);
            lpTimer = null;
          }
        };
        var lpOnUp = function () {
          if (lpTimer) {
            clearTimeout(lpTimer);
            lpTimer = null;
          }
          $p.off(
            "pointermove.ms-rnglp pointerup.ms-rnglp pointercancel.ms-rnglp",
          );
        };
        $p.off("pointermove.ms-rnglp pointerup.ms-rnglp pointercancel.ms-rnglp")
          .on("pointermove.ms-rnglp", lpOnMove)
          .on("pointerup.ms-rnglp pointercancel.ms-rnglp", lpOnUp);
        return;
      }
      if (selectMode) return;
      const pid = $(this).data("pid");
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTriggered = false;
      $p.data("ms-card-press-time", Date.now());
      const sx = e.clientX || 0,
        sy = e.clientY || 0;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        longPressTimer = null;
        selectMode = true;
        selectedIds.add(pid);
        if (navigator.vibrate) navigator.vibrate(30);
        rerenderAfterSelectChange();
        $p.find("#ms-btn-select").addClass("active");
      }, 600);
      const onMove = (ev) => {
        if (!longPressTimer) return;
        const dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (dx * dx + dy * dy > 100) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };
      const onUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (longPressTriggered) {
          setTimeout(function () {
            longPressTriggered = false;
          }, 350);
        }
        $p.off("pointermove.mslp pointerup.mslp pointercancel.mslp");
      };
      $p.off("pointermove.mslp pointerup.mslp pointercancel.mslp")
        .on("pointermove.mslp", onMove)
        .on("pointerup.mslp pointercancel.mslp", onUp);
    });
    $body.on("click.ms", ".ms-card", function (e) {
      if ($(e.target).closest(".ms-card-star,.ms-card-qbtn").length) return;
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }
      if ($(this).data("ms-rng-lp-fired")) {
        $(this).removeData("ms-rng-lp-fired");
        return;
      }
      const pid = $(this).data("pid");
      if (selectMode) {
        if (rangeSelectMode) {
          var vis = getVisiblePromptIds();
          var anchorValid = rangeSelectAnchorPids.some(function (p) {
            return vis.indexOf(p) >= 0;
          });
          if (!rangeSelectAnchor || !anchorValid) {
            rangeSelectAnchor = pid;
            rangeSelectAnchorPids = [pid];
            selectedIds.clear();
            selectedIds.add(pid);
          } else if (rangeSelectAnchor === pid) {
            rangeSelectAnchor = null;
            rangeSelectAnchorPids = [];
            selectedIds.clear();
          } else {
            var anchorIdx = rangeSelectAnchorPids
              .map(function (p) {
                return vis.indexOf(p);
              })
              .filter(function (x) {
                return x >= 0;
              });
            var yi = vis.indexOf(pid);
            if (anchorIdx.length === 0 || yi < 0) {
              rerenderAfterSelectChange();
              return;
            }
            var anchorStart = Math.min.apply(null, anchorIdx);
            var anchorEnd = Math.max.apply(null, anchorIdx);
            var lo = Math.min(yi, anchorStart);
            var hi = Math.max(yi, anchorEnd);
            selectedIds.clear();
            for (var i = lo; i <= hi; i++) selectedIds.add(vis[i]);
          }
        } else {
          if (selectedIds.has(pid)) selectedIds.delete(pid);
          else selectedIds.add(pid);
        }
        rerenderAfterSelectChange();
        return;
      }
      var pressTime = $p.data("ms-card-press-time") || 0;
      if (pressTime && Date.now() - pressTime > 600) {
        return;
      }
      navigateTo({ name: "preview", promptId: pid });
    });
    $body.on("click.ms", ".ms-series-header", function (e) {
      if ($(e.target).closest(".ms-series-check").length) return;
      var sid = $(this).data("series-id");
      if (!sid) return;
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find("#" + sid).toggleClass("open");
    });
    $body.on("pointerdown.ms", ".ms-series-check", function (e) {
      if (!selectMode || !rangeSelectMode) return;
      e.stopPropagation();
      var $el = $(this);
      var ids;
      try {
        ids = JSON.parse($el.attr("data-series-ids"));
      } catch (ex) {
        return;
      }
      var seriesKey = $el.attr("data-series-key");
      if (!seriesKey) return;
      var sx = e.clientX || 0,
        sy = e.clientY || 0;
      var lpTimer = setTimeout(function () {
        lpTimer = null;
        $el.data("ms-srng-lp-fired", true);
        if (navigator.vibrate) navigator.vibrate(30);
        var vis = getVisiblePromptIds();
        var seriesIndices = ids
          .map(function (p) {
            return vis.indexOf(p);
          })
          .filter(function (x) {
            return x >= 0;
          });
        if (seriesIndices.length === 0) return;
        var newAnchorMin = Math.min.apply(null, seriesIndices);
        var newAnchorMax = Math.max.apply(null, seriesIndices);
        var farEndIdx = -1;
        if (rangeSelectAnchorPids.length > 0 && selectedIds.size > 0) {
          var anchorIndices = rangeSelectAnchorPids
            .map(function (p) {
              return vis.indexOf(p);
            })
            .filter(function (x) {
              return x >= 0;
            });
          if (anchorIndices.length > 0) {
            var anchorMin = Math.min.apply(null, anchorIndices);
            var anchorMax = Math.max.apply(null, anchorIndices);
            var selIndices = [];
            selectedIds.forEach(function (pid) {
              var i = vis.indexOf(pid);
              if (i >= 0) selIndices.push(i);
            });
            if (selIndices.length > 0) {
              var selMin = Math.min.apply(null, selIndices);
              var selMax = Math.max.apply(null, selIndices);
              if (selMin < anchorMin) farEndIdx = selMin;
              else if (selMax > anchorMax) farEndIdx = selMax;
            }
          }
        }
        rangeSelectAnchor = "series:" + seriesKey;
        rangeSelectAnchorPids = ids.slice();
        selectedIds.clear();
        if (farEndIdx >= 0) {
          var lo = Math.min(newAnchorMin, farEndIdx);
          var hi = Math.max(newAnchorMax, farEndIdx);
          for (var i = lo; i <= hi; i++) selectedIds.add(vis[i]);
        } else {
          ids.forEach(function (id) {
            selectedIds.add(id);
          });
        }
        rerenderAfterSelectChange();
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
      var $pp = $("#" + PANEL_ID);
      var onUp = function () {
        if (lpTimer) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
        $pp.off(
          "pointermove.ms-srnglp pointerup.ms-srnglp pointercancel.ms-srnglp",
        );
      };
      $pp
        .off(
          "pointermove.ms-srnglp pointerup.ms-srnglp pointercancel.ms-srnglp",
        )
        .on("pointermove.ms-srnglp", onMove)
        .on("pointerup.ms-srnglp pointercancel.ms-srnglp", onUp);
    });

    $body.on("click.ms", ".ms-series-check", function (e) {
      e.stopPropagation();
      if (!selectMode) return;
      if ($(this).data("ms-srng-lp-fired")) {
        $(this).removeData("ms-srng-lp-fired");
        return;
      }
      var ids;
      try {
        ids = JSON.parse($(this).attr("data-series-ids"));
      } catch (ex) {
        return;
      }
      var seriesKey = $(this).attr("data-series-key");
      if (rangeSelectMode && seriesKey) {
        var vis = getVisiblePromptIds();
        var anchorValid = rangeSelectAnchorPids.some(function (p) {
          return vis.indexOf(p) >= 0;
        });
        var anchorKeyForSeries = "series:" + seriesKey;
        if (!rangeSelectAnchor || !anchorValid) {
          rangeSelectAnchor = anchorKeyForSeries;
          rangeSelectAnchorPids = ids.slice();
          selectedIds.clear();
          ids.forEach(function (id) {
            selectedIds.add(id);
          });
        } else if (rangeSelectAnchor === anchorKeyForSeries) {
          rangeSelectAnchor = null;
          rangeSelectAnchorPids = [];
          selectedIds.clear();
        } else {
          var anchorIdx = rangeSelectAnchorPids
            .map(function (p) {
              return vis.indexOf(p);
            })
            .filter(function (x) {
              return x >= 0;
            });
          var seriesIdx = ids
            .map(function (p) {
              return vis.indexOf(p);
            })
            .filter(function (x) {
              return x >= 0;
            });
          if (anchorIdx.length === 0 || seriesIdx.length === 0) {
            rerenderAfterSelectChange();
            return;
          }
          var allIdx = anchorIdx.concat(seriesIdx);
          var lo = Math.min.apply(null, allIdx);
          var hi = Math.max.apply(null, allIdx);
          selectedIds.clear();
          for (var i = lo; i <= hi; i++) selectedIds.add(vis[i]);
        }
        rerenderAfterSelectChange();
        return;
      }
      var allSel = ids.every(function (id) {
        return selectedIds.has(id);
      });
      ids.forEach(function (id) {
        if (allSel) selectedIds.delete(id);
        else selectedIds.add(id);
      });
      rerenderAfterSelectChange();
    });
    $body.on("click.ms", ".ms-card-star", function (e) {
      e.stopPropagation();
      toggleStar($(this).data("pid"));
      refreshKeepingState();
    });
    $body.on("click.ms", ".ms-card-qbtn", function (e) {
      e.stopPropagation();
      const action = $(this).data("qaction"),
        pid = $(this).data("pid");
      if (action === "send") sendToInput(pid);
      else if (action === "send-gen") sendAndGenerate(pid);
    });
    $footer.on("click.ms", "[data-action='manage-groups']", () =>
      navigateTo({ name: "groups" }),
    );
    $footer.on("click.ms", "[data-action='manage-tags']", () =>
      navigateTo({ name: "tag-manage" }),
    );
    $footer.on("click.ms", "[data-action='import']", () =>
      $p.find("#ms-file-input").trigger("click"),
    );
    $footer.on("click.ms", "[data-action='export']", () =>
      navigateTo({ name: "export" }),
    );
    $footer.on("click.ms", "[data-action='settings']", () =>
      navigateTo({ name: "settings" }),
    );
    $footer.on("click.ms", "[data-action='history-list']", () =>
      navigateTo({ name: "history-list" }),
    );
    $footer.on("click.ms", "[data-action='subscriptions']", () =>
      navigateTo({ name: "subscriptions" }),
    );
    $footer.on("click.ms", "[data-batch='selectall']", () => {
      const vis = getVisiblePromptIds();
      if (vis.length > 0 && vis.every((id) => selectedIds.has(id)))
        vis.forEach((id) => selectedIds.delete(id));
      else vis.forEach((id) => selectedIds.add(id));
      refreshKeepingState();
    });
    function ensureBatchSelection() {
      if (selectedIds.size > 0) return true;
      toast("warning", "请先勾选要操作的剧场（批量操作请在底栏全选）");
      return false;
    }
    $footer.on("click.ms", "[data-batch='delete']", () => {
      if (!ensureBatchSelection()) return;
      msConfirm(
        "确定删除选中的 " + selectedIds.size + " 项吗？\n\n该操作不可撤销",
        {
          title: "批量删除",
          dangerous: true,
          okText: "删除",
        },
      ).then(function (ok) {
        if (!ok) return;
        deletePrompts([...selectedIds]);
        exitSelectMode();
        renderView();
      });
    });
    $footer.on("click.ms", "[data-batch='move']", () => {
      if (!ensureBatchSelection()) return;
      showMoveDropdown($p);
    });
    $footer.on("click.ms", "[data-batch='tag']", () => {
      if (!ensureBatchSelection()) return;
      showBatchTagDropdown($p);
    });
    $footer.on("click.ms", "[data-batch='author']", () => {
      if (!ensureBatchSelection()) return;
      showBatchAuthorDialog();
    });
    $footer.on("click.ms", "[data-batch='series']", () => {
      if (!ensureBatchSelection()) return;
      showBatchSeriesDropdown($p);
    });
    $footer.on("click.ms", "[data-batch='character']", () => {
      if (!ensureBatchSelection()) return;
      showBatchCharacterDropdown($p);
    });
    $footer.on("click.ms", "[data-batch='export']", () => {
      if (selectedIds.size === 0) {
        toast("warning", "请先选择");
        return;
      }
      navigateTo({ name: "export-batch-options" });
    });
    $p.off("change.ms-file").on(
      "change.ms-file",
      "#ms-file-input",
      function () {
        if (this.files[0]) doImport(this.files[0]);
        this.value = "";
      },
    );
    $p.off("click.ms-collapse").on(
      "click.ms-collapse",
      "#ms-btn-collapse",
      toggleCollapse,
    );
    $p.off("click.ms-close").on("click.ms-close", "#ms-btn-close", hidePanel);
    $p.off("click.ms-back").on("click.ms-back", "#ms-go-back", navigateBack);
    var _scrollRaf = null;
    $body.off("scroll.ms-scroll-top").on("scroll.ms-scroll-top", function () {
      var el = this;
      if (_scrollRaf) return;
      _scrollRaf = requestAnimationFrame(function () {
        _scrollRaf = null;
        var $btnTop = $p.find("#ms-scroll-top");
        var $btnBottom = $p.find("#ms-scroll-bottom");
        if (el.scrollTop > 150) $btnTop.addClass("visible");
        else $btnTop.removeClass("visible");
        var distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distToBottom > 150) $btnBottom.addClass("visible");
        else $btnBottom.removeClass("visible");
        _loadMorePagedBlocks($body);
      });
    });
    $p.off("click.ms-scroll-top").on(
      "click.ms-scroll-top",
      "#ms-scroll-top",
      function () {
        $body.animate({ scrollTop: 0 }, 200);
      },
    );
    $p.off("click.ms-scroll-bottom").on(
      "click.ms-scroll-bottom",
      "#ms-scroll-bottom",
      function () {
        var $msBody = $p.find("#ms-body");
        $msBody.animate({ scrollTop: $msBody[0].scrollHeight }, 200);
      },
    );
  }

  function bindFilterEvents($p) {
    $p.find("#ms-filter-panel")
      .off(".msf")
      .on("click.msf", "[data-filter-tag]", function () {
        const tid = $(this).data("filter-tag");
        const mode = filterState.tagSelectMode || "include";
        if (mode === "exclude") {
          var ii = filterState.includeTags.indexOf(tid);
          if (ii >= 0) filterState.includeTags.splice(ii, 1);
          var ei = filterState.excludeTags.indexOf(tid);
          if (ei >= 0) filterState.excludeTags.splice(ei, 1);
          else filterState.excludeTags.push(tid);
        } else {
          var ei2 = filterState.excludeTags.indexOf(tid);
          if (ei2 >= 0) filterState.excludeTags.splice(ei2, 1);
          var ii2 = filterState.includeTags.indexOf(tid);
          if (ii2 >= 0) filterState.includeTags.splice(ii2, 1);
          else filterState.includeTags.push(tid);
        }
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "#ms-tag-mode-toggle", function () {
        data.settings.filterTagMode =
          data.settings.filterTagMode === "and" ? "or" : "and";
        saveData();
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "#ms-tag-exclude-toggle", function () {
        filterState.tagSelectMode =
          filterState.tagSelectMode === "exclude" ? "include" : "exclude";
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
      })
      .on("click.msf", "#ms-clear-filter", function () {
        filterState.includeTags = [];
        filterState.excludeTags = [];
        filterState.groupId = null;
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "[data-filter-group]", function () {
        var gid = $(this).data("filter-group") || null;
        filterState.groupId = filterState.groupId === gid ? null : gid;
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      })
      .on("click.msf", "#ms-filter-only-current-char", function () {
        filterState.onlyCurrentChar = !filterState.onlyCurrentChar;
        $p.find("#ms-filter-panel").html(buildFilterPanel());
        bindFilterEvents($p);
        renderBodyOnly();
      });
  }
  function buildColorPickerHTML(currentColor, dataAttrName, dataIdValue) {
    var isCustom = !GROUP_COLORS.includes(currentColor);
    var html = '<div class="ms-color-inline">';
    GROUP_COLORS.forEach(function (c) {
      html +=
        '<span class="ms-color-opt ' +
        (currentColor === c ? "selected" : "") +
        '" data-color="' +
        c +
        '" ' +
        dataAttrName +
        '="' +
        dataIdValue +
        '" style="background:' +
        c +
        '"></span>';
    });
    html +=
      '<span class="ms-color-opt ms-color-custom ' +
      (isCustom ? "selected" : "") +
      '" ' +
      dataAttrName +
      '="' +
      dataIdValue +
      '" title="+自定义"><input type="color" class="ms-custom-color-input" ' +
      dataAttrName +
      '="' +
      dataIdValue +
      '" value="' +
      currentColor +
      '"></span></div>';
    return html;
  }

