  function currentView() {
    return viewStack[viewStack.length - 1];
  }

  function navigateTo(view, reset) {
    if (
      currentView().name === "edit" &&
      editDirty &&
      view.name !== "quick-phrases"
    ) {
      msConfirm("编辑内容尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        editDirty = false;
        clearDraft();
        navigateTo(view, reset);
      });
      return;
    }
    if (currentView().name === "group-edit" && groupEditDirty) {
      msConfirm("分组设置尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        groupEditDirty = false;
        navigateTo(view, reset);
      });
      return;
    }
    editDirty = false;
    closeActiveDropdown();
    if (typeof _searchTimer !== "undefined" && _searchTimer) {
      clearTimeout(_searchTimer);
      _searchTimer = null;
    }
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (!reset) {
      currentView()._savedSearch = searchQuery;
      currentView()._savedFilter = JSON.parse(JSON.stringify(filterState));
      var $scrollBody = $("#" + PANEL_ID + " #ms-body");
      if ($scrollBody.length) {
        currentView()._savedScrollTop = $scrollBody.scrollTop();
      }
      var _openSeries = [];
      $("#" + PANEL_ID + " .ms-series-body.open").each(function () {
        _openSeries.push(this.id);
      });
      currentView()._expandedSeries = _openSeries;
      currentView()._filterPanelOpen = $(
        "#" + PANEL_ID + " #ms-filter-panel",
      ).hasClass("open");
    }
    if (view.name === "preview" && !view._siblingIds) {
      view._siblingIds = getVisiblePromptIds();
    }
    if (reset) {
      viewStack = [view];
      exitSelectMode();
    } else viewStack.push(view);
    searchQuery = "";
    filterState = {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      onlyCurrentChar: false,
    };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function navigateBack() {
    if (currentView().name === "edit" && editDirty) {
      msConfirm("编辑内容尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        editDirty = false;
        clearDraft();
        navigateBack();
      });
      return;
    }
    if (currentView().name === "group-edit" && groupEditDirty) {
      msConfirm("分组设置尚未保存，确定要离开吗？", {
        title: "未保存的改动",
        type: "warning",
        okText: "离开",
      }).then(function (ok) {
        if (!ok) return;
        groupEditDirty = false;
        navigateBack();
      });
      return;
    }
    editDirty = false;
    closeActiveDropdown();
    $("#" + PANEL_ID).off("keydown.ms-preview-nav");
    exitFocusMode();
    groupSelectMode = false;
    selectedGroupIds.clear();
    tagSelectMode = false;
    selectedTagIds.clear();
    if (viewStack.length > 1) {
      var leavingView = viewStack.pop();
      if (leavingView.name === "preview" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
      if (leavingView.name === "edit" && leavingView.promptId) {
        viewStack[viewStack.length - 1]._lastViewedId = leavingView.promptId;
      }
    }
    var restoredView = viewStack[viewStack.length - 1];
    searchQuery = restoredView._savedSearch || "";
    filterState = restoredView._savedFilter || {
      includeTags: [],
      excludeTags: [],
      tagSelectMode: "include",
      groupId: null,
      onlyCurrentChar: false,
    };
    shiftKeyActive = false;
    shiftAnchor = -1;
    renderView();
  }

  function countStats(text) {
    if (!text) return { chars: 0, lines: 0 };
    return { chars: text.length, lines: text.split("\n").length };
  }

