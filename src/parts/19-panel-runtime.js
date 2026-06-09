  function toggleCollapse() {
    const $p = $("#" + PANEL_ID);
    $p.toggleClass("ms-collapsed");
    data.settings.collapsed = $p.hasClass("ms-collapsed");
    $p.find("#ms-btn-collapse i").attr(
      "class",
      data.settings.collapsed
        ? "fa-solid fa-window-maximize"
        : "fa-solid fa-window-minimize",
    );
    saveData();
  }

  function resetPanelPosition() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    $p[0].style.removeProperty("left");
    $p[0].style.removeProperty("top");
    $p[0].style.removeProperty("transform");
    data.settings.panelPos = null;
    saveData();
    toast("info", "面板已回到默认位置");
  }

  function showPanel() {
    let $p = $("#" + PANEL_ID);
    if ($p.length === 0) {
      if (!$("#" + STYLE_ID).length)
        $("head").append(`<style id="${STYLE_ID}">${getCSS()}</style>`);
      $("body").append(getPanelHTML());
      $p = $("#" + PANEL_ID);
      if (data.settings.collapsed) {
        $p.addClass("ms-collapsed");
        $p.find("#ms-btn-collapse i").attr(
          "class",
          "fa-solid fa-window-maximize",
        );
      }
      if (data.settings.panelPos) {
        $p[0].style.setProperty("top", data.settings.panelPos.top, "important");
        $p[0].style.setProperty(
          "left",
          data.settings.panelPos.left,
          "important",
        );
        $p[0].style.setProperty("transform", "none", "important");
      } else {
        $p[0].style.removeProperty("left");
        $p[0].style.removeProperty("top");
        $p[0].style.removeProperty("transform");
      }
      makeDraggable();
      setupKeyboardAdapt();
      $p.off("click.ms-inject-clear-btn").on(
        "click.ms-inject-clear-btn",
        ".ms-inject-clear-btn",
        function (e) {
          e.stopPropagation();
          var sids = data.settings.stageSelectedIds || [];
          if (sids.length === 0) return;
          data.settings.stageSelectedIds = [];
          saveData();
          updateInjectIndicator();
          if (panelVisible) {
            try {
              if (currentView().name === "preview") renderView();
              else refreshKeepingState();
            } catch (e) {}
          }
        },
      );
      $p.off("click.ms-fs-edit").on(
        "click.ms-fs-edit",
        ".ms-fs-edit-btn",
        function (e) {
          e.stopPropagation();
          var target = $(this).data("fs-target");
          var title = $(this).data("fs-title") || "全屏编辑";
          if (!target) return;
          showFullscreenEditor({ targetSelector: target, title: title });
        },
      );
      $p.off("click.ms-inject-ind").on(
        "click.ms-inject-ind",
        "#ms-inject-indicator",
        function () {
          var sids = (data.settings.stageSelectedIds || []).filter(
            function (sid) {
              return getPrompt(sid);
            },
          );
          if (sids.length === 0) return;
          if (_injectIndicatorIdx >= sids.length) _injectIndicatorIdx = 0;
          var sid = sids[_injectIndicatorIdx];
          _injectIndicatorIdx = (_injectIndicatorIdx + 1) % sids.length;
          if ($p.hasClass("ms-collapsed")) {
            $p.removeClass("ms-collapsed");
            data.settings.collapsed = false;
            $p.find("#ms-btn-collapse i").attr(
              "class",
              "fa-solid fa-window-minimize",
            );
            saveData();
          }
          while (
            viewStack.length > 1 &&
            viewStack[viewStack.length - 1].name === "preview"
          ) {
            viewStack.pop();
          }
          navigateTo({ name: "preview", promptId: sid });
        },
      );
      [
        "click",
        "mousedown",
        "mouseup",
        "pointerdown",
        "pointerup",
        "touchstart",
        "touchend",
      ].forEach(function (evt) {
        $p[0].addEventListener(evt, function (e) {
          e.stopPropagation();
        });
      });
    }
    if (escKeyHandler) {
      try {
        document.removeEventListener("keydown", escKeyHandler, true);
      } catch (e) {}
      escKeyHandler = null;
    }
    escKeyHandler = function (e) {
      if (e.key === "Escape") {
        var $pp = $("#" + PANEL_ID);
        if (!$pp.hasClass("ms-visible")) return;
        if ($pp.find(".ms-modal-overlay").length) return;
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        var $findBar = $pp.find("#ms-find-bar");
        if ($findBar.is(":visible")) {
          $findBar.hide();
          $pp.find("[data-md='find']").removeClass("active");
          var ta = $pp.find("#ms-edit-content")[0];
          if (ta) ta.focus();
          return;
        }
        var $qpPopup = $pp.find("#ms-qp-popup");
        if ($qpPopup.length) {
          $qpPopup.remove();
          $pp.find("[data-md='quick-phrases']").removeClass("active");
          var ta2 = $pp.find("#ms-edit-content")[0];
          if (ta2) ta2.focus();
          return;
        }
        if ($pp.find("#ms-dropdown").is(":visible")) {
          closeActiveDropdown();
          return;
        }
        if (viewStack.length > 1) {
          navigateBack();
          return;
        }
        hidePanel();
      }
    };
    document.addEventListener("keydown", escKeyHandler, true);
    updateAccentColor();
    syncThemeBackground();
    syncThemeColors();

    if (!$p.data("ms-drop-bound")) {
      $p.data("ms-drop-bound", true);
      let dragCounter = 0;
      $p.on("dragenter", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        $p.addClass("ms-drag-hover");
      });
      $p.on("dragleave", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        var rect = $p[0].getBoundingClientRect();
        var x = e.originalEvent.clientX,
          y = e.originalEvent.clientY;
        if (
          dragCounter <= 0 ||
          x < rect.left ||
          x >= rect.right ||
          y < rect.top ||
          y >= rect.bottom
        ) {
          dragCounter = 0;
          $p.removeClass("ms-drag-hover");
        }
      });
      $p.on("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      $p.on("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        $p.removeClass("ms-drag-hover");
        const files =
          e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.name.endsWith(".json")) {
            doImport(file);
          } else {
            toast("warning", "请拖入 .json 文件");
          }
        }
      });
    }
    $p.addClass("ms-visible");
    panelVisible = true;
    data.settings.panelWasVisible = true;
    saveData();
    const panelRect = $p[0].getBoundingClientRect();
    const pTop = panelRect.top,
      pLeft = panelRect.left;
    const checkWin =
      ($p[0].ownerDocument && $p[0].ownerDocument.defaultView) || window;
    if (
      pTop < -10 ||
      pTop > checkWin.innerHeight - 50 ||
      pLeft < -200 ||
      pLeft > checkWin.innerWidth - 60 ||
      (pTop < 5 && pLeft < 5)
    ) {
      $p[0].style.removeProperty("left");
      $p[0].style.removeProperty("top");
      $p[0].style.removeProperty("transform");
      data.settings.panelPos = null;
      saveData();
    }
    viewStack = [{ name: "list" }];
    searchQuery = "";
    filterState = {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      onlyCurrentChar: false,
    };
    var curGroupCount = data.groups.length;
    if (
      !showPanel._preloaded ||
      Math.abs(curGroupCount - (showPanel._lastPreloadCount || 0)) >
        Math.max(5, curGroupCount * 0.1)
    ) {
      showPanel._preloaded = true;
      showPanel._lastPreloadCount = curGroupCount;
      setTimeout(preloadPanelImages, 500);
    }
    renderView();
    autoCheckSubscriptions();
    showBirthdayBannerIfAny();
    setTimeout(checkAndShowChangelog, 800);
  }

