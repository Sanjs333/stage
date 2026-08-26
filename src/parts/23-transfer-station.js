/* 正式转换台走 GitHub Pages；本地开发时可在设置中临时覆盖这个地址。 */
var TRANSFER_STATION_URL = "https://sanjs333.github.io/stage/converter.html";

var _tsOverlay = null;
var _tsFrame = null;
var _tsPort = null;
var _tsToken = "";
var _tsOrigin = "";
var _tsHostWindow = null;
var _tsWindowHandler = null;
var _tsCloseTimer = null;

function _tsEffectiveUrl() {
  var custom =
    data.settings && data.settings.transferStationUrl
      ? String(data.settings.transferStationUrl).trim()
      : "";
  return custom || TRANSFER_STATION_URL;
}

function _tsGetHostWindow() {
  return getParentWindowSafe() || window;
}

function _tsMakeToken(hostWindow) {
  var cryptoObj = null;
  try {
    cryptoObj = (hostWindow && hostWindow.crypto) || window.crypto;
  } catch (e) {}
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    throw new Error("当前浏览器不支持安全随机数，无法建立转换台连接");
  }
  var bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  var out = "";
  for (var i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function _tsSend(message) {
  if (!_tsPort) return false;
  try {
    _tsPort.postMessage(message);
    return true;
  } catch (e) {
    return false;
  }
}

function _tsSendSnapshot() {
  var snap;
  try {
    snap = buildTransferSnapshot();
  } catch (e) {
    toast("error", "生成快照失败: " + e.message);
    return false;
  }
  var hostOrigin = "酒馆";
  try {
    hostOrigin = _tsHostWindow.location.origin || hostOrigin;
  } catch (e) {}
  return _tsSend({
    __msTransfer: 1,
    type: "snapshot",
    snapshot: snap,
    origin: hostOrigin,
  });
}

function _tsGetSillyTavernContext() {
  var candidates = [];
  try {
    if (_tsHostWindow && _tsHostWindow.SillyTavern) {
      candidates.push(_tsHostWindow.SillyTavern);
    }
  } catch (e) {}
  try {
    if (typeof SillyTavern !== "undefined") candidates.push(SillyTavern);
  } catch (e) {}
  for (var i = 0; i < candidates.length; i++) {
    var st = candidates[i];
    try {
      if (st && typeof st.getContext === "function") {
        var ctx = st.getContext();
        if (ctx) return ctx;
      }
    } catch (e) {}
  }
  return null;
}

function _tsCloneTransferValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function _tsPresetNames(manager) {
  if (!manager || typeof manager.getPresetList !== "function") return [];
  var list = manager.getPresetList("openai") || {};
  var names = list.preset_names;
  if (Array.isArray(names)) return names.slice();
  if (names && typeof names === "object") return Object.keys(names);
  return [];
}

function _tsCleanPresetForTransfer(preset) {
  var src = preset || {};
  /* 白名单而非黑名单：转换台对预设的消费面只有 prompts 与 prompt_order
     （detectFormat 判格式、buildPresetItems 建条目），其余字段一律不出酒馆。
     黑名单挡不住酒馆升级或第三方扩展新塞进来的连接类字段，而这份 JSON 会
     随工作区存进浏览器、还能被用户导出成文件分享出去。 */
  var out = {};
  if (Array.isArray(src.prompts)) {
    out.prompts = _tsCloneTransferValue(src.prompts);
  }
  if (src.prompt_order !== undefined) {
    out.prompt_order = _tsCloneTransferValue(src.prompt_order);
  }
  return out;
}

/* 数据交换原先只列酒馆自己的世界书和预设，脚本内的剧场反而读不进转换台——可「推送为世界书」
   要转换的正好就是这批数据。这里把分组做成第三类可读资源，内容直接用导出用的
   buildExportPayload 生成，和用户手动导出的 .json 一字不差，转换台那边按 ministage 认。 */

/* 转换台原先没办法知道「这条剧场脚本里已经有了」——快照里只有分组和标签，没有正文可比，
   所以同一本预设转两遍、或者把别人分享的世界书再转一次，页面上看不出哪些是重复的，
   只能等推送到一半被去重逻辑默默跳过。这里补一张指纹表，两种口径各一列：

     f = 推送去重用的那支 contentFingerprint（标题 + 正文），命中它就等于推送时会被跳过。
         本地这一侧取 p.fingerprint 优先，和 _tsDedupePrompts 完全同一个口径，
         否则页面说「会跳过」而实际没跳过，比不标还糟。
     c = 只按正文算，且容忍 CRLF 与行尾空白，用来提示「正文重复但标题不同」——
         这种推送不会跳过，所以必须和上面一条分开显示。

   只发哈希与截短的标题，不发正文：一万条也就百来 KB，粘贴快照那条路也扛得住。 */

var _TS_DUP_INDEX_MAX = 20000;

function _tsNormDupContent(content) {
  return String(content == null ? "" : content)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t　]+(?=\n)/g, "")
    .replace(/[ \t　]+$/, "")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

function _tsDupContentFingerprint(content) {
  var text = _tsNormDupContent(content);
  /* 空正文一律给空串：否则所有空条目会互相命中，标出一片假的「已有」 */
  return text ? fastDualHash(text) : "";
}

function _tsBuildStageDupIndex() {
  var list = data && Array.isArray(data.prompts) ? data.prompts : [];
  var limit = Math.min(list.length, _TS_DUP_INDEX_MAX);
  var entries = [];
  for (var i = 0; i < limit; i++) {
    var p = list[i];
    if (!p || typeof p !== "object") continue;
    entries.push({
      f: p.fingerprint || contentFingerprint(p),
      c: _tsDupContentFingerprint(p.content),
      t: String(p.title == null ? "" : p.title).slice(0, 60),
      g: p.groupId && getGroup(p.groupId) ? p.groupId : "",
    });
  }
  return {
    version: 1,
    total: list.length,
    truncated: list.length > limit,
    entries: entries,
  };
}

var _TS_STAGE_ALL = "_all";
var _TS_STAGE_UNGROUPED = "_ungrouped";

/* 与 _tsUniqueWorldName 的区别：这只是给列表去重显示名，撞多少次都不该抛错把整张目录带崩 */
function _tsUniqueLabel(name, taken) {
  if (taken.indexOf(name) < 0) return name;
  for (var i = 2; i < 500; i++) {
    var candidate = name + " (" + i + ")";
    if (taken.indexOf(candidate) < 0) return candidate;
  }
  return name + " (" + (taken.length + 1) + ")";
}

function _tsStagePromptsFor(gid) {
  var all = data && Array.isArray(data.prompts) ? data.prompts : [];
  if (gid === _TS_STAGE_ALL) return all.slice();
  if (gid === _TS_STAGE_UNGROUPED) {
    return all.filter(function (p) {
      return !(p.groupId && getGroup(p.groupId));
    });
  }
  return all.filter(function (p) {
    return p.groupId === gid;
  });
}

function _tsBuildStageCatalog() {
  var all = data && Array.isArray(data.prompts) ? data.prompts : [];
  if (!all.length) return [];
  var counts = {};
  all.forEach(function (p) {
    var gid =
      p.groupId && getGroup(p.groupId) ? p.groupId : _TS_STAGE_UNGROUPED;
    counts[gid] = (counts[gid] || 0) + 1;
  });
  /* 转换台按名字建文件、也按名字记勾选，两个同名分组会被当成同一个，所以显示名先在这里分开。
     真正读的时候认的是 gid，不受这里改名影响。 */
  var taken = [];
  var out = [];
  function add(gid, name, count) {
    var label = _tsUniqueLabel(
      String(name || "").trim() || "未命名分组",
      taken,
    );
    taken.push(label);
    out.push({ kind: "stage", gid: gid, name: label, count: count });
  }
  add(_TS_STAGE_ALL, "全部剧场", all.length);
  (data.groups || []).forEach(function (g) {
    if (!g || !g.id || !counts[g.id]) return;
    add(g.id, g.name, counts[g.id]);
  });
  if (counts[_TS_STAGE_UNGROUPED]) {
    add(_TS_STAGE_UNGROUPED, "未分组", counts[_TS_STAGE_UNGROUPED]);
  }
  return out;
}

async function _tsBuildLibraryCatalog() {
  var ctx = _tsGetSillyTavernContext();
  if (!ctx) throw new Error("无法读取 SillyTavern 扩展上下文");

  var worldNames = [];
  if (typeof ctx.getWorldInfoNames === "function") {
    worldNames = ctx.getWorldInfoNames() || [];
  }
  if (!Array.isArray(worldNames)) worldNames = [];

  var presetNames = [];
  if (typeof ctx.getPresetManager === "function") {
    try {
      presetNames = _tsPresetNames(ctx.getPresetManager("openai"));
    } catch (e) {}
  }

  worldNames = worldNames
    .map(function (name) {
      return String(name || "").trim();
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return a.localeCompare(b, "zh-CN");
    });
  presetNames = presetNames
    .map(function (name) {
      return String(name || "").trim();
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return a.localeCompare(b, "zh-CN");
    });

  var stages = [];
  try {
    stages = _tsBuildStageCatalog();
  } catch (e) {}

  return {
    stages: stages,
    worlds: worldNames.map(function (name) {
      return { kind: "world", name: name };
    }),
    presets: presetNames.map(function (name) {
      return { kind: "preset", apiId: "openai", name: name };
    }),
  };
}

async function _tsSendLibraryCatalog(requestId) {
  try {
    var catalog = await _tsBuildLibraryCatalog();
    _tsSend({
      __msTransfer: 1,
      type: "library-catalog",
      requestId: requestId || "",
      ok: true,
      catalog: catalog,
    });
  } catch (e) {
    _tsSend({
      __msTransfer: 1,
      type: "library-catalog",
      requestId: requestId || "",
      ok: false,
      error: e.message || String(e),
    });
  }
}

async function _tsReadLibraryResources(message) {
  var requestId = String((message && message.requestId) || "");
  var requested = Array.isArray(message && message.resources)
    ? message.resources.slice(0, 200)
    : [];
  var ctx = _tsGetSillyTavernContext();
  if (!ctx) {
    _tsSend({
      __msTransfer: 1,
      type: "library-read-complete",
      requestId: requestId,
      ok: false,
      imported: 0,
      failed: requested.length,
      error: "无法读取 SillyTavern 扩展上下文",
    });
    return;
  }

  var catalog;
  try {
    catalog = await _tsBuildLibraryCatalog();
  } catch (e) {
    _tsSend({
      __msTransfer: 1,
      type: "library-read-complete",
      requestId: requestId,
      ok: false,
      imported: 0,
      failed: requested.length,
      error: e.message || String(e),
    });
    return;
  }

  var allowedWorlds = new Set(
    catalog.worlds.map(function (item) {
      return item.name;
    }),
  );
  var allowedPresets = new Set(
    catalog.presets.map(function (item) {
      return item.name;
    }),
  );
  var allowedStages = {};
  (catalog.stages || []).forEach(function (item) {
    if (item && item.gid) allowedStages[String(item.gid)] = item;
  });
  var presetManager = null;
  if (typeof ctx.getPresetManager === "function") {
    try {
      presetManager = ctx.getPresetManager("openai");
    } catch (e) {}
  }

  var imported = 0;
  var failed = 0;
  for (var i = 0; i < requested.length; i++) {
    var item = requested[i] || {};
    var kind = "world";
    if (item.kind === "preset" || item.kind === "stage") kind = item.kind;
    var name = String(item.name || "").trim();
    var stageGid = String(item.gid || "");
    try {
      var value = null;
      if (kind === "stage") {
        var stageEntry = allowedStages[stageGid];
        /* 早于 gid 落盘的工作区快照只留了分组名。目录里的显示名是去重过的，拿名字反查
           不会撞到别的分组，比让用户重新勾一遍强。有 gid 时一律以 gid 为准。 */
        if (!stageEntry && !stageGid && name) {
          stageEntry = (catalog.stages || []).filter(function (s) {
            return s && s.name === name;
          })[0];
          if (stageEntry) stageGid = String(stageEntry.gid || "");
        }
        if (!stageEntry) throw new Error("该剧场分组已不存在，请刷新列表");
        name = stageEntry.name;
        var stagePrompts = _tsStagePromptsFor(stageGid);
        if (!stagePrompts.length) throw new Error("该分组下没有剧场");
        if (typeof buildExportPayload !== "function") {
          throw new Error("当前脚本版本不支持导出剧场数据");
        }
        /* 不带历史版本、不带角色信息：转世界书只用到标题、正文和标签，别的只是白占体积 */
        value = buildExportPayload(
          stagePrompts,
          true,
          true,
          false,
          false,
          false,
        );
        /* includeCharacter=false 只清了 prompt 上的 character，而 groups 拿到的是
           活的原始分组对象——charKeys、prefixAssignments、iconUrl 全在里面，IP 分组
           下没被本次剧场引用的角色卡也会一起出去。转换台只读 id / name / subGroups，
           这里按白名单重建一份。 */
        if (value && Array.isArray(value.groups)) {
          value.groups = value.groups.map(function (g) {
            return {
              id: g.id,
              name: g.name,
              color: g.color,
              note: g.note,
              subGroups: Array.isArray(g.subGroups)
                ? g.subGroups.map(function (sg) {
                    return {
                      id: sg.id,
                      name: sg.name,
                      color: sg.color,
                      note: sg.note,
                    };
                  })
                : [],
            };
          });
        }
      } else if (kind === "world") {
        if (!allowedWorlds.has(name)) throw new Error("世界书不存在");
        if (typeof ctx.loadWorldInfo !== "function") {
          throw new Error("当前酒馆版本不支持读取世界书");
        }
        value = await ctx.loadWorldInfo(name);
      } else {
        if (!allowedPresets.has(name)) throw new Error("预设不存在");
        if (
          !presetManager ||
          typeof presetManager.getCompletionPresetByName !== "function"
        ) {
          throw new Error("当前酒馆版本不支持读取聊天补全预设");
        }
        value = presetManager.getCompletionPresetByName(name);
        value = _tsCleanPresetForTransfer(value);
      }
      if (!value || typeof value !== "object") throw new Error("资源内容为空");
      _tsSend({
        __msTransfer: 1,
        type: "library-resource",
        requestId: requestId,
        resource: {
          kind: kind,
          apiId: kind === "preset" ? "openai" : "",
          gid: kind === "stage" ? stageGid : "",
          name: name,
          data: _tsCloneTransferValue(value),
        },
      });
      imported++;
    } catch (e) {
      failed++;
      _tsSend({
        __msTransfer: 1,
        type: "library-resource-error",
        requestId: requestId,
        resource: { kind: kind, name: name },
        error: e.message || String(e),
      });
    }
  }

  _tsSend({
    __msTransfer: 1,
    type: "library-read-complete",
    requestId: requestId,
    ok: failed === 0,
    imported: imported,
    failed: failed,
  });
}

/* ---------- 接收转换台推来的世界书 ---------- */
/* 与 receiveTransferPayload 是两个方向：那边把条目收进小剧场，这边把条目写成酒馆的世界书。 */

var _TS_WORLD_BAD_NAME = /[\\/:*?"<>|]/;

function _tsWorldNames(ctx) {
  if (typeof ctx.getWorldInfoNames !== "function") return [];
  var list = ctx.getWorldInfoNames() || [];
  if (!Array.isArray(list)) return [];
  return list.map(function (name) {
    return String(name || "").trim();
  });
}

function _tsUniqueWorldName(name, taken) {
  if (taken.indexOf(name) < 0) return name;
  for (var i = 2; i < 200; i++) {
    var candidate = name + " (" + i + ")";
    if (taken.indexOf(candidate) < 0) return candidate;
  }
  throw new Error("同名世界书过多，请换一个名字");
}

/* 追加时必须重排编号：转换台生成的条目一律从 0 开始，直接塞进去会盖掉目标世界书的原有条目。 */
function _tsMergeWorldEntries(base, incoming) {
  var out = base && typeof base === "object" ? base : {};
  if (!out.entries || typeof out.entries !== "object") out.entries = {};
  var next = 0;
  Object.keys(out.entries).forEach(function (key) {
    var entry = out.entries[key];
    var uid = Number(entry && entry.uid);
    if (!isFinite(uid)) uid = Number(key);
    if (isFinite(uid) && uid + 1 > next) next = uid + 1;
  });
  var added = 0;
  Object.keys(incoming)
    .sort(function (a, b) {
      return Number(a) - Number(b);
    })
    .forEach(function (key) {
      var entry = incoming[key];
      if (!entry || typeof entry !== "object") return;
      var copy = _tsCloneTransferValue(entry);
      copy.uid = next;
      copy.displayIndex = next;
      out.entries[String(next)] = copy;
      next++;
      added++;
    });
  return { book: out, added: added, total: Object.keys(out.entries).length };
}

/* 面板可能跑在 iframe 里，相对地址会解析到 iframe 自己的文档上，所以拿宿主页的 origin 拼绝对地址 */
function _tsApiUrl(path) {
  var origin = "";
  try {
    origin =
      (_tsHostWindow &&
        _tsHostWindow.location &&
        _tsHostWindow.location.origin) ||
      "";
  } catch (e) {}
  if (!/^https?:\/\//i.test(origin)) {
    try {
      origin = window.location.origin || "";
    } catch (e) {}
  }
  if (!/^https?:\/\//i.test(origin)) return path;
  return origin.replace(/\/+$/, "") + path;
}

async function _tsSaveWorldBook(ctx, name, book) {
  if (typeof ctx.saveWorldInfo === "function") {
    await ctx.saveWorldInfo(name, book, true);
    return;
  }
  /* 退路：老版本酒馆的 context 上没有 saveWorldInfo，直接打后端接口 */
  if (typeof ctx.getRequestHeaders !== "function") {
    throw new Error("当前酒馆版本不支持写入世界书");
  }
  var res = await msFetch(
    _tsApiUrl("/api/worldinfo/edit"),
    {
      method: "POST",
      headers: ctx.getRequestHeaders(),
      body: JSON.stringify({ name: name, data: book }),
    },
    20000,
  );
  if (!res || !res.ok) {
    throw new Error(
      "酒馆拒绝写入世界书" + (res ? "（HTTP " + res.status + "）" : ""),
    );
  }
}

async function _tsReceiveWorldBook(payload) {
  var ctx = _tsGetSillyTavernContext();
  if (!ctx) throw new Error("无法读取 SillyTavern 扩展上下文");

  var incoming = payload && payload.book && payload.book.entries;
  if (!incoming || typeof incoming !== "object")
    throw new Error("推送内容为空");
  if (!Object.keys(incoming).length) throw new Error("推送内容里没有条目");

  var mode =
    payload.mode === "merge" || payload.mode === "replace"
      ? payload.mode
      : "new";
  var name = String((payload && payload.name) || "").trim();
  if (!name) throw new Error("世界书名称为空");
  if (_TS_WORLD_BAD_NAME.test(name)) {
    throw new Error('世界书名称不能含有 \\ / : * ? " < > | 这些字符');
  }

  var taken = _tsWorldNames(ctx);
  var renamed = false;
  var base = { entries: {} };

  if (mode === "new") {
    var unique = _tsUniqueWorldName(name, taken);
    renamed = unique !== name;
    name = unique;
  } else {
    /* 取不到列表时不拦，交给写入本身报错，免得旧版本上明明能写却被这里挡下 */
    if (taken.length && taken.indexOf(name) < 0) {
      throw new Error("世界书「" + name + "」已不存在，请在转换台重新选择目标");
    }
    if (mode === "merge") {
      if (typeof ctx.loadWorldInfo !== "function") {
        throw new Error("当前酒馆版本不支持读取世界书，无法追加");
      }
      var existing = await ctx.loadWorldInfo(name);
      if (existing && typeof existing === "object") {
        base = _tsCloneTransferValue(existing);
      }
      if (!base.entries || typeof base.entries !== "object") base.entries = {};
    } else if (typeof ctx.loadWorldInfo === "function") {
      /* 覆盖只该丢弃条目。世界书目前只有 entries 一个字段，但万一酒馆以后加了书级别的
         设置，整本重写会连带抹掉，所以先把原书读出来、只清空 entries。读不到就照旧新写一本。 */
      try {
        var prev = await ctx.loadWorldInfo(name);
        if (prev && typeof prev === "object") {
          base = _tsCloneTransferValue(prev);
          base.entries = {};
        }
      } catch (e) {}
    }
  }

  var merged = _tsMergeWorldEntries(base, incoming);
  await _tsSaveWorldBook(ctx, name, merged.book);

  if (typeof ctx.updateWorldInfoList === "function") {
    try {
      await ctx.updateWorldInfoList();
    } catch (e) {}
  }
  if (typeof ctx.reloadWorldInfoEditor === "function") {
    try {
      ctx.reloadWorldInfoEditor(name, false);
    } catch (e) {}
  }

  return {
    name: name,
    mode: mode,
    added: merged.added,
    total: merged.total,
    renamed: renamed,
  };
}

function closeTransferStation() {
  if (_tsCloseTimer) {
    clearTimeout(_tsCloseTimer);
    _tsCloseTimer = null;
  }
  if (_tsPort) {
    try {
      _tsPort.postMessage({ __msTransfer: 1, type: "disconnect" });
    } catch (e) {}
    try {
      _tsPort.close();
    } catch (e) {}
    _tsPort = null;
  }
  if (_tsWindowHandler && _tsHostWindow) {
    try {
      _tsHostWindow.removeEventListener("message", _tsWindowHandler);
    } catch (e) {}
  }
  _tsWindowHandler = null;
  if (_tsOverlay && _tsOverlay.parentNode) {
    try {
      _tsOverlay.parentNode.removeChild(_tsOverlay);
    } catch (e) {}
  }
  _tsOverlay = null;
  _tsFrame = null;
  _tsToken = "";
  _tsOrigin = "";
  if (_tsHostWindow) {
    try {
      if (_tsHostWindow._msTransferStationCleanup === closeTransferStation) {
        _tsHostWindow._msTransferStationCleanup = null;
      }
    } catch (e) {}
  }
  _tsHostWindow = null;
}

function _tsAttachPort(port) {
  if (_tsPort && _tsPort !== port) {
    try {
      _tsPort.close();
    } catch (e) {}
  }
  _tsPort = port;
  _tsPort.onmessage = function (event) {
    var d = event && event.data;
    if (!d || d.__msTransfer !== 1) return;
    if (d.type === "snapshot-request") {
      _tsSendSnapshot();
      return;
    }
    if (d.type === "library-catalog-request") {
      _tsSendLibraryCatalog(String(d.requestId || ""));
      return;
    }
    if (d.type === "library-read-request") {
      _tsReadLibraryResources(d);
      return;
    }
    if (d.type === "push-world") {
      _tsReceiveWorldBook(d.payload).then(
        function (out) {
          var verb =
            out.mode === "merge"
              ? "已追加进世界书"
              : out.mode === "replace"
                ? "已覆盖世界书"
                : "已新建世界书";
          toast("success", verb + "「" + out.name + "」，" + out.added + " 条");
          _tsSend({
            __msTransfer: 1,
            type: "push-world-result",
            ok: true,
            name: out.name,
            mode: out.mode,
            added: out.added,
            total: out.total,
            renamed: out.renamed,
          });
        },
        function (err) {
          var msg = (err && err.message) || String(err);
          toast("error", "接收转换台世界书失败: " + msg);
          _tsSend({
            __msTransfer: 1,
            type: "push-world-result",
            ok: false,
            error: msg,
          });
        },
      );
      /* 这一侧不关闭转换台：用户常要连着推好几本 */
      return;
    }
    if (d.type === "push") {
      var res = null;
      try {
        res = receiveTransferPayload(d.payload);
      } catch (e) {
        toast("error", "接收转换台推送失败: " + (e.message || e));
      }
      _tsSend({
        __msTransfer: 1,
        type: "push-result",
        ok: !!res,
        accepted: res ? res.accepted : 0,
        skipped: res ? res.skipped : 0,
      });
      if (res && res.accepted > 0) {
        _tsCloseTimer = setTimeout(function () {
          _tsCloseTimer = null;
          closeTransferStation();
        }, 220);
      }
    }
  };
  _tsPort.onmessageerror = function () {
    toast("warning", "转换台通信中断，请关闭后重新打开");
  };
  try {
    _tsPort.start();
  } catch (e) {}
  _tsSendSnapshot();
  _tsSendLibraryCatalog("");
}

function openTransferStation() {
  if (_tsOverlay && _tsFrame) {
    try {
      _tsFrame.focus();
    } catch (e) {}
    _tsSendSnapshot();
    return;
  }

  var parsed;
  try {
    parsed = new URL(_tsEffectiveUrl());
  } catch (e) {
    toast("error", "转换台地址无效，请检查 TRANSFER_STATION_URL");
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    toast("error", "转换台地址必须使用 http 或 https");
    return;
  }

  var hostWindow = _tsGetHostWindow();
  var hostDocument;
  try {
    hostDocument = hostWindow.document;
    if (!hostDocument || !hostDocument.body) throw new Error("missing body");
  } catch (e) {
    toast("error", "无法在酒馆页面内打开转换台");
    return;
  }

  try {
    if (
      hostWindow._msTransferStationCleanup &&
      hostWindow._msTransferStationCleanup !== closeTransferStation
    ) {
      hostWindow._msTransferStationCleanup();
    }
  } catch (e) {}

  try {
    _tsToken = _tsMakeToken(hostWindow);
  } catch (e) {
    toast("error", e.message || "无法建立转换台连接");
    return;
  }
  parsed.searchParams.set("msTransferToken", _tsToken);
  /* 把宿主 origin 一并交给转换台，让它握手时能指定 postMessage 的目标而不是用 *。
     否则第三方页面只要内嵌转换台并猜中 token，就能拿到通信端口。 */
  try {
    var _tsHostOrigin = hostWindow.location.origin;
    if (_tsHostOrigin && _tsHostOrigin !== "null") {
      parsed.searchParams.set("msTavernOrigin", _tsHostOrigin);
    }
  } catch (e) {}
  _tsOrigin = parsed.origin;
  _tsHostWindow = hostWindow;

  var overlay = hostDocument.createElement("div");
  overlay.id = "ms-transfer-station-overlay";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483646;background:#10100f;" +
    "display:block;width:100vw;height:100vh;overflow:hidden;";

  var frame = hostDocument.createElement("iframe");
  frame.title = "格式转换台";
  frame.src = parsed.href;
  frame.allow = "clipboard-read; clipboard-write";
  frame.style.cssText =
    "display:block;width:100%;height:100%;border:0;background:#10100f;";

  var closeButton = hostDocument.createElement("button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "关闭格式转换台");
  closeButton.title = "关闭格式转换台";
  closeButton.innerHTML = "&#10005;";
  closeButton.style.cssText =
    "position:absolute;top:max(10px,env(safe-area-inset-top));" +
    "right:max(12px,env(safe-area-inset-right));z-index:2;width:38px;height:38px;" +
    "border:1px solid rgba(255,255,255,.22);border-radius:12px;" +
    "background:rgba(20,18,16,.78);color:#f5eee6;font:700 18px/1 sans-serif;" +
    "cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.28);backdrop-filter:blur(8px);";
  closeButton.addEventListener("click", closeTransferStation);

  overlay.appendChild(frame);
  overlay.appendChild(closeButton);
  _tsOverlay = overlay;
  _tsFrame = frame;

  _tsWindowHandler = function (event) {
    var d = event && event.data;
    if (!d || d.__msTransfer !== 1 || d.type !== "connect") return;
    if (!_tsFrame || event.source !== _tsFrame.contentWindow) return;
    if (event.origin !== _tsOrigin) return;
    if (d.token !== _tsToken) return;
    if (!event.ports || !event.ports[0]) return;
    _tsAttachPort(event.ports[0]);
  };
  hostWindow.addEventListener("message", _tsWindowHandler);
  try {
    hostWindow._msTransferStationCleanup = closeTransferStation;
  } catch (e) {}
  hostDocument.body.appendChild(overlay);
}

function _tsDedupePrompts(list) {
  var localFps = new Set();
  data.prompts.forEach(function (p) {
    localFps.add(p.fingerprint || contentFingerprint(p));
  });
  var kept = [];
  var seen = new Set();
  var skipped = 0;
  list.forEach(function (p) {
    if (!p || typeof p !== "object") return;
    var fp = contentFingerprint(p);
    if (localFps.has(fp) || seen.has(fp)) {
      skipped++;
      return;
    }
    seen.add(fp);
    kept.push(p);
  });
  return { kept: kept, skipped: skipped };
}

function receiveTransferPayload(payload) {
  if (!payload || typeof payload !== "object") {
    toast("error", "数据格式无效");
    return null;
  }
  var _tsCurView = currentView().name;
  if (
    (_tsCurView === "edit" && editDirty) ||
    (_tsCurView === "group-edit" && groupEditDirty)
  ) {
    toast(
      "warning",
      "当前有未保存的编辑内容，请先保存或退出编辑，再重新推送",
      4000,
    );
    return null;
  }
  var ip = Array.isArray(payload.prompts) ? payload.prompts : [];
  var ig = Array.isArray(payload.groups) ? payload.groups : [];
  if (ip.length === 0 && ig.length === 0) {
    toast("error", "数据里没有剧场或分组");
    return null;
  }
  var r = _tsDedupePrompts(ip);
  if (r.kept.length === 0) {
    if (r.skipped > 0) {
      toast(
        "warning",
        "全部 " +
          r.skipped +
          " 条与本地已有内容完全重复（仅比对标题与正文），已跳过。若只需调整标签或分组，请在酒馆内直接批量修改。",
        5000,
      );
    } else {
      toast("error", "数据里没有可导入的剧场");
    }
    return { accepted: 0, skipped: r.skipped };
  }
  if (r.skipped > 0) {
    toast("info", "跳过 " + r.skipped + " 条与本地完全重复的剧场");
  }
  if (!panelVisible) {
    try {
      showPanel();
    } catch (e) {}
  }
  navigateTo({
    name: "import-confirm",
    importedGroups: ig,
    importedPrompts: r.kept,
    importedTags: Array.isArray(payload.tags) ? payload.tags : [],
    importedCharGroups: Array.isArray(payload.charGroups)
      ? payload.charGroups
      : [],
    importedBdMessages: payload.charBirthdayMessages || {},
    importedBdDates: payload.charBirthdays || {},
  });
  return { accepted: r.kept.length, skipped: r.skipped };
}

function receiveTransferFromPaste() {
  msPrompt("把转换台生成的推送数据粘贴到下方：", {
    title: "从剪贴板接收",
    icon: "fa-paste",
    multiline: true,
    placeholder: "在此粘贴 JSON",
    okText: "解析",
    validate: function (v) {
      if (!v || !v.trim()) return "内容不能为空";
      try {
        JSON.parse(v);
      } catch (e) {
        return "JSON 解析失败：" + e.message;
      }
      return null;
    },
  }).then(function (val) {
    if (!val) return;
    var obj = null;
    try {
      obj = JSON.parse(val);
    } catch (e) {
      return;
    }
    receiveTransferPayload(obj);
  });
}

(function _tsCleanupPreviousInstance() {
  var hostWindow = _tsGetHostWindow();
  try {
    if (hostWindow._msTransferStationCleanup) {
      hostWindow._msTransferStationCleanup();
    }
  } catch (e) {}
})();

try {
  window.addEventListener("pagehide", closeTransferStation, { once: true });
} catch (e) {}
