  function renderQuickPhrases(v) {
    const $p = $("#" + PANEL_ID);
    $p.find("#ms-title").text("快捷短语");
    $p.find("#ms-toolbar").html(
      buildToolbar({
        back: true,
        search: false,
        add: true,
        addId: "ms-qp-add",
      }),
    );
    let html = "";
    if (data.quickPhrases.length === 0)
      html = `<div class="ms-empty"><i class="fa-solid fa-bolt"></i>还没有快捷短语</div>`;
    else
      data.quickPhrases.forEach((qp) => {
        html += `<div class="ms-qp-item"><div class="ms-qp-header"><i class="fa-solid fa-angle-right ms-qp-arrow"></i><span class="ms-qp-title">${esc(qp.title)}</span><div style="display:flex;gap:2px;"><button class="ms-card-qbtn" data-qp-action="edit" data-qpid="${qp.id}"><i class="fa-solid fa-pen"></i></button><button class="ms-card-qbtn" data-qp-action="delete" data-qpid="${qp.id}"><i class="fa-solid fa-trash"></i></button></div></div><div class="ms-qp-body"><div>${esc(truncate(qp.content, 200))}</div>${v.returnToEdit && v.editTaId ? `<button class="ms-qp-insert" data-qpid="${qp.id}"><i class="fa-solid fa-arrow-turn-down"></i> 插入到编辑器</button>` : ""}</div></div>`;
      });
    $p.find("#ms-body").html(html);
    $p.find("#ms-footer")
      .html(`<span>${data.quickPhrases.length} 条短语</span>`)
      .show();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", ".ms-qp-header", function (e) {
      if ($(e.target).closest(".ms-card-qbtn").length) return;
      $(this).closest(".ms-qp-item").find(".ms-qp-body").toggleClass("open");
      $(this).find(".ms-qp-arrow").toggleClass("open");
    });
    $p.find("#ms-body").on("click.ms", "[data-qp-action='edit']", function (e) {
      e.stopPropagation();
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: $(this).data("qpid"),
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      });
    });
    $p.find("#ms-body").on(
      "click.ms",
      "[data-qp-action='delete']",
      function (e) {
        e.stopPropagation();
        var qpid = $(this).data("qpid");
        msConfirm("确定删除该快捷短语吗？", {
          title: "删除快捷短语",
          dangerous: true,
          okText: "删除",
        }).then(function (ok) {
          if (!ok) return;
          data.quickPhrases = data.quickPhrases.filter((q) => q.id !== qpid);
          saveData();
          renderQuickPhrases(v);
        });
      },
    );
    $p.find("#ms-body").on("click.ms", ".ms-qp-insert", function (e) {
      e.stopPropagation();
      const qp = data.quickPhrases.find((q) => q.id === $(this).data("qpid"));
      if (!qp) return;
      if (v.returnToEdit) {
        v.returnToEdit._pendingInsert = qp.content;
      }
      navigateBack();
    });
    $p.find("#ms-toolbar").on("click.ms", "#ms-qp-add", () =>
      navigateTo({
        name: "quick-phrase-edit",
        phraseId: null,
        returnToEdit: v.returnToEdit,
        editTaId: v.editTaId,
      }),
    );
  }

  function renderQuickPhraseEdit(v) {
    var qp = v.phraseId
        ? data.quickPhrases.find((q) => q.id === v.phraseId)
        : null,
      isNew = !qp;
    var $p = setupPage(
      isNew ? "新建短语" : "编辑短语",
      (isNew ? "新建" : "编辑") + "快捷短语",
    );
    $p.find("#ms-body").html(
      `<div class="ms-form"><div class="ms-field"><label>标题</label><input type="text" id="ms-qpe-title" value="${esc(qp ? qp.title : "")}"></div><div class="ms-field"><label>内容 <i class="fa-solid fa-up-right-and-down-left-from-center ms-fs-edit-btn" data-fs-target="#ms-qpe-content" data-fs-title="编辑快捷短语内容" title="全屏编辑" style="cursor:pointer;color:var(--ms-accent);opacity:0.7;font-size:11px;margin-left:4px;padding:2px 4px;border-radius:3px;"></i></label><textarea id="ms-qpe-content" style="min-height:140px;">${esc(qp ? qp.content : "")}</textarea></div><div class="ms-form-btns"><button class="ms-btn" id="ms-qpe-cancel">取消</button><button class="ms-btn primary" id="ms-qpe-save">保存</button></div></div>`,
    );
    $p.find("#ms-footer").hide();
    bindAllEvents();
    $p.find("#ms-body").on("click.ms", "#ms-qpe-cancel", navigateBack);
    $p.find("#ms-body").on("click.ms", "#ms-qpe-save", () => {
      const t = $p.find("#ms-qpe-title").val().trim(),
        c = $p.find("#ms-qpe-content").val().trim();
      if (!t && !c) {
        toast("warning", "不能都为空");
        return;
      }
      if (v.phraseId) {
        const i = data.quickPhrases.findIndex((q) => q.id === v.phraseId);
        if (i >= 0) {
          data.quickPhrases[i].title = t || "未命名";
          data.quickPhrases[i].content = c;
        }
      } else
        data.quickPhrases.push({ id: uid(), title: t || "未命名", content: c });
      saveData();
      toast("success", isNew ? "已创建" : "已保存");
      navigateBack();
    });
  }

