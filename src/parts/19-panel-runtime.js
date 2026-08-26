function toggleCollapse() {
  const $p = $("#" + PANEL_ID);
  if (data.settings.collapseMode === "ball") {
    data.settings.collapsed = false;
    $p.removeClass("ms-collapsed");
    $p.find("#ms-btn-collapse i").attr("class", "fa-solid fa-window-minimize");
    exitFocusMode();
    $p.removeClass("ms-visible");
    panelVisible = false;
    data.settings.panelWasVisible = true;
    saveData();
    removeEscHandler();
    showFloatBall();
    return;
  }
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
  toast("info", "面板已回到默认位置", 500);
}
var _ballRestoring = false;
function ensurePanelStyles() {
  if (!$("#" + STYLE_ID).length) {
    $("head").append('<style id="' + STYLE_ID + '">' + getCSS() + "</style>");
  }
}
function ensureFloatBall() {
  ensurePanelStyles();
  var $b = $("#ms-float-ball");
  if ($b.length) return $b;
  $("body").append(
    '<div id="ms-float-ball" title="小剧场"><i class="fa-solid fa-masks-theater"></i><span class="ms-ball-badge"></span></div>',
  );
  $b = $("#ms-float-ball");
  if (data.settings.ballPos) {
    $b[0].style.setProperty("top", data.settings.ballPos.top, "important");
    $b[0].style.setProperty("left", data.settings.ballPos.left, "important");
    $b[0].style.setProperty("right", "auto", "important");
    $b[0].style.setProperty("bottom", "auto", "important");
  }
  makeBallDraggable($b);
  [
    "click",
    "mousedown",
    "mouseup",
    "pointerdown",
    "pointerup",
    "touchstart",
    "touchend",
  ].forEach(function (evt) {
    $b[0].addEventListener(evt, function (e) {
      e.stopPropagation();
    });
  });
  return $b;
}

function clampBallPos($b) {
  if (!$b || !$b.length) return;
  var el = $b[0];
  var w = (el.ownerDocument && el.ownerDocument.defaultView) || window;
  var rect = el.getBoundingClientRect();
  if (rect.width === 0) return;
  var nl = Math.max(4, Math.min(rect.left, w.innerWidth - rect.width - 4));
  var nt = Math.max(4, Math.min(rect.top, w.innerHeight - rect.height - 4));
  if (nl !== rect.left || nt !== rect.top) {
    el.style.setProperty("left", nl + "px", "important");
    el.style.setProperty("top", nt + "px", "important");
    el.style.setProperty("right", "auto", "important");
    el.style.setProperty("bottom", "auto", "important");
    data.settings.ballPos = { top: nt + "px", left: nl + "px" };
    saveData();
  }
}

function syncBallBadge() {
  var $b = $("#ms-float-ball");
  if (!$b.length) return;
  var $badge = $b.find(".ms-ball-badge");
  var cnt = 0;
  var mode = "";
  if (data.settings.stageInjectEnabled) {
    var sids = (data.settings.stageSelectedIds || []).filter(function (sid) {
      return getPrompt(sid);
    });
    if (sids.length > 0) {
      cnt = sids.length;
      mode = "manual";
    } else {
      cnt = getPinnedInjectCount();
      if (cnt > 0) mode = "pinned";
      if (
        cnt === 0 &&
        data.settings.randomInject &&
        data.settings.randomInject.enabled
      ) {
        cnt = data.settings.randomInject.multiEnabled
          ? parseInt(data.settings.randomInject.multiCount) || 1
          : 1;
        mode = "random";
      }
    }
  }
  $b.removeClass("ms-ball-manual ms-ball-pinned ms-ball-random");
  if (cnt > 0) {
    $badge.text(cnt > 9 ? "9+" : String(cnt)).addClass("visible");
    $b.addClass("ms-ball-" + mode);
  } else {
    $badge.text("").removeClass("visible");
  }
}

function showFloatBall() {
  if (data.settings.collapseMode !== "ball") return;
  var $b = ensureFloatBall();
  $b.addClass("visible");
  clampBallPos($b);
  syncBallBadge();
}

function hideFloatBall() {
  $("#ms-float-ball").removeClass("visible");
}

function onFloatBallClick() {
  hideFloatBall();
  var hasPanel = $("#" + PANEL_ID).length > 0;
  if (hasPanel) _ballRestoring = true;
  try {
    showPanel();
  } finally {
    _ballRestoring = false;
  }
}

function makeBallDraggable($b) {
  var el = $b[0];
  if (!el) return;
  var w = (el.ownerDocument && el.ownerDocument.defaultView) || window;
  var dragging = false;
  var sx = 0;
  var sy = 0;
  var sl = 0;
  var st = 0;
  var didMove = false;
  el.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    didMove = false;
    sx = e.clientX;
    sy = e.clientY;
    var rect = el.getBoundingClientRect();
    sl = rect.left;
    st = rect.top;
    el.style.setProperty("left", sl + "px", "important");
    el.style.setProperty("top", st + "px", "important");
    el.style.setProperty("right", "auto", "important");
    el.style.setProperty("bottom", "auto", "important");
    try {
      el.setPointerCapture(e.pointerId);
    } catch (ex) {}
  });
  el.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    e.preventDefault();
    if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3)
      didMove = true;
    if (!didMove) return;
    var rect = el.getBoundingClientRect();
    var nl = sl + (e.clientX - sx);
    var nt = st + (e.clientY - sy);
    nl = Math.max(4, Math.min(nl, w.innerWidth - rect.width - 4));
    nt = Math.max(4, Math.min(nt, w.innerHeight - rect.height - 4));
    el.style.setProperty("left", nl + "px", "important");
    el.style.setProperty("top", nt + "px", "important");
  });
  function endBallDrag() {
    if (!dragging) return;
    dragging = false;
    if (didMove) {
      data.settings.ballPos = {
        top: el.style.getPropertyValue("top"),
        left: el.style.getPropertyValue("left"),
      };
      saveData();
    } else {
      onFloatBallClick();
    }
  }
  el.addEventListener("pointerup", endBallDrag);
  el.addEventListener("pointercancel", endBallDrag);
  el.addEventListener("lostpointercapture", endBallDrag);
}

function showPanel() {
  hideFloatBall();
  ensurePanelStyles();
  let $p = $("#" + PANEL_ID);
  if ($p.length === 0) {
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
      $p[0].style.setProperty("left", data.settings.panelPos.left, "important");
      $p[0].style.setProperty("transform", "none", "important");
    } else {
      $p[0].style.removeProperty("left");
      $p[0].style.removeProperty("top");
      $p[0].style.removeProperty("transform");
    }
    makeDraggable();
    setupKeyboardAdapt();
    applyUICustomization();
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
      /* 全屏编辑浮层不是 .ms-modal-overlay，走不到上面的模态放行分支，
         再往下就会一路退到 navigateBack()——浮层还压在最上面，背后的页面
         却已经换掉了，此时点浮层里的「保存」会写进一个游离节点。 */
      var $fsOverlay = $pp.find(".ms-fs-editor-overlay");
      if ($fsOverlay.length) {
        var $fsCancel = $fsOverlay.find("#ms-fs-cancel");
        if ($fsCancel.length) $fsCancel.trigger("click");
        else $fsOverlay.remove();
        return;
      }
      var $msPopup = $pp.find(
        "#ms-gp-popup, #ms-sp-popup, #ms-char-search-popup",
      );
      if ($msPopup.length) {
        $msPopup.remove();
        $pp.off(
          "pointerdown.ms-gp keydown.ms-gp pointerdown.ms-sp keydown.ms-sp pointerdown.ms-char-search-close",
        );
        $pp.find("#ms-body").off("scroll.ms-gp scroll.ms-sp");
        $pp.find(".ms-gp-trigger").removeClass("open");
        return;
      }
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
  if (!_ballRestoring) {
    viewStack = [{ name: "list" }];
    searchQuery = "";
    filterState = {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      subGroupId: null,
      onlyCurrentChar: false,
    };
  }
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
  if (_ballRestoring) updateInjectIndicator();
  else renderView();
  autoCheckSubscriptions();
  showBirthdayBannerIfAny();
  setTimeout(checkAndShowChangelog, 800);
}
