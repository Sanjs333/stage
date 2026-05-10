(function () {
  "use strict";

  const STORAGE_KEY = "miniStage_data";
  const PANEL_ID = "mini-stage-panel";
  const STYLE_ID = "mini-stage-styles";
  const SCRIPT_VERSION = "3.2";
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
  var GUIDE_VERSION = "3.2";
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
                $p[0].style.setProperty(
                  "top",
                  savedPosForModal.top,
                  "important",
                );
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

  function syncThemeBackground() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
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
        $p[0].style.setProperty(
          "--ms-panel-bg-repeat",
          bgRepeat || "no-repeat",
        );
        $p[0].style.setProperty(
          "--ms-panel-bg-attachment",
          bgAttach || "fixed",
        );
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
      $p[0].style.setProperty(
        "--ms-accent-rgb",
        m[1] + "," + m[2] + "," + m[3],
      );
    }
  }

  function applyUICustomization() {
    var $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    var el = $p[0];
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
  function syncThemeColors() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
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
      var inputColor = "";
      var selects = doc.querySelectorAll(".drawer-content select");
      for (var i = 0; i < selects.length; i++) {
        var cs = win.getComputedStyle(selects[i]);
        if (cs.color) {
          inputColor = cs.color;
          break;
        }
      }
      if (!inputColor) {
        var textPoles = doc.querySelectorAll(".text_pole");
        for (var j = 0; j < textPoles.length; j++) {
          var cs2 = win.getComputedStyle(textPoles[j]);
          if (cs2.color) {
            inputColor = cs2.color;
            break;
          }
        }
      }
      if (inputColor) {
        $p[0].style.setProperty("--ms-themed-input-color", inputColor);
      }
    } catch (e) {}
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

  function loadData() {
    try {
      const ctx = getCtx();
      if (ctx && ctx.s[STORAGE_KEY]) {
        const stored = ctx.s[STORAGE_KEY];
        data.groups = Array.isArray(stored.groups) ? stored.groups : [];
        data.prompts = Array.isArray(stored.prompts) ? stored.prompts : [];
        data.quickPhrases = Array.isArray(stored.quickPhrases)
          ? stored.quickPhrases
          : [];
        data.subscriptions = Array.isArray(stored.subscriptions)
          ? stored.subscriptions
          : [];
        data.settings = { ...data.settings, ...(stored.settings || {}) };
        if (data.settings.autoCheckInterval === undefined)
          data.settings.autoCheckInterval = 6;
        if (data.settings.historyWarnEnabled === undefined)
          data.settings.historyWarnEnabled = true;
        if (data.settings.filterTagMode === undefined)
          data.settings.filterTagMode = "or";
        if (data.settings.subUpdatesPending === undefined)
          data.settings.subUpdatesPending = 0;
        if (data.settings.stageInjectEnabled === undefined)
          data.settings.stageInjectEnabled = false;
        if (!Array.isArray(data.settings.stageSelectedIds))
          data.settings.stageSelectedIds = data.settings.stageSelectedId
            ? [data.settings.stageSelectedId]
            : [];
        delete data.settings.stageSelectedId;
        if (data.settings.stageInjectMode === undefined)
          data.settings.stageInjectMode = "depth";
        if (data.settings.stageInjectDepth === undefined)
          data.settings.stageInjectDepth = 0;
        if (data.settings.stageInjectRole === undefined)
          data.settings.stageInjectRole = "system";
        if (data.settings.clearStageAfterGeneration === undefined)
          data.settings.clearStageAfterGeneration = false;
        if (data.settings.panelWasVisible === undefined)
          data.settings.panelWasVisible = false;
        if (data.settings.defaultStagePrefix === undefined)
          data.settings.defaultStagePrefix =
            "<stage>\n在正文最后输出以下剧场内容，使用以下html折叠包裹。\n<details>\n<summary>小剧场 {{random::1::2::3::4::5::6::7::8}}| {{stage_title}}</summary>\n在此处输出剧场内容，纯文字直接输出，网页代码上下需```包裹\n</details>\n\n以下是需要输出的剧场内容：\n{{stage}}\n</stage>";
        if (data.settings.uiCustomEnabled === undefined)
          data.settings.uiCustomEnabled = false;
        if (data.settings.uiFontSize === undefined)
          data.settings.uiFontSize = 14;
        if (data.settings.uiPanelWidth === undefined)
          data.settings.uiPanelWidth = 500;
        if (data.settings.uiPanelHeight === undefined)
          data.settings.uiPanelHeight = 82;
        if (data.settings.multiStagePrefix === undefined)
          data.settings.multiStagePrefix =
            "<stage>\n以下共有 {{stage_count}} 个独立小剧场任务，请在正文最后按顺序逐一完成，每条剧场单独使用对应格式包裹。\n\n{{stage_tasks}}\n</stage>";
        if (data.settings.randomInject === undefined)
          data.settings.randomInject = {
            enabled: false,
            excludedGroupIds: [],
            excludedSeries: [],
            excludedPromptIds: [],
          };
        if (
          data.settings.randomInject &&
          !Array.isArray(data.settings.randomInject.excludedCharGroupIds)
        )
          data.settings.randomInject.excludedCharGroupIds = [];
        if (!Array.isArray(data.settings.definedTags))
          data.settings.definedTags = [];
        if (Array.isArray(stored.charGroups) && stored.charGroups.length > 0) {
          var _cgIdMap = {};
          stored.charGroups.forEach(function (cg) {
            if (!cg || !cg.name) return;
            var existing = data.groups.find(function (g) {
              return g.name === cg.name;
            });
            if (existing) {
              if (!Array.isArray(existing.charKeys)) existing.charKeys = [];
              (cg.charKeys || []).forEach(function (k) {
                if (existing.charKeys.indexOf(k) < 0) existing.charKeys.push(k);
              });
              if (!existing.stagePrefix && cg.stagePrefix)
                existing.stagePrefix = cg.stagePrefix;
              _cgIdMap[cg.id] = existing.id;
            } else {
              var newG = {
                id: uid(),
                name: cg.name,
                color:
                  cg.color ||
                  GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
                note: "",
                defaultAuthor: "",
                stagePrefix: cg.stagePrefix || "",
                charKeys: Array.isArray(cg.charKeys) ? cg.charKeys.slice() : [],
              };
              data.groups.push(newG);
              _cgIdMap[cg.id] = newG.id;
            }
          });
          if (
            data.settings.randomInject &&
            Array.isArray(data.settings.randomInject.excludedCharGroupIds)
          ) {
            if (!Array.isArray(data.settings.randomInject.excludedGroupIds))
              data.settings.randomInject.excludedGroupIds = [];
            data.settings.randomInject.excludedCharGroupIds.forEach(
              function (oldId) {
                var newId = _cgIdMap[oldId];
                if (
                  newId &&
                  data.settings.randomInject.excludedGroupIds.indexOf(newId) < 0
                ) {
                  data.settings.randomInject.excludedGroupIds.push(newId);
                }
              },
            );
          }
        }
        if (data.settings.randomInject)
          delete data.settings.randomInject.excludedCharGroupIds;
        if (
          !data.settings.charBirthdays ||
          typeof data.settings.charBirthdays !== "object"
        )
          data.settings.charBirthdays = {};
        if (
          !data.settings.charBirthdayMessages ||
          typeof data.settings.charBirthdayMessages !== "object"
        )
          data.settings.charBirthdayMessages = {};
        var _bdMsgsToMigrate = data.settings.charBirthdayMessages;
        Object.keys(_bdMsgsToMigrate).forEach(function (k) {
          var v = _bdMsgsToMigrate[k];
          if (
            v &&
            typeof v === "object" &&
            !v.versions &&
            (v.message !== undefined || v.contentType !== undefined)
          ) {
            _bdMsgsToMigrate[k] = {
              versions: {
                default: {
                  message: v.message || "",
                  authorName: v.authorName || "",
                  contentType: v.contentType || "text",
                  updatedAt: v.updatedAt || 0,
                  isOwn: v.isOwn === true,
                  year: "default",
                },
              },
            };
          }
        });
        if (
          !data.settings.ownBirthdays ||
          typeof data.settings.ownBirthdays !== "object"
        )
          data.settings.ownBirthdays = {};
        if (
          !data.settings.unlockedBirthdays ||
          typeof data.settings.unlockedBirthdays !== "object"
        )
          data.settings.unlockedBirthdays = {};
        var _unlockedToMigrate = data.settings.unlockedBirthdays;
        Object.keys(_unlockedToMigrate).forEach(function (k) {
          if (k.indexOf("|") < 0 && typeof _unlockedToMigrate[k] === "number") {
            _unlockedToMigrate[k + "|default"] = _unlockedToMigrate[k];
            delete _unlockedToMigrate[k];
          }
        });
        if (!data.settings._bdIsOwnMigrated) {
          Object.keys(data.settings.charBirthdayMessages).forEach(function (k) {
            var m = data.settings.charBirthdayMessages[k];
            if (m && m.isOwn === undefined) m.isOwn = true;
          });
          Object.keys(data.settings.charBirthdays || {}).forEach(function (k) {
            data.settings.ownBirthdays[k] = true;
          });
          data.settings._bdIsOwnMigrated = true;
        }
        if (
          !data.settings.dismissedBirthdays ||
          typeof data.settings.dismissedBirthdays !== "object"
        )
          data.settings.dismissedBirthdays = {};
        if (!data.settings.checkin || typeof data.settings.checkin !== "object")
          data.settings.checkin = {
            lastDate: "",
            currentStreak: 0,
            maxStreak: 0,
            totalDays: 0,
          };
        if (
          !data.settings.dailyUsage ||
          typeof data.settings.dailyUsage !== "object"
        )
          data.settings.dailyUsage = {};
        data.prompts.forEach((p) => {
          if (!Array.isArray(p.tags)) p.tags = [];
          if (p.author === undefined) p.author = "";
          if (typeof p.author !== "string") p.author = String(p.author || "");
          if (p.pinned === undefined) p.pinned = false;
          if (p.character === undefined) p.character = "";
          if (typeof p.character !== "string")
            p.character = String(p.character || "");
          if (!p.usageByCharacter || typeof p.usageByCharacter !== "object")
            p.usageByCharacter = {};
          if (p.sourceId === undefined) p.sourceId = null;
          if (!p.fingerprint) p.fingerprint = contentFingerprint(p);
          if (p.usageCount === undefined) p.usageCount = 0;
          if (p.updatedAt === undefined) p.updatedAt = p.createdAt || null;
          if (p.series === undefined || p.series === null) p.series = "";
          if (typeof p.series !== "string") p.series = String(p.series);
          if (typeof p.title !== "string")
            p.title = String(p.title || "未命名");
          if (typeof p.content !== "string")
            p.content = String(p.content || "");
          if (!Array.isArray(p.history)) p.history = [];
        });
        data.groups.forEach((g) => {
          if (g.note === undefined) g.note = "";
          if (g.defaultAuthor === undefined) g.defaultAuthor = "";
          if (g.stagePrefix === undefined) g.stagePrefix = "";
          if (!Array.isArray(g.charKeys)) g.charKeys = [];
          if (g.iconMode === undefined) g.iconMode = "group";
          if (g.iconUrl === undefined) g.iconUrl = "";
          if (g.iconCharKey === undefined) g.iconCharKey = "";
          if (!Array.isArray(g.charDisplayOrder)) g.charDisplayOrder = [];
        });
        data.subscriptions.forEach(function (s) {
          if (!Array.isArray(s.updateLog)) s.updateLog = [];
          if (s.updateExisting === undefined) s.updateExisting = true;
          if (s.importGroups === undefined) s.importGroups = true;
          if (s.importTags === undefined) s.importTags = true;
          if (s.importCharGroups === undefined) s.importCharGroups = true;
          if (s.targetGroupId === undefined) s.targetGroupId = null;
        });
      }
      if (!data.settings.guideCreated && data.prompts.length === 0) {
        createBuiltinGuide();
        data.settings.guideVersion = GUIDE_VERSION;
        saveData();
      } else if (!data.settings.guideCreated) {
        data.settings.guideCreated = true;
        saveData();
      }
      if (
        data.settings.guideCreated &&
        data.settings.guideVersion !== GUIDE_VERSION
      ) {
        var guideP = data.prompts.find(function (p) {
          return p.id === "_builtin_guide";
        });
        if (guideP) {
          guideP.content = BUILTIN_GUIDE_CONTENT;
          guideP.title = "小剧场 使用说明";
          guideP.updatedAt = Date.now();
          guideP.fingerprint = contentFingerprint(guideP);
        }
        var previewP = data.prompts.find(function (p) {
          return p.id === "_builtin_preview";
        });
        if (previewP) {
          previewP.content = BUILTIN_PREVIEW_CONTENT;
          previewP.title = "预览格式示例";
          previewP.updatedAt = Date.now();
          previewP.fingerprint = contentFingerprint(previewP);
        }
        var injectGuideP = data.prompts.find(function (p) {
          return p.id === "_builtin_inject_guide";
        });
        if (injectGuideP) {
          injectGuideP.content = BUILTIN_INJECT_GUIDE_CONTENT;
          injectGuideP.title = "小剧场 注入功能指南";
          injectGuideP.updatedAt = Date.now();
          injectGuideP.fingerprint = contentFingerprint(injectGuideP);
        } else {
          var _ijgGroup = data.groups.find(function (g) {
            return g.id === "_builtin_guide_group";
          });
          if (_ijgGroup) {
            var _ijgNow = Date.now();
            var _ijgEntry = {
              id: "_builtin_inject_guide",
              title: "小剧场 注入功能指南",
              content: BUILTIN_INJECT_GUIDE_CONTENT,
              groupId: "_builtin_guide_group",
              author: "ssssan_",
              tags: [],
              starred: true,
              pinned: true,
              sourceId: null,
              createdAt: _ijgNow,
              lastUsedAt: null,
              fingerprint: "",
              usageCount: 0,
              updatedAt: _ijgNow,
              series: "",
              history: [],
            };
            _ijgEntry.fingerprint = contentFingerprint(_ijgEntry);
            data.prompts.push(_ijgEntry);
          }
        }
        var charBindGuideP = data.prompts.find(function (p) {
          return p.id === "_builtin_char_bind_guide";
        });
        if (charBindGuideP) {
          charBindGuideP.content = BUILTIN_CHAR_BIND_GUIDE_CONTENT;
          charBindGuideP.title = "小剧场 角色绑定与 IP 分组指南";
          charBindGuideP.updatedAt = Date.now();
          charBindGuideP.fingerprint = contentFingerprint(charBindGuideP);
        } else {
          var _cbgGroup = data.groups.find(function (g) {
            return g.id === "_builtin_guide_group";
          });
          if (_cbgGroup) {
            var _cbgNow = Date.now();
            var _cbgEntry = {
              id: "_builtin_char_bind_guide",
              title: "小剧场 角色绑定与 IP 分组指南",
              content: BUILTIN_CHAR_BIND_GUIDE_CONTENT,
              groupId: "_builtin_guide_group",
              author: "ssssan_",
              tags: [],
              starred: true,
              pinned: true,
              sourceId: null,
              createdAt: _cbgNow,
              lastUsedAt: null,
              fingerprint: "",
              usageCount: 0,
              updatedAt: _cbgNow,
              series: "",
              history: [],
            };
            _cbgEntry.fingerprint = contentFingerprint(_cbgEntry);
            data.prompts.push(_cbgEntry);
          }
        }
        var subGuideP = data.prompts.find(function (p) {
          return p.id === "_builtin_subscription_guide";
        });
        if (subGuideP) {
          subGuideP.content = BUILTIN_SUBSCRIPTION_GUIDE_CONTENT;
          subGuideP.title = "小剧场 订阅功能指南";
          subGuideP.updatedAt = Date.now();
          subGuideP.fingerprint = contentFingerprint(subGuideP);
        } else {
          var _subgGroup = data.groups.find(function (g) {
            return g.id === "_builtin_guide_group";
          });
          if (_subgGroup) {
            var _subgNow = Date.now();
            var _subgEntry = {
              id: "_builtin_subscription_guide",
              title: "小剧场 订阅功能指南",
              content: BUILTIN_SUBSCRIPTION_GUIDE_CONTENT,
              groupId: "_builtin_guide_group",
              author: "ssssan_",
              tags: [],
              starred: true,
              pinned: true,
              sourceId: null,
              createdAt: _subgNow,
              lastUsedAt: null,
              fingerprint: "",
              usageCount: 0,
              updatedAt: _subgNow,
              series: "",
              history: [],
            };
            _subgEntry.fingerprint = contentFingerprint(_subgEntry);
            data.prompts.push(_subgEntry);
          }
        }
        data.settings.guideVersion = GUIDE_VERSION;
        saveData();
      }

      var builtinGuideIds = [
        "_builtin_preview",
        "_builtin_guide",
        "_builtin_inject_guide",
        "_builtin_subscription_guide",
        "_builtin_char_bind_guide",
      ];
      var builtinGuideMap = {};
      data.prompts.forEach(function (p) {
        if (builtinGuideIds.indexOf(p.id) >= 0) {
          builtinGuideMap[p.id] = p;
        }
      });
      var orderedBuiltinGuides = builtinGuideIds
        .map(function (id) {
          return builtinGuideMap[id];
        })
        .filter(Boolean);
      if (orderedBuiltinGuides.length > 0) {
        var needReorder = false;
        for (var _gi = 0; _gi < orderedBuiltinGuides.length; _gi++) {
          if (data.prompts[_gi] !== orderedBuiltinGuides[_gi]) {
            needReorder = true;
            break;
          }
        }
        if (needReorder) {
          data.prompts = data.prompts.filter(function (p) {
            return builtinGuideIds.indexOf(p.id) < 0;
          });
          data.prompts = orderedBuiltinGuides.concat(data.prompts);
          saveData();
        }
      }
      try {
        if (Array.isArray(data.settings.stageSelectedIds)) {
          var validPromptIds = new Set(
            data.prompts.map(function (p) {
              return p.id;
            }),
          );
          data.settings.stageSelectedIds =
            data.settings.stageSelectedIds.filter(function (sid) {
              return validPromptIds.has(sid);
            });
        }
      } catch (e) {}
    } catch (e) {
      console.error("[小剧场] 加载数据失败", e);
    }
  }

  async function fetchRemoteGuide(url) {
    try {
      var fetchUrl =
        url + (url.indexOf("?") >= 0 ? "&" : "?") + "_t=" + Date.now();
      var ctrl = new AbortController();
      var timer = setTimeout(function () {
        ctrl.abort();
      }, 10000);
      var response;
      try {
        response = await fetch(fetchUrl, { signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw new Error("HTTP " + response.status);
      var text = await response.text();
      if (!text || text.length < 20) throw new Error("内容为空");
      return text;
    } catch (e) {
      console.warn("[小剧场] 云端指南加载失败:", url, e);
      return null;
    }
  }

  async function updateBuiltinGuidesFromRemote(forceAll) {
    if (!GUIDE_REMOTE_URLS || !GUIDE_REMOTE_URLS.guide) return true;
    var updated = false;
    var allDone = true;
    var fetchMap = {
      _builtin_guide: GUIDE_REMOTE_URLS.guide,
      _builtin_inject_guide: GUIDE_REMOTE_URLS.injectGuide,
      _builtin_char_bind_guide: GUIDE_REMOTE_URLS.charBindGuide,
      _builtin_subscription_guide: GUIDE_REMOTE_URLS.subscriptionGuide,
      _builtin_preview: GUIDE_REMOTE_URLS.preview,
    };
    var tasks = [];
    Object.keys(fetchMap).forEach(function (pid) {
      var p = data.prompts.find(function (x) {
        return x.id === pid;
      });
      if (!p) return;
      var isPlaceholder =
        !p.content || p.content.indexOf("正在从云端加载") >= 0;
      if (!forceAll && !isPlaceholder) return;
      tasks.push(
        fetchRemoteGuide(fetchMap[pid]).then(function (remoteText) {
          return { pid: pid, p: p, text: remoteText };
        }),
      );
    });
    var results = await Promise.all(tasks);
    results.forEach(function (r) {
      if (r.text) {
        if (r.text !== r.p.content) {
          r.p.content = r.text;
          r.p.updatedAt = Date.now();
          r.p.fingerprint = contentFingerprint(r.p);
          updated = true;
        }
      } else {
        allDone = false;
      }
    });
    if (updated) {
      saveData();
      if (panelVisible) {
        try {
          renderView();
        } catch (e) {}
      }
    }
    return allDone;
  }

  function setupPage(title, toolbarHtml) {
    var $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text(title);
    $p.find("#ms-toolbar").html(
      '<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><span class="ms-form-title">' +
        (toolbarHtml !== undefined ? toolbarHtml : esc(title)) +
        "</span>",
    );
    return $p;
  }

  function createBuiltinGuide() {
    data.groups = data.groups.filter(function (g) {
      return g.id !== "_builtin_guide_group";
    });
    data.prompts = data.prompts.filter(function (p) {
      return (
        p.id !== "_builtin_guide" &&
        p.id !== "_builtin_preview" &&
        p.id !== "_builtin_inject_guide"
      );
    });
    var now = Date.now();
    data.groups.unshift({
      id: "_builtin_guide_group",
      name: "使用指南",
      color: "#9FB1CD",
      note: "小剧场使用说明",
      defaultAuthor: "",
    });
    data.prompts.unshift({
      id: "_builtin_preview",
      title: "预览格式示例",
      content: BUILTIN_PREVIEW_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_inject_guide",
      title: "小剧场 注入功能指南",
      content: BUILTIN_INJECT_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now - 1,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now - 1,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_subscription_guide",
      title: "小剧场 订阅功能指南",
      content: BUILTIN_SUBSCRIPTION_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now - 3,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now - 3,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_char_bind_guide",
      title: "小剧场 角色绑定与 IP 分组指南",
      content: BUILTIN_CHAR_BIND_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now - 2,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now - 2,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.prompts.unshift({
      id: "_builtin_guide",
      title: "小剧场 使用说明",
      content: BUILTIN_GUIDE_CONTENT,
      groupId: "_builtin_guide_group",
      author: "ssssan_",
      tags: [],
      starred: true,
      pinned: true,
      sourceId: null,
      createdAt: now + 1,
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: now + 1,
      series: "",
      history: [],
    });
    data.prompts[0].fingerprint = contentFingerprint(data.prompts[0]);
    data.settings.guideCreated = true;
    saveData();
  }

  function markPromptUsed(p) {
    if (!p) return;
    p.lastUsedAt = Date.now();
    p.usageCount = (p.usageCount || 0) + 1;
    var _curCh = getCurrentCharKeySafe();
    if (_curCh) {
      if (!p.usageByCharacter) p.usageByCharacter = {};
      p.usageByCharacter[_curCh] = (p.usageByCharacter[_curCh] || 0) + 1;
    }
    checkinToday();
    recordDailyUsage();
  }

  let _saveTimer = null;
  let _savePending = false;
  let _lastSaveTime = 0;
  function _doSave(immediate) {
    try {
      const ctx = getCtx();
      if (ctx) {
        ctx.s[STORAGE_KEY] = {
          groups: data.groups,
          prompts: data.prompts,
          quickPhrases: data.quickPhrases,
          subscriptions: data.subscriptions,
          settings: data.settings,
        };
        if (
          immediate &&
          typeof SillyTavern !== "undefined" &&
          typeof SillyTavern.saveSettings === "function"
        ) {
          SillyTavern.saveSettings();
        } else {
          ctx.save();
        }
      }
    } catch (e) {
      console.error("[小剧场] 保存数据失败", e);
    }
  }
  function saveData() {
    _groupIdx = null;
    _promptIdx = null;
    _tagIdx = null;
    _visIdsCache = null;
    _savePending = true;
    if (_saveTimer) return;
    var interval = Date.now() - _lastSaveTime < 2000 ? 800 : 300;
    _saveTimer = setTimeout(function () {
      _saveTimer = null;
      if (!_savePending) return;
      _savePending = false;
      _lastSaveTime = Date.now();
      _doSave();
    }, interval);
  }
  function flushSave() {
    if (_saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    if (_savePending) {
      _savePending = false;
      _doSave(true);
    }
  }
  var _draftSaveTimer = null;
  function saveDraft(draftData) {
    data.settings._editDraft = draftData;
    if (_draftSaveTimer) clearTimeout(_draftSaveTimer);
    _draftSaveTimer = setTimeout(function () {
      _draftSaveTimer = null;
      saveData();
    }, 1500);
  }
  function loadDraft() {
    var d = data.settings._editDraft;
    if (!d) return null;
    if (!d.savedAt || Date.now() - d.savedAt > 86400000) {
      delete data.settings._editDraft;
      saveData();
      return null;
    }
    return d;
  }
  function clearDraft() {
    if (_editDraftTimer) {
      clearTimeout(_editDraftTimer);
      _editDraftTimer = null;
    }
    if (data.settings._editDraft) {
      delete data.settings._editDraft;
      saveData();
    }
  }

  var _groupIdx = null,
    _promptIdx = null,
    _tagIdx = null;
  function _rebuildIdx() {
    _groupIdx = {};
    data.groups.forEach(function (g) {
      _groupIdx[g.id] = g;
    });
    _promptIdx = {};
    data.prompts.forEach(function (p) {
      _promptIdx[p.id] = p;
    });
    _tagIdx = {};
    data.settings.definedTags.forEach(function (t) {
      _tagIdx[t.id] = t;
    });
  }
  function getGroup(id) {
    if (!_groupIdx) _rebuildIdx();
    return _groupIdx[id] || null;
  }
  function getPrompt(id) {
    if (!_promptIdx) _rebuildIdx();
    return _promptIdx[id] || null;
  }
  function getPromptsInGroup(gid) {
    return data.prompts.filter((p) => p.groupId === gid);
  }
  function getUngroupedPrompts() {
    return data.prompts.filter((p) => !p.groupId || !getGroup(p.groupId));
  }
  function getStarredPrompts() {
    return data.prompts.filter((p) => p.starred);
  }
  function getRecentPrompts() {
    return data.prompts
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, 30);
  }

  var _localCharKeySet = null;
  var _localCharKeySetCount = -1;
  function _invalidateLocalCharKeySet() {
    _localCharKeySet = null;
    _localCharKeySetCount = -1;
  }
  function isLocalCharKey(key) {
    if (!key) return false;
    try {
      var curCount =
        typeof SillyTavern !== "undefined" && SillyTavern.characters
          ? SillyTavern.characters.length
          : 0;
      if (_localCharKeySetCount !== curCount) {
        _localCharKeySet = null;
        _localCharKeySetCount = curCount;
      }
    } catch (e) {}
    if (!_localCharKeySet) {
      _localCharKeySet = new Set();
      try {
        if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
          SillyTavern.characters.forEach(function (c) {
            if (c && c.avatar) _localCharKeySet.add(c.avatar);
          });
        }
      } catch (e) {}
    }
    return _localCharKeySet.has(key);
  }

  function filterValidCharKeys(keys) {
    if (!Array.isArray(keys)) return [];
    return keys.filter(isLocalCharKey);
  }
  var _charGroupCache = null;
  var _ipImplicitCache = null;
  function _invalidateCharGroupCache() {
    _charGroupCache = null;
    _ipImplicitCache = null;
  }
  function _buildIPImplicitCache() {
    _ipImplicitCache = {};
    data.prompts.forEach(function (p) {
      if (p.groupId && p.character && isLocalCharKey(p.character)) {
        if (!_ipImplicitCache[p.groupId]) {
          _ipImplicitCache[p.groupId] = new Set();
        }
        _ipImplicitCache[p.groupId].add(p.character);
      }
    });
  }
  function getCharGroupOfChar(charKey) {
    if (!charKey) return null;
    if (!_charGroupCache) {
      _charGroupCache = {};
      data.groups.forEach(function (g) {
        if (Array.isArray(g.charKeys)) {
          g.charKeys.forEach(function (k) {
            _charGroupCache[k] = g;
          });
        }
      });
    }
    return _charGroupCache[charKey] || null;
  }

  function isIPGroup(g) {
    if (!g) return false;
    if (Array.isArray(g.charKeys) && g.charKeys.length > 0) return true;
    if (!_ipImplicitCache) _buildIPImplicitCache();
    return !!(_ipImplicitCache[g.id] && _ipImplicitCache[g.id].size > 0);
  }

  function getIPGroupCharKeys(g) {
    if (!g) return [];
    var set = new Set();
    if (Array.isArray(g.charKeys)) {
      g.charKeys.forEach(function (k) {
        if (isLocalCharKey(k)) set.add(k);
      });
    }
    if (!_ipImplicitCache) _buildIPImplicitCache();
    if (_ipImplicitCache[g.id]) {
      _ipImplicitCache[g.id].forEach(function (k) {
        set.add(k);
      });
    }
    return Array.from(set);
  }

  function getIPGroups() {
    return data.groups.filter(isIPGroup);
  }
  function getCharDisplayOrder(g) {
    if (!g) return [];
    var merged = getIPGroupCharKeys(g);
    var stored = Array.isArray(g.charDisplayOrder)
      ? g.charDisplayOrder.slice()
      : [];
    var result = stored.filter(function (k) {
      return merged.indexOf(k) >= 0;
    });
    merged.forEach(function (k) {
      if (result.indexOf(k) < 0) result.push(k);
    });
    return result;
  }

  function buildGroupAvatarHTML(g, size) {
    size = size || 32;
    var mode = g.iconMode || "group";
    if (mode === "custom" && g.iconUrl) {
      return (
        '<div class="ms-cg-avatar" style="width:' +
        size +
        "px;height:" +
        size +
        "px;border-radius:6px;overflow:hidden;flex-shrink:0;background:" +
        g.color +
        '22;position:relative;">' +
        '<i class="fa-solid fa-folder" style="color:' +
        g.color +
        ';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"></i>' +
        '<img src="' +
        esc(g.iconUrl) +
        '" loading="eager" decoding="async" style="width:100%;height:100%;object-fit:cover;position:relative;z-index:1;" onerror="this.style.display=\'none\';this.onerror=null;">' +
        "</div>"
      );
    }
    if (mode === "char" && g.iconCharKey && isLocalCharKey(g.iconCharKey)) {
      var path = getCharAvatarPathSafe(g.iconCharKey);
      return (
        '<div class="ms-cg-avatar" style="width:' +
        size +
        "px;height:" +
        size +
        "px;border-radius:6px;overflow:hidden;flex-shrink:0;background:" +
        g.color +
        '22;">' +
        (path
          ? '<img src="' +
            esc(path) +
            '" loading="eager" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="color:' +
            g.color +
            ';display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></i>') +
        "</div>"
      );
    }
    var allKeys =
      typeof getIPGroupCharKeys === "function"
        ? getIPGroupCharKeys(g)
        : g.charKeys || [];
    var validKeys = allKeys.filter(function (k) {
      return getCharAvatarPathSafe(k);
    });
    var keys = validKeys.slice(0, 4);
    if (keys.length === 0) keys = allKeys.slice(0, 4);
    if (keys.length === 0) {
      return (
        '<div class="ms-cg-avatar" style="width:' +
        size +
        "px;height:" +
        size +
        "px;background:" +
        g.color +
        "22;color:" +
        g.color +
        ";display:flex;align-items:center;justify-content:center;border-radius:6px;flex-shrink:0;font-size:" +
        Math.round(size * 0.45) +
        'px;"><i class="fa-solid fa-folder"></i></div>'
      );
    }
    if (keys.length === 1) {
      var path = getCharAvatarPathSafe(keys[0]);
      return (
        '<div class="ms-cg-avatar" style="width:' +
        size +
        "px;height:" +
        size +
        "px;border-radius:6px;overflow:hidden;flex-shrink:0;background:" +
        g.color +
        '22;">' +
        (path
          ? '<img src="' +
            esc(path) +
            '" loading="eager" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="color:' +
            g.color +
            ';display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></i>') +
        "</div>"
      );
    }
    var gridCols = keys.length === 2 ? "1fr 1fr" : "1fr 1fr";
    var gridRows =
      keys.length === 2 ? "1fr" : keys.length === 3 ? "1fr 1fr" : "1fr 1fr";
    var html =
      '<div class="ms-cg-avatar" style="width:' +
      size +
      "px;height:" +
      size +
      "px;border-radius:6px;overflow:hidden;flex-shrink:0;display:grid;grid-template-columns:" +
      gridCols +
      ";grid-template-rows:" +
      gridRows +
      ";gap:1px;background:" +
      g.color +
      '22;">';
    keys.forEach(function (k, i) {
      var p = getCharAvatarPathSafe(k);
      var spanCss = "";
      if (keys.length === 3 && i === 0) spanCss = "grid-column:1 / span 2;";
      html +=
        '<div style="overflow:hidden;background:' +
        g.color +
        "33;" +
        spanCss +
        '">' +
        (p
          ? '<img src="' +
            esc(p) +
            '" loading="eager" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : "") +
        "</div>";
    });
    html += "</div>";
    return html;
  }

  function cleanOldDismissedBirthdays() {
    var dismissed = data.settings.dismissedBirthdays || {};
    var keys = Object.keys(dismissed);
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    var changed = false;
    if (keys.length > 0) {
      keys.forEach(function (k) {
        if (dismissed[k] !== todayStr) {
          delete dismissed[k];
          changed = true;
        }
      });
    }
    if (changed) saveData();
  }

  function checkinToday() {
    var ck = data.settings.checkin || {
      lastDate: "",
      currentStreak: 0,
      maxStreak: 0,
      totalDays: 0,
    };
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    if (ck.lastDate === todayStr) return;
    if (ck.lastDate) {
      var p = ck.lastDate.split("-");
      var lastD = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
      var todayMid = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      var diff = Math.round((todayMid - lastD) / 86400000);
      if (diff === 1) ck.currentStreak = (ck.currentStreak || 0) + 1;
      else ck.currentStreak = 1;
    } else {
      ck.currentStreak = 1;
    }
    ck.lastDate = todayStr;
    ck.totalDays = (ck.totalDays || 0) + 1;
    if (ck.currentStreak > (ck.maxStreak || 0)) ck.maxStreak = ck.currentStreak;
    data.settings.checkin = ck;
    saveData();
  }

  function recordDailyUsage() {
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    if (!data.settings.dailyUsage) data.settings.dailyUsage = {};
    data.settings.dailyUsage[todayStr] =
      (data.settings.dailyUsage[todayStr] || 0) + 1;
    var keys = Object.keys(data.settings.dailyUsage);
    if (keys.length > 100) {
      var cutoff = Date.now() - 180 * 86400000;
      keys.forEach(function (k) {
        if (new Date(k).getTime() < cutoff) delete data.settings.dailyUsage[k];
      });
    }
  }
  function getCurrentYearStr() {
    return String(new Date().getFullYear());
  }

  function getCharBdData(charKey) {
    var bdMsgs = data.settings.charBirthdayMessages || {};
    var raw = bdMsgs[charKey];
    if (!raw) return null;
    if (
      !raw.versions &&
      (raw.message !== undefined || raw.contentType !== undefined)
    ) {
      var migrated = {
        versions: {
          default: {
            message: raw.message || "",
            authorName: raw.authorName || "",
            contentType: raw.contentType || "text",
            updatedAt: raw.updatedAt || 0,
            isOwn: raw.isOwn === true,
            year: "default",
          },
        },
      };
      bdMsgs[charKey] = migrated;
      saveData();
      return migrated;
    }
    return raw;
  }

  function isCharBdToday(charKey) {
    var bd = (data.settings.charBirthdays || {})[charKey];
    if (!bd || !/^\d{2}-\d{2}$/.test(bd)) return false;
    var td = new Date();
    var todayMmdd =
      String(td.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(td.getDate()).padStart(2, "0");
    return bd === todayMmdd;
  }

  function canShowBdVersion(charKey, year, versionData) {
    if (!versionData || !(versionData.message || "").trim()) return false;
    if (versionData.isOwn === true) return true;
    var unlocked = data.settings.unlockedBirthdays || {};
    if (unlocked[charKey + "|" + year]) return true;
    if (isCharBdToday(charKey)) {
      if (year === "default" || year === getCurrentYearStr()) return true;
    }
    return false;
  }

  function getDisplayableBdVersions(charKey) {
    var bdData = getCharBdData(charKey);
    if (!bdData || !bdData.versions) return [];
    var versions = bdData.versions;
    var result = [];
    Object.keys(versions).forEach(function (year) {
      var v = versions[year];
      if (!v || !(v.message || "").trim()) return;
      result.push({
        year: year,
        data: v,
        unlocked: canShowBdVersion(charKey, year, v),
      });
    });
    var curY = getCurrentYearStr();
    result.sort(function (a, b) {
      if (a.year === curY) return -1;
      if (b.year === curY) return 1;
      if (a.year === "default" && b.year !== "default") return 1;
      if (b.year === "default" && a.year !== "default") return -1;
      return parseInt(b.year) - parseInt(a.year);
    });
    return result;
  }

  function hasAnyBdMsgVersion(charKey) {
    var bdData = getCharBdData(charKey);
    if (!bdData || !bdData.versions) return false;
    return Object.keys(bdData.versions).some(function (y) {
      var v = bdData.versions[y];
      return v && (v.message || "").trim();
    });
  }

  function hasAnyShowableBdVersion(charKey) {
    return getDisplayableBdVersions(charKey).some(function (it) {
      return it.unlocked;
    });
  }

  function markTodayBirthdaysUnlocked() {
    var bds = data.settings.charBirthdays || {};
    var today = new Date();
    var mmdd =
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    var curY = String(today.getFullYear());
    if (!data.settings.unlockedBirthdays) data.settings.unlockedBirthdays = {};
    var changed = false;
    Object.keys(bds).forEach(function (k) {
      if (bds[k] !== mmdd) return;
      var bdData = getCharBdData(k);
      if (!bdData || !bdData.versions) return;
      Object.keys(bdData.versions).forEach(function (year) {
        if (year !== "default" && year !== curY) return;
        var v = bdData.versions[year];
        if (!v || !(v.message || "").trim()) return;
        var unlockKey = k + "|" + year;
        if (!data.settings.unlockedBirthdays[unlockKey]) {
          data.settings.unlockedBirthdays[unlockKey] = Date.now();
          changed = true;
        }
      });
    });
    if (changed) saveData();
  }

  function getTodayBirthdayChars() {
    var bds = data.settings.charBirthdays || {};
    var today = new Date();
    var mmdd =
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    var todayStr = today.getFullYear() + "-" + mmdd;
    var dismissed = data.settings.dismissedBirthdays || {};
    var result = [];
    Object.keys(bds).forEach(function (k) {
      if (bds[k] === mmdd && dismissed[k] !== todayStr) {
        result.push({ key: k, name: getCharDisplayName(k) });
      }
    });
    return result;
  }

  function getUpcomingBirthdayChars(days) {
    days = days || 7;
    var bds = data.settings.charBirthdays || {};
    var today = new Date();
    var result = [];
    Object.keys(bds).forEach(function (k) {
      var bd = bds[k];
      if (!bd || bd.length !== 5) return;
      var parts = bd.split("-");
      var bdM = parseInt(parts[0]),
        bdD = parseInt(parts[1]);
      if (isNaN(bdM) || isNaN(bdD)) return;
      var thisY = today.getFullYear();
      var bdDate = new Date(thisY, bdM - 1, bdD);
      if (bdDate < new Date(thisY, today.getMonth(), today.getDate())) {
        bdDate = new Date(thisY + 1, bdM - 1, bdD);
      }
      var diff = Math.round(
        (bdDate - new Date(thisY, today.getMonth(), today.getDate())) /
          86400000,
      );
      if (diff > 0 && diff <= days) {
        result.push({
          key: k,
          name: getCharDisplayName(k),
          daysLeft: diff,
          mmdd: bd,
        });
      }
    });
    return result;
  }
  function getAllCharactersWithStages() {
    const map = {};
    data.prompts.forEach((p) => {
      if (p.character && p.character.trim()) {
        const name = p.character.trim();
        if (!map[name]) map[name] = [];
        map[name].push(p);
      }
    });
    return map;
  }
  function getPromptsByCharacter(name) {
    const n = (name || "").trim();
    return data.prompts.filter((p) => p.character && p.character.trim() === n);
  }
  function getCurrentCharKeySafe() {
    try {
      if (
        typeof SillyTavern !== "undefined" &&
        SillyTavern.characters &&
        SillyTavern.characterId !== undefined &&
        SillyTavern.characterId !== null &&
        SillyTavern.characterId !== ""
      ) {
        var ch = SillyTavern.characters[SillyTavern.characterId];
        if (ch && ch.avatar) return ch.avatar;
      }
    } catch (e) {}
    return null;
  }
  var _charNameCache = null;
  var _charNameCacheSize = 0;
  var _charNameCacheCount = -1;

  function _invalidateCharNameCache() {
    _charNameCache = null;
    _charNameCacheSize = 0;
    _charNameCacheCount = -1;
  }

  function getCharDisplayName(key) {
    if (!key) return "";
    try {
      var curCharCount =
        typeof SillyTavern !== "undefined" && SillyTavern.characters
          ? SillyTavern.characters.length
          : 0;
      if (_charNameCacheCount !== -1 && _charNameCacheCount !== curCharCount) {
        _invalidateCharNameCache();
      }
      _charNameCacheCount = curCharCount;
    } catch (e) {}
    if (_charNameCache && _charNameCache.hasOwnProperty(key)) {
      return _charNameCache[key];
    }
    if (_charNameCacheSize > 300) _invalidateCharNameCache();
    if (!_charNameCache) _charNameCache = {};

    var baseName = "";
    var chars = [];

    try {
      if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
        chars = SillyTavern.characters;
        var ch = chars.find(function (c) {
          return c.avatar === key;
        });
        if (ch && ch.name) baseName = ch.name;
      }
    } catch (e) {}

    if (!baseName) {
      var m = String(key).match(/^(.+?)\.[^.]+$/);
      baseName = m ? m[1] : key;
    }
    var result = baseName;
    _charNameCache[key] = result;
    _charNameCacheSize++;
    return result;
  }
  var _avatarPathCache = {};
  var _avatarPathCacheSize = 0;
  var _avatarVersion = Date.now();
  function getCharAvatarPathSafe(key) {
    if (!key) return null;
    if (_avatarPathCache.hasOwnProperty(key)) return _avatarPathCache[key];
    if (_avatarPathCacheSize > 150) {
      var cacheKeys = Object.keys(_avatarPathCache);
      for (var ci = 0; ci < 50; ci++) {
        delete _avatarPathCache[cacheKeys[ci]];
      }
      _avatarPathCacheSize = cacheKeys.length - 50;
    }
    var result = null;
    try {
      if (typeof SillyTavern !== "undefined") {
        var ctx =
          typeof SillyTavern.getContext === "function"
            ? SillyTavern.getContext()
            : null;
        if (ctx && typeof ctx.getThumbnailUrl === "function") {
          result = ctx.getThumbnailUrl("avatar", key);
        }
      }
    } catch (e) {}
    if (!result) {
      try {
        result = "/characters/" + encodeURI(key);
      } catch (e) {}
    }
    if (result) {
      result += (result.indexOf("?") >= 0 ? "&" : "?") + "v=" + _avatarVersion;
    }
    _avatarPathCache[key] = result;
    _avatarPathCacheSize++;
    return result;
  }

  function getTag(id) {
    if (!_tagIdx) _rebuildIdx();
    return _tagIdx[id] || null;
  }
  var _tagOrderCache = null;
  var _tagOrderVersion = 0;
  var _tagOrderCachedVersion = -1;
  function sortTagIds(tagIds) {
    if (!tagIds || tagIds.length === 0) return [];
    if (tagIds.length === 1) return tagIds.slice();
    if (
      _tagOrderCache === null ||
      _tagOrderCachedVersion !== _tagOrderVersion
    ) {
      _tagOrderCache = {};
      data.settings.definedTags.forEach(function (t, i) {
        _tagOrderCache[t.id] = i;
      });
      _tagOrderCachedVersion = _tagOrderVersion;
    }
    var order = _tagOrderCache;
    return [...tagIds].sort(function (a, b) {
      return (
        (order[a] !== undefined ? order[a] : 999) -
        (order[b] !== undefined ? order[b] : 999)
      );
    });
  }

  function sortPrompts(list) {
    const mode = data.settings.sortMode || "created-desc";
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      switch (mode) {
        case "name-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "name-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "created-asc":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "created-desc":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "edited-desc":
          return (
            (b.updatedAt || b.createdAt || 0) -
            (a.updatedAt || a.createdAt || 0)
          );
        case "edited-asc":
          return (
            (a.updatedAt || a.createdAt || 0) -
            (b.updatedAt || b.createdAt || 0)
          );
        case "used-desc":
          return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
        case "used-asc":
          return (a.lastUsedAt || 0) - (b.lastUsedAt || 0);
        case "usage-desc":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "usage-asc":
          return (a.usageCount || 0) - (b.usageCount || 0);
        case "custom":
        default:
          return 0;
      }
    });
    return sorted;
  }

  function createGroup(name) {
    const g = {
      id: uid(),
      name,
      color: GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
      note: "",
      defaultAuthor: "",
      stagePrefix: "",
      charKeys: [],
    };
    data.groups.push(g);
    _invalidateCharGroupCache();
    saveData();
    return g;
  }
  function updateGroup(id, u) {
    const g = getGroup(id);
    if (g) {
      Object.assign(g, u);
      if (u.charKeys !== undefined) _invalidateCharGroupCache();
      saveData();
    }
  }

  function deleteGroup(id) {
    data.groups = data.groups.filter((g) => g.id !== id);
    if (data.settings.generalCollapsed)
      delete data.settings.generalCollapsed[id];
    data.prompts.forEach((p) => {
      if (p.groupId === id) p.groupId = null;
    });
    data.subscriptions.forEach((s) => {
      if (s.targetGroupId === id) s.targetGroupId = null;
    });
    var ri = data.settings.randomInject;
    if (ri && Array.isArray(ri.excludedGroupIds)) {
      ri.excludedGroupIds = ri.excludedGroupIds.filter(function (x) {
        return x !== id;
      });
    }
    if (ri && Array.isArray(ri.excludedSeries)) {
      ri.excludedSeries = ri.excludedSeries.filter(function (s) {
        return s.groupId !== id;
      });
    }
    _invalidateCharGroupCache();
    saveData();
  }

  function createPrompt(obj) {
    const p = {
      id: uid(),
      title: obj.title || "未命名",
      content: obj.content || "",
      groupId: obj.groupId || null,
      author: obj.author || "",
      tags: obj.tags || [],
      starred: false,
      pinned: false,
      sourceId: obj.sourceId || null,
      createdAt: Date.now(),
      lastUsedAt: null,
      fingerprint: "",
      usageCount: 0,
      updatedAt: Date.now(),
      series: obj.series || "",
      history: [],
      character: obj.character || "",
      usageByCharacter: {},
    };
    p.fingerprint = contentFingerprint(p);
    data.prompts.push(p);
    if (p.character && isLocalCharKey(p.character)) _invalidateCharGroupCache();
    saveData();
    return p;
  }

  function updatePrompt(id, u) {
    const p = getPrompt(id);
    if (p) {
      var oldContent = p.content;
      var oldChar = p.character;
      var oldGroupId = p.groupId;
      Object.assign(p, u);
      _invalidateLc(p);
      if (oldChar !== p.character || oldGroupId !== p.groupId) {
        _invalidateCharGroupCache();
      }
      if (u.title !== undefined || u.content !== undefined) {
        p.fingerprint = contentFingerprint(p);
        p.updatedAt = Date.now();
        if (typeof _renderMdCache !== "undefined" && oldContent) {
          _renderMdCache.delete(oldContent);
        }
      } else if (
        u.character !== undefined ||
        u.author !== undefined ||
        u.series !== undefined ||
        u.tags !== undefined ||
        u.groupId !== undefined
      ) {
        p.updatedAt = Date.now();
      }
      saveData();
    }
  }
  function deletePrompt(id) {
    deletePrompts([id]);
  }
  function deletePrompts(ids) {
    const s = new Set(ids);
    data.prompts = data.prompts.filter((p) => !s.has(p.id));
    if (Array.isArray(data.settings.stageSelectedIds)) {
      data.settings.stageSelectedIds = data.settings.stageSelectedIds.filter(
        (sid) => !s.has(sid),
      );
    }
    var ri = data.settings.randomInject;
    if (ri && Array.isArray(ri.excludedPromptIds)) {
      ri.excludedPromptIds = ri.excludedPromptIds.filter((pid) => !s.has(pid));
    }
    _invalidateCharGroupCache();
    saveData();
  }
  function movePromptsToGroup(ids, gid) {
    const s = new Set(ids);
    data.prompts.forEach((p) => {
      if (s.has(p.id)) p.groupId = gid;
    });
    _invalidateCharGroupCache();
    saveData();
  }
  function duplicatePrompt(id) {
    const p = getPrompt(id);
    if (!p) return null;
    return createPrompt({
      title: p.title + " (副本)",
      content: p.content,
      groupId: p.groupId,
      author: p.author,
      tags: [...(p.tags || [])],
      series: p.series || "",
      character: p.character || "",
    });
  }
  function toggleStar(id) {
    const p = getPrompt(id);
    if (p) {
      p.starred = !p.starred;
      saveData();
    }
  }
  function togglePin(id) {
    const p = getPrompt(id);
    if (p) {
      p.pinned = !p.pinned;
      saveData();
    }
  }

  function pushHistory(p) {
    if (!p) return;
    if (!Array.isArray(p.history)) p.history = [];
    var now = Date.now();
    var last = p.history.length > 0 ? p.history[p.history.length - 1] : null;
    if (last && now - last.savedAt < 600000) {
      var oldLen = (last.content || "").length;
      var newLen = (p.content || "").length;
      var diffRatio = oldLen > 0 ? Math.abs(newLen - oldLen) / oldLen : 1;
      if (diffRatio < 0.2) return;
    }
    p.history.push({
      title: p.title,
      content: p.content,
      author: p.author,
      savedAt: now,
    });
    if (p.history.length > 5) p.history.shift();
  }

  function createTag(name) {
    const t = {
      id: uid(),
      name,
      color: TAG_COLORS[data.settings.definedTags.length % TAG_COLORS.length],
    };
    data.settings.definedTags.push(t);
    _tagOrderVersion++;
    saveData();
    return t;
  }
  function updateTag(id, u) {
    const t = getTag(id);
    if (t) {
      Object.assign(t, u);
      _tagOrderVersion++;
      saveData();
    }
  }
  function deleteTag(id) {
    data.settings.definedTags = data.settings.definedTags.filter(
      (t) => t.id !== id,
    );
    data.prompts.forEach((p) => {
      p.tags = p.tags.filter((tid) => tid !== id);
    });
    if (Array.isArray(filterState.includeTags)) {
      filterState.includeTags = filterState.includeTags.filter(
        (tid) => tid !== id,
      );
    }
    if (Array.isArray(filterState.excludeTags)) {
      filterState.excludeTags = filterState.excludeTags.filter(
        (tid) => tid !== id,
      );
    }
    _tagOrderVersion++;
    saveData();
  }

  function filterPrompts(list) {
    let r = list;
    if (filterState.includeTags.length > 0) {
      if (data.settings.filterTagMode === "and") {
        r = r.filter(
          (p) =>
            p.tags &&
            filterState.includeTags.every((tid) => p.tags.includes(tid)),
        );
      } else {
        r = r.filter(
          (p) =>
            p.tags &&
            filterState.includeTags.some((tid) => p.tags.includes(tid)),
        );
      }
    }
    if (filterState.excludeTags.length > 0) {
      r = r.filter(
        (p) =>
          !p.tags ||
          !filterState.excludeTags.some((tid) => p.tags.includes(tid)),
      );
    }
    if (filterState.groupId) {
      if (filterState.groupId === "_ungrouped")
        r = r.filter((p) => !p.groupId || !getGroup(p.groupId));
      else r = r.filter((p) => p.groupId === filterState.groupId);
    }
    if (filterState.onlyCurrentChar) {
      var curK2 = getCurrentCharKeySafe();
      r = curK2
        ? r.filter(function (p) {
            return p.character === curK2;
          })
        : [];
    }
    return r;
  }

  var _lcMap = new WeakMap();
  function _getLc(p, field) {
    var rec = _lcMap.get(p);
    if (!rec) {
      rec = {};
      _lcMap.set(p, rec);
    }
    if (rec[field] === undefined || rec[field + "_src"] !== p[field]) {
      var v = p[field];
      rec[field] = v ? String(v).toLowerCase() : "";
      rec[field + "_src"] = v;
    }
    return rec[field];
  }
  function _invalidateLc(p) {
    if (p) _lcMap.delete(p);
  }
  function searchPrompts(list, q) {
    if (!q) return list;
    const lq = q.toLowerCase();
    return list.filter(function (p) {
      if (_getLc(p, "title").indexOf(lq) >= 0) return true;
      if (_getLc(p, "content").indexOf(lq) >= 0) return true;
      if (_getLc(p, "author").indexOf(lq) >= 0) return true;
      if (_getLc(p, "series").indexOf(lq) >= 0) return true;
      if (p.character) {
        var dn = getCharDisplayName(p.character);
        if (dn && dn.toLowerCase().indexOf(lq) >= 0) return true;
      }
      return false;
    });
  }
  function highlightText(text, query) {
    if (!query || !text) return esc(text);
    const escaped = esc(text);
    const eq = esc(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return escaped.replace(
      new RegExp(`(${eq})`, "gi"),
      '<mark class="ms-hl">$1</mark>',
    );
  }

  var _visIdsCache = null;
  var _visIdsCacheKey = "";
  function getVisiblePromptIds() {
    const v = currentView();
    var curCharForCache = getCurrentCharKeySafe() || "";
    var cacheKey =
      v.name +
      "|" +
      (v.groupId || "") +
      "|" +
      (v.charKey || "") +
      "|" +
      searchQuery +
      "|" +
      JSON.stringify(filterState) +
      "|" +
      (data.settings.sortMode || "") +
      "|" +
      data.prompts.length +
      "|" +
      curCharForCache;
    if (_visIdsCacheKey === cacheKey && _visIdsCache) return _visIdsCache;
    let list = [];
    if (v.name === "list") list = data.prompts;
    else if (v.name === "group")
      list =
        v.groupId === "_ungrouped"
          ? getUngroupedPrompts()
          : getPromptsInGroup(v.groupId);
    else if (v.name === "starred") list = getStarredPrompts();
    else if (v.name === "recent") list = getRecentPrompts();
    else if (v.name === "character")
      list = getPromptsByCharacter(v.charKey || v.charName);
    else return [];
    var sorted = sortPrompts(filterPrompts(searchPrompts(list, searchQuery)));

    function _groupBySeriesVisual(items) {
      var out = [];
      var seen = new Set();
      items.forEach(function (p) {
        if (seen.has(p.id)) return;
        if (p.series && p.series.trim()) {
          var sn = p.series.trim();
          items.forEach(function (q) {
            if (q.series && q.series.trim() === sn && !seen.has(q.id)) {
              out.push(q);
              seen.add(q.id);
            }
          });
        } else {
          out.push(p);
          seen.add(p.id);
        }
      });
      return out;
    }

    var ordered = sorted;
    if (v.name === "group" && v.groupId && !searchQuery) {
      var g = v.groupId !== "_ungrouped" ? getGroup(v.groupId) : null;
      var hasAnyCharBind =
        !!g &&
        sorted.some(function (p) {
          return p.character && isLocalCharKey(p.character);
        });
      var usingPartitioned =
        hasAnyCharBind &&
        filterState.includeTags.length === 0 &&
        filterState.excludeTags.length === 0 &&
        !filterState.onlyCurrentChar;
      if (usingPartitioned) {
        var general = sorted.filter(function (p) {
          return !p.character;
        });
        var byChar = {};
        sorted.forEach(function (p) {
          if (p.character) {
            if (!byChar[p.character]) byChar[p.character] = [];
            byChar[p.character].push(p);
          }
        });
        var orderedKeys = [];
        var curKeyForOrder = getCurrentCharKeySafe();
        var userOrder = g ? getCharDisplayOrder(g) : [];
        var hasUserOrder =
          g &&
          Array.isArray(g.charDisplayOrder) &&
          g.charDisplayOrder.length > 0;
        if (!hasUserOrder && curKeyForOrder && byChar[curKeyForOrder]) {
          orderedKeys.push(curKeyForOrder);
        }
        userOrder.forEach(function (k) {
          if (orderedKeys.indexOf(k) < 0 && byChar[k]) orderedKeys.push(k);
        });
        Object.keys(byChar).forEach(function (k) {
          if (orderedKeys.indexOf(k) < 0) orderedKeys.push(k);
        });
        var visual = [];
        _groupBySeriesVisual(general).forEach(function (p) {
          visual.push(p);
        });
        orderedKeys.forEach(function (k) {
          _groupBySeriesVisual(byChar[k] || []).forEach(function (p) {
            visual.push(p);
          });
        });
        ordered = visual;
      } else {
        ordered = _groupBySeriesVisual(sorted);
      }
    } else if (v.name === "character" && !searchQuery) {
      ordered = _groupBySeriesVisual(sorted);
    } else if (
      v.name === "list" &&
      filterState.groupId &&
      filterState.groupId !== "_ungrouped" &&
      !searchQuery
    ) {
      ordered = _groupBySeriesVisual(sorted);
    }

    var result = ordered.map(function (p) {
      return p.id;
    });
    _visIdsCacheKey = cacheKey;
    _visIdsCache = result;
    return result;
  }

  function autoCollapsePanel() {
    const $panel = $("#" + PANEL_ID);
    if ($panel.length && !$panel.hasClass("ms-collapsed")) {
      $panel.addClass("ms-collapsed");
      data.settings.collapsed = true;
      $panel
        .find("#ms-btn-collapse i")
        .attr("class", "fa-solid fa-window-maximize");
      saveData();
    }
  }
  function _setupInjectLock() {
    _skipAllInjectForNextGeneration = true;
    if (window._msInjectLockTimer) clearTimeout(window._msInjectLockTimer);
    window._msInjectLockTimer = setTimeout(function () {
      if (_skipAllInjectForNextGeneration) {
        _skipAllInjectForNextGeneration = false;
        console.warn("[小剧场] 注入锁超时自动解除");
      }
    }, 30000);
  }

  function _clearInjectLock() {
    _skipAllInjectForNextGeneration = false;
    if (window._msInjectLockTimer) {
      clearTimeout(window._msInjectLockTimer);
      window._msInjectLockTimer = null;
    }
  }

  function sendToInput(id) {
    const p = getPrompt(id);
    if (!p) return;
    markPromptUsed(p);
    saveData();
    try {
      const $ta = $("#send_textarea");
      if ($ta.length) {
        var sids = data.settings.stageSelectedIds || [];
        if (
          data.settings.stageInjectEnabled &&
          sids.length > 0 &&
          sids.indexOf(id) >= 0
        ) {
          _setupInjectLock();
        }
        $ta.val(p.content).trigger("input").trigger("focus");
      } else toast("error", "找不到输入框");
    } catch (e) {
      toast("error", "操作失败");
    }
  }

  function sendAndGenerate(id) {
    const p = getPrompt(id);
    if (!p) return;
    try {
      if (typeof createChatMessages === "function") {
        _setupInjectLock();

        createChatMessages([
          { role: "user", message: substitudeMacros(p.content) },
        ])
          .then(() => {
            markPromptUsed(p);
            saveData();
            if (typeof triggerSlash === "function") {
              triggerSlash("/trigger await=true").catch(function () {
                _clearInjectLock();
              });
            }
            autoCollapsePanel();
          })
          .catch(() => {
            _clearInjectLock();
            toast("error", "发送失败");
          });
      } else {
        const $ta = $("#send_textarea");
        if ($ta.length) {
          _setupInjectLock();
          markPromptUsed(p);
          saveData();
          $ta.val(substitudeMacros(p.content)).trigger("input");
          setTimeout(() => {
            $("#send_but").trigger("click");
          }, 100);
          autoCollapsePanel();
        } else toast("error", "找不到输入框");
      }
    } catch (e) {
      toast("error", "发送失败");
    }
  }

  var _renderMdCache = new Map();
  function renderMd(text) {
    if (!text) return '<span style="opacity:0.4;">空内容</span>';
    var originalText = text;
    if (originalText.length < 50000 && _renderMdCache.has(originalText)) {
      var cached = _renderMdCache.get(originalText);
      _renderMdCache.delete(originalText);
      _renderMdCache.set(originalText, cached);
      return cached;
    }
    var codeBlocks = [];
    text = text.replace(
      /```(?:[^\n]*\n)?([\s\S]*?)\n?```/g,
      function (m, code) {
        var idx = codeBlocks.length;
        codeBlocks.push(code);
        return "%%CB" + idx + "%%";
      },
    );
    var detailBlocks = [];
    var _dbPrevText;
    var _dbLoopGuard = 0;
    do {
      _dbPrevText = text;
      text = text.replace(
        /<details>\s*\n?\s*<summary>((?:(?!<\/summary>)[\s\S])*)<\/summary>\s*\n?((?:(?!<details[\s>])[\s\S])*?)<\/details>/gi,
        function (m, summary, body) {
          var idx = detailBlocks.length;
          detailBlocks.push({ summary: summary.trim(), body: body.trim() });
          return "%%DB" + idx + "%%";
        },
      );
      _dbLoopGuard++;
      if (_dbLoopGuard > 20) break;
    } while (text !== _dbPrevText);
    var tmp = text;
    var inlineCodes = [];
    tmp = tmp.replace(/`([^`\n]+)`/g, function (m, code) {
      var idx = inlineCodes.length;
      inlineCodes.push(code);
      return "%%IC" + idx + "%%";
    });
    var eqBlocks = [];
    tmp = tmp.replace(/"([^"\n]*)"/g, function (m, content) {
      var idx = eqBlocks.length;
      eqBlocks.push(content);
      return "%%EQ" + idx + "%%";
    });
    var cqBlocks = [];
    tmp = tmp.replace(/\u201c([^\u201d\n]*)\u201d/g, function (m, content) {
      var idx = cqBlocks.length;
      cqBlocks.push(content);
      return "%%CQ" + idx + "%%";
    });
    tmp = tmp.replace(/^(\s*)> /gm, function (m, sp) {
      return sp + "%%BQPFX%%";
    });
    var h = esc(tmp);
    h = h.replace(/^\s*(\*{3,}|-{3,})\s*$/gm, '<hr class="ms-md-hr">');
    h = h.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*(?!\s)([\s\S]+?)(?<!\s)\*/g, "<em>$1</em>");
    h = h.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
    h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (m, alt, url) {
      return (
        '<img class="ms-md-img" src="' +
        url.replace(/&/g, "&") +
        '" alt="' +
        alt +
        '" loading="lazy">'
      );
    });
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, text, url) {
      return (
        '<a class="ms-md-link" href="' +
        url.replace(/&/g, "&amp;") +
        '" target="_blank" rel="noopener">' +
        text +
        "</a>"
      );
    });
    h = h.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
    h = h.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
    h = h.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    h = h.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    h = h.replace(/%%BQPFX%%(.*)/gm, "<blockquote>$1</blockquote>");
    h = h.replace(/<\/blockquote>\s*(<br>)?\s*<blockquote>/g, "<br>");
    var taskIdx = 0;
    h = h.replace(/^\s*- \[([ x])\] (.+)$/gm, function (m, check, txt) {
      var done = check === "x";
      var i = taskIdx++;
      return (
        '<li class="ms-task' +
        (done ? " ms-task-done" : "") +
        '"><input type="checkbox"' +
        (done ? " checked" : "") +
        ' class="ms-task-cb" data-task-idx="' +
        i +
        '"> ' +
        txt +
        "</li>"
      );
    });
    h = h.replace(/^\s*- (.+)$/gm, "<li>$1</li>");
    h = h.replace(
      /^(\|.+\|)\n\|[\s\-:|]+\|\n((?:\|.+\|\n?)+)/gm,
      function (match, headerRow, bodySection) {
        var headers = headerRow.split("|").filter(function (c) {
          return c.trim() !== "";
        });
        var thead =
          "<thead><tr>" +
          headers
            .map(function (c) {
              return "<th>" + c.trim() + "</th>";
            })
            .join("") +
          "</tr></thead>";
        var rows = bodySection.trim().split("\n");
        var tbody =
          "<tbody>" +
          rows
            .map(function (row) {
              var cells = row.split("|").filter(function (c) {
                return c.trim() !== "";
              });
              return (
                "<tr>" +
                cells
                  .map(function (c) {
                    return "<td>" + c.trim() + "</td>";
                  })
                  .join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody>";
        return '<table class="ms-md-table">' + thead + tbody + "</table>";
      },
    );
    h = h.replace(/\n/g, "<br>");
    h = h.replace(
      /(<br>\s*)+(<(h[1-6]|blockquote|li|table|hr)[>\s\/])/gi,
      "$2",
    );
    h = h.replace(/(<\/(h[1-6]|blockquote|li|table)>)\s*(<br>)+/gi, "$1");
    h = h.replace(/(<hr[^>]*>)\s*(<br>)+/gi, "$1");
    eqBlocks.forEach(function (content, idx) {
      h = h.replace(
        "%%EQ" + idx + "%%",
        '<span class="ms-quote-text">"' + esc(content) + '"</span>',
      );
    });
    cqBlocks.forEach(function (content, idx) {
      h = h.replace(
        "%%CQ" + idx + "%%",
        '<span class="ms-quote-text">\u201c' + esc(content) + "\u201d</span>",
      );
    });
    inlineCodes.forEach(function (code, idx) {
      h = h.replace(
        "%%IC" + idx + "%%",
        "<code class='ms-ic'>" + esc(code) + "</code>",
      );
    });
    codeBlocks.forEach(function (code, idx) {
      h = h.replace(
        "%%CB" + idx + "%%",
        "<pre class='ms-codeblock'><code>" +
          esc(code).replace(/\n/g, "<br>") +
          "</code></pre>",
      );
    });
    var renderedDetailBlocks = [];
    for (var _dbIdx = 0; _dbIdx < detailBlocks.length; _dbIdx++) {
      var block = detailBlocks[_dbIdx];
      var bodyParts = block.body.split(/(%%DB\d+%%)/);
      var innerHtml = bodyParts
        .map(function (part) {
          if (!part) return "";
          var m = part.match(/^%%DB(\d+)%%$/);
          if (m) {
            return renderedDetailBlocks[parseInt(m[1])] || "";
          }
          return renderMd(part);
        })
        .join("");
      renderedDetailBlocks[_dbIdx] =
        '<details class="ms-details"><summary class="ms-summary">' +
        esc(block.summary) +
        '</summary><div class="ms-details-body">' +
        innerHtml +
        "</div></details>";
    }
    for (var _dbIdx2 = detailBlocks.length - 1; _dbIdx2 >= 0; _dbIdx2--) {
      h = h.replace("%%DB" + _dbIdx2 + "%%", renderedDetailBlocks[_dbIdx2]);
    }
    if (originalText.length < 50000) {
      if (_renderMdCache.size >= 100) {
        var firstKey = _renderMdCache.keys().next().value;
        _renderMdCache.delete(firstKey);
      }
      _renderMdCache.set(originalText, h);
    }
    return h;
  }

  function wrapSelection(ta, before, after) {
    if (!ta) return;
    const s = ta.selectionStart,
      e = ta.selectionEnd,
      v = ta.value,
      sel = v.substring(s, e) || "文本";
    var _st = ta.scrollTop;
    ta.value = v.substring(0, s) + before + sel + after + v.substring(e);
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function prependLine(ta, prefix) {
    if (!ta) return;
    const s = ta.selectionStart,
      v = ta.value,
      ls = v.lastIndexOf("\n", s - 1) + 1;
    var _st = ta.scrollTop;
    ta.value = v.substring(0, ls) + prefix + v.substring(ls);
    ta.selectionStart = ta.selectionEnd = s + prefix.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function insertAtCursor(ta, text) {
    if (!ta) return;
    const s = ta.selectionStart,
      e = ta.selectionEnd,
      v = ta.value;
    var _st = ta.scrollTop;
    ta.value = v.substring(0, s) + text + v.substring(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.scrollTop = _st;
    ta.focus();
  }

  function createUndoManager(getTa) {
    const stack = [],
      redoStack = [];
    let timer = null,
      lastSaved = "";
    function capture() {
      const ta = getTa();
      if (!ta) return;
      if (ta.value === lastSaved && stack.length > 0) return;
      stack.push({ v: ta.value, s: ta.selectionStart, e: ta.selectionEnd });
      lastSaved = ta.value;
      if (stack.length > 80) stack.shift();
      redoStack.length = 0;
    }
    function scheduleCapture() {
      clearTimeout(timer);
      timer = setTimeout(capture, 350);
    }

    function undo() {
      const ta = getTa();
      if (!ta) return;
      if (ta.value !== lastSaved) capture();
      if (stack.length <= 1) return;
      redoStack.push(stack.pop());
      const prev = stack[stack.length - 1];
      var _st = ta.scrollTop;
      ta.value = prev.v;
      ta.selectionStart = prev.s;
      ta.selectionEnd = prev.e;
      ta.scrollTop = _st;
      lastSaved = ta.value;
      ta.focus();
    }

    function redo() {
      const ta = getTa();
      if (!ta) return;
      if (redoStack.length === 0) return;
      const next = redoStack.pop();
      stack.push(next);
      var _st = ta.scrollTop;
      ta.value = next.v;
      ta.selectionStart = next.s;
      ta.selectionEnd = next.e;
      ta.scrollTop = _st;
      lastSaved = ta.value;
      ta.focus();
    }
    const ta = getTa();
    if (ta) {
      stack.push({ v: ta.value, s: 0, e: 0 });
      lastSaved = ta.value;
    }
    function getState() {
      return {
        stack: stack.map(function (s) {
          return { v: s.v, s: s.s, e: s.e };
        }),
        redoStack: redoStack.map(function (s) {
          return { v: s.v, s: s.s, e: s.e };
        }),
        lastSaved: lastSaved,
      };
    }
    function setState(st) {
      stack.length = 0;
      redoStack.length = 0;
      if (st.stack)
        st.stack.forEach(function (s) {
          stack.push({ v: s.v, s: s.s, e: s.e });
        });
      if (st.redoStack)
        st.redoStack.forEach(function (s) {
          redoStack.push({ v: s.v, s: s.s, e: s.e });
        });
      lastSaved =
        st.lastSaved !== undefined
          ? st.lastSaved
          : getTa()
            ? getTa().value
            : "";
    }
    return { capture, scheduleCapture, undo, redo, getState, setState };
  }

  function buildExportPayload(
    exportPrompts,
    includeGroups,
    includeTags,
    includeHistory,
    includeCharacter,
    includeCharGroups,
  ) {
    const gidSet = new Set(exportPrompts.map((p) => p.groupId).filter(Boolean));
    const exportGroups = includeGroups
      ? data.groups.filter((g) => gidSet.has(g.id))
      : [];
    const tagIds = new Set();
    exportPrompts.forEach((p) =>
      (p.tags || []).forEach((tid) => tagIds.add(tid)),
    );
    const exportTags = includeTags
      ? data.settings.definedTags.filter((t) => tagIds.has(t.id))
      : [];
    const finalPrompts = exportPrompts.map((p) => {
      const cp = { ...p };
      if (!includeHistory) delete cp.history;
      if (!includeCharacter) {
        cp.character = "";
        cp.usageByCharacter = {};
      } else if (cp.character) {
        cp.character_name = getCharDisplayName(cp.character);
      }
      cp.pinned = false;
      cp.starred = false;
      cp.lastUsedAt = null;
      cp.usageCount = 0;
      delete cp._lastSubFingerprint;
      return cp;
    });
    var exportCharGroups = [];
    if (includeCharGroups && includeCharacter) {
      var involvedKeys = new Set();
      exportPrompts.forEach(function (p) {
        if (p.character) involvedKeys.add(p.character);
      });
      getIPGroups().forEach(function (cg) {
        var matchedKeys = (cg.charKeys || []).filter(function (k) {
          return involvedKeys.has(k);
        });
        if (matchedKeys.length > 0) {
          exportCharGroups.push({
            id: cg.id,
            name: cg.name,
            color: cg.color,
            note: cg.note || "",
            defaultAuthor: cg.defaultAuthor || "",
            stagePrefix: cg.stagePrefix || "",
            iconMode: cg.iconMode || "group",
            iconUrl: cg.iconUrl || "",
            iconCharKey: cg.iconCharKey || "",
            charKeys: matchedKeys,
            charDisplayOrder: Array.isArray(cg.charDisplayOrder)
              ? cg.charDisplayOrder.filter(function (k) {
                  return matchedKeys.indexOf(k) >= 0;
                })
              : [],
          });
        }
      });
    }
    var exportBdMessages = {};
    var exportBdDates = {};
    if (includeCharacter) {
      var involvedKeys = new Set();
      exportPrompts.forEach(function (p) {
        if (p.character) involvedKeys.add(p.character);
      });
      if (includeCharGroups) {
        exportCharGroups.forEach(function (cg) {
          (cg.charKeys || []).forEach(function (k) {
            involvedKeys.add(k);
          });
        });
      }
      involvedKeys.forEach(function (k) {
        if (data.settings.charBirthdayMessages) {
          var mm = data.settings.charBirthdayMessages[k];
          if (mm && mm.versions) {
            var hasAny = Object.keys(mm.versions).some(function (y) {
              var v = mm.versions[y];
              return v && (v.message || "").trim();
            });
            if (hasAny) exportBdMessages[k] = mm;
          } else if (mm && (mm.message || "").trim()) {
            exportBdMessages[k] = {
              versions: {
                default: {
                  message: mm.message || "",
                  authorName: mm.authorName || "",
                  contentType: mm.contentType || "text",
                  updatedAt: mm.updatedAt || 0,
                  isOwn: mm.isOwn === true,
                  year: "default",
                },
              },
            };
          }
        }
        if (data.settings.charBirthdays && data.settings.charBirthdays[k]) {
          exportBdDates[k] = data.settings.charBirthdays[k];
        }
      });
    }
    return {
      _miniStage: true,
      version: 3,
      exportedAt: new Date().toISOString(),
      groups: exportGroups,
      prompts: finalPrompts,
      tags: exportTags,
      charGroups: exportCharGroups,
      charBirthdayMessages: exportBdMessages,
      charBirthdays: exportBdDates,
    };
  }

  function downloadJSON(obj, filename) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    let targetDoc = document;
    try {
      if (
        window.parent &&
        window.parent.document &&
        window.parent.document.body
      ) {
        targetDoc = window.parent.document;
      }
    } catch (e) {}
    const a = targetDoc.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
    targetDoc.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        targetDoc.body.removeChild(a);
      } catch (e) {}
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function doExportSingle(pr) {
    navigateTo({ name: "export-single-options", promptId: pr.id });
  }

  function doExportGroup(groupId) {
    const g = getGroup(groupId);
    const prompts = getPromptsInGroup(groupId);
    if (prompts.length === 0) {
      toast("warning", "该分组没有剧场");
      return;
    }
    navigateTo({
      name: "export-group-options",
      groupId,
      groupName: g ? g.name : "未知",
    });
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.prompts && !imported.groups)
          throw new Error("无效的小剧场数据");
        navigateTo({
          name: "import-confirm",
          importedGroups: imported.groups || [],
          importedPrompts: imported.prompts || [],
          importedTags: imported.tags || [],
          importedCharGroups: imported.charGroups || [],
          importedBdMessages: imported.charBirthdayMessages || {},
          importedBdDates: imported.charBirthdays || {},
        });
      } catch (err) {
        toast("error", "文件解析失败: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function executeImport(
    mode,
    ig,
    ip,
    itags,
    useGroups,
    useTags,
    targetGroupId,
    icgs,
    useCharGroups,
    ibdmsgs,
    ibddates,
  ) {
    function buildLocalNameMap() {
      var nameMap = {};
      try {
        if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
          SillyTavern.characters.forEach(function (c) {
            if (!c || !c.avatar) return;
            var dn = getCharDisplayName(c.avatar);
            if (!nameMap[dn]) nameMap[dn] = [];
            nameMap[dn].push(c.avatar);
          });
        }
      } catch (e) {}
      return nameMap;
    }
    function smartRebindCharacter(p, nameMap) {
      if (!p.character) return;
      if (isLocalCharKey(p.character)) return;
      var exportedName = p.character_name;
      if (
        exportedName &&
        nameMap[exportedName] &&
        nameMap[exportedName].length === 1
      ) {
        p.character = nameMap[exportedName][0];
        return;
      }
    }

    icgs = icgs || [];
    ibdmsgs = ibdmsgs || {};
    ibddates = ibddates || {};
    var _importNameMap = buildLocalNameMap();
    var importBdDateConflicts = [];
    var importBdMsgConflicts = [];
    ip.forEach(function (p) {
      smartRebindCharacter(p, _importNameMap);
    });
    if (icgs && icgs.length > 0) {
      icgs.forEach(function (icg) {
        if (!Array.isArray(icg.charKeys)) return;
        icg.charKeys = icg.charKeys.map(function (k) {
          if (!k || isLocalCharKey(k)) return k;
          var dn = getCharDisplayName(k);
          if (_importNameMap[dn] && _importNameMap[dn].length === 1) {
            return _importNameMap[dn][0];
          }
          return k;
        });
      });
    }
    function applyImportCharGroups(cleanFirst) {
      if (!useCharGroups || icgs.length === 0) return;
      if (cleanFirst) {
        data.groups.forEach(function (gg) {
          if (Array.isArray(gg.charKeys)) gg.charKeys = [];
        });
      }
      icgs.forEach(function (icg) {
        if (!icg.name) return;
        var importKeys = Array.isArray(icg.charKeys)
          ? icg.charKeys.filter(function (k, idx, arr) {
              return k && arr.indexOf(k) === idx;
            })
          : [];
        if (importKeys.length === 0) return;
        var existing = data.groups.find(function (gg) {
          return gg.name === icg.name;
        });
        if (existing) {
          if (!Array.isArray(existing.charKeys)) existing.charKeys = [];
          importKeys.forEach(function (k) {
            data.groups.forEach(function (other) {
              if (other === existing) return;
              if (!Array.isArray(other.charKeys)) return;
              var oi = other.charKeys.indexOf(k);
              if (oi >= 0) other.charKeys.splice(oi, 1);
            });
            if (existing.charKeys.indexOf(k) < 0) existing.charKeys.push(k);
          });
          if (!existing.stagePrefix && icg.stagePrefix)
            existing.stagePrefix = icg.stagePrefix;
          if (mode !== "append") {
            if (icg.color !== undefined) existing.color = icg.color;
            if (icg.note !== undefined) existing.note = icg.note;
            if (icg.defaultAuthor !== undefined)
              existing.defaultAuthor = icg.defaultAuthor;
            if (icg.iconMode !== undefined) existing.iconMode = icg.iconMode;
            if (icg.iconUrl !== undefined) existing.iconUrl = icg.iconUrl;
            if (icg.iconCharKey !== undefined)
              existing.iconCharKey = icg.iconCharKey;
            if (Array.isArray(icg.charDisplayOrder)) {
              existing.charDisplayOrder = icg.charDisplayOrder.slice();
            }
          } else {
            if (
              Array.isArray(icg.charDisplayOrder) &&
              icg.charDisplayOrder.length > 0
            ) {
              if (!Array.isArray(existing.charDisplayOrder))
                existing.charDisplayOrder = [];
              icg.charDisplayOrder.forEach(function (k) {
                if (existing.charDisplayOrder.indexOf(k) < 0)
                  existing.charDisplayOrder.push(k);
              });
            }
          }
        } else {
          var newG = {
            id: uid(),
            name: icg.name,
            color:
              icg.color ||
              GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
            note: icg.note || "",
            defaultAuthor: icg.defaultAuthor || "",
            stagePrefix: icg.stagePrefix || "",
            iconMode: icg.iconMode || "group",
            iconUrl: icg.iconUrl || "",
            iconCharKey: icg.iconCharKey || "",
            charKeys: [],
          };
          importKeys.forEach(function (k) {
            data.groups.forEach(function (other) {
              if (!Array.isArray(other.charKeys)) return;
              var oi = other.charKeys.indexOf(k);
              if (oi >= 0) other.charKeys.splice(oi, 1);
            });
            if (newG.charKeys.indexOf(k) < 0) newG.charKeys.push(k);
          });
          data.groups.push(newG);
        }
      });
    }
    let importMsg = "导入完成";
    if (mode === "replace") {
      var _replaceKeys = new Set();
      ip.forEach(function (p) {
        if (p.character) _replaceKeys.add(p.character);
      });
      (icgs || []).forEach(function (icg) {
        (icg.charKeys || []).forEach(function (k) {
          _replaceKeys.add(k);
        });
      });
      Object.keys(ibdmsgs || {}).forEach(function (k) {
        _replaceKeys.add(k);
      });
      Object.keys(ibddates || {}).forEach(function (k) {
        _replaceKeys.add(k);
      });
      _replaceKeys.forEach(function (k) {
        if (data.settings.charBirthdays) delete data.settings.charBirthdays[k];
        if (data.settings.charBirthdayMessages)
          delete data.settings.charBirthdayMessages[k];
        if (data.settings.ownBirthdays) delete data.settings.ownBirthdays[k];
        if (data.settings.unlockedBirthdays)
          delete data.settings.unlockedBirthdays[k];
        if (data.settings.dismissedBirthdays)
          delete data.settings.dismissedBirthdays[k];
      });
      const replaceTagIdMap = {};
      if (useTags && itags.length) {
        var _impTagNames = new Set(
          itags.map(function (t) {
            return t.name;
          }),
        );
        var _removedTagIds = new Set();
        data.settings.definedTags.forEach(function (t) {
          if (_impTagNames.has(t.name)) _removedTagIds.add(t.id);
        });
        data.settings.definedTags = data.settings.definedTags.filter(
          function (t) {
            return !_impTagNames.has(t.name);
          },
        );
        if (_removedTagIds.size > 0) {
          data.prompts.forEach(function (p) {
            if (Array.isArray(p.tags)) {
              p.tags = p.tags.filter(function (tid) {
                return !_removedTagIds.has(tid);
              });
            }
          });
        }
        itags.forEach(function (t) {
          var nt = Object.assign({}, t, { id: t.id || uid() });
          data.settings.definedTags.push(nt);
          replaceTagIdMap[t.id] = nt.id;
        });
      }
      var replaceGidMap = {};
      var replacedLocalGids = new Set();
      if (useGroups && ig.length > 0) {
        ig.forEach(function (impG) {
          var ex = data.groups.find(function (g) {
            return g.name === impG.name;
          });
          if (ex) {
            replacedLocalGids.add(ex.id);
            Object.assign(ex, impG, { id: ex.id });
            replaceGidMap[impG.id] = ex.id;
          } else {
            var newG = Object.assign({}, impG, { id: uid() });
            data.groups.push(newG);
            replaceGidMap[impG.id] = newG.id;
          }
        });
      }
      if (useGroups && replacedLocalGids.size > 0) {
        data.prompts = data.prompts.filter(function (p) {
          return !replacedLocalGids.has(p.groupId);
        });
      } else if (!useGroups) {
        var _effectiveTarget = targetGroupId || null;
        data.prompts = data.prompts.filter(function (p) {
          var _gid = p.groupId && getGroup(p.groupId) ? p.groupId : null;
          return _gid !== _effectiveTarget;
        });
      }
      data.subscriptions.forEach(function (s) {
        if (
          s.targetGroupId &&
          !data.groups.find(function (g) {
            return g.id === s.targetGroupId;
          })
        ) {
          s.targetGroupId = null;
        }
      });
      ip.forEach(function (p) {
        var np = Object.assign({}, p, {
          id: p.id || uid(),
          sourceId: p.sourceId || p.id || null,
          tags: useTags
            ? (p.tags || []).map(function (tid) {
                return replaceTagIdMap[tid] || tid;
              })
            : [],
          author: p.author || "",
          pinned: p.pinned || false,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        });
        if (np.character && !isLocalCharKey(np.character)) {
          np.usageByCharacter = {};
        }
        np.fingerprint = contentFingerprint(np);
        if (useGroups) {
          np.groupId = replaceGidMap[p.groupId] || null;
        } else {
          np.groupId = targetGroupId || null;
        }
        data.prompts.push(np);
      });
    } else if (mode === "merge") {
      const sourceIdIndex = {};
      data.prompts.forEach((p) => {
        if (p.sourceId && !sourceIdIndex[p.sourceId])
          sourceIdIndex[p.sourceId] = p;
      });
      data.prompts.forEach((p) => {
        if (!sourceIdIndex[p.id]) sourceIdIndex[p.id] = p;
      });
      const existFingerprints = new Set(
        data.prompts.map((p) => {
          if (!p.fingerprint) {
            p.fingerprint = contentFingerprint(p);
          }
          return p.fingerprint;
        }),
      );
      const gidMap = {};
      if (useGroups) {
        ig.forEach((g) => {
          const ex = data.groups.find((eg) => eg.name === g.name);
          if (ex) gidMap[g.id] = ex.id;
          else {
            const ng = { ...g, id: uid() };
            data.groups.push(ng);
            gidMap[g.id] = ng.id;
          }
        });
      }
      const tagIdMap = {};
      if (useTags && itags.length) {
        itags.forEach((t) => {
          const ex = data.settings.definedTags.find((et) => et.name === t.name);
          if (ex) tagIdMap[t.id] = ex.id;
          else {
            const nt = { ...t, id: uid() };
            data.settings.definedTags.push(nt);
            tagIdMap[t.id] = nt.id;
          }
        });
      }
      let addedCount = 0,
        updatedCount = 0,
        skippedCount = 0;
      ip.forEach((p) => {
        const importSourceId = p.sourceId || p.id;
        const fp = contentFingerprint(p);
        const existingBySource = sourceIdIndex[importSourceId];
        if (existingBySource) {
          const existingFp =
            existingBySource.fingerprint ||
            contentFingerprint(existingBySource);
          if (fp === existingFp) {
            skippedCount++;
            return;
          }
          existingBySource.title = p.title || existingBySource.title;
          existingBySource.content =
            p.content !== undefined ? p.content : existingBySource.content;
          existingBySource.author = p.author || existingBySource.author;
          existingBySource.series =
            p.series !== undefined ? p.series : existingBySource.series;
          existingBySource.fingerprint = fp;
          existingBySource.updatedAt = Date.now();
          if (useGroups && p.groupId)
            existingBySource.groupId = gidMap[p.groupId] || p.groupId;
          if (useTags && p.tags)
            existingBySource.tags = p.tags.map((tid) => tagIdMap[tid] || tid);
          updatedCount++;
          return;
        }
        if (existFingerprints.has(fp)) {
          skippedCount++;
          return;
        }
        const np = {
          ...p,
          id: uid(),
          sourceId: importSourceId,
          author: p.author || "",
          pinned: p.pinned || false,
          fingerprint: fp,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        };
        if (np.character && !isLocalCharKey(np.character)) {
          np.usageByCharacter = {};
        }
        np.groupId = useGroups
          ? gidMap[p.groupId] || p.groupId || null
          : targetGroupId || null;
        np.tags = useTags
          ? (p.tags || []).map((tid) => tagIdMap[tid] || tid)
          : [];
        data.prompts.push(np);
        existFingerprints.add(fp);
        addedCount++;
      });
      const parts = [];
      if (addedCount > 0) parts.push("新增 " + addedCount + " 条");
      if (updatedCount > 0) parts.push("更新 " + updatedCount + " 条");
      if (skippedCount > 0) parts.push("跳过 " + skippedCount + " 条");
      importMsg =
        "导入完成：" + (parts.length > 0 ? parts.join("，") : "无变化");
    } else {
      const gidMap = {};
      if (useGroups) {
        ig.forEach((g) => {
          const ng = { ...g, id: uid() };
          data.groups.push(ng);
          gidMap[g.id] = ng.id;
        });
      }
      const tagIdMap = {};
      if (useTags && itags.length) {
        itags.forEach((t) => {
          const nt = { ...t, id: uid() };
          data.settings.definedTags.push(nt);
          tagIdMap[t.id] = nt.id;
        });
      }
      ip.forEach((p) => {
        const np = {
          ...p,
          id: uid(),
          author: p.author || "",
          pinned: p.pinned || false,
          usageCount: p.usageCount || 0,
          history: p.history || [],
        };
        if (np.character && !isLocalCharKey(np.character)) {
          np.usageByCharacter = {};
        }
        np.fingerprint = contentFingerprint(np);
        np.sourceId = p.sourceId || p.id || null;
        np.groupId = useGroups
          ? gidMap[p.groupId] || null
          : targetGroupId || null;
        np.tags = useTags
          ? (p.tags || []).map((tid) => tagIdMap[tid] || tid)
          : [];
        data.prompts.push(np);
      });
    }
    if (mode === "replace") applyImportCharGroups(true);
    else applyImportCharGroups(false);
    function _rebindBdKey(k) {
      if (!k || isLocalCharKey(k)) return k;
      var dn = getCharDisplayName(k);
      if (_importNameMap[dn] && _importNameMap[dn].length === 1) {
        return _importNameMap[dn][0];
      }
      return k;
    }
    var bdMsgKeys = Object.keys(ibdmsgs);
    if (bdMsgKeys.length > 0) {
      if (mode === "replace") {
        data.settings.charBirthdayMessages = {};
      }
      if (!data.settings.charBirthdayMessages)
        data.settings.charBirthdayMessages = {};
      bdMsgKeys.forEach(function (k) {
        var rawImp = ibdmsgs[k];
        if (!rawImp) return;
        var impVersions;
        if (rawImp.versions) {
          impVersions = rawImp.versions;
        } else if (rawImp.message !== undefined) {
          impVersions = {
            default: {
              message: rawImp.message || "",
              authorName: rawImp.authorName || "",
              contentType: rawImp.contentType || "text",
              updatedAt: rawImp.updatedAt || 0,
              isOwn: false,
              year: "default",
            },
          };
        } else {
          return;
        }
        var newKey = _rebindBdKey(k);
        var existing = data.settings.charBirthdayMessages[newKey] || {
          versions: {},
        };
        if (!existing.versions) existing.versions = {};
        Object.keys(impVersions).forEach(function (year) {
          var ivRaw = impVersions[year];
          if (!ivRaw || !(ivRaw.message || "").trim()) return;
          var iv = Object.assign({}, ivRaw, { isOwn: false, year: year });
          var ev = existing.versions[year];
          if (mode === "replace" || mode === "append" || !ev) {
            existing.versions[year] = iv;
          } else if (mode === "merge") {
            if (ev.isOwn === true) {
              if ((ev.message || "") !== (iv.message || "")) {
                importBdMsgConflicts.push({
                  charKey: newKey,
                  year: year,
                  localMsg: ev,
                  incomingMsg: iv,
                });
              }
              return;
            }
            var impTs = iv.updatedAt || 0;
            var existTs = ev.updatedAt || 0;
            if (impTs === 0 || impTs >= existTs) {
              existing.versions[year] = iv;
            }
          }
        });
        if (Object.keys(existing.versions).length > 0) {
          data.settings.charBirthdayMessages[newKey] = existing;
        }
      });
    }
    var bdDateKeys = Object.keys(ibddates);
    if (bdDateKeys.length > 0) {
      if (mode === "replace") {
        data.settings.charBirthdays = {};
      }
      if (!data.settings.charBirthdays) data.settings.charBirthdays = {};
      if (!data.settings.ownBirthdays) data.settings.ownBirthdays = {};
      bdDateKeys.forEach(function (k) {
        var d = ibddates[k];
        if (!d || !/^\d{2}-\d{2}$/.test(d)) return;
        var newKey = _rebindBdKey(k);
        if (mode === "merge" && data.settings.ownBirthdays[newKey] === true) {
          var _localBdDate2 = data.settings.charBirthdays[newKey];
          if (_localBdDate2 && _localBdDate2 !== d) {
            importBdDateConflicts.push({
              charKey: newKey,
              localDate: _localBdDate2,
              incomingDate: d,
            });
          }
          return;
        }
        if (
          mode === "replace" ||
          mode === "append" ||
          mode === "merge" ||
          !data.settings.charBirthdays[newKey]
        ) {
          data.settings.charBirthdays[newKey] = d;
          if (data.settings.ownBirthdays[newKey]) {
            delete data.settings.ownBirthdays[newKey];
          }
        }
      });
    }
    _invalidateCharGroupCache();
    saveData();
    toast("success", importMsg);
    navigateTo({ name: "list" }, true);
    if (importBdDateConflicts.length > 0 || importBdMsgConflicts.length > 0) {
      setTimeout(function () {
        showBirthdayConflictDialog(importBdDateConflicts, importBdMsgConflicts);
      }, 400);
    }
    setTimeout(function () {
      try {
        if (
          typeof SillyTavern === "undefined" ||
          !SillyTavern.characters ||
          SillyTavern.characters.length === 0
        ) {
          return;
        }
        var lostKeys = new Set();
        if (icgs && icgs.length > 0) {
          icgs.forEach(function (icg) {
            (icg.charKeys || []).forEach(function (k) {
              if (k && !isLocalCharKey(k)) lostKeys.add(k);
            });
          });
        }
        if (lostKeys.size > 0) {
          msConfirm(
            "导入完成，但发现 " +
              lostKeys.size +
              " 个角色在本地找不到对应的卡（文件名不匹配）。\n\n" +
              "是否前往「失联角色」页面，把它们重绑到你本地的角色卡？\n" +
              "（不处理也可以，剧场内容不受影响，只是无法显示在「角色专属」分类下）",
            { title: "检测到失联角色", type: "warning", okText: "去处理" },
          ).then(function (ok) {
            if (ok) navigateTo({ name: "lost-chars" });
          });
        }
      } catch (e) {
        console.warn("[小剧场] 失联角色检测失败", e);
      }
    }, 600);
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    rangeSelectMode = false;
    rangeSelectAnchor = null;
    rangeSelectAnchorPids = [];
  }

  function exitFocusMode() {
    const $panel = $("#" + PANEL_ID);
    if (!$panel.hasClass("ms-focus-mode")) return;
    const el = $panel[0];
    $panel.removeClass("ms-focus-mode");
    applyUICustomization();
    const saved = $panel.data("ms-focus-saved-pos");
    if (saved) {
      if (saved.left) el.style.setProperty("left", saved.left, "important");
      else el.style.removeProperty("left");
      if (saved.top) el.style.setProperty("top", saved.top, "important");
      else el.style.removeProperty("top");
      if (saved.transform)
        el.style.setProperty("transform", saved.transform, "important");
      else el.style.removeProperty("transform");
      data.settings.panelPos = saved.panelPos || null;
      saveData();
    } else {
      el.style.removeProperty("left");
      el.style.removeProperty("top");
      el.style.removeProperty("transform");
    }
    $panel.removeData("ms-focus-saved-pos");
  }

  function updateInjectIndicator() {
    var $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    var $ind = $p.find("#ms-inject-indicator");
    if (!data.settings.stageInjectEnabled) {
      $ind.removeClass("visible").empty();
      return;
    }
    var sids = data.settings.stageSelectedIds || [];
    sids = sids.filter(function (sid) {
      return getPrompt(sid);
    });
    if (sids.length !== (data.settings.stageSelectedIds || []).length) {
      data.settings.stageSelectedIds = sids;
      saveData();
    }
    if (sids.length > 0) {
      var label =
        sids.length === 1
          ? esc(truncate(getPrompt(sids[0]).title, 16))
          : "已选 " + sids.length + " 条";
      $ind
        .html('<i class="fa-solid fa-syringe"></i><span>' + label + "</span>")
        .addClass("visible");
    } else if (
      data.settings.randomInject &&
      data.settings.randomInject.enabled
    ) {
      var poolCount = data.prompts.filter(function (p) {
        return isInRandomPool(p);
      }).length;
      $ind
        .html(
          '<i class="fa-solid fa-dice"></i><span>随机 ' +
            poolCount +
            "条</span>",
        )
        .addClass("visible");
    } else {
      $ind.removeClass("visible").empty();
    }
  }
  function isInRandomPool(p) {
    var ri = data.settings.randomInject;
    if (!ri) return true;
    var effectiveGid =
      p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
    if (ri.excludedGroupIds && ri.excludedGroupIds.indexOf(effectiveGid) >= 0)
      return false;
    if (p.character) {
      var charG = getCharGroupOfChar(p.character);
      if (
        charG &&
        ri.excludedGroupIds &&
        ri.excludedGroupIds.indexOf(charG.id) >= 0
      ) {
        return false;
      }
    }
    var sn = String(p.series || "").trim();
    if (
      sn &&
      ri.excludedSeries &&
      ri.excludedSeries.some(function (s) {
        return s.groupId === effectiveGid && s.seriesName === sn;
      })
    )
      return false;
    if (ri.excludedPromptIds && ri.excludedPromptIds.indexOf(p.id) >= 0)
      return false;
    return true;
  }

  function buildStageContent(stagePrompts) {
    if (stagePrompts.length === 0) return "";
    if (stagePrompts.length === 1) {
      var pr = stagePrompts[0];
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var prefix = "";
      if (g && g.stagePrefix) prefix = g.stagePrefix;
      else if (data.settings.defaultStagePrefix)
        prefix = data.settings.defaultStagePrefix;
      var result = "";
      if (prefix) {
        if (/\{\{stage\}\}/i.test(prefix)) {
          result = prefix.replace(/\{\{stage\}\}/gi, function () {
            return pr.content;
          });
        } else {
          result = prefix + "\n" + pr.content;
        }
      } else {
        result = pr.content;
      }
      return result.replace(/\{\{stage_title\}\}/gi, pr.title || "");
    }
    var taskBlocks = [];
    stagePrompts.forEach(function (pr, idx) {
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var rawPrefix = "";
      if (g && g.stagePrefix) rawPrefix = g.stagePrefix;
      else if (data.settings.defaultStagePrefix)
        rawPrefix = data.settings.defaultStagePrefix;
      var innerPrefix = rawPrefix
        .replace(/^\s*<[A-Za-z_][\w-]*[^>]*>\s*\n?/, "")
        .replace(/\n?\s*<\/[A-Za-z_][\w-]*>\s*$/, "");
      var taskContent = "";
      if (innerPrefix) {
        if (/\{\{stage\}\}/i.test(innerPrefix)) {
          taskContent = innerPrefix.replace(/\{\{stage\}\}/gi, function () {
            return pr.content;
          });
        } else {
          taskContent = innerPrefix + "\n" + pr.content;
        }
      } else {
        taskContent = pr.content;
      }
      taskContent = taskContent.replace(/\{\{stage_title\}\}/gi, function () {
        return pr.title || "";
      });
      taskBlocks.push(
        "\u3010\u4efb\u52a1" + (idx + 1) + "\u3011\n" + taskContent,
      );
    });
    var tasksStr = taskBlocks.join("\n\n---\n\n");
    var wrapper = data.settings.multiStagePrefix || "";
    if (!wrapper || wrapper.indexOf("{{stage_tasks}}") < 0) {
      wrapper =
        "<stage>\n\u4ee5\u4e0b\u5171\u6709 {{stage_count}} \u4e2a\u72ec\u7acb\u5c0f\u5267\u573a\u4efb\u52a1\uff0c\u8bf7\u5728\u6b63\u6587\u6700\u540e\u6309\u987a\u5e8f\u9010\u4e00\u5b8c\u6210\uff0c\u6bcf\u6761\u5267\u573a\u5355\u72ec\u4f7f\u7528\u5bf9\u5e94\u683c\u5f0f\u5305\u88f9\u3002\n\n{{stage_tasks}}\n</stage>";
    }
    var allTitles = stagePrompts
      .map(function (p) {
        return p.title || "";
      })
      .join("、");
    var result = wrapper
      .replace(/\{\{stage_count\}\}/gi, function () {
        return String(stagePrompts.length);
      })
      .replace(/\{\{stage_tasks\}\}/gi, function () {
        return tasksStr;
      })
      .replace(/\{\{stage_title\}\}/gi, function () {
        return allTitles;
      });
    return result;
  }

  function getRandomStagePrompt() {
    var pool = data.prompts.filter(function (p) {
      return isInRandomPool(p);
    });
    if (pool.length === 0) return null;
    var now = Date.now();
    var weighted = pool.map(function (p) {
      var w = 1;
      if (p.lastUsedAt) {
        var hoursAgo = (now - p.lastUsedAt) / 3600000;
        if (hoursAgo < 1) w = 0.1;
        else if (hoursAgo < 6) w = 0.3;
        else if (hoursAgo < 24) w = 0.6;
        else if (hoursAgo < 72) w = 0.85;
      }
      return { p: p, w: w };
    });
    var totalW = 0;
    weighted.forEach(function (it) {
      totalW += it.w;
    });
    var r = Math.random() * totalW;
    var acc = 0;
    for (var i = 0; i < weighted.length; i++) {
      acc += weighted[i].w;
      if (r <= acc) return weighted[i].p;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function currentView() {
    return viewStack[viewStack.length - 1];
  }

  function navigateTo(view, reset) {
    if (
      currentView().name === "edit" &&
      editDirty &&
      view.name !== "quick-phrases"
    ) {
      msConfirm("编辑内容尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        editDirty = false;
        clearDraft();
        navigateTo(view, reset);
      });
      return;
    }
    editDirty = false;
    closeActiveDropdown();
    if (typeof _searchTimer !== "undefined" && _searchTimer) {
      clearTimeout(_searchTimer);
      _searchTimer = null;
    }
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (!reset) {
      currentView()._savedSearch = searchQuery;
      currentView()._savedFilter = JSON.parse(JSON.stringify(filterState));
      var $scrollBody = $("#" + PANEL_ID + " #ms-body");
      if ($scrollBody.length) {
        currentView()._savedScrollTop = $scrollBody.scrollTop();
      }
      var _openSeries = [];
      $("#" + PANEL_ID + " .ms-series-body.open").each(function () {
        _openSeries.push(this.id);
      });
      currentView()._expandedSeries = _openSeries;
      currentView()._filterPanelOpen = $(
        "#" + PANEL_ID + " #ms-filter-panel",
      ).hasClass("open");
    }
    if (view.name === "preview" && !view._siblingIds) {
      view._siblingIds = getVisiblePromptIds();
    }
    if (reset) {
      viewStack = [view];
      exitSelectMode();
    } else viewStack.push(view);
    searchQuery = "";
    filterState = {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      onlyCurrentChar: false,
    };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function navigateBack() {
    if (currentView().name === "edit" && editDirty) {
      msConfirm("编辑内容尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        editDirty = false;
        clearDraft();
        navigateBack();
      });
      return;
    }
    editDirty = false;
    closeActiveDropdown();
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (viewStack.length > 1) {
      var leavingView = viewStack.pop();
      if (leavingView.name === "preview" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
      if (leavingView.name === "edit" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
    }
    var restoredView = viewStack[viewStack.length - 1];
    searchQuery = restoredView._savedSearch || "";
    filterState = restoredView._savedFilter || {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      onlyCurrentChar: false,
    };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function countStats(text) {
    if (!text) return { chars: 0, lines: 0 };
    return { chars: text.length, lines: text.split("\n").length };
  }

  function getCSS() {
    return `
#${PANEL_ID}{--ms-accent:var(--SmartThemeFavColor,#c9957a);--ms-accent-rgb:201,149,122;--ms-danger:#a93226;--ms-danger-rgb:169,50,38;--ms-success:#3a8a3a;}
#${PANEL_ID}{position:fixed;z-index:9998;background-color:var(--SmartThemeBlurTintColor,#1a1a2e);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.45);display:none;flex-direction:column;color:var(--SmartThemeBodyColor,#ccc);font-family:inherit;font-size:14px;overflow:hidden;width:500px;max-width:92vw;max-height:82vh;min-width:320px;left:50%;top:60px;transform:translateX(-50%);}
#${PANEL_ID}.ms-visible{display:flex;}
#${PANEL_ID}.ms-collapsed .ms-body,#${PANEL_ID}.ms-collapsed .ms-toolbar,#${PANEL_ID}.ms-collapsed .ms-footer,#${PANEL_ID}.ms-collapsed .ms-filter-panel{display:none!important;}
#${PANEL_ID}.ms-collapsed .ms-header{border-bottom:none;padding:1px 10px;min-height:18px;}
#${PANEL_ID}.ms-collapsed .ms-hbtn{width:18px;height:18px;font-size:10px;}
.ms-header{display:flex;align-items:center;min-height:28px;padding:3px 10px;cursor:move;user-select:none;border-bottom:1px solid var(--SmartThemeBorderColor,#333);gap:6px;flex-shrink:0;touch-action:none;}
.ms-header .ms-drag-handle{color:var(--SmartThemeBodyColor,#888);font-size:12px;opacity:0.4;flex-shrink:0;}
.ms-header .ms-title{font-weight:600;font-size:14px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-header .ms-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;}
.ms-hbtn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:13px;flex-shrink:0;padding:0;transition:background 0.15s;}
.ms-hbtn:hover{background:rgba(255,255,255,0.08);}
.ms-toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;flex-wrap:wrap;}
.ms-search{flex:1;min-width:100px;padding:6px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:13px;font-family:inherit;outline:none;}
.ms-search:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-toolbar-actions{display:flex;gap:4px;margin-left:auto;flex-shrink:0;}
.ms-tbtn{padding:5px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;transition:background 0.15s,color 0.15s;}
.ms-tbtn:hover{background:rgba(255,255,255,0.06);}
.ms-tbtn.danger{color:var(--ms-danger);border-color:rgba(var(--ms-danger-rgb),0.3);}
.ms-tbtn.danger:hover{background:rgba(var(--ms-danger-rgb),0.08);border-color:var(--ms-danger);}
.ms-tbtn.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 0;min-height:80px;}
.ms-body::-webkit-scrollbar{width:5px;}
.ms-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} textarea::-webkit-scrollbar,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar{width:5px;}
#${PANEL_ID} textarea::-webkit-scrollbar-thumb,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} .ms-footer{padding:5px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;display:flex;flex-direction:row!important;align-items:center;justify-content:space-between;gap:6px;min-height:28px;flex-wrap:nowrap!important;overflow:hidden;}
#${PANEL_ID}:not(.ms-collapsed) .ms-footer[style*="block"]{display:flex!important;}
.ms-footer>span:first-child{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;}
#${PANEL_ID} .ms-footer-btns{display:flex;gap:6px;flex-shrink:0;flex-wrap:nowrap!important;white-space:nowrap;justify-content:flex-end;}
.ms-footer-btns a{color:var(--SmartThemeQuoteColor,#777);cursor:pointer;font-size:11px;text-decoration:none;transition:color 0.15s;white-space:nowrap;}
.ms-footer-btns a:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-batch-bar{display:flex;gap:4px;width:100%;align-items:center;flex-wrap:nowrap;}
.ms-batch-bar .ms-batch-count{font-size:12px;color:var(--SmartThemeBodyColor,#ccc);white-space:nowrap;margin-right:auto;}
.ms-batch-btn{padding:4px 7px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;transition:background 0.15s;white-space:nowrap;display:inline-flex;align-items:center;gap:3px;}
.ms-batch-btn:hover{background:rgba(255,255,255,0.06);}
.ms-batch-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-batch-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-nav-item{display:flex;align-items:center;padding:10px 14px;cursor:pointer;gap:10px;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-nav-item:hover{background:rgba(255,255,255,0.04);}
.ms-nav-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;contain:layout style paint;}
.ms-nav-icon img{content-visibility:auto;}
.ms-nav-info{flex:1;min-width:0;}
.ms-nav-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-nav-note{font-size:10px;color:var(--SmartThemeQuoteColor,#555);margin-top:1px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-nav-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;margin-left:auto;padding-left:8px;}
.ms-nav-chevron{color:var(--SmartThemeQuoteColor,#555);font-size:11px;flex-shrink:0;}
.ms-nav-sel-badge{font-size:9px;color:var(--ms-accent);flex-shrink:0;margin-left:4px;}
.ms-card{display:flex;flex-wrap:wrap;align-items:center;padding:8px 14px;gap:6px;transition:background 0.12s;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.03);position:relative;}
.ms-card:hover{background:rgba(255,255,255,0.04);}
.ms-reorder-item.ms-just-viewed{animation:ms-flash-highlight 1.5s ease-out;}
.ms-card.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-nav-item.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-series-group.ms-stage-injecting>.ms-series-header{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
@keyframes ms-flash-highlight{0%{background:rgba(var(--ms-accent-rgb),0.18);}100%{background:transparent;}}
.ms-card.selected{background:rgba(var(--ms-accent-rgb),0.1);}
.ms-card-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;}
.ms-card.selected .ms-card-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-card-star{flex-shrink:0;width:20px;text-align:center;cursor:pointer;}
.ms-card-star .fa-star{font-size:12px;color:var(--SmartThemeBorderColor,#3a3a3a);opacity:0.25;transition:all 0.15s;}
.ms-card-star.active .fa-star{color:var(--ms-accent);opacity:1;}
.ms-card-star:hover .fa-star{opacity:0.6;}
.ms-card-pin{flex-shrink:0;width:16px;text-align:center;font-size:10px;color:var(--ms-accent);opacity:0.7;}
.ms-card-info{flex:1;min-width:0;}
.ms-card-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-card-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.ms-card-series{font-size:10px;color:var(--ms-accent);opacity:0.75;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;}
.ms-card-series i{font-size:9px;flex-shrink:0;}
.ms-card-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);overflow:hidden;text-overflow:ellipsis;margin-top:2px;white-space:nowrap;}
.ms-card-preview.ms-has-search{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.ms-card-quick{display:flex;gap:2px;flex-shrink:0;}
.ms-card-qbtn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#666);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;transition:background 0.12s,color 0.12s;padding:0;}
.ms-card-qbtn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ccc);}
.ms-card-tags-row{width:100%;display:flex;justify-content:flex-end;gap:4px;flex-wrap:wrap;padding-left:38px;margin-top:-2px;}
.ms-card-tags-row{width:100%;display:flex;justify-content:flex-end;align-items:center;gap:4px;flex-wrap:wrap;padding-left:38px;margin-top:-2px;}
.ms-card-ts{font-size:9px;color:var(--SmartThemeQuoteColor,#666);opacity:0.7;display:inline-flex;align-items:center;gap:2px;margin-left:auto;white-space:nowrap;}
.ms-card-ts i{font-size:8px;}
.ms-tag-chip{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;line-height:1.4;color:#fff;white-space:nowrap;}
.ms-tag-chip-sm{font-size:8px;padding:0 4px;}
.ms-empty{text-align:center;padding:40px 20px;color:var(--SmartThemeQuoteColor,#555);font-size:13px;}
.ms-empty i{font-size:32px;opacity:0.25;display:block;margin-bottom:12px;}
.ms-cg-avatar{box-shadow:0 1px 3px rgba(0,0,0,0.2);}
.ms-cg-avatar img{display:block;}
#ms-birthday-banner button.ms-tbtn{background:rgba(255,255,255,0.04);}
#ms-birthday-banner button.ms-tbtn:hover{background:rgba(var(--ms-accent-rgb),0.15);}
@keyframes ms-bd-slidein{0%{transform:translateY(-100%) scale(0.95);opacity:0;}50%{transform:translateY(6px) scale(1.02);opacity:1;}75%{transform:translateY(-3px) scale(1);}100%{transform:translateY(0) scale(1);opacity:1;}}
@keyframes ms-bd-cake-dance{0%,100%{transform:rotate(0deg) scale(1);}20%{transform:rotate(-15deg) scale(1.1);}40%{transform:rotate(0deg) scale(1);}60%{transform:rotate(15deg) scale(1.1);}80%{transform:rotate(0deg) scale(1);}}
@keyframes ms-bd-avatar-pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,136,170,0.6),0 0 12px rgba(232,136,170,0.3);}50%{box-shadow:0 0 0 6px rgba(232,136,170,0),0 0 20px rgba(232,136,170,0.5);}}
@keyframes ms-bd-confetti-fall{0%{transform:translateY(-30px) translateX(0) rotate(0deg) scale(0.8);opacity:0;}8%{opacity:1;transform:translateY(0) translateX(calc(var(--swayX,0px) * 0.2)) rotate(40deg) scale(1);}25%{transform:translateY(50px) translateX(calc(var(--swayX,0px) * 0.5)) rotate(180deg) scale(1);}50%{transform:translateY(110px) translateX(var(--swayX,0px)) rotate(360deg) scale(1);}75%{transform:translateY(170px) translateX(calc(var(--swayX,0px) * 0.5)) rotate(540deg) scale(0.95);}92%{opacity:1;}100%{transform:translateY(220px) translateX(0) rotate(720deg) scale(0.7);opacity:0;}}
@keyframes ms-bd-bg-flow{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
@keyframes ms-bd-text-shimmer{0%{background-position:0% 50%;}100%{background-position:200% 50%;}}
.ms-bd-banner{position:relative;padding:12px 14px;background:linear-gradient(135deg,rgba(232,136,170,0.18),rgba(var(--ms-accent-rgb),0.12),rgba(255,200,150,0.15),rgba(232,136,170,0.18));background-size:300% 300%;border-bottom:1px solid rgba(232,136,170,0.35);display:flex;align-items:center;gap:10px;font-size:12px;animation:ms-bd-slidein 0.8s cubic-bezier(0.34,1.56,0.64,1),ms-bd-bg-flow 6s ease-in-out infinite;z-index:2;}
.ms-bd-confetti{position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;overflow:visible;z-index:0;}
.ms-bd-confetti-piece{position:absolute;top:0;animation:ms-bd-confetti-fall 3.5s ease-in-out infinite;pointer-events:none;filter:drop-shadow(0 0 3px currentColor);will-change:transform,opacity;}
.ms-bd-avatars{display:flex;align-items:center;flex-shrink:0;position:relative;z-index:1;}
.ms-bd-avatar-wrap{width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #e88aaa;background:rgba(232,136,170,0.15);margin-left:-8px;position:relative;animation:ms-bd-avatar-pulse 1.8s ease-in-out infinite;}
.ms-bd-avatar-wrap:first-child{margin-left:0;}
.ms-bd-avatar-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.ms-bd-avatar-fallback{display:flex;align-items:center;justify-content:center;color:#e88aaa;font-size:14px;}
.ms-bd-avatar-more{width:28px;height:28px;border-radius:50%;background:rgba(232,136,170,0.25);color:#e88aaa;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;margin-left:-6px;border:2px solid rgba(232,136,170,0.4);position:relative;z-index:0;flex-shrink:0;}
.ms-bd-cake{color:#e88aaa;font-size:18px;flex-shrink:0;display:inline-block;animation:ms-bd-cake-dance 1.6s ease-in-out infinite;transform-origin:bottom center;position:relative;z-index:1;}
.ms-bd-text{flex:1;position:relative;z-index:1;line-height:1.5;min-width:0;}
.ms-bd-text strong{background:linear-gradient(90deg,#e88aaa,var(--ms-accent),#ffb088,#e88aaa);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-weight:700;animation:ms-bd-text-shimmer 3s linear infinite;}
.ms-section-label{padding:10px 14px 4px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#666);text-transform:uppercase;letter-spacing:0.03em;}
.ms-divider{height:1px;background:var(--SmartThemeBorderColor,#333);margin:6px 14px;}
.ms-hl{background:rgba(var(--ms-accent-rgb),0.3);color:inherit;padding:0 1px;border-radius:2px;}
.ms-preview-content{padding:14px;line-height:1.7;font-size:13px;color:var(--SmartThemeBodyColor,#ccc);overflow-wrap:break-word;word-break:break-word;}
.ms-preview-content>:first-child{margin-top:0!important;}
.ms-preview-content h1{font-size:1.5em;font-weight:700;margin:0.7em 0 0.3em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h2{font-size:1.35em;font-weight:700;margin:0.6em 0 0.25em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h3{font-size:1.2em;font-weight:600;margin:0.5em 0 0.2em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h4{font-size:1.08em;font-weight:600;margin:0.4em 0 0.15em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h5{font-size:0.95em;font-weight:600;margin:0.3em 0 0.1em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h6{font-size:0.85em;font-weight:600;margin:0.25em 0 0.1em;color:var(--SmartThemeQuoteColor,#bbb);line-height:1.3;}
.ms-preview-content strong{color:var(--SmartThemeEmColor,var(--ms-accent));font-weight:700;}
.ms-preview-content em{color:var(--SmartThemeEmColor,var(--ms-accent));font-style:italic;}
.ms-preview-content u{text-decoration-color:var(--SmartThemeUnderlineColor,var(--ms-accent));}
.ms-preview-content del{opacity:0.5;}
.ms-preview-content .ms-quote-text{color:var(--SmartThemeQuoteColor,#999);}
.ms-md-link{color:var(--ms-accent);text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer;}
.ms-md-link:hover{opacity:0.8;}
.ms-md-img{max-width:100%;border-radius:6px;margin:4px 0;display:block;}
.ms-md-hr{border:none;border-top:1px solid var(--SmartThemeBorderColor,#444);margin:10px 0;}
.ms-md-table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px;}
.ms-md-table th,.ms-md-table td{border:1px solid var(--SmartThemeBorderColor,#444);padding:6px 10px;text-align:left;}
.ms-md-table th{background:rgba(255,255,255,0.04);font-weight:600;color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-table td{color:var(--SmartThemeBodyColor,#ccc);}
.ms-task{list-style:none;margin-left:0!important;display:flex;align-items:flex-start;gap:6px;padding:2px 0;}
.ms-task input[type="checkbox"]{margin-top:3px;flex-shrink:0;cursor:pointer;}
.ms-task-done{opacity:0.55;}
.ms-task-done>span,.ms-task-done>strong,.ms-task-done>em{text-decoration:line-through;}
.ms-preview-content blockquote{border-left:3px solid var(--SmartThemeQuoteColor,var(--ms-accent));background:var(--SmartThemeBlurTintColor,rgba(var(--ms-accent-rgb),0.05));padding:5px 10px;margin:0.3em 0;color:var(--SmartThemeQuoteColor,#999);font-style:italic;border-radius:0 4px 4px 0;}
.ms-preview-content li{margin-left:18px;margin-bottom:0;padding:0;line-height:1.6;}
.ms-preview-content code.ms-ic{background:var(--SmartThemeBlurTintColor,rgba(128,128,128,0.2));color:var(--SmartThemeEmColor,var(--ms-accent));border:1px solid var(--SmartThemeBorderColor,rgba(128,128,128,0.3));padding:1px 5px;border-radius:3px;font-size:12px;word-break:break-all;}
.ms-preview-content pre.ms-codeblock{background:var(--SmartThemeBlurTintColor,rgba(0,0,0,0.3));border:1px solid var(--SmartThemeBorderColor,#444);box-shadow:inset 0 0 10px var(--SmartThemeShadowColor,transparent);border-radius:6px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-size:12px;line-height:1.5;}
.ms-preview-content pre.ms-codeblock code{color:var(--SmartThemeBodyColor,#ccc);font-family:Consolas,"Courier New",monospace;white-space:pre-wrap;word-break:break-word;background:none;border:none;padding:0;border-radius:0;font-size:12px;}
.ms-details{margin:4px 0;}
.ms-summary{padding:2px 0px;cursor:pointer;font-weight:600;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);transition:background 0.15s;user-select:none;}
.ms-summary::marker{color:var(--ms-accent);}
.ms-summary::-webkit-details-marker{color:var(--ms-accent);}
.ms-summary:hover{opacity:0.8;}
.ms-details-body{padding:2px 0 2px 16px;line-height:1.7;}
.ms-details-body>:first-child{margin-top:0!important;}
.ms-pv-meta{flex:1;display:flex;flex-wrap:wrap;gap:4px;align-items:center;min-width:0;}
.ms-pv-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;color:var(--SmartThemeQuoteColor,#999);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);white-space:nowrap;}
.ms-pv-chip i{font-size:9px;flex-shrink:0;}
.ms-preview-actions{display:flex;gap:4px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-pa{padding:5px 12px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s;display:flex;align-items:center;gap:5px;}
.ms-pa:hover{background:rgba(255,255,255,0.06);}
.ms-pa.starred{color:var(--ms-accent);}
.ms-pa.danger:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-preview-send{display:flex;gap:4px;padding:8px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;}
.ms-send-btn{flex:1;padding:8px 4px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.03);color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;text-align:center;transition:background 0.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
.ms-send-btn:hover{background:rgba(255,255,255,0.08);}
.ms-send-btn i{margin-right:3px;}
.ms-form{padding:12px 14px;display:flex;flex-direction:column;gap:10px;}
.ms-form-edit{padding:10px 14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;flex:1;}
.ms-form-edit::-webkit-scrollbar{width:5px;}
.ms-form-edit::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-form-title{font-size:14px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-form-row{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.ms-field{display:flex;flex-direction:column;gap:3px;}
.ms-field label{font-size:12px;color:var(--SmartThemeQuoteColor,#888);font-weight:500;}
.ms-field input,.ms-field select,.ms-field textarea{padding:7px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:13px;font-family:inherit;outline:none;width:100%;box-sizing:border-box;}
.ms-field input,.ms-field select{height:33px;}
.ms-field input:focus,.ms-field select:focus,.ms-field textarea:focus{border-color:var(--SmartThemeQuoteColor,#777);}
.ms-field textarea{min-height:180px;max-height:60vh;resize:vertical;line-height:1.6;border-radius:0 0 8px 8px;overflow-y:auto;width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;}
.ms-content-field{position:relative!important;}
.ms-edit-scroll-top{position:absolute;bottom:48px;right:14px;width:28px;height:28px;border-radius:50%;background:transparent;border:none;color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:10;opacity:0.4;transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-edit-scroll-top:hover{background:rgba(var(--ms-accent-rgb,201,149,122),0.15);opacity:1;}
.ms-edit-scroll-top.visible{display:flex;}
.ms-edit-scroll-bottom{position:absolute;bottom:10px;right:14px;width:28px;height:28px;border-radius:50%;background:transparent;border:none;color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:10;opacity:0.4;transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-edit-scroll-bottom:hover{background:rgba(var(--ms-accent-rgb,201,149,122),0.15);opacity:1;}
.ms-edit-scroll-bottom.visible{display:flex;}
.ms-md-toolbar{display:flex;gap:2px;padding:2px 3px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;border-radius:8px 8px 0 0;flex-wrap:wrap;flex-shrink:0;}
.ms-md-btn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;border-radius:4px;font-size:12px;display:flex;align-items:center;justify-content:center;transition:background 0.12s,color 0.12s;}
.ms-md-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-btn.active{background:rgba(var(--ms-accent-rgb),0.2);color:var(--ms-accent);}
.ms-md-sep{width:1px;height:18px;background:var(--SmartThemeBorderColor,#444);margin:0 2px;flex-shrink:0;}
.ms-char-count{font-size:11px;color:var(--SmartThemeQuoteColor,#666);text-align:right;padding:2px 4px;flex-shrink:0;}
.ms-form-btns{display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;}
.ms-btn{padding:8px 20px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;transition:background 0.15s;}
.ms-btn:hover{background:rgba(255,255,255,0.06);}
.ms-btn.primary{background:var(--SmartThemeQuoteColor,#555);color:var(--SmartThemeBodyColor,#eee);border-color:var(--SmartThemeQuoteColor,#555);}
.ms-btn.primary:hover{filter:brightness(1.15);}
.ms-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-tag-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex-shrink:0;max-height:80px;overflow-y:auto;}
.ms-tag-toggle{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px solid var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#888);background:transparent;transition:all 0.15s;user-select:none;}
.ms-tag-toggle:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-tag-toggle.active{color:#fff;border-color:transparent;}
.ms-tag-toggle.ms-tag-excluded{border-style:dashed;border-color:var(--ms-danger);color:var(--ms-danger);text-decoration:line-through;background:rgba(var(--ms-danger-rgb),0.05);}
.ms-filter-mode-btn.ms-mode-exclude-active{background:rgba(var(--ms-danger-rgb),0.15);color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-tag-toggle .ms-tag-x{margin-left:2px;font-size:9px;opacity:0.6;}
.ms-add-tag-btn{padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px dashed var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#666);background:transparent;}
.ms-add-tag-btn:hover{border-color:var(--SmartThemeQuoteColor,#888);color:var(--SmartThemeBodyColor,#aaa);}
.ms-filter-panel{padding:8px 12px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);display:none;flex-direction:column;gap:6px;flex-shrink:0;max-height:30vh;overflow-y:auto;}
.ms-filter-panel.open{display:flex;}
.ms-filter-section{font-size:10px;color:var(--SmartThemeQuoteColor,#666);font-weight:600;text-transform:uppercase;margin-top:2px;}
.ms-gitem{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-gitem-color{width:16px;height:16px;border-radius:50%;flex-shrink:0;cursor:pointer;border:2px solid transparent;}
.ms-gitem-color:hover{border-color:rgba(255,255,255,0.3);}
.ms-gitem-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-gitem-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#666);}
.ms-gitem-btn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-gitem-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-gitem-btn.danger:hover{color:var(--ms-danger);}
.ms-gitem.ms-gitem-selected{background:rgba(var(--ms-accent-rgb),0.10);}
.ms-gitem-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-gitem.ms-gitem-selected .ms-gitem-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-color-picker{display:flex;gap:5px;flex-wrap:wrap;padding:8px 14px;}
.ms-color-opt{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;}
.ms-color-opt:hover{border-color:rgba(255,255,255,0.4);}
.ms-color-opt.selected{border-color:#fff;}
.ms-color-custom{background:conic-gradient(from 45deg,hsl(0,55%,68%),hsl(45,55%,68%),hsl(90,55%,68%),hsl(150,55%,68%),hsl(210,55%,68%),hsl(270,55%,68%),hsl(330,55%,68%),hsl(360,55%,68%))!important;position:relative;overflow:hidden;box-shadow:inset 0 0 2px rgba(0,0,0,0.3);}
.ms-color-custom input[type="color"]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;margin:0;}
.ms-color-custom::after{content:"+";color:#fff;font-size:13px;font-weight:bold;text-shadow:0 0 3px rgba(0,0,0,0.7);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;line-height:1;}
.ms-color-custom.selected::after{content:"✓";}
.ms-color-inline{display:flex;gap:5px;flex-wrap:wrap;padding:6px 14px 6px 50px;border-bottom:1px solid rgba(255,255,255,0.03);background:rgba(255,255,255,0.02);}
.ms-check-item{display:flex;align-items:center;gap:8px;padding:2px 14px;cursor:pointer;transition:background 0.12s;font-size:13px;}
.ms-check-item:hover{background:rgba(255,255,255,0.03);}
.ms-export-opts-tight{display:flex;flex-direction:column;gap:2px;}
.ms-import-opt{padding:12px 14px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;transition:background 0.15s,border-color 0.15s;margin-bottom:6px;}
.ms-import-opt:hover{background:rgba(255,255,255,0.04);border-color:var(--SmartThemeQuoteColor,#666);}
.ms-import-opt-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);}
.ms-import-opt-desc{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;}
.ms-dropdown{position:absolute;background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a));border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:5002;min-width:140px;padding:4px 0;display:none;max-height:60vh;overflow-y:auto;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.ms-dropdown::-webkit-scrollbar{width:4px;}
.ms-dropdown::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-dropdown-item{padding:7px 14px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:background 0.12s;white-space:nowrap;}
.ms-dropdown-item:hover{background:rgba(255,255,255,0.06);}
.ms-dropdown-item.active{color:var(--ms-accent);}
.ms-batch-tag-item{display:flex;align-items:center;gap:8px;padding:6px 12px;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-batch-tag-item:last-child{border-bottom:none;}
.ms-batch-tag-info{flex:1;display:flex;align-items:center;gap:6px;min-width:0;}
.ms-batch-tag-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;}
.ms-batch-tag-btn{width:24px;height:24px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px;transition:background 0.12s;flex-shrink:0;}
.ms-batch-tag-btn:hover{background:rgba(255,255,255,0.08);}
.ms-batch-tag-btn.add-btn:hover{color:var(--ms-success);border-color:var(--ms-success);}
.ms-batch-tag-btn.rm-btn:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-qp-item{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-qp-header{display:flex;align-items:center;padding:8px 14px;cursor:pointer;gap:8px;transition:background 0.12s;}
.ms-qp-header:hover{background:rgba(255,255,255,0.03);}
.ms-qp-header i.ms-qp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-qp-header i.ms-qp-arrow.open{transform:rotate(90deg);}
.ms-qp-header .ms-qp-title{flex:1;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-body{display:none;padding:6px 14px 10px 36px;font-size:12px;color:var(--SmartThemeQuoteColor,#999);line-height:1.5;overflow-wrap:break-word;word-break:break-word;}
.ms-qp-body.open{display:block;}
.ms-qp-insert{margin-top:6px;padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;}
.ms-qp-insert:hover{background:rgba(255,255,255,0.06);}
.ms-qp-popup{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#444);border-top:none;align-items:center;flex-shrink:0;max-height:120px;overflow-y:auto;}
.ms-qp-popup::-webkit-scrollbar{width:4px;}
.ms-qp-popup::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
@media(max-width:768px){.ms-qp-chip{padding:3px 8px;font-size:11px;max-width:140px;}}
.ms-qp-chip{padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.04);color:var(--SmartThemeBodyColor,#ccc);border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s,border-color 0.15s,color 0.15s;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-chip:hover{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-qp-chip:active{transform:scale(0.95);}
.ms-qp-popup-manage{font-size:11px;color:var(--SmartThemeQuoteColor,#777);cursor:pointer;margin-left:auto;white-space:nowrap;text-decoration:none;transition:color 0.15s;}
.ms-qp-popup-manage:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-imp-preview{padding:8px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:8px;margin:6px 0;}
.ms-imp-preview-title{font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:6px;}
.ms-imp-preview-list{font-size:11px;color:var(--SmartThemeQuoteColor,#999);line-height:1.6;}
.ms-imp-preview-list span{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;color:#fff;margin:1px 2px;}
.ms-exp-group-toggle{display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-exp-group-toggle:hover{background:rgba(255,255,255,0.03);}
.ms-exp-group-toggle i.ms-exp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-exp-group-toggle i.ms-exp-arrow.open{transform:rotate(90deg);}
.ms-exp-group-body{display:none;padding:4px 14px 8px 40px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.6;max-height:150px;overflow-y:auto;}
.ms-exp-group-body.open{display:block;}
.ms-exp-group-body::-webkit-scrollbar{width:4px;}
.ms-exp-group-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-exp-prompt-item{padding:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-reorder-item{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.12s;}
.ms-reorder-item:hover{background:rgba(255,255,255,0.03);}
.ms-reorder-item.ms-drag-over{box-shadow:inset 0 2px 0 0 var(--ms-accent);}
.ms-reorder-section-header.ms-drag-over{box-shadow:inset 0 0 0 2px var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.12)!important;}
.ms-char-section-grip:active{cursor:grabbing!important;}
.ms-reorder-grip{cursor:grab;color:var(--SmartThemeQuoteColor,#555);font-size:12px;flex-shrink:0;padding:4px;touch-action:none;}
.ms-reorder-grip:active{cursor:grabbing;}
.ms-reorder-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-reorder-arrows{display:flex;gap:2px;flex-shrink:0;}
.ms-reorder-arrows button{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-reorder-arrows button:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-history-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.12s;}
.ms-history-item:hover{background:rgba(255,255,255,0.04);}
.ms-history-info{flex:1;min-width:0;}
.ms-history-title{font-size:12px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-history-date{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;}
.ms-history-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.ms-history-actions{display:flex;gap:2px;flex-shrink:0;}
.ms-diff-header{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-diff-label{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
.ms-diff-label.old{background:rgba(238,85,85,0.10);color:#e88;}
.ms-diff-label.new{background:rgba(92,184,92,0.10);color:#7dce7d;}
.ms-diff-meta{padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-del-text{color:#e88;text-decoration:line-through;}
.ms-diff-add-text{color:#7dce7d;}
.ms-diff-stats{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;flex-wrap:wrap;}
.ms-diff-stat-add{color:#7dce7d;}
.ms-diff-stat-del{color:#e88;}
.ms-diff-stat-same{color:var(--SmartThemeQuoteColor,#888);}
.ms-diff-toggle{padding:2px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeQuoteColor,#888);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;margin-left:auto;transition:background 0.15s,color 0.15s;}
.ms-diff-toggle:hover{background:rgba(255,255,255,0.06);color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-toggle.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-diff-body{padding:0;font-size:12px;line-height:1.7;}
.ms-diff-line{display:flex;padding:1px 14px;min-height:22px;align-items:flex-start;transition:background 0.1s;}
.ms-diff-line.add{background:rgba(92,184,92,0.06);}
.ms-diff-line.del{background:rgba(238,85,85,0.06);}
.ms-diff-line.add:hover{background:rgba(92,184,92,0.12);}
.ms-diff-line.del:hover{background:rgba(238,85,85,0.12);}
.ms-diff-sign{width:20px;flex-shrink:0;text-align:center;font-weight:700;font-size:13px;line-height:1.7;user-select:none;}
.ms-diff-line.add .ms-diff-sign{color:#7dce7d;}
.ms-diff-line.del .ms-diff-sign{color:#e88;}
.ms-diff-line.same .ms-diff-sign{color:transparent;}
.ms-diff-text{flex:1;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;}
.ms-diff-line.add .ms-diff-text{color:#7dce7d;}
.ms-diff-line.del .ms-diff-text{color:#e88;text-decoration:line-through;opacity:0.8;}
.ms-diff-line.same .ms-diff-text{color:var(--SmartThemeBodyColor,#ccc);opacity:0.45;}
.ms-diff-body.ms-diff-changes-only .ms-diff-line.same{display:none;}
#${PANEL_ID} input[type="checkbox"]{-webkit-appearance:none;appearance:none;width:16px;height:16px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;background:transparent;cursor:pointer;position:relative;flex-shrink:0;transition:all 0.15s;vertical-align:middle;}
#${PANEL_ID} input[type="checkbox"]:checked{background:var(--ms-accent);border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]::before{content:none!important;}
#${PANEL_ID} input[type="checkbox"]::after{content:none!important;}
#${PANEL_ID} input[type="checkbox"]:checked::after{content:"\\2713"!important;position:absolute!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;color:#fff!important;font-size:10px!important;font-weight:bold!important;line-height:1!important;}#${PANEL_ID} input[type="checkbox"]:hover{border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]:disabled{opacity:0.4;cursor:default;}
#${PANEL_ID} input[type="checkbox"]:disabled:hover{border-color:var(--SmartThemeBorderColor,#555);}
#${PANEL_ID}.ms-drag-hover::before{content:"";position:absolute;inset:0;background:rgba(var(--ms-accent-rgb),0.08);border:2px dashed var(--ms-accent);border-radius:10px;z-index:5010;pointer-events:none;}
#${PANEL_ID}.ms-drag-hover::after{content:"\\f56f";font-family:"Font Awesome 6 Free";font-weight:900;position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);color:var(--ms-accent);font-size:32px;z-index:5011;pointer-events:none;opacity:0.7;}
.ms-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;}
.ms-stats-card{background:rgba(255,255,255,0.03);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;padding:14px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;overflow:hidden;}
.ms-stats-card .ms-stat-value{font-size:24px;font-weight:700;color:var(--SmartThemeBodyColor,#eee);line-height:1;}
.ms-stats-card .ms-stat-label{font-size:10px;color:var(--SmartThemeQuoteColor,#888);text-transform:uppercase;letter-spacing:0.05em;}
.ms-stats-card .ms-stat-icon{font-size:16px;margin-bottom:2px;opacity:0.5;}
.ms-stats-section{padding:10px 14px 4px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#666);text-transform:uppercase;letter-spacing:0.03em;}
.ms-stats-rank{padding:0 14px;}
.ms-stats-rank-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-stats-rank-item:last-child{border-bottom:none;}
.ms-stats-rank-pos{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.ms-stats-rank-pos.gold{background:rgba(255,215,0,0.15);color:#ffd700;}
.ms-stats-rank-pos.silver{background:rgba(192,192,192,0.12);color:#c0c0c0;}
.ms-stats-rank-pos.bronze{background:rgba(205,127,50,0.12);color:#cd7f32;}
.ms-stats-rank-pos.normal{background:rgba(255,255,255,0.05);color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-rank-info{flex:1;min-width:0;}
.ms-stats-rank-name{font-size:12px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-stats-rank-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#777);margin-top:1px;}
.ms-stats-rank-bar-wrap{width:60px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;flex-shrink:0;}
.ms-stats-rank-bar{height:100%;border-radius:3px;background:var(--ms-accent);transition:width 0.4s ease;}
.ms-stats-rank-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;min-width:28px;text-align:right;}
.ms-stats-group-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 14px 4px;}
.ms-stats-group-seg{height:100%;transition:width 0.4s ease;min-width:2px;}
.ms-stats-group-legend{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-group-legend-item{display:flex;align-items:center;gap:4px;}
.ms-stats-group-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.ms-stats-empty{text-align:center;padding:20px 14px;color:var(--SmartThemeQuoteColor,#555);font-size:12px;font-style:italic;}
.ms-series-group{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-series-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-series-check.ms-sc-all{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-series-check.ms-sc-some{border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-series-header{display:flex;align-items:center;padding:6px 14px 6px 10px;cursor:pointer;gap:6px;transition:background 0.12s;}
.ms-series-header:hover{background:rgba(255,255,255,0.03);}
.ms-series-arrow{font-size:9px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:10px;flex-shrink:0;}
.ms-series-arrow.open{transform:rotate(90deg);}
.ms-series-title{flex:1;font-size:12px;color:var(--SmartThemeBodyColor,#ddd);font-weight:500;}
.ms-series-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;}
.ms-series-body{display:none;border-left:2px solid rgba(var(--ms-accent-rgb),0.2);margin-left:14px;}
.ms-series-body.open{display:block;}
.ms-find-bar{display:flex;align-items:center;gap:4px;padding:4px 6px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;flex-shrink:0;flex-wrap:wrap;}
.ms-find-input{flex:1;padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:4px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;font-family:inherit;outline:none;min-width:60px;}
.ms-find-input:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-find-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);white-space:nowrap;min-width:32px;text-align:center;flex-shrink:0;}
.ms-find-count.no-match{color:var(--ms-danger);}
#${PANEL_ID}.ms-bd-editor-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-modal-expand-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal{width:680px!important;max-width:94vw!important;max-height:84vh!important;display:flex!important;flex-direction:column!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-textarea{min-height:200px!important;height:30vh!important;max-height:45vh!important;resize:vertical!important;overflow-y:auto!important;scrollbar-width:none;-ms-overflow-style:none;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-textarea::-webkit-scrollbar{width:0;display:none;}
#${PANEL_ID}.ms-focus-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-focus-mode .ms-header .ms-count{display:none;}
#${PANEL_ID}.ms-focus-mode .ms-body{overflow:hidden!important;padding:0!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit{padding:6px 10px!important;flex:1!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;min-height:0!important;gap:6px!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-field:not(.ms-content-field){display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-form-row{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field{flex:1!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field>label{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit textarea{flex:1!important;min-height:0!important;max-height:none!important;resize:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-edit-preview-pane{flex:1!important;min-height:0!important;max-height:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-char-count{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-form-btns{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode #ms-footer{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-filter-panel{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-toolbar .ms-form-title{display:none;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode{width:440px!important;max-width:92vw!important;height:auto!important;max-height:none!important;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-body,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-toolbar,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-footer,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-filter-panel{display:none!important;}
.ms-scroll-top{position:absolute;bottom:82px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);color: var(--ms-accent, var(--SmartThemeBodyColor, #aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-scroll-top:hover{background:rgba(255,255,255,0.1);}
.ms-scroll-top.visible{display:flex;}
.ms-scroll-bottom{position:absolute;bottom:44px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-scroll-bottom:hover{background:rgba(255,255,255,0.1);}
.ms-scroll-bottom.visible{display:flex;}
.ms-sub-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ms-accent);margin-left:3px;vertical-align:middle;animation:ms-sub-pulse 2s ease-in-out infinite;}
@keyframes ms-sub-pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
#${PANEL_ID}.ms-collapsed .ms-scroll-top,#${PANEL_ID}.ms-collapsed .ms-scroll-bottom{display:none!important;}
@media(max-width:768px){
  #${PANEL_ID}{width:92vw!important;left:50%!important;transform:translateX(-50%)!important;}
  .ms-modal-overlay .ms-modal{min-width:0!important;max-width:94%!important;}
  .ms-batch-bar .ms-batch-btn .ms-btn-label{display:none!important;}
  .ms-batch-bar .ms-batch-count{font-size:11px;}
  .ms-batch-bar{gap:3px;}
  .ms-batch-btn{padding:4px 8px;font-size:10px;}
  .ms-footer-btns{gap:5px;}.ms-footer-btns a{font-size:0!important;}.ms-footer-btns a i{font-size:12px!important;}
  #${PANEL_ID}.ms-focus-mode{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;top:0!important;left:0!important;transform:none!important;border-radius:0!important;}
}
@media(max-width:500px){.ms-search{flex:1 1 100%;}}
.ms-modal-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:6000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.18s ease;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}
.ms-modal-overlay.visible{opacity:1;pointer-events:auto;}
.ms-modal{background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a));border:1px solid var(--SmartThemeBorderColor,#444);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.5);min-width:280px;max-width:92%;max-height:86%;display:flex;flex-direction:column;transform:scale(0.94);transition:transform 0.18s ease;overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.ms-modal-overlay.visible .ms-modal{transform:scale(1);}
#${PANEL_ID} .ms-modal,
#${PANEL_ID} .ms-dropdown,
#${PANEL_ID} #ms-char-search-popup{
  background-image:var(--ms-panel-bg-image,none)!important;
  background-size:var(--ms-panel-bg-size,cover)!important;
  background-position:var(--ms-panel-bg-position,center)!important;
  background-repeat:var(--ms-panel-bg-repeat,no-repeat)!important;
  background-attachment:var(--ms-panel-bg-attachment,fixed)!important;
}
.ms-modal-header{padding:14px 16px 6px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
.ms-modal-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.ms-modal-icon.info{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);}
.ms-modal-icon.question{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);}
.ms-modal-icon.warning{background:rgba(196,140,40,0.15);color:#c47c20;}
.ms-modal-icon.danger{background:rgba(var(--ms-danger-rgb),0.15);color:var(--ms-danger);}
.ms-modal-icon.success{background:rgba(92,184,92,0.15);color:var(--ms-success);}
.ms-modal-title{font-size:14px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-modal-body{padding:6px 16px 14px;font-size:13px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;overflow-y:auto;flex:1;min-height:0;scrollbar-width:none;-ms-overflow-style:none;}
.ms-modal-body::-webkit-scrollbar{width:0;height:0;display:none;}
.ms-modal-message{white-space:pre-wrap;word-break:break-word;margin-bottom:6px;}
.ms-modal-input,.ms-modal-textarea{width:100%;padding:7px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:13px;font-family:inherit;outline:none;margin-top:8px;box-sizing:border-box;}
.ms-modal-textarea{min-height:80px;resize:vertical;line-height:1.5;}
.ms-modal-input:focus,.ms-modal-textarea:focus{border-color:var(--ms-accent);}
.ms-modal-search{width:100%;padding:6px 10px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;font-family:inherit;outline:none;margin-bottom:8px;box-sizing:border-box;}
.ms-modal-footer{padding:8px 16px 14px;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.ms-modal-btn{padding:6px 16px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#ccc);border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit;transition:background 0.15s;min-width:60px;}
.ms-modal-btn:hover{background:rgba(255,255,255,0.06);}
.ms-modal-btn.primary{background:var(--ms-accent);color:#fff;border-color:var(--ms-accent);}
.ms-modal-btn.primary:hover{filter:brightness(1.1);}
.ms-modal-btn.danger{color:#fff;background:var(--ms-danger);border-color:var(--ms-danger);}
.ms-modal-btn.danger:hover{filter:brightness(1.1);}
.ms-modal-list{display:flex;flex-direction:column;gap:2px;margin-top:4px;}
.ms-modal-list-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:background 0.12s;border:1px solid transparent;}
.ms-modal-list-item:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);}
.ms-modal-list-icon{width:28px;height:28px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);overflow:hidden;}
.ms-modal-list-icon img{width:100%;height:100%;object-fit:cover;}
.ms-modal-list-info{flex:1;min-width:0;}
.ms-modal-list-name{font-size:13px;color:var(--SmartThemeBodyColor,#ddd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-modal-list-desc{font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;}
.ms-lost-card{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-lost-card:hover{background:rgba(255,255,255,0.02);}
.ms-lost-meta{display:flex;align-items:flex-start;gap:10px;}
.ms-lost-icon{width:38px;height:38px;border-radius:6px;background:rgba(var(--ms-danger-rgb),0.10);color:var(--ms-danger);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;}
.ms-lost-info{flex:1;min-width:0;}
.ms-lost-name{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);}
.ms-lost-fname{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-lost-stats{font-size:11px;color:var(--SmartThemeBodyColor,#aaa);margin-top:4px;}
.ms-lost-samples{font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-top:4px;line-height:1.6;}
.ms-lost-samples>div{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-lost-badges{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;}
.ms-lost-badge{font-size:9px;padding:1px 6px;border-radius:3px;}
.ms-lost-actions{display:flex;gap:6px;margin-top:10px;justify-content:flex-end;}
.ms-switch{position:relative;display:inline-block;width:28px;height:14px;flex-shrink:0;vertical-align:middle;}
.ms-switch input{opacity:0;width:0;height:0;position:absolute;}
.ms-switch-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--SmartThemeBorderColor,#555);border-radius:14px;transition:0.25s;}
.ms-switch-slider:before{content:"";position:absolute;height:10px;width:10px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:0.25s;}
.ms-switch input:checked+.ms-switch-slider{background:var(--ms-accent);}
.ms-switch input:checked+.ms-switch-slider:before{transform:translateX(14px);}
.ms-filter-mode-btn{padding:1px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(var(--ms-accent-rgb),0.08);color:var(--ms-accent);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;transition:all 0.15s;line-height:1.4;}
.ms-filter-mode-btn:hover{background:rgba(var(--ms-accent-rgb),0.18);border-color:var(--ms-accent);}
.ms-inject-indicator{display:none;align-items:center;gap:4px;font-size:11px;color:var(--ms-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;flex-shrink:1;min-width:0;}
.ms-inject-indicator.visible{display:inline-flex;cursor:pointer;}
.ms-inject-indicator i{font-size:10px;flex-shrink:0;}
#${PANEL_ID}.ms-collapsed .ms-inject-indicator{max-width:140px;}
.ms-send-btn.ms-inject-active{background:rgba(var(--ms-accent-rgb),0.18)!important;border-color:var(--ms-accent)!important;color:var(--ms-accent)!important;box-shadow:inset 0 0 0 1px rgba(var(--ms-accent-rgb),0.3);}
.ms-rpool-group{border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-rpool-group-header{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;transition:background 0.12s;}
.ms-rpool-group-header:hover{background:rgba(255,255,255,0.03);}
.ms-rpool-group-body{padding:4px 8px 8px 18px;border-left:2px solid rgba(var(--ms-accent-rgb),0.15);margin-left:18px;}
.ms-rpool-item{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;cursor:pointer;}
.ms-rpool-item.disabled{opacity:0.35;pointer-events:none;}
.ms-rpool-series-label{display:flex;align-items:center;gap:5px;padding:5px 0 2px;font-size:12px;font-weight:500;cursor:pointer;user-select:none;}
.ms-rpool-series-items{padding-left:12px;}
.ms-rpool-excluded{opacity:0.4;text-decoration:line-through;}
.ms-inject-settings-row{display:flex;gap:8px;padding:6px 14px;align-items:center;flex-wrap:wrap;}
.ms-inject-radio{display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:all 0.15s;}
.ms-inject-radio:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-inject-radio.active{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-inject-radio input[type="radio"]{display:none;}
.ms-macro-info{padding:10px 14px;margin:6px 14px;background:rgba(var(--ms-accent-rgb),0.04);border:1px solid rgba(var(--ms-accent-rgb),0.12);border-radius:8px;font-size:11px;line-height:2;}
.ms-macro-info-title{font-weight:600;color:var(--SmartThemeBodyColor,#ddd);margin-bottom:2px;font-size:12px;}
.ms-macro-info code{background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);padding:2px 7px;border-radius:4px;font-size:11px;font-family:Consolas,"Courier New",monospace;border:1px solid rgba(var(--ms-accent-rgb),0.2);letter-spacing:0.3px;}
.ms-macro-info .ms-macro-desc{color:var(--SmartThemeQuoteColor,#999);margin-left:6px;}
`;
  }

  function getPanelHTML() {
    return `<div id="${PANEL_ID}">
      <div class="ms-header" id="ms-header">
        <i class="fa-solid fa-grip ms-drag-handle"></i>
        <span class="ms-title" id="ms-title">小剧场</span>
        <span class="ms-inject-indicator" id="ms-inject-indicator"></span><span class="ms-count" id="ms-count"></span>
        <button class="ms-hbtn" id="ms-btn-collapse" title="收起"><i class="fa-solid fa-window-minimize"></i></button><button class="ms-hbtn" id="ms-btn-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="ms-toolbar" id="ms-toolbar"></div>
      <div class="ms-filter-panel" id="ms-filter-panel"></div>
      <div class="ms-body" id="ms-body"></div>
      <div class="ms-footer" id="ms-footer"></div>
      <div class="ms-dropdown" id="ms-dropdown"></div>
      <input type="file" id="ms-file-input" accept=".json" style="display:none;"><button class="ms-scroll-top" id="ms-scroll-top" title="回到顶部"><i class="fa-solid fa-angle-up"></i></button><button class="ms-scroll-bottom" id="ms-scroll-bottom" title="回到底部"><i class="fa-solid fa-angle-down"></i></button></div>`;
  }

  function renderView() {
    if (bindReorderDrag._cleanup) {
      bindReorderDrag._cleanup();
      bindReorderDrag._cleanup = null;
    }
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    $p.find("#ms-count").text(data.prompts.length + " 条");
    $p.find("#ms-filter-panel").removeClass("open").empty();
    const v = currentView();
    const map = {
      "lost-chars": renderLostChars,
      list: renderList,
      group: renderGroup,
      starred: renderStarred,
      recent: renderRecent,
      characters: renderCharacters,
      character: renderCharacter,
      preview: renderPreview,
      edit: renderEdit,
      groups: renderGroups,
      "group-edit": renderGroupEdit,
      "tag-manage": renderTagManage,
      export: renderExport,
      "export-single-options": renderExportSingleOptions,
      "export-group-options": renderExportGroupOptions,
      "export-batch-options": renderExportBatchOptions,
      "import-confirm": renderImportConfirm,
      "quick-phrases": renderQuickPhrases,
      "quick-phrase-edit": renderQuickPhraseEdit,
      settings: renderSettings,
      stats: renderStats,
      "reorder-groups": renderReorderGroups,
      "reorder-prompts": renderReorderPrompts,
      "reorder-tags": renderReorderTags,
      history: renderHistory,
      "history-diff": renderHistoryDiff,
      "history-list": renderHistoryList,
      subscriptions: renderSubscriptions,
      "subscription-add": renderSubscriptionAdd,
      "subscription-detail": renderSubscriptionDetail,
      "random-pool": renderRandomPool,
    };
    if (map[v.name]) map[v.name](v);
    if ($p.find("#ms-footer").css("display") === "block")
      $p.find("#ms-footer").css("display", "flex");
    var $scrollBody = $p.find("#ms-body");
    if (v._expandedSeries && v._expandedSeries.length) {
      v._expandedSeries.forEach(function (sid) {
        var $sb = $p.find("#" + sid);
        if ($sb.length) {
          $sb.addClass("open");
          var $arrow = $sb.prev(".ms-series-header").find(".ms-series-arrow");
          if ($arrow.length) {
            $arrow[0].style.transition = "none";
            $arrow.addClass("open");
          }
        }
      });
      requestAnimationFrame(function () {
        $p.find(".ms-series-arrow").css("transition", "");
      });
    }
    if (
      v._filterPanelOpen &&
      (filterState.includeTags.length > 0 ||
        filterState.excludeTags.length > 0 ||
        filterState.groupId)
    ) {
      $p.find("#ms-filter-panel").html(buildFilterPanel()).addClass("open");
      bindFilterEvents($p);
    }
    if (v._savedScrollTop !== undefined && v._savedScrollTop > 0) {
      $scrollBody.scrollTop(v._savedScrollTop);
    } else {
      $scrollBody.scrollTop(0);
    }
    updateInjectIndicator();
    setTimeout(function () {
      $p.find("#ms-body").trigger("scroll");
    }, 100);
    if (v._lastViewedId) {
      setTimeout(function () {
        var $card = $p.find('.ms-card[data-pid="' + v._lastViewedId + '"]');
        if ($card.length) {
          $card.addClass("ms-just-viewed");
          var cardRect = $card[0].getBoundingClientRect();
          var bodyRect = $scrollBody[0].getBoundingClientRect();
          var relativeTop = cardRect.top - bodyRect.top;
          var cardH = $card.outerHeight();
          var bodyH = $scrollBody.height();
          if (relativeTop < 0 || relativeTop + cardH > bodyH) {
            $scrollBody.scrollTop(
              $scrollBody.scrollTop() + relativeTop - bodyH * 0.3,
            );
          }
        }
        delete v._lastViewedId;
      }, 50);
    }
  }

  function refreshKeepingState() {
    var $p = $("#" + PANEL_ID);
    var v = currentView();
    var $body = $p.find("#ms-body");
    if (v.name === "group" || v.name === "character") {
      var _openSeries = [];
      $body.find(".ms-series-body.open").each(function () {
        _openSeries.push(this.id);
      });
      v._expandedSeries = _openSeries;
      v._savedScrollTop = $body.scrollTop();
      renderView();
    } else {
      renderBodyOnly();
    }
  }
  function rerenderAfterSelectChange() {
    refreshKeepingState();
  }

  function renderBodyOnly() {
    const $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    const v = currentView(),
      $body = $p.find("#ms-body");
    var _openSeries = [];
    $body.find(".ms-series-body.open").each(function () {
      _openSeries.push(this.id);
    });
    var _scrollTop = $body.scrollTop();
    if (v.name === "list") {
      $body.html(buildListBody());
      if (selectMode) {
        $p.find("#ms-footer").html(buildBatchFooter()).show();
      } else if (
        searchQuery ||
        filterState.includeTags.length > 0 ||
        filterState.excludeTags.length > 0 ||
        filterState.groupId
      ) {
        var filteredList = sortPrompts(
          filterPrompts(searchPrompts(data.prompts, searchQuery)),
        );
        $p.find("#ms-footer")
          .html(
            "<span>找到 " +
              filteredList.length +
              " / " +
              data.prompts.length +
              " 条</span>",
          )
          .show();
      } else {
        $p.find("#ms-footer").html(buildListFooter()).show();
      }
    } else if (v.name === "group") {
      var $oldSearch = $p.find("#ms-search");
      var _searchWasFocused = $oldSearch.is(":focus");
      var _searchStart =
        _searchWasFocused && $oldSearch[0]
          ? $oldSearch[0].selectionStart || 0
          : 0;
      var _searchEnd =
        _searchWasFocused && $oldSearch[0]
          ? $oldSearch[0].selectionEnd || 0
          : 0;
      renderView();
      if (_searchWasFocused) {
        var $newSearch = $p.find("#ms-search");
        if ($newSearch.length) {
          $newSearch.focus();
          try {
            $newSearch[0].setSelectionRange(_searchStart, _searchEnd);
          } catch (e) {}
        }
      }
      return;
    } else if (v.name === "starred") {
      let f = sortPrompts(
        filterPrompts(searchPrompts(getStarredPrompts(), searchQuery)),
      );
      $body.html(
        buildRangeModeHint() +
          (f.length > 0
            ? renderPromptCards(f, true)
            : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`),
      );

      $p.find("#ms-footer")
        .html(
          selectMode ? buildBatchFooter() : `<span>${f.length} 条收藏</span>`,
        )
        .show();
    } else if (v.name === "recent") {
      const list = sortPrompts(
        filterPrompts(searchPrompts(getRecentPrompts(), searchQuery)),
      );
      $body.html(
        buildRangeModeHint() +
          (list.length > 0
            ? renderPromptCards(list, true)
            : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`),
      );

      $p.find("#ms-footer")
        .find("span:first")
        .text(list.length + " 条");
    } else if (v.name === "characters") {
      var $oldSearch = $p.find("#ms-search");
      var wasFocused = $oldSearch.is(":focus");
      var cursorPos =
        wasFocused && $oldSearch[0] ? $oldSearch[0].selectionStart || 0 : 0;
      renderCharacters(v);
      if (wasFocused) {
        var $newSearch = $p.find("#ms-search");
        $newSearch.focus();
        try {
          $newSearch[0].setSelectionRange(cursorPos, cursorPos);
        } catch (e) {}
      }
      return;
    }

    _openSeries.forEach(function (sid) {
      var $sb = $p.find("#" + sid);
      if ($sb.length) {
        $sb.addClass("open");
        var $arrow = $sb.prev(".ms-series-header").find(".ms-series-arrow");
        if ($arrow.length) {
          $arrow[0].style.transition = "none";
          $arrow.addClass("open");
        }
      }
    });
    if (_openSeries.length) {
      requestAnimationFrame(function () {
        $p.find(".ms-series-arrow").css("transition", "");
      });
    }
    $body.scrollTop(_scrollTop);
    setTimeout(function () {
      $body.trigger("scroll");
    }, 50);
    if ($p.find("#ms-footer").css("display") === "block")
      $p.find("#ms-footer").css("display", "flex");
  }
  function buildRangeModeHint() {
    if (!selectMode || !rangeSelectMode) return "";
    var vis = getVisiblePromptIds();
    var anchorValid = rangeSelectAnchor && vis.indexOf(rangeSelectAnchor) >= 0;
    return (
      '<div style="padding:8px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;"><i class="fa-solid fa-arrows-left-right-to-line" style="color:var(--ms-accent);margin-right:4px;"></i>范围模式：' +
      (anchorValid
        ? "已锚定，再次点选可扩展或收缩范围"
        : "点选第一项确定锚点") +
      ' · <span style="opacity:0.75;">长按某条目可改锚点到该处</span></div>'
    );
  }

  function buildBatchFooter() {
    const vis = getVisiblePromptIds();
    const allSelected =
      vis.length > 0 && vis.every((id) => selectedIds.has(id));
    const noneSelected = selectedIds.size === 0;
    const selIcon = allSelected
      ? "fa-solid fa-square-check"
      : noneSelected
        ? "fa-regular fa-square"
        : "fa-solid fa-square-minus";
    const selColor = noneSelected
      ? "var(--SmartThemeQuoteColor,#666)"
      : "var(--ms-accent)";
    const selLabel = allSelected ? " 取消" : " 全选";
    return `<div class="ms-batch-bar">
      <span class="ms-batch-count"><i class="fa-solid fa-list-check"></i> ${selectedIds.size}</span>
      <button class="ms-batch-btn" data-batch="selectall"><i class="${selIcon}" style="color:${selColor};"></i><span class="ms-btn-label">${selLabel}</span></button>
      <button class="ms-batch-btn" data-batch="move"><i class="fa-solid fa-folder-open"></i><span class="ms-btn-label"> 移动</span></button>
      <button class="ms-batch-btn" data-batch="tag"><i class="fa-solid fa-tags"></i><span class="ms-btn-label"> 标签</span></button>
      <button class="ms-batch-btn" data-batch="author"><i class="fa-solid fa-user-pen"></i><span class="ms-btn-label"> 作者</span></button>
      <button class="ms-batch-btn" data-batch="series"><i class="fa-solid fa-layer-group"></i><span class="ms-btn-label"> 系列</span></button>
      <button class="ms-batch-btn" data-batch="character"><i class="fa-solid fa-user-tag"></i><span class="ms-btn-label"> 角色</span></button>
      <button class="ms-batch-btn" data-batch="export"><i class="fa-solid fa-file-export"></i><span class="ms-btn-label"> 导出</span></button>
      <button class="ms-batch-btn danger" data-batch="delete"><i class="fa-solid fa-trash"></i><span class="ms-btn-label"> 删除</span></button>
    </div>`;
  }

  function buildListBody() {
    let html = buildRangeModeHint();
    if (
      searchQuery ||
      filterState.includeTags.length > 0 ||
      filterState.excludeTags.length > 0 ||
      filterState.groupId
    ) {
      let list = sortPrompts(
        filterPrompts(searchPrompts(data.prompts, searchQuery)),
      );
      if (list.length > 0) {
        html += `<div class="ms-section-label">${searchQuery ? "搜索" : "筛选"}结果 (${list.length})</div>`;
        if (
          !searchQuery &&
          filterState.groupId &&
          filterState.groupId !== "_ungrouped"
        ) {
          html += renderGroupBodyWithSeries(list);
        } else {
          html += renderPromptCards(list, true);
        }
      } else
        html = `<div class="ms-empty"><i class="fa-solid fa-magnifying-glass"></i>没有找到匹配的内容</div>`;
      return html;
    }
    const starred = getStarredPrompts();
    if (starred.length > 0)
      html += `<div class="ms-nav-item" data-nav="starred"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);"><i class="fa-solid fa-star"></i></div><div class="ms-nav-info"><div class="ms-nav-title">收藏</div></div><span class="ms-nav-cnt">${starred.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    const recent = getRecentPrompts();
    if (recent.length > 0)
      html += `<div class="ms-nav-item" data-nav="recent"><div class="ms-nav-icon" style="background:rgba(126,168,160,0.12);color:#7ea8a0;"><i class="fa-solid fa-clock-rotate-left"></i></div><div class="ms-nav-info"><div class="ms-nav-title">最近使用</div></div><span class="ms-nav-cnt">${recent.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    const charMap = getAllCharactersWithStages();
    const charCount = Object.keys(charMap).length;
    const currentCharForNav = getCurrentCharKeySafe();
    if (charCount > 0 || currentCharForNav) {
      html += `<div class="ms-nav-item" data-nav="characters"><div class="ms-nav-icon" style="background:rgba(180,140,200,0.12);color:#b48cc8;"><i class="fa-solid fa-user-tag"></i></div><div class="ms-nav-info"><div class="ms-nav-title">角色专属</div></div><span class="ms-nav-cnt">${charCount}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    }
    if (
      starred.length > 0 ||
      recent.length > 0 ||
      charCount > 0 ||
      currentCharForNav
    )
      html += '<div class="ms-divider"></div>';
    var _gpBuckets = {};
    data.prompts.forEach(function (p) {
      var k = p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
      if (!_gpBuckets[k]) _gpBuckets[k] = [];
      _gpBuckets[k].push(p);
    });
    var _selByGroup = {};
    if (selectMode) {
      selectedIds.forEach(function (pid) {
        var _p = getPrompt(pid);
        if (!_p) return;
        var _gk =
          _p.groupId && getGroup(_p.groupId) ? _p.groupId : "_ungrouped";
        _selByGroup[_gk] = (_selByGroup[_gk] || 0) + 1;
      });
    }
    data.groups.forEach((g) => {
      const groupPrompts = _gpBuckets[g.id] || [];
      const cnt = groupPrompts.length;
      const charSet = new Set();
      const seriesSet = new Set();
      groupPrompts.forEach(function (p) {
        if (p.character && isLocalCharKey(p.character))
          charSet.add(p.character);
        var sn = (p.series || "").trim();
        if (sn) seriesSet.add(sn);
      });
      const charCnt = charSet.size;
      const seriesCnt = seriesSet.size;
      const noteH = g.note
        ? `<div class="ms-nav-note">${esc(g.note)}</div>`
        : "";
      const selCnt = _selByGroup[g.id] || 0;
      const selBadge =
        selCnt > 0
          ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>`
          : "";
      var _gHasStage =
        (data.settings.stageSelectedIds || []).length > 0 &&
        data.prompts.some(function (pp) {
          return (
            (data.settings.stageSelectedIds || []).indexOf(pp.id) >= 0 &&
            pp.groupId === g.id
          );
        });
      var _useAvatar =
        isIPGroup(g) ||
        (g.iconMode === "custom" && g.iconUrl) ||
        (g.iconMode === "char" && g.iconCharKey);
      var _iconH = _useAvatar
        ? buildGroupAvatarHTML(g, 32)
        : `<div class="ms-nav-icon" style="background:${g.color}22;color:${g.color};"><i class="fa-solid fa-folder"></i></div>`;
      var cntParts = [];
      if (charCnt > 0)
        cntParts.push(
          '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-user" style="font-size:8px;opacity:0.7;"></i>' +
            charCnt +
            "</span>",
        );
      if (seriesCnt > 0)
        cntParts.push(
          '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-layer-group" style="font-size:8px;opacity:0.7;"></i>' +
            seriesCnt +
            "</span>",
        );
      cntParts.push(
        '<span style="display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-masks-theater" style="font-size:8px;opacity:0.7;"></i>' +
          cnt +
          "</span>",
      );
      var cntHtml =
        '<span class="ms-nav-cnt" style="display:inline-flex;align-items:center;gap:5px;font-size:10px;">' +
        cntParts.join('<span style="opacity:0.35;">·</span>') +
        "</span>";
      html += `<div class="ms-nav-item${_gHasStage ? " ms-stage-injecting" : ""}" data-nav="group" data-gid="${g.id}">${_iconH}<div class="ms-nav-info"><div class="ms-nav-title">${esc(g.name)}</div>${noteH}</div>${selBadge}${cntHtml}<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    });

    const ungrouped = _gpBuckets["_ungrouped"] || [];
    if (ungrouped.length > 0) {
      const selCnt = _selByGroup["_ungrouped"] || 0;
      const selBadge =
        selCnt > 0
          ? `<span class="ms-nav-sel-badge">(${selCnt}选中)</span>`
          : "";
      html += `<div class="ms-nav-item" data-nav="group" data-gid="_ungrouped"><div class="ms-nav-icon" style="background:rgba(255,255,255,0.05);color:var(--SmartThemeQuoteColor,#888);"><i class="fa-solid fa-inbox"></i></div><div class="ms-nav-info"><div class="ms-nav-title">未分组</div></div>${selBadge}<span class="ms-nav-cnt">${ungrouped.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
    }
    if (
      data.groups.length === 0 &&
      ungrouped.length === 0 &&
      starred.length === 0
    )
      html = `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>还没有小剧场<br>点击上方 + 新建</div>`;
    return html;
  }

  function buildListFooter() {
    var subDot =
      data.settings.subUpdatesPending > 0
        ? '<span class="ms-sub-dot"></span>'
        : "";
    var historyWarn = "";
    var hTotal = data.prompts.reduce(function (s, p) {
      return s + (p.history ? p.history.length : 0);
    }, 0);
    if (hTotal > 0) {
      var isWarn = data.settings.historyWarnEnabled && hTotal > 30;
      historyWarn =
        ' · <a data-action="history-list" style="color:' +
        (isWarn ? "var(--ms-danger)" : "var(--SmartThemeQuoteColor,#666)") +
        ';text-decoration:none;cursor:pointer;"' +
        (isWarn ? ' title="建议清理版本历史"' : "") +
        ">" +
        (isWarn ? "⚠" : "") +
        "历史" +
        hTotal +
        "条</a>";
    }
    return (
      "<span>" +
      data.prompts.length +
      " 条 · " +
      data.groups.length +
      " 组" +
      historyWarn +
      '</span><div class="ms-footer-btns"><a data-action="manage-groups"><i class="fa-solid fa-folder-open"></i>分组</a> <a data-action="manage-tags"><i class="fa-solid fa-tags"></i>标签</a> <a data-action="import"><i class="fa-solid fa-file-import"></i>导入</a> <a data-action="export"><i class="fa-solid fa-file-export"></i>导出</a> <a data-action="subscriptions"><i class="fa-solid fa-rss"></i>订阅' +
      subDot +
      '</a> <a data-action="settings"><i class="fa-solid fa-gear"></i>设置</a> </div>'
    );
  }

  function buildToolbar(opts) {
    let html = "";
    if (opts.back)
      html += `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button>`;
    if (opts.search !== false)
      html += `<div style="position:relative;flex:1;min-width:100px;display:flex;align-items:center;"><input class="ms-search" id="ms-search" type="text" placeholder="${opts.searchPlaceholder || "搜索..."}" value="${esc(searchQuery)}" style="flex:1;padding-right:24px;"><span id="ms-search-clear" style="position:absolute;right:8px;cursor:pointer;color:var(--SmartThemeQuoteColor,#666);font-size:11px;display:${searchQuery ? "block" : "none"};line-height:1;">×</span></div>`;
    html += `<div class="ms-toolbar-actions">`;
    if (opts.filter)
      html += `<button class="ms-tbtn" id="ms-btn-filter" title="筛选"><i class="fa-solid fa-filter"></i></button>`;
    if (opts.select && selectMode)
      html += `<button class="ms-tbtn ${rangeSelectMode ? "active" : ""}" id="ms-btn-range" title="范围选择"><i class="fa-solid fa-arrows-left-right-to-line"></i></button>`;
    if (opts.select)
      html += `<button class="ms-tbtn ${selectMode ? "active" : ""}" id="ms-btn-select" title="多选"><i class="fa-solid fa-check-double"></i></button>`;
    if (opts.sort)
      html += `<button class="ms-tbtn" id="ms-btn-sort" title="排序"><i class="fa-solid fa-arrow-down-short-wide"></i></button>`;
    if (opts.random && !selectMode)
      html += `<button class="ms-tbtn" id="ms-btn-random" title="随机抽取"><i class="fa-solid fa-dice"></i></button>`;
    if (opts.reorder)
      html += `<button class="ms-tbtn" id="ms-btn-reorder" title="调整顺序"><i class="fa-solid fa-arrows-up-down"></i></button>`;
    if (opts.exportGroup)
      html += `<button class="ms-tbtn" id="ms-btn-export-group" title="导出本组"><i class="fa-solid fa-file-export"></i></button>`;
    if (opts.add)
      html += `<button class="ms-tbtn" id="${opts.addId || "ms-btn-new"}" title="${opts.addTitle || "新建"}"><i class="fa-solid fa-plus"></i></button>`;
    html += `</div>`;
    if (opts.extra) html += opts.extra;
    return html;
  }

  function buildFilterPanel() {
    let html = "";
    const v = currentView();
    const inGroupView = v.name === "group";
    const inCharView = v.name === "character";
    const hasAnyFilter =
      filterState.includeTags.length > 0 ||
      filterState.excludeTags.length > 0 ||
      filterState.groupId;
    var _visibleTagIds = null;
    if (v.name === "group" || v.name === "character") {
      var _scopeList;
      if (v.name === "group") {
        _scopeList =
          v.groupId === "_ungrouped"
            ? getUngroupedPrompts()
            : getPromptsInGroup(v.groupId);
      } else {
        _scopeList = getPromptsByCharacter(v.charKey || v.charName);
      }
      _visibleTagIds = new Set();
      _scopeList.forEach(function (p) {
        (p.tags || []).forEach(function (tid) {
          _visibleTagIds.add(tid);
        });
      });
    }
    var _tagsToShow = _visibleTagIds
      ? data.settings.definedTags.filter(function (t) {
          return _visibleTagIds.has(t.id);
        })
      : data.settings.definedTags;

    if (_tagsToShow.length > 0) {
      var modeLabel =
        data.settings.filterTagMode === "and" ? "全部匹配" : "任一匹配";
      var excludeActive = filterState.tagSelectMode === "exclude";
      html += `<div class="ms-filter-section" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">标签筛选（可多选）<button class="ms-filter-mode-btn" id="ms-tag-mode-toggle">${modeLabel}</button><button class="ms-filter-mode-btn ${excludeActive ? "ms-mode-exclude-active" : ""}" id="ms-tag-exclude-toggle" title="开启后点击的标签将被排除"><i class="fa-solid fa-ban"></i> 排除模式${excludeActive ? "·开" : ""}</button>${hasAnyFilter ? '<button class="ms-filter-mode-btn" id="ms-clear-filter" style="margin-left:auto;color:var(--ms-danger);border-color:rgba(var(--ms-danger-rgb),0.3);background:rgba(var(--ms-danger-rgb),0.05);"><i class="fa-solid fa-broom"></i> 清空筛选</button>' : ""}</div><div class="ms-tag-row">`;
      _tagsToShow.forEach((t) => {
        const inc = filterState.includeTags.includes(t.id);
        const exc = filterState.excludeTags.includes(t.id);
        let cls = "",
          style = "";
        if (inc) {
          cls = "active";
          style = "background:" + t.color + ";";
        } else if (exc) {
          cls = "ms-tag-excluded";
        }
        html += `<span class="ms-tag-toggle ${cls}" data-filter-tag="${t.id}" style="${style}">${esc(t.name)}</span>`;
      });
      html += `</div>`;
    }
    if (!inGroupView && !inCharView) {
      html += `<div class="ms-filter-section">分组筛选</div><div class="ms-tag-row">`;
      html += `<span class="ms-tag-toggle ${!filterState.groupId ? "active" : ""}" data-filter-group="" style="${!filterState.groupId ? "background:#666;" : ""}">全部</span>`;
      data.groups.forEach((g) => {
        const a = filterState.groupId === g.id;
        html += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-filter-group="${g.id}" style="${a ? "background:" + g.color + ";" : ""}">${esc(g.name)}</span>`;
      });
      if (getUngroupedPrompts().length > 0) {
        const a = filterState.groupId === "_ungrouped";
        html += `<span class="ms-tag-toggle ${a ? "active" : ""}" data-filter-group="_ungrouped" style="${a ? "background:#666;" : ""}">未分组</span>`;
      }
      html += `</div>`;
    }
    var curK = getCurrentCharKeySafe();
    if (!inGroupView && !inCharView && curK) {
      var onlyCur = filterState.onlyCurrentChar;
      html += `<div class="ms-filter-section">当前角色</div><div class="ms-tag-row"><span class="ms-tag-toggle ${onlyCur ? "active" : ""}" id="ms-filter-only-current-char" style="${onlyCur ? "background:#b48cc8;" : ""}"><i class="fa-solid fa-user-check" style="margin-right:3px;font-size:10px;"></i>仅显示「${esc(getCharDisplayName(curK))}」专属</span></div>`;
    }
    return html;
  }

  function renderPromptCards(list, showGroupLabel) {
    if (list.length === 0)
      return `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无</div>`;
    const _parts = [];
    list.forEach((p) => {
      const starCls = p.starred ? "active" : "",
        starIcon = p.starred ? "fa-solid" : "fa-regular",
        isSel = selectedIds.has(p.id);
      const isStageTarget =
        (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
      const isAnchor =
        selectMode && rangeSelectMode && rangeSelectAnchor === p.id;
      const anchorH = isAnchor
        ? ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;margin-left:4px;" title="锚点"></i>'
        : "";
      const g = p.groupId ? getGroup(p.groupId) : null;
      var seriesAboveH = "";
      if (showGroupLabel) {
        var _metaParts = [];
        if (g) {
          var gIconH;
          var isIPG = isIPGroup(g);
          if (
            isIPG ||
            (g.iconMode === "custom" && g.iconUrl) ||
            (g.iconMode === "char" && g.iconCharKey)
          ) {
            gIconH =
              '<span style="display:inline-flex;vertical-align:middle;">' +
              buildGroupAvatarHTML(g, 14) +
              "</span>";
          } else {
            gIconH =
              '<i class="fa-solid fa-folder" style="font-size:9px;"></i>';
          }
          _metaParts.push(
            '<span style="color:' +
              g.color +
              ';display:inline-flex;align-items:center;gap:3px;">' +
              gIconH +
              (searchQuery ? highlightText(g.name, searchQuery) : esc(g.name)) +
              "</span>",
          );
          if (isIPG && p.character && isLocalCharKey(p.character)) {
            var charDn = getCharDisplayName(p.character);
            var charAp = getCharAvatarPathSafe(p.character);
            var charAvH = charAp
              ? '<img src="' +
                esc(charAp) +
                '" loading="lazy" style="width:12px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;" onerror="this.style.display=\'none\';this.onerror=null;">'
              : '<i class="fa-solid fa-user" style="font-size:9px;opacity:0.7;"></i>';
            _metaParts.push(
              '<span style="color:#b48cc8;display:inline-flex;align-items:center;gap:3px;">' +
                charAvH +
                esc(charDn) +
                "</span>",
            );
          }
        }

        if (p.series) {
          _metaParts.push(
            '<span style="color:var(--ms-accent);opacity:0.8;display:inline-flex;align-items:center;gap:2px;"><i class="fa-solid fa-layer-group" style="font-size:9px;"></i>' +
              (searchQuery
                ? highlightText(p.series, searchQuery)
                : esc(p.series)) +
              "</span>",
          );
        }
        if (_metaParts.length > 0) {
          seriesAboveH =
            '<div style="font-size:10px;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">' +
            _metaParts.join(
              '<span style="color:var(--SmartThemeQuoteColor,#555);margin:0 2px;">\u00b7</span>',
            ) +
            "</div>";
        }
      }
      const titleH = searchQuery
        ? highlightText(p.title, searchQuery)
        : esc(p.title);
      const prevH = searchQuery
        ? highlightText(
            getContextSnippet(p.content, searchQuery, 50),
            searchQuery,
          )
        : esc(truncate(p.content, 50));
      const pinH = p.pinned
        ? `<span class="ms-card-pin"><i class="fa-solid fa-thumbtack"></i></span>`
        : "";
      let tagsH = "";
      sortTagIds(p.tags || []).forEach((tid) => {
        const t = getTag(tid);
        if (t)
          tagsH += `<span class="ms-tag-chip ms-tag-chip-sm" style="background:${t.color};">${esc(t.name)}</span>`;
      });
      var _ts =
        p.updatedAt && p.updatedAt !== p.createdAt ? p.updatedAt : p.createdAt;
      var _tsH = "";
      if (_ts) {
        var _d = new Date(_ts);
        if (!isNaN(_d.getTime())) {
          var _now = new Date();
          var _isThisYear = _d.getFullYear() === _now.getFullYear();
          var _shortDate = _isThisYear
            ? String(_d.getMonth() + 1).padStart(2, "0") +
              "/" +
              String(_d.getDate()).padStart(2, "0")
            : String(_d.getFullYear()).slice(2) +
              "/" +
              String(_d.getMonth() + 1).padStart(2, "0") +
              "/" +
              String(_d.getDate()).padStart(2, "0");
          var _isEdited = p.updatedAt && p.updatedAt !== p.createdAt;
          _tsH =
            '<span class="ms-card-ts" title="' +
            (_isEdited ? "编辑" : "创建") +
            ": " +
            formatDate(_ts) +
            '"><i class="fa-solid ' +
            (_isEdited ? "fa-pen-to-square" : "fa-calendar-plus") +
            '"></i>' +
            _shortDate +
            "</span>";
        }
      }
      var _bottomRowH = "";
      if (tagsH || _tsH) {
        _bottomRowH =
          '<div class="ms-card-tags-row">' + (tagsH || "") + _tsH + "</div>";
      }
      if (selectMode) {
        _parts.push(
          `<div class="ms-card ${isSel ? "selected" : ""}${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><div class="ms-card-check"><i class="fa-solid fa-check"></i></div>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}${anchorH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div>`,
        );
        if (_bottomRowH) _parts.push(_bottomRowH);
        _parts.push(`</div>`);
      } else {
        _parts.push(
          `<div class="ms-card${isStageTarget ? " ms-stage-injecting" : ""}" data-pid="${p.id}"><span class="ms-card-star ${starCls}" data-pid="${p.id}"><i class="${starIcon} fa-star"></i></span>${pinH}<div class="ms-card-info">${seriesAboveH}<div class="ms-card-title">${titleH}</div><div class="ms-card-preview${searchQuery ? " ms-has-search" : ""}">${prevH}</div></div><div class="ms-card-quick"><button class="ms-card-qbtn" data-qaction="send" data-pid="${p.id}" title="填入输入框"><i class="fa-solid fa-right-to-bracket"></i></button><button class="ms-card-qbtn" data-qaction="send-gen" data-pid="${p.id}" title="发送并生成"><i class="fa-solid fa-paper-plane"></i></button></div><i class="fa-solid fa-angle-right" style="color:var(--SmartThemeQuoteColor,#555);font-size:10px;flex-shrink:0;"></i>`,
        );
        if (_bottomRowH) _parts.push(_bottomRowH);
        _parts.push(`</div>`);
      }
    });
    return _parts.join("");
  }

  function renderGroupBodyWithSeries(list) {
    if (searchQuery) return renderPromptCards(list, true);
    var rendered = new Set();
    var html = "";
    list.forEach(function (p) {
      if (rendered.has(p.id)) return;
      if (p.series && p.series.trim()) {
        var seriesName = p.series.trim();
        var seriesItems = list.filter(function (q) {
          return (
            q.series && q.series.trim() === seriesName && !rendered.has(q.id)
          );
        });
        if (seriesItems.length > 1) {
          var sid =
            "ms-series-" + simpleHash(seriesName + "||" + (p.groupId || ""));
          var headerExtra = "";
          var anchorBadge = "";
          if (selectMode) {
            var allSel = seriesItems.every(function (q) {
              return selectedIds.has(q.id);
            });
            var someSel =
              !allSel &&
              seriesItems.some(function (q) {
                return selectedIds.has(q.id);
              });
            var scCls = allSel ? " ms-sc-all" : someSel ? " ms-sc-some" : "";
            headerExtra =
              '<div class="ms-series-check' +
              scCls +
              "\" data-series-ids='" +
              JSON.stringify(
                seriesItems.map(function (q) {
                  return q.id;
                }),
              ) +
              "' data-series-key=\"" +
              esc(sid) +
              '"><i class="fa-solid ' +
              (someSel && !allSel ? "fa-minus" : "fa-check") +
              '"></i></div>';
            if (rangeSelectMode && rangeSelectAnchor === "series:" + sid) {
              anchorBadge =
                ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>';
            }
          }
          var _seriesHasStage =
            (data.settings.stageSelectedIds || []).length > 0 &&
            seriesItems.some(function (si) {
              return (data.settings.stageSelectedIds || []).indexOf(si.id) >= 0;
            });
          html +=
            '<div class="ms-series-group' +
            (_seriesHasStage ? " ms-stage-injecting" : "") +
            '"><div class="ms-series-header" data-series-id="' +
            sid +
            '">' +
            headerExtra +
            '<i class="fa-solid fa-angle-right ms-series-arrow"></i>' +
            '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:13px;"></i><span class="ms-series-title">' +
            esc(seriesName) +
            anchorBadge +
            '</span><span class="ms-series-cnt">' +
            seriesItems.length +
            " 条</span></div>" +
            '<div class="ms-series-body" id="' +
            sid +
            '">' +
            renderPromptCards(seriesItems, false) +
            "</div></div>";
          seriesItems.forEach(function (q) {
            rendered.add(q.id);
          });
        } else {
          if (p.series && p.series.trim()) {
            var fullSeriesCount = data.prompts.filter(function (q) {
              return (
                q.series &&
                q.series.trim() === seriesName &&
                q.groupId === p.groupId
              );
            }).length;
            if (fullSeriesCount > 1) {
              var sid2 =
                "ms-series-" +
                simpleHash(seriesName + "||" + (p.groupId || "") + "||_f");
              var headerExtra2 = "";
              var anchorBadge2 = "";
              if (selectMode) {
                var isSel2 = selectedIds.has(p.id);
                var scCls2 = isSel2 ? " ms-sc-all" : "";
                headerExtra2 =
                  '<div class="ms-series-check' +
                  scCls2 +
                  "\" data-series-ids='" +
                  JSON.stringify([p.id]) +
                  "' data-series-key=\"" +
                  esc(sid2) +
                  '"><i class="fa-solid fa-check"></i></div>';
                if (rangeSelectMode && rangeSelectAnchor === "series:" + sid2) {
                  anchorBadge2 =
                    ' <i class="fa-solid fa-anchor" style="color:var(--ms-accent);font-size:10px;" title="锚点"></i>';
                }
              }
              var _singleHasStage =
                (data.settings.stageSelectedIds || []).indexOf(p.id) >= 0;
              html +=
                '<div class="ms-series-group' +
                (_singleHasStage ? " ms-stage-injecting" : "") +
                '"><div class="ms-series-header" data-series-id="' +
                sid2 +
                '">' +
                headerExtra2 +
                '<i class="fa-solid fa-angle-right ms-series-arrow open"></i>' +
                '<i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:12px;"></i>' +
                '<span class="ms-series-title">' +
                esc(seriesName) +
                anchorBadge2 +
                "</span>" +
                '<span class="ms-series-cnt" style="opacity:0.6;">筛选 1/' +
                fullSeriesCount +
                "</span>" +
                '</div><div class="ms-series-body open" id="' +
                sid2 +
                '">' +
                renderPromptCards([p], false) +
                "</div></div>";
              rendered.add(p.id);
              return;
            }
          }
          html += renderPromptCards([p], false);
          rendered.add(p.id);
        }
      } else {
        html += renderPromptCards([p], false);
        rendered.add(p.id);
      }
    });
    return html;
  }

  function openDropdown($p, html, position) {
    const $dd = $p.find("#ms-dropdown");
    if ($dd.is(":visible")) {
      closeActiveDropdown();
      return null;
    }
    const panelH = $p[0].getBoundingClientRect().height;
    const ddMaxH = Math.max(150, panelH - 80);
    var pos = position || {};
    if (pos.anchor === "top") {
      $dd.css({
        top: pos.top || 80,
        right: pos.right !== undefined ? pos.right : 14,
        left: pos.left !== undefined ? pos.left : "auto",
        bottom: "auto",
        maxHeight: ddMaxH + "px",
        minWidth: pos.minWidth || "",
      });
    } else {
      $dd.css({
        bottom: pos.bottom !== undefined ? pos.bottom : 40,
        right: pos.right !== undefined ? pos.right : 14,
        left: pos.left !== undefined ? pos.left : "auto",
        top: "auto",
        maxHeight: ddMaxH + "px",
        minWidth: pos.minWidth || "",
      });
    }
    $dd.html(html).show();
    $p.css("overflow", "visible");
    setupOutsideClickClose($p);
    return $dd;
  }

  function showSortDropdown($p) {
    const modes = [
      ["custom", "自定义顺序"],
      ["created-desc", "最新创建"],
      ["created-asc", "最早创建"],
      ["edited-desc", "最新编辑"],
      ["edited-asc", "最早编辑"],
      ["name-asc", "名称 A→Z"],
      ["name-desc", "名称 Z→A"],
      ["used-desc", "最近使用"],
      ["used-asc", "最早使用"],
      ["usage-desc", "使用最多"],
      ["usage-asc", "使用最少"],
    ];
    var html = modes
      .map(
        (m) =>
          `<div class="ms-dropdown-item${(data.settings.sortMode || "created-desc") === m[0] ? " active" : ""}" data-sort="${m[0]}">${m[1]}</div>`,
      )
      .join("");
    var $dd = openDropdown($p, html, { anchor: "top" });
    if (!$dd) return;
    $dd.off("click").on("click.sort", ".ms-dropdown-item", function () {
      data.settings.sortMode = $(this).data("sort");
      saveData();
      closeActiveDropdown();
      renderBodyOnly();
    });
  }

  function showMoveDropdown($p) {
    let html = `<div class="ms-dropdown-item" data-moveto="">未分组</div>`;
    data.groups.forEach((g) => {
      html += `<div class="ms-dropdown-item" data-moveto="${g.id}">${esc(g.name)}</div>`;
    });
    html += `<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>`;
    html += `<div class="ms-dropdown-item" data-moveto="_new" style="color:var(--ms-accent);"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建分组</div>`;
    var $dd = openDropdown($p, html);
    if (!$dd) return;
    $dd.off("click").on("click.move", ".ms-dropdown-item", function () {
      const target = $(this).data("moveto");
      if (target === "_new") {
        closeActiveDropdown();
        msPrompt("", {
          title: "新建分组",
          placeholder: "请输入新分组名称",
          validate: function (v) {
            if (!v || !v.trim()) return "名称不能为空";
            return null;
          },
        }).then(function (name) {
          if (!name || !name.trim()) return;
          const ng = createGroup(name.trim());
          movePromptsToGroup([...selectedIds], ng.id);
          toast("success", `已创建分组并移动 ${selectedIds.size} 项`);
          exitSelectMode();
          renderView();
        });
        return;
      } else {
        movePromptsToGroup([...selectedIds], target || null);
        toast("success", `已移动 ${selectedIds.size} 项`);
      }
      exitSelectMode();
      closeActiveDropdown();
      renderView();
    });
  }

  function showBatchTagDropdown($p) {
    if ($p.find("#ms-dropdown").is(":visible")) {
      closeActiveDropdown();
      return;
    }
    if (data.settings.definedTags.length === 0) {
      toast("warning", "还没有标签，请先在标签管理中创建");
      return;
    }
    function buildTagContent() {
      let html = `<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量标签管理 · 已选 ${selectedIds.size} 项</div>`;
      data.settings.definedTags.forEach((t) => {
        let cnt = 0;
        selectedIds.forEach((pid) => {
          const p = getPrompt(pid);
          if (p && p.tags && p.tags.includes(t.id)) cnt++;
        });
        html += `<div class="ms-batch-tag-item">
          <div class="ms-batch-tag-info"><span class="ms-tag-chip" style="background:${t.color};">${esc(t.name)}</span><span class="ms-batch-tag-cnt">${cnt}/${selectedIds.size}</span></div>
          <button class="ms-batch-tag-btn add-btn" data-tagid="${t.id}" title="添加"><i class="fa-solid fa-plus"></i></button>
          <button class="ms-batch-tag-btn rm-btn" data-tagid="${t.id}" title="移除"><i class="fa-solid fa-minus"></i></button>
        </div>`;
      });
      html += `<div class="ms-batch-tag-item" style="border-top:1px solid var(--SmartThemeBorderColor,#444);">
        <div class="ms-batch-tag-info" style="cursor:pointer;color:var(--ms-accent);" id="ms-batch-new-tag"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>新建标签</div>
      </div>`;
      return html;
    }
    var $dd = openDropdown($p, buildTagContent(), { minWidth: "220px" });
    if (!$dd) return;
    $dd.off("click");
    $dd.on("click.btag", "#ms-batch-new-tag", function (e) {
      e.stopPropagation();
      msPrompt("", {
        title: "新建标签",
        placeholder: "请输入新标签名称",
        validate: function (v) {
          if (!v || !v.trim()) return "名称不能为空";
          return null;
        },
      }).then(function (name) {
        if (!name || !name.trim()) return;
        createTag(name.trim());
        $dd.html(buildTagContent());
        refreshKeepingState();
      });
    });
    var _btagRefreshTimer = null;
    $dd.on("click.btag", ".ms-batch-tag-btn", function (e) {
      e.stopPropagation();
      const tid = $(this).data("tagid");
      const isAdd = $(this).hasClass("add-btn");
      const tagObj = getTag(tid);
      let changed = 0;
      selectedIds.forEach((pid) => {
        const p = getPrompt(pid);
        if (!p) return;
        if (isAdd) {
          if (!p.tags.includes(tid)) {
            p.tags.push(tid);
            changed++;
          }
        } else {
          const before = p.tags.length;
          p.tags = p.tags.filter((id) => id !== tid);
          if (p.tags.length !== before) changed++;
        }
      });
      if (changed === 0) return;
      saveData();
      const $row = $dd
        .find('.ms-batch-tag-btn[data-tagid="' + tid + '"]')
        .closest(".ms-batch-tag-item");
      let cnt = 0;
      selectedIds.forEach((pid) => {
        const p = getPrompt(pid);
        if (p && p.tags && p.tags.includes(tid)) cnt++;
      });
      $row.find(".ms-batch-tag-cnt").text(cnt + "/" + selectedIds.size);
      if (_btagRefreshTimer) clearTimeout(_btagRefreshTimer);
      _btagRefreshTimer = setTimeout(function () {
        _btagRefreshTimer = null;
        refreshKeepingState();
      }, 400);
    });
  }

  function showBatchSeriesDropdown($p) {
    if ($p.find("#ms-dropdown").is(":visible")) {
      closeActiveDropdown();
      return;
    }
    const _selGroupIds = new Set();
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (p) _selGroupIds.add(p.groupId || null);
    });
    var scopePrompts = data.prompts.filter(function (p) {
      return _selGroupIds.has(p.groupId || null);
    });
    var sortedScope = sortPrompts(scopePrompts);

    var seriesOptions = [];
    var seenOptKey = new Set();
    sortedScope.forEach(function (p) {
      var sn = String(p.series || "").trim();
      if (!sn) return;
      var g = p.groupId ? getGroup(p.groupId) : null;
      var isIP = g && isIPGroup(g);
      var charKey =
        isIP && p.character && isLocalCharKey(p.character) ? p.character : null;
      var optKey = sn + "||" + (charKey || "_") + "||" + (p.groupId || "_");
      if (seenOptKey.has(optKey)) return;
      seenOptKey.add(optKey);
      seriesOptions.push({ name: sn, charKey: charKey });
    });
    var seriesNames = [];
    var seenNameKey = new Set();
    sortedScope.forEach(function (p) {
      var sn = String(p.series || "").trim();
      if (!sn || seenNameKey.has(sn)) return;
      seenNameKey.add(sn);
      seriesNames.push(sn);
    });

    let html =
      '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置系列 · 已选 ' +
      selectedIds.size +
      " 项</div>";
    html +=
      '<div class="ms-dropdown-item" data-series-action="rename-existing" style="color:var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);"><i class="fa-solid fa-pen-to-square" style="margin-right:6px;font-size:11px;"></i>重命名已有系列…</div>';
    html +=
      '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
    if (seriesOptions.length > 0) {
      seriesOptions.forEach(function (opt) {
        var charPart = "";
        var charDataAttr = "";
        if (opt.charKey) {
          var dn = getCharDisplayName(opt.charKey);
          var ap = getCharAvatarPathSafe(opt.charKey);
          var avH = ap
            ? '<img src="' +
              esc(ap) +
              '" loading="lazy" style="width:12px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;margin:0 4px 0 6px;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="font-size:9px;margin:0 4px 0 6px;color:#b48cc8;opacity:0.7;"></i>';
          charPart =
            avH +
            '<span style="font-size:10px;color:#b48cc8;opacity:0.85;">' +
            esc(truncate(dn, 10)) +
            "</span>";
          charDataAttr = ' data-series-charkey="' + esc(opt.charKey) + '"';
        }
        html +=
          '<div class="ms-dropdown-item" data-series-name="' +
          esc(opt.name) +
          '"' +
          charDataAttr +
          '><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;margin-right:6px;font-size:11px;"></i>' +
          esc(opt.name) +
          charPart +
          "</div>";
      });
      html +=
        '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
    }
    html +=
      '<div class="ms-dropdown-item" data-series-action="custom" style="color:var(--ms-accent);"><i class="fa-solid fa-pen" style="margin-right:6px;font-size:11px;"></i>自定义系列名</div>';
    html +=
      '<div class="ms-dropdown-item" data-series-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;font-size:11px;"></i>清除系列</div>';

    var $dd = openDropdown($p, html);
    if (!$dd) return;
    $dd.off("click").on("click.series", ".ms-dropdown-item", function () {
      const seriesName = $(this).data("series-name");
      const charKey = $(this).attr("data-series-charkey");
      const action = $(this).data("series-action");

      if (action === "rename-existing") {
        closeActiveDropdown();
        if (seriesNames.length === 0) {
          toast("info", "暂时没有任何系列名");
          return;
        }
        var listHtml =
          '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;">选择要重命名的系列（会改掉所有使用该系列名的剧场）：</div>';
        listHtml +=
          '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
        seriesNames.forEach(function (sn) {
          var cnt = data.prompts.filter(function (pp) {
            return (pp.series || "").trim() === sn;
          }).length;
          listHtml +=
            '<div class="ms-modal-list-item" data-rename-src="' +
            esc(sn) +
            '"><div class="ms-modal-list-icon" style="background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);"><i class="fa-solid fa-layer-group"></i></div><div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
            esc(sn) +
            '</div><div class="ms-modal-list-desc">' +
            cnt +
            " 条剧场使用</div></div></div>";
        });
        listHtml += "</div>";
        showModal({
          title: "重命名系列",
          iconType: "info",
          icon: "fa-pen-to-square",
          modalStyle: "min-width:340px;max-width:90vw;width:400px;",
          body: listHtml,
          buttons: [{ text: "取消", value: null }],
          cancelValue: null,
          onShow: function ($overlay, close) {
            $overlay.on("click", ".ms-modal-list-item", function () {
              var src = $(this).attr("data-rename-src");
              if (!src) return;
              close("done");
              setTimeout(function () {
                msPrompt("把「" + src + "」重命名为：", {
                  title: "新系列名",
                  defaultValue: src,
                  placeholder: "留空表示清除系列",
                  validate: function (v) {
                    return null;
                  },
                }).then(function (newName) {
                  if (newName === null) return;
                  newName = (newName || "").trim();
                  if (newName === src) {
                    toast("info", "没有变化");
                    return;
                  }
                  var changed = 0;
                  data.prompts.forEach(function (pp) {
                    if ((pp.series || "").trim() === src) {
                      pp.series = newName;
                      _invalidateLc(pp);
                      changed++;
                    }
                  });
                  saveData();
                  toast(
                    "success",
                    newName
                      ? "已把 " + changed + " 条改为「" + newName + "」"
                      : "已清除 " + changed + " 条的系列",
                  );
                  refreshKeepingState();
                });
              }, 200);
            });
          },
        });
        return;
      }

      if (action === "custom") {
        closeActiveDropdown();
        msPrompt("", {
          title: "自定义系列名",
          placeholder: "留空可清除系列",
        }).then(function (name) {
          if (name === null) return;
          selectedIds.forEach(function (pid) {
            const p = getPrompt(pid);
            if (p) {
              p.series = name.trim();
              _invalidateLc(p);
            }
          });
          saveData();
          toast(
            "success",
            name.trim() ? "已设置系列: " + name.trim() : "已清除系列",
          );
          refreshKeepingState();
        });
        return;
      } else if (action === "clear") {
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) {
            p.series = "";
            _invalidateLc(p);
          }
        });
        saveData();
        toast("success", "已清除 " + selectedIds.size + " 项的系列");
      } else if (seriesName !== undefined) {
        var charChanged = 0;
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (!p) return;
          p.series = seriesName;
          _invalidateLc(p);
          if (charKey) {
            var pg = p.groupId ? getGroup(p.groupId) : null;
            if (pg && isIPGroup(pg) && p.character !== charKey) {
              p.character = charKey;
              charChanged++;
            }
          }
        });
        if (charChanged > 0) _invalidateCharGroupCache();
        saveData();
        var msg = "已设置系列: " + seriesName;
        if (charChanged > 0) msg += "（" + charChanged + " 项已改绑到该角色）";
        toast("success", msg);
      }
      closeActiveDropdown();
      refreshKeepingState();
    });
  }

  function showBatchCharacterDropdown($p) {
    if ($p.find("#ms-dropdown").is(":visible")) {
      closeActiveDropdown();
      return;
    }
    if (selectedIds.size === 0) return;
    const curKey = getCurrentCharKeySafe();
    const curName = curKey ? getCharDisplayName(curKey) : "";
    let html =
      '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置角色 · 已选 ' +
      selectedIds.size +
      " 项</div>";
    if (curKey) {
      html +=
        '<div class="ms-dropdown-item" data-bchar-action="bind-current" style="color:var(--ms-accent);"><i class="fa-solid fa-user-check" style="margin-right:6px;"></i>绑定到当前角色 (' +
        esc(truncate(curName, 14)) +
        ")</div>";
    }
    html +=
      '<div class="ms-dropdown-item" data-bchar-action="search"><i class="fa-solid fa-magnifying-glass" style="margin-right:6px;"></i>搜索角色绑定</div>';
    html +=
      '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
    html +=
      '<div class="ms-dropdown-item" data-bchar-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;"></i>解绑全部</div>';
    var $dd = openDropdown($p, html, { minWidth: "200px" });
    if (!$dd) return;
    $dd.off("click").on("click.bchar", ".ms-dropdown-item", function () {
      const action = $(this).data("bchar-action");
      if (action === "bind-current") {
        if (!curKey) return;
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) p.character = curKey;
        });
        saveData();
        toast("success", "已绑定 " + selectedIds.size + " 项到 " + curName);
        closeActiveDropdown();
        refreshKeepingState();
      } else if (action === "clear") {
        selectedIds.forEach(function (pid) {
          const p = getPrompt(pid);
          if (p) p.character = "";
        });
        saveData();
        toast("success", "已解绑 " + selectedIds.size + " 项");
        closeActiveDropdown();
        refreshKeepingState();
      } else if (action === "search") {
        closeActiveDropdown();
        let allKeys = [];
        try {
          if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
            allKeys = SillyTavern.characters
              .map(function (c) {
                return c.avatar;
              })
              .filter(Boolean);
          }
        } catch (e) {}
        if (allKeys.length === 0)
          allKeys = Object.keys(getAllCharactersWithStages());
        if (allKeys.length === 0) {
          toast("warning", "没有可绑定的角色");
          return;
        }
        var ipInfo = null;
        try {
          var groupCount = {};
          selectedIds.forEach(function (pid) {
            var p = getPrompt(pid);
            if (!p || !p.groupId) return;
            groupCount[p.groupId] = (groupCount[p.groupId] || 0) + 1;
          });
          var topGid = null,
            topCnt = 0;
          Object.keys(groupCount).forEach(function (gid) {
            if (groupCount[gid] > topCnt) {
              topCnt = groupCount[gid];
              topGid = gid;
            }
          });
          if (topGid) {
            var _topG = getGroup(topGid);
            if (_topG && isIPGroup(_topG)) {
              ipInfo = { name: _topG.name, keys: getIPGroupCharKeys(_topG) };
            }
          }
        } catch (e) {}
        showModal({
          title: "绑定角色 (已选 " + selectedIds.size + " 项)",
          iconType: "info",
          icon: "fa-user-tag",
          modalStyle: "min-width:380px;max-width:90vw;width:420px;",
          body: function () {
            return (
              '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-batch-char-search">' +
              '<div id="ms-batch-char-list">' +
              buildCharPickerListHTML("", allKeys, null, ipInfo) +
              "</div>"
            );
          },
          buttons: [{ text: "取消", value: null }],
          cancelValue: null,
          onShow: function ($overlay, close) {
            $overlay.find("#ms-batch-char-search").focus();
            $overlay.on("input", "#ms-batch-char-search", function () {
              $overlay
                .find("#ms-batch-char-list")
                .html(
                  buildCharPickerListHTML($(this).val(), allKeys, null, ipInfo),
                );
            });
            $overlay.on("click", ".ms-modal-list-item", function () {
              var targetKey = $(this).attr("data-target-key");
              if (!targetKey) return;
              selectedIds.forEach(function (pid) {
                const p = getPrompt(pid);
                if (p) p.character = targetKey;
              });
              saveData();
              toast(
                "success",
                "已绑定 " +
                  selectedIds.size +
                  " 项到 " +
                  getCharDisplayName(targetKey),
              );
              close("done");
              refreshKeepingState();
            });
          },
        });
      }
    });
  }

  function showBatchAuthorDialog() {
    const $p = $("#" + PANEL_ID);
    if ($p.find("#ms-dropdown").is(":visible")) {
      closeActiveDropdown();
      return;
    }
    var groupIds = new Set();
    selectedIds.forEach(function (pid) {
      var p = getPrompt(pid);
      if (p && p.groupId) groupIds.add(p.groupId);
    });
    var authorsInGroups = new Set();
    data.prompts.forEach(function (p) {
      if (p.author && p.author.trim() && p.groupId && groupIds.has(p.groupId)) {
        authorsInGroups.add(p.author.trim());
      }
    });
    var allAuthors = new Set();
    data.prompts.forEach(function (p) {
      if (p.author && p.author.trim()) allAuthors.add(p.author.trim());
    });
    var sortedGroupAuthors = Array.from(authorsInGroups).sort();
    var sortedOtherAuthors = Array.from(allAuthors)
      .filter(function (a) {
        return !authorsInGroups.has(a);
      })
      .sort();

    let html =
      '<div style="padding:6px 12px;font-size:11px;font-weight:600;color:var(--SmartThemeQuoteColor,#888);border-bottom:1px solid var(--SmartThemeBorderColor,#444);">批量设置作者 · 已选 ' +
      selectedIds.size +
      " 项</div>";
    if (sortedGroupAuthors.length > 0) {
      html +=
        '<div style="padding:4px 12px 2px;font-size:10px;color:var(--ms-accent);font-weight:600;"><i class="fa-solid fa-folder" style="margin-right:3px;font-size:9px;"></i>本分组已有作者</div>';
      sortedGroupAuthors.forEach(function (name) {
        html +=
          '<div class="ms-dropdown-item" data-author-value="' +
          esc(name) +
          '"><i class="fa-solid fa-user" style="color:var(--ms-accent);opacity:0.6;margin-right:6px;font-size:11px;"></i>' +
          esc(name) +
          "</div>";
      });
    }
    if (sortedOtherAuthors.length > 0) {
      html +=
        '<div style="padding:4px 12px 2px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);font-weight:600;"><i class="fa-solid fa-list" style="margin-right:3px;font-size:9px;"></i>其他已有作者</div>';
      sortedOtherAuthors.forEach(function (name) {
        html +=
          '<div class="ms-dropdown-item" data-author-value="' +
          esc(name) +
          '"><i class="fa-solid fa-user" style="opacity:0.5;margin-right:6px;font-size:11px;"></i>' +
          esc(name) +
          "</div>";
      });
    }
    if (sortedGroupAuthors.length > 0 || sortedOtherAuthors.length > 0) {
      html +=
        '<div style="border-top:1px solid var(--SmartThemeBorderColor,#333);"></div>';
    }
    html +=
      '<div class="ms-dropdown-item" data-author-action="custom" style="color:var(--ms-accent);"><i class="fa-solid fa-pen" style="margin-right:6px;font-size:11px;"></i>自定义作者名</div>';
    html +=
      '<div class="ms-dropdown-item" data-author-action="clear" style="color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:6px;font-size:11px;"></i>清除作者</div>';

    var $dd = openDropdown($p, html, { minWidth: "200px" });
    if (!$dd) return;

    function applyAuthor(authorName) {
      selectedIds.forEach(function (pid) {
        var p = getPrompt(pid);
        if (p) {
          p.author = authorName;
          _invalidateLc(p);
        }
      });
      saveData();
      toast(
        "success",
        authorName
          ? "已为 " + selectedIds.size + " 项设置作者: " + authorName
          : "已清除 " + selectedIds.size + " 项的作者",
      );
      refreshKeepingState();
    }

    $dd.off("click").on("click.author", ".ms-dropdown-item", function () {
      var val = $(this).data("author-value");
      var action = $(this).data("author-action");
      if (action === "custom") {
        closeActiveDropdown();
        msPrompt("", {
          title: "自定义作者名",
          placeholder: "留空可清除作者",
          icon: "fa-user-pen",
        }).then(function (name) {
          if (name === null) return;
          applyAuthor(name.trim());
        });
        return;
      }
      if (action === "clear") {
        applyAuthor("");
      } else if (val !== undefined) {
        applyAuthor(String(val));
      }
      closeActiveDropdown();
    });
  }

  function buildCharPickerListHTML(kw, allKeys, currentKey, ipGroupInfo) {
    var lkw = (kw || "").trim().toLowerCase();
    var matched = allKeys.filter(function (k) {
      if (!lkw) return true;
      return (
        getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0 ||
        String(k).toLowerCase().indexOf(lkw) >= 0
      );
    });

    var ipKeys = [];
    var ipName = "";
    if (
      !lkw &&
      ipGroupInfo &&
      ipGroupInfo.keys &&
      ipGroupInfo.keys.length > 0
    ) {
      ipKeys = ipGroupInfo.keys.filter(function (k) {
        return allKeys.indexOf(k) >= 0;
      });
      ipName = ipGroupInfo.name || "";
    }

    if (matched.length === 0 && ipKeys.length === 0) {
      return '<div style="padding:20px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的角色</div>';
    }

    function renderOneChar(k, isFromIP) {
      var dn = getCharDisplayName(k);
      var fname = String(k).replace(/\.[^.]+$/, "");
      var ap = getCharAvatarPathSafe(k);
      var iconHtml = ap
        ? '<img src="' +
          esc(ap) +
          '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.onerror=null;">'
        : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:12px;"></i>';
      var isCur = currentKey === k;
      var extraBg = "";
      if (isCur) extraBg = "background:rgba(var(--ms-accent-rgb),0.15);";
      else if (isFromIP)
        extraBg = "background:rgba(var(--ms-accent-rgb),0.05);";
      return (
        '<div class="ms-modal-list-item" data-target-key="' +
        esc(k) +
        '" style="' +
        extraBg +
        '">' +
        '<div class="ms-modal-list-icon">' +
        iconHtml +
        "</div>" +
        '<div class="ms-modal-list-info">' +
        '<div class="ms-modal-list-name">' +
        esc(dn) +
        (isCur
          ? ' <i class="fa-solid fa-check" style="color:var(--ms-accent);font-size:10px;margin-left:4px;"></i>'
          : "") +
        "</div>" +
        '<div class="ms-modal-list-desc">' +
        esc(fname) +
        "</div>" +
        "</div></div>"
      );
    }

    var html =
      '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
    var shown = new Set();
    if (ipKeys.length > 0) {
      html +=
        '<div style="font-size:10px;color:var(--ms-accent);padding:6px 8px 4px;font-weight:600;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-layer-group" style="font-size:9px;"></i>本分组成员（' +
        esc(ipName) +
        "）</div>";
      ipKeys.forEach(function (k) {
        html += renderOneChar(k, true);
        shown.add(k);
      });
      html +=
        '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);padding:8px 8px 4px;font-weight:600;border-top:1px solid rgba(255,255,255,0.04);margin-top:4px;display:flex;align-items:center;gap:4px;"><i class="fa-solid fa-list" style="font-size:9px;"></i>全部角色</div>';
    }
    var cnt = 0;
    for (var i = 0; i < matched.length && cnt < 100; i++) {
      if (shown.has(matched[i])) continue;
      html += renderOneChar(matched[i], false);
      cnt++;
    }
    var remaining = matched.length - shown.size;
    if (remaining > 100) {
      html +=
        '<div style="padding:8px;text-align:center;font-size:10px;color:var(--SmartThemeQuoteColor,#666);">仅显示前 100 个，请输入关键词缩小范围</div>';
    }
    html += "</div>";
    return html;
  }

  function showBindCharacterDropdown($p, pid, onChangeCallback) {
    const pr = getPrompt(pid);
    if (!pr) return;
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
    if (allKeys.length === 0)
      allKeys = Object.keys(getAllCharactersWithStages());
    if (allKeys.length === 0) {
      toast("warning", "没有可绑定的角色");
      return;
    }
    var ipInfo = null;
    if (pr.groupId) {
      var g = getGroup(pr.groupId);
      if (g && isIPGroup(g)) {
        ipInfo = { name: g.name, keys: getIPGroupCharKeys(g) };
      }
    }
    showModal({
      title: "绑定角色：" + truncate(pr.title, 20),
      iconType: "info",
      icon: "fa-user-tag",
      modalStyle: "min-width:380px;max-width:90vw;width:420px;",
      body: function () {
        var curBindHtml = "";
        if (pr.character) {
          var _cbDn = getCharDisplayName(pr.character);
          var _cbAp = getCharAvatarPathSafe(pr.character);
          var _cbIcon = _cbAp
            ? '<img src="' +
              esc(_cbAp) +
              '" style="width:20px;height:20px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="font-size:11px;margin-right:4px;opacity:0.6;"></i>';
          curBindHtml =
            '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(var(--ms-accent-rgb),0.08);border:1px solid rgba(var(--ms-accent-rgb),0.2);border-radius:6px;margin-bottom:8px;font-size:12px;">' +
            '<span style="flex:1;">当前绑定：' +
            _cbIcon +
            esc(_cbDn) +
            "</span>" +
            '<button class="ms-tbtn" id="ms-bind-unbind-btn" style="padding:3px 10px;font-size:11px;color:var(--ms-danger);border-color:var(--ms-danger);"><i class="fa-solid fa-xmark" style="margin-right:3px;"></i>解绑</button>' +
            "</div>";
        }
        return (
          curBindHtml +
          '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-bind-char-search">' +
          '<div id="ms-bind-char-list">' +
          buildCharPickerListHTML("", allKeys, pr.character, ipInfo) +
          "</div>"
        );
      },
      buttons: [{ text: "取消", value: null }],
      cancelValue: null,
      onShow: function ($overlay, close) {
        $overlay.find("#ms-bind-char-search").focus();
        $overlay.on("input", "#ms-bind-char-search", function () {
          $overlay
            .find("#ms-bind-char-list")
            .html(
              buildCharPickerListHTML(
                $(this).val(),
                allKeys,
                pr.character,
                ipInfo,
              ),
            );
        });
        $overlay.on("click", "#ms-bind-unbind-btn", function () {
          updatePrompt(pid, { character: "" });
          toast("success", "已解绑");
          close("done");
          if (typeof onChangeCallback === "function") onChangeCallback();
        });
        $overlay.on("click", ".ms-modal-list-item", function () {
          var k = $(this).attr("data-target-key");
          if (!k) return;
          updatePrompt(pid, { character: k });
          recordRecentBoundChar(k);
          toast("success", "已绑定到 " + getCharDisplayName(k));
          close("done");
          if (typeof onChangeCallback === "function") onChangeCallback();
        });
      },
    });
  }

  function doRandomPick() {
    const ids = getVisiblePromptIds();
    if (ids.length === 0) {
      toast("warning", "当前没有可选的剧场");
      return;
    }
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    navigateTo({ name: "preview", promptId: randomId });
  }

  function bindAllEvents() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-body, #ms-toolbar, #ms-footer, #ms-filter-panel").off(".ms");
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
      $(this).data("ms-nav-press-time", Date.now());
      var $el = $(this);
      var sx = e.clientX || 0,
        sy = e.clientY || 0;
      var navTimer = setTimeout(function () {
        $el.data("ms-nav-lp-fired", true);
        if (navigator.vibrate) navigator.vibrate(30);
        navigateTo({ name: "group-edit", groupId: gid });
      }, 600);
      var onMove2 = function (ev) {
        var dx = (ev.clientX || 0) - sx,
          dy = (ev.clientY || 0) - sy;
        if (dx * dx + dy * dy > 100) {
          clearTimeout(navTimer);
          navTimer = null;
        }
      };
      var onUp2 = function () {
        if (navTimer) {
          clearTimeout(navTimer);
          navTimer = null;
        }
        $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp");
      };
      $p.off("pointermove.msnlp pointerup.msnlp pointercancel.msnlp")
        .on("pointermove.msnlp", onMove2)
        .on("pointerup.msnlp pointercancel.msnlp", onUp2);
    });
    $body.on("click.ms", ".ms-nav-item", function () {
      var nav = $(this).data("nav");
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

  function renderList() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("小剧场");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        search: true,
        searchPlaceholder: "搜索标题、内容或作者...",
        filter: true,
        select: true,
        sort: true,
        random: data.prompts.length > 0,
        add: true,
      }),
    );
    $p.find("#ms-body").html(buildListBody());
    $p.find("#ms-footer")
      .html(selectMode ? buildBatchFooter() : buildListFooter())
      .show();
    bindAllEvents();
  }

  function renderGroup(v) {
    const $p = $("#" + PANEL_ID),
      gid = v.groupId,
      isU = gid === "_ungrouped";
    const g = isU ? null : getGroup(gid),
      title = isU ? "未分组" : g ? g.name : "分组";
    const list = isU ? getUngroupedPrompts() : getPromptsInGroup(gid);
    const filtered = sortPrompts(
      filterPrompts(searchPrompts(list, searchQuery)),
    );
    const isIP = g && isIPGroup(g);
    $p.find("#ms-title").text(title);
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        filter: true,
        select: true,
        sort: true,
        random: list.length > 0,
        reorder: !isU && list.length > 1,
        exportGroup: !isU,
        add: true,
        addId: "ms-btn-new-in-group",
      }),
    );

    var bodyHtml = buildRangeModeHint();
    var hasAnyCharBind = list.some(function (p) {
      return p.character && isLocalCharKey(p.character);
    });
    var usingPartitioned =
      hasAnyCharBind &&
      !searchQuery &&
      filterState.includeTags.length === 0 &&
      filterState.excludeTags.length === 0 &&
      !filterState.onlyCurrentChar;

    if (isIP && !searchQuery) {
      var memberH =
        '<div style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
      var _memberKeys = getIPGroupCharKeys(g);
      memberH +=
        '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);"><i class="fa-solid fa-users" style="margin-right:3px;"></i>成员角色 (' +
        _memberKeys.length +
        ")</span>";
      _memberKeys.forEach(function (k) {
        var dn = getCharDisplayName(k);
        var ap = getCharAvatarPathSafe(k);
        var av = ap
          ? '<img src="' +
            esc(ap) +
            '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:3px;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="font-size:10px;margin-right:3px;opacity:0.6;"></i>';
        memberH +=
          '<span class="ms-tag-toggle" data-nav-char="' +
          esc(k) +
          '" title="点击查看 ' +
          esc(dn) +
          ' 的剧场，长按切换到 TA 的聊天档" style="padding:2px 8px;font-size:11px;cursor:pointer;">' +
          av +
          esc(dn) +
          "</span>";
      });
      memberH += "</div>";
      bodyHtml += memberH;
    }

    if (filtered.length === 0) {
      bodyHtml +=
        '<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>';
    } else if (usingPartitioned) {
      var generalPrompts = filtered.filter(function (p) {
        return !p.character;
      });
      var charPrompts = {};
      filtered.forEach(function (p) {
        if (p.character) {
          if (!charPrompts[p.character]) charPrompts[p.character] = [];
          charPrompts[p.character].push(p);
        }
      });
      if (generalPrompts.length > 0) {
        if (!data.settings.generalCollapsed)
          data.settings.generalCollapsed = {};
        var _genCollapsed = !!data.settings.generalCollapsed[gid];
        var _genSid = "ms-general-" + simpleHash(gid || "_");
        bodyHtml +=
          '<div class="ms-series-header" data-general-toggle="' +
          gid +
          '" data-general-body="' +
          _genSid +
          '" style="padding:6px 14px;background:rgba(var(--ms-accent-rgb),0.04);">' +
          '<i class="fa-solid fa-angle-right ms-series-arrow' +
          (_genCollapsed ? "" : " open") +
          '"></i>' +
          '<i class="fa-solid fa-scroll" style="color:var(--ms-accent);font-size:12px;opacity:0.8;"></i>' +
          '<span class="ms-series-title" style="font-weight:500;">通用剧场</span>' +
          '<span class="ms-series-cnt">' +
          generalPrompts.length +
          " 条</span></div>" +
          '<div class="ms-series-body' +
          (_genCollapsed ? "" : " open") +
          '" id="' +
          _genSid +
          '">' +
          renderGroupBodyWithSeries(generalPrompts) +
          "</div>";
      }
      var orderedKeys = [];
      var currentKey2 = getCurrentCharKeySafe();
      var _userOrder = g ? getCharDisplayOrder(g) : [];
      var _hasUserOrder =
        g && Array.isArray(g.charDisplayOrder) && g.charDisplayOrder.length > 0;
      if (!_hasUserOrder && currentKey2 && charPrompts[currentKey2]) {
        orderedKeys.push(currentKey2);
      }
      _userOrder.forEach(function (k) {
        if (orderedKeys.indexOf(k) < 0 && charPrompts[k]) orderedKeys.push(k);
      });
      Object.keys(charPrompts).forEach(function (k) {
        if (orderedKeys.indexOf(k) < 0) orderedKeys.push(k);
      });
      orderedKeys.forEach(function (k) {
        var ps = charPrompts[k];
        var dn = getCharDisplayName(k);
        var ap = getCharAvatarPathSafe(k);
        var sid = "ms-charsec-" + simpleHash(k);
        var avH = ap
          ? '<img src="' +
            esc(ap) +
            '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;" onerror="this.style.display=\'none\';this.onerror=null;">'
          : '<i class="fa-solid fa-user" style="font-size:11px;opacity:0.6;"></i>';
        var isCur = k === currentKey2;
        var cnt2 = ps.length;
        bodyHtml +=
          '<div class="ms-series-group">' +
          '<div class="ms-series-header" data-charsec-id="' +
          sid +
          '" style="padding:6px 14px;">' +
          '<i class="fa-solid fa-angle-right ms-series-arrow' +
          (isCur ? " open" : "") +
          '"></i>' +
          avH +
          '<span class="ms-series-title" style="font-weight:500;' +
          (isCur ? "color:var(--ms-accent);" : "") +
          '">' +
          esc(dn) +
          (isCur
            ? ' <span style="font-size:9px;opacity:0.7;">(当前)</span>'
            : "") +
          "</span>" +
          '<span class="ms-series-cnt">' +
          cnt2 +
          " 条</span>" +
          "</div>" +
          '<div class="ms-series-body' +
          (isCur ? " open" : "") +
          '" id="' +
          sid +
          '">' +
          renderGroupBodyWithSeries(ps) +
          "</div></div>";
      });
    } else {
      bodyHtml += renderGroupBodyWithSeries(filtered);
    }

    $p.find("#ms-body").html(bodyHtml);
    $p.find("#ms-footer")
      .html(
        selectMode
          ? buildBatchFooter()
          : `<span>${filtered.length}/${list.length} 条${isIP ? " · IP 分组" : ""}</span>` +
              (!isU
                ? `<div class="ms-footer-btns"><a data-action="group-settings"><i class="fa-solid fa-gear"></i> 分组设置</a></div>`
                : ``),
      )
      .show();
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-new-in-group", () =>
      navigateTo({
        name: "edit",
        promptId: null,
        defaultGroupId: isU ? null : gid,
      }),
    );
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-export-group", () => {
      if (!isU && gid) doExportGroup(gid);
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-reorder", () => {
      if (!isU && gid) navigateTo({ name: "reorder-prompts", groupId: gid });
    });
    $p.find("#ms-body").on(
      "pointerdown.ms",
      ".ms-tag-toggle[data-nav-char]",
      function (e) {
        var $el = $(this);
        var charKey = $el.data("nav-char");
        if (!charKey) return;
        var sx = e.clientX || 0,
          sy = e.clientY || 0;
        var timer = setTimeout(function () {
          timer = null;
          $el.data("ms-mblp-fired", true);
          if (navigator.vibrate) navigator.vibrate(30);
          try {
            if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
              var charIdx = SillyTavern.characters.findIndex(function (c) {
                return c && c.avatar === charKey;
              });
              if (
                charIdx >= 0 &&
                typeof SillyTavern.selectCharacterById === "function"
              ) {
                if (String(SillyTavern.characterId) === String(charIdx)) {
                  toast(
                    "info",
                    "现在就在「" + getCharDisplayName(charKey) + "」的聊天里哦",
                  );
                } else {
                  SillyTavern.selectCharacterById(charIdx);
                  toast(
                    "success",
                    "已切换到「" + getCharDisplayName(charKey) + "」的聊天",
                  );
                }
              } else {
                toast("warning", "本地没有这张角色卡");
              }
            } else {
              toast("warning", "无法切换角色");
            }
          } catch (err) {
            toast("error", "切换失败: " + err.message);
          }
        }, 600);
        var onMove = function (ev) {
          if (!timer) return;
          var dx = (ev.clientX || 0) - sx,
            dy = (ev.clientY || 0) - sy;
          if (dx * dx + dy * dy > 100) {
            clearTimeout(timer);
            timer = null;
          }
        };
        var onUp = function () {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          $p.off("pointermove.ms-mblp pointerup.ms-mblp pointercancel.ms-mblp");
        };
        $p.off("pointermove.ms-mblp pointerup.ms-mblp pointercancel.ms-mblp")
          .on("pointermove.ms-mblp", onMove)
          .on("pointerup.ms-mblp pointercancel.ms-mblp", onUp);
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-nav-char]", function () {
      if ($(this).data("ms-mblp-fired")) {
        $(this).removeData("ms-mblp-fired");
        return;
      }
      navigateTo({ name: "character", charKey: $(this).data("nav-char") });
    });

    $p.find("#ms-body").on("click.ms", "[data-general-toggle]", function () {
      var ggid = $(this).data("general-toggle");
      var bodyId = $(this).data("general-body");
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find("#" + bodyId).toggleClass("open");
      if (!data.settings.generalCollapsed) data.settings.generalCollapsed = {};
      data.settings.generalCollapsed[ggid] = !$p
        .find("#" + bodyId)
        .hasClass("open");
      saveData();
    });

    $p.find("#ms-body").on("click.ms", "[data-charsec-id]", function () {
      var sid = $(this).data("charsec-id");
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find("#" + sid).toggleClass("open");
    });
    if (!isU) {
      $p.find("#ms-footer").on(
        "click.ms",
        "[data-action='group-settings']",
        function () {
          navigateTo({ name: "group-edit", groupId: gid });
        },
      );
    }
  }

  function renderStarred() {
    const $p = $("#" + PANEL_ID),
      list = sortPrompts(
        filterPrompts(searchPrompts(getStarredPrompts(), searchQuery)),
      );
    $p.find("#ms-title").text("收藏");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        filter: true,
        select: true,
        sort: true,
        random: list.length > 0,
      }),
    );
    $p.find("#ms-body").html(
      buildRangeModeHint() +
        (list.length > 0
          ? renderPromptCards(list, true)
          : `<div class="ms-empty"><i class="fa-solid fa-star"></i>还没有收藏</div>`),
    );
    $p.find("#ms-footer")
      .html(
        selectMode ? buildBatchFooter() : `<span>${list.length} 条收藏</span>`,
      )
      .show();
    bindAllEvents();
  }

  function renderRecent() {
    const $p = $("#" + PANEL_ID),
      list = searchPrompts(getRecentPrompts(), searchQuery);
    $p.find("#ms-title").text("最近使用");
    $p.find("#ms-toolbar").html(buildToolbar({ back: true, search: true }));
    $p.find("#ms-body").html(
      list.length > 0
        ? renderPromptCards(list, true)
        : `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有记录</div>`,
    );
    $p.find("#ms-footer")
      .html(
        `<span>${list.length} 条</span><div class="ms-footer-btns">${list.length > 0 ? '<a data-action="clear-recent"><i class="fa-solid fa-broom"></i> 清空记录</a>' : ""}</div>`,
      )
      .show();
    bindAllEvents();
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-recent']",
      function () {
        msConfirm("确定清空所有最近使用记录吗？\n\n（不会影响使用次数统计）", {
          title: "清空最近使用",
          dangerous: true,
          okText: "清空",
        }).then(function (ok) {
          if (!ok) return;
          data.prompts.forEach(function (p) {
            p.lastUsedAt = null;
          });
          saveData();
          toast("success", "已清空");
          renderRecent();
        });
      },
    );
  }

  function renderCharacters() {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("角色专属");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        searchPlaceholder: "搜索角色名...",
      }),
    );
    const charMap = getAllCharactersWithStages();
    const currentKey = getCurrentCharKeySafe();
    const currentName = currentKey ? getCharDisplayName(currentKey) : null;
    let keys = Object.keys(charMap);
    if (searchQuery) {
      const lq = searchQuery.toLowerCase();
      keys = keys.filter(function (k) {
        return getCharDisplayName(k).toLowerCase().indexOf(lq) >= 0;
      });
    }
    keys.sort(function (a, b) {
      var au = 0,
        bu = 0;
      (charMap[a] || []).forEach(function (p) {
        au += p.usageCount || 0;
      });
      (charMap[b] || []).forEach(function (p) {
        bu += p.usageCount || 0;
      });
      if (au !== bu) return bu - au;
      return getCharDisplayName(a).localeCompare(getCharDisplayName(b));
    });
    let html = "";
    if (currentKey && !searchQuery) {
      const myList = charMap[currentKey] || [];
      if (myList.length > 0) {
        html += `<div class="ms-nav-item" data-nav-char-cur="exists" style="background:rgba(var(--ms-accent-rgb),0.06);"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.18);color:var(--ms-accent);"><i class="fa-solid fa-user-check"></i></div><div class="ms-nav-info"><div class="ms-nav-title">当前角色：${esc(currentName)}</div><div class="ms-nav-note">查看 ${myList.length} 条专属剧场</div></div><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
      } else {
        html += `<div class="ms-nav-item" data-nav-char-cur="empty" style="background:rgba(var(--ms-accent-rgb),0.06);"><div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.18);color:var(--ms-accent);"><i class="fa-solid fa-user-plus"></i></div><div class="ms-nav-info"><div class="ms-nav-title">为「${esc(currentName)}」创建专属</div><div class="ms-nav-note">还没有专属剧场，去新建一条？</div></div><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
      }
      html += '<div class="ms-divider"></div>';
    } else if (!currentKey && !searchQuery) {
      html += `<div style="padding:8px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);font-style:italic;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>当前未打开任何角色卡</div>`;
    }
    var _ipGroupsForList = getIPGroups();
    if (!searchQuery && _ipGroupsForList.length > 0) {
      html += '<div class="ms-section-label">IP 分组</div>';
      _ipGroupsForList.forEach(function (cg) {
        var charsInGroup = getIPGroupCharKeys(cg).filter(function (k) {
          return charMap[k];
        });
        var totalStages = 0;
        charsInGroup.forEach(function (k) {
          totalStages += (charMap[k] || []).length;
        });
        var avatar = buildGroupAvatarHTML(cg, 32);
        html +=
          '<div class="ms-nav-item" data-nav-cg="' +
          cg.id +
          '">' +
          avatar +
          '<div class="ms-nav-info"><div class="ms-nav-title">' +
          esc(cg.name) +
          "</div>" +
          '<div class="ms-nav-note">' +
          charsInGroup.length +
          " 个角色 · " +
          totalStages +
          " 条剧场</div></div>" +
          '<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>';
      });
      html += '<div class="ms-divider"></div>';
    }
    var groupedKeys = new Set();
    _ipGroupsForList.forEach(function (cg) {
      getIPGroupCharKeys(cg).forEach(function (k) {
        groupedKeys.add(k);
      });
    });
    var ungroupedKeys = keys.filter(function (k) {
      return !groupedKeys.has(k);
    });
    var hasCharGroups = _ipGroupsForList.length > 0;
    if (!searchQuery && hasCharGroups && ungroupedKeys.length > 0) {
      html += '<div class="ms-section-label">未分组角色</div>';
    }
    var displayKeys = searchQuery ? keys : hasCharGroups ? ungroupedKeys : keys;
    if (displayKeys.length === 0 && !hasCharGroups) {
      if (searchQuery) {
        html += `<div class="ms-empty"><i class="fa-solid fa-magnifying-glass"></i>没有匹配「${esc(searchQuery)}」的角色</div>`;
      } else {
        html += `<div class="ms-empty"><i class="fa-solid fa-user-tag"></i>还没有任何角色专属剧场<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">在剧场详情页可以绑定角色</span></div>`;
      }
    } else {
      displayKeys.forEach(function (key) {
        const list = charMap[key];
        const displayName = getCharDisplayName(key);
        const avatarPath = getCharAvatarPathSafe(key);
        let avatarH;
        if (avatarPath) {
          avatarH = `<div class="ms-nav-icon" style="padding:0;overflow:hidden;background:rgba(180,140,200,0.12);"><img src="${esc(avatarPath)}" loading="eager" decoding="sync" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.onerror=null;"></div>`;
        } else {
          avatarH = `<div class="ms-nav-icon" style="background:rgba(180,140,200,0.12);color:#b48cc8;"><i class="fa-solid fa-user"></i></div>`;
        }
        var totalUse = 0;
        list.forEach(function (p) {
          totalUse += p.usageCount || 0;
        });
        var nameH = searchQuery
          ? highlightText(displayName, searchQuery)
          : esc(displayName);
        var noteH =
          totalUse > 0
            ? `<div class="ms-nav-note">互动 ${totalUse} 次</div>`
            : "";
        var fnameTip = String(key).replace(/\.[^.]+$/, "");
        html += `<div class="ms-nav-item" data-nav-char="${esc(key)}" title="${esc(fnameTip)}">${avatarH}<div class="ms-nav-info"><div class="ms-nav-title">${nameH}</div>${noteH}</div><span class="ms-nav-cnt">${list.length}</span><i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>`;
      });
    }
    $p.find("#ms-body").html(html);
    const totalChars = Object.keys(charMap).length;
    const totalExclusive = data.prompts.filter(function (p) {
      return p.character && p.character.trim();
    }).length;
    $p.find("#ms-footer")
      .html(
        searchQuery
          ? `<span>找到 ${keys.length} / ${totalChars} 个角色</span>`
          : `<span>${totalChars} 个角色 · 共 ${totalExclusive} 条专属</span><div class="ms-footer-btns"><a data-action="manage-ipgroups"><i class="fa-solid fa-layer-group"></i> 管理 IP 分组</a></div>`,
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      "[data-nav-char-cur='exists']",
      function () {
        navigateTo({ name: "character", charKey: currentKey });
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      "[data-nav-char-cur='empty']",
      function () {
        navigateTo({
          name: "edit",
          promptId: null,
          defaultCharacter: currentKey,
        });
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-nav-char]", function () {
      navigateTo({ name: "character", charKey: $(this).data("nav-char") });
    });
    $p.find("#ms-body").on("click.ms", "[data-nav-cg]", function () {
      navigateTo({ name: "group", groupId: $(this).data("nav-cg") });
    });
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='manage-ipgroups']",
      function () {
        navigateTo({ name: "groups" });
      },
    );
  }

  function renderCharacter(v) {
    const $p = $("#" + PANEL_ID);
    const key = v.charKey || v.charName;
    const list = getPromptsByCharacter(key);
    if (list.length === 0) {
      navigateBack();
      return;
    }
    const filtered = sortPrompts(
      filterPrompts(searchPrompts(list, searchQuery)),
    );
    const displayName = getCharDisplayName(key);
    var charBd = (data.settings.charBirthdays || {})[key] || "";
    var charCg = getCharGroupOfChar(key);
    var isOwnBd = !!((data.settings.ownBirthdays || {})[key] === true);
    var canEditBd = !charBd || isOwnBd;
    var isBdToday = isCharBdToday(key);
    if (isBdToday) markTodayBirthdaysUnlocked();
    var bdVersions = getDisplayableBdVersions(key);
    var hasAnyBd = bdVersions.length > 0;
    var hasShowableBd = bdVersions.some(function (it) {
      return it.unlocked;
    });
    var hasOwnBdVer = bdVersions.some(function (it) {
      return it.data.isOwn === true;
    });
    var canShowPreview = hasShowableBd;
    var isLockedByDate = hasAnyBd && !hasShowableBd;
    $p.find("#ms-title").text(displayName);
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: true,
        filter: true,
        select: true,
        sort: true,
        random: list.length > 0,
        add: true,
        addId: "ms-btn-new-in-char",
      }),
    );
    $p.find("#ms-body").html(
      buildRangeModeHint() +
        (filtered.length > 0
          ? renderGroupBodyWithSeries(filtered)
          : `<div class="ms-empty"><i class="fa-solid fa-masks-theater"></i>暂无内容</div>`),
    );
    var metaParts = [];
    if (charCg)
      metaParts.push(
        '<span style="color:' +
          charCg.color +
          ';"><i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:2px;"></i>' +
          esc(charCg.name) +
          "</span>",
      );
    $p.find("#ms-footer")
      .html(
        selectMode
          ? buildBatchFooter()
          : "<span>" +
              filtered.length +
              "/" +
              list.length +
              " 条 · 角色专属" +
              (metaParts.length ? " · " + metaParts.join(" · ") : "") +
              '</span><div class="ms-footer-btns">' +
              (canEditBd
                ? '<a data-action="char-bd"><i class="fa-solid fa-cake-candles"></i> ' +
                  (charBd ? "改生日 " + esc(charBd) : "设生日") +
                  "</a>"
                : '<span style="color:var(--SmartThemeQuoteColor,#666);font-size:11px;font-style:italic;opacity:0.7;"><i class="fa-solid fa-cake-candles" style="margin-right:3px;font-size:9px;color:#e88;"></i>生日 ' +
                  esc(charBd) +
                  " (作者已锁定)</span>") +
              (canShowPreview
                ? ' <a data-action="char-bd-preview"><i class="fa-solid fa-eye"></i> 预览祝福</a>'
                : "") +
              ' <a data-action="char-bd-msg"><i class="fa-solid fa-envelope-open-text"></i> ' +
              (hasOwnBdVer ? "改祝福" : hasAnyBd ? "添加祝福" : "写祝福") +
              "</a>" +
              (isLockedByDate
                ? ' <span style="color:var(--SmartThemeQuoteColor,#666);font-size:10px;font-style:italic;opacity:0.7;margin-left:6px;">🎁 生日当天解锁</span>'
                : "") +
              "</div>",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-btn-new-in-char", function () {
      var parentGid = null;
      if (viewStack.length >= 2) {
        var parentView = viewStack[viewStack.length - 2];
        if (
          parentView &&
          parentView.name === "group" &&
          parentView.groupId &&
          parentView.groupId !== "_ungrouped"
        ) {
          var parentG = getGroup(parentView.groupId);
          if (parentG && isIPGroup(parentG)) {
            parentGid = parentView.groupId;
          }
        }
      }
      navigateTo({
        name: "edit",
        promptId: null,
        defaultCharacter: key,
        defaultGroupId: parentGid,
      });
    });
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='char-bd']",
      function () {
        var cur = (data.settings.charBirthdays || {})[key] || "";
        msPrompt(
          "输入「" +
            displayName +
            "」的生日\n\n格式 MM-DD（如 03-21），留空可清除",
          {
            title: "设置生日",
            icon: "fa-cake-candles",
            defaultValue: cur,
            placeholder: "MM-DD",
            validate: function (v) {
              v = (v || "").trim();
              if (!v) return null;
              if (!/^\d{2}-\d{2}$/.test(v))
                return "格式不对，要写成 MM-DD（例如 03-21）";
              var parts = v.split("-");
              var m = parseInt(parts[0]),
                d = parseInt(parts[1]);
              var maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
              if (m < 1 || m > 12 || d < 1 || d > maxDays[m - 1])
                return "日期不合理";
              return null;
            },
          },
        ).then(function (input) {
          if (input === null) return;
          var v = input.trim();
          var _savedScroll = $p.find("#ms-body").scrollTop();
          function _restoreScroll() {
            setTimeout(function () {
              $p.find("#ms-body").scrollTop(_savedScroll);
            }, 30);
          }
          if (!v) {
            delete data.settings.charBirthdays[key];
            if (data.settings.ownBirthdays)
              delete data.settings.ownBirthdays[key];
            saveData();
            toast("success", "已清除生日");
            renderCharacter(viewStack[viewStack.length - 1]);
            _restoreScroll();
            return;
          }
          if (!data.settings.charBirthdays) data.settings.charBirthdays = {};
          if (!data.settings.ownBirthdays) data.settings.ownBirthdays = {};
          data.settings.charBirthdays[key] = v;
          data.settings.ownBirthdays[key] = true;
          saveData();
          toast("success", "已设置生日: " + v);
          renderCharacter(viewStack[viewStack.length - 1]);
          _restoreScroll();
        });
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='char-bd-preview']",
      function () {
        showBirthdayMessageView(key, displayName);
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='char-bd-msg']",
      function () {
        showBirthdayMessageEditor(key, displayName);
      },
    );
  }

  function buildPvChip(iconCls, text, iconColor) {
    var colorCss = iconColor ? ";color:" + iconColor : "";
    return (
      '<span class="ms-pv-chip"><i class="fa-solid ' +
      iconCls +
      '" style="font-size:9px' +
      colorCss +
      ';"></i>' +
      esc(text) +
      "</span>"
    );
  }
  function renderPreview(v) {
    const $p = $("#" + PANEL_ID),
      pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    const siblingIds = v._siblingIds || [];
    const currentIdx = siblingIds.indexOf(pr.id);
    const prevId = currentIdx > 0 ? siblingIds[currentIdx - 1] : null;
    const nextId =
      currentIdx >= 0 && currentIdx < siblingIds.length - 1
        ? siblingIds[currentIdx + 1]
        : null;
    const g = pr.groupId ? getGroup(pr.groupId) : null,
      groupL = g ? g.name : "未分组";
    var metaChips = buildPvChip(
      "fa-folder",
      groupL,
      g ? g.color : "var(--SmartThemeQuoteColor,#888)",
    );
    if (pr.series)
      metaChips += buildPvChip("fa-layer-group", pr.series, "var(--ms-accent)");
    if (pr.author) metaChips += buildPvChip("fa-user", pr.author);
    const starIcon = pr.starred ? "fa-solid" : "fa-regular",
      starLabel = pr.starred ? "取消收藏" : "收藏",
      starCls = pr.starred ? " starred" : "";
    const pinLabel = pr.pinned ? "取消置顶" : "置顶",
      pinIcon = "fa-solid fa-thumbtack";
    let tagsH = "";
    sortTagIds(pr.tags || []).forEach((tid) => {
      const t = getTag(tid);
      if (t)
        tagsH += `<span class="ms-tag-chip" style="background:${t.color};margin-right:4px;">${esc(t.name)}</span>`;
    });
    const stats = countStats(pr.content);
    const historyCount = (pr.history || []).length;
    $p.find("#ms-title").text(pr.title);
    const navPosH =
      siblingIds.length > 1
        ? `<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;white-space:nowrap;">${currentIdx + 1}/${siblingIds.length}</span>`
        : "";
    const navPrevH =
      siblingIds.length > 1
        ? `<button class="ms-hbtn" id="ms-prev-prompt" title="上一条"${prevId ? "" : ' disabled style="opacity:0.2;"'}><i class="fa-solid fa-angle-up"></i></button>`
        : "";
    const navNextH =
      siblingIds.length > 1
        ? `<button class="ms-hbtn" id="ms-next-prompt" title="下一条"${nextId ? "" : ' disabled style="opacity:0.2;"'}><i class="fa-solid fa-angle-down"></i></button>`
        : "";
    $p.find("#ms-toolbar").html(
      `<button class="ms-hbtn" id="ms-go-back"><i class="fa-solid fa-angle-left"></i></button><div class="ms-pv-meta">${metaChips}</div>${navPosH}${navPrevH}${navNextH}`,
    );
    $p.find("#ms-body").html(`
      <div class="ms-preview-actions">
        <button class="ms-pa${starCls}" data-action="star"><i class="${starIcon} fa-star"></i> ${starLabel}</button>
        <button class="ms-pa" data-action="pin"><i class="${pinIcon}"></i> ${pinLabel}</button>
        <button class="ms-pa" data-action="edit"><i class="fa-solid fa-pen"></i>编辑</button>
        <button class="ms-pa" data-action="copy"><i class="fa-solid fa-copy"></i> 复制</button>
        <button class="ms-pa" data-action="duplicate"><i class="fa-solid fa-clone"></i> 副本</button>
        <button class="ms-pa" data-action="quick-new" title="在当前分组下快速新建一条空白剧场"><i class="fa-solid fa-square-plus"></i> 同组新建</button>
        <button class="ms-pa${pr.character ? " starred" : ""}" data-action="bind-char" title="${pr.character ? esc(String(pr.character).replace(/\.[^.]+$/, "")) : ""}">${
          pr.character
            ? (function () {
                var ap = getCharAvatarPathSafe(pr.character);
                return ap
                  ? '<img src="' +
                      esc(ap) +
                      '" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:2px;" onerror="this.style.display=\'none\';this.onerror=null;">'
                  : '<i class="fa-solid fa-user-check"></i>';
              })()
            : '<i class="fa-solid fa-user-plus"></i>'
        } ${pr.character ? "已绑定: " + esc(truncate(getCharDisplayName(pr.character), 10)) : "绑定角色"}</button>
        <button class="ms-pa" data-action="export-single"><i class="fa-solid fa-file-export"></i> 导出</button>
        ${historyCount > 0 ? `<button class="ms-pa" data-action="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史 (${historyCount})</button>` : ""}<button class="ms-pa danger" data-action="delete"><i class="fa-solid fa-trash"></i> 删除</button>
      </div>
      ${tagsH ? `<div style="padding:6px 14px;">${tagsH}</div>` : ""}
      <div style="padding:2px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);display:flex;justify-content:space-between;align-items:center;"><span>${stats.chars} 字 · ${stats.lines} 行${pr.usageCount ? " · 使用 " + pr.usageCount + " 次" : ""}</span>${pr.updatedAt && pr.updatedAt !== pr.createdAt ? '<span style="opacity:0.7;" title="修改日期"><i class="fa-solid fa-pen-to-square" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.updatedAt) + "</span>" : pr.createdAt ? '<span style="opacity:0.7;" title="创建日期"><i class="fa-solid fa-calendar-plus" style="margin-right:2px;font-size:9px;"></i>' + formatDate(pr.createdAt) + "</span>" : ""}</div>
      <div class="ms-preview-content">${renderMd(pr.content)}</div>`);
    var _isInjected =
      (data.settings.stageSelectedIds || []).indexOf(pr.id) >= 0;
    var _injectCount = (data.settings.stageSelectedIds || []).length;
    var _injectBtnLabel = _isInjected
      ? '<i class="fa-solid fa-syringe"></i>取消注入' +
        (_injectCount > 1 ? "(" + _injectCount + ")" : "")
      : '<i class="fa-solid fa-syringe"></i>选为注入' +
        (_injectCount > 0 ? "(+" + _injectCount + ")" : "");
    var _injectBtnCls = _isInjected ? " ms-inject-active" : "";
    var _injectBtnH = data.settings.stageInjectEnabled
      ? '<button class="ms-send-btn' +
        _injectBtnCls +
        '" data-action="toggle-inject">' +
        _injectBtnLabel +
        "</button>"
      : "";
    $p.find("#ms-footer")
      .html(
        '<div class="ms-preview-send" style="border:none;padding:0;width:100%;gap:4px;">' +
          '<button class="ms-send-btn" data-action="send-input"><i class="fa-solid fa-right-to-bracket"></i>填入输入框</button>' +
          _injectBtnH +
          '<button class="ms-send-btn" data-action="send-gen" style="background:rgba(var(--ms-accent-rgb),0.1);border-color:var(--ms-accent);color:var(--ms-accent);"><i class="fa-solid fa-paper-plane"></i>发送并生成</button>' +
          "</div>",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "[data-action='star']", () => {
      toggleStar(pr.id);
      renderPreview(v);
    });
    $p.find("#ms-body").on("click.ms", "[data-action='pin']", () => {
      togglePin(pr.id);
      renderPreview(v);
    });
    $p.find("#ms-body").on("click.ms", "[data-action='edit']", () =>
      navigateTo({ name: "edit", promptId: pr.id }),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='copy']", () =>
      copyToClipboard(pr.content)
        .then(() => toast("success", "已复制"))
        .catch(() => toast("error", "复制失败")),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='duplicate']", () => {
      duplicatePrompt(pr.id);
      toast("success", "已创建副本");
      navigateBack();
    });
    $p.find("#ms-body").on("click.ms", "[data-action='quick-new']", () => {
      navigateTo({
        name: "edit",
        promptId: null,
        defaultGroupId: pr.groupId,
        defaultSeries: pr.series || "",
        defaultCharacter: pr.character || "",
      });
    });
    $p.find("#ms-body").on("click.ms", "[data-action='export-single']", () =>
      doExportSingle(pr),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='bind-char']", () =>
      showBindCharacterDropdown($p, pr.id, function () {
        renderPreview(v);
      }),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='history']", () =>
      navigateTo({ name: "history", promptId: pr.id }),
    );
    $p.find("#ms-body").on("click.ms", "[data-action='delete']", () => {
      msConfirm(
        "确定删除「" + truncate(pr.title, 20) + "」吗？\n\n该操作不可撤销",
        {
          title: "删除剧场",
          dangerous: true,
          okText: "删除",
        },
      ).then(function (ok) {
        if (!ok) return;
        deletePrompt(pr.id);
        navigateBack();
      });
    });
    $p.find("#ms-footer").on("click.ms", "[data-action='send-input']", () =>
      sendToInput(pr.id),
    );
    $p.find("#ms-footer").on("click.ms", "[data-action='send-gen']", () =>
      sendAndGenerate(pr.id),
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='toggle-inject']",
      function () {
        if (!Array.isArray(data.settings.stageSelectedIds))
          data.settings.stageSelectedIds = [];
        var idx = data.settings.stageSelectedIds.indexOf(pr.id);
        if (idx >= 0) {
          data.settings.stageSelectedIds.splice(idx, 1);
        } else {
          data.settings.stageSelectedIds.push(pr.id);
        }
        saveData();
        updateInjectIndicator();
        var _isNowInjected = data.settings.stageSelectedIds.indexOf(pr.id) >= 0;
        var _nowCount = data.settings.stageSelectedIds.length;
        var $btn = $p.find("[data-action='toggle-inject']");
        if (_isNowInjected) {
          $btn
            .addClass("ms-inject-active")
            .html(
              '<i class="fa-solid fa-syringe"></i>取消注入' +
                (_nowCount > 1 ? "(" + _nowCount + ")" : ""),
            );
        } else {
          $btn
            .removeClass("ms-inject-active")
            .html(
              '<i class="fa-solid fa-syringe"></i>选为注入' +
                (_nowCount > 0 ? "(+" + _nowCount + ")" : ""),
            );
        }
      },
    );
    $p.find("#ms-body").on("change.ms", ".ms-task-cb", function () {
      var idx = parseInt($(this).data("task-idx"));
      var isChecked = $(this).is(":checked");
      var lines = pr.content.split("\n");
      var taskCount = 0;
      var inCodeBlock = false;
      for (var i = 0; i < lines.length; i++) {
        if (/^\s*```/.test(lines[i])) {
          inCodeBlock = !inCodeBlock;
          continue;
        }
        if (inCodeBlock) continue;
        if (/^\s*- \[[ x]\] /.test(lines[i])) {
          if (taskCount === idx) {
            if (isChecked) lines[i] = lines[i].replace("- [ ] ", "- [x] ");
            else lines[i] = lines[i].replace("- [x] ", "- [ ] ");
            break;
          }
          taskCount++;
        }
      }
      pushHistory(pr);
      var _oldContent = pr.content;
      pr.content = lines.join("\n");
      pr.fingerprint = contentFingerprint(pr);
      pr.updatedAt = Date.now();
      _invalidateLc(pr);
      if (typeof _renderMdCache !== "undefined") {
        _renderMdCache.delete(_oldContent);
      }
      saveData();
      var $li = $(this).closest("li.ms-task");
      if (isChecked) $li.addClass("ms-task-done");
      else $li.removeClass("ms-task-done");
    });
    if (prevId) {
      $p.find("#ms-toolbar").on("click.ms", "#ms-prev-prompt", function () {
        viewStack[viewStack.length - 1] = {
          name: "preview",
          promptId: prevId,
          _siblingIds: siblingIds,
        };
        renderView();
      });
    }
    if (nextId) {
      $p.find("#ms-toolbar").on("click.ms", "#ms-next-prompt", function () {
        viewStack[viewStack.length - 1] = {
          name: "preview",
          promptId: nextId,
          _siblingIds: siblingIds,
        };
        renderView();
      });
    }
    $p.off("keydown.ms-preview-nav").on("keydown.ms-preview-nav", function (e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (prevId) {
          e.preventDefault();
          viewStack[viewStack.length - 1] = {
            name: "preview",
            promptId: prevId,
            _siblingIds: siblingIds,
          };
          renderView();
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (nextId) {
          e.preventDefault();
          viewStack[viewStack.length - 1] = {
            name: "preview",
            promptId: nextId,
            _siblingIds: siblingIds,
          };
          renderView();
        }
      }
    });
  }

  function renderHistory(v) {
    var pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    var history = pr.history || [];
    var $p = setupPage("版本历史", "版本历史 · " + esc(truncate(pr.title, 20)));
    let html = "";
    if (history.length === 0) {
      html = `<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>还没有历史版本</div>`;
    } else {
      [...history].reverse().forEach((h, ri) => {
        const idx = history.length - 1 - ri;
        html += `<div class="ms-history-item" data-hidx="${idx}">
          <div class="ms-history-info">
            <div class="ms-history-title">${esc(h.title || "未命名")}${h.author ? ` · ${esc(h.author)}` : ""}</div>
            <div class="ms-history-date">${formatDate(h.savedAt)}</div>
            <div class="ms-history-preview">${esc(truncate(h.content, 80))}</div>
          </div>
          <div class="ms-history-actions">
            <button class="ms-card-qbtn" data-haction="diff" data-hidx="${idx}" title="与当前版本对比"><i class="fa-solid fa-right-left"></i></button><button class="ms-card-qbtn" data-haction="restore" data-hidx="${idx}" title="回退到此版本"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="ms-card-qbtn" data-haction="delete" data-hidx="${idx}" title="删除此记录"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        `<span>${history.length}/5 条历史</span><div class="ms-footer-btns">${history.length > 0 ? '<a data-action="clear-history"><i class="fa-solid fa-broom"></i> 清空</a>' : ""}</div>`,
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      "[data-haction='restore']",
      function (e) {
        e.stopPropagation();
        const idx = parseInt($(this).data("hidx"));
        const h = pr.history[idx];
        if (!h) return;
        msConfirm("回退后当前内容会被保存到历史中，确定吗？", {
          title: "回退到此版本",
          type: "warning",
          okText: "回退",
        }).then(function (ok) {
          if (!ok) return;
          pushHistory(pr);
          pr.history.splice(idx, 1);
          pr.title = h.title;
          pr.content = h.content;
          pr.author = h.author || pr.author;
          pr.fingerprint = contentFingerprint(pr);
          saveData();
          navigateBack();
        });
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-haction='delete']", function (e) {
      e.stopPropagation();
      const idx = parseInt($(this).data("hidx"));
      msConfirm("确定删除此历史记录？", {
        title: "删除历史",
        dangerous: true,
        okText: "删除",
      }).then(function (ok) {
        if (!ok) return;
        pr.history.splice(idx, 1);
        saveData();
        renderHistory(v);
      });
    });
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-history']",
      function () {
        msConfirm("确定清空本条剧场的所有版本历史吗？", {
          title: "清空版本历史",
          dangerous: true,
          okText: "清空",
        }).then(function (ok) {
          if (!ok) return;
          pr.history = [];
          saveData();
          toast("success", "已清空");
          renderHistory(v);
        });
      },
    );
    $p.find("#ms-body").on("click.ms", "[data-haction='diff']", function (e) {
      e.stopPropagation();
      var idx = parseInt($(this).data("hidx"));
      navigateTo({
        name: "history-diff",
        promptId: v.promptId,
        historyIdx: idx,
      });
    });
  }

  function renderHistoryDiff(v) {
    var pr = getPrompt(v.promptId);
    if (!pr) {
      navigateBack();
      return;
    }
    var h = (pr.history || [])[v.historyIdx];
    if (!h) {
      navigateBack();
      return;
    }
    var diff = computeLineDiff(h.content || "", pr.content || "");
    var addCount = diff.filter(function (d) {
      return d.type === "add";
    }).length;
    var delCount = diff.filter(function (d) {
      return d.type === "del";
    }).length;
    var sameCount = diff.filter(function (d) {
      return d.type === "same";
    }).length;
    var $p = setupPage("版本对比");
    var metaH = "";
    if ((h.title || "") !== (pr.title || "")) {
      metaH +=
        '<div style="padding:2px 0;font-size:12px;"><span style="opacity:0.5;">标题:</span> <span class="ms-diff-del-text">' +
        esc(h.title || "未命名") +
        '</span> <i class="fa-solid fa-arrow-right" style="font-size:9px;opacity:0.4;margin:0 4px;"></i> <span class="ms-diff-add-text">' +
        esc(pr.title || "未命名") +
        "</span></div>";
    }
    if ((h.author || "") !== (pr.author || "")) {
      metaH +=
        '<div style="padding:2px 0;font-size:12px;"><span style="opacity:0.5;">作者:</span> <span class="ms-diff-del-text">' +
        esc(h.author || "无") +
        '</span> <i class="fa-solid fa-arrow-right" style="font-size:9px;opacity:0.4;margin:0 4px;"></i> <span class="ms-diff-add-text">' +
        esc(pr.author || "无") +
        "</span></div>";
    }
    var html =
      '<div class="ms-diff-header">' +
      '<div class="ms-diff-label old"><i class="fa-solid fa-clock-rotate-left"></i> 历史版本</div>' +
      '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);">' +
      formatDate(h.savedAt) +
      "</div>" +
      '<i class="fa-solid fa-arrow-right" style="font-size:10px;opacity:0.3;"></i>' +
      '<div class="ms-diff-label new"><i class="fa-solid fa-file-lines"></i> 当前版本</div>' +
      "</div>";
    if (metaH) {
      html += '<div class="ms-diff-meta">' + metaH + "</div>";
    }
    html +=
      '<div class="ms-diff-stats">' +
      '<span class="ms-diff-stat-add">+ ' +
      addCount +
      " 行新增</span>" +
      '<span class="ms-diff-stat-del">- ' +
      delCount +
      " 行删除</span>" +
      '<span class="ms-diff-stat-same">' +
      sameCount +
      " 行不变</span>" +
      (sameCount > 0
        ? '<button class="ms-diff-toggle" id="ms-diff-toggle-ctx">只看改动</button>'
        : "") +
      "</div>";
    if (addCount === 0 && delCount === 0) {
      html +=
        '<div class="ms-empty" style="padding:30px 20px;"><i class="fa-solid fa-equals" style="font-size:24px;opacity:0.3;display:block;margin-bottom:10px;"></i>内容完全相同' +
        (metaH
          ? '<br><span style="font-size:11px;opacity:0.6;">仅标题或作者有变化</span>'
          : "") +
        "</div>";
    } else {
      html += '<div class="ms-diff-body" id="ms-diff-body">';
      diff.forEach(function (d) {
        var sign = d.type === "add" ? "+" : d.type === "del" ? "−" : " ";
        var lineText = d.text !== undefined ? d.text : "";
        if (lineText === "" && d.type === "same") lineText = " ";
        html +=
          '<div class="ms-diff-line ' +
          d.type +
          '"><span class="ms-diff-sign">' +
          sign +
          '</span><span class="ms-diff-text">' +
          esc(lineText || " ") +
          "</span></div>";
      });
      html += "</div>";
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        "<span>" +
          diff.length +
          " 行对比 · " +
          addCount +
          " 增 · " +
          delCount +
          " 删</span>",
      )
      .show();
    bindAllEvents();
    var showAll = true;
    $p.find("#ms-body").on("click.ms", "#ms-diff-toggle-ctx", function () {
      showAll = !showAll;
      $(this).text(showAll ? "只看改动" : "显示全部");
      $(this).toggleClass("active", !showAll);
      if (showAll) {
        $p.find("#ms-diff-body").removeClass("ms-diff-changes-only");
      } else {
        $p.find("#ms-diff-body").addClass("ms-diff-changes-only");
      }
    });
  }

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
          $panel.addClass("ms-focus-mode");
          $(this).addClass("active");
          $(this).find("i").attr("class", "fa-solid fa-compress");
          $(this).attr("title", "退出专注");
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

  function renderQuickPhrases(v) {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("快捷短语");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: false,
        add: true,
        addId: "ms-qp-add",
      }),
    );
    let html = "";
    if (data.quickPhrases.length === 0)
      html = `<div class="ms-empty"><i class="fa-solid fa-bolt"></i>还没有快捷短语</div>`;
    else
      data.quickPhrases.forEach((qp) => {
        html += `<div class="ms-qp-item"><div class="ms-qp-header"><i class="fa-solid fa-angle-right ms-qp-arrow"></i><span class="ms-qp-title">${esc(qp.title)}</span><div style="display:flex;gap:2px;"><button class="ms-card-qbtn" data-qp-action="edit" data-qpid="${qp.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-card-qbtn" data-qp-action="delete" data-qpid="${qp.id}"><i class="fa-solid fa-trash"></i></button></div></div><div class="ms-qp-body"><div>${esc(truncate(qp.content, 200))}</div>${v.returnToEdit && v.editTaId ? `<button class="ms-qp-insert" data-qpid="${qp.id}"><i class="fa-solid fa-arrow-turn-down"></i> 插入到编辑器</button>` : ""}</div></div>`;
      });
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(`<span>${data.quickPhrases.length} 条短语</span>`)
      .show();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", ".ms-qp-header", function (e) {
      if ($(e.target).closest(".ms-card-qbtn").length) return;
      $(this).closest(".ms-qp-item").find(".ms-qp-body").toggleClass("open");
      $(this).find(".ms-qp-arrow").toggleClass("open");
    });
    $p.find("#ms-body").on("click.ms", "[data-qp-action='edit']", function (e) {
      e.stopPropagation();
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: $(this).data("qpid"),
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      });
    });
    $p.find("#ms-body").on(
      "click.ms",
      "[data-qp-action='delete']",
      function (e) {
        e.stopPropagation();
        var qpid = $(this).data("qpid");
        msConfirm("确定删除该快捷短语吗？", {
          title: "删除快捷短语",
          dangerous: true,
          okText: "删除",
        }).then(function (ok) {
          if (!ok) return;
          data.quickPhrases = data.quickPhrases.filter((q) => q.id !== qpid);
          saveData();
          renderQuickPhrases(v);
        });
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-qp-insert", function (e) {
      e.stopPropagation();
      const qp = data.quickPhrases.find((q) => q.id === $(this).data("qpid"));
      if (!qp) return;
      if (v.returnToEdit) {
        v.returnToEdit._pendingInsert = qp.content;
      }
      navigateBack();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-qp-add", () =>
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: null,
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      }),
    );
  }

  function renderQuickPhraseEdit(v) {
    var qp = v.phraseId
        ? data.quickPhrases.find((q) => q.id === v.phraseId)
        : null,
      isNew = !qp;
    var $p = setupPage(
      isNew ? "新建短语" : "编辑短语",
      (isNew ? "新建" : "编辑") + "快捷短语",
    );
    $p.find("#ms-body").html(
      `<div class="ms-form"><div class="ms-field"><label>标题</label><input type="text" id="ms-qpe-title" value="${esc(qp ? qp.title : "")}"></div><div class="ms-field"><label>内容</label><textarea id="ms-qpe-content" style="min-height:140px;">${esc(qp ? qp.content : "")}</textarea></div><div class="ms-form-btns"><button class="ms-btn" id="ms-qpe-cancel">取消</button><button class="ms-btn primary" id="ms-qpe-save">保存</button></div></div>`,
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-qpe-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-qpe-save", () => {
      const t = $p.find("#ms-qpe-title").val().trim(),
        c = $p.find("#ms-qpe-content").val().trim();
      if (!t && !c) {
        toast("warning", "不能都为空");
        return;
      }
      if (v.phraseId) {
        const i = data.quickPhrases.findIndex((q) => q.id === v.phraseId);
        if (i >= 0) {
          data.quickPhrases[i].title = t || "未命名";
          data.quickPhrases[i].content = c;
        }
      } else
        data.quickPhrases.push({ id: uid(), title: t || "未命名", content: c });
      saveData();
      toast("success", isNew ? "已创建" : "已保存");
      navigateBack();
    });
  }

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
    if (!isNew && !Array.isArray(g.charKeys)) g.charKeys = [];
    var editCharKeys = isNew ? [] : g.charKeys.slice();
    var editColor = isNew
      ? GROUP_COLORS[data.groups.length % GROUP_COLORS.length]
      : g.color;
    var editIconMode = isNew ? "group" : g.iconMode || "group";
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

      var colorH =
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
      }
      iconSectionH +=
        '<span class="ms-tag-toggle' +
        (editIconMode === "custom" ? " active" : "") +
        '" data-gedit-iconmode="custom" style="' +
        (editIconMode === "custom"
          ? "background:var(--ms-accent);color:#fff;"
          : "") +
        '"><i class="fa-solid fa-image" style="margin-right:3px;font-size:10px;"></i>自定义图片URL</span>';
      iconSectionH += "</div>";

      if (editIconMode === "custom") {
        iconSectionH +=
          '<input type="text" id="ms-gedit-icon-url" placeholder="输入图片直链 URL（例如图床地址）..." value="' +
          esc(editIconUrl) +
          '">';
        if (editIconUrl) {
          iconSectionH +=
            '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);"><span>预览：</span><img src="' +
            esc(editIconUrl) +
            '" style="width:40px;height:40px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.05);" onerror="this.style.display=\'none\';var s=this.nextElementSibling;if(s)s.style.display=\'inline\';"><span style="display:none;color:var(--ms-danger);">图片加载失败</span></div>';
        }
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
      } else if (!ipMode && editIconMode !== "custom") {
        iconSectionH +=
          '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);padding:2px 0;font-style:italic;">普通分组会用颜色 + 文件夹图标显示，或可选自定义图片URL</div>';
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
        colorH +
        iconSectionH +
        '<div class="ms-field"><label>备注</label><input type="text" id="ms-gedit-note" placeholder="可选的简短说明" value="' +
        esc(g ? g.note : "") +
        '"></div>' +
        '<div class="ms-field"><label>默认作者</label><input type="text" id="ms-gedit-author" placeholder="该分组下新建时自动填入" value="' +
        esc(g ? g.defaultAuthor || "" : "") +
        '"></div>' +
        '<div class="ms-field"><label>注入前缀指令 <span style="font-weight:350;opacity:0.5;">(可选，留空用全局默认，用  标记剧场插入位置)</span></label><textarea id="ms-gedit-prefix" style="min-height:50px;resize:vertical;" placeholder="该分组的剧场注入时使用此前缀">' +
        esc(g ? g.stagePrefix || "" : "") +
        "</textarea></div>" +
        toggleCharSectionH +
        charSectionH +
        (!isNew
          ? '<div class="ms-divider"></div><button class="ms-tbtn" id="ms-group-set-all-author" style="width:100%;text-align:center;"><i class="fa-solid fa-user-pen"></i> 批量设置本组作者</button>'
          : "") +
        '<div class="ms-form-btns"><button class="ms-btn" id="ms-gedit-cancel">取消</button><button class="ms-btn primary" id="ms-gedit-save">保存</button></div>' +
        "</div>"
      );
    }

    $p.find("#ms-body").html(buildBody());
    $p.find("#ms-footer").hide();
    bindAllEvents();

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
      var finalIconUrl = $p.find("#ms-gedit-icon-url").length
        ? $p.find("#ms-gedit-icon-url").val().trim()
        : editIconUrl;
      var payload = {
        name: n,
        note: note,
        color: editColor,
        defaultAuthor: defAuthor,
        stagePrefix: stagePrefix,
        iconMode: editIconMode,
        iconUrl: editIconMode === "custom" ? finalIconUrl : "",
        iconCharKey: editIconMode === "char" ? editIconCharKey : "",
        charKeys: editCharKeys.slice(),
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
    const totalUsage = data.prompts.reduce(
      (s, p) => s + (p.usageCount || 0),
      0,
    );
    const starredCount = data.prompts.filter((p) => p.starred).length;
    const usedPrompts = data.prompts.filter((p) => p.usageCount > 0);
    const avgUsage =
      usedPrompts.length > 0
        ? (totalUsage / usedPrompts.length).toFixed(1)
        : "0";

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
            i === 0
              ? "gold"
              : i === 1
                ? "silver"
                : i === 2
                  ? "bronze"
                  : "normal";
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

  function renderSettings() {
    const $p = setupPage("设置");
    $p.find("#ms-body").html(
      `<div class="ms-form"><div class="ms-field"><label>默认作者署名</label><input type="text" id="ms-default-author" placeholder="新建时自动填入" value="${esc(data.settings.defaultAuthor || "")}"></div><div class="ms-divider"></div><div class="ms-section-label">注入设置</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-inject-enabled-toggle" ${data.settings.stageInjectEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">启用注入功能</span></div><div style="padding:4px 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>选中剧场后，内容会随下一次发送注入到 AI 提示词中</div><div id="ms-inject-details" style="${data.settings.stageInjectEnabled ? "" : "display:none;"}"><div class="ms-inject-settings-row"><label class="ms-inject-radio${data.settings.stageInjectMode === "depth" ? " active" : ""}" data-mode="depth"><input type="radio" name="ms-inject-mode" value="depth" ${data.settings.stageInjectMode === "depth" ? "checked" : ""}><i class="fa-solid fa-layer-group" style="margin-right:3px;font-size:11px;"></i>深度注入</label><label class="ms-inject-radio${data.settings.stageInjectMode === "macro" ? " active" : ""}" data-mode="macro"><input type="radio" name="ms-inject-mode" value="macro" ${data.settings.stageInjectMode === "macro" ? "checked" : ""}><i class="fa-solid fa-code" style="margin-right:3px;font-size:11px;"></i>自定义宏 {{stage}}</label></div><div class="ms-macro-info"><div class="ms-macro-info-title"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:4px;color:var(--ms-accent);"></i>可用宏</div><div><code>{{stage}}</code><span class="ms-macro-desc">剧场原始内容</span></div><div><code>{{stage_title}}</code><span class="ms-macro-desc">剧场标题</span></div><div><code>{{stage_count}}</code><span class="ms-macro-desc">选中的剧场总数</span></div><div><code>{{stage_tasks}}</code><span class="ms-macro-desc">所有任务块的拼接体</span></div><div><code>{{stage_prompt}}</code><span class="ms-macro-desc">前缀指令+剧场内容（完整注入体）</span></div></div><div id="ms-depth-opts" style="${data.settings.stageInjectMode === "depth" ? "" : "display:none;"}padding:0 14px;"><div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>注入深度</label><input type="number" id="ms-inject-depth" min="0" max="999" value="${data.settings.stageInjectDepth || 0}" style="width:100%;"></div><div class="ms-field" style="flex:1;"><label>消息角色</label><select id="ms-inject-role" style="width:100%;"><option value="system"${data.settings.stageInjectRole === "system" ? " selected" : ""}>System</option><option value="user"${data.settings.stageInjectRole === "user" ? " selected" : ""}>User</option><option value="assistant"${data.settings.stageInjectRole === "assistant" ? " selected" : ""}>Assistant</option></select></div></div></div><div class="ms-field" style="padding:6px 14px 0;"><label>默认前缀指令 <span style="font-weight:350;opacity:0.5;">(用 {{stage}} 标记剧场插入位置，不写则拼接在末尾)</span></label><textarea id="ms-default-prefix" style="min-height:120px;resize:vertical;" placeholder="例：在正文最后输出以下剧场内容...">${esc(data.settings.defaultStagePrefix || "")}</textarea></div><div class="ms-field" style="padding:6px 14px 0;"><label>多条外壳模板 <span style="font-weight:350;opacity:0.5;">(选多条剧场时的整体结构，用 {{stage_count}} 表示数量，{{stage_tasks}} 表示所有任务块)</span></label><textarea id="ms-multi-prefix" style="min-height:80px;resize:vertical;" placeholder="留空使用内置默认模板">${esc(data.settings.multiStagePrefix || "")}</textarea><div style="padding:4px 2px;font-size:10px;color:var(--ms-danger);line-height:1.5;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:3px;"></i>多条外壳模板中必须包含 \{\{stage_tasks\}\}，否则会自动回退使用内置默认模板</div></div><div class="ms-section-label" style="margin-top:6px;">生成后行为</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-clear-after-gen-toggle" ${data.settings.clearStageAfterGeneration ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">生成完成后自动清除选中的注入</span></div><div style="padding:4px 14px 8px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>开启后每次成功生成会自动取消已选注入；API 报错、空回复或用户中止时不会清除，方便直接重试</div><div class="ms-section-label" style="margin-top:6px;">随机注入</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-random-toggle" ${data.settings.randomInject && data.settings.randomInject.enabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">没有手动选中时，自动从随机池中抽取</span></div><button class="ms-tbtn" id="ms-go-random-pool" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-sliders"></i> 管理随机池</button></div><div class="ms-divider"></div><button class="ms-tbtn" id="ms-go-qp" style="width:100%;text-align:center;"><i class="fa-solid fa-bolt"></i> 管理快捷短语(${data.quickPhrases.length})</button><button class="ms-tbtn" id="ms-go-stats" style="width:100%;text-align:center;"><i class="fa-solid fa-chart-bar"></i> 使用统计</button><button class="ms-tbtn" id="ms-go-subs" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-rss"></i> 订阅管理 (${data.subscriptions.length})</button><div class="ms-divider"></div><div class="ms-section-label">订阅设置</div><div class="ms-field"><label>自动检查间隔 <span style="font-weight:350;opacity:0.5;">(打开面板时，超过此时间未检查的订阅会自动静默检查)</span></label><div style="display:flex;align-items:center;gap:8px;"><input type="number" id="ms-auto-check-interval" min="0" max="168" step="1" value="${data.settings.autoCheckInterval || 6}" style="width:80px;"><span style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);">小时（设为 0 关闭自动检查）</span></div></div><div class="ms-divider"></div><div class="ms-section-label">界面自定义</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-ui-custom-toggle" ${data.settings.uiCustomEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">启用自定义字号和面板尺寸</span></div><div id="ms-ui-custom-details" style="${data.settings.uiCustomEnabled ? "" : "display:none;"}padding:4px 14px;"><div class="ms-form-row"><div class="ms-field" style="flex:1;"><label>字号 (px)</label><input type="number" id="ms-ui-font-size" min="10" max="24" value="${data.settings.uiFontSize}"></div><div class="ms-field" style="flex:1;"><label>面板宽度 (px)</label><input type="number" id="ms-ui-panel-width" min="320" max="1400" value="${data.settings.uiPanelWidth}"></div><div class="ms-field" style="flex:1;"><label>最大高度 (vh)</label><input type="number" id="ms-ui-panel-height" min="40" max="100" value="${data.settings.uiPanelHeight}"></div></div></div><div class="ms-divider"></div><div class="ms-section-label">使用说明</div><button class="ms-tbtn" id="ms-regen-guide" style="width:100%;text-align:center;"><i class="fa-solid fa-book"></i> 重新生成使用说明</button><div class="ms-divider"></div><div class="ms-section-label">脚本更新 <span style="font-weight:400;opacity:0.6;text-transform:none;letter-spacing:0;margin-left:4px;">当前 v${SCRIPT_VERSION}</span></div><button class="ms-tbtn" id="ms-update-script" style="width:100%;text-align:center;"><i class="fa-solid fa-arrows-rotate"></i> 检查脚本更新</button>
<button class="ms-tbtn" id="ms-view-changelog" style="width:100%;text-align:center;margin-top:6px;"><i class="fa-solid fa-clipboard-list"></i> 查看更新日志</button><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);padding:4px 14px;line-height:1.5;">刷新浏览器缓存并重载脚本，获取最新版本。</div><div class="ms-divider"></div><div class="ms-section-label">数据管理</div><div style="display:flex;align-items:center;gap:10px;padding:6px 14px;font-size:13px;"><label class="ms-switch"><input type="checkbox" id="ms-history-warn-toggle" ${data.settings.historyWarnEnabled ? "checked" : ""}><span class="ms-switch-slider"></span></label><span style="color:var(--SmartThemeBodyColor,#ccc);">历史超过30条时在底栏变红提醒</span></div><button class="ms-tbtn" id="ms-go-history-list" style="width:100%;text-align:center;margin-bottom:6px;"><i class="fa-solid fa-clock-rotate-left"></i> 查看有历史记录的剧场(${
        data.prompts.filter(function (p) {
          return p.history && p.history.length > 0;
        }).length
      } 条)</button><button class="ms-tbtn" id="ms-clean-lost-chars" style="width:100%;text-align:center;margin-bottom:6px;"><i class="fa-solid fa-user-slash"></i> 处理失联角色（重绑/解绑）</button><button class="ms-tbtn danger" id="ms-clear-all-history" style="width:100%;text-align:center;"><i class="fa-solid fa-broom"></i> 清空全部版本历史</button><button class="ms-tbtn danger" id="ms-wipe-all-data" style="width:100%;text-align:center;margin-top:6px;background:rgba(var(--ms-danger-rgb),0.12);border-color:var(--ms-danger);"><i class="fa-solid fa-skull-crossbones"></i> 彻底清空所有本地数据</button><div class="ms-divider"></div><div style="padding:6px 14px;font-size:10px;color:var(--SmartThemeQuoteColor,#666);" id="ms-data-size-info"></div></div>`,
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    try {
      var sizeKB = Math.round(
        JSON.stringify({
          groups: data.groups,
          prompts: data.prompts,
          quickPhrases: data.quickPhrases,
          subscriptions: data.subscriptions,
          settings: data.settings,
        }).length / 1024,
      );
      var sizeText =
        sizeKB < 1024 ? sizeKB + " KB" : (sizeKB / 1024).toFixed(2) + " MB";
      var warnH =
        sizeKB > 2048
          ? ' <span style="color:var(--ms-danger);">(偏大，建议清理历史)</span>'
          : "";
      $p.find("#ms-data-size-info").html(
        '<i class="fa-solid fa-database" style="margin-right:4px;"></i>当前数据体积：<strong>' +
          sizeText +
          "</strong>" +
          warnH,
      );
    } catch (e) {}

    $p.find("#ms-body").on(
      "change.ms",
      "#ms-inject-enabled-toggle",
      function () {
        data.settings.stageInjectEnabled = $(this).is(":checked");
        saveData();
        updateInjectIndicator();
        $p.find("#ms-inject-details").toggle($(this).is(":checked"));
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-inject-radio", function () {
      var mode = $(this).data("mode");
      data.settings.stageInjectMode = mode;
      saveData();
      $p.find(".ms-inject-radio").removeClass("active");
      $(this).addClass("active");
      if (mode === "depth") $p.find("#ms-depth-opts").show();
      else $p.find("#ms-depth-opts").hide();
    });
    $p.find("#ms-body").on("input.ms", "#ms-inject-depth", function () {
      var val = parseInt($(this).val());
      if (isNaN(val) || val < 0) val = 0;
      data.settings.stageInjectDepth = val;
      saveData();
    });
    $p.find("#ms-body").on("change.ms", "#ms-inject-role", function () {
      data.settings.stageInjectRole = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-default-prefix", function () {
      data.settings.defaultStagePrefix = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-multi-prefix", function () {
      data.settings.multiStagePrefix = $(this).val();
      saveData();
    });
    $p.find("#ms-body").on(
      "change.ms",
      "#ms-clear-after-gen-toggle",
      function () {
        data.settings.clearStageAfterGeneration = $(this).is(":checked");
        saveData();
      },
    );

    $p.find("#ms-body").on("change.ms", "#ms-random-toggle", function () {
      if (!data.settings.randomInject)
        data.settings.randomInject = {
          enabled: false,
          excludedGroupIds: [],
          excludedSeries: [],
          excludedPromptIds: [],
        };
      data.settings.randomInject.enabled = $(this).is(":checked");
      saveData();
      updateInjectIndicator();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-random-pool", function () {
      navigateTo({ name: "random-pool" });
    });
    $p.find("#ms-body").on("input.ms", "#ms-default-author", function () {
      data.settings.defaultAuthor = $(this).val().trim();
      saveData();
    });
    $p.find("#ms-body").on("input.ms", "#ms-auto-check-interval", function () {
      var val = parseInt($(this).val());
      if (isNaN(val) || val < 0) val = 0;
      if (val > 168) val = 168;
      data.settings.autoCheckInterval = val;
      saveData();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-qp", () =>
      navigateTo({ name: "quick-phrases" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-go-stats", () =>
      navigateTo({ name: "stats" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-go-subs", () =>
      navigateTo({ name: "subscriptions" }),
    );
    $p.find("#ms-body").on("change.ms", "#ms-ui-custom-toggle", function () {
      data.settings.uiCustomEnabled = $(this).is(":checked");
      saveData();
      $p.find("#ms-ui-custom-details").toggle($(this).is(":checked"));
      applyUICustomization();
    });
    $p.find("#ms-body").on("input.ms", "#ms-ui-font-size", function () {
      var v = parseInt($(this).val());
      if (!isNaN(v) && v >= 10 && v <= 24) {
        data.settings.uiFontSize = v;
        saveData();
        applyUICustomization();
      }
    });
    $p.find("#ms-body").on("input.ms", "#ms-ui-panel-width", function () {
      var v = parseInt($(this).val());
      if (!isNaN(v) && v >= 320 && v <= 1400) {
        data.settings.uiPanelWidth = v;
        saveData();
        applyUICustomization();
      }
    });
    $p.find("#ms-body").on("input.ms", "#ms-ui-panel-height", function () {
      var v = parseInt($(this).val());
      if (!isNaN(v) && v >= 40 && v <= 100) {
        data.settings.uiPanelHeight = v;
        saveData();
        applyUICustomization();
      }
    });
    $p.find("#ms-body").on("click.ms", "#ms-regen-guide", function () {
      msConfirm(
        "将重置「使用指南」分组下的4个内置文档（使用说明、注入指南、角色绑定指南、预览示例），并立即从云端拉取最新内容，确定吗？",
        { title: "重新生成使用说明", okText: "生成" },
      ).then(async function (ok) {
        if (!ok) return;
        createBuiltinGuide();
        toast("info", "正在从云端拉取最新内容...");
        try {
          var allDone = await updateBuiltinGuidesFromRemote(true);
          if (allDone) {
            toast("success", "使用说明已全部更新到最新版");
          } else {
            toast(
              "warning",
              "部分指南拉取失败，下次打开面板会自动重试失败的部分",
            );
          }
        } catch (e) {
          toast("error", "拉取失败：" + e.message);
        }
      });
    });
    $p.find("#ms-body").on("click.ms", "#ms-update-script", async function () {
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html('<i class="fa-solid fa-spinner fa-spin"></i> 正在更新...');
      try {
        await fetch("https://cdn.jsdelivr.net/gh/Sanjs333/stage/stage.js", {
          cache: "reload",
        });
        toast("success", "缓存已刷新，3秒后自动刷新页面...");
        setTimeout(function () {
          try {
            triggerSlash("/reload-page");
          } catch (e2) {
            window.location.reload();
          }
        }, 2000);
      } catch (e) {
        toast("error", "更新失败: " + e.message);
        $btn
          .prop("disabled", false)
          .html('<i class="fa-solid fa-arrows-rotate"></i> 检查脚本更新');
      }
    });
    $p.find("#ms-body").on("click.ms", "#ms-view-changelog", async function () {
      var $btn = $(this);
      var origHtml = $btn.html();
      $btn
        .prop("disabled", true)
        .html('<i class="fa-solid fa-spinner fa-spin"></i> 加载中...');
      try {
        var content = await fetchRemoteGuide(GUIDE_REMOTE_URLS.changelog);
        if (!content) {
          toast("error", "更新日志加载失败，请检查网络");
          $btn.prop("disabled", false).html(origHtml);
          return;
        }
        showModal({
          title: "小剧场 更新日志",
          iconType: "info",
          icon: "fa-clipboard-list",
          modalStyle:
            "min-width:400px;max-width:94vw;width:600px;max-height:80vh;",
          body:
            '<div class="ms-preview-content" style="padding:0;">' +
            renderMd(content) +
            "</div>",
          buttons: [
            { text: "关闭", cls: "primary", primary: true, value: true },
          ],
        });
      } catch (e) {
        toast("error", "加载失败: " + e.message);
      }
      $btn.prop("disabled", false).html(origHtml);
    });

    $p.find("#ms-body").on("change.ms", "#ms-history-warn-toggle", function () {
      data.settings.historyWarnEnabled = $(this).is(":checked");
      saveData();
    });
    $p.find("#ms-body").on("click.ms", "#ms-go-history-list", () =>
      navigateTo({ name: "history-list" }),
    );
    $p.find("#ms-body").on("click.ms", "#ms-clear-all-history", function () {
      var total = data.prompts.reduce(function (s, p) {
        return s + (p.history ? p.history.length : 0);
      }, 0);
      if (total === 0) {
        toast("info", "没有需要清空的历史");
        return;
      }
      msConfirm(
        "确定清空所有剧场的版本历史吗？\n\n共 " +
          total +
          " 条历史记录将被删除\n此操作不可撤销",
        { title: "清空全部版本历史", dangerous: true, okText: "清空" },
      ).then(function (ok) {
        if (!ok) return;
        data.prompts.forEach(function (p) {
          p.history = [];
        });
        saveData();
        toast("success", "已清空全部版本历史（" + total + " 条）");
      });
    });
    $p.find("#ms-body").on("click.ms", "#ms-wipe-all-data", function () {
      var stats = [
        data.prompts.length + " 条剧场",
        data.groups.length + " 个分组",
        (data.settings.definedTags || []).length + " 个标签",
        data.quickPhrases.length + " 个快捷短语",
        data.subscriptions.length + " 个订阅",
        Object.keys(data.settings.charBirthdays || {}).length + " 个生日记录",
      ]
        .filter(function (s) {
          return parseInt(s) > 0;
        })
        .join("、");
      msPrompt(
        "⚠️ 这会清空小剧场的所有本地数据，包括：\n" +
          "· 剧场内容、分组、标签、订阅\n" +
          "· 快捷短语、版本历史、使用统计\n" +
          "· 角色生日、祝福、打卡记录\n" +
          "· 所有界面设置和面板位置\n\n" +
          (stats ? "当前有：" + stats + "\n\n" : "") +
          "⚠️⚠️⚠️ 此操作无法撤销，强烈建议先导出备份！\n\n" +
          "如确认继续，请在下方输入「删除全部」四个字：",
        {
          title: "⚠️ 彻底清空所有数据",
          icon: "fa-skull-crossbones",
          placeholder: "请输入「删除全部」",
          okText: "我已备份，立即清空",
          validate: function (v) {
            if ((v || "").trim() !== "删除全部")
              return "输入不匹配，请准确输入「删除全部」四个字";
            return null;
          },
        },
      ).then(function (input) {
        if (input === null) return;
        try {
          if (_saveTimer) {
            clearTimeout(_saveTimer);
            _saveTimer = null;
          }
          _savePending = false;
          var ctx = getCtx();
          if (ctx) {
            delete ctx.s[STORAGE_KEY];
            ctx.save();
          }
          toast("success", "已清空所有数据，3 秒后刷新页面...");
          setTimeout(function () {
            try {
              if (typeof triggerSlash === "function") {
                triggerSlash("/reload-page");
              } else {
                window.location.reload();
              }
            } catch (e) {
              try {
                window.location.reload();
              } catch (e2) {}
            }
          }, 3000);
        } catch (e) {
          toast("error", "清空失败: " + e.message);
        }
      });
    });

    $p.find("#ms-body").on("click.ms", "#ms-clean-lost-chars", function () {
      navigateTo({ name: "lost-chars" });
    });

    $p.find("#ms-body").on("click.ms", "#ms-reset-usage", function () {
      var usedCount = data.prompts.filter(function (p) {
        return p.usageCount > 0 || p.lastUsedAt;
      }).length;
      if (usedCount === 0) {
        toast("info", "没有需要重置的记录");
        return;
      }
      msConfirm(
        "确定重置所有使用统计吗？\n\n" +
          usedCount +
          " 条剧场的使用次数和最近使用时间将归零\n此操作不可撤销",
        { title: "重置使用统计", dangerous: true, okText: "重置" },
      ).then(function (ok) {
        if (!ok) return;
        data.prompts.forEach(function (p) {
          p.usageCount = 0;
          p.lastUsedAt = null;
        });
        saveData();
        toast("success", "已重置（" + usedCount + " 条）");
      });
    });
  }

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
        if (
          newAnchorIdx >= 0 &&
          rangeAnchor !== null &&
          multiSelected.size > 0
        ) {
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
          const ai = list.findIndex(
            (it, i) => getItemId(it, i) === rangeAnchor,
          );
          const yi = list.findIndex((it, i) => getItemId(it, i) === rid);
          if (ai < 0 || yi < 0) return;
          const lo = Math.min(ai, yi),
            hi = Math.max(ai, yi);
          multiSelected.clear();
          for (let i = lo; i <= hi; i++)
            multiSelected.add(getItemId(list[i], i));
        }
      } else {
        if (multiSelected.has(rid)) multiSelected.delete(rid);
        else multiSelected.add(rid);
      }
      refresh();
    });

    $p.find("#ms-body").on(
      "click.ms",
      ".ms-reorder-arrows button",
      function () {
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
      },
    );

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
        '<span class="ms-form-title">调整 ' +
        esc(title) +
        " 内顺序</span>" +
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
              (bi === blocks.length - 1
                ? " disabled style='opacity:0.3;'"
                : "") +
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
              (bi === blocks.length - 1
                ? " disabled style='opacity:0.3;'"
                : "") +
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
            if (
              $parentSeries.length &&
              $parentSeries.css("display") === "none"
            ) {
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

        if (fromType === "series-child" || targetType === "series-child")
          return;

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
          $(e.target).closest(".ms-reorder-arrows, .ms-char-section-grip")
            .length
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
          if (p && p.character && isLocalCharKey(p.character))
            return p.character;
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
                desc: truncate(
                  (p.content || "").replace(/\s+/g, " ").trim(),
                  50,
                ),
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
      var orderedIds = groupPrompts.map(function (p) { return p.id; });
      navigateTo({ name: "preview", promptId: pid, _siblingIds: orderedIds });
    });

    refreshPrompts();
  }

  function computeSubscriptionHash(imported) {
    var stableContent = JSON.stringify({
      prompts: (imported.prompts || [])
        .map(function (p) {
          return {
            id: p.sourceId || p.id,
            title: p.title || "",
            content: p.content || "",
            author: p.author || "",
            series: p.series || "",
            tags: (p.tags || []).slice().sort(),
            groupId: p.groupId || "",
            character: p.character || "",
          };
        })
        .sort(function (a, b) {
          return (a.id || "").localeCompare(b.id || "");
        }),
      groups: (imported.groups || [])
        .map(function (g) {
          return {
            id: g.id,
            name: g.name || "",
            color: g.color || "",
            note: g.note || "",
            defaultAuthor: g.defaultAuthor || "",
            stagePrefix: g.stagePrefix || "",
          };
        })
        .sort(function (a, b) {
          return (a.id || "").localeCompare(b.id || "");
        }),
      tags: (imported.tags || [])
        .map(function (t) {
          return { id: t.id, name: t.name || "", color: t.color || "" };
        })
        .sort(function (a, b) {
          return (a.id || "").localeCompare(b.id || "");
        }),
      charGroups: (imported.charGroups || [])
        .map(function (cg) {
          return {
            name: cg.name || "",
            color: cg.color || "",
            note: cg.note || "",
            defaultAuthor: cg.defaultAuthor || "",
            stagePrefix: cg.stagePrefix || "",
            iconMode: cg.iconMode || "group",
            iconUrl: cg.iconUrl || "",
            iconCharKey: cg.iconCharKey || "",
            charKeys: (cg.charKeys || []).slice().sort(),
            charDisplayOrder: (cg.charDisplayOrder || []).slice(),
          };
        })
        .sort(function (a, b) {
          return (a.name || "").localeCompare(b.name || "");
        }),
      charBirthdays: Object.keys(imported.charBirthdays || {})
        .sort()
        .map(function (k) {
          return { key: k, value: imported.charBirthdays[k] };
        }),
      charBirthdayMessages: Object.keys(imported.charBirthdayMessages || {})
        .sort()
        .map(function (k) {
          var m = (imported.charBirthdayMessages || {})[k] || {};
          var versions = m.versions || {};
          return {
            key: k,
            versions: Object.keys(versions)
              .sort()
              .map(function (y) {
                var v = versions[y] || {};
                return {
                  year: y,
                  message: v.message || "",
                  authorName: v.authorName || "",
                  contentType: v.contentType || "",
                };
              }),
            message: m.message || "",
            authorName: m.authorName || "",
            contentType: m.contentType || "",
          };
        }),
    });
    return fastDualHash(stableContent);
  }

  function mergeSubscriptionData(sub, imported) {
    var ig = imported.groups || [];
    var ip = imported.prompts || [];
    var itags = imported.tags || [];
    var conflicts = [];
    try {
      var _subNameMap = {};
      if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
        SillyTavern.characters.forEach(function (c) {
          if (!c || !c.avatar) return;
          var dn = getCharDisplayName(c.avatar);
          if (!_subNameMap[dn]) _subNameMap[dn] = [];
          _subNameMap[dn].push(c.avatar);
        });
      }
      ip.forEach(function (p) {
        if (!p.character || isLocalCharKey(p.character)) {
          return;
        }
        var exportedName = p.character_name;
        if (
          exportedName &&
          _subNameMap[exportedName] &&
          _subNameMap[exportedName].length === 1
        ) {
          p.character = _subNameMap[exportedName][0];
        }
      });

      if (Array.isArray(imported.charGroups)) {
        imported.charGroups.forEach(function (icg) {
          if (!Array.isArray(icg.charKeys)) return;
          icg.charKeys = icg.charKeys.map(function (k) {
            if (!k || isLocalCharKey(k)) return k;
            var dn = getCharDisplayName(k);
            if (_subNameMap[dn] && _subNameMap[dn].length === 1) {
              return _subNameMap[dn][0];
            }
            return k;
          });
        });
      }
    } catch (e) {
      console.warn("[小剧场] 订阅智能匹配角色失败", e);
    }

    var sourceIdIndex = {};
    data.prompts.forEach(function (p) {
      if (p.sourceId) sourceIdIndex[p.sourceId] = p;
    });
    data.prompts.forEach(function (p) {
      if (!sourceIdIndex[p.id]) sourceIdIndex[p.id] = p;
    });
    var existFingerprints = new Set(
      data.prompts.map(function (p) {
        if (!p.fingerprint) p.fingerprint = contentFingerprint(p);
        return p.fingerprint;
      }),
    );
    var gidMap = {};
    if (sub.importGroups) {
      ig.forEach(function (g) {
        var ex = data.groups.find(function (eg) {
          return eg.name === g.name;
        });
        if (ex) {
          gidMap[g.id] = ex.id;
          if (sub.updateExisting !== false) {
            if (g.color !== undefined) ex.color = g.color;
            if (g.note !== undefined) ex.note = g.note;
            if (g.defaultAuthor !== undefined)
              ex.defaultAuthor = g.defaultAuthor;
          }
        } else {
          var ng = Object.assign({}, g, { id: uid() });
          data.groups.push(ng);
          gidMap[g.id] = ng.id;
        }
      });
    }
    var tagIdMap = {};
    if (sub.importTags && itags.length) {
      itags.forEach(function (t) {
        var ex = data.settings.definedTags.find(function (et) {
          return et.name === t.name;
        });
        if (ex) {
          tagIdMap[t.id] = ex.id;
          if (sub.updateExisting !== false && t.color !== undefined) {
            ex.color = t.color;
          }
        } else {
          var nt = Object.assign({}, t, { id: uid() });
          data.settings.definedTags.push(nt);
          tagIdMap[t.id] = nt.id;
        }
      });
    }
    var added = 0,
      updated = 0,
      skipped = 0,
      birthdayUpdated = 0;
    var birthdayDateConflicts = [];
    var birthdayMessageConflicts = [];
    ip.forEach(function (p) {
      var importSourceId = p.sourceId || p.id;
      var fp = contentFingerprint(p);
      var existingBySource = sourceIdIndex[importSourceId];
      if (existingBySource) {
        var existingFp =
          existingBySource.fingerprint || contentFingerprint(existingBySource);
        if (fp === existingFp) {
          skipped++;
          return;
        }
        if (sub.updateExisting === false) {
          skipped++;
          return;
        }
        var lastSubFp = existingBySource._lastSubFingerprint;
        var localModified = lastSubFp && lastSubFp !== existingFp;
        if (localModified) {
          if (!Array.isArray(conflicts)) conflicts = [];
          conflicts.push({
            existing: existingBySource,
            incoming: p,
            gidMap: gidMap,
            tagIdMap: tagIdMap,
            subId: sub.id,
            newFingerprint: fp,
          });
          skipped++;
          return;
        }
        existingBySource.title = p.title || existingBySource.title;
        existingBySource.content =
          p.content !== undefined ? p.content : existingBySource.content;
        existingBySource.author = p.author || existingBySource.author;
        existingBySource.series =
          p.series !== undefined ? p.series : existingBySource.series;
        if (
          !existingBySource.character &&
          p.character &&
          isLocalCharKey(p.character)
        ) {
          existingBySource.character = p.character;
        }
        existingBySource.fingerprint = fp;
        existingBySource._lastSubFingerprint = fp;
        existingBySource.updatedAt = Date.now();
        if (sub.importGroups && p.groupId)
          existingBySource.groupId = gidMap[p.groupId] || p.groupId;
        if (sub.importTags && p.tags)
          existingBySource.tags = p.tags.map(function (tid) {
            return tagIdMap[tid] || tid;
          });
        updated++;
        return;
      }
      if (existFingerprints.has(fp)) {
        skipped++;
        return;
      }
      var subChar = p.character || "";
      var np = Object.assign({}, p, {
        id: uid(),
        sourceId: importSourceId,
        author: p.author || "",
        starred: p.starred || false,
        pinned: false,
        fingerprint: fp,
        _lastSubFingerprint: fp,
        usageCount: 0,
        lastUsedAt: null,
        history: [],
        updatedAt: Date.now(),
        character: subChar,
        usageByCharacter: {},
      });

      np.groupId = sub.importGroups
        ? gidMap[p.groupId] || p.groupId || null
        : sub.targetGroupId || null;
      np.tags = sub.importTags
        ? (p.tags || []).map(function (tid) {
            return tagIdMap[tid] || tid;
          })
        : [];
      if (!Array.isArray(np.tags)) np.tags = [];
      data.prompts.push(np);
      existFingerprints.add(fp);
      added++;
    });
    if (sub.importCharGroups !== false && Array.isArray(imported.charGroups)) {
      imported.charGroups.forEach(function (icg) {
        if (!icg.name) return;
        var importKeys = Array.isArray(icg.charKeys)
          ? icg.charKeys.filter(function (k, idx, arr) {
              return k && arr.indexOf(k) === idx;
            })
          : [];
        if (importKeys.length === 0) return;
        var existing = data.groups.find(function (gg) {
          return gg.name === icg.name;
        });
        if (existing) {
          if (!Array.isArray(existing.charKeys)) existing.charKeys = [];
          importKeys.forEach(function (k) {
            data.groups.forEach(function (other) {
              if (other === existing) return;
              if (!Array.isArray(other.charKeys)) return;
              var oi = other.charKeys.indexOf(k);
              if (oi >= 0) other.charKeys.splice(oi, 1);
            });
            if (existing.charKeys.indexOf(k) < 0) existing.charKeys.push(k);
          });
          if (!existing.stagePrefix && icg.stagePrefix)
            existing.stagePrefix = icg.stagePrefix;
          if (
            Array.isArray(icg.charDisplayOrder) &&
            icg.charDisplayOrder.length > 0
          ) {
            if (!Array.isArray(existing.charDisplayOrder))
              existing.charDisplayOrder = [];
            icg.charDisplayOrder.forEach(function (k) {
              if (existing.charDisplayOrder.indexOf(k) < 0)
                existing.charDisplayOrder.push(k);
            });
          }
        } else {
          var newG = {
            id: uid(),
            name: icg.name,
            color:
              icg.color ||
              GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
            note: icg.note || "",
            defaultAuthor: icg.defaultAuthor || "",
            stagePrefix: icg.stagePrefix || "",
            iconMode: icg.iconMode || "group",
            iconUrl: icg.iconUrl || "",
            iconCharKey: icg.iconCharKey || "",
            charKeys: [],
          };
          importKeys.forEach(function (k) {
            data.groups.forEach(function (other) {
              if (!Array.isArray(other.charKeys)) return;
              var oi = other.charKeys.indexOf(k);
              if (oi >= 0) other.charKeys.splice(oi, 1);
            });
            if (newG.charKeys.indexOf(k) < 0) newG.charKeys.push(k);
          });
          data.groups.push(newG);
        }
      });
    }
    function _subRebindBdKey(k) {
      if (!k || isLocalCharKey(k)) return k;
      var dn = getCharDisplayName(k);
      if (_subNameMap[dn] && _subNameMap[dn].length === 1) {
        return _subNameMap[dn][0];
      }
      return k;
    }
    if (
      imported.charBirthdayMessages &&
      typeof imported.charBirthdayMessages === "object"
    ) {
      if (!data.settings.charBirthdayMessages)
        data.settings.charBirthdayMessages = {};
      Object.keys(imported.charBirthdayMessages).forEach(function (k) {
        var rawImp = imported.charBirthdayMessages[k];
        if (!rawImp) return;
        var impVersions;
        if (rawImp.versions) {
          impVersions = rawImp.versions;
        } else if (rawImp.message !== undefined) {
          impVersions = {
            default: {
              message: rawImp.message || "",
              authorName: rawImp.authorName || "",
              contentType: rawImp.contentType || "text",
              updatedAt: rawImp.updatedAt || 0,
              isOwn: false,
              year: "default",
            },
          };
        } else {
          return;
        }
        var newKey = _subRebindBdKey(k);
        var existing = data.settings.charBirthdayMessages[newKey] || {
          versions: {},
        };
        if (!existing.versions) existing.versions = {};
        Object.keys(impVersions).forEach(function (year) {
          var ivRaw = impVersions[year];
          if (!ivRaw || !(ivRaw.message || "").trim()) return;
          var iv = Object.assign({}, ivRaw, { isOwn: false, year: year });
          var ev = existing.versions[year];
          if (!ev) {
            existing.versions[year] = iv;
            birthdayUpdated++;
          } else if (sub.updateExisting !== false) {
            if (ev.isOwn === true) {
              if ((ev.message || "") !== (iv.message || "")) {
                birthdayMessageConflicts.push({
                  charKey: newKey,
                  year: year,
                  localMsg: ev,
                  incomingMsg: iv,
                });
              }
              return;
            }
            var impTs = iv.updatedAt || 0;
            var existTs = ev.updatedAt || 0;
            if (impTs === 0 || impTs >= existTs) {
              existing.versions[year] = iv;
              birthdayUpdated++;
            }
          }
        });
        if (Object.keys(existing.versions).length > 0) {
          data.settings.charBirthdayMessages[newKey] = existing;
        }
      });
    }
    if (imported.charBirthdays && typeof imported.charBirthdays === "object") {
      if (!data.settings.charBirthdays) data.settings.charBirthdays = {};
      Object.keys(imported.charBirthdays).forEach(function (k) {
        var d = imported.charBirthdays[k];
        if (!d || !/^\d{2}-\d{2}$/.test(d)) return;
        var newKey = _subRebindBdKey(k);
        if (
          data.settings.ownBirthdays &&
          data.settings.ownBirthdays[newKey] === true
        ) {
          var _localBdDate = data.settings.charBirthdays[newKey];
          if (_localBdDate && _localBdDate !== d) {
            birthdayDateConflicts.push({
              charKey: newKey,
              localDate: _localBdDate,
              incomingDate: d,
            });
          }
          return;
        }
        var existingDate = data.settings.charBirthdays[newKey];
        if (!existingDate) {
          data.settings.charBirthdays[newKey] = d;
          birthdayUpdated++;
        } else if (sub.updateExisting !== false && existingDate !== d) {
          data.settings.charBirthdays[newKey] = d;
          birthdayUpdated++;
        }
      });
    }
    _invalidateCharGroupCache();
    saveData();
    return {
      added: added,
      updated: updated,
      skipped: skipped,
      birthdayUpdated: birthdayUpdated,
      conflicts: conflicts,
      birthdayDateConflicts: birthdayDateConflicts,
      birthdayMessageConflicts: birthdayMessageConflicts,
    };
  }

  async function checkSubscription(subId, quiet) {
    var sub = data.subscriptions.find(function (s) {
      return s.id === subId;
    });
    if (!sub) return null;
    try {
      if (!quiet) toast("info", "正在检查: " + sub.name);
      var cleanUrl = sub.url.replace(
        /^(https?:\/\/gist\.githubusercontent\.com\/[^\/]+\/[^\/]+\/raw)\/[0-9a-f]{6,40}\//i,
        "$1/",
      );
      var fetchUrl =
        cleanUrl +
        (cleanUrl.indexOf("?") >= 0 ? "&" : "?") +
        "_t=" +
        Date.now();
      var ctrl = new AbortController();
      var timer = setTimeout(function () {
        ctrl.abort();
      }, 15000);
      var response;
      try {
        response = await fetch(fetchUrl, { signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) throw new Error("HTTP " + response.status);
      var rawText = await response.text();
      var imported;
      try {
        imported = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error("JSON解析失败: " + parseErr.message);
      }
      if (!imported.prompts && !imported.groups)
        throw new Error("无效的小剧场数据");
      var newHash = computeSubscriptionHash(imported);

      if (newHash === sub.lastHash) {
        sub.lastChecked = Date.now();
        saveData();
        if (!quiet) toast("info", sub.name + ": 没有新更新");
        return { added: 0, updated: 0, skipped: 0 };
      }
      var result = mergeSubscriptionData(sub, imported);
      sub.lastChecked = Date.now();
      sub.lastHash = newHash;
      if (!Array.isArray(sub.updateLog)) sub.updateLog = [];
      sub.updateLog.push({
        time: Date.now(),
        added: result.added,
        updated: result.updated,
        skipped: result.skipped,
      });
      if (sub.updateLog.length > 20) sub.updateLog.shift();
      if (result.added > 0 || result.updated > 0) {
        data.settings.subUpdatesPending =
          (data.settings.subUpdatesPending || 0) +
          result.added +
          result.updated;
      }
      saveData();
      if (!quiet) {
        var parts = [];
        if (result.added > 0) parts.push("新增 " + result.added + " 条");
        if (result.updated > 0) parts.push("更新 " + result.updated + " 条");
        if (result.skipped > 0) parts.push("跳过 " + result.skipped + " 条");
        if (result.birthdayUpdated > 0)
          parts.push("生日数据 " + result.birthdayUpdated + " 项");
        if (result.conflicts && result.conflicts.length > 0)
          parts.push("冲突 " + result.conflicts.length + " 条");
        toast(
          "success",
          sub.name + ": " + (parts.length > 0 ? parts.join("，") : "无变化"),
        );
      }
      if (result.conflicts && result.conflicts.length > 0) {
        showSubConflictDialog(result.conflicts);
      }
      if (
        (result.birthdayDateConflicts &&
          result.birthdayDateConflicts.length > 0) ||
        (result.birthdayMessageConflicts &&
          result.birthdayMessageConflicts.length > 0)
      ) {
        showBirthdayConflictDialog(
          result.birthdayDateConflicts || [],
          result.birthdayMessageConflicts || [],
        );
      }
      return result;
    } catch (e) {
      if (!quiet) toast("error", sub.name + " 检查失败: " + e.message);
      return null;
    }
  }

  async function checkAllSubscriptions(silent) {
    if (data.subscriptions.length === 0) {
      if (!silent) toast("info", "没有订阅");
      return;
    }
    if (!silent)
      toast("info", "正在检查" + data.subscriptions.length + " 个订阅...");
    var totalAdded = 0,
      totalUpdated = 0,
      totalSkipped = 0,
      totalBirthdayUpdated = 0,
      errors = 0;
    var allConflicts = [];
    for (var i = 0; i < data.subscriptions.length; i++) {
      var result = await checkSubscription(data.subscriptions[i].id, true);
      if (result) {
        totalAdded += result.added;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        totalBirthdayUpdated += result.birthdayUpdated || 0;
        if (result.conflicts && result.conflicts.length > 0) {
          allConflicts = allConflicts.concat(result.conflicts);
        }
      } else errors++;
    }
    var parts = [];
    if (totalAdded > 0) parts.push("新增 " + totalAdded + " 条");
    if (totalUpdated > 0) parts.push("更新 " + totalUpdated + " 条");
    if (totalBirthdayUpdated > 0)
      parts.push("生日数据 " + totalBirthdayUpdated + " 项");
    if (errors > 0) parts.push(errors + " 个失败");
    if (parts.length === 0) parts.push("全部已是最新");
    if (!silent || totalAdded > 0 || totalUpdated > 0 || errors > 0) {
      toast(
        errors > 0 ? "warning" : "success",
        (silent ? "订阅自动检查: " : "检查完毕: ") + parts.join("，"),
      );
    }
    if (allConflicts.length > 0) {
      showSubConflictDialog(allConflicts);
    }
    if (currentView().name === "subscriptions") renderView();
  }

  function showSubConflictDialog(conflicts) {
    if (!conflicts || conflicts.length === 0) return;
    var html =
      '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:10px;line-height:1.6;">' +
      '<i class="fa-solid fa-triangle-exclamation" style="color:#f0a040;margin-right:4px;"></i>' +
      "检测到 <strong>" +
      conflicts.length +
      "</strong> 条剧场你修改过本地版本，作者也有更新。请逐条选择处理方式：</div>";
    html +=
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
      '<button class="ms-tbtn" id="ms-cf-all-keep" style="font-size:11px;padding:4px 10px;flex:1;">全部保留我的</button>' +
      '<button class="ms-tbtn" id="ms-cf-all-apply" style="font-size:11px;padding:4px 10px;flex:1;">全部应用新版</button>' +
      '<button class="ms-tbtn" id="ms-cf-all-copy" style="font-size:11px;padding:4px 10px;flex:1;">全部创建副本</button>' +
      "</div>";
    html += '<div style="max-height:50vh;overflow-y:auto;">';
    conflicts.forEach(function (c, i) {
      var localPreview = esc(truncate(c.existing.content || "", 80));
      var remotePreview = esc(truncate(c.incoming.content || "", 80));
      html +=
        '<div style="padding:10px 12px;margin-bottom:8px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(255,255,255,0.02);">' +
        '<div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--SmartThemeBodyColor,#ddd);">' +
        esc(c.existing.title) +
        "</div>" +
        '<div style="font-size:10px;color:#e88;margin-bottom:2px;"><i class="fa-solid fa-user-pen" style="margin-right:3px;"></i>我的版本</div>' +
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-bottom:6px;padding-left:14px;line-height:1.5;">' +
        localPreview +
        "</div>" +
        '<div style="font-size:10px;color:#7dce7d;margin-bottom:2px;"><i class="fa-solid fa-cloud-arrow-down" style="margin-right:3px;"></i>作者新版</div>' +
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-bottom:8px;padding-left:14px;line-height:1.5;">' +
        remotePreview +
        "</div>" +
        '<div style="display:flex;gap:8px;font-size:11px;flex-wrap:wrap;">' +
        '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-cf-' +
        i +
        '" value="keep" checked> 保留我的</label>' +
        '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-cf-' +
        i +
        '" value="apply"> 应用新版</label>' +
        '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-cf-' +
        i +
        '" value="copy"> 创建副本</label>' +
        "</div>" +
        "</div>";
    });
    html += "</div>";
    showModal({
      title: "订阅更新冲突",
      iconType: "warning",
      icon: "fa-code-branch",
      modalStyle: "min-width:420px;max-width:92vw;width:520px;",
      body: html,
      buttons: [
        { text: "取消", value: null },
        {
          text: "应用选择",
          cls: "primary",
          primary: true,
          action: function ($overlay) {
            var resolutions = [];
            conflicts.forEach(function (c, i) {
              var v =
                $overlay.find('input[name="ms-cf-' + i + '"]:checked').val() ||
                "keep";
              resolutions.push({ conflict: c, action: v });
            });
            applyConflictResolutions(resolutions);
            return true;
          },
        },
      ],
      onShow: function ($overlay) {
        $overlay.on("click", "#ms-cf-all-keep", function () {
          $overlay.find("input[type=radio][value=keep]").prop("checked", true);
        });
        $overlay.on("click", "#ms-cf-all-apply", function () {
          $overlay.find("input[type=radio][value=apply]").prop("checked", true);
        });
        $overlay.on("click", "#ms-cf-all-copy", function () {
          $overlay.find("input[type=radio][value=copy]").prop("checked", true);
        });
      },
    });
  }

  function showBirthdayConflictDialog(dateConflicts, msgConflicts) {
    if (
      (!dateConflicts || dateConflicts.length === 0) &&
      (!msgConflicts || msgConflicts.length === 0)
    )
      return;
    var totalCount =
      (dateConflicts ? dateConflicts.length : 0) +
      (msgConflicts ? msgConflicts.length : 0);
    var html =
      '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:10px;line-height:1.6;">' +
      '<i class="fa-solid fa-cake-candles" style="color:#e88aaa;margin-right:4px;"></i>' +
      "检测到 <strong>" +
      totalCount +
      "</strong> 条你自己设过/写过的生日数据，作者也有更新版本。请逐条选择处理方式：</div>";
    html +=
      '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
      '<button class="ms-tbtn" id="ms-bdcf-all-keep" style="font-size:11px;padding:4px 10px;flex:1;">全部保留我的</button>' +
      '<button class="ms-tbtn" id="ms-bdcf-all-apply" style="font-size:11px;padding:4px 10px;flex:1;">全部应用作者版</button>' +
      "</div>";
    html += '<div style="max-height:50vh;overflow-y:auto;">';
    if (dateConflicts && dateConflicts.length > 0) {
      html +=
        '<div style="font-size:11px;color:var(--ms-accent);font-weight:600;padding:4px 0 6px;"><i class="fa-solid fa-calendar-day" style="margin-right:4px;"></i>生日日期冲突 (' +
        dateConflicts.length +
        ")</div>";
      dateConflicts.forEach(function (c, i) {
        var dn = getCharDisplayName(c.charKey);
        html +=
          '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(255,255,255,0.02);">' +
          '<div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--SmartThemeBodyColor,#ddd);">' +
          esc(dn) +
          "</div>" +
          '<div style="display:flex;gap:12px;font-size:11px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">' +
          '<span style="color:#e88;"><i class="fa-solid fa-user-pen" style="margin-right:3px;"></i>我的:<strong style="margin-left:3px;">' +
          esc(c.localDate) +
          "</strong></span>" +
          '<span style="color:#7dce7d;"><i class="fa-solid fa-cloud-arrow-down" style="margin-right:3px;"></i>作者:<strong style="margin-left:3px;">' +
          esc(c.incomingDate) +
          "</strong></span>" +
          "</div>" +
          '<div style="display:flex;gap:8px;font-size:11px;flex-wrap:wrap;">' +
          '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-bdcf-d-' +
          i +
          '" value="keep" checked> 保留我的</label>' +
          '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-bdcf-d-' +
          i +
          '" value="apply"> 应用作者版</label>' +
          "</div>" +
          "</div>";
      });
    }
    if (msgConflicts && msgConflicts.length > 0) {
      html +=
        '<div style="font-size:11px;color:var(--ms-accent);font-weight:600;padding:8px 0 6px;"><i class="fa-solid fa-envelope-open-text" style="margin-right:4px;"></i>祝福语冲突 (' +
        msgConflicts.length +
        ")</div>";
      msgConflicts.forEach(function (c, i) {
        var dn = getCharDisplayName(c.charKey);
        var yLabel = c.year === "default" ? "通用版" : c.year + " 年";
        var localPv = esc(truncate(c.localMsg.message || "", 80));
        var incomingPv = esc(truncate(c.incomingMsg.message || "", 80));
        html +=
          '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(255,255,255,0.02);">' +
          '<div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--SmartThemeBodyColor,#ddd);">' +
          esc(dn) +
          ' <span style="font-size:10px;opacity:0.7;font-weight:normal;">(' +
          esc(yLabel) +
          ")</span></div>" +
          '<div style="font-size:10px;color:#e88;margin-bottom:2px;"><i class="fa-solid fa-user-pen" style="margin-right:3px;"></i>我写的</div>' +
          '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-bottom:6px;padding-left:14px;line-height:1.5;">' +
          localPv +
          "</div>" +
          '<div style="font-size:10px;color:#7dce7d;margin-bottom:2px;"><i class="fa-solid fa-cloud-arrow-down" style="margin-right:3px;"></i>作者新版</div>' +
          '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#999);margin-bottom:8px;padding-left:14px;line-height:1.5;">' +
          incomingPv +
          "</div>" +
          '<div style="display:flex;gap:8px;font-size:11px;flex-wrap:wrap;">' +
          '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-bdcf-m-' +
          i +
          '" value="keep" checked> 保留我的</label>' +
          '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:3px;"><input type="radio" name="ms-bdcf-m-' +
          i +
          '" value="apply"> 应用作者版</label>' +
          "</div>" +
          "</div>";
      });
    }
    html += "</div>";
    showModal({
      title: "生日数据冲突",
      iconType: "warning",
      icon: "fa-cake-candles",
      modalStyle: "min-width:420px;max-width:92vw;width:520px;",
      body: html,
      buttons: [
        { text: "取消", value: null },
        {
          text: "应用选择",
          cls: "primary",
          primary: true,
          action: function ($overlay) {
            var changed = 0;
            (dateConflicts || []).forEach(function (c, i) {
              var v =
                $overlay
                  .find('input[name="ms-bdcf-d-' + i + '"]:checked')
                  .val() || "keep";
              if (v === "apply") {
                if (!data.settings.charBirthdays)
                  data.settings.charBirthdays = {};
                data.settings.charBirthdays[c.charKey] = c.incomingDate;
                if (data.settings.ownBirthdays) {
                  delete data.settings.ownBirthdays[c.charKey];
                }
                changed++;
              }
            });
            (msgConflicts || []).forEach(function (c, i) {
              var v =
                $overlay
                  .find('input[name="ms-bdcf-m-' + i + '"]:checked')
                  .val() || "keep";
              if (v === "apply") {
                if (!data.settings.charBirthdayMessages)
                  data.settings.charBirthdayMessages = {};
                var bdMsg = data.settings.charBirthdayMessages[c.charKey] || {
                  versions: {},
                };
                if (!bdMsg.versions) bdMsg.versions = {};
                bdMsg.versions[c.year] = Object.assign({}, c.incomingMsg, {
                  isOwn: false,
                });
                data.settings.charBirthdayMessages[c.charKey] = bdMsg;
                changed++;
              }
            });
            if (changed > 0) {
              saveData();
              toast("success", "已应用 " + changed + " 项变更");
            } else {
              toast("info", "全部保留了你自己的版本");
            }
            return true;
          },
        },
      ],
      onShow: function ($overlay) {
        $overlay.on("click", "#ms-bdcf-all-keep", function () {
          $overlay.find("input[type=radio][value=keep]").prop("checked", true);
        });
        $overlay.on("click", "#ms-bdcf-all-apply", function () {
          $overlay.find("input[type=radio][value=apply]").prop("checked", true);
        });
      },
    });
  }

  function applyConflictResolutions(resolutions) {
    var keepCnt = 0,
      applyCnt = 0,
      copyCnt = 0;
    resolutions.forEach(function (r) {
      var c = r.conflict;
      var existing = c.existing;
      var incoming = c.incoming;
      var fp = c.newFingerprint;
      if (r.action === "keep") {
        existing._lastSubFingerprint = fp;
        keepCnt++;
      } else if (r.action === "apply") {
        existing.title = incoming.title || existing.title;
        existing.content =
          incoming.content !== undefined ? incoming.content : existing.content;
        existing.author = incoming.author || existing.author;
        existing.series =
          incoming.series !== undefined ? incoming.series : existing.series;
        existing.fingerprint = fp;
        existing._lastSubFingerprint = fp;
        existing.updatedAt = Date.now();
        if (incoming.groupId && c.gidMap[incoming.groupId]) {
          existing.groupId = c.gidMap[incoming.groupId];
        }
        if (incoming.tags && Array.isArray(incoming.tags)) {
          existing.tags = incoming.tags.map(function (tid) {
            return c.tagIdMap[tid] || tid;
          });
        }
        applyCnt++;
      } else if (r.action === "copy") {
        var newPrompt = Object.assign({}, incoming, {
          id: uid(),
          sourceId: null,
          fingerprint: fp,
          _lastSubFingerprint: fp,
          starred: false,
          pinned: false,
          usageCount: 0,
          lastUsedAt: null,
          history: [],
          updatedAt: Date.now(),
          usageByCharacter: {},
          title: (incoming.title || existing.title) + " (作者新版)",
        });
        if (incoming.groupId && c.gidMap[incoming.groupId]) {
          newPrompt.groupId = c.gidMap[incoming.groupId];
        } else {
          newPrompt.groupId = existing.groupId;
        }
        if (incoming.tags && Array.isArray(incoming.tags)) {
          newPrompt.tags = incoming.tags.map(function (tid) {
            return c.tagIdMap[tid] || tid;
          });
        } else {
          newPrompt.tags = [];
        }
        existing._lastSubFingerprint = fp;
        data.prompts.push(newPrompt);
        copyCnt++;
      }
    });
    saveData();
    var msg = [];
    if (keepCnt > 0) msg.push("保留我的 " + keepCnt + " 条");
    if (applyCnt > 0) msg.push("应用新版 " + applyCnt + " 条");
    if (copyCnt > 0) msg.push("创建副本 " + copyCnt + " 条");
    toast("success", "冲突已处理：" + msg.join("，"));
    if (panelVisible) {
      try {
        renderView();
      } catch (e) {}
    }
  }

  async function autoCheckSubscriptions() {
    if (data.subscriptions.length === 0) return;
    if (autoCheckSubscriptions._running) return;
    var interval = (data.settings.autoCheckInterval || 6) * 3600000;
    if (interval <= 0) return;
    var now = Date.now();
    var needsCheck = data.subscriptions.some(function (s) {
      return !s.lastChecked || now - s.lastChecked > interval;
    });
    if (!needsCheck) return;
    autoCheckSubscriptions._running = true;
    try {
      await checkAllSubscriptions(true);
    } finally {
      autoCheckSubscriptions._running = false;
    }
  }

  function renderHistoryList() {
    const $p = setupPage("有历史记录的剧场");
    var withHistory = data.prompts.filter(function (p) {
      return p.history && p.history.length > 0;
    });
    var totalH = withHistory.reduce(function (s, p) {
      return s + p.history.length;
    }, 0);
    var html = "";
    if (withHistory.length === 0) {
      html =
        '<div class="ms-empty"><i class="fa-solid fa-clock-rotate-left"></i>没有任何剧场有历史记录</div>';
    } else {
      withHistory
        .sort(function (a, b) {
          return (
            (b.history ? b.history.length : 0) -
            (a.history ? a.history.length : 0)
          );
        })
        .forEach(function (p) {
          var g = p.groupId ? getGroup(p.groupId) : null;
          var gLabel = g
            ? '<span style="color:' +
              g.color +
              ';"><i class="fa-solid fa-folder" style="font-size:9px;margin-right:2px;"></i>' +
              esc(g.name) +
              "</span>"
            : '<span style="opacity:0.5;">未分组</span>';
          var lastSaved =
            p.history.length > 0
              ? formatDate(p.history[p.history.length - 1].savedAt)
              : "";
          html +=
            '<div class="ms-card" data-pid="' +
            p.id +
            '" style="cursor:pointer;">' +
            '<div class="ms-card-info" style="flex:1;min-width:0;">' +
            '<div class="ms-card-title">' +
            esc(p.title) +
            "</div>" +
            '<div class="ms-card-meta" style="gap:6px;">' +
            gLabel +
            '<span style="color:var(--ms-accent);">' +
            p.history.length +
            "/5 条历史</span>" +
            (lastSaved
              ? '<span style="opacity:0.6;">' + lastSaved + "</span>"
              : "") +
            "</div></div>" +
            '<div style="display:flex;gap:2px;flex-shrink:0;">' +
            '<button class="ms-card-qbtn" data-hlist-action="view" data-pid="' +
            p.id +
            '" title="查看历史"><i class="fa-solid fa-clock-rotate-left"></i></button>' +
            '<button class="ms-card-qbtn" data-hlist-action="clear" data-pid="' +
            p.id +
            '" title="清空此条历史"><i class="fa-solid fa-trash" style="color:var(--ms-danger);"></i></button>' +
            "</div></div>";
        });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        "<span>" +
          withHistory.length +
          " 条剧场 · 共 " +
          totalH +
          " 条历史</span>" +
          (withHistory.length > 0
            ? '<div class="ms-footer-btns"><a data-action="clear-all-h"><i class="fa-solid fa-broom"></i> 全部清空</a></div>'
            : ""),
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "click.ms",
      "[data-hlist-action='view']",
      function (e) {
        e.stopPropagation();
        navigateTo({ name: "history", promptId: $(this).data("pid") });
      },
    );
    $p.find("#ms-body").on(
      "click.ms",
      "[data-hlist-action='clear']",
      function (e) {
        e.stopPropagation();
        var pid = $(this).data("pid");
        var pr = getPrompt(pid);
        if (!pr) return;
        msConfirm("确定清空「" + pr.title + "」的所有版本历史吗？", {
          title: "清空历史",
          dangerous: true,
          okText: "清空",
        }).then(function (ok) {
          if (!ok) return;
          pr.history = [];
          saveData();
          toast("success", "已清空");
          renderHistoryList();
        });
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='clear-all-h']",
      function () {
        msConfirm(
          "确定清空所有剧场的版本历史吗？\n\n共 " + totalH + " 条历史记录",
          { title: "全部清空", dangerous: true, okText: "清空" },
        ).then(function (ok) {
          if (!ok) return;
          data.prompts.forEach(function (p) {
            p.history = [];
          });
          saveData();
          toast("success", "已全部清空");
          renderHistoryList();
        });
      },
    );
  }

  function renderRandomPool() {
    var ri = data.settings.randomInject;
    if (!ri) {
      ri = {
        enabled: false,
        excludedGroupIds: [],
        excludedSeries: [],
        excludedPromptIds: [],
      };
      data.settings.randomInject = ri;
    }
    var $p = setupPage("随机池管理", "随机注入池");
    var _expandedGroups = new Set();
    var _expandedRpoolSeries = new Set();
    var _rpoolSearch = "";
    var _rpoolFilterTags = [];
    function matchesRpoolFilter(p) {
      if (_rpoolSearch) {
        var lq = _rpoolSearch.toLowerCase();
        if (
          !(p.title && p.title.toLowerCase().indexOf(lq) >= 0) &&
          !(p.content && p.content.toLowerCase().indexOf(lq) >= 0) &&
          !(p.author && p.author.toLowerCase().indexOf(lq) >= 0) &&
          !(p.series && p.series.toLowerCase().indexOf(lq) >= 0)
        )
          return false;
      }
      if (_rpoolFilterTags.length > 0) {
        if (data.settings.filterTagMode === "and") {
          if (
            !p.tags ||
            !_rpoolFilterTags.every(function (tid) {
              return p.tags.indexOf(tid) >= 0;
            })
          )
            return false;
        } else {
          if (
            !p.tags ||
            !_rpoolFilterTags.some(function (tid) {
              return p.tags.indexOf(tid) >= 0;
            })
          )
            return false;
        }
      }
      return true;
    }
    var poolCount = data.prompts.filter(function (p) {
      return isInRandomPool(p);
    }).length;
    function isGroupExcluded(gid) {
      return ri.excludedGroupIds && ri.excludedGroupIds.indexOf(gid) >= 0;
    }
    function isSeriesExcluded(gid, sn) {
      return (
        ri.excludedSeries &&
        ri.excludedSeries.some(function (s) {
          return s.groupId === gid && s.seriesName === sn;
        })
      );
    }
    function isPromptExcluded(pid) {
      return ri.excludedPromptIds && ri.excludedPromptIds.indexOf(pid) >= 0;
    }
    function toggleGroupExclude(gid) {
      if (!ri.excludedGroupIds) ri.excludedGroupIds = [];
      var idx = ri.excludedGroupIds.indexOf(gid);
      if (idx >= 0) ri.excludedGroupIds.splice(idx, 1);
      else ri.excludedGroupIds.push(gid);
      saveData();
    }
    function toggleSeriesExclude(gid, sn) {
      if (!ri.excludedSeries) ri.excludedSeries = [];
      var idx = ri.excludedSeries.findIndex(function (s) {
        return s.groupId === gid && s.seriesName === sn;
      });
      if (idx >= 0) ri.excludedSeries.splice(idx, 1);
      else ri.excludedSeries.push({ groupId: gid, seriesName: sn });
      saveData();
    }
    function togglePromptExclude(pid) {
      if (!ri.excludedPromptIds) ri.excludedPromptIds = [];
      var idx = ri.excludedPromptIds.indexOf(pid);
      if (idx >= 0) ri.excludedPromptIds.splice(idx, 1);
      else ri.excludedPromptIds.push(pid);
      saveData();
    }
    function buildPoolBody() {
      var hasFilter = _rpoolSearch || _rpoolFilterTags.length > 0;
      var allExcluded =
        ri.excludedGroupIds.length > 0 ||
        ri.excludedSeries.length > 0 ||
        ri.excludedPromptIds.length > 0;
      var html = '<div style="padding:8px 14px 4px;">';
      html +=
        '<div style="position:relative;display:flex;align-items:center;"><input class="ms-search" id="ms-rpool-search" type="text" placeholder="搜索标题、内容、作者、系列..." value="' +
        esc(_rpoolSearch) +
        '" style="flex:1;padding-right:24px;"><span id="ms-rpool-search-clear" style="position:absolute;right:8px;cursor:pointer;color:var(--SmartThemeQuoteColor,#666);font-size:11px;display:' +
        (_rpoolSearch ? "block" : "none") +
        ';line-height:1;">×</span></div>';
      if (data.settings.definedTags.length > 0) {
        var modeLabel =
          data.settings.filterTagMode === "and" ? "全部匹配" : "任一匹配";
        html +=
          '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;align-items:center;">';
        html +=
          '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;margin-right:2px;"><i class="fa-solid fa-tags" style="margin-right:2px;"></i></span>';
        data.settings.definedTags.forEach(function (t) {
          var isActive = _rpoolFilterTags.indexOf(t.id) >= 0;
          html +=
            '<span class="ms-tag-toggle' +
            (isActive ? " active" : "") +
            '" data-rpool-filter-tag="' +
            t.id +
            '" style="font-size:10px;padding:2px 6px;' +
            (isActive ? "background:" + t.color + ";" : "") +
            '">' +
            esc(t.name) +
            "</span>";
        });
        if (_rpoolFilterTags.length > 0) {
          html +=
            '<span style="font-size:10px;color:var(--ms-accent);cursor:pointer;margin-left:2px;" id="ms-rpool-clear-tags">× 清除</span>';
          html +=
            '<button class="ms-filter-mode-btn" id="ms-rpool-tag-mode" style="margin-left:4px;">' +
            modeLabel +
            "</button>";
        }
        html += "</div>";
      }
      html += "</div>";

      html +=
        '<div style="padding:4px 14px 4px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="flex:1;"><i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>' +
        (hasFilter ? "筛选结果中，" : "") +
        '取消勾选即排除，被排除的内容不会被随机抽到</span><button class="ms-tbtn" id="ms-rpool-selall" style="font-size:10px;padding:3px 8px;">' +
        (allExcluded
          ? '<i class="fa-solid fa-check-double" style="margin-right:3px;"></i>全选'
          : '<i class="fa-solid fa-xmark" style="margin-right:3px;"></i>全不选') +
        "</button></div>";
      function buildGroupBlock(gid, gName, gColor, prompts) {
        var displayPrompts = hasFilter
          ? prompts.filter(matchesRpoolFilter)
          : prompts;
        if (hasFilter && displayPrompts.length === 0) return "";
        var gExcluded = isGroupExcluded(gid);
        var gCls = gExcluded ? " ms-rpool-excluded" : "";
        var gChecked = gExcluded ? "" : " checked";
        var isOpen = _expandedGroups.has(gid) || hasFilter;
        var gObj = gid === "_ungrouped" ? null : getGroup(gid);
        var useAvatar =
          gObj &&
          (isIPGroup(gObj) ||
            (gObj.iconMode === "custom" && gObj.iconUrl) ||
            (gObj.iconMode === "char" && gObj.iconCharKey));
        var iconH = useAvatar
          ? buildGroupAvatarHTML(gObj, 22)
          : '<i class="fa-solid fa-folder" style="color:' +
            gColor +
            ';font-size:13px;"></i>';
        var blockH =
          '<div class="ms-rpool-group"><div class="ms-rpool-group-header" data-rpool-gid="' +
          gid +
          '"><input type="checkbox" class="ms-rpool-gcb" data-gid="' +
          gid +
          '"' +
          gChecked +
          ">" +
          iconH +
          '<span style="flex:1;font-size:13px;" class="' +
          gCls +
          '">' +
          esc(gName) +
          '</span><span style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);">' +
          (hasFilter
            ? displayPrompts.length + "/" + prompts.length
            : prompts.length) +
          " 条</span>" +
          '<i class="fa-solid fa-angle-right ms-series-arrow' +
          (isOpen ? " open" : "") +
          '" style="font-size:10px;color:var(--SmartThemeQuoteColor,#555);flex-shrink:0;transition:transform 0.2s;"></i></div>';
        blockH +=
          '<div class="ms-rpool-group-body" style="display:' +
          (isOpen ? "block" : "none") +
          ';" data-rpool-body="' +
          gid +
          '">';
        var seriesMap = {};
        var noSeries = [];
        displayPrompts.forEach(function (p) {
          var sn = (p.series || "").trim();
          if (sn) {
            if (!seriesMap[sn]) seriesMap[sn] = [];
            seriesMap[sn].push(p);
          } else {
            noSeries.push(p);
          }
        });
        Object.keys(seriesMap).forEach(function (sn) {
          var sExcluded = isSeriesExcluded(gid, sn);
          var sChecked = sExcluded ? "" : " checked";
          var sCls = sExcluded || gExcluded ? " ms-rpool-excluded" : "";
          var sDisabled = gExcluded ? " disabled" : "";
          var _rpSid = gid + "_s_" + simpleHash(sn);
          var _rpSOpen = _expandedRpoolSeries.has(_rpSid) || hasFilter;
          blockH +=
            '<div class="ms-rpool-series-label' +
            (gExcluded ? " ms-rpool-excluded" : "") +
            '" data-rpool-series-id="' +
            _rpSid +
            '">' +
            '<input type="checkbox" class="ms-rpool-scb" data-gid="' +
            gid +
            '" data-sn="' +
            esc(sn) +
            '"' +
            sChecked +
            sDisabled +
            '><i class="fa-solid fa-layer-group" style="color:var(--ms-accent);opacity:0.6;font-size:11px;"></i><span class="' +
            sCls +
            '">' +
            esc(sn) +
            " (" +
            seriesMap[sn].length +
            ')</span><i class="fa-solid fa-angle-right ms-series-arrow' +
            (_rpSOpen ? " open" : "") +
            '" style="font-size:9px;margin-left:auto;"></i></div>';
          blockH +=
            '<div class="ms-rpool-series-items" data-rpool-series-body="' +
            _rpSid +
            '" style="display:' +
            (_rpSOpen ? "block" : "none") +
            ';">';
          seriesMap[sn].forEach(function (p) {
            var pExcluded = isPromptExcluded(p.id);
            var pChecked = pExcluded ? "" : " checked";
            var pCls =
              pExcluded || sExcluded || gExcluded ? " ms-rpool-excluded" : "";
            var pDisabled = gExcluded || sExcluded ? " disabled" : "";
            blockH +=
              '<div class="ms-rpool-item' +
              (gExcluded || sExcluded ? " disabled" : "") +
              '"><input type="checkbox" class="ms-rpool-pcb" data-pid="' +
              p.id +
              '"' +
              pChecked +
              pDisabled +
              '><span class="' +
              pCls +
              '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
              (hasFilter && _rpoolSearch
                ? highlightText(p.title, _rpoolSearch)
                : esc(truncate(p.title, 30))) +
              "</span></div>";
          });
          blockH += "</div>";
        });
        noSeries.forEach(function (p) {
          var pExcluded = isPromptExcluded(p.id);
          var pChecked = pExcluded ? "" : " checked";
          var pCls = pExcluded || gExcluded ? " ms-rpool-excluded" : "";
          var pDisabled = gExcluded ? " disabled" : "";
          blockH +=
            '<div class="ms-rpool-item' +
            (gExcluded ? " disabled" : "") +
            '"><input type="checkbox" class="ms-rpool-pcb" data-pid="' +
            p.id +
            '"' +
            pChecked +
            pDisabled +
            '><span class="' +
            pCls +
            '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
            (hasFilter && _rpoolSearch
              ? highlightText(p.title, _rpoolSearch)
              : esc(truncate(p.title, 30))) +
            "</span></div>";
        });
        blockH += "</div></div>";
        return blockH;
      }
      var hasContent = false;
      data.groups.forEach(function (g) {
        var gPrompts = getPromptsInGroup(g.id);
        if (gPrompts.length === 0) return;
        var block = buildGroupBlock(g.id, g.name, g.color, gPrompts);
        if (block) {
          html += block;
          hasContent = true;
        }
      });
      var ungrouped = getUngroupedPrompts();
      if (ungrouped.length > 0) {
        var block = buildGroupBlock("_ungrouped", "未分组", "#888", ungrouped);
        if (block) {
          html += block;
          hasContent = true;
        }
      }
      if (data.prompts.length === 0) {
        html =
          '<div class="ms-empty"><i class="fa-solid fa-dice"></i>还没有剧场</div>';
      } else if (hasFilter && !hasContent) {
        html +=
          '<div class="ms-empty" style="padding:20px;"><i class="fa-solid fa-magnifying-glass"></i>没有匹配的内容</div>';
      }
      return html;
    }
    function refreshPool() {
      poolCount = data.prompts.filter(function (p) {
        return isInRandomPool(p);
      }).length;
      var scrollTop = $p.find("#ms-body").scrollTop();
      var $oldSearch = $p.find("#ms-rpool-search");
      var wasFocused = $oldSearch.is(":focus");
      var cursorPos = 0;
      if (wasFocused && $oldSearch[0]) {
        cursorPos = $oldSearch[0].selectionStart || 0;
      }
      $p.find("#ms-body").html(buildPoolBody());
      $p.find("#ms-body").scrollTop(scrollTop);
      if (wasFocused) {
        var $newSearch = $p.find("#ms-rpool-search");
        $newSearch.focus();
        try {
          $newSearch[0].setSelectionRange(cursorPos, cursorPos);
        } catch (e) {}
      }
      var hasFilter = _rpoolSearch || _rpoolFilterTags.length > 0;
      if (hasFilter) {
        var filteredTotal = data.prompts.filter(matchesRpoolFilter).length;
        $p.find("#ms-rpool-footer-count").text(
          "筛选 " +
            filteredTotal +
            " 条 · 可用 " +
            poolCount +
            " / " +
            data.prompts.length +
            " 条",
        );
      } else {
        $p.find("#ms-rpool-footer-count").text(
          "可用 " + poolCount + " / " + data.prompts.length + " 条",
        );
      }
      updateInjectIndicator();
    }
    $p.find("#ms-body").html(buildPoolBody());
    $p.find("#ms-footer")
      .html(
        '<span id="ms-rpool-footer-count">可用 ' +
          poolCount +
          " / " +
          data.prompts.length +
          " 条</span>",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-body").on(
      "compositionstart.ms",
      "#ms-rpool-search",
      function () {
        this._composing = true;
      },
    );
    $p.find("#ms-body").on(
      "compositionend.ms",
      "#ms-rpool-search",
      function () {
        this._composing = false;
        _rpoolSearch = $(this).val();
        refreshPool();
      },
    );
    $p.find("#ms-body").on("input.ms", "#ms-rpool-search", function () {
      if (this._composing) return;
      _rpoolSearch = $(this).val();
      $p.find("#ms-rpool-search-clear").toggle(!!_rpoolSearch);
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-search-clear", function () {
      _rpoolSearch = "";
      $p.find("#ms-rpool-search").val("").focus();
      $(this).hide();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "[data-rpool-filter-tag]", function () {
      var tid = $(this).data("rpool-filter-tag");
      var idx = _rpoolFilterTags.indexOf(tid);
      if (idx >= 0) _rpoolFilterTags.splice(idx, 1);
      else _rpoolFilterTags.push(tid);
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-clear-tags", function () {
      _rpoolFilterTags = [];
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-tag-mode", function () {
      data.settings.filterTagMode =
        data.settings.filterTagMode === "and" ? "or" : "and";
      saveData();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", "#ms-rpool-selall", function () {
      var allExcluded =
        ri.excludedGroupIds.length > 0 ||
        ri.excludedSeries.length > 0 ||
        ri.excludedPromptIds.length > 0;

      if (allExcluded) {
        ri.excludedGroupIds = [];
        ri.excludedSeries = [];
        ri.excludedPromptIds = [];
      } else {
        var visiblePrompts = data.prompts.filter(matchesRpoolFilter);
        var visibleGroupIds = new Set();
        var visibleSeriesKeys = new Set();
        visiblePrompts.forEach(function (p) {
          var gid = p.groupId && getGroup(p.groupId) ? p.groupId : "_ungrouped";
          visibleGroupIds.add(gid);
          var sn = (p.series || "").trim();
          if (sn) visibleSeriesKeys.add(gid + "||" + sn);
        });
        if (!Array.isArray(ri.excludedGroupIds)) ri.excludedGroupIds = [];
        if (!Array.isArray(ri.excludedSeries)) ri.excludedSeries = [];
        if (!Array.isArray(ri.excludedPromptIds)) ri.excludedPromptIds = [];
        visibleGroupIds.forEach(function (gid) {
          if (ri.excludedGroupIds.indexOf(gid) < 0)
            ri.excludedGroupIds.push(gid);
        });
        visibleSeriesKeys.forEach(function (key) {
          var parts = key.split("||");
          var gid = parts[0],
            sn = parts.slice(1).join("||");
          var exists = ri.excludedSeries.some(function (s) {
            return s.groupId === gid && s.seriesName === sn;
          });
          if (!exists) ri.excludedSeries.push({ groupId: gid, seriesName: sn });
        });
        var visiblePromptIds = visiblePrompts.map(function (p) {
          return p.id;
        });
        ri.excludedPromptIds = Array.from(
          new Set(ri.excludedPromptIds.concat(visiblePromptIds)),
        );
      }

      saveData();
      refreshPool();
    });
    $p.find("#ms-body").on("click.ms", ".ms-rpool-group-header", function (e) {
      if ($(e.target).is("input[type='checkbox']")) return;
      var gid = $(this).data("rpool-gid");
      var isNowOpen = !_expandedGroups.has(gid);
      if (isNowOpen) _expandedGroups.add(gid);
      else _expandedGroups.delete(gid);
      $(this).find(".ms-series-arrow").toggleClass("open");
      $p.find('[data-rpool-body="' + gid + '"]').toggle();
    });
    $p.find("#ms-body").on("click.ms", ".ms-rpool-series-label", function (e) {
      if ($(e.target).is("input[type='checkbox']")) return;
      var seriesId = $(this).data("rpool-series-id");
      if (!seriesId) return;
      $(this).find(".ms-series-arrow").toggleClass("open");
      var $sbody = $p.find('[data-rpool-series-body="' + seriesId + '"]');
      $sbody.toggle();
      if ($sbody.is(":visible")) _expandedRpoolSeries.add(seriesId);
      else _expandedRpoolSeries.delete(seriesId);
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-gcb", function (e) {
      e.stopPropagation();
      var gid = $(this).data("gid");
      toggleGroupExclude(gid);
      refreshPool();
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-scb", function (e) {
      e.stopPropagation();
      var gid = $(this).data("gid");
      var sn = $(this).data("sn");
      toggleSeriesExclude(gid, sn);
      refreshPool();
    });
    $p.find("#ms-body").on("change.ms", ".ms-rpool-pcb", function (e) {
      e.stopPropagation();
      var pid = $(this).data("pid");
      togglePromptExclude(pid);
      refreshPool();
    });
  }

  function renderLostChars() {
    var $p = setupPage("处理失联角色");
    var validKeys = new Set();
    try {
      if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
        SillyTavern.characters.forEach(function (c) {
          if (c && c.avatar) validKeys.add(c.avatar);
        });
      }
    } catch (e) {}
    if (validKeys.size === 0) {
      $p.find("#ms-body").html(
        '<div class="ms-empty"><i class="fa-solid fa-circle-exclamation"></i>当前没有读到角色卡列表<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">为了安全起见暂不能处理</span></div>',
      );
      $p.find("#ms-footer").hide();
      bindAllEvents();
      return;
    }

    var lostMap = {};
    data.prompts.forEach(function (p) {
      if (p.character && !validKeys.has(p.character)) {
        if (!lostMap[p.character])
          lostMap[p.character] = { prompts: [], asMember: [], asIcon: [] };
        lostMap[p.character].prompts.push(p);
      }
    });
    if (data.settings.charBirthdays) {
      Object.keys(data.settings.charBirthdays).forEach(function (k) {
        if (k && !validKeys.has(k)) {
          if (!lostMap[k])
            lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
        }
      });
    }

    if (data.settings.charBirthdayMessages) {
      Object.keys(data.settings.charBirthdayMessages).forEach(function (k) {
        if (k && !validKeys.has(k)) {
          if (!lostMap[k])
            lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
        }
      });
    }
    data.groups.forEach(function (g) {
      if (Array.isArray(g.charKeys)) {
        g.charKeys.forEach(function (k) {
          if (!validKeys.has(k)) {
            if (!lostMap[k])
              lostMap[k] = { prompts: [], asMember: [], asIcon: [] };
            if (lostMap[k].asMember.indexOf(g.id) < 0)
              lostMap[k].asMember.push(g.id);
          }
        });
      }
      if (g.iconCharKey && !validKeys.has(g.iconCharKey)) {
        if (!lostMap[g.iconCharKey])
          lostMap[g.iconCharKey] = { prompts: [], asMember: [], asIcon: [] };
        if (lostMap[g.iconCharKey].asIcon.indexOf(g.id) < 0)
          lostMap[g.iconCharKey].asIcon.push(g.id);
      }
    });
    var lostKeys = Object.keys(lostMap);

    function getDispName(key) {
      var m = String(key).match(/^(.+?)\.[^.]+$/);
      return m ? m[1] : key;
    }
    function getFileBaseName(key) {
      return String(key).replace(/\.[^.]+$/, "");
    }

    function rebindToTarget(lostKey, targetKey) {
      var info = lostMap[lostKey];
      if (!info) return;
      info.prompts.forEach(function (p) {
        p.character = targetKey;
        if (p.usageByCharacter && p.usageByCharacter[lostKey] !== undefined) {
          p.usageByCharacter[targetKey] =
            (p.usageByCharacter[targetKey] || 0) + p.usageByCharacter[lostKey];
          delete p.usageByCharacter[lostKey];
        }
      });
      data.groups.forEach(function (g) {
        if (Array.isArray(g.charKeys)) {
          var i = g.charKeys.indexOf(lostKey);
          if (i >= 0) {
            g.charKeys.splice(i, 1);
            if (g.charKeys.indexOf(targetKey) < 0) g.charKeys.push(targetKey);
          }
        }
        if (Array.isArray(g.charDisplayOrder)) {
          var oi = g.charDisplayOrder.indexOf(lostKey);
          if (oi >= 0) g.charDisplayOrder[oi] = targetKey;
        }
        if (g.iconCharKey === lostKey) g.iconCharKey = targetKey;
      });
      if (data.settings.charBirthdays && data.settings.charBirthdays[lostKey]) {
        if (!data.settings.charBirthdays[targetKey]) {
          data.settings.charBirthdays[targetKey] =
            data.settings.charBirthdays[lostKey];
        }
        delete data.settings.charBirthdays[lostKey];
      }
      if (data.settings.ownBirthdays && data.settings.ownBirthdays[lostKey]) {
        if (!data.settings.ownBirthdays[targetKey]) {
          data.settings.ownBirthdays[targetKey] = true;
        }
        delete data.settings.ownBirthdays[lostKey];
      }
      if (
        data.settings.unlockedBirthdays &&
        data.settings.unlockedBirthdays[lostKey]
      ) {
        if (!data.settings.unlockedBirthdays[targetKey]) {
          data.settings.unlockedBirthdays[targetKey] =
            data.settings.unlockedBirthdays[lostKey];
        }
        delete data.settings.unlockedBirthdays[lostKey];
      }

      if (
        data.settings.charBirthdayMessages &&
        data.settings.charBirthdayMessages[lostKey]
      ) {
        if (!data.settings.charBirthdayMessages[targetKey]) {
          data.settings.charBirthdayMessages[targetKey] =
            data.settings.charBirthdayMessages[lostKey];
        }
        delete data.settings.charBirthdayMessages[lostKey];
      }
      if (
        data.settings.dismissedBirthdays &&
        data.settings.dismissedBirthdays[lostKey]
      ) {
        if (!data.settings.dismissedBirthdays[targetKey]) {
          data.settings.dismissedBirthdays[targetKey] =
            data.settings.dismissedBirthdays[lostKey];
        }
        delete data.settings.dismissedBirthdays[lostKey];
      }
      if (Array.isArray(data.settings.recentBoundChars)) {
        data.settings.recentBoundChars = data.settings.recentBoundChars.map(
          function (k) {
            return k === lostKey ? targetKey : k;
          },
        );
      }
      delete lostMap[lostKey];
      lostKeys = Object.keys(lostMap);
      _invalidateCharGroupCache();
    }

    function unbindLostKey(lostKey) {
      var info = lostMap[lostKey];
      if (!info) return;
      info.prompts.forEach(function (p) {
        p.character = "";
        p.usageByCharacter = {};
      });
      data.groups.forEach(function (g) {
        if (Array.isArray(g.charKeys)) {
          var i = g.charKeys.indexOf(lostKey);
          if (i >= 0) g.charKeys.splice(i, 1);
        }
        if (Array.isArray(g.charDisplayOrder)) {
          var oi = g.charDisplayOrder.indexOf(lostKey);
          if (oi >= 0) g.charDisplayOrder.splice(oi, 1);
        }
        if (g.iconCharKey === lostKey) {
          g.iconCharKey = "";
          if (g.iconMode === "char") g.iconMode = "group";
        }
      });
      if (data.settings.charBirthdays)
        delete data.settings.charBirthdays[lostKey];
      if (data.settings.charBirthdayMessages)
        delete data.settings.charBirthdayMessages[lostKey];
      if (data.settings.dismissedBirthdays)
        delete data.settings.dismissedBirthdays[lostKey];
      if (data.settings.ownBirthdays)
        delete data.settings.ownBirthdays[lostKey];
      if (data.settings.unlockedBirthdays)
        delete data.settings.unlockedBirthdays[lostKey];
      if (Array.isArray(data.settings.recentBoundChars)) {
        data.settings.recentBoundChars = data.settings.recentBoundChars.filter(
          function (k) {
            return k !== lostKey;
          },
        );
      }
      delete lostMap[lostKey];
      lostKeys = Object.keys(lostMap);
      _invalidateCharGroupCache();
    }

    function buildList() {
      if (lostKeys.length === 0) {
        return '<div class="ms-empty"><i class="fa-solid fa-circle-check" style="color:var(--ms-success);"></i>所有失联角色已处理完毕～<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">点击左上角返回设置</span></div>';
      }
      var html =
        '<div style="padding:10px 14px;background:rgba(var(--ms-accent-rgb),0.06);border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.5;">' +
        '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:4px;"></i>' +
        "检测到 <strong>" +
        lostKeys.length +
        "</strong> 个失联角色卡。失联通常是因为角色卡被删除、或重命名导致 avatar 文件名变化。" +
        '<br><span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">「重绑」匹配到当前的某张卡 · 「解绑」清空角色字段（剧场内容不会丢）</span>' +
        "</div>";
      lostKeys.forEach(function (lostKey) {
        var info = lostMap[lostKey];
        var dispName = getDispName(lostKey);
        var fileName = getFileBaseName(lostKey);
        var promptCnt = info.prompts.length;
        var samples = "";
        if (promptCnt > 0) {
          samples += '<div class="ms-lost-samples">';
          info.prompts.slice(0, 3).forEach(function (p) {
            var g = p.groupId ? getGroup(p.groupId) : null;
            var gLabel = g
              ? '<span style="color:' +
                g.color +
                ';opacity:0.7;">[' +
                esc(truncate(g.name, 8)) +
                "]</span> "
              : "";
            samples +=
              "<div>· " +
              gLabel +
              esc(truncate(p.title || "未命名", 30)) +
              "</div>";
          });
          if (promptCnt > 3)
            samples +=
              '<div style="opacity:0.6;">· ... 还有 ' +
              (promptCnt - 3) +
              " 条</div>";
          samples += "</div>";
        }
        var groupBadges = "";
        if (info.asMember.length > 0 || info.asIcon.length > 0) {
          groupBadges = '<div class="ms-lost-badges">';
          info.asMember.forEach(function (gid) {
            var g = getGroup(gid);
            if (g)
              groupBadges +=
                '<span class="ms-lost-badge" style="background:' +
                g.color +
                "33;color:" +
                g.color +
                ';">成员: ' +
                esc(truncate(g.name, 12)) +
                "</span>";
          });
          info.asIcon.forEach(function (gid) {
            var g = getGroup(gid);
            if (g)
              groupBadges +=
                '<span class="ms-lost-badge" style="background:rgba(255,180,80,0.15);color:#f0a040;">图标: ' +
                esc(truncate(g.name, 12)) +
                "</span>";
          });
          groupBadges += "</div>";
        }
        html +=
          '<div class="ms-lost-card" data-lost-key="' +
          esc(lostKey) +
          '">' +
          '<div class="ms-lost-meta">' +
          '<div class="ms-lost-icon"><i class="fa-solid fa-user-slash"></i></div>' +
          '<div class="ms-lost-info">' +
          '<div class="ms-lost-name">' +
          esc(dispName) +
          "</div>" +
          '<div class="ms-lost-fname" title="' +
          esc(lostKey) +
          '">' +
          esc(fileName) +
          "</div>" +
          '<div class="ms-lost-stats">' +
          (promptCnt > 0
            ? '<i class="fa-solid fa-masks-theater" style="font-size:10px;margin-right:3px;color:var(--ms-accent);"></i>' +
              promptCnt +
              " 条剧场"
            : '<span style="opacity:0.5;">无关联剧场</span>') +
          "</div>" +
          samples +
          groupBadges +
          "</div>" +
          "</div>" +
          '<div class="ms-lost-actions">' +
          '<button class="ms-tbtn" data-lost-action="rebind" data-lost-key="' +
          esc(lostKey) +
          '" style="font-size:11px;padding:5px 12px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-link" style="margin-right:3px;"></i>重绑</button>' +
          '<button class="ms-tbtn" data-lost-action="unbind" data-lost-key="' +
          esc(lostKey) +
          '" style="font-size:11px;padding:5px 12px;"><i class="fa-solid fa-link-slash" style="margin-right:3px;"></i>解绑</button>' +
          "</div>" +
          "</div>";
      });
      return html;
    }

    function refresh() {
      $p.find("#ms-body").html(buildList());
      if (lostKeys.length === 0) {
        $p.find("#ms-footer").hide();
        _invalidateCharGroupCache();
        saveData();
      } else {
        $p.find("#ms-footer span:first").text(lostKeys.length + " 个失联角色");
      }
    }

    function showRebindDialog(lostKey) {
      var allLocalKeys = Array.from(validKeys);
      var dispName = getDispName(lostKey);
      var fileName = getFileBaseName(lostKey);
      var dispLower = dispName.toLowerCase();

      function buildSearchList(kw) {
        var lkw = (kw || "").toLowerCase();
        var matched = allLocalKeys.filter(function (k) {
          if (!lkw) return true;
          return (
            getCharDisplayName(k).toLowerCase().indexOf(lkw) >= 0 ||
            String(k).toLowerCase().indexOf(lkw) >= 0
          );
        });
        matched.sort(function (a, b) {
          var aName = getCharDisplayName(a).toLowerCase();
          var bName = getCharDisplayName(b).toLowerCase();
          var aMatch =
            aName === dispLower
              ? 0
              : aName.indexOf(dispLower) === 0
                ? 1
                : aName.indexOf(dispLower) >= 0
                  ? 2
                  : 3;
          var bMatch =
            bName === dispLower
              ? 0
              : bName.indexOf(dispLower) === 0
                ? 1
                : bName.indexOf(dispLower) >= 0
                  ? 2
                  : 3;
          if (aMatch !== bMatch) return aMatch - bMatch;
          return aName.localeCompare(bName);
        });
        if (matched.length === 0) {
          return '<div style="padding:20px;text-align:center;color:var(--SmartThemeQuoteColor,#666);font-size:12px;">没有匹配的角色</div>';
        }
        var html =
          '<div class="ms-modal-list" style="max-height:300px;overflow-y:auto;">';
        matched.slice(0, 100).forEach(function (k) {
          var name = getCharDisplayName(k);
          var fname = getFileBaseName(k);
          var avatarPath = getCharAvatarPathSafe(k);
          var iconHtml = avatarPath
            ? '<img src="' +
              esc(avatarPath) +
              '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="color:#b48cc8;font-size:12px;"></i>';
          html +=
            '<div class="ms-modal-list-item" data-target-key="' +
            esc(k) +
            '">' +
            '<div class="ms-modal-list-icon">' +
            iconHtml +
            "</div>" +
            '<div class="ms-modal-list-info">' +
            '<div class="ms-modal-list-name">' +
            esc(name) +
            "</div>" +
            '<div class="ms-modal-list-desc">' +
            esc(fname) +
            "</div>" +
            "</div>" +
            "</div>";
        });
        if (matched.length > 100) {
          html +=
            '<div style="padding:8px;text-align:center;font-size:10px;color:var(--SmartThemeQuoteColor,#666);">仅显示前 100 个，请输入关键词缩小范围</div>';
        }
        html += "</div>";
        return html;
      }

      showModal({
        title: "重绑「" + dispName + "」",
        iconType: "info",
        icon: "fa-link",
        modalStyle: "min-width:380px;max-width:90vw;width:420px;",
        body: function () {
          return (
            '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;font-family:monospace;background:rgba(255,255,255,0.04);padding:6px 8px;border-radius:4px;">原文件名: ' +
            esc(fileName) +
            "</div>" +
            '<input type="text" class="ms-modal-search" placeholder="搜索角色名或文件名..." id="ms-rebind-search">' +
            '<div id="ms-rebind-list">' +
            buildSearchList("") +
            "</div>"
          );
        },
        buttons: [{ text: "取消", value: null }],
        cancelValue: null,
        onShow: function ($overlay, close) {
          var $search = $overlay.find("#ms-rebind-search");
          $search.focus();
          $overlay.on("input", "#ms-rebind-search", function () {
            $overlay
              .find("#ms-rebind-list")
              .html(buildSearchList($(this).val()));
          });
          $overlay.on("click", ".ms-modal-list-item", function () {
            var key = $(this).attr("data-target-key");
            if (!key) return;
            rebindToTarget(lostKey, key);
            toast("success", "已重绑到 " + getCharDisplayName(key));
            close("rebound");
          });
        },
      }).then(function () {
        refresh();
      });
    }

    $p.find("#ms-body").html(buildList());
    $p.find("#ms-footer")
      .html(
        "<span>" +
          lostKeys.length +
          ' 个失联角色</span><div class="ms-footer-btns">' +
          '<a data-lost-batch="auto"><i class="fa-solid fa-wand-magic-sparkles"></i> 自动匹配</a> ' +
          '<a data-lost-batch="unbind-all" style="color:var(--ms-danger);"><i class="fa-solid fa-link-slash"></i> 全部解绑</a>' +
          "</div>",
      )
      .show();
    bindAllEvents();

    $p.find("#ms-body").on(
      "click.ms",
      '[data-lost-action="rebind"]',
      function (e) {
        e.stopPropagation();
        showRebindDialog($(this).attr("data-lost-key"));
      },
    );

    $p.find("#ms-body").on(
      "click.ms",
      '[data-lost-action="unbind"]',
      function (e) {
        e.stopPropagation();
        var lostKey = $(this).attr("data-lost-key");
        var info = lostMap[lostKey];
        if (!info) return;
        var msgs = [];
        if (info.prompts.length > 0)
          msgs.push("· " + info.prompts.length + " 条剧场会清空角色绑定");
        if (info.asMember.length > 0)
          msgs.push("· 从 " + info.asMember.length + " 个分组成员中移除");
        if (info.asIcon.length > 0)
          msgs.push(
            "· " + info.asIcon.length + " 个分组的图标会重置为群聊样式",
          );
        msgs.push("");
        msgs.push("剧场内容本身不会被删除");
        msConfirm(
          "确定解绑「" + getDispName(lostKey) + "」吗？\n\n" + msgs.join("\n"),
          {
            title: "确认解绑",
            dangerous: true,
            okText: "解绑",
          },
        ).then(function (ok) {
          if (!ok) return;
          unbindLostKey(lostKey);
          toast("success", "已解绑");
          refresh();
        });
      },
    );

    $p.find("#ms-footer").on(
      "click.ms",
      '[data-lost-batch="auto"]',
      function () {
        var allLocalKeys = Array.from(validKeys);
        var nameMap = {};
        allLocalKeys.forEach(function (k) {
          var name = getCharDisplayName(k);
          if (!nameMap[name]) nameMap[name] = [];
          nameMap[name].push(k);
        });

        function normalizeForFuzzy(s) {
          if (!s) return "";
          return String(s)
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[（(][^）)]*[）)]/g, "")
            .replace(/[-_·・．.、,，]/g, "")
            .trim();
        }

        var fuzzyNameMap = {};
        allLocalKeys.forEach(function (k) {
          var fn = normalizeForFuzzy(getCharDisplayName(k));
          if (!fn) return;
          if (!fuzzyNameMap[fn]) fuzzyNameMap[fn] = [];
          fuzzyNameMap[fn].push(k);
        });

        var suggestions = [];
        Object.keys(lostMap).forEach(function (lostKey) {
          var info = lostMap[lostKey];
          var fileName = getDispName(lostKey);
          var exportedName = null;
          for (var i = 0; i < info.prompts.length; i++) {
            if (info.prompts[i].character_name) {
              exportedName = info.prompts[i].character_name;
              break;
            }
          }

          var matchType = null;
          var candidates = [];

          if (exportedName && nameMap[exportedName]) {
            candidates = nameMap[exportedName].slice();
            matchType = candidates.length === 1 ? "name_exact" : "name_multi";
          }

          if (candidates.length === 0 && nameMap[fileName]) {
            candidates = nameMap[fileName].slice();
            matchType = candidates.length === 1 ? "file_exact" : "file_multi";
          }

          if (candidates.length === 0) {
            var fuzzyKey = normalizeForFuzzy(exportedName || fileName);
            if (fuzzyKey && fuzzyNameMap[fuzzyKey]) {
              candidates = fuzzyNameMap[fuzzyKey].slice();
              matchType =
                candidates.length === 1 ? "fuzzy_exact" : "fuzzy_multi";
            }
          }

          suggestions.push({
            lostKey: lostKey,
            lostDisplayName: exportedName || fileName,
            fileName: fileName,
            exportedName: exportedName,
            promptCount: info.prompts.length,
            candidates: candidates,
            matchType: matchType,
          });
        });

        var autoCount = suggestions.filter(function (s) {
          return (
            s.matchType === "name_exact" ||
            s.matchType === "file_exact" ||
            s.matchType === "fuzzy_exact"
          );
        }).length;
        var needPickCount = suggestions.filter(function (s) {
          return s.candidates.length > 1;
        }).length;
        var unmatchedCount = suggestions.filter(function (s) {
          return s.candidates.length === 0;
        }).length;

        if (autoCount === 0 && needPickCount === 0) {
          toast("info", "没有找到任何本地匹配的角色");
          return;
        }

        var dlgHtml =
          '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:10px;line-height:1.7;">' +
          '<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--ms-accent);margin-right:4px;"></i>' +
          "扫描完毕：<strong>" +
          autoCount +
          "</strong> 个可自动重绑，<strong>" +
          needPickCount +
          "</strong> 个有多个候选需要你选，<strong>" +
          unmatchedCount +
          "</strong> 个无匹配。<br>" +
          '<span style="opacity:0.7;">取消勾选的行不会被改动，可以稍后手动处理。</span>' +
          "</div>";
        dlgHtml += '<div style="max-height:50vh;overflow-y:auto;">';

        suggestions.forEach(function (s, idx) {
          if (s.candidates.length === 0) {
            dlgHtml +=
              '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(var(--ms-danger-rgb),0.04);opacity:0.7;">' +
              '<div style="font-size:12px;color:var(--SmartThemeBodyColor,#bbb);">' +
              '<i class="fa-solid fa-user-slash" style="color:var(--ms-danger);margin-right:4px;"></i>' +
              esc(s.lostDisplayName) +
              '<span style="font-size:10px;opacity:0.6;margin-left:6px;">(' +
              s.promptCount +
              "条剧场)</span>" +
              "</div>" +
              '<div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:3px;">本地没有匹配的角色卡</div>' +
              "</div>";
            return;
          }

          var isAuto = s.candidates.length === 1;
          var typeLabel = "";
          if (s.matchType === "name_exact")
            typeLabel =
              '<span style="color:var(--ms-success);font-size:10px;">✓ 按角色名精确匹配</span>';
          else if (s.matchType === "file_exact")
            typeLabel =
              '<span style="color:var(--ms-success);font-size:10px;">✓ 按文件名精确匹配</span>';
          else if (s.matchType === "fuzzy_exact")
            typeLabel =
              '<span style="color:#f0a040;font-size:10px;">⚠ 模糊匹配（可能不准）</span>';
          else if (s.matchType === "name_multi")
            typeLabel =
              '<span style="color:#f0a040;font-size:10px;">⚠ 同名有 ' +
              s.candidates.length +
              " 个候选</span>";
          else if (s.matchType === "file_multi")
            typeLabel =
              '<span style="color:#f0a040;font-size:10px;">⚠ 同文件名有 ' +
              s.candidates.length +
              " 个候选</span>";
          else if (s.matchType === "fuzzy_multi")
            typeLabel =
              '<span style="color:#f0a040;font-size:10px;">⚠ 模糊匹配有 ' +
              s.candidates.length +
              " 个候选</span>";

          dlgHtml +=
            '<div style="padding:8px 10px;margin-bottom:6px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;background:rgba(255,255,255,0.02);">' +
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
            '<input type="checkbox" class="ms-auto-apply-cb" data-idx="' +
            idx +
            '"' +
            (isAuto ? " checked" : "") +
            ">" +
            '<span style="flex:1;"><strong>' +
            esc(s.lostDisplayName) +
            "</strong>" +
            '<span style="font-size:10px;opacity:0.6;margin-left:6px;">(' +
            s.promptCount +
            "条剧场)</span>" +
            "</span>" +
            typeLabel +
            "</label>";
          if (s.candidates.length === 1) {
            var k = s.candidates[0];
            var ap = getCharAvatarPathSafe(k);
            var avH = ap
              ? '<img src="' +
                esc(ap) +
                '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;margin-right:4px;" onerror="this.style.display=\'none\';this.onerror=null;">'
              : '<i class="fa-solid fa-user" style="font-size:10px;margin-right:4px;opacity:0.6;"></i>';
            dlgHtml +=
              '<div style="font-size:11px;color:var(--SmartThemeBodyColor,#ccc);margin-top:4px;padding-left:22px;">' +
              "→ " +
              avH +
              esc(getCharDisplayName(k)) +
              '<span style="font-size:9px;opacity:0.5;margin-left:4px;">(' +
              esc(getFileBaseName(k)) +
              ")</span>" +
              "</div>";
          } else {
            dlgHtml +=
              '<div style="margin-top:6px;padding-left:22px;display:flex;flex-direction:column;gap:3px;">';
            s.candidates.forEach(function (k, ci) {
              var ap = getCharAvatarPathSafe(k);
              var avH = ap
                ? '<img src="' +
                  esc(ap) +
                  '" style="width:16px;height:16px;border-radius:3px;object-fit:cover;vertical-align:middle;" onerror="this.style.display=\'none\';this.onerror=null;">'
                : '<i class="fa-solid fa-user" style="font-size:10px;opacity:0.6;"></i>';
              dlgHtml +=
                '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:var(--SmartThemeBodyColor,#ccc);">' +
                '<input type="radio" name="ms-auto-pick-' +
                idx +
                '" value="' +
                esc(k) +
                '"' +
                (ci === 0 ? " checked" : "") +
                ">" +
                avH +
                "<span>" +
                esc(getCharDisplayName(k)) +
                "</span>" +
                '<span style="font-size:9px;opacity:0.5;">(' +
                esc(getFileBaseName(k)) +
                ")</span>" +
                "</label>";
            });
            dlgHtml += "</div>";
          }
          dlgHtml += "</div>";
        });
        dlgHtml += "</div>";

        showModal({
          title: "智能匹配结果",
          iconType: "info",
          icon: "fa-wand-magic-sparkles",
          modalStyle: "min-width:420px;max-width:94vw;width:520px;",
          body: dlgHtml,
          buttons: [
            { text: "取消", value: null },
            {
              text: "应用选中项",
              cls: "primary",
              primary: true,
              action: function ($overlay) {
                var applyCount = 0;
                $overlay.find(".ms-auto-apply-cb:checked").each(function () {
                  var idx = parseInt($(this).data("idx"));
                  var s = suggestions[idx];
                  if (!s || s.candidates.length === 0) return;
                  var targetKey;
                  if (s.candidates.length === 1) {
                    targetKey = s.candidates[0];
                  } else {
                    targetKey = $overlay
                      .find('input[name="ms-auto-pick-' + idx + '"]:checked')
                      .val();
                  }
                  if (targetKey) {
                    rebindToTarget(s.lostKey, targetKey);
                    applyCount++;
                  }
                });
                if (applyCount > 0) {
                  toast("success", "已重绑 " + applyCount + " 个角色");
                  refresh();
                } else {
                  toast("info", "没有应用任何更改");
                }
                return true;
              },
            },
          ],
          cancelValue: null,
        });
      },
    );

    $p.find("#ms-footer").on(
      "click.ms",
      '[data-lost-batch="unbind-all"]',
      function () {
        var totalPrompts = 0;
        var totalGroups = 0;
        Object.keys(lostMap).forEach(function (k) {
          totalPrompts += lostMap[k].prompts.length;
          totalGroups += lostMap[k].asMember.length + lostMap[k].asIcon.length;
        });
        msConfirm(
          "确定解绑全部 " +
            lostKeys.length +
            " 个失联角色吗？\n\n" +
            "· " +
            totalPrompts +
            " 条剧场会清空角色绑定\n" +
            "· 涉及 " +
            totalGroups +
            " 个分组的成员/图标关联\n\n" +
            "剧场内容本身不会被删除",
          { title: "确认全部解绑", dangerous: true, okText: "全部解绑" },
        ).then(function (ok) {
          if (!ok) return;
          Object.keys(lostMap)
            .slice()
            .forEach(function (lostKey) {
              unbindLostKey(lostKey);
            });
          toast("success", "已全部解绑");
          refresh();
        });
      },
    );
  }

  function renderSubscriptions() {
    var $p = $("#" + PANEL_ID);
    if (data.settings.subUpdatesPending > 0) {
      data.settings.subUpdatesPending = 0;
      saveData();
    }
    $p.find("#ms-title").text("订阅管理");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: false,
        add: true,
        addId: "ms-sub-add",
        addTitle: "添加订阅",
      }),
    );
    var html = "";
    if (data.subscriptions.length === 0) {
      html =
        '<div class="ms-empty"><i class="fa-solid fa-rss"></i>还没有订阅<br><span style="font-size:11px;opacity:0.6;margin-top:6px;display:block;">粘贴作者分享的 JSON 链接<br>即可一键同步更新</span></div>';
    } else {
      data.subscriptions.forEach(function (sub) {
        var lastCheck = sub.lastChecked
          ? formatDate(sub.lastChecked)
          : "从未检查";
        var lastLog =
          sub.updateLog && sub.updateLog.length > 0
            ? sub.updateLog[sub.updateLog.length - 1]
            : null;
        var statusH = "";
        if (lastLog) {
          var ps = [];
          if (lastLog.added > 0) ps.push("+" + lastLog.added);
          if (lastLog.updated > 0) ps.push("↑" + lastLog.updated);
          if (ps.length > 0)
            statusH =
              '<span style="color:var(--ms-accent);font-size:10px;">' +
              ps.join(" ") +
              "</span>";
        }
        html +=
          '<div class="ms-nav-item" data-sub-id="' +
          sub.id +
          '">' +
          '<div class="ms-nav-icon" style="background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);"><i class="fa-solid fa-rss"></i></div>' +
          '<div class="ms-nav-info"><div class="ms-nav-title">' +
          esc(sub.name) +
          "</div>" +
          '<div class="ms-nav-note">' +
          lastCheck +
          (statusH ? " · " + statusH : "") +
          "</div></div>" +
          '<i class="ms-nav-chevron fa-solid fa-angle-right"></i></div>';
      });
    }
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(
        data.subscriptions.length > 0
          ? "<span>" +
              data.subscriptions.length +
              ' 个订阅</span><div class="ms-footer-btns"><a data-action="check-all-subs"><i class="fa-solid fa-arrows-rotate"></i> 全部检查更新</a></div>'
          : "",
      )
      .show();
    bindAllEvents();
    $p.find("#ms-toolbar").on("click.ms", "#ms-sub-add", function () {
      navigateTo({ name: "subscription-add" });
    });
    $p.find("#ms-body").on(
      "click.ms",
      ".ms-nav-item[data-sub-id]",
      function () {
        navigateTo({
          name: "subscription-detail",
          subId: $(this).data("sub-id"),
        });
      },
    );
    $p.find("#ms-footer").on(
      "click.ms",
      "[data-action='check-all-subs']",
      async function () {
        var $a = $(this);
        $a.html('<i class="fa-solid fa-spinner fa-spin"></i> 检查中...');
        await checkAllSubscriptions();
      },
    );
  }

  function renderSubscriptionAdd() {
    var $p = setupPage("添加订阅");
    var groupOpts = '<option value="">不指定 (未分组)</option>';
    data.groups.forEach(function (g) {
      groupOpts += '<option value="' + g.id + '">' + esc(g.name) + "</option>";
    });
    $p.find("#ms-body").html(
      '<div class="ms-form">' +
        '<div style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);padding:4px 0 8px;line-height:1.6;">' +
        '<i class="fa-solid fa-circle-info" style="margin-right:4px;color:var(--ms-accent);"></i>' +
        "将作者分享的 JSON 文件链接粘贴到下方即可。<br>" +
        '<span style="font-size:10px;opacity:0.7;">支持 jsDelivr CDN、GitHub Raw或任意可公开访问的链接</span></div>' +
        '<div class="ms-field"><label>订阅名称</label><input type="text" id="ms-sub-name" placeholder="例：某作者的剧场合集"></div>' +
        '<div class="ms-field"><label>JSON 链接</label><input type="text" id="ms-sub-url" placeholder="https://..."></div>' +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">导入选项</div>' +
        '<div class="ms-export-opts-tight">' +
        chk("ms-sub-opt-groups", "checked", "导入分组信息") +
        chk("ms-sub-opt-tags", "checked", "导入标签信息") +
        chk(
          "ms-sub-opt-cgroups",
          "checked",
          '接收 IP 分组 <span style="font-size:10px;opacity:0.5;">(仅匹配本地已有角色)</span>',
        ) +
        chk(
          "ms-sub-opt-update",
          "checked",
          '允许更新已有内容 <span style="font-size:10px;opacity:0.5;">(关闭则只接收新增，不覆盖本地修改)</span>',
        ) +
        "</div>" +
        '<div class="ms-field" id="ms-sub-target-wrap" style="display:none;"><label>放入分组 <span style="font-weight:350;opacity:0.5;">(不导入分组时，新内容放入此分组)</span></label><select id="ms-sub-target">' +
        groupOpts +
        "</select></div>" +
        '<div class="ms-form-btns"><button class="ms-btn" id="ms-sub-cancel">取消</button><button class="ms-btn primary" id="ms-sub-save"><i class="fa-solid fa-plus" style="margin-right:4px;"></i>添加并检查</button></div>' +
        "</div>",
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleSubTarget() {
      $p.find("#ms-sub-target-wrap").toggle(
        !$p.find("#ms-sub-opt-groups").is(":checked"),
      );
    }
    toggleSubTarget();
    $p.find("#ms-body").on("change.ms", "#ms-sub-opt-groups", toggleSubTarget);
    $p.find("#ms-body").on("click.ms", "#ms-sub-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-sub-save", async function () {
      var name = $p.find("#ms-sub-name").val().trim();
      var url = $p.find("#ms-sub-url").val().trim();
      if (!name) {
        toast("warning", "请输入订阅名称");
        return;
      }
      if (!url) {
        toast("warning", "请输入链接");
        return;
      }
      if (!/^https?:\/\//i.test(url)) {
        toast("warning", "请输入有效的HTTP(S) 链接");
        return;
      }
      var dup = data.subscriptions.find(function (s) {
        return s.url === url;
      });
      if (dup) {
        toast("warning", "已经订阅过这个链接了：" + dup.name);
        return;
      }
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html(
          '<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>验证中...',
        );
      try {
        var fetchUrl =
          url + (url.indexOf("?") >= 0 ? "&" : "?") + "_t=" + Date.now();
        var response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var rawText = await response.text();
        var imported = JSON.parse(rawText);
        if (!imported.prompts && !imported.groups)
          throw new Error("无效的小剧场数据");
        if (imported.prompts && !Array.isArray(imported.prompts))
          throw new Error("prompts 字段格式错误");
        if (imported.groups && !Array.isArray(imported.groups))
          throw new Error("groups 字段格式错误");
        if (imported.tags && !Array.isArray(imported.tags))
          throw new Error("tags 字段格式错误");
        if (imported.charGroups && !Array.isArray(imported.charGroups))
          throw new Error("charGroups 字段格式错误");
        var useGroups = $p.find("#ms-sub-opt-groups").is(":checked");
        var sub = {
          id: uid(),
          name: name,
          url: url,
          importGroups: useGroups,
          importTags: $p.find("#ms-sub-opt-tags").is(":checked"),
          importCharGroups: $p.find("#ms-sub-opt-cgroups").is(":checked"),
          updateExisting: $p.find("#ms-sub-opt-update").is(":checked"),
          targetGroupId: !useGroups
            ? $p.find("#ms-sub-target").val() || null
            : null,
          lastChecked: null,
          lastHash: "",
          addedAt: Date.now(),
          updateLog: [],
        };
        data.subscriptions.push(sub);
        var result = mergeSubscriptionData(sub, imported);
        sub.lastChecked = Date.now();
        sub.lastHash = computeSubscriptionHash(imported);
        sub.updateLog.push({
          time: Date.now(),
          added: result.added,
          updated: result.updated,
          skipped: result.skipped,
        });
        saveData();
        var parts = [];
        if (result.added > 0) parts.push("新增 " + result.added + " 条");
        if (result.updated > 0) parts.push("更新 " + result.updated + " 条");
        if (result.skipped > 0) parts.push("跳过 " + result.skipped + " 条");
        toast(
          "success",
          "订阅成功！" + (parts.length > 0 ? parts.join("，") : "数据已是最新"),
        );
        navigateBack();
      } catch (e) {
        toast("error", "验证失败: " + e.message);
        $btn
          .prop("disabled", false)
          .html(
            '<i class="fa-solid fa-plus" style="margin-right:4px;"></i>添加并检查',
          );
      }
    });
  }

  function renderSubscriptionDetail(v) {
    var sub = data.subscriptions.find(function (s) {
      return s.id === v.subId;
    });
    if (!sub) {
      navigateBack();
      return;
    }
    var $p = setupPage(sub.name, esc(truncate(sub.name, 20)));
    var logs = sub.updateLog || [];
    var logH = "";
    if (logs.length === 0) {
      logH =
        '<div style="text-align:center;padding:12px;font-size:12px;color:var(--SmartThemeQuoteColor,#555);font-style:italic;">暂无更新记录</div>';
    } else {
      var revLogs = [].concat(logs).reverse();
      revLogs.forEach(function (log) {
        var ps = [];
        if (log.added > 0)
          ps.push(
            '<span style="color:#7dce7d;">+' + log.added + " 新增</span>",
          );
        if (log.updated > 0)
          ps.push(
            '<span style="color:var(--ms-accent);">↑' +
              log.updated +
              " 更新</span>",
          );
        if (log.skipped > 0)
          ps.push(
            '<span style="color:var(--SmartThemeQuoteColor,#888);">' +
              log.skipped +
              " 跳过</span>",
          );
        logH +=
          '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;">' +
          '<span style="color:var(--SmartThemeQuoteColor,#666);font-size:11px;flex-shrink:0;">' +
          formatDate(log.time) +
          "</span>" +
          '<span style="flex:1;">' +
          (ps.length > 0 ? ps.join(" · ") : "无变化") +
          "</span></div>";
      });
    }
    var groupOpts = '<option value="">不指定 (未分组)</option>';
    data.groups.forEach(function (g) {
      groupOpts +=
        '<option value="' +
        g.id +
        '"' +
        (sub.targetGroupId === g.id ? " selected" : "") +
        ">" +
        esc(g.name) +
        "</option>";
    });
    $p.find("#ms-body").html(
      '<div class="ms-form">' +
        '<div class="ms-field"><label>名称</label><input type="text" id="ms-sub-d-name" value="' +
        esc(sub.name) +
        '"></div>' +
        '<div class="ms-field"><label>链接</label><div style="display:flex;gap:4px;"><input type="text" id="ms-sub-d-url" value="' +
        esc(sub.url) +
        '" style="flex:1;"><button class="ms-tbtn" id="ms-sub-copy-url" title="复制链接" style="flex-shrink:0;"><i class="fa-solid fa-copy"></i></button></div></div>' +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">导入选项</div>' +
        '<div class="ms-export-opts-tight">' +
        chk(
          "ms-sub-d-groups",
          sub.importGroups ? "checked" : "",
          "导入分组信息",
        ) +
        chk("ms-sub-d-tags", sub.importTags ? "checked" : "", "导入标签信息") +
        chk(
          "ms-sub-d-cgroups",
          sub.importCharGroups !== false ? "checked" : "",
          '接收 IP 分组 <span style="font-size:10px;opacity:0.5;">(仅匹配本地已有角色)</span>',
        ) +
        chk(
          "ms-sub-d-update",
          sub.updateExisting !== false ? "checked" : "",
          "允许更新已有内容",
        ) +
        "</div>" +
        '<div class="ms-field" id="ms-sub-d-target-wrap" style="' +
        (sub.importGroups ? "display:none;" : "") +
        '"><label>放入分组 <span style="font-weight:350;opacity:0.5;">(不导入分组时，新内容放入此分组)</span></label><select id="ms-sub-d-target">' +
        groupOpts +
        "</select></div>" +
        '<div class="ms-form-btns" style="gap:6px;">' +
        '<button class="ms-btn" id="ms-sub-d-save"><i class="fa-solid fa-floppy-disk" style="margin-right:4px;"></i>保存设置</button>' +
        '<button class="ms-btn primary" id="ms-sub-d-check"><i class="fa-solid fa-arrows-rotate" style="margin-right:4px;"></i>检查更新</button>' +
        "</div>" +
        '<div class="ms-divider"></div>' +
        '<div class="ms-section-label">更新记录 (' +
        logs.length +
        "/20)</div>" +
        '<div style="padding:0 14px;max-height:200px;overflow-y:auto;">' +
        logH +
        "</div>" +
        '<div class="ms-divider"></div>' +
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#666);padding:4px 0;">' +
        "添加于 " +
        formatDate(sub.addedAt) +
        " · 上次检查 " +
        (sub.lastChecked ? formatDate(sub.lastChecked) : "从未") +
        "</div>" +
        '<button class="ms-btn danger" id="ms-sub-d-delete" style="width:100%;"><i class="fa-solid fa-trash" style="margin-right:4px;"></i>删除订阅<span style="font-size:10px;opacity:0.6;margin-left:6px;">(已导入的剧场不受影响)</span></button>' +
        "</div>",
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    function toggleSubTarget() {
      $p.find("#ms-sub-d-target-wrap").toggle(
        !$p.find("#ms-sub-d-groups").is(":checked"),
      );
    }
    $p.find("#ms-body").on("change.ms", "#ms-sub-d-groups", toggleSubTarget);
    $p.find("#ms-body").on("click.ms", "#ms-sub-copy-url", function () {
      copyToClipboard($p.find("#ms-sub-d-url").val() || sub.url)
        .then(function () {
          toast("success", "已复制链接");
        })
        .catch(function () {
          toast("error", "复制失败");
        });
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-save", function () {
      var newName = $p.find("#ms-sub-d-name").val().trim();
      var newUrl = $p.find("#ms-sub-d-url").val().trim();
      if (!newName) {
        toast("warning", "名称不能为空");
        return;
      }
      if (!newUrl) {
        toast("warning", "链接不能为空");
        return;
      }
      if (!/^https?:\/\//i.test(newUrl)) {
        toast("warning", "请输入有效的 HTTP(S) 链接");
        return;
      }
      var dup = data.subscriptions.find(function (s) {
        return s.id !== sub.id && s.url === newUrl;
      });
      if (dup) {
        toast("warning", "已经订阅过这个链接了：" + dup.name);
        return;
      }

      sub.name = newName;
      if (newUrl !== sub.url) sub.lastHash = "";
      sub.url = newUrl;
      sub.importGroups = $p.find("#ms-sub-d-groups").is(":checked");
      sub.importTags = $p.find("#ms-sub-d-tags").is(":checked");
      sub.importCharGroups = $p.find("#ms-sub-d-cgroups").is(":checked");
      sub.updateExisting = $p.find("#ms-sub-d-update").is(":checked");
      sub.targetGroupId = !sub.importGroups
        ? $p.find("#ms-sub-d-target").val() || null
        : null;
      saveData();
      toast("success", "已保存");
      $p.find("#ms-title").text(sub.name);
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-check", async function () {
      var $btn = $(this);
      $btn
        .prop("disabled", true)
        .html(
          '<i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>检查中...',
        );
      await checkSubscription(sub.id, false);
      renderSubscriptionDetail(v);
    });
    $p.find("#ms-body").on("click.ms", "#ms-sub-d-delete", function () {
      msConfirm(
        "确定删除订阅「" + sub.name + "」吗？\n\n已导入的剧场不会被删除",
        { title: "删除订阅", dangerous: true, okText: "删除" },
      ).then(function (ok) {
        if (!ok) return;
        data.subscriptions = data.subscriptions.filter(function (s) {
          return s.id !== sub.id;
        });
        data.settings.subUpdatesPending = 0;
        saveData();
        toast("success", "已删除订阅");
        navigateBack();
      });
    });
  }

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
  }

  function showBirthdayMessageEditor(charKey, charName, preferredYear) {
    var bdData = getCharBdData(charKey);
    var versions = JSON.parse(
      JSON.stringify((bdData && bdData.versions) || {}),
    );
    var deletedYears = [];

    var curY = getCurrentYearStr();
    function sortYears(arr) {
      arr.sort(function (a, b) {
        if (a === curY) return -1;
        if (b === curY) return 1;
        if (a === "default" && b !== "default") return 1;
        if (b === "default" && a !== "default") return -1;
        return parseInt(b) - parseInt(a);
      });
      return arr;
    }

    function getEditableYears() {
      var arr = Object.keys(versions).filter(function (y) {
        var v = versions[y];
        return v && (v.isOwn === true || canShowBdVersion(charKey, y, v));
      });
      sortYears(arr);
      return arr;
    }

    var editableYears = getEditableYears();
    var currentYear = preferredYear || editableYears[0] || curY;
    if (
      versions[currentYear] &&
      versions[currentYear].isOwn !== true &&
      !canShowBdVersion(charKey, currentYear, versions[currentYear])
    ) {
      var _bdCandidates = ["default", curY];
      for (var _ty = 1; _ty <= 10; _ty++) {
        _bdCandidates.push(String(parseInt(curY) + _ty));
      }
      var _freeYear = null;
      for (var _ci = 0; _ci < _bdCandidates.length; _ci++) {
        var _cand = _bdCandidates[_ci];
        if (!versions[_cand] || versions[_cand].isOwn === true) {
          _freeYear = _cand;
          break;
        }
      }
      if (!_freeYear) {
        toast("warning", "可用年份都被作者锁定了，暂时没法新建祝福");
        return;
      }
      currentYear = _freeYear;
    }

    if (!versions[currentYear]) {
      versions[currentYear] = {
        message: "",
        authorName: "",
        contentType: "text",
        updatedAt: Date.now(),
        isOwn: true,
        year: currentYear,
      };
      editableYears = getEditableYears();
    }

    var taId = "ms-bd-edit-ta-" + Math.random().toString(36).slice(2);
    var sigId = "ms-bd-edit-sig-" + Math.random().toString(36).slice(2);
    var typeId = "ms-bd-edit-type-" + Math.random().toString(36).slice(2);
    var yearSelectId = "ms-bd-edit-year-" + Math.random().toString(36).slice(2);

    function captureCurrent($overlay) {
      var $ta = $overlay.find("#" + taId);
      if (!$ta.length) return;
      var msg = $ta.val();
      var sig = $overlay
        .find("#" + sigId)
        .val()
        .trim();
      var contentType =
        $overlay.find('input[name="' + typeId + '"]:checked').val() || "text";
      versions[currentYear] = {
        message: msg,
        authorName: sig,
        contentType: contentType,
        updatedAt: Date.now(),
        isOwn: true,
        year: currentYear,
      };
    }

    function buildBody() {
      var ex = versions[currentYear] || {
        message: "",
        authorName: "",
        contentType: "text",
      };
      var existingType = ex.contentType || "text";
      editableYears = getEditableYears();
      if (editableYears.indexOf(currentYear) < 0) {
        editableYears.push(currentYear);
        sortYears(editableYears);
      }

      var html = "";
      html +=
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding:8px;background:rgba(var(--ms-accent-rgb),0.05);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;">';
      html +=
        '<span style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;">编辑：</span>';
      html +=
        '<select id="' +
        yearSelectId +
        '" style="flex:1;padding:5px 8px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:4px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;">';
      editableYears.forEach(function (y) {
        var label = y === "default" ? "通用版" : y + " 年";
        if (versions[y] && versions[y].isOwn) label += "（我的）";
        html +=
          '<option value="' +
          esc(y) +
          '"' +
          (y === currentYear ? " selected" : "") +
          ">" +
          esc(label) +
          "</option>";
      });
      html += "</select>";
      html +=
        '<button class="ms-tbtn" id="ms-bd-add-year" title="新增年份" style="padding:5px 10px;font-size:11px;color:var(--ms-accent);border-color:var(--ms-accent);"><i class="fa-solid fa-plus"></i></button>';
      var hasContent = ex.message && (ex.message || "").trim();
      if (hasContent) {
        html +=
          '<button class="ms-tbtn" id="ms-bd-del-current" title="删除此版本" style="padding:5px 10px;font-size:11px;color:var(--ms-danger);border-color:var(--ms-danger);"><i class="fa-solid fa-trash"></i></button>';
      }
      html += "</div>";

      html +=
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;line-height:1.6;">';
      html +=
        '<i class="fa-solid fa-circle-info" style="color:var(--ms-accent);margin-right:3px;"></i>';
      html +=
        "<strong>通用版</strong>= 任何年份都能用；<strong>具体年份</strong>= 只在那一年的生日显示<br>";
      html +=
        '<span style="opacity:0.7;">可用变量：<code style="background:rgba(255,255,255,0.08);padding:0 4px;border-radius:3px;">{{char_name}}</code> <code style="background:rgba(255,255,255,0.08);padding:0 4px;border-radius:3px;">{{author_name}}</code> <code style="background:rgba(255,255,255,0.08);padding:0 4px;border-radius:3px;">{{today}}</code></span>';
      html += "</div>";

      html +=
        '<div style="margin-bottom:10px;display:flex;gap:8px;">' +
        '<label style="flex:1;cursor:pointer;padding:8px 10px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;display:flex;align-items:center;gap:6px;' +
        (existingType === "text"
          ? "background:rgba(var(--ms-accent-rgb),0.1);border-color:var(--ms-accent);"
          : "") +
        '">' +
        '<input type="radio" name="' +
        typeId +
        '" value="text"' +
        (existingType === "text" ? " checked" : "") +
        ">" +
        '<div><div style="font-size:12px;font-weight:600;">纯文字祝福</div><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">直接在面板里显示</div></div>' +
        "</label>" +
        '<label style="flex:1;cursor:pointer;padding:8px 10px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;display:flex;align-items:center;gap:6px;' +
        (existingType === "html"
          ? "background:rgba(var(--ms-accent-rgb),0.1);border-color:var(--ms-accent);"
          : "") +
        '">' +
        '<input type="radio" name="' +
        typeId +
        '" value="html"' +
        (existingType === "html" ? " checked" : "") +
        ">" +
        '<div><div style="font-size:12px;font-weight:600;">网页祝福</div><div style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);">推送到聊天</div></div>' +
        "</label>" +
        "</div>";

      html +=
        '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:4px;display:block;">祝福内容:</label>';
      html +=
        '<textarea class="ms-modal-textarea" id="' +
        taId +
        '" placeholder="纯文字模式：直接写文字\n网页模式：按照酒馆助手渲染要求写完整 HTML / CSS / JS 代码，会作为新楼层推到聊天里" style="min-height:200px;font-family:Consolas,monospace;font-size:12px;">' +
        esc(ex.message || "") +
        "</textarea>";
      html +=
        '<label style="font-size:12px;color:var(--SmartThemeBodyColor,#ccc);margin:8px 0 4px;display:block;">作者署名(可选):</label>';
      html +=
        '<input class="ms-modal-input" id="' +
        sigId +
        '" type="text" placeholder="留下你的署名" value="' +
        esc(ex.authorName || "") +
        '">';
      return html;
    }

    function refreshBody($overlay) {
      $overlay.find(".ms-modal-body").html(buildBody());
    }

    function bindEvents($overlay, close) {
      $overlay.on("change", 'input[name="' + typeId + '"]', function () {
        $overlay.find('input[name="' + typeId + '"]').each(function () {
          var $r = $(this);
          var $label = $r.closest("label");
          if ($r.is(":checked")) {
            $label.css({
              background: "rgba(var(--ms-accent-rgb),0.1)",
              "border-color": "var(--ms-accent)",
            });
          } else {
            $label.css({
              background: "",
              "border-color": "var(--SmartThemeBorderColor,#444)",
            });
          }
        });
      });

      $overlay.on("change", "#" + yearSelectId, function () {
        captureCurrent($overlay);
        currentYear = $(this).val();
        if (!versions[currentYear]) {
          versions[currentYear] = {
            message: "",
            authorName: "",
            contentType: "text",
            updatedAt: Date.now(),
            isOwn: true,
            year: currentYear,
          };
        }
        refreshBody($overlay);
      });

      $overlay.on("click", "#ms-bd-add-year", function () {
        captureCurrent($overlay);
        var nextY = String(new Date().getFullYear() + 1);
        var defaultVal = versions[curY] ? nextY : curY;
        msPrompt(
          "输入年份（4 位数字，如 " + nextY + "）\n或输入 default 创建通用版",
          {
            title: "新增年份版本",
            placeholder: nextY,
            defaultValue: defaultVal,
            validate: function (val) {
              val = (val || "").trim().toLowerCase();
              if (!val) return "年份不能为空";
              if (val !== "default" && !/^\d{4}$/.test(val))
                return "年份格式错误，应该是 4 位数字或 default";
              if (
                versions[val] &&
                !versions[val].isOwn &&
                !canShowBdVersion(charKey, val, versions[val])
              ) {
                return "该年份已有锁定的作者版本，无法直接编辑";
              }
              return null;
            },
          },
        ).then(function (input) {
          if (input === null) return;
          var newY = input.trim().toLowerCase();
          var doSwitch = function () {
            versions[newY] = versions[newY] || {
              message: "",
              authorName: "",
              contentType: "text",
              updatedAt: Date.now(),
              isOwn: true,
              year: newY,
            };
            currentYear = newY;
            refreshBody($overlay);
          };
          if (versions[newY] && (versions[newY].message || "").trim()) {
            msConfirm(
              "已存在 " +
                (newY === "default" ? "通用版" : newY + " 年") +
                " 的版本，要切换过去编辑吗？",
              { title: "已有版本", okText: "切换" },
            ).then(function (ok) {
              if (ok) doSwitch();
            });
          } else {
            doSwitch();
          }
        });
      });

      $overlay.on("click", "#ms-bd-del-current", function () {
        var label = currentYear === "default" ? "通用版" : currentYear + " 年";
        msConfirm("确定删除「" + label + "」的祝福吗？", {
          title: "删除版本",
          dangerous: true,
          okText: "删除",
        }).then(function (ok) {
          if (!ok) return;
          delete versions[currentYear];
          if (deletedYears.indexOf(currentYear) < 0)
            deletedYears.push(currentYear);
          editableYears = getEditableYears();
          if (editableYears.length === 0) {
            currentYear = "default";
            versions[currentYear] = {
              message: "",
              authorName: "",
              contentType: "text",
              updatedAt: Date.now(),
              isOwn: true,
              year: "default",
            };
          } else {
            currentYear = editableYears[0];
          }
          refreshBody($overlay);
        });
      });
    }

    var $bdPanel = $("#" + PANEL_ID);
    if ($bdPanel.length) {
      $bdPanel.data("ms-bd-editor-saved-pos", {
        left: $bdPanel[0].style.getPropertyValue("left"),
        top: $bdPanel[0].style.getPropertyValue("top"),
        transform: $bdPanel[0].style.getPropertyValue("transform"),
        panelPos: data.settings.panelPos
          ? Object.assign({}, data.settings.panelPos)
          : null,
      });
      $bdPanel[0].style.removeProperty("left");
      $bdPanel[0].style.removeProperty("top");
      $bdPanel[0].style.removeProperty("transform");
      $bdPanel.addClass("ms-bd-editor-mode");
    }

    showModal({
      title: "为 " + charName + " 写祝福",
      iconType: "info",
      icon: "fa-envelope-open-text",
      modalStyle: "width:680px;max-width:94vw;max-height:84vh;",
      body: buildBody(),
      buttons: [
        {
          text: "预览效果",
          action: function ($overlay) {
            captureCurrent($overlay);
            var v = versions[currentYear];
            if (!v || !(v.message || "").trim()) {
              toast("warning", "祝福内容是空的，没法预览");
              return false;
            }
            previewBdMessage(charKey, charName, currentYear, v);
            return false;
          },
        },
        { text: "取消", value: null },
        {
          text: "保存",
          cls: "primary",
          primary: true,
          action: function ($overlay) {
            captureCurrent($overlay);
            if (!data.settings.charBirthdayMessages)
              data.settings.charBirthdayMessages = {};
            var bdMsg = data.settings.charBirthdayMessages[charKey] || {
              versions: {},
            };
            if (!bdMsg.versions) bdMsg.versions = {};
            deletedYears.forEach(function (y) {
              delete bdMsg.versions[y];
            });
            Object.keys(versions).forEach(function (y) {
              var v = versions[y];
              if (!v || !(v.message || "").trim()) {
                delete bdMsg.versions[y];
              } else {
                bdMsg.versions[y] = v;
              }
            });
            if (Object.keys(bdMsg.versions).length === 0) {
              delete data.settings.charBirthdayMessages[charKey];
            } else {
              data.settings.charBirthdayMessages[charKey] = bdMsg;
            }
            saveData();
            toast("success", "祝福已保存");
            return true;
          },
        },
      ],
      onShow: function ($overlay, close) {
        bindEvents($overlay, close);
      },
    }).then(function () {
      var $bdPanel2 = $("#" + PANEL_ID);
      if ($bdPanel2.length) {
        var saved = $bdPanel2.data("ms-bd-editor-saved-pos");
        $bdPanel2.removeClass("ms-bd-editor-mode");
        if (saved) {
          if (saved.left)
            $bdPanel2[0].style.setProperty("left", saved.left, "important");
          else $bdPanel2[0].style.removeProperty("left");
          if (saved.top)
            $bdPanel2[0].style.setProperty("top", saved.top, "important");
          else $bdPanel2[0].style.removeProperty("top");
          if (saved.transform)
            $bdPanel2[0].style.setProperty(
              "transform",
              saved.transform,
              "important",
            );
          else $bdPanel2[0].style.removeProperty("transform");
          data.settings.panelPos = saved.panelPos || null;
          $bdPanel2.removeData("ms-bd-editor-saved-pos");
          saveData();
        }
      }
    });
  }

  function previewBdMessage(charKey, charName, year, versionData) {
    var td = new Date();
    var todayStr =
      td.getFullYear() +
      "-" +
      String(td.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(td.getDate()).padStart(2, "0");
    var processed = (versionData.message || "")
      .replace(/\{\{char_name\}\}/gi, charName)
      .replace(/\{\{author_name\}\}/gi, versionData.authorName || "")
      .replace(/\{\{today\}\}/gi, todayStr);
    var versionLabel = year === "default" ? "通用版" : year + " 年";

    if (versionData.contentType === "html") {
      var curKey = getCurrentCharKeySafe();
      var needSwitch = charKey && curKey !== charKey && isLocalCharKey(charKey);
      var confirmMsg = needSwitch
        ? "预览会推送到「" +
          charName +
          "」自己的聊天里（会自动切换到该角色），要试一下「" +
          versionLabel +
          "」的效果吗？"
        : "网页版的祝福预览要推送到当前聊天楼层渲染，要现在推送「" +
          versionLabel +
          "」看看效果吗？";
      msConfirm(confirmMsg, {
        title: "预览网页祝福",
        icon: "fa-paper-plane",
        okText: "推送预览",
      }).then(function (ok) {
        if (!ok) return;
        var bdHeader =
          "🎂 **预览：" +
          charName +
          " 的生日祝福（" +
          versionLabel +
          "）**" +
          (versionData.authorName ? " — by " + versionData.authorName : "") +
          "\n\n";
        function doPush() {
          try {
            createChatMessages(
              [
                {
                  role: "system",
                  message: bdHeader + processed,
                  extra: { isSmallSys: false },
                },
              ],
              { insert_before: "end" },
            )
              .then(function () {
                toast("success", "已推送预览");
                autoCollapsePanel();
              })
              .catch(function (e) {
                toast("error", "推送失败: " + e.message);
              });
          } catch (e) {
            toast("error", "推送失败: " + e.message);
          }
        }
        if (!needSwitch) {
          doPush();
          return;
        }
        try {
          var idx = SillyTavern.characters.findIndex(function (c) {
            return c && c.avatar === charKey;
          });
          if (
            idx >= 0 &&
            typeof SillyTavern.selectCharacterById === "function"
          ) {
            var pushed = false;
            var doPushOnce = function () {
              if (pushed) return;
              pushed = true;
              setTimeout(doPush, 100);
            };
            eventOnce(tavern_events.CHAT_CHANGED, doPushOnce);
            setTimeout(function () {
              if (!pushed) {
                pushed = true;
                doPush();
              }
            }, 1500);
            var res = SillyTavern.selectCharacterById(idx);
            if (res && typeof res.catch === "function") {
              res.catch(function () {
                if (!pushed) {
                  pushed = true;
                  doPush();
                }
              });
            }
          } else {
            doPush();
          }
        } catch (e) {
          doPush();
        }
      });
      return;
    }

    var contentHtml =
      '<div style="padding:14px;line-height:1.8;font-size:14px;color:var(--SmartThemeBodyColor,#ddd);white-space:pre-wrap;word-wrap:break-word;">' +
      esc(processed) +
      "</div>";
    if (versionData.authorName) {
      contentHtml +=
        '<div style="padding:8px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);text-align:right;font-style:italic;border-top:1px solid var(--SmartThemeBorderColor,#444);">— 来自 ' +
        esc(versionData.authorName) +
        "</div>";
    }
    showModal({
      title: "预览：" + charName + " 的生日祝福（" + versionLabel + "）🎂",
      iconType: "info",
      icon: "fa-eye",
      modalStyle: "min-width:340px;max-width:94vw;width:520px;max-height:80vh;",
      body: contentHtml,
      buttons: [
        { text: "返回继续编辑", cls: "primary", primary: true, value: true },
      ],
    });
  }

  function pushBdMsgToChat(charKey, charName, versionData, year) {
    var td = new Date();
    var todayStr =
      td.getFullYear() +
      "-" +
      String(td.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(td.getDate()).padStart(2, "0");
    var processed = versionData.message
      .replace(/\{\{char_name\}\}/gi, charName)
      .replace(/\{\{author_name\}\}/gi, versionData.authorName || "")
      .replace(/\{\{today\}\}/gi, todayStr);
    var versionLabel = year === "default" ? "" : "（" + year + " 年）";
    var bdHeader =
      "🎂 **" +
      charName +
      " 的生日祝福" +
      versionLabel +
      "**" +
      (versionData.authorName ? " — by " + versionData.authorName : "") +
      "\n\n";
    var curKey = getCurrentCharKeySafe();
    var needSwitch = charKey && curKey !== charKey && isLocalCharKey(charKey);

    function doPush() {
      try {
        createChatMessages(
          [
            {
              role: "system",
              message: bdHeader + processed,
              extra: { isSmallSys: false },
            },
          ],
          { insert_before: "end" },
        )
          .then(function () {
            toast("success", "已推送到 " + charName + " 的聊天里");
            autoCollapsePanel();
          })
          .catch(function (e) {
            toast("error", "推送失败: " + e.message);
          });
      } catch (e) {
        toast("error", "推送失败: " + e.message);
      }
    }

    if (!needSwitch) {
      doPush();
      return;
    }
    try {
      var idx = SillyTavern.characters.findIndex(function (c) {
        return c && c.avatar === charKey;
      });
      if (idx >= 0 && typeof SillyTavern.selectCharacterById === "function") {
        var pushed = false;
        var doPushOnce = function () {
          if (pushed) return;
          pushed = true;
          setTimeout(doPush, 100);
        };
        eventOnce(tavern_events.CHAT_CHANGED, doPushOnce);
        setTimeout(function () {
          if (!pushed) {
            pushed = true;
            doPush();
          }
        }, 1500);
        var res = SillyTavern.selectCharacterById(idx);
        if (res && typeof res.catch === "function") {
          res.catch(function () {
            if (!pushed) {
              pushed = true;
              doPush();
            }
          });
        }
      } else {
        doPush();
      }
    } catch (e) {
      doPush();
    }
  }

  function showBirthdayMessageView(charKey, charName, preferredYear) {
    var bdVersions = getDisplayableBdVersions(charKey);
    if (bdVersions.length === 0) {
      toast("info", "这个角色没有祝福语呢");
      return;
    }
    var allCount = bdVersions.length;
    var showableVersions = bdVersions.filter(function (it) {
      return it.unlocked;
    });
    if (showableVersions.length === 0) {
      toast("info", "祝福还没解锁，等到生日当天哦~");
      return;
    }
    var lockedCount = allCount - showableVersions.length;

    var currentIdx = 0;
    if (preferredYear) {
      var found = -1;
      for (var i = 0; i < showableVersions.length; i++) {
        if (showableVersions[i].year === preferredYear) {
          found = i;
          break;
        }
      }
      if (found >= 0) currentIdx = found;
    }

    function buildContent(idx) {
      var v = showableVersions[idx];
      var d = v.data;
      var td = new Date();
      var todayStr =
        td.getFullYear() +
        "-" +
        String(td.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(td.getDate()).padStart(2, "0");
      var processed = (d.message || "")
        .replace(/\{\{char_name\}\}/gi, charName)
        .replace(/\{\{author_name\}\}/gi, d.authorName || "")
        .replace(/\{\{today\}\}/gi, todayStr);
      var versionLabel = v.year === "default" ? "通用版" : v.year + " 年";

      var html = "";
      if (showableVersions.length > 1 || lockedCount > 0) {
        html +=
          '<div style="display:flex;align-items:center;gap:6px;padding:6px 0 10px;border-bottom:1px solid var(--SmartThemeBorderColor,#444);margin-bottom:10px;">';
        if (showableVersions.length > 1) {
          html +=
            '<button class="ms-tbtn" id="ms-bdv-prev" style="padding:3px 10px;font-size:11px;"' +
            (idx === 0 ? ' disabled style="opacity:0.4;"' : "") +
            '><i class="fa-solid fa-angle-left"></i></button>';
          html +=
            '<select id="ms-bdv-select" style="flex:1;padding:5px 8px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-radius:6px;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc));font-size:12px;">';
          showableVersions.forEach(function (it, i) {
            var label = it.year === "default" ? "通用版" : it.year + " 年";
            if (it.data.isOwn) label += "（我的）";
            html +=
              '<option value="' +
              i +
              '"' +
              (i === idx ? " selected" : "") +
              ">" +
              esc(label) +
              "</option>";
          });
          html += "</select>";
          html +=
            '<button class="ms-tbtn" id="ms-bdv-next" style="padding:3px 10px;font-size:11px;"' +
            (idx === showableVersions.length - 1
              ? ' disabled style="opacity:0.4;"'
              : "") +
            '><i class="fa-solid fa-angle-right"></i></button>';
        } else {
          html +=
            '<span style="flex:1;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);font-weight:500;">' +
            esc(versionLabel) +
            (v.data.isOwn
              ? '<span style="opacity:0.6;font-weight:normal;font-size:10px;margin-left:4px;">（我的）</span>'
              : "") +
            "</span>";
        }
        if (lockedCount > 0) {
          html +=
            '<span style="font-size:10px;color:var(--SmartThemeQuoteColor,#888);" title="还有 ' +
            lockedCount +
            ' 个版本未解锁"><i class="fa-solid fa-lock" style="margin-right:2px;"></i>' +
            lockedCount +
            "</span>";
        }
        html += "</div>";
      }

      if (d.contentType === "html") {
        html +=
          '<div style="padding:18px 14px;background:rgba(255,255,255,0.04);border:1px dashed var(--SmartThemeBorderColor,#444);border-radius:8px;text-align:center;font-size:12px;color:var(--SmartThemeQuoteColor,#999);line-height:1.8;">';
        html +=
          '<i class="fa-solid fa-code" style="font-size:28px;color:var(--ms-accent);margin-bottom:10px;display:block;"></i>';
        html +=
          "<strong>" +
          esc(versionLabel) +
          '</strong> 是网页版祝福<br><span style="font-size:10px;opacity:0.7;">点击下方"推送到聊天"按钮，<br>让酒馆助手 / 渲染插件展示效果</span>';
        html += "</div>";
      } else {
        html +=
          '<div style="padding:14px;line-height:1.8;font-size:14px;color:var(--SmartThemeBodyColor,#ddd);white-space:pre-wrap;word-wrap:break-word;">' +
          esc(processed) +
          "</div>";
        if (d.authorName) {
          html +=
            '<div style="padding:8px 14px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);text-align:right;font-style:italic;border-top:1px solid var(--SmartThemeBorderColor,#444);margin-top:8px;">— 来自 ' +
            esc(d.authorName) +
            "</div>";
        }
      }
      return html;
    }

    showModal({
      title: charName + " 的生日祝福 🎂",
      iconType: "success",
      icon: "fa-envelope-open-text",
      modalStyle: "min-width:340px;max-width:94vw;width:520px;max-height:80vh;",
      body: buildContent(currentIdx),
      buttons: [
        {
          text: "推送到聊天",
          cls: "primary",
          primary: true,
          action: function ($overlay) {
            var v = showableVersions[currentIdx];
            pushBdMsgToChat(charKey, charName, v.data, v.year);
            return true;
          },
        },
        { text: "关闭", value: null },
      ],
      onShow: function ($overlay) {
        function refresh() {
          $overlay.find(".ms-modal-body").html(buildContent(currentIdx));
        }
        $overlay.on("click", "#ms-bdv-prev", function () {
          if (currentIdx > 0) {
            currentIdx--;
            refresh();
          }
        });
        $overlay.on("click", "#ms-bdv-next", function () {
          if (currentIdx < showableVersions.length - 1) {
            currentIdx++;
            refresh();
          }
        });
        $overlay.on("change", "#ms-bdv-select", function () {
          var idx = parseInt($(this).val());
          if (!isNaN(idx) && idx >= 0 && idx < showableVersions.length) {
            currentIdx = idx;
            refresh();
          }
        });
      },
    });
  }

  function showBirthdayBannerIfAny() {
    var $p = $("#" + PANEL_ID);
    if (!$p.length) return;
    markTodayBirthdaysUnlocked();
    cleanOldDismissedBirthdays();
    $p.find("#ms-birthday-banner").remove();
    var todays = getTodayBirthdayChars();
    if (todays.length === 0) return;

    try {
      var _bdToday = new Date();
      var _bdTodayStr =
        _bdToday.getFullYear() +
        "-" +
        String(_bdToday.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(_bdToday.getDate()).padStart(2, "0");
      var _ck = data.settings.checkin || {};
      if (_ck.lastDate !== _bdTodayStr) {
        checkinToday();
        toast("success", "今天有角色生日~ 🎂");
      }
    } catch (e) {}
    var names = todays
      .map(function (b) {
        return b.name;
      })
      .join("、");
    var keysJson = JSON.stringify(
      todays.map(function (b) {
        return b.key;
      }),
    );
    var hasAnyBdMsg = todays.some(function (b) {
      return hasAnyShowableBdVersion(b.key);
    });
    var avatarsH = '<div class="ms-bd-avatars">';
    todays.slice(0, 3).forEach(function (b) {
      var ap = getCharAvatarPathSafe(b.key);
      if (ap) {
        avatarsH +=
          '<div class="ms-bd-avatar-wrap"><img src="' +
          esc(ap) +
          '" loading="eager" decoding="sync" onerror="this.style.display=\'none\';this.onerror=null;"></div>';
      } else {
        avatarsH +=
          '<div class="ms-bd-avatar-wrap ms-bd-avatar-fallback"><i class="fa-solid fa-user"></i></div>';
      }
    });
    if (todays.length > 3) {
      avatarsH +=
        '<div class="ms-bd-avatar-more">+' + (todays.length - 3) + "</div>";
    }
    avatarsH += "</div>";
    var confettiEmojis = [
      "🎉",
      "🎂",
      "🎈",
      "✨",
      "🎁",
      "💝",
      "🌸",
      "⭐",
      "🎊",
      "💖",
      "🥳",
      "🍰",
      "🧁",
      "🥂",
      "👑",
      "💗",
      "💥",
    ];
    var confettiH = '<div class="ms-bd-confetti">';
    var _confettiCount = window.innerWidth < 600 ? 6 : 10;
    for (var ci = 0; ci < _confettiCount; ci++) {
      var emo = confettiEmojis[ci % confettiEmojis.length];
      var leftPct = (
        (ci / _confettiCount) * 100 +
        Math.random() * (100 / _confettiCount)
      ).toFixed(1);
      var delayS = (Math.random() * 1.8).toFixed(2);
      var durS = (2 + Math.random() * 1.5).toFixed(2);
      var sizeR = (0.85 + Math.random() * 0.5).toFixed(2);
      confettiH +=
        '<span class="ms-bd-confetti-piece" style="left:' +
        leftPct +
        "%;animation-delay:" +
        delayS +
        "s;animation-duration:" +
        durS +
        "s;font-size:" +
        (12 * sizeR).toFixed(1) +
        'px;">' +
        emo +
        "</span>";
    }
    confettiH += "</div>";
    var bannerH =
      '<div id="ms-birthday-banner" class="ms-bd-banner">' +
      confettiH +
      avatarsH +
      '<i class="fa-solid fa-cake-candles ms-bd-cake"></i>' +
      '<span class="ms-bd-text">今天是 <strong>' +
      esc(names) +
      "</strong> 的生日呀～要不要写点什么 🎂</span>" +
      (hasAnyBdMsg
        ? '<button class="ms-tbtn" data-bd-action="view-msg" data-bd-keys=\'' +
          esc(keysJson) +
          '\' style="padding:3px 10px;font-size:11px;color:#e88aaa;border-color:#e88aaa;background:rgba(232,138,170,0.08);position:relative;z-index:1;flex-shrink:0;"><i class="fa-solid fa-envelope-open-text" style="margin-right:3px;"></i>祝福</button>'
        : "") +
      '<button class="ms-tbtn" data-bd-action="goto" data-bd-keys=\'' +
      esc(keysJson) +
      '\' style="padding:3px 10px;font-size:11px;color:var(--ms-accent);border-color:var(--ms-accent);position:relative;z-index:1;flex-shrink:0;">前往</button>' +
      '<button class="ms-hbtn" data-bd-action="dismiss" style="width:22px;height:22px;font-size:11px;position:relative;z-index:1;flex-shrink:0;"><i class="fa-solid fa-xmark"></i></button></div>';
    $p.find("#ms-toolbar").before(bannerH);
    $p.off("click.ms-bd");
    $p.on(
      "click.ms-bd",
      "#ms-birthday-banner [data-bd-action='dismiss']",
      function () {
        var today = new Date();
        var todayStr =
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0");
        if (!data.settings.dismissedBirthdays)
          data.settings.dismissedBirthdays = {};
        if (todays.length <= 1) {
          todays.forEach(function (b) {
            data.settings.dismissedBirthdays[b.key] = todayStr;
          });
          saveData();
          $("#ms-birthday-banner").slideUp(200, function () {
            $(this).remove();
          });
          return;
        }
        var listHtml =
          '<div style="font-size:12px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;">选择要关闭提醒的角色（仅今天不再提示）：</div>';
        listHtml += '<div class="ms-modal-list">';
        todays.forEach(function (b) {
          var ap = getCharAvatarPathSafe(b.key);
          var iconH = ap
            ? '<img src="' +
              esc(ap) +
              '" onerror="this.style.display=\'none\';">'
            : '<i class="fa-solid fa-user" style="color:#e88aaa;"></i>';
          listHtml +=
            '<div class="ms-modal-list-item" data-bd-dismiss-key="' +
            esc(b.key) +
            '">' +
            '<div class="ms-modal-list-icon">' +
            iconH +
            "</div>" +
            '<div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
            esc(b.name) +
            "</div></div></div>";
        });
        listHtml += "</div>";
        showModal({
          title: "关闭哪个生日提醒？",
          iconType: "question",
          icon: "fa-cake-candles",
          modalStyle: "min-width:340px;max-width:92vw;width:420px;",
          body: listHtml,
          buttons: [
            { text: "全部关闭", cls: "danger", value: "_all_" },
            { text: "取消", value: null },
          ],
          onShow: function ($overlay, close) {
            $overlay.on("click", ".ms-modal-list-item", function () {
              var k = $(this).attr("data-bd-dismiss-key");
              if (!k) return;
              close(k);
            });
          },
        }).then(function (res) {
          if (!res) return;
          if (res === "_all_") {
            todays.forEach(function (b) {
              data.settings.dismissedBirthdays[b.key] = todayStr;
            });
            saveData();
            $("#ms-birthday-banner").slideUp(200, function () {
              $(this).remove();
            });
          } else {
            data.settings.dismissedBirthdays[res] = todayStr;
            saveData();
            showBirthdayBannerIfAny();
          }
        });
      },
    );

    $p.on(
      "click.ms-bd",
      "#ms-birthday-banner [data-bd-action='view-msg']",
      function () {
        var keys;
        try {
          keys = JSON.parse($(this).attr("data-bd-keys"));
        } catch (e) {
          keys = [];
        }
        var withMsg = keys.filter(function (k) {
          return hasAnyShowableBdVersion(k);
        });
        if (withMsg.length === 0) return;
        if (withMsg.length === 1) {
          showBirthdayMessageView(withMsg[0], getCharDisplayName(withMsg[0]));
          return;
        }
        var listHtml = '<div class="ms-modal-list">';
        withMsg.forEach(function (k) {
          var dn = getCharDisplayName(k);
          var ap = getCharAvatarPathSafe(k);
          var iconH = ap
            ? '<img src="' +
              esc(ap) +
              '" onerror="this.style.display=\'none\';this.onerror=null;">'
            : '<i class="fa-solid fa-user" style="color:#e88aaa;"></i>';
          listHtml +=
            '<div class="ms-modal-list-item" data-bd-view-key="' +
            esc(k) +
            '">' +
            '<div class="ms-modal-list-icon">' +
            iconH +
            "</div>" +
            '<div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
            esc(dn) +
            "</div>" +
            '<div class="ms-modal-list-desc">点击查看 TA 的祝福</div></div></div>';
        });
        listHtml += "</div>";
        showModal({
          title: "今天有 " + withMsg.length + " 位寿星～",
          iconType: "info",
          icon: "fa-cake-candles",
          modalStyle: "min-width:360px;max-width:92vw;width:460px;",
          body: listHtml,
          buttons: [{ text: "关闭", value: null }],
          onShow: function ($overlay, close) {
            $overlay.on("click", ".ms-modal-list-item", function () {
              var k = $(this).attr("data-bd-view-key");
              if (!k) return;
              close("done");
              setTimeout(function () {
                showBirthdayMessageView(k, getCharDisplayName(k));
              }, 200);
            });
          },
        });
      },
    );
    $p.on(
      "click.ms-bd",
      "#ms-birthday-banner [data-bd-action='goto']",
      function () {
        var keys;
        try {
          keys = JSON.parse($(this).attr("data-bd-keys"));
        } catch (e) {
          keys = [];
        }
        if (keys.length === 0) return;

        function _doBdGoto(targetKey) {
          try {
            if (typeof SillyTavern !== "undefined" && SillyTavern.characters) {
              var charIdx = SillyTavern.characters.findIndex(function (c) {
                return c && c.avatar === targetKey;
              });
              if (
                charIdx >= 0 &&
                String(SillyTavern.characterId) !== String(charIdx) &&
                typeof SillyTavern.selectCharacterById === "function"
              ) {
                SillyTavern.selectCharacterById(charIdx);
                toast("success", "已切换到 " + getCharDisplayName(targetKey));
              }
            }
          } catch (e) {
            console.warn("[小剧场] 切换角色失败", e);
          }
          var hasStage = getPromptsByCharacter(targetKey).length > 0;
          if (hasStage) {
            navigateTo({ name: "character", charKey: targetKey });
          } else {
            navigateTo({
              name: "edit",
              promptId: null,
              defaultCharacter: targetKey,
            });
          }
        }

        if (keys.length > 1) {
          var listHtml = '<div class="ms-modal-list">';
          keys.forEach(function (k) {
            var dn = getCharDisplayName(k);
            var ap = getCharAvatarPathSafe(k);
            var iconH = ap
              ? '<img src="' +
                esc(ap) +
                '" onerror="this.style.display=\'none\';this.onerror=null;">'
              : '<i class="fa-solid fa-user" style="color:#e88aaa;"></i>';
            listHtml +=
              '<div class="ms-modal-list-item" data-bd-goto-key="' +
              esc(k) +
              '">' +
              '<div class="ms-modal-list-icon">' +
              iconH +
              "</div>" +
              '<div class="ms-modal-list-info"><div class="ms-modal-list-name">' +
              esc(dn) +
              "</div></div></div>";
          });
          listHtml += "</div>";
          showModal({
            title: "去找谁？",
            iconType: "info",
            icon: "fa-cake-candles",
            modalStyle: "min-width:360px;max-width:92vw;width:460px;",
            body: listHtml,
            buttons: [{ text: "取消", value: null }],
            onShow: function ($overlay, close) {
              $overlay.on("click", ".ms-modal-list-item", function () {
                var k = $(this).attr("data-bd-goto-key");
                if (!k) return;
                close("done");
                setTimeout(function () {
                  _doBdGoto(k);
                }, 200);
              });
            },
          });
          return;
        }

        _doBdGoto(keys[0]);
      },
    );
  }
  function removeEscHandler() {
    if (escKeyHandler) {
      try {
        document.removeEventListener("keydown", escKeyHandler, true);
      } catch (e) {}
      escKeyHandler = null;
    }
  }
  function hidePanel() {
    if (currentView().name === "edit" && editDirty) {
      msConfirm("编辑内容尚未保存，确定要关闭吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "关闭",
      }).then(function (ok) {
        if (!ok) return;
        editDirty = false;
        clearDraft();
        hidePanel();
      });
      return;
    }
    editDirty = false;
    exitFocusMode();
    $("#" + PANEL_ID).removeClass("ms-visible");
    panelVisible = false;
    data.settings.panelWasVisible = false;
    saveData();
    flushSave();
    if (escKeyHandler) {
      document.removeEventListener("keydown", escKeyHandler, true);
      escKeyHandler = null;
    }
  }

  function togglePanel() {
    if (panelVisible) hidePanel();
    else showPanel();
  }

  function makeDraggable() {
    const $p = $("#" + PANEL_ID);
    const panelEl = $p[0];
    if (!panelEl) return;
    const ownerWin =
      (panelEl.ownerDocument && panelEl.ownerDocument.defaultView) || window;
    const headerEl = panelEl.querySelector("#ms-header");
    if (!headerEl) return;
    let dragging = false,
      sx,
      sy,
      sl,
      st;
    let _didMove = false;
    let _dblTapTime = 0;
    let _dblTapDidMove = false;
    let _origLeft = "",
      _origTop = "",
      _origTransform = "";

    headerEl.addEventListener("pointerdown", function (e) {
      var t = e.target;
      if (
        t.closest &&
        t.closest(
          ".ms-hbtn, button, input, select, textarea, a, .ms-inject-indicator",
        )
      )
        return;
      e.preventDefault();
      dragging = true;
      _didMove = false;
      _dblTapDidMove = false;
      _origLeft = panelEl.style.getPropertyValue("left");
      _origTop = panelEl.style.getPropertyValue("top");
      _origTransform = panelEl.style.getPropertyValue("transform");
      sx = e.clientX;
      sy = e.clientY;
      var rect = panelEl.getBoundingClientRect();
      sl = rect.left;
      st = rect.top;
      panelEl.style.setProperty("left", sl + "px", "important");
      panelEl.style.setProperty("top", st + "px", "important");
      panelEl.style.setProperty("transform", "none", "important");
      try {
        headerEl.setPointerCapture(e.pointerId);
      } catch (ex) {}
    });

    headerEl.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      e.preventDefault();
      if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) {
        _didMove = true;
        _dblTapDidMove = true;
      }
      if (!_didMove) return;
      var nl = sl + (e.clientX - sx),
        nt = st + (e.clientY - sy);
      nt = Math.max(0, Math.min(nt, ownerWin.innerHeight - 30));
      nl = Math.max(
        -panelEl.offsetWidth + 60,
        Math.min(nl, ownerWin.innerWidth - 60),
      );
      panelEl.style.setProperty("top", nt + "px", "important");
      panelEl.style.setProperty("left", nl + "px", "important");
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (!_dblTapDidMove) {
        var _now = Date.now();
        if (_now - _dblTapTime < 400) {
          _dblTapTime = 0;
          resetPanelPosition();
          return;
        }
        _dblTapTime = _now;
      } else {
        _dblTapTime = 0;
      }
      if (!_didMove) {
        if (_origLeft)
          panelEl.style.setProperty("left", _origLeft, "important");
        else panelEl.style.removeProperty("left");
        if (_origTop) panelEl.style.setProperty("top", _origTop, "important");
        else panelEl.style.removeProperty("top");
        if (_origTransform)
          panelEl.style.setProperty("transform", _origTransform, "important");
        else panelEl.style.removeProperty("transform");
        return;
      }
      data.settings.panelPos = {
        top: panelEl.style.getPropertyValue("top"),
        left: panelEl.style.getPropertyValue("left"),
      };
      saveData();
    }

    headerEl.addEventListener("pointerup", endDrag);
    headerEl.addEventListener("pointercancel", endDrag);
    headerEl.addEventListener("lostpointercapture", endDrag);

    headerEl.addEventListener("dblclick", function (e) {
      if (e.target.closest(".ms-hbtn, button")) return;
      resetPanelPosition();
    });
  }

  function addMenuButton() {
    const btnId = "openMiniStageButton";
    if ($("#" + btnId).length > 0) return;
    const $c = $("#extensionsMenu");
    if (!$c.length) return;
    $c.append(
      `<div id="${btnId}" class="list-group-item flex-container flexGap5 interactable" tabindex="0"><i class="fa-solid fa-masks-theater"></i><span>小剧场</span></div>`,
    );
    $("#" + btnId).on("click", togglePanel);
  }

  async function deleteLastPair() {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      toast("warning", "没有消息可以删除");
      return;
    }
    const idsToDelete = [lastId];
    if (lastId - 1 >= 0) {
      idsToDelete.push(lastId - 1);
    }
    await deleteChatMessages(idsToDelete, { refresh: "none" });
    idsToDelete.forEach(function (id) {
      $('#chat .mes[mesid="' + id + '"]').remove();
    });
    $("#chat .mes").removeClass("last_mes");
    $("#chat .mes").last().addClass("last_mes");
    var newLastId = getLastMessageId();
    if (newLastId >= 0) {
      await refreshOneMessage(newLastId);
    }
  }

  async function hideLastPair() {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      toast("warning", "没有消息可以隐藏");
      return;
    }
    const idsToHide = [lastId];
    if (lastId - 1 >= 0) {
      idsToHide.push(lastId - 1);
    }
    await setChatMessages(
      idsToHide.map(function (id) {
        return { message_id: id, is_hidden: true };
      }),
      { refresh: "affected" },
    );
    toast("success", "已隐藏 " + idsToHide.length + " 条消息");
  }

  function addScriptButton() {
    try {
      if (
        typeof appendInexistentScriptButtons === "function" &&
        typeof getButtonEvent === "function" &&
        typeof eventOn === "function"
      ) {
        appendInexistentScriptButtons([
          { name: "小剧场", visible: true },
          { name: "删除本轮", visible: true },
          { name: "隐藏本轮", visible: true },
        ]);
        eventOn(getButtonEvent("小剧场"), togglePanel);
        eventOn(getButtonEvent("删除本轮"), deleteLastPair);
        eventOn(getButtonEvent("隐藏本轮"), hideLastPair);
      }
    } catch (e) {}
  }

  function init() {
    const ctx = getCtx();
    if (!ctx) {
      setTimeout(init, 500);
      return;
    }
    loadData();
    markTodayBirthdaysUnlocked();
    addMenuButton();
    addScriptButton();
    if (data.settings.panelWasVisible) {
      setTimeout(function () {
        showPanel();
      }, 2000);
    }
    setTimeout(function () {
      try {
        cleanOldDismissedBirthdays();
        var todays = getTodayBirthdayChars();
        if (todays.length > 0 && !panelVisible) {
          showPanel();
        }
      } catch (e) {
        console.warn("[小剧场] 生日自动打开失败", e);
      }
    }, 3500);
    setTimeout(async function () {
      try {
        await updateBuiltinGuidesFromRemote();
      } catch (e) {
        console.warn("[小剧场] 拉取远程指南失败，下次启动重试", e);
      }
    }, 15000);

    try {
      if (
        typeof eventOn === "function" &&
        typeof tavern_events !== "undefined"
      ) {
        eventOn(tavern_events.CHAT_CHANGED, function () {
          _avatarPathCache = {};
          _invalidateCharGroupCache();
          if (panelVisible) {
            var vname = currentView().name;
            if (vname === "edit" || vname === "quick-phrase-edit") {
              return;
            }
            renderView();
          }
        });
        var _invalidateAvatarOnCharChange = function (forceImageReload) {
          _avatarPathCache = {};
          if (forceImageReload === true) {
            _avatarVersion = Date.now();
            _imgPreloaded.clear();
          }
          _invalidateLocalCharKeySet();
          _invalidateCharNameCache();
          _invalidateCharGroupCache();
          if (panelVisible) {
            var vname = currentView().name;
            if (
              vname === "edit" ||
              vname === "quick-phrase-edit" ||
              vname === "history-diff"
            ) {
              return;
            }
            try {
              renderView();
            } catch (e) {}
          }
        };
        if (tavern_events.CHARACTER_EDITED) {
          var _charEditDebounce = null;
          eventOn(tavern_events.CHARACTER_EDITED, function () {
            if (_charEditDebounce) clearTimeout(_charEditDebounce);
            _charEditDebounce = setTimeout(function () {
              _charEditDebounce = null;
              _invalidateAvatarOnCharChange(true);
            }, 500);
          });
        }
        if (tavern_events.CHARACTER_DELETED) {
          eventOn(tavern_events.CHARACTER_DELETED, function (info) {
            try {
              var deletedAvatar =
                info && info.character && info.character.avatar;
              if (deletedAvatar) {
                var _isOwnBd =
                  data.settings.ownBirthdays &&
                  data.settings.ownBirthdays[deletedAvatar] === true;
                if (
                  data.settings.charBirthdays &&
                  data.settings.charBirthdays[deletedAvatar] &&
                  !_isOwnBd
                ) {
                  delete data.settings.charBirthdays[deletedAvatar];
                }
                if (
                  data.settings.charBirthdayMessages &&
                  data.settings.charBirthdayMessages[deletedAvatar]
                ) {
                  var _bdMsg =
                    data.settings.charBirthdayMessages[deletedAvatar];
                  if (_bdMsg && _bdMsg.versions) {
                    Object.keys(_bdMsg.versions).forEach(function (y) {
                      var _v = _bdMsg.versions[y];
                      if (_v && _v.isOwn !== true) {
                        delete _bdMsg.versions[y];
                      }
                    });
                    if (Object.keys(_bdMsg.versions).length === 0) {
                      delete data.settings.charBirthdayMessages[deletedAvatar];
                    }
                  } else {
                    delete data.settings.charBirthdayMessages[deletedAvatar];
                  }
                }
                if (
                  data.settings.dismissedBirthdays &&
                  data.settings.dismissedBirthdays[deletedAvatar]
                ) {
                  delete data.settings.dismissedBirthdays[deletedAvatar];
                }
                if (
                  data.settings.unlockedBirthdays &&
                  data.settings.unlockedBirthdays[deletedAvatar]
                ) {
                  delete data.settings.unlockedBirthdays[deletedAvatar];
                }
                if (Array.isArray(data.settings.recentBoundChars)) {
                  data.settings.recentBoundChars =
                    data.settings.recentBoundChars.filter(function (k) {
                      return k !== deletedAvatar;
                    });
                }
                saveData();
              }
            } catch (e) {}
            _invalidateAvatarOnCharChange();
          });
        }
        if (tavern_events.CHARACTER_DUPLICATED) {
          eventOn(
            tavern_events.CHARACTER_DUPLICATED,
            _invalidateAvatarOnCharChange,
          );
        }
        if (tavern_events.CHARACTER_RENAMED) {
          eventOn(
            tavern_events.CHARACTER_RENAMED,
            function (old_avatar, new_avatar) {
              if (!old_avatar || !new_avatar || old_avatar === new_avatar) {
                _invalidateAvatarOnCharChange();
                return;
              }

              var changed = false;

              data.prompts.forEach(function (p) {
                if (p.character === old_avatar) {
                  p.character = new_avatar;
                  changed = true;
                }
                if (
                  p.usageByCharacter &&
                  p.usageByCharacter[old_avatar] !== undefined
                ) {
                  p.usageByCharacter[new_avatar] =
                    (p.usageByCharacter[new_avatar] || 0) +
                    p.usageByCharacter[old_avatar];
                  delete p.usageByCharacter[old_avatar];
                  changed = true;
                }
              });

              data.groups.forEach(function (g) {
                if (Array.isArray(g.charKeys)) {
                  var i = g.charKeys.indexOf(old_avatar);
                  if (i >= 0) {
                    if (g.charKeys.indexOf(new_avatar) < 0) {
                      g.charKeys[i] = new_avatar;
                    } else {
                      g.charKeys.splice(i, 1);
                    }
                    changed = true;
                  }
                }

                if (Array.isArray(g.charDisplayOrder)) {
                  var oi = g.charDisplayOrder.indexOf(old_avatar);
                  if (oi >= 0) {
                    if (g.charDisplayOrder.indexOf(new_avatar) < 0) {
                      g.charDisplayOrder[oi] = new_avatar;
                    } else {
                      g.charDisplayOrder.splice(oi, 1);
                    }
                    changed = true;
                  }
                }

                if (g.iconCharKey === old_avatar) {
                  g.iconCharKey = new_avatar;
                  changed = true;
                }
              });

              if (
                data.settings.charBirthdayMessages &&
                data.settings.charBirthdayMessages[old_avatar]
              ) {
                data.settings.charBirthdayMessages[new_avatar] =
                  data.settings.charBirthdayMessages[old_avatar];
                delete data.settings.charBirthdayMessages[old_avatar];
                changed = true;
              }
              if (
                data.settings.charBirthdays &&
                data.settings.charBirthdays[old_avatar]
              ) {
                data.settings.charBirthdays[new_avatar] =
                  data.settings.charBirthdays[old_avatar];
                delete data.settings.charBirthdays[old_avatar];
                changed = true;
              }
              if (
                data.settings.unlockedBirthdays &&
                data.settings.unlockedBirthdays[old_avatar]
              ) {
                data.settings.unlockedBirthdays[new_avatar] =
                  data.settings.unlockedBirthdays[old_avatar];
                delete data.settings.unlockedBirthdays[old_avatar];
                changed = true;
              }
              if (
                data.settings.dismissedBirthdays &&
                data.settings.dismissedBirthdays[old_avatar]
              ) {
                data.settings.dismissedBirthdays[new_avatar] =
                  data.settings.dismissedBirthdays[old_avatar];
                delete data.settings.dismissedBirthdays[old_avatar];
                changed = true;
              }

              if (Array.isArray(data.settings.recentBoundChars)) {
                data.settings.recentBoundChars =
                  data.settings.recentBoundChars.map(function (k) {
                    return k === old_avatar ? new_avatar : k;
                  });
                changed = true;
              }

              if (changed) {
                saveData();
              }

              _invalidateCharGroupCache();
              _invalidateAvatarOnCharChange();
            },
          );
        }
        if (tavern_events.CHARACTER_PAGE_LOADED) {
          eventOn(
            tavern_events.CHARACTER_PAGE_LOADED,
            _invalidateAvatarOnCharChange,
          );
        }

        eventOn(
          tavern_events.GENERATION_AFTER_COMMANDS,
          async function (type, option, dry_run) {
            if (dry_run) return;

            if (_skipAllInjectForNextGeneration) {
              _skipAllInjectForNextGeneration = false;
              if (window._msInjectLockTimer) {
                clearTimeout(window._msInjectLockTimer);
                window._msInjectLockTimer = null;
              }
              _currentStagePrompts = [];
              return;
            }

            if (!data.settings.stageInjectEnabled) return;
            var stagePrompts = [];
            var wasManual = false;
            var sids = data.settings.stageSelectedIds || [];

            if (sids.length > 0) {
              sids.forEach(function (sid) {
                var sp = getPrompt(sid);
                if (sp) stagePrompts.push(sp);
              });
              wasManual = true;
            }

            if (
              stagePrompts.length === 0 &&
              data.settings.randomInject &&
              data.settings.randomInject.enabled
            ) {
              var rp = getRandomStagePrompt();
              if (rp) stagePrompts.push(rp);
              wasManual = false;
            }
            _currentStagePrompts = [];
            if (stagePrompts.length === 0) {
              _currentStagePrompts = [];
              return;
            }

            if (data.settings.stageInjectMode === "macro") {
              if (_macroInjectBusy) {
                if (!_macroBusyWarned) {
                  _macroBusyWarned = true;
                  toast(
                    "warning",
                    "检测到并发生成，本次已跳过小剧场宏注入，避免串台",
                  );
                }
                _currentStagePrompts = [];
                return;
              }
              _macroInjectBusy = true;
              _macroBusyWarned = false;
              if (window._msMacroBusyTimer)
                clearTimeout(window._msMacroBusyTimer);
              window._msMacroBusyTimer = setTimeout(function () {
                window._msMacroBusyTimer = null;
                if (_macroInjectBusy) {
                  _macroInjectBusy = false;
                  _macroBusyWarned = false;
                  console.warn("[小剧场] 宏注入锁超时自动解除");
                }
              }, 30000);
            }

            try {
              _currentStagePrompts = stagePrompts;
              stagePrompts.forEach(markPromptUsed);
              saveData();
              if (data.settings.stageInjectMode === "depth") {
                var allContent = substitudeMacros(
                  buildStageContent(stagePrompts),
                );
                injectPrompts(
                  [
                    {
                      id: "mini-stage-inject",
                      position: "in_chat",
                      depth: data.settings.stageInjectDepth || 0,
                      role: data.settings.stageInjectRole || "system",
                      content: allContent,
                    },
                  ],
                  { once: true },
                );
                _macroInjectBusy = false;
              }
            } catch (err) {
              _currentStagePrompts = [];
              _macroInjectBusy = false;
              console.error("[小剧场] 注入失败", err);
            }
          },
        );

        var _onGenerationCleanup = function () {
          _currentStagePrompts = [];
          _skipAllInjectForNextGeneration = false;
          _macroInjectBusy = false;
          _macroBusyWarned = false;
          if (window._msMacroBusyTimer) {
            clearTimeout(window._msMacroBusyTimer);
            window._msMacroBusyTimer = null;
          }
          if (window._msInjectLockTimer) {
            clearTimeout(window._msInjectLockTimer);
            window._msInjectLockTimer = null;
          }
          updateInjectIndicator();
        };
        var _onGenerationEnded = function (message_id) {
          var hadInjection = _currentStagePrompts.length > 0;
          var wasSkipped = _skipAllInjectForNextGeneration;
          _onGenerationCleanup();
          if (
            data.settings.clearStageAfterGeneration !== true ||
            !hadInjection ||
            wasSkipped
          ) {
            return;
          }
          var hasContent = false;
          try {
            if (typeof message_id === "number" && message_id >= 0) {
              var msgs = getChatMessages(message_id);
              if (
                msgs &&
                msgs[0] &&
                typeof msgs[0].message === "string" &&
                msgs[0].message.trim().length > 0
              ) {
                hasContent = true;
              }
            }
          } catch (e) {}
          if (
            hasContent &&
            Array.isArray(data.settings.stageSelectedIds) &&
            data.settings.stageSelectedIds.length > 0
          ) {
            data.settings.stageSelectedIds = [];
            saveData();
            if (panelVisible) {
              try {
                if (currentView().name === "preview") renderView();
                else refreshKeepingState();
              } catch (e) {}
            }
            updateInjectIndicator();
          }
        };
        eventOn(tavern_events.GENERATION_ENDED, _onGenerationEnded);
        eventOn(tavern_events.GENERATION_STOPPED, _onGenerationCleanup);
      }
    } catch (e) {}
    try {
      if (typeof registerMacroLike === "function") {
        registerMacroLike(/\{\{stage\}\}/gi, function (context, substring) {
          if (!data.settings.stageInjectEnabled) return "";
          if (_currentStagePrompts.length === 0) return "";
          if (data.settings.stageInjectMode !== "macro") return "";
          if (_currentStagePrompts.length === 1) {
            return substitudeMacros(_currentStagePrompts[0].content || "");
          }
          return substitudeMacros(buildStageContent(_currentStagePrompts));
        });
        registerMacroLike(
          /\{\{stage_prompt\}\}/gi,
          function (context, substring) {
            if (!data.settings.stageInjectEnabled) return "";
            if (_currentStagePrompts.length === 0) return "";
            if (data.settings.stageInjectMode !== "macro") return "";
            return substitudeMacros(buildStageContent(_currentStagePrompts));
          },
        );
        registerMacroLike(
          /\{\{stage_title\}\}/gi,
          function (context, substring) {
            if (!data.settings.stageInjectEnabled) return "";
            if (_currentStagePrompts.length === 0) return "";
            return _currentStagePrompts
              .map(function (p) {
                return p.title || "";
              })
              .join(", ");
          },
        );
      }
    } catch (e) {}
    try {
      if (window.parent && window.parent.document) {
        let themeDebounce = null;
        if (window._msThemeObs) {
          try {
            window._msThemeObs.disconnect();
          } catch (e) {}
        }
        const themeObs = new MutationObserver(function () {
          if (!panelVisible) return;
          clearTimeout(themeDebounce);
          themeDebounce = setTimeout(function () {
            updateAccentColor();
            syncThemeBackground();
            syncThemeColors();
            applyUICustomization();
          }, 300);
        });
        themeObs.observe(window.parent.document.documentElement, {
          attributes: true,
          attributeFilter: ["style"],
        });
        themeObs.observe(window.parent.document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
        window._msThemeObs = themeObs;
      }
    } catch (e) {}
    window.addEventListener("resize", function () {
      const $p = $("#" + PANEL_ID);
      if (!$p.length || !panelVisible) return;
      const el = $p[0];
      const w =
        ($p[0].ownerDocument && $p[0].ownerDocument.defaultView) || window;
      const rect = el.getBoundingClientRect();
      if (rect.top > w.innerHeight - 50)
        el.style.setProperty(
          "top",
          Math.max(0, w.innerHeight - 80) + "px",
          "important",
        );
      if (rect.left > w.innerWidth - 60)
        el.style.setProperty(
          "left",
          Math.max(0, w.innerWidth - 100) + "px",
          "important",
        );
      const maxW = w.innerWidth * 0.92;
      if (el.offsetWidth > maxW)
        el.style.setProperty("width", maxW + "px", "important");
    });
    $(window).on("pagehide beforeunload", function () {
      flushSave();
      removeEscHandler();
      if (window._msThemeObs) {
        try {
          window._msThemeObs.disconnect();
        } catch (e) {}
        window._msThemeObs = null;
      }
    });
  }

  if (typeof $ !== "undefined" && getCtx()) $(init);
  else {
    let att = 0;
    const w = setInterval(() => {
      att++;
      if (typeof $ !== "undefined" && getCtx()) {
        clearInterval(w);
        $(init);
      } else if (att > 40) clearInterval(w);
    }, 500);
  }
})();
