function createGroup(name) {
  const g = {
    id: uid(),
    name,
    color: GROUP_COLORS[data.groups.length % GROUP_COLORS.length],
    note: "",
    defaultAuthor: "",
    stagePrefix: "",
    charKeys: [],
    subGroupEnabled: false,
    subGroups: [],
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
  if (data.settings.generalCollapsed) delete data.settings.generalCollapsed[id];
  data.prompts.forEach((p) => {
    if (p.groupId === id) {
      p.groupId = null;
      p.subGroupId = null;
    }
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
  if (ri && Array.isArray(ri.excludedSubGroups)) {
    ri.excludedSubGroups = ri.excludedSubGroups.filter(function (x) {
      return !x || x.groupId !== id;
    });
  }
  _invalidateCharGroupCache();
  saveData();
}
function deleteGroupWithPrompts(gid) {
  var ids = data.prompts
    .filter(function (p) {
      return p.groupId === gid;
    })
    .map(function (p) {
      return p.id;
    });
  if (ids.length > 0) deletePrompts(ids);
  deleteGroup(gid);
}
function createSubGroup(gid, name) {
  var g = getGroup(gid);
  if (!g) return null;
  if (!Array.isArray(g.subGroups)) g.subGroups = [];
  var sg = {
    id: uid(),
    name: name || "未命名",
    color: GROUP_COLORS[g.subGroups.length % GROUP_COLORS.length],
    note: "",
  };
  g.subGroups.push(sg);
  g.subGroupEnabled = true;
  saveData();
  return sg;
}
function updateSubGroup(gid, sgid, u) {
  var sg = getSubGroup(gid, sgid);
  if (!sg) return;
  Object.assign(sg, u);
  saveData();
}
function deleteSubGroup(gid, sgid, mode, targetSgid) {
  var g = getGroup(gid);
  if (!g || !Array.isArray(g.subGroups)) return;
  var affected = data.prompts.filter(function (p) {
    return p.groupId === gid && p.subGroupId === sgid;
  });
  if (mode === "delete") {
    if (affected.length > 0) {
      deletePrompts(
        affected.map(function (p) {
          return p.id;
        }),
      );
    }
  } else if (mode === "move" && targetSgid && getSubGroup(gid, targetSgid)) {
    affected.forEach(function (p) {
      p.subGroupId = targetSgid;
    });
  } else {
    affected.forEach(function (p) {
      p.subGroupId = null;
    });
  }
  g.subGroups = g.subGroups.filter(function (sg) {
    return sg.id !== sgid;
  });
  if (g.subGroups.length === 0) g.subGroupEnabled = false;
  if (filterState.subGroupId === sgid) filterState.subGroupId = null;
  // 视图栈里各层存过 filterState 快照，不清掉的话返回上一页会把失效的
  // 文件夹筛选恢复出来，导致列表命中 0 条且筛选面板已无 chip 可取消
  if (Array.isArray(viewStack)) {
    viewStack.forEach(function (v) {
      if (v && v._savedFilter && v._savedFilter.subGroupId === sgid) {
        v._savedFilter.subGroupId = null;
      }
    });
  }
  var ri = data.settings.randomInject;
  if (ri && Array.isArray(ri.excludedSubGroups)) {
    var _sgAllGone = g.subGroups.length === 0;
    ri.excludedSubGroups = ri.excludedSubGroups.filter(function (x) {
      if (!x || x.groupId !== gid) return true;
      if (x.subGroupId === sgid) return false;
      // 分组已无任何文件夹时，「未分类」的排除记录会命中该组全部剧场，
      // 而随机池页面此时不再渲染文件夹行，用户无法取消，必须一并清掉
      if (_sgAllGone && x.subGroupId === SUBGROUP_NONE) return false;
      return true;
    });
  }
  saveData();
}
function createPrompt(obj) {
  const p = {
    id: uid(),
    title: obj.title || "未命名",
    content: obj.content || "",
    groupId: obj.groupId || null,
    subGroupId: obj.subGroupId || null,
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
    if (
      u.groupId !== undefined &&
      u.groupId !== oldGroupId &&
      u.subGroupId === undefined
    ) {
      p.subGroupId = null;
    }
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
      u.groupId !== undefined ||
      u.subGroupId !== undefined
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
  if (
    data.settings.pinnedInject &&
    Array.isArray(data.settings.pinnedInject.sequence)
  ) {
    data.settings.pinnedInject.sequence =
      data.settings.pinnedInject.sequence.filter(function (it) {
        if (!it) return false;
        if (it.type === "random") return true;
        return !s.has(it.id);
      });
  }
  var ri = data.settings.randomInject;
  if (ri && Array.isArray(ri.excludedPromptIds)) {
    ri.excludedPromptIds = ri.excludedPromptIds.filter((pid) => !s.has(pid));
  }
  _invalidateCharGroupCache();
  saveData();
}
function movePromptsToGroup(ids, gid, sgid) {
  const s = new Set(ids);
  data.prompts.forEach((p) => {
    if (!s.has(p.id)) return;
    var switched = p.groupId !== gid;
    p.groupId = gid;
    if (sgid !== undefined) {
      p.subGroupId = sgid && sgid !== SUBGROUP_NONE ? sgid : null;
    } else if (switched) {
      p.subGroupId = null;
    }
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
    subGroupId: p.subGroupId || null,
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
function normalizeTagName(name) {
  return String(name === undefined || name === null ? "" : name)
    .replace(/\u3000/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findTagByName(name) {
  var key = normalizeTagName(name);
  if (!key) return null;
  for (var i = 0; i < data.settings.definedTags.length; i++) {
    var t = data.settings.definedTags[i];
    if (normalizeTagName(t.name) === key) return t;
  }
  return null;
}

function countPromptsWithTag(tagId) {
  var cnt = 0;
  data.prompts.forEach(function (p) {
    if (p.tags && p.tags.indexOf(tagId) >= 0) cnt++;
  });
  return cnt;
}

function dedupePromptTags() {
  var changed = 0;
  data.prompts.forEach(function (p) {
    if (!Array.isArray(p.tags) || p.tags.length < 2) return;
    var out = [];
    p.tags.forEach(function (tid) {
      if (tid && out.indexOf(tid) < 0) out.push(tid);
    });
    if (out.length !== p.tags.length) {
      p.tags = out;
      changed++;
    }
  });
  return changed;
}

function getDuplicateTagGroups() {
  var buckets = {};
  var order = [];
  data.settings.definedTags.forEach(function (t) {
    var key = normalizeTagName(t.name);
    if (!key) return;
    if (!buckets[key]) {
      buckets[key] = [];
      order.push(key);
    }
    buckets[key].push(t);
  });
  var result = [];
  order.forEach(function (key) {
    if (buckets[key].length > 1) result.push(buckets[key]);
  });
  return result;
}

function mergeDuplicateTags() {
  var groups = getDuplicateTagGroups();
  if (groups.length === 0) return { groups: 0, removed: 0, prompts: 0 };
  var idMap = {};
  var removedSet = new Set();
  groups.forEach(function (grp) {
    var keeper = grp[0];
    grp.slice(1).forEach(function (t) {
      idMap[t.id] = keeper.id;
      removedSet.add(t.id);
    });
  });
  var affected = 0;
  data.prompts.forEach(function (p) {
    if (!Array.isArray(p.tags) || p.tags.length === 0) return;
    var out = [];
    var changed = false;
    p.tags.forEach(function (tid) {
      var target = idMap[tid] || tid;
      if (target !== tid) changed = true;
      if (out.indexOf(target) < 0) out.push(target);
      else changed = true;
    });
    if (changed) {
      p.tags = out;
      affected++;
    }
  });
  (data.settings.tagMappings || []).forEach(function (m) {
    if (!Array.isArray(m.tagIds)) return;
    var out = [];
    m.tagIds.forEach(function (tid) {
      var target = idMap[tid] || tid;
      if (out.indexOf(target) < 0) out.push(target);
    });
    m.tagIds = out;
    if (m.primaryTagId && idMap[m.primaryTagId]) {
      m.primaryTagId = idMap[m.primaryTagId];
    }
    if (!m.primaryTagId || m.tagIds.indexOf(m.primaryTagId) < 0) {
      m.primaryTagId = m.tagIds.length > 0 ? m.tagIds[0] : null;
    }
  });
  data.settings.definedTags = data.settings.definedTags.filter(function (t) {
    return !removedSet.has(t.id);
  });
  function _remapFilterTags(arr) {
    if (!Array.isArray(arr)) return [];
    var out = [];
    arr.forEach(function (tid) {
      var target = idMap[tid] || tid;
      if (!removedSet.has(target) && out.indexOf(target) < 0) out.push(target);
    });
    return out;
  }
  filterState.includeTags = _remapFilterTags(filterState.includeTags);
  filterState.excludeTags = _remapFilterTags(filterState.excludeTags);
  _tagOrderVersion++;
  saveData();
  return { groups: groups.length, removed: removedSet.size, prompts: affected };
}

function filterPrompts(list) {
  let r = list;
  if (filterState.includeTags.length > 0) {
    var effIncludeTags = expandTagsByMapping(filterState.includeTags);
    if (data.settings.filterTagMode === "and") {
      r = r.filter(
        (p) =>
          p.tags &&
          filterState.includeTags.every((tid) => {
            var linked = expandTagsByMapping([tid]);
            return linked.some((ltid) => p.tags.includes(ltid));
          }),
      );
    } else {
      r = r.filter(
        (p) => p.tags && effIncludeTags.some((tid) => p.tags.includes(tid)),
      );
    }
  }
  if (filterState.excludeTags.length > 0) {
    var effExcludeTags = expandTagsByMapping(filterState.excludeTags);
    r = r.filter(
      (p) => !p.tags || !effExcludeTags.some((tid) => p.tags.includes(tid)),
    );
  }
  if (filterState.groupId) {
    if (filterState.groupId === "_ungrouped")
      r = r.filter((p) => !p.groupId || !getGroup(p.groupId));
    else r = r.filter((p) => p.groupId === filterState.groupId);
  }
  if (filterState.subGroupId) {
    if (filterState.subGroupId === SUBGROUP_NONE) {
      r = r.filter(function (p) {
        return !p.subGroupId || !getSubGroup(p.groupId, p.subGroupId);
      });
    } else {
      r = r.filter(function (p) {
        return p.subGroupId === filterState.subGroupId;
      });
    }
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
    if (p.subGroupId && p.groupId) {
      var _sgS = getSubGroup(p.groupId, p.subGroupId);
      if (_sgS && _sgS.name && _sgS.name.toLowerCase().indexOf(lq) >= 0)
        return true;
    }
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
  var _sgSigForCache = "";
  if (v.groupId && v.groupId !== "_ungrouped") {
    var _sgGForCache = getGroup(v.groupId);
    if (_sgGForCache) {
      _sgSigForCache =
        (_sgGForCache.subGroupEnabled ? "1" : "0") +
        ":" +
        getSubGroups(_sgGForCache)
          .map(function (sg) {
            return sg.id;
          })
          .join(",");
    }
  }
  var cacheKey =
    v.name +
    "|" +
    (v.groupId || "") +
    "|" +
    (v.charKey || "") +
    "|" +
    (v.subGroupId || "") +
    "|" +
    (v.charScope === undefined ? "" : String(v.charScope)) +
    "|" +
    _sgSigForCache +
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
  else if (v.name === "subgroup") {
    list = getPromptsInSubGroup(v.groupId, v.subGroupId);
    if (v.charScope === "_general") {
      list = list.filter(function (p) {
        return !p.character;
      });
    } else if (v.charScope) {
      list = list.filter(function (p) {
        return p.character === v.charScope;
      });
    }
  } else return [];
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

  function _groupBySubGroupVisual(items, g) {
    if (!isSubGroupEnabled(g) || getSubGroups(g).length === 0) {
      return _groupBySeriesVisual(items);
    }
    var buckets = {};
    var noSub = [];
    items.forEach(function (p) {
      if (p.subGroupId && getSubGroup(g.id, p.subGroupId)) {
        if (!buckets[p.subGroupId]) buckets[p.subGroupId] = [];
        buckets[p.subGroupId].push(p);
      } else {
        noSub.push(p);
      }
    });
    var out = [];
    getSubGroups(g).forEach(function (sg) {
      if (!buckets[sg.id]) return;
      _groupBySeriesVisual(buckets[sg.id]).forEach(function (p) {
        out.push(p);
      });
    });
    _groupBySeriesVisual(noSub).forEach(function (p) {
      out.push(p);
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
        g && Array.isArray(g.charDisplayOrder) && g.charDisplayOrder.length > 0;
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
      _groupBySubGroupVisual(general, g).forEach(function (p) {
        visual.push(p);
      });
      orderedKeys.forEach(function (k) {
        _groupBySubGroupVisual(byChar[k] || [], g).forEach(function (p) {
          visual.push(p);
        });
      });
      ordered = visual;
    } else {
      ordered = _groupBySubGroupVisual(sorted, g);
    }
  } else if (v.name === "subgroup" && !searchQuery) {
    ordered = _groupBySeriesVisual(sorted);
  } else if (v.name === "character" && !searchQuery) {
    ordered = _groupBySeriesVisual(sorted);
  } else if (
    v.name === "list" &&
    filterState.groupId &&
    filterState.groupId !== "_ungrouped" &&
    !searchQuery
  ) {
    ordered = _groupBySubGroupVisual(sorted, getGroup(filterState.groupId));
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
