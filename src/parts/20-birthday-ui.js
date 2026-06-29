function enterBirthdayPanelMode() {
  var $p = $("#" + PANEL_ID);
  if (!$p.length) return;

  var depth = parseInt($p.data("ms-bd-mode-depth") || 0);
  if (depth > 0) {
    $p.data("ms-bd-mode-depth", depth + 1);
    return;
  }

  var el = $p[0];
  $p.data("ms-bd-mode-depth", 1);
  $p.data("ms-bd-editor-saved-pos", {
    left: el.style.getPropertyValue("left"),
    top: el.style.getPropertyValue("top"),
    right: el.style.getPropertyValue("right"),
    bottom: el.style.getPropertyValue("bottom"),
    width: el.style.getPropertyValue("width"),
    maxWidth: el.style.getPropertyValue("max-width"),
    height: el.style.getPropertyValue("height"),
    maxHeight: el.style.getPropertyValue("max-height"),
    transform: el.style.getPropertyValue("transform"),
    zoom: el.style.getPropertyValue("zoom"),
    panelPos: data.settings.panelPos
      ? Object.assign({}, data.settings.panelPos)
      : null,
  });

  el.style.removeProperty("left");
  el.style.removeProperty("top");
  el.style.removeProperty("right");
  el.style.removeProperty("bottom");
  el.style.removeProperty("width");
  el.style.removeProperty("max-width");
  el.style.removeProperty("height");
  el.style.removeProperty("max-height");
  el.style.removeProperty("transform");
  el.style.removeProperty("zoom");

  $p.addClass("ms-bd-editor-mode");

  if (setupKeyboardAdapt.refresh) {
    setTimeout(setupKeyboardAdapt.refresh, 50);
    setTimeout(setupKeyboardAdapt.refresh, 250);
  }
}

function exitBirthdayPanelMode() {
  var $p = $("#" + PANEL_ID);
  if (!$p.length) return;

  var depth = parseInt($p.data("ms-bd-mode-depth") || 0);
  if (depth > 1) {
    $p.data("ms-bd-mode-depth", depth - 1);
    return;
  }

  $p.removeData("ms-bd-mode-depth");
  $p.removeClass("ms-bd-editor-mode");
  $p[0].removeAttribute("data-ms-kb");
  $p[0].style.removeProperty("border-radius");

  var saved = $p.data("ms-bd-editor-saved-pos");
  if (saved) {
    var el = $p[0];

    if (saved.left) el.style.setProperty("left", saved.left, "important");
    else el.style.removeProperty("left");

    if (saved.top) el.style.setProperty("top", saved.top, "important");
    else el.style.removeProperty("top");

    if (saved.right) el.style.setProperty("right", saved.right, "important");
    else el.style.removeProperty("right");

    if (saved.bottom) el.style.setProperty("bottom", saved.bottom, "important");
    else el.style.removeProperty("bottom");

    if (saved.width) el.style.setProperty("width", saved.width, "important");
    else el.style.removeProperty("width");

    if (saved.maxWidth)
      el.style.setProperty("max-width", saved.maxWidth, "important");
    else el.style.removeProperty("max-width");

    if (saved.height) el.style.setProperty("height", saved.height, "important");
    else el.style.removeProperty("height");

    if (saved.maxHeight)
      el.style.setProperty("max-height", saved.maxHeight, "important");
    else el.style.removeProperty("max-height");

    if (saved.transform)
      el.style.setProperty("transform", saved.transform, "important");
    else el.style.removeProperty("transform");

    if (saved.zoom) el.style.setProperty("zoom", saved.zoom, "important");
    else el.style.removeProperty("zoom");

    data.settings.panelPos = saved.panelPos || null;
    $p.removeData("ms-bd-editor-saved-pos");
    saveData();
  }

  applyUICustomization();

  if (setupKeyboardAdapt.refresh) {
    setTimeout(setupKeyboardAdapt.refresh, 50);
  }
}

function msBirthdayPrompt(message, options) {
  enterBirthdayPanelMode();
  return msPrompt(message, options).finally(function () {
    exitBirthdayPanelMode();
  });
}

function showBirthdayMessageEditor(charKey, charName, preferredYear) {
  var bdData = getCharBdData(charKey);
  var versions = JSON.parse(JSON.stringify((bdData && bdData.versions) || {}));
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

  enterBirthdayPanelMode();

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
    exitBirthdayPanelMode();
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

  enterBirthdayPanelMode();

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
  }).then(function () {
    exitBirthdayPanelMode();
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
          ? '<img src="' + esc(ap) + '" onerror="this.style.display=\'none\';">'
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
  if (currentView().name === "group-edit" && groupEditDirty) {
    msConfirm("分组设置尚未保存，确定要关闭吗？", {
      title: "未保存的改动",
      type: "warning",
      okText: "关闭",
    }).then(function (ok) {
      if (!ok) return;
      groupEditDirty = false;
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

function setupKeyboardAdapt() {
  if (setupKeyboardAdapt._bound) return;
  var vv = window.visualViewport || null;
  setupKeyboardAdapt._bound = true;
  var _kbRaf = null;

  function clearKeyboardPatch(el) {
    el.style.removeProperty("left");
    el.style.removeProperty("top");
    el.style.removeProperty("width");
    el.style.removeProperty("max-width");
    el.style.removeProperty("height");
    el.style.removeProperty("max-height");
    el.style.removeProperty("transform");
    el.style.removeProperty("zoom");
    el.removeAttribute("data-ms-kb");
  }

  function adapt() {
    _kbRaf = null;
    var el = document.getElementById(PANEL_ID);
    if (!el) return;

    var isFull =
      el.classList.contains("ms-focus-mode") ||
      el.classList.contains("ms-bd-editor-mode") ||
      el.classList.contains("ms-modal-expand-mode") ||
      el.classList.contains("ms-fs-editor-mode");

    var isMobileLike =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900 ||
      Math.min(vv.width || 0, vv.height || 0) <= 900;

    if (isFull && isMobileLike) {
      var viewW = Math.round(
        vv.width || window.innerWidth || document.documentElement.clientWidth,
      );
      var viewH = Math.round(
        vv.height ||
          window.innerHeight ||
          document.documentElement.clientHeight,
      );
      var viewLeft = Math.round(vv.offsetLeft || 0);
      var viewTop = Math.round(vv.offsetTop || 0);

      el.style.setProperty("left", viewLeft + "px", "important");
      el.style.setProperty("top", viewTop + "px", "important");
      el.style.setProperty("width", viewW + "px", "important");
      el.style.setProperty("max-width", viewW + "px", "important");
      el.style.setProperty("height", viewH + "px", "important");
      el.style.setProperty("max-height", viewH + "px", "important");
      el.style.setProperty("transform", "none", "important");
      el.style.setProperty("zoom", "1", "important");
      el.style.setProperty("border-radius", "0", "important");
      el.setAttribute("data-ms-kb", "1");
      return;
    }

    if (el.getAttribute("data-ms-kb") === "1") {
      clearKeyboardPatch(el);
      el.style.removeProperty("border-radius");
    }
  }

  function schedule() {
    if (_kbRaf) return;
    _kbRaf = requestAnimationFrame(adapt);
  }

  setupKeyboardAdapt.refresh = schedule;

  if (vv) {
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
  }
  window.addEventListener("resize", function () {
    setTimeout(schedule, 80);
  });

  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) {
      setTimeout(schedule, 80);
      setTimeout(schedule, 250);
      setTimeout(schedule, 500);
    }
  });

  document.addEventListener("focusout", function () {
    setTimeout(schedule, 120);
    setTimeout(schedule, 350);
  });
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
      if (_origLeft) panelEl.style.setProperty("left", _origLeft, "important");
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
