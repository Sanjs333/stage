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
      var safeUrl = sanitizeMdUrl(url, true);
      if (!safeUrl) return m;
      return (
        '<img class="ms-md-img" src="' +
        escAttr(safeUrl) +
        '" alt="' +
        escAlreadyEscapedAttr(alt) +
        '" loading="lazy">'
      );
    });
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, text, url) {
      var safeUrl = sanitizeMdUrl(url, false);
      if (!safeUrl) return text;
      return (
        '<a class="ms-md-link" href="' +
        escAttr(safeUrl) +
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
      var _rep = '<span class="ms-quote-text">"' + esc(content) + '"</span>';
      h = h.replace("%%EQ" + idx + "%%", function () {
        return _rep;
      });
    });
    cqBlocks.forEach(function (content, idx) {
      var _rep =
        '<span class="ms-quote-text">\u201c' + esc(content) + "\u201d</span>";
      h = h.replace("%%CQ" + idx + "%%", function () {
        return _rep;
      });
    });
    inlineCodes.forEach(function (code, idx) {
      var _rep = "<code class='ms-ic'>" + esc(code) + "</code>";
      h = h.replace("%%IC" + idx + "%%", function () {
        return _rep;
      });
    });
    codeBlocks.forEach(function (code, idx) {
      var _rep =
        "<pre class='ms-codeblock'><code>" +
        esc(code).replace(/\n/g, "<br>") +
        "</code></pre>";
      h = h.replace("%%CB" + idx + "%%", function () {
        return _rep;
      });
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
      var _dbRep = renderedDetailBlocks[_dbIdx2];
      h = h.replace("%%DB" + _dbIdx2 + "%%", function () {
        return _dbRep;
      });
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

