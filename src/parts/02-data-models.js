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

