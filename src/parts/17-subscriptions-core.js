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
          var sortedAssignments = {};
          if (g.prefixAssignments && typeof g.prefixAssignments === "object") {
            Object.keys(g.prefixAssignments)
              .sort()
              .forEach(function (k) {
                sortedAssignments[k] = g.prefixAssignments[k];
              });
          }
          return {
            id: g.id,
            name: g.name || "",
            color: g.color || "",
            note: g.note || "",
            defaultAuthor: g.defaultAuthor || "",
            stagePrefix: g.stagePrefix || "",
            multiStagePrefix: g.multiStagePrefix || "",
            multiPrefixEnabled: g.multiPrefixEnabled === true,
            prefixTemplates: Array.isArray(g.prefixTemplates)
              ? g.prefixTemplates.map(function (t) {
                  return {
                    id: t.id || "",
                    name: t.name || "",
                    content: t.content || "",
                  };
                })
              : [],
            prefixAssignments: sortedAssignments,
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
          var sortedAssignments = {};
          if (
            cg.prefixAssignments &&
            typeof cg.prefixAssignments === "object"
          ) {
            Object.keys(cg.prefixAssignments)
              .sort()
              .forEach(function (k) {
                sortedAssignments[k] = cg.prefixAssignments[k];
              });
          }
          return {
            name: cg.name || "",
            color: cg.color || "",
            note: cg.note || "",
            defaultAuthor: cg.defaultAuthor || "",
            stagePrefix: cg.stagePrefix || "",
            multiStagePrefix: cg.multiStagePrefix || "",
            iconMode: cg.iconMode || "group",
            iconUrl: cg.iconUrl || "",
            iconCharKey: cg.iconCharKey || "",
            charKeys: (cg.charKeys || []).slice().sort(),
            charDisplayOrder: (cg.charDisplayOrder || []).slice(),
            multiPrefixEnabled: cg.multiPrefixEnabled === true,
            prefixTemplates: Array.isArray(cg.prefixTemplates)
              ? cg.prefixTemplates.map(function (t) {
                  return {
                    id: t.id || "",
                    name: t.name || "",
                    content: t.content || "",
                  };
                })
              : [],
            prefixAssignments: sortedAssignments,
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
    var _subNameMap = _buildLocalNameIndex();
    try {
      ip.forEach(function (p) {
        _rebindPromptChar(p, _subNameMap);
      });
      if (Array.isArray(imported.charGroups)) {
        imported.charGroups.forEach(function (icg) {
          if (!Array.isArray(icg.charKeys)) return;
          icg.charKeys = icg.charKeys.map(function (k) {
            return _rebindLostKeyByName(k, _subNameMap);
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
            if (g.stagePrefix !== undefined) ex.stagePrefix = g.stagePrefix;
            if (g.multiStagePrefix !== undefined)
              ex.multiStagePrefix = g.multiStagePrefix;
            if (g.multiPrefixEnabled !== undefined)
              ex.multiPrefixEnabled = g.multiPrefixEnabled === true;
            if (Array.isArray(g.prefixTemplates))
              ex.prefixTemplates = JSON.parse(
                JSON.stringify(g.prefixTemplates),
              );
            if (g.prefixAssignments && typeof g.prefixAssignments === "object")
              ex.prefixAssignments = Object.assign({}, g.prefixAssignments);
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
          if (!existing.multiStagePrefix && icg.multiStagePrefix)
            existing.multiStagePrefix = icg.multiStagePrefix;
          if (sub.updateExisting !== false) {
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
          }
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
        var newKey = _rebindLostKeyByName(k, _subNameMap);
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
        var newKey = _rebindLostKeyByName(k, _subNameMap);
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
      (Array.isArray(imported.charGroups) ? imported.charGroups : []).forEach(
        function (icg) {
          if (!icg || !icg.prefixAssignments) return;
          var localG = data.groups.find(function (g) {
            return g.name === icg.name;
          });
          _remapAssign(localG, icg.prefixAssignments);
        },
      );
    })();
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
      var response = await msFetch(fetchUrl, null, 15000);

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
      if (isShutdownFetchError(e)) return null;
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

