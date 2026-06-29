// Wrapped by scripts/build-stage.mjs.
const STORAGE_KEY = "miniStage_data";
const PANEL_ID = "mini-stage-panel";
const STYLE_ID = "mini-stage-styles";
const SCRIPT_VERSION = "3.7.1";
const GROUP_COLORS = [
  "#D6A2A2",
  "#DDAA90",
  "#D1C28D",
  "#A1BC9D",
  "#91B9B5",
  "#9FB1CD",
  "#B0ABCC",
  "#BFA3C4",
  "#CE9EA8",
  "#C49696",
  "#C7A287",
  "#C4B981",
  "#b5b06b",
  "#7ca881",
  "#6b9ea0",
  "#748eb5",
  "#9280ab",
  "#b57e97",
  "#8b5b8c",
];
const TAG_COLORS = GROUP_COLORS;
var GUIDE_VERSION = "3.7.1";
var GUIDE_REMOTE_URLS = {
  guide:
    "https://gist.githubusercontent.com/Sanjs333/c45460dc2bb5908ff53b5769088b122d/raw/guide.md",
  injectGuide:
    "https://gist.githubusercontent.com/Sanjs333/125678ce0a45cefa9ef9375de91b94f9/raw/inject_guide.md",
  charBindGuide:
    "https://gist.githubusercontent.com/Sanjs333/86d55e9d3204264a80f00a457ef66afe/raw/char_bind_guide.md",
  subscriptionGuide:
    "https://gist.githubusercontent.com/Sanjs333/988b497648a823685eaf5ad37d0ad4eb/raw/subscription_guide.md",
  preview:
    "https://gist.githubusercontent.com/Sanjs333/697860e53603f718b051b4f06e30171b/raw/preview.md",
  changelog:
    "https://gist.githubusercontent.com/Sanjs333/03421197514de4c5295608d9beab3496/raw/changelog.md",
};
var BUILTIN_GUIDE_CONTENT =
  "# 小剧场 使用说明\n\n正在从云端加载完整使用说明...\n\n如果长时间未加载，请检查网络或手动前往设置页「重新生成使用说明」。";
var BUILTIN_INJECT_GUIDE_CONTENT =
  "# 小剧场 · 注入功能指南\n\n正在从云端加载完整注入指南...\n\n如果长时间未加载，请检查网络。";
var BUILTIN_CHAR_BIND_GUIDE_CONTENT =
  "# 小剧场 · 角色绑定与 IP 分组指南\n\n正在从云端加载完整指南...\n\n如果长时间未加载，请检查网络。";
var BUILTIN_PREVIEW_CONTENT = "# 预览格式示例\n\n正在从云端加载示例内容...";
var BUILTIN_SUBSCRIPTION_GUIDE_CONTENT =
  "# 小剧场 · 订阅功能指南\n\n正在从云端加载完整指南...\n\n如果长时间未加载，请检查网络。";

let data = {
  groups: [],
  prompts: [],
  settings: {
    collapsed: false,
    panelPos: null,
    sortMode: "created-desc",
    defaultAuthor: "",
    definedTags: [],
  },
  quickPhrases: [],
  subscriptions: [],
};
let viewStack = [{ name: "list" }];
let searchQuery = "";
let filterState = {
  includeTags: [],
  excludeTags: [],
  tagSelectMode: "include",
  groupId: null,
  onlyCurrentChar: false,
};
let panelVisible = false;
var _searchTimer = null;
let selectMode = false;
let selectedIds = new Set();
let shiftKeyActive = false;
let shiftAnchor = -1;
let rangeSelectMode = false;
let rangeSelectAnchor = null;
let rangeSelectAnchorPids = [];
let groupSelectMode = false,
  selectedGroupIds = new Set();
let tagSelectMode = false,
  selectedTagIds = new Set();
let editDirty = false;
let editSnapshot = "";
let groupEditDirty = false;
let flushGroupEdit = null;
let activeDropdownCleanup = null;
let longPressTimer = null;
let _editDraftTimer = null;
let longPressTriggered = false;
let escKeyHandler = null;
let _injectIndicatorIdx = 0;
let _currentStagePrompts = [];
let _skipAllInjectForNextGeneration = false;
let _macroInjectBusy = false;
let _macroBusyWarned = false;
let _imgPreloaded = new Set();
let _inputAppendList = [];
let _msShuttingDown = false;
let _msActiveFetchControllers = new Set();

function isShutdownFetchError(e) {
  var msg = e && e.message ? String(e.message) : "";
  return (
    _msShuttingDown ||
    (e && e.name === "AbortError") ||
    msg.indexOf("global scope is shutting down") >= 0
  );
}

function abortActiveFetches() {
  _msShuttingDown = true;
  _msActiveFetchControllers.forEach(function (ctrl) {
    try {
      ctrl.abort();
    } catch (e) {}
  });
  _msActiveFetchControllers.clear();
}

async function msFetch(url, options, timeoutMs) {
  var ctrl = new AbortController();
  var timer = null;
  var opts = Object.assign({}, options || {});
  var parentSignal = opts.signal;
  var onParentAbort = function () {
    ctrl.abort();
  };
  if (parentSignal) {
    if (parentSignal.aborted) ctrl.abort();
    else parentSignal.addEventListener("abort", onParentAbort, { once: true });
  }
  opts.signal = ctrl.signal;
  _msActiveFetchControllers.add(ctrl);
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(function () {
      ctrl.abort();
    }, timeoutMs);
  }
  try {
    return await fetch(url, opts);
  } finally {
    if (timer) clearTimeout(timer);
    if (parentSignal) {
      try {
        parentSignal.removeEventListener("abort", onParentAbort);
      } catch (e) {}
    }
    _msActiveFetchControllers.delete(ctrl);
  }
}

function preloadPanelImages() {
  try {
    if (_imgPreloaded.size > 200) {
      var keys = Array.from(_imgPreloaded);
      for (var pi = 0; pi < 100; pi++) _imgPreloaded.delete(keys[pi]);
    }
    var keysToPreload = new Set();
    data.groups.forEach(function (g) {
      if (g.iconUrl && !_imgPreloaded.has(g.iconUrl)) {
        _imgPreloaded.add(g.iconUrl);
        var img = new Image();
        img.src = g.iconUrl;
      }
      if (g.iconMode === "char" && g.iconCharKey) {
        keysToPreload.add(g.iconCharKey);
      }
      if (
        (!g.iconMode || g.iconMode === "group") &&
        Array.isArray(g.charKeys)
      ) {
        g.charKeys.slice(0, 4).forEach(function (k) {
          keysToPreload.add(k);
        });
      }
    });
    var curKey = getCurrentCharKeySafe();
    if (curKey) keysToPreload.add(curKey);
    var pathsToLoad = [];
    keysToPreload.forEach(function (k) {
      if (!k || !isLocalCharKey(k)) return;
      var path = getCharAvatarPathSafe(k);
      if (path && !_imgPreloaded.has(path)) {
        _imgPreloaded.add(path);
        pathsToLoad.push(path);
      }
    });
    var idx = 0;
    function loadNextBatch() {
      if (idx >= pathsToLoad.length) return;
      var batch = pathsToLoad.slice(idx, idx + 3);
      idx += 3;
      batch.forEach(function (p) {
        var img = new Image();
        img.src = p;
      });
      if (idx < pathsToLoad.length) {
        setTimeout(loadNextBatch, 200);
      }
    }
    if (window.requestIdleCallback) {
      requestIdleCallback(loadNextBatch);
    } else {
      setTimeout(loadNextBatch, 100);
    }
  } catch (e) {}
}

function esc(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(s));
  return d.innerHTML;
}
function escAttr(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escAlreadyEscapedAttr(s) {
  if (!s) return "";
  return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeMdUrl(url, isImage) {
  var raw = String(url || "")
    .trim()
    .replace(/&amp;/g, "&");
  var compact = raw.replace(/[\u0000-\u001f\u007f\s]+/g, "").toLowerCase();
  if (!compact) return "";
  if (/^(javascript|vbscript):/.test(compact)) return "";
  if (/^data:/i.test(compact)) {
    if (
      isImage &&
      /^data:image\/(?:png|gif|jpe?g|webp|bmp);base64,/i.test(compact)
    ) {
      return raw;
    }
    return "";
  }
  return raw;
}
function chk(id, a, label) {
  return (
    '<label class="ms-check-item"><input type="checkbox" id="' +
    id +
    '"' +
    (a ? " " + a : "") +
    "> " +
    label +
    "</label>"
  );
}
function truncate(s, n) {
  return !s ? "" : s.length > n ? s.substring(0, n) + "..." : s;
}
function getContextSnippet(text, query, maxLen) {
  if (!text || !query) return truncate(text, maxLen);
  var lowerText = text.toLowerCase();
  var lowerQuery = query.toLowerCase();
  var idx = lowerText.indexOf(lowerQuery);
  if (idx < 0) return truncate(text, maxLen);
  var padding = Math.floor((maxLen - query.length) / 2);
  var start = Math.max(0, idx - padding);
  var end = Math.min(text.length, start + maxLen);
  if (end - start < maxLen) start = Math.max(0, end - maxLen);
  var snippet = text.substring(start, end);
  var prefix = start > 0 ? "..." : "";
  var suffix = end < text.length ? "..." : "";
  return prefix + snippet + suffix;
}
function recordRecentBoundChar(charKey) {
  if (!charKey) return;
  if (!Array.isArray(data.settings.recentBoundChars))
    data.settings.recentBoundChars = [];
  var arr = data.settings.recentBoundChars;
  var idx = arr.indexOf(charKey);
  if (idx >= 0) arr.splice(idx, 1);
  arr.unshift(charKey);
  if (arr.length > 3) arr.length = 3;
  saveData();
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
function toast(type, msg, duration) {
  if (typeof toastr !== "undefined" && toastr[type]) {
    var defaultDuration = {
      success: 800,
      info: 1500,
      warning: 1500,
      error: 1500,
    };
    var finalDuration =
      duration !== undefined ? duration : defaultDuration[type] || 3000;
    toastr[type](msg, "小剧场", { timeOut: finalDuration });
  } else console.log("[小剧场]", type, msg);
}

function showModal(opts) {
  return new Promise(function (resolve) {
    var $p = $("#" + PANEL_ID);
    if (!$p.length) {
      resolve(opts.cancelValue !== undefined ? opts.cancelValue : null);
      return;
    }
    var didExpandForModal = false;
    var savedPosForModal = null;
    if (
      $p.hasClass("ms-collapsed") &&
      !$p.hasClass("ms-modal-expand-mode") &&
      !$p.hasClass("ms-bd-editor-mode") &&
      !$p.hasClass("ms-focus-mode")
    ) {
      savedPosForModal = {
        left: $p[0].style.getPropertyValue("left"),
        top: $p[0].style.getPropertyValue("top"),
        transform: $p[0].style.getPropertyValue("transform"),
      };
      $p[0].style.removeProperty("left");
      $p[0].style.removeProperty("top");
      $p[0].style.removeProperty("transform");
      $p.addClass("ms-modal-expand-mode");
      didExpandForModal = true;
    }
    var iconMap = {
      info: "fa-circle-info",
      warning: "fa-triangle-exclamation",
      danger: "fa-circle-exclamation",
      success: "fa-circle-check",
      question: "fa-circle-question",
    };
    var iconType = opts.iconType || "info";
    var iconClass = opts.icon || iconMap[iconType];
    var headerHtml = "";
    if (opts.title || iconClass) {
      headerHtml = '<div class="ms-modal-header">';
      if (iconClass)
        headerHtml +=
          '<div class="ms-modal-icon ' +
          iconType +
          '"><i class="fa-solid ' +
          iconClass +
          '"></i></div>';
      if (opts.title)
        headerHtml +=
          '<div class="ms-modal-title">' + esc(opts.title) + "</div>";
      headerHtml += "</div>";
    }
    var bodyHtml =
      '<div class="ms-modal-body">' +
      (typeof opts.body === "function" ? "" : opts.body || "") +
      "</div>";
    var buttons = opts.buttons || [];
    var footerHtml = buttons.length ? '<div class="ms-modal-footer">' : "";
    buttons.forEach(function (btn, i) {
      footerHtml +=
        '<button class="ms-modal-btn ' +
        (btn.cls || "") +
        '" data-modal-btn="' +
        i +
        '">' +
        esc(btn.text) +
        "</button>";
    });
    if (buttons.length) footerHtml += "</div>";
    var html =
      '<div class="ms-modal-overlay"><div class="ms-modal" style="' +
      (opts.modalStyle || "") +
      '">' +
      headerHtml +
      bodyHtml +
      footerHtml +
      "</div></div>";
    $p.append(html);
    var $overlay = $p.find(".ms-modal-overlay").last();
    if (typeof opts.body === "function") {
      $overlay.find(".ms-modal-body").html(opts.body($overlay));
    }
    requestAnimationFrame(function () {
      $overlay.addClass("visible");
    });
    var closed = false;
    function close(result) {
      if (closed) return;
      closed = true;
      $overlay.removeClass("visible");
      document.removeEventListener("keydown", keyHandler, true);
      setTimeout(function () {
        $overlay.remove();
        if (didExpandForModal) {
          $p.removeClass("ms-modal-expand-mode");
          if (savedPosForModal) {
            if (savedPosForModal.left)
              $p[0].style.setProperty(
                "left",
                savedPosForModal.left,
                "important",
              );
            if (savedPosForModal.top)
              $p[0].style.setProperty("top", savedPosForModal.top, "important");
            if (savedPosForModal.transform)
              $p[0].style.setProperty(
                "transform",
                savedPosForModal.transform,
                "important",
              );
          }
        }
        resolve(result);
      }, 180);
    }
    $overlay.on("click", function (e) {
      if (e.target === this && opts.closeOnOverlay !== false) {
        close(opts.cancelValue !== undefined ? opts.cancelValue : null);
      }
    });
    $overlay.on("click", "[data-modal-btn]", function (e) {
      e.stopPropagation();
      var idx = parseInt($(this).data("modal-btn"));
      var btn = buttons[idx];
      if (!btn) {
        close(null);
        return;
      }
      if (typeof btn.action === "function") {
        var r = btn.action($overlay);
        if (r === false) return;
        if (r && typeof r.then === "function") {
          r.then(function (v) {
            if (v === false) return;
            close(v === undefined ? btn.value : v);
          });
          return;
        }
        if (r !== undefined && r !== true) {
          close(r);
          return;
        }
      }
      close(btn.value !== undefined ? btn.value : true);
    });
    var keyHandler = function (e) {
      if (closed) return;
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        close(opts.cancelValue !== undefined ? opts.cancelValue : null);
      } else if (e.key === "Enter" && opts.submitOnEnter !== false) {
        if (e.target && e.target.tagName === "TEXTAREA") return;
        var primaryIdx = buttons.findIndex(function (b) {
          return b.primary;
        });
        if (primaryIdx >= 0) {
          e.preventDefault();
          $overlay.find('[data-modal-btn="' + primaryIdx + '"]').click();
        }
      }
    };
    document.addEventListener("keydown", keyHandler, true);
    if (typeof opts.onShow === "function") {
      setTimeout(function () {
        opts.onShow($overlay, close);
      }, 30);
    }
  });
}

function msAlert(message, options) {
  options = options || {};
  return showModal({
    title: options.title || "提示",
    iconType: options.type || "info",
    body: '<div class="ms-modal-message">' + esc(message) + "</div>",
    buttons: [
      {
        text: options.okText || "好的",
        cls: "primary",
        primary: true,
        value: true,
      },
    ],
  });
}

function msConfirm(message, options) {
  options = options || {};
  var iconType = options.type || (options.dangerous ? "warning" : "question");
  return showModal({
    title: options.title || "确认",
    iconType: iconType,
    body: '<div class="ms-modal-message">' + esc(message) + "</div>",
    buttons: [
      { text: options.cancelText || "取消", value: false },
      {
        text: options.okText || "确定",
        cls: options.dangerous ? "danger" : "primary",
        primary: true,
        value: true,
      },
    ],
    cancelValue: false,
  });
}

function msPrompt(message, options) {
  options = options || {};
  var inputId = "ms-modal-input-" + Math.random().toString(36).slice(2);
  var inputHtml = options.multiline
    ? '<textarea class="ms-modal-textarea" id="' +
      inputId +
      '" placeholder="' +
      esc(options.placeholder || "") +
      '">' +
      esc(options.defaultValue || "") +
      "</textarea>"
    : '<input class="ms-modal-input" id="' +
      inputId +
      '" type="text" placeholder="' +
      esc(options.placeholder || "") +
      '" value="' +
      esc(options.defaultValue || "") +
      '">';
  return showModal({
    title: options.title || "请输入",
    iconType: "info",
    icon: options.icon || "fa-pen",
    body:
      (message
        ? '<div class="ms-modal-message">' + esc(message) + "</div>"
        : "") + inputHtml,
    buttons: [
      { text: options.cancelText || "取消", value: null },
      {
        text: options.okText || "确定",
        cls: "primary",
        primary: true,
        action: function ($overlay) {
          var val = $overlay.find("#" + inputId).val();
          if (options.validate) {
            var err = options.validate(val);
            if (err) {
              toast("warning", err);
              return false;
            }
          }
          return val;
        },
      },
    ],
    cancelValue: null,
    submitOnEnter: !options.multiline,
    onShow: function ($overlay) {
      var $input = $overlay.find("#" + inputId);
      $input.focus();
      if (!options.multiline && $input[0]) $input[0].select();
    },
  });
}

function showFullscreenEditor(opts) {
  var $p = $("#" + PANEL_ID);
  var $sourceTa = $p.find(opts.targetSelector);
  if (!$sourceTa.length) {
    toast("error", "找不到要全屏编辑的内容");
    return;
  }
  if ($p.find(".ms-fs-editor-overlay").length) return;
  var originalValue = $sourceTa.val() || "";
  var taId = "ms-fs-textarea-" + Math.random().toString(36).slice(2);
  var el = $p[0];
  $p.data("ms-fs-saved-pos", {
    left: el.style.getPropertyValue("left"),
    top: el.style.getPropertyValue("top"),
    transform: el.style.getPropertyValue("transform"),
    width: el.style.getPropertyValue("width"),
    maxWidth: el.style.getPropertyValue("max-width"),
    height: el.style.getPropertyValue("height"),
    maxHeight: el.style.getPropertyValue("max-height"),
    zoom: el.style.getPropertyValue("zoom"),
    panelPos: data.settings.panelPos
      ? Object.assign({}, data.settings.panelPos)
      : null,
    wasCollapsed: $p.hasClass("ms-collapsed"),
  });
  el.style.removeProperty("left");
  el.style.removeProperty("top");
  el.style.removeProperty("transform");
  el.style.removeProperty("width");
  el.style.removeProperty("max-width");
  el.style.removeProperty("height");
  el.style.removeProperty("max-height");
  el.style.removeProperty("zoom");
  $p.removeClass("ms-collapsed");
  $p.addClass("ms-fs-editor-mode");
  var stats = countStats(originalValue);
  var overlayHtml =
    '<div class="ms-fs-editor-overlay">' +
    '<div class="ms-fs-header-bar">' +
    '<i class="fa-solid fa-up-right-and-down-left-from-center" style="color:var(--ms-accent);font-size:13px;"></i>' +
    '<span class="ms-fs-title-text">' +
    esc(opts.title || "全屏编辑") +
    "</span>" +
    '<button class="ms-tbtn" id="ms-fs-cancel">取消</button>' +
    '<button class="ms-tbtn" id="ms-fs-save" style="color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-floppy-disk" style="margin-right:3px;"></i>保存</button>' +
    "</div>" +
    '<div class="ms-fs-content-wrap">' +
    '<textarea class="ms-fs-textarea" id="' +
    taId +
    '">' +
    esc(originalValue) +
    "</textarea>" +
    "</div>" +
    '<div class="ms-fs-footer-bar">' +
    '<div class="ms-char-count">' +
    stats.chars +
    " 字 · " +
    stats.lines +
    " 行</div>" +
    "</div>" +
    "</div>";
  $p.append(overlayHtml);
  var $overlay = $p.find(".ms-fs-editor-overlay");
  var $ta = $overlay.find("#" + taId);
  var ta = $ta[0];
  ta.focus();
  ta.setSelectionRange(originalValue.length, originalValue.length);
  function updateCount() {
    var s = countStats(ta.value);
    $overlay.find(".ms-char-count").text(s.chars + " 字 · " + s.lines + " 行");
  }
  function closeOverlay() {
    var saved = $p.data("ms-fs-saved-pos");
    $overlay.remove();
    $p.removeClass("ms-fs-editor-mode");
    $p[0].removeAttribute("data-ms-kb");
    $p[0].style.removeProperty("border-radius");
    if (saved) {
      var elem = $p[0];
      var keys = [
        ["left", "left"],
        ["top", "top"],
        ["transform", "transform"],
        ["width", "width"],
        ["maxWidth", "max-width"],
        ["height", "height"],
        ["maxHeight", "max-height"],
        ["zoom", "zoom"],
      ];
      keys.forEach(function (pair) {
        var jsKey = pair[0],
          cssKey = pair[1];
        if (saved[jsKey])
          elem.style.setProperty(cssKey, saved[jsKey], "important");
        else elem.style.removeProperty(cssKey);
      });
      data.settings.panelPos = saved.panelPos || null;
      if (saved.wasCollapsed) $p.addClass("ms-collapsed");
    }
    $p.removeData("ms-fs-saved-pos");
    applyUICustomization();
  }
  $overlay.on("click", "#ms-fs-cancel", function () {
    closeOverlay();
  });
  $overlay.on("click", "#ms-fs-save", function () {
    $sourceTa.val(ta.value).trigger("input").trigger("change");
    closeOverlay();
  });
  $ta.on("input", updateCount);
  $ta.on("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      $overlay.find("#ms-fs-save").trigger("click");
    } else if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor(this, "  ");
      updateCount();
    }
  });
  if (setupKeyboardAdapt.refresh) setTimeout(setupKeyboardAdapt.refresh, 80);
}

function showInsertDialog(opts) {
  var scopeItems = opts.scopeItems || [];
  var otherItems = scopeItems.filter(function (it) {
    return !it.isSelected;
  });
  var selCnt = scopeItems.length - otherItems.length;
  var maxPos = otherItems.length + 1;
  var inputId = "ms-insert-pos-" + Math.random().toString(36).slice(2);
  var previewId = "ms-insert-preview-" + Math.random().toString(36).slice(2);
  var expandedSet = new Set();
  function buildPreview(pos) {
    function buildAvatarOrIcon(charKey, iconClass, sizePx) {
      sizePx = sizePx || 16;
      if (charKey) {
        var ap = getCharAvatarPathSafe(charKey);
        return ap
          ? '<img src="' +
              esc(ap) +
              '" style="width:' +
              sizePx +
              "px;height:" +
              sizePx +
              'px;border-radius:3px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:' +
              (sizePx - 5) +
              "px;flex-shrink:0;width:" +
              sizePx +
              'px;text-align:center;"></i>';
      }
      if (iconClass) {
        return (
          '<i class="fa-solid ' +
          iconClass +
          '" style="color:var(--ms-accent);opacity:0.7;font-size:11px;flex-shrink:0;"></i>'
        );
      }
      return "";
    }
    function buildTagsRow(tags, smaller) {
      if (!Array.isArray(tags) || tags.length === 0) return "";
      var th = "";
      sortTagIds(tags)
        .slice(0, 4)
        .forEach(function (tid) {
          var t = getTag(tid);
          if (t)
            th +=
              '<span class="ms-tag-chip ms-tag-chip-sm" style="background:' +
              t.color +
              ";margin-right:3px;font-size:" +
              (smaller ? "8px" : "9px") +
              ';">' +
              esc(t.name) +
              "</span>";
        });
      return th
        ? '<div style="margin-top:3px;line-height:1.4;">' + th + "</div>"
        : "";
    }
    var html = "";
    for (var i = 0; i <= otherItems.length; i++) {
      if (i === pos) {
        html +=
          '<div class="ms-insert-marker" style="padding:6px 10px;margin:3px 0;background:rgba(var(--ms-accent-rgb),0.20);border:2px solid var(--ms-accent);border-radius:6px;font-size:12px;color:var(--ms-accent);font-weight:600;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-arrow-right-to-bracket"></i><span>插入此处：' +
          selCnt +
          " 条已选内容</span></div>";
      }
      if (i < otherItems.length) {
        var item = otherItems[i];
        var isSeries =
          item.type === "series" &&
          Array.isArray(item.children) &&
          item.children.length > 0;
        var iconHtml = buildAvatarOrIcon(item.charKey, item.iconClass, 30); // 主项头像大小，可调
        var descH = item.desc
          ? '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4;margin-top:1px;">' +
            esc(item.desc) +
            "</div>"
          : "";
        var tagsH = buildTagsRow(item.tags);
        var expandH = isSeries
          ? '<i class="fa-solid fa-angle-' +
            (expandedSet.has(i) ? "down" : "right") +
            '" data-toggle-i="' +
            i +
            '" style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;width:12px;text-align:center;cursor:pointer;padding:2px;"></i>'
          : "";
        html +=
          '<div class="ms-insert-item" data-i="' +
          i +
          '" title="点击：插入到此条目下面" style="padding:4px 5px;margin:2px 0;background:rgba(255,255,255,0.03);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:5px;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);display:flex;align-items:center;gap:4px;overflow:hidden;cursor:pointer;transition:background 0.12s,border-color 0.12s;">' +
          '<span style="color:var(--SmartThemeQuoteColor,#666);font-size:10px;flex-shrink:0;width:18px;text-align:center;">' +
          (i + 1) +
          ".</span>" +
          expandH +
          iconHtml +
          '<div style="flex:1;min-width:0;overflow:hidden;margin-left:8px;">' + // margin-left 控制头像和文字之间的间距，可调
          '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          esc(item.name) +
          "</div>" +
          descH +
          tagsH +
          "</div>" +
          "</div>";
        if (isSeries && expandedSet.has(i)) {
          item.children.forEach(function (child) {
            var childIcon = buildAvatarOrIcon(child.charKey, null, 22); // 系列子项头像大小，可调
            var childDescH = child.desc
              ? '<div style="font-size:9px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;margin-top:1px;">' +
                esc(child.desc) +
                "</div>"
              : "";
            var childTagsH = buildTagsRow(child.tags, true);
            html +=
              '<div style="padding:6px 8px;margin:1px 0 1px 16px;background:rgba(var(--ms-accent-rgb),0.04);border-left:2px solid rgba(var(--ms-accent-rgb),0.3);border-radius:0 4px 4px 0;font-size:11px;color:var(--SmartThemeBodyColor,#ccc);display:flex;align-items:center;gap:7px;cursor:default;">' +
              childIcon +
              '<div style="flex:1;min-width:0;overflow:hidden;margin-left:5px;">' + // margin-left 控制子项头像和文字之间的间距，可调
              '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              esc(child.name) +
              "</div>" +
              childDescH +
              childTagsH +
              "</div>" +
              "</div>";
          });
        }
      }
    }
    return html;
  }

  return showModal({
    title: opts.title || "插入到指定位置",
    iconType: "info",
    icon: "fa-arrow-right-to-bracket",
    modalStyle: "min-width:340px;max-width:92vw;width:440px;",
    body: function () {
      return (
        '<div style="margin-bottom:8px;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);">把选中的 <strong>' +
        selCnt +
        "</strong> 项插入到第几位？（1-" +
        maxPos +
        "）</div>" +
        '<input class="ms-modal-input" id="' +
        inputId +
        '" type="number" min="1" max="' +
        maxPos +
        '" value="1" style="margin-top:0;">' +
        '<div style="margin-top:10px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);"><i class="fa-solid fa-eye" style="margin-right:3px;"></i>预览：</div>' +
        '<div id="' +
        previewId +
        '" style="max-height:300px;overflow-y:auto;padding:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(0,0,0,0.15);margin-top:4px;">' +
        buildPreview(0) +
        "</div>"
      );
    },
    buttons: [
      { text: "取消", value: null },
      {
        text: "确定插入",
        cls: "primary",
        primary: true,
        action: function ($overlay) {
          var v = $overlay.find("#" + inputId).val();
          var n = parseInt(v);
          if (isNaN(n) || n < 1 || n > maxPos) {
            toast("warning", "请输入 1 到 " + maxPos + " 之间的数字");
            return false;
          }
          if (typeof opts.onConfirm === "function") {
            opts.onConfirm(n - 1);
          }
          return true;
        },
      },
    ],
    cancelValue: null,
    submitOnEnter: false,
    onShow: function ($overlay) {
      var $input = $overlay.find("#" + inputId);
      var $preview = $overlay.find("#" + previewId);
      $input.focus();
      if ($input[0]) $input[0].select();
      function update() {
        var v = parseInt($input.val());
        if (isNaN(v) || v < 1) v = 1;
        if (v > maxPos) v = maxPos;
        $preview.html(buildPreview(v - 1));
        var $marker = $preview.find(".ms-insert-marker");
        if ($marker.length) {
          var markerEl = $marker[0];
          var paneEl = $preview[0];
          var paneRect = paneEl.getBoundingClientRect();
          var markerRect = markerEl.getBoundingClientRect();
          var markerInPane = markerRect.top - paneRect.top + paneEl.scrollTop;
          var targetScroll =
            markerInPane - (paneEl.clientHeight - markerRect.height) / 2;
          var maxScroll = paneEl.scrollHeight - paneEl.clientHeight;
          paneEl.scrollTop = Math.max(0, Math.min(targetScroll, maxScroll));
        }
      }
      $input.on("input.msi", update);
      $preview.on("click.msi-toggle", "[data-toggle-i]", function (e) {
        e.stopPropagation();
        var idx = parseInt($(this).attr("data-toggle-i"));
        if (isNaN(idx)) return;
        if (expandedSet.has(idx)) expandedSet.delete(idx);
        else expandedSet.add(idx);
        update();
      });
      setTimeout(update, 50);
      $preview.on("click.msi", ".ms-insert-item", function () {
        var clickedIdx = parseInt($(this).attr("data-i"));
        if (isNaN(clickedIdx)) return;
        var newVal = clickedIdx + 2;
        if (newVal > maxPos) newVal = maxPos;
        $input.val(newVal);
        update();
      });
    },
  });
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}
function contentFingerprint(p) {
  return fastDualHash((p.title || "") + "||" + (p.content || ""));
}
function fastDualHash(str) {
  var h1 = 0,
    h2 = 0;
  var len = str.length;
  for (var i = 0; i < len; i++) {
    h1 = ((h1 << 5) - h1 + str.charCodeAt(i)) | 0;
  }
  for (var j = len - 1; j >= 0; j--) {
    h2 = ((h2 << 5) - h2 + str.charCodeAt(j)) | 0;
  }
  return h1.toString(36) + "_" + h2.toString(36) + "_" + len;
}
function computeLineDiff(oldText, newText) {
  var oldLines = (oldText || "").split("\n");
  var newLines = (newText || "").split("\n");
  var m = oldLines.length,
    n = newLines.length;
  if (m + n > 3000) {
    var result = [];
    var maxLen = Math.max(m, n);
    for (var i = 0; i < maxLen; i++) {
      if (i >= m) result.push({ type: "add", text: newLines[i] });
      else if (i >= n) result.push({ type: "del", text: oldLines[i] });
      else if (oldLines[i] === newLines[i])
        result.push({ type: "same", text: oldLines[i] });
      else {
        result.push({ type: "del", text: oldLines[i] });
        result.push({ type: "add", text: newLines[i] });
      }
    }
    return result;
  }
  var dp = [];
  for (var i2 = 0; i2 <= m; i2++) {
    dp[i2] = new Array(n + 1).fill(0);
  }
  for (var i3 = 1; i3 <= m; i3++) {
    for (var j = 1; j <= n; j++) {
      if (oldLines[i3 - 1] === newLines[j - 1])
        dp[i3][j] = dp[i3 - 1][j - 1] + 1;
      else dp[i3][j] = Math.max(dp[i3 - 1][j], dp[i3][j - 1]);
    }
  }
  var result2 = [];
  var ii = m,
    jj = n;
  while (ii > 0 || jj > 0) {
    if (ii > 0 && jj > 0 && oldLines[ii - 1] === newLines[jj - 1]) {
      result2.unshift({ type: "same", text: oldLines[ii - 1] });
      ii--;
      jj--;
    } else if (jj > 0 && (ii === 0 || dp[ii][jj - 1] >= dp[ii - 1][jj])) {
      result2.unshift({ type: "add", text: newLines[jj - 1] });
      jj--;
    } else {
      result2.unshift({ type: "del", text: oldLines[ii - 1] });
      ii--;
    }
  }
  return result2;
}
function formatTimestamp() {
  const d = new Date();
  return (
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}
function sanitizeFilename(s) {
  return (s || "untitled").replace(/[\\/:*?"<>|]/g, "_").substring(0, 60);
}
function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return (
    d.getFullYear() +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(d.getDate()).padStart(2, "0") +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

function copyToClipboard(text) {
  try {
    if (typeof builtin !== "undefined" && builtin.copyText) {
      builtin.copyText(text);
      return Promise.resolve();
    }
  } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    try {
      const prevActive = document.activeElement;
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (ex) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (prevActive && prevActive.focus) prevActive.focus();
      if (ok) resolve();
      else reject(new Error("execCommand copy failed"));
    } catch (e) {
      reject(e);
    }
  });
}

function getParentWindowSafe() {
  try {
    if (window.parent && window.parent !== window) return window.parent;
  } catch (e) {}
  return null;
}

function getThemeSelectDocs() {
  var docs = [];
  try {
    var parentWin = getParentWindowSafe();
    if (parentWin && parentWin.document) docs.push(parentWin.document);
  } catch (e) {}
  try {
    if (document && docs.indexOf(document) < 0) docs.push(document);
  } catch (e) {}
  return docs;
}

function getThemeSelectCandidates() {
  var selects = [];
  getThemeSelectDocs().forEach(function (doc) {
    try {
      var direct = doc.querySelector("#themes");
      if (direct && selects.indexOf(direct) < 0) selects.push(direct);
      var all = doc.querySelectorAll("select");
      for (var i = 0; i < all.length; i++) {
        var sel = all[i];
        var key = (
          (sel.id || "") +
          " " +
          (sel.name || "") +
          " " +
          (sel.className || "")
        ).toLowerCase();
        if (key.indexOf("theme") >= 0 && selects.indexOf(sel) < 0) {
          selects.push(sel);
        }
      }
    } catch (e) {}
  });
  return selects;
}

function getSillyTavernLikeObjects() {
  var list = [];
  function add(obj) {
    if (obj && list.indexOf(obj) < 0) list.push(obj);
  }
  try {
    if (typeof SillyTavern !== "undefined") add(SillyTavern);
  } catch (e) {}
  try {
    add(window.SillyTavern);
  } catch (e) {}
  try {
    var parentWin = getParentWindowSafe();
    if (parentWin) add(parentWin.SillyTavern);
  } catch (e) {}
  return list;
}

function getPowerUserSettingsCandidates() {
  var list = [];
  function add(obj) {
    if (obj && typeof obj === "object" && list.indexOf(obj) < 0) list.push(obj);
  }
  getSillyTavernLikeObjects().forEach(function (st) {
    try {
      add(st.powerUserSettings);
    } catch (e) {}
    try {
      if (typeof st.getContext === "function") {
        var ctx = st.getContext();
        if (ctx) {
          add(ctx.powerUserSettings);
          add(ctx.powerUser);
        }
      }
    } catch (e) {}
  });
  try {
    add(window.power_user);
  } catch (e) {}
  try {
    var parentWin = getParentWindowSafe();
    if (parentWin) add(parentWin.power_user);
  } catch (e) {}
  return list;
}

function addThemeName(out, seen, value) {
  var name = "";
  if (typeof value === "string") {
    name = value;
  } else if (value && typeof value === "object") {
    name =
      value.name ||
      value.value ||
      value.label ||
      value.title ||
      value.theme ||
      "";
  }
  name = String(name || "").trim();
  if (!name || seen[name]) return;
  seen[name] = true;
  out.push(name);
}

function normalizeThemeName(value) {
  var names = [];
  addThemeName(names, {}, value);
  return names[0] || "";
}

function addThemeNamesFromCollection(out, seen, collection) {
  if (!collection) return;
  if (Array.isArray(collection)) {
    collection.forEach(function (item) {
      addThemeName(out, seen, item);
    });
  } else if (typeof collection === "object") {
    Object.keys(collection).forEach(function (key) {
      var item = collection[key];
      if (item && typeof item === "object") {
        var before = out.length;
        addThemeName(out, seen, item);
        if (out.length === before) addThemeName(out, seen, key);
      } else {
        addThemeName(out, seen, key);
      }
    });
  }
}

function getSelectedThemeNameFromDom() {
  var selects = getThemeSelectCandidates();
  for (var i = 0; i < selects.length; i++) {
    var sel = selects[i];
    try {
      var opt = sel.options && sel.options[sel.selectedIndex];
      var name = (opt && (opt.value || opt.textContent)) || sel.value || "";
      name = String(name || "").trim();
      if (name) return name;
    } catch (e) {}
  }
  return "";
}

function getCurrentThemeName() {
  var settings = getPowerUserSettingsCandidates();
  var fields = ["theme", "themeName", "currentTheme", "selectedTheme"];
  for (var i = 0; i < settings.length; i++) {
    var s = settings[i];
    for (var j = 0; j < fields.length; j++) {
      var name = "";
      try {
        name = normalizeThemeName(s[fields[j]]);
      } catch (e) {}
      if (name) return name;
    }
  }
  return getSelectedThemeNameFromDom();
}

function getAllThemeNames() {
  var names = [];
  var seen = {};
  getThemeSelectCandidates().forEach(function (sel) {
    try {
      var opts = sel.options || [];
      for (var i = 0; i < opts.length; i++) {
        addThemeName(names, seen, opts[i].value || opts[i].textContent);
      }
    } catch (e) {}
  });
  getPowerUserSettingsCandidates().forEach(function (s) {
    try {
      addThemeNamesFromCollection(names, seen, s.themes);
      addThemeNamesFromCollection(names, seen, s.themeList);
      addThemeNamesFromCollection(names, seen, s.themeNames);
      addThemeNamesFromCollection(names, seen, s.availableThemes);
    } catch (e) {}
  });
  getSillyTavernLikeObjects().forEach(function (st) {
    try {
      addThemeNamesFromCollection(names, seen, st.themes);
    } catch (e) {}
  });
  try {
    var parentWin = getParentWindowSafe();
    if (parentWin) addThemeNamesFromCollection(names, seen, parentWin.themes);
  } catch (e) {}
  addThemeName(names, seen, getCurrentThemeName());
  if (data.settings && data.settings.themeBindings) {
    Object.keys(data.settings.themeBindings).forEach(function (name) {
      addThemeName(names, seen, name);
    });
  }
  return names;
}

function cssUrl(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function applyThemeBindingBg($p, binding) {
  if (binding.bgMode === "image" && binding.bgImage) {
    var bgImg = 'url("' + cssUrl(binding.bgImage) + '")';
    $p.css({
      "background-image": bgImg,
      "background-size": "cover",
      "background-position": "center",
      "background-repeat": "no-repeat",
      "background-attachment": "fixed",
    });
    $p[0].style.removeProperty("background-color");
    $p[0].style.setProperty("--ms-panel-bg-image", bgImg);
    $p[0].style.setProperty("--ms-panel-bg-size", "cover");
    $p[0].style.setProperty("--ms-panel-bg-position", "center");
    $p[0].style.setProperty("--ms-panel-bg-repeat", "no-repeat");
    $p[0].style.setProperty("--ms-panel-bg-attachment", "fixed");
    $p[0].style.setProperty(
      "--ms-popup-bg",
      "var(--SmartThemeBlurTintColor,#2a2a3a)",
    );
  } else if (binding.bgMode === "color") {
    var c = binding.bgColor || "#1a1a2e";
    $p.css({
      "background-image": "none",
      "background-size": "",
      "background-position": "",
      "background-repeat": "",
      "background-attachment": "",
    });
    $p[0].style.setProperty("background-color", c, "important");
    $p[0].style.setProperty("--ms-popup-bg", c);
    $p[0].style.setProperty("--ms-panel-bg-image", "none");
    $p[0].style.removeProperty("--ms-panel-bg-size");
    $p[0].style.removeProperty("--ms-panel-bg-position");
    $p[0].style.removeProperty("--ms-panel-bg-repeat");
    $p[0].style.removeProperty("--ms-panel-bg-attachment");
  }
}

function syncThemeBackground() {
  const $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  var _tbName = getCurrentThemeName();
  var _tb =
    _tbName && data.settings.themeBindings
      ? data.settings.themeBindings[_tbName]
      : null;
  if (_tb && _tb.textColor) {
    $p[0].style.setProperty("--SmartThemeBodyColor", _tb.textColor);
  } else {
    $p[0].style.removeProperty("--SmartThemeBodyColor");
  }
  if (_tb && (_tb.bgMode === "image" || _tb.bgMode === "color")) {
    applyThemeBindingBg($p, _tb);
    return;
  }
  try {
    let parentDoc = null;
    let parentWin = null;
    try {
      if (window.parent && window.parent.document) {
        parentDoc = window.parent.document;
        parentWin = window.parent;
      }
    } catch (e) {}
    const doc = parentDoc || document;
    const win = parentWin || window;

    const samples = doc.querySelectorAll(".drawer-content");
    let bgImg = "",
      bgSize = "",
      bgPos = "",
      bgRepeat = "",
      bgAttach = "";
    for (const el of samples) {
      const cs = win.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        bgImg = cs.backgroundImage;
        bgSize = cs.backgroundSize || "cover";
        bgPos = cs.backgroundPosition || "center";
        bgRepeat = cs.backgroundRepeat || "no-repeat";
        bgAttach = cs.backgroundAttachment || "fixed";
        break;
      }
    }
    if (bgImg) {
      $p.css({
        "background-image": bgImg,
        "background-size": bgSize,
        "background-position": bgPos,
        "background-repeat": bgRepeat,
        "background-attachment": bgAttach,
      });
      $p[0].style.setProperty("--ms-panel-bg-image", bgImg);
      $p[0].style.setProperty("--ms-panel-bg-size", bgSize || "cover");
      $p[0].style.setProperty("--ms-panel-bg-position", bgPos || "center");
      $p[0].style.setProperty("--ms-panel-bg-repeat", bgRepeat || "no-repeat");
      $p[0].style.setProperty("--ms-panel-bg-attachment", bgAttach || "fixed");
    } else {
      $p.css({
        "background-image": "none",
        "background-size": "",
        "background-position": "",
        "background-repeat": "",
        "background-attachment": "",
      });
      $p[0].style.setProperty("--ms-panel-bg-image", "none");
      $p[0].style.removeProperty("--ms-panel-bg-size");
      $p[0].style.removeProperty("--ms-panel-bg-position");
      $p[0].style.removeProperty("--ms-panel-bg-repeat");
      $p[0].style.removeProperty("--ms-panel-bg-attachment");
    }

    let rawColor = "";
    if (parentDoc) {
      const pcs = win.getComputedStyle(parentDoc.documentElement);
      rawColor = pcs.getPropertyValue("--SmartThemeBlurTintColor").trim();
    }
    if (rawColor) {
      const d = document.createElement("div");
      d.style.color = rawColor;
      d.style.display = "none";
      document.body.appendChild(d);
      const parsed = getComputedStyle(d).color;
      document.body.removeChild(d);
      const m = parsed.match(
        /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
      );
      if (m) {
        const r = m[1],
          g = m[2],
          b = m[3],
          a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        const minAlpha = 0.75;
        if (a < minAlpha) {
          $p.css(
            "background-color",
            "rgba(" + r + "," + g + "," + b + "," + minAlpha + ")",
          );
        } else {
          $p[0].style.removeProperty("background-color");
        }
        $p[0].style.setProperty(
          "--ms-popup-bg",
          "rgba(" + r + "," + g + "," + b + ",0.95)",
        );
      } else {
        $p[0].style.removeProperty("--ms-popup-bg");
      }
    } else {
      $p[0].style.removeProperty("background-color");
      $p[0].style.removeProperty("--ms-popup-bg");
    }
  } catch (e) {}
}

function updateAccentColor() {
  const $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  let raw = "";
  try {
    if (window.parent && window.parent.document) {
      const pcs = getComputedStyle(window.parent.document.documentElement);
      raw =
        pcs.getPropertyValue("--SmartThemeFavColor").trim() ||
        pcs.getPropertyValue("--SmartThemeEmColor").trim();
    }
  } catch (e) {}
  if (!raw) {
    const cs = getComputedStyle(document.documentElement);
    raw =
      cs.getPropertyValue("--SmartThemeFavColor").trim() ||
      cs.getPropertyValue("--SmartThemeEmColor").trim() ||
      "#c9957a";
  }
  $p[0].style.setProperty("--ms-accent", raw);
  const d = document.createElement("div");
  d.style.color = raw;
  d.style.display = "none";
  document.body.appendChild(d);
  const parsed = getComputedStyle(d).color;
  document.body.removeChild(d);
  const m = parsed.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    $p[0].style.setProperty("--ms-accent-rgb", m[1] + "," + m[2] + "," + m[3]);
  }
}

function applyUICustomization() {
  var $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  var el = $p[0];

  var isFullMode =
    $p.hasClass("ms-focus-mode") ||
    $p.hasClass("ms-bd-editor-mode") ||
    $p.hasClass("ms-modal-expand-mode") ||
    $p.hasClass("ms-fs-editor-mode");

  if (isFullMode) {
    el.style.setProperty("zoom", "1", "important");
    el.style.removeProperty("width");
    el.style.removeProperty("max-width");
    el.style.removeProperty("height");
    el.style.removeProperty("max-height");
    return;
  }

  if (data.settings.uiCustomEnabled) {
    var _zoomScale = data.settings.uiFontSize / 14;
    el.style.setProperty("zoom", String(_zoomScale));
    el.style.setProperty(
      "width",
      data.settings.uiPanelWidth + "px",
      "important",
    );
    el.style.setProperty("max-width", "96vw", "important");
    el.style.setProperty(
      "max-height",
      data.settings.uiPanelHeight + "vh",
      "important",
    );
  } else {
    el.style.removeProperty("zoom");
    if (!$p.hasClass("ms-focus-mode") && !$p.hasClass("ms-bd-editor-mode")) {
      el.style.removeProperty("width");
      el.style.removeProperty("max-width");
      el.style.removeProperty("max-height");
    }
  }
}

function getThemeInputCandidates(doc) {
  var selectors = [
    ".drawer-content .text_pole",
    ".drawer-content textarea:not(#send_textarea)",
    ".drawer-content input:not([type='file' i], [type='image' i], [type='checkbox' i], [type='radio' i], [type='range' i])",
    ".text_pole",
    "textarea:not(#send_textarea)",
    "input:not([type='file' i], [type='image' i], [type='checkbox' i], [type='radio' i], [type='range' i])",
    "#send_textarea",
    ".drawer-content input[type='number']",
    "input[type='number']",
    ".drawer-content select",
    "select",
  ];
  for (var i = 0; i < selectors.length; i++) {
    try {
      var nodes = doc.querySelectorAll(selectors[i]);
      for (var j = 0; j < nodes.length; j++) {
        var el = nodes[j];
        if (!el) continue;
        try {
          if (el.closest && el.closest("#" + PANEL_ID)) continue;
        } catch (e) {}
        return el;
      }
    } catch (e) {}
  }
  return null;
}

function readControlStyle(win, el) {
  if (!win || !el) return null;
  var cs = win.getComputedStyle(el);
  if (!cs) return null;
  var bg = cs.backgroundColor || "";
  if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "";
  var borderStyle = cs.borderTopStyle || "solid";
  var border = [
    cs.borderTopWidth || "1px",
    borderStyle === "none" ? "solid" : borderStyle,
    cs.borderTopColor || "var(--SmartThemeBorderColor,#444)",
  ].join(" ");
  var radius = [
    cs.borderTopLeftRadius,
    cs.borderTopRightRadius,
    cs.borderBottomRightRadius,
    cs.borderBottomLeftRadius,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    background: bg || "",
    border: border,
    radius: radius || cs.borderRadius || "",
    shadow: cs.boxShadow || "none",
    color: cs.color || "",
  };
}

function clearThemeInputStyleVars($p) {
  [
    "--ms-themed-input-bg",
    "--ms-themed-input-border",
    "--ms-themed-input-radius",
    "--ms-themed-input-shadow",
  ].forEach(function (name) {
    $p[0].style.removeProperty(name);
  });
}

function syncThemeColors() {
  const $p = $("#" + PANEL_ID);
  if (!$p.length) return;
  var _tbcName = getCurrentThemeName();
  var _tbc =
    _tbcName && data.settings.themeBindings
      ? data.settings.themeBindings[_tbcName]
      : null;
  var hasBoundText = !!(_tbc && _tbc.textColor);
  if (_tbc && _tbc.textColor) {
    $p[0].style.setProperty("--ms-themed-input-color", _tbc.textColor);
  } else {
    $p[0].style.removeProperty("--ms-themed-input-color");
  }
  try {
    let parentDoc = null;
    let parentWin = null;
    try {
      if (window.parent && window.parent.document) {
        parentDoc = window.parent.document;
        parentWin = window.parent;
      }
    } catch (e) {}
    const doc = parentDoc || document;
    const win = parentWin || window;
    var sample = getThemeInputCandidates(doc);
    var style = readControlStyle(win, sample);
    if (style) {
      if (style.background)
        $p[0].style.setProperty("--ms-themed-input-bg", style.background);
      if (style.border)
        $p[0].style.setProperty("--ms-themed-input-border", style.border);
      if (style.radius)
        $p[0].style.setProperty("--ms-themed-input-radius", style.radius);
      $p[0].style.setProperty(
        "--ms-themed-input-shadow",
        style.shadow || "none",
      );
      if (!hasBoundText && style.color) {
        $p[0].style.setProperty("--ms-themed-input-color", style.color);
      }
    } else {
      clearThemeInputStyleVars($p);
    }
  } catch (e) {
    clearThemeInputStyleVars($p);
  }
}

function closeActiveDropdown() {
  const $p = $("#" + PANEL_ID);
  if ($p.length) {
    $p.find("#ms-dropdown").hide();
    $p.css("overflow", "");
  }
  if (activeDropdownCleanup) {
    activeDropdownCleanup();
    activeDropdownCleanup = null;
  }
}

function setupOutsideClickClose($p) {
  const handler = function (e) {
    const $dd = $p.find("#ms-dropdown");
    if (!$dd.is(":visible")) return;
    if (
      $(e.target).closest(
        "#ms-dropdown, #ms-btn-sort, [data-batch='move'], [data-batch='tag'], [data-batch='series'], [data-batch='character'], [data-batch='author']",
      ).length
    )
      return;
    closeActiveDropdown();
  };
  setTimeout(() => {
    $p.on("pointerdown.ms-outside", handler);
  }, 50);
  activeDropdownCleanup = function () {
    $p.off("pointerdown.ms-outside", handler);
  };
}

function getCtx() {
  try {
    if (typeof SillyTavern !== "undefined") {
      if (SillyTavern.extensionSettings && SillyTavern.saveSettingsDebounced)
        return {
          s: SillyTavern.extensionSettings,
          save: SillyTavern.saveSettingsDebounced,
        };
      if (typeof SillyTavern.getContext === "function") {
        const c = SillyTavern.getContext();
        if (c && c.extensionSettings)
          return { s: c.extensionSettings, save: c.saveSettingsDebounced };
      }
    }
  } catch (e) {}
  return null;
}
