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
            multiStagePrefix: cg.multiStagePrefix || "",
            iconMode: cg.iconMode || "group",
            iconUrl: cg.iconUrl || "",
            iconCharKey: cg.iconCharKey || "",
            charKeys: matchedKeys,
            charDisplayOrder: Array.isArray(cg.charDisplayOrder)
              ? cg.charDisplayOrder.filter(function (k) {
                  return matchedKeys.indexOf(k) >= 0;
                })
              : [],
            multiPrefixEnabled: cg.multiPrefixEnabled === true,
            prefixTemplates: Array.isArray(cg.prefixTemplates)
              ? JSON.parse(JSON.stringify(cg.prefixTemplates))
              : [],
            prefixAssignments:
              cg.prefixAssignments && typeof cg.prefixAssignments === "object"
                ? Object.assign({}, cg.prefixAssignments)
                : {},
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
    icgs = icgs || [];
    ibdmsgs = ibdmsgs || {};
    ibddates = ibddates || {};
    var _importNameMap = _buildLocalNameIndex();
    var importBdDateConflicts = [];
    var importBdMsgConflicts = [];
    ip.forEach(function (p) {
      _rebindPromptChar(p, _importNameMap);
    });
    if (icgs && icgs.length > 0) {
      icgs.forEach(function (icg) {
        if (!Array.isArray(icg.charKeys)) return;
        icg.charKeys = icg.charKeys.map(function (k) {
          return _rebindLostKeyByName(k, _importNameMap);
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
          if (!existing.multiStagePrefix && icg.multiStagePrefix)
            existing.multiStagePrefix = icg.multiStagePrefix;
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
            if (icg.multiPrefixEnabled !== undefined)
              existing.multiPrefixEnabled = icg.multiPrefixEnabled === true;
            if (Array.isArray(icg.prefixTemplates))
              existing.prefixTemplates = JSON.parse(
                JSON.stringify(icg.prefixTemplates),
              );
            if (
              icg.prefixAssignments &&
              typeof icg.prefixAssignments === "object"
            )
              existing.prefixAssignments = Object.assign(
                {},
                icg.prefixAssignments,
              );
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
          var newG = _buildIPGroupFromImport(icg);
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
    (function () {
      var _expIdToLocal = {};
      ip.forEach(function (p) {
        var sid = p.sourceId || p.id;
        var found = data.prompts.find(function (lp) {
          return (sid && lp.sourceId === sid) || lp.id === p.id;
        });
        if (found) _expIdToLocal[p.id] = found.id;
      });
      function _remapAssign(localGroup, srcAssign) {
        if (!localGroup || !srcAssign || typeof srcAssign !== "object") return;
        if (!localGroup.prefixAssignments) localGroup.prefixAssignments = {};
        Object.keys(srcAssign).forEach(function (oldPid) {
          if (
            localGroup.prefixAssignments[oldPid] !== undefined &&
            !_expIdToLocal[oldPid]
          ) {
            delete localGroup.prefixAssignments[oldPid];
          }
          var newPid = _expIdToLocal[oldPid];
          if (newPid) localGroup.prefixAssignments[newPid] = srcAssign[oldPid];
        });
      }
      (ig || []).forEach(function (impG) {
        if (!impG || !impG.prefixAssignments) return;
        var localG = data.groups.find(function (g) {
          return g.name === impG.name;
        });
        _remapAssign(localG, impG.prefixAssignments);
      });
      (icgs || []).forEach(function (icg) {
        if (!icg || !icg.prefixAssignments) return;
        var localG = data.groups.find(function (g) {
          return g.name === icg.name;
        });
        _remapAssign(localG, icg.prefixAssignments);
      });
    })();
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
        var newKey = _rebindLostKeyByName(k, _importNameMap);
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
        var newKey = _rebindLostKeyByName(k, _importNameMap);
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
        .html(
          '<i class="fa-solid fa-syringe"></i><span>' +
            label +
            '</span><i class="fa-solid fa-xmark ms-inject-clear-btn" title="清除所有注入选择" style="margin-left:6px;font-size:10px;opacity:0.6;cursor:pointer;padding:2px 4px;border-radius:3px;"></i>',
        )
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
  function stripOuterTagIfMatchesShell(text, shellTagName) {
    if (!text || !shellTagName) return text;
    var trimmed = text.replace(/^\s+|\s+$/g, "");
    if (!trimmed) return text;
    var openMatch = trimmed.match(/^<([A-Za-z_][\w-]*)\b[^>]*>/);
    if (!openMatch) return text;
    if (openMatch[1].toLowerCase() !== shellTagName.toLowerCase()) return text;
    var tagName = openMatch[1];
    var closeRe = new RegExp("</\\s*" + tagName + "\\s*>$", "i");
    var closeMatch = trimmed.match(closeRe);
    if (!closeMatch) return text;
    var inner = trimmed.substring(
      openMatch[0].length,
      trimmed.length - closeMatch[0].length,
    );
    var openTagRe = new RegExp("<" + tagName + "\\b", "gi");
    var closeTagRe = new RegExp("</" + tagName + "\\b", "gi");
    var openCount = (inner.match(openTagRe) || []).length;
    var closeCount = (inner.match(closeTagRe) || []).length;
    if (openCount !== closeCount) return text;
    return inner.replace(/^\n+/, "").replace(/\n+$/, "");
  }

  function buildStageContent(stagePrompts) {
    if (stagePrompts.length === 0) return "";
    if (stagePrompts.length === 1) {
      var pr = stagePrompts[0];
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var prefix = "";
      if (
        g &&
        g.multiPrefixEnabled &&
        g.prefixAssignments &&
        g.prefixAssignments[pr.id] &&
        Array.isArray(g.prefixTemplates)
      ) {
        var _tpl = g.prefixTemplates.find(function (t) {
          return t.id === g.prefixAssignments[pr.id];
        });
        if (_tpl && _tpl.content && _tpl.content.trim()) prefix = _tpl.content;
      }
      if (!prefix) {
        if (g && g.stagePrefix) prefix = g.stagePrefix;
        else if (data.settings.defaultStagePrefix)
          prefix = data.settings.defaultStagePrefix;
      }
      var result = "";
      if (prefix) {
        if (/\{\{stages\}\}/i.test(prefix)) {
          result = prefix.replace(/\{\{stages\}\}/gi, function () {
            return pr.content;
          });
        } else if (/\{\{stage\}\}/i.test(prefix)) {
          result = prefix.replace(/\{\{stage\}\}/gi, function () {
            return pr.content;
          });
        } else {
          result = prefix + "\n" + pr.content;
        }
      } else {
        result = pr.content;
      }
      return result.replace(/\{\{stage_title\}\}/gi, function () {
        return pr.title || "";
      });
    }
    var wrapper = "";
    var _firstGid = stagePrompts[0].groupId || null;
    var _allSameGroup = stagePrompts.every(function (p) {
      return (p.groupId || null) === _firstGid;
    });
    if (_allSameGroup && _firstGid) {
      var _firstG = getGroup(_firstGid);
      if (
        _firstG &&
        _firstG.multiStagePrefix &&
        _firstG.multiStagePrefix.trim()
      ) {
        wrapper = _firstG.multiStagePrefix;
      }
    }
    if (!wrapper) {
      wrapper = data.settings.multiStagePrefix || "";
    }
    if (!wrapper || wrapper.indexOf("{{stage_tasks}}") < 0) {
      wrapper =
        "<stage>\n\u4ee5\u4e0b\u5171\u6709 {{stage_count}} \u4e2a\u72ec\u7acb\u5c0f\u5267\u573a\u4efb\u52a1\uff0c\u8bf7\u5728\u6b63\u6587\u6700\u540e\u6309\u987a\u5e8f\u9010\u4e00\u5b8c\u6210\uff0c\u6bcf\u6761\u5267\u573a\u5355\u72ec\u4f7f\u7528\u5bf9\u5e94\u683c\u5f0f\u5305\u88f9\u3002\n\n{{stage_tasks}}\n</stage>";
    }
    var shellTagName = (function () {
      var _tw = wrapper.replace(/^\s+/, "");
      var _tm = _tw.match(/^<([A-Za-z_][\w-]*)\b/);
      return _tm ? _tm[1].toLowerCase() : null;
    })();
    var groupedByPrefix = {};
    var prefixOrder = [];
    stagePrompts.forEach(function (pr) {
      var g = pr.groupId ? getGroup(pr.groupId) : null;
      var rawPrefix = "";
      if (
        g &&
        g.multiPrefixEnabled &&
        g.prefixAssignments &&
        g.prefixAssignments[pr.id] &&
        Array.isArray(g.prefixTemplates)
      ) {
        var _tpl = g.prefixTemplates.find(function (t) {
          return t.id === g.prefixAssignments[pr.id];
        });
        if (_tpl && _tpl.content && _tpl.content.trim())
          rawPrefix = _tpl.content;
      }
      if (!rawPrefix) {
        if (g && g.stagePrefix) rawPrefix = g.stagePrefix;
        else if (data.settings.defaultStagePrefix)
          rawPrefix = data.settings.defaultStagePrefix;
      }
      var key = rawPrefix || "_no_prefix_";
      if (!groupedByPrefix[key]) {
        groupedByPrefix[key] = { rawPrefix: rawPrefix, prompts: [] };
        prefixOrder.push(key);
      }
      groupedByPrefix[key].prompts.push(pr);
    });
    var taskBlocks = [];
    var taskCounter = 0;
    prefixOrder.forEach(function (key) {
      var grp = groupedByPrefix[key];
      var rawPrefix = grp.rawPrefix;
      var innerPrefix = stripOuterTagIfMatchesShell(rawPrefix, shellTagName);
      var hasStagesMacro = /\{\{stages\}\}/i.test(innerPrefix);
      var hasStageMacro = /\{\{stage\}\}/i.test(innerPrefix);
      if (hasStagesMacro) {
        var subTasks = [];
        var allTitles = [];
        grp.prompts.forEach(function (pr) {
          taskCounter++;
          var _subHeader = "\u3010\u4efb\u52a1" + taskCounter;
          if (pr.title && pr.title.trim()) {
            _subHeader += " | " + pr.title.trim();
          }
          _subHeader += "\u3011";
          subTasks.push(_subHeader + "\n" + pr.content);
          allTitles.push(pr.title || "");
        });
        var stagesContent = subTasks.join("\n\n");
        var processedPrefix = innerPrefix
          .replace(/\{\{stage_title\}\}/gi, function () {
            return allTitles.join("\u3001");
          })
          .replace(/\{\{stages\}\}/gi, function () {
            return stagesContent;
          });
        taskBlocks.push(processedPrefix);
      } else if (!innerPrefix || hasStageMacro) {
        grp.prompts.forEach(function (pr) {
          taskCounter++;
          var taskContent = "";
          if (innerPrefix) {
            if (hasStageMacro) {
              taskContent = innerPrefix.replace(/\{\{stage\}\}/gi, function () {
                return pr.content;
              });
            } else {
              taskContent = innerPrefix + "\n" + pr.content;
            }
          } else {
            taskContent = pr.content;
          }
          taskContent = taskContent.replace(
            /\{\{stage_title\}\}/gi,
            function () {
              return pr.title || "";
            },
          );
          var _taskHeader = "\u3010\u4efb\u52a1" + taskCounter;
          if (pr.title && pr.title.trim()) {
            _taskHeader += " | " + pr.title.trim();
          }
          _taskHeader += "\u3011";
          taskBlocks.push(_taskHeader + "\n" + taskContent);
        });
      } else {
        var subTasks = [];
        var allTitles = [];
        grp.prompts.forEach(function (pr) {
          taskCounter++;
          var _subHeader = "\u3010\u4efb\u52a1" + taskCounter;
          if (pr.title && pr.title.trim()) {
            _subHeader += " | " + pr.title.trim();
          }
          _subHeader += "\u3011";
          subTasks.push(_subHeader + "\n" + pr.content);
          allTitles.push(pr.title || "");
        });
        var processedPrefix = innerPrefix.replace(
          /\{\{stage_title\}\}/gi,
          function () {
            return allTitles.join("\u3001");
          },
        );
        taskBlocks.push(processedPrefix + "\n\n" + subTasks.join("\n\n"));
      }
    });
    var tasksStr = taskBlocks.join("\n\n---\n\n");
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

  function getRandomStagePrompts(count) {
    var pool = data.prompts.filter(function (p) {
      return isInRandomPool(p);
    });
    if (pool.length === 0) return [];
    count = Math.min(Math.max(1, count), pool.length);
    var now = Date.now();
    var available = pool.slice();
    var result = [];
    while (result.length < count && available.length > 0) {
      var weighted = available.map(function (p) {
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
      var picked = null;
      for (var i = 0; i < weighted.length; i++) {
        acc += weighted[i].w;
        if (r <= acc) {
          picked = weighted[i].p;
          break;
        }
      }
      if (!picked)
        picked = available[Math.floor(Math.random() * available.length)];
      result.push(picked);
      available = available.filter(function (p) {
        return p.id !== picked.id;
      });
    }
    return result;
  }

  function doRandomPick() {
    var visibleIds = getVisiblePromptIds().filter(function (pid) {
      return !!getPrompt(pid);
    });
    var pool = visibleIds
      .map(function (pid) {
        return getPrompt(pid);
      })
      .filter(function (p) {
        return p && isInRandomPool(p);
      });
    var fallbackToGlobalPool = false;
    if (pool.length === 0) {
      fallbackToGlobalPool = visibleIds.length > 0;
      pool = data.prompts.filter(function (p) {
        return isInRandomPool(p);
      });
    }
    if (pool.length === 0) {
      toast("warning", "随机池里没有可抽取的剧场");
      return;
    }
    var picked = pool[Math.floor(Math.random() * pool.length)];
    if (!picked) return;
    if (fallbackToGlobalPool) {
      toast("info", "当前范围都被排除了，已从全局随机池抽取");
    }
    navigateTo({
      name: "preview",
      promptId: picked.id,
      _siblingIds: pool.map(function (p) {
        return p.id;
      }),
    });
  }

  var _pagedCtx = null;

  function _clearPagedCtx() {
    _pagedCtx = null;
  }

  function _buildPagedAnchor(rendered, total) {
    return (
      '<div id="ms-paged-anchor" style="padding:14px;text-align:center;font-size:11px;color:var(--SmartThemeQuoteColor,#888);background:rgba(var(--ms-accent-rgb),0.04);border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);"><i class="fa-solid fa-arrow-down" style="margin-right:4px;color:var(--ms-accent);"></i>已显示 ' +
      rendered +
      " / " +
      total +
      " · 继续向下滚动加载</div>"
    );
  }

  function _applyPagedRender(blockHtmls, options) {
    options = options || {};
    var firstBatch = options.firstBatch || 80;
    var batchSize = options.batchSize || 50;
    if (!Array.isArray(blockHtmls) || blockHtmls.length <= firstBatch + 20) {
      return blockHtmls.join("");
    }
    _pagedCtx = {
      blocks: blockHtmls,
      rendered: firstBatch,
      batchSize: batchSize,
      _lastLoad: 0,
    };
    return (
      blockHtmls.slice(0, firstBatch).join("") +
      _buildPagedAnchor(firstBatch, blockHtmls.length)
    );
  }

  function _loadMorePagedBlocks($body) {
    if (!_pagedCtx) return;
    var ctx = _pagedCtx;
    var $anchor = $body.find("#ms-paged-anchor");
    if (!$anchor.length) {
      _pagedCtx = null;
      return;
    }
    var bodyEl = $body[0];
    if (!bodyEl) return;
    var distToBottom =
      bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight;
    if (distToBottom > 400) return;
    var now = Date.now();
    if (ctx._lastLoad && now - ctx._lastLoad < 80) return;
    ctx._lastLoad = now;
    var end = Math.min(ctx.rendered + ctx.batchSize, ctx.blocks.length);
    var addHtml = "";
    for (var i = ctx.rendered; i < end; i++) addHtml += ctx.blocks[i];
    $anchor.before(addHtml);
    ctx.rendered = end;
    if (ctx.rendered >= ctx.blocks.length) {
      $anchor.remove();
      _pagedCtx = null;
    } else {
      $anchor.replaceWith(_buildPagedAnchor(ctx.rendered, ctx.blocks.length));
    }
  }

