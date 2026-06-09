  function sendToInput(id) {
    const p = getPrompt(id);
    if (!p) return;
    markPromptUsed(p);
    saveData();
    try {
      const $ta = $("#send_textarea");
      if (!$ta.length) {
        toast("error", "找不到输入框");
        return;
      }
      var sids = data.settings.stageSelectedIds || [];
      if (
        data.settings.stageInjectEnabled &&
        sids.length > 0 &&
        sids.indexOf(id) >= 0
      ) {
        _setupInjectLock();
      }
      var ta = $ta[0];
      var oldVal = ta.value || "";
      var start = ta.selectionStart || 0;
      var end = ta.selectionEnd || 0;
      if (_inputAppendList.length > 0) {
        var lastItem = _inputAppendList[_inputAppendList.length - 1];
        if (oldVal.indexOf(lastItem.content) < 0) {
          _inputAppendList = [];
        }
      }
      var insertText;
      var retroLabel = "";
      var retroOldContent = "";
      if (_inputAppendList.length === 0) {
        insertText = p.content;
      } else {
        var num = _inputAppendList.length + 1;
        var label = "【任务" + num + " | " + (p.title || "未命名") + "】\n";
        var beforeChars = oldVal.substring(Math.max(0, start - 2), start);
        var prefix;
        if (start === 0) {
          prefix = "";
        } else if (beforeChars.endsWith("\n\n")) {
          prefix = "";
        } else if (beforeChars.endsWith("\n")) {
          prefix = "\n";
        } else {
          prefix = "\n\n";
        }
        insertText = prefix + label + p.content;
        if (_inputAppendList.length === 1) {
          var firstItem = _inputAppendList[0];
          var firstLabel =
            "【任务1 | " + (firstItem.title || "未命名") + "】\n";
          if (firstItem.content && firstItem.content.indexOf(firstLabel) < 0) {
            retroLabel = firstLabel;
            retroOldContent = firstItem.content;
          }
        }
      }
      var workingVal = oldVal;
      var workingStart = start;
      var workingEnd = end;
      if (retroLabel && retroOldContent) {
        var firstIdx = workingVal.indexOf(retroOldContent);
        if (firstIdx >= 0) {
          workingVal =
            workingVal.substring(0, firstIdx) +
            retroLabel +
            workingVal.substring(firstIdx);
          var labelLen = retroLabel.length;
          if (workingStart >= firstIdx) workingStart += labelLen;
          if (workingEnd >= firstIdx) workingEnd += labelLen;
          _inputAppendList[0].content = retroLabel + retroOldContent;
        }
      }
      var newVal =
        workingVal.substring(0, workingStart) +
        insertText +
        workingVal.substring(workingEnd);
      $ta.val(newVal).trigger("input").trigger("focus");
      var newCursor = workingStart + insertText.length;
      ta.setSelectionRange(newCursor, newCursor);
      _inputAppendList.push({ id: p.id, title: p.title, content: insertText });
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
