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
              if (data.settings.randomInject.multiEnabled) {
                var rcount =
                  parseInt(data.settings.randomInject.multiCount) || 2;
                var rps = getRandomStagePrompts(rcount);
                if (rps.length > 0) {
                  rps.forEach(function (rp) {
                    stagePrompts.push(rp);
                  });
                }
              } else {
                var rp = getRandomStagePrompt();
                if (rp) stagePrompts.push(rp);
              }
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
