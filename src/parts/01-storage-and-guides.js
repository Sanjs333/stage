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
      if (data.settings.lastSeenVersion === undefined)
        data.settings.lastSeenVersion = "";
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
      if (data.settings.uiFontSize === undefined) data.settings.uiFontSize = 14;
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
          multiEnabled: false,
          multiCount: 2,
        };
      if (
        data.settings.randomInject &&
        data.settings.randomInject.multiEnabled === undefined
      )
        data.settings.randomInject.multiEnabled = false;
      if (
        data.settings.randomInject &&
        data.settings.randomInject.multiCount === undefined
      )
        data.settings.randomInject.multiCount = 2;
      if (
        data.settings.randomInject &&
        !Array.isArray(data.settings.randomInject.excludedCharGroupIds)
      )
        data.settings.randomInject.excludedCharGroupIds = [];
      if (!Array.isArray(data.settings.definedTags))
        data.settings.definedTags = [];
      if (
        !data.settings.themeBindings ||
        typeof data.settings.themeBindings !== "object"
      )
        data.settings.themeBindings = {};
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
        if (typeof p.title !== "string") p.title = String(p.title || "未命名");
        if (typeof p.content !== "string") p.content = String(p.content || "");
        if (!Array.isArray(p.history)) p.history = [];
      });
      data.groups.forEach((g) => {
        if (g.note === undefined) g.note = "";
        if (g.defaultAuthor === undefined) g.defaultAuthor = "";
        if (g.stagePrefix === undefined) g.stagePrefix = "";
        if (g.multiStagePrefix === undefined) g.multiStagePrefix = "";
        if (!Array.isArray(g.charKeys)) g.charKeys = [];
        if (g.iconMode === undefined) g.iconMode = "group";
        if (g.iconUrl === undefined) g.iconUrl = "";
        if (g.iconCharKey === undefined) g.iconCharKey = "";
        if (!Array.isArray(g.charDisplayOrder)) g.charDisplayOrder = [];
        if (g.multiPrefixEnabled === undefined) g.multiPrefixEnabled = false;
        if (!Array.isArray(g.prefixTemplates)) g.prefixTemplates = [];
        if (!g.prefixAssignments || typeof g.prefixAssignments !== "object")
          g.prefixAssignments = {};
        if (
          g.prefixOverrides &&
          typeof g.prefixOverrides === "object" &&
          Object.keys(g.prefixOverrides).length > 0
        ) {
          Object.keys(g.prefixOverrides).forEach(function (pid) {
            var content = g.prefixOverrides[pid];
            if (!content || !content.trim()) return;
            var existing = g.prefixTemplates.find(function (t) {
              return t.content === content;
            });
            if (existing) {
              g.prefixAssignments[pid] = existing.id;
            } else {
              var newTpl = {
                id: uid(),
                name: "迁移模板 " + (g.prefixTemplates.length + 1),
                content: content,
              };
              g.prefixTemplates.push(newTpl);
              g.prefixAssignments[pid] = newTpl.id;
            }
          });
          delete g.prefixOverrides;
        }
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

    try {
      if (Array.isArray(data.settings.stageSelectedIds)) {
        var validPromptIds = new Set(
          data.prompts.map(function (p) {
            return p.id;
          }),
        );
        data.settings.stageSelectedIds = data.settings.stageSelectedIds.filter(
          function (sid) {
            return validPromptIds.has(sid);
          },
        );
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

async function checkAndShowChangelog() {
  if (!data.settings.lastSeenVersion) {
    data.settings.lastSeenVersion = SCRIPT_VERSION;
    saveData();
    return;
  }
  if (data.settings.lastSeenVersion === SCRIPT_VERSION) return;
  if (!GUIDE_REMOTE_URLS || !GUIDE_REMOTE_URLS.changelog) return;
  try {
    var content = await fetchRemoteGuide(GUIDE_REMOTE_URLS.changelog);
    if (!content) return;
    var fromVer = data.settings.lastSeenVersion;
    showModal({
      title: "小剧场 已更新到 v" + SCRIPT_VERSION,
      iconType: "success",
      modalStyle: "min-width:400px;max-width:94vw;width:600px;max-height:80vh;",
      body:
        '<div style="font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-bottom:8px;padding:0 2px;"><i class="fa-solid fa-arrow-up-right-from-square" style="margin-right:4px;"></i>从 v' +
        esc(fromVer) +
        ' 升级而来</div><div class="ms-preview-content" style="padding:0;">' +
        renderMd(content) +
        "</div>",
      buttons: [{ text: "知道了", cls: "primary", primary: true, value: true }],
    }).then(function () {
      data.settings.lastSeenVersion = SCRIPT_VERSION;
      saveData();
    });
  } catch (e) {}
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
    var isPlaceholder = !p.content || p.content.indexOf("正在从云端加载") >= 0;
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
      p.id !== "_builtin_inject_guide" &&
      p.id !== "_builtin_char_bind_guide" &&
      p.id !== "_builtin_subscription_guide"
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
      (bdDate - new Date(thisY, today.getMonth(), today.getDate())) / 86400000,
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
  if (_tagOrderCache === null || _tagOrderCachedVersion !== _tagOrderVersion) {
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
          (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
        );
      case "edited-asc":
        return (
          (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0)
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

function _buildLocalNameIndex() {
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

function _rebindPromptChar(p, nameMap) {
  if (!p || !p.character) return;
  if (isLocalCharKey(p.character)) return;
  var exportedName = p.character_name;
  if (
    exportedName &&
    nameMap &&
    nameMap[exportedName] &&
    nameMap[exportedName].length === 1
  ) {
    p.character = nameMap[exportedName][0];
  }
}

function _rebindLostKeyByName(key, nameMap) {
  if (!key || isLocalCharKey(key)) return key;
  var dn = getCharDisplayName(key);
  if (nameMap && nameMap[dn] && nameMap[dn].length === 1) {
    return nameMap[dn][0];
  }
  return key;
}

function _buildIPGroupFromImport(icg) {
  return {
    id: uid(),
    name: icg.name,
    color: icg.color || GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
    note: icg.note || "",
    defaultAuthor: icg.defaultAuthor || "",
    stagePrefix: icg.stagePrefix || "",
    multiStagePrefix: icg.multiStagePrefix || "",
    iconMode: icg.iconMode || "group",
    iconUrl: icg.iconUrl || "",
    iconCharKey: icg.iconCharKey || "",
    charKeys: [],
    multiPrefixEnabled: icg.multiPrefixEnabled === true,
    prefixTemplates: Array.isArray(icg.prefixTemplates)
      ? JSON.parse(JSON.stringify(icg.prefixTemplates))
      : [],
    prefixAssignments:
      icg.prefixAssignments && typeof icg.prefixAssignments === "object"
        ? Object.assign({}, icg.prefixAssignments)
        : {},
  };
}
