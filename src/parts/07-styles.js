function getCSS() {
  return `
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");
#${PANEL_ID}{--ms-accent:var(--SmartThemeFavColor,#c9957a);--ms-accent-rgb:201,149,122;--ms-danger:#a93226;--ms-danger-rgb:169,50,38;--ms-success:#3a8a3a;}
#${PANEL_ID}{position:fixed;z-index:9998;background-color:var(--SmartThemeBlurTintColor,#1a1a2e);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.45);display:none;flex-direction:column;color:var(--SmartThemeBodyColor,#ccc);font-family:inherit;font-size:14px;overflow:hidden;width:500px;max-width:92vw;max-height:82vh;min-width:320px;left:50%;top:60px;transform:translateX(-50%);}
#${PANEL_ID}.ms-visible{display:flex;}
#${PANEL_ID}.ms-collapsed .ms-body,#${PANEL_ID}.ms-collapsed .ms-toolbar,#${PANEL_ID}.ms-collapsed .ms-footer,#${PANEL_ID}.ms-collapsed .ms-filter-panel,#${PANEL_ID}.ms-collapsed .ms-title-note-panel{display:none!important;}
#${PANEL_ID}.ms-collapsed .ms-header{border-bottom:none;padding:1px 10px;min-height:18px;}
#${PANEL_ID}.ms-collapsed .ms-hbtn{width:18px;height:18px;font-size:10px;}
#${PANEL_ID}.ms-collapsed .ms-title-wrap{flex:1;}
.ms-header{display:flex;align-items:center;min-height:28px;padding:3px 10px;cursor:move;user-select:none;border-bottom:none;gap:6px;flex-shrink:0;touch-action:none;flex-wrap:wrap;}
.ms-header .ms-drag-handle{color:var(--SmartThemeBodyColor,#888);font-size:12px;opacity:0.4;flex-shrink:0;}
.ms-title-wrap{flex:1;min-width:0;display:flex;align-items:center;gap:4px;}
.ms-header .ms-title{font-weight:600;font-size:14px;min-width:0;max-width:60%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;}
.ms-header .ms-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;}
.ms-title-info{display:none;width:22px;height:22px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#777);cursor:pointer;border-radius:6px;padding:0;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;transition:background 0.15s,color 0.15s;}
.ms-title-info:hover,.ms-title-info.open{background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);}
.ms-title-note-inline{display:none;min-width:0;max-width:45%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;line-height:1;color:var(--SmartThemeQuoteColor,#999);opacity:0.92;}
.ms-title-note-inline.open{display:inline-block;}
.ms-title-note-panel{display:none;flex:0 0 100%;box-sizing:border-box;margin:-2px 0 0 20px;padding:0 0 3px 0;background:transparent;max-height:min(30vh,220px);overflow-y:auto;cursor:auto;}
.ms-title-note-panel.open{display:block;}
.ms-title-note-panel::-webkit-scrollbar{width:4px;}
.ms-title-note-panel::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-title-note-panel .ms-preview-content{padding:0;font-size:12px;line-height:1.65;color:var(--SmartThemeQuoteColor,#999);}
.ms-title-note-panel .ms-preview-content>*{margin-top:0!important;margin-bottom:0!important;}
.ms-hbtn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:13px;flex-shrink:0;padding:0;transition:background 0.15s;}
.ms-hbtn:hover{background:rgba(255,255,255,0.08);}
.ms-toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:none;flex-shrink:0;flex-wrap:wrap;}
.ms-search{appearance:none!important;-webkit-appearance:none!important;flex:1;min-width:100px;padding:6px 10px;background-color:var(--ms-themed-input-bg,var(--SmartThemeBlurTintColor,#222))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-radius:var(--ms-themed-input-radius,8px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:13px;font-family:inherit;outline:none;}
.ms-search:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-toolbar-actions{display:flex;gap:4px;margin-left:auto;flex-shrink:0;}
.ms-tbtn{padding:5px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;white-space:nowrap;transition:background 0.15s,color 0.15s;box-sizing:border-box;}
.ms-tbtn:hover{background:rgba(255,255,255,0.06);}
.ms-tbtn.danger{color:var(--ms-danger);border-color:rgba(var(--ms-danger-rgb),0.3);}
.ms-tbtn.danger:hover{background:rgba(var(--ms-danger-rgb),0.08);border-color:var(--ms-danger);}
.ms-tbtn.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 0;min-height:80px;}
.ms-body::-webkit-scrollbar{width:5px;}
.ms-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} textarea::-webkit-scrollbar,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar{width:5px;}
#${PANEL_ID} textarea::-webkit-scrollbar-thumb,#${PANEL_ID} #ms-edit-preview-pane::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
#${PANEL_ID} .ms-footer{padding:5px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;color:var(--SmartThemeQuoteColor,#666);flex-shrink:0;display:flex;flex-direction:row!important;align-items:center;justify-content:space-between;gap:6px;min-height:28px;flex-wrap:nowrap!important;overflow:hidden;}
#${PANEL_ID}:not(.ms-collapsed) .ms-footer[style*="block"]{display:flex!important;}
.ms-footer>span:first-child{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1;}
#${PANEL_ID} .ms-footer-btns{display:flex;gap:6px;flex-shrink:0;flex-wrap:nowrap!important;white-space:nowrap;justify-content:flex-end;}
.ms-footer-btns a{color:var(--SmartThemeQuoteColor,#777);cursor:pointer;font-size:11px;text-decoration:none;transition:color 0.15s;white-space:nowrap;}
.ms-footer-btns a:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-batch-bar{display:flex;gap:4px;width:100%;align-items:center;flex-wrap:nowrap;}
.ms-batch-bar .ms-batch-count{font-size:12px;color:var(--SmartThemeBodyColor,#ccc);white-space:nowrap;margin-right:auto;}
.ms-batch-btn{padding:4px 7px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;transition:background 0.15s;white-space:nowrap;display:inline-flex;align-items:center;gap:3px;}
.ms-batch-btn:hover{background:rgba(255,255,255,0.06);}
.ms-batch-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-batch-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-nav-item{display:flex;align-items:center;padding:10px 14px;cursor:pointer;gap:10px;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-swipe-wrap{position:relative;overflow:hidden;}
.ms-swipe-row{display:flex;transition:transform 0.25s cubic-bezier(0.25,0.8,0.25,1);will-change:transform;touch-action:pan-y;}
.ms-swipe-wrap.ms-swiping .ms-swipe-row{transition:none;}
.ms-swipe-content{flex:0 0 100%;width:100%;box-sizing:border-box;}
.ms-swipe-del{flex:0 0 80px;width:80px;border:none;background:var(--ms-danger);color:#fff;font-size:12px;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.ms-swipe-del i{font-size:15px;}
.ms-swipe-del:active{filter:brightness(0.88);}
.ms-nav-item:hover{background:rgba(255,255,255,0.04);}
.ms-nav-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;contain:layout style paint;}
.ms-nav-icon img{content-visibility:auto;}
.ms-nav-info{flex:1;min-width:0;}
.ms-nav-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-nav-note{font-size:10px;color:var(--SmartThemeQuoteColor,#555);margin-top:2px;font-style:italic;line-height:1.35;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:break-word;word-break:break-word;}
.ms-nav-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;margin-left:auto;padding-left:8px;}
.ms-nav-chevron{color:var(--SmartThemeQuoteColor,#555);font-size:11px;flex-shrink:0;}
.ms-nav-sel-badge{font-size:9px;color:var(--ms-accent);flex-shrink:0;margin-left:4px;}
.ms-card{display:flex;flex-wrap:wrap;align-items:center;padding:8px 14px;gap:6px;transition:background 0.12s;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.03);position:relative;}
.ms-card:hover{background:rgba(255,255,255,0.04);}
.ms-reorder-item.ms-just-viewed{animation:ms-flash-highlight 1.5s ease-out;}
.ms-card.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-nav-item.ms-stage-injecting{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
.ms-series-group.ms-stage-injecting>.ms-series-header{box-shadow:inset 3px 0 0 0 var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.06);}
@keyframes ms-flash-highlight{0%{background:rgba(var(--ms-accent-rgb),0.18);}100%{background:transparent;}}
.ms-card.selected{background:rgba(var(--ms-accent-rgb),0.1);}
.ms-card-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;}
.ms-card.selected .ms-card-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-card-star{flex-shrink:0;width:20px;text-align:center;cursor:pointer;}
.ms-card-star .fa-star{font-size:12px;color:var(--SmartThemeBorderColor,#3a3a3a);opacity:0.25;transition:all 0.15s;}
.ms-card-star.active .fa-star{color:var(--ms-accent);opacity:1;}
.ms-card-star:hover .fa-star{opacity:0.6;}
.ms-card-pin{flex-shrink:0;width:16px;text-align:center;font-size:10px;color:var(--ms-accent);opacity:0.7;}
.ms-card-info{flex:1;min-width:0;}
.ms-card-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-card-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
.ms-card-series{font-size:10px;color:var(--ms-accent);opacity:0.75;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;}
.ms-card-series i{font-size:9px;flex-shrink:0;}
.ms-card-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);overflow:hidden;text-overflow:ellipsis;margin-top:2px;white-space:nowrap;}
.ms-card-preview.ms-has-search{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.ms-card-quick{display:flex;gap:2px;flex-shrink:0;}
.ms-card-qbtn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#666);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10px;transition:background 0.12s,color 0.12s;padding:0;}
.ms-card-qbtn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ccc);}
.ms-card-tags-row{width:100%;display:flex;justify-content:flex-end;gap:4px;flex-wrap:wrap;padding-left:38px;margin-top:-2px;}
.ms-card-tags-row{width:100%;display:flex;justify-content:flex-end;align-items:center;gap:4px;flex-wrap:wrap;padding-left:38px;margin-top:-2px;}
.ms-card-ts{font-size:9px;color:var(--SmartThemeQuoteColor,#666);opacity:0.7;display:inline-flex;align-items:center;gap:2px;margin-left:auto;white-space:nowrap;}
.ms-card-ts i{font-size:8px;}
.ms-tag-chip{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;line-height:1.4;color:#fff;white-space:nowrap;}
.ms-tag-chip-sm{font-size:8px;padding:0 4px;}
.ms-empty{text-align:center;padding:40px 20px;color:var(--SmartThemeQuoteColor,#555);font-size:13px;}
.ms-empty i{font-size:32px;opacity:0.25;display:block;margin-bottom:12px;}
.ms-cg-avatar{box-shadow:0 1px 3px rgba(0,0,0,0.2);}
.ms-cg-avatar img{display:block;}
#ms-birthday-banner button.ms-tbtn{background:rgba(255,255,255,0.04);}
#ms-birthday-banner button.ms-tbtn:hover{background:rgba(var(--ms-accent-rgb),0.15);}
@keyframes ms-bd-slidein{0%{transform:translateY(-100%) scale(0.95);opacity:0;}50%{transform:translateY(6px) scale(1.02);opacity:1;}75%{transform:translateY(-3px) scale(1);}100%{transform:translateY(0) scale(1);opacity:1;}}
@keyframes ms-bd-cake-dance{0%,100%{transform:rotate(0deg) scale(1);}20%{transform:rotate(-15deg) scale(1.1);}40%{transform:rotate(0deg) scale(1);}60%{transform:rotate(15deg) scale(1.1);}80%{transform:rotate(0deg) scale(1);}}
@keyframes ms-bd-avatar-pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,136,170,0.6),0 0 12px rgba(232,136,170,0.3);}50%{box-shadow:0 0 0 6px rgba(232,136,170,0),0 0 20px rgba(232,136,170,0.5);}}
@keyframes ms-bd-confetti-fall{0%{transform:translateY(-30px) translateX(0) rotate(0deg) scale(0.8);opacity:0;}8%{opacity:1;transform:translateY(0) translateX(calc(var(--swayX,0px) * 0.2)) rotate(40deg) scale(1);}25%{transform:translateY(50px) translateX(calc(var(--swayX,0px) * 0.5)) rotate(180deg) scale(1);}50%{transform:translateY(110px) translateX(var(--swayX,0px)) rotate(360deg) scale(1);}75%{transform:translateY(170px) translateX(calc(var(--swayX,0px) * 0.5)) rotate(540deg) scale(0.95);}92%{opacity:1;}100%{transform:translateY(220px) translateX(0) rotate(720deg) scale(0.7);opacity:0;}}
@keyframes ms-bd-bg-flow{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
@keyframes ms-bd-text-shimmer{0%{background-position:0% 50%;}100%{background-position:200% 50%;}}
.ms-bd-banner{position:relative;padding:12px 14px;background:linear-gradient(135deg,rgba(232,136,170,0.18),rgba(var(--ms-accent-rgb),0.12),rgba(255,200,150,0.15),rgba(232,136,170,0.18));background-size:300% 300%;border-bottom:1px solid rgba(232,136,170,0.35);display:flex;align-items:center;gap:10px;font-size:12px;animation:ms-bd-slidein 0.8s cubic-bezier(0.34,1.56,0.64,1),ms-bd-bg-flow 6s ease-in-out infinite;z-index:2;}
.ms-bd-confetti{position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;overflow:visible;z-index:0;}
.ms-bd-confetti-piece{position:absolute;top:0;animation:ms-bd-confetti-fall 3.5s ease-in-out infinite;pointer-events:none;filter:drop-shadow(0 0 3px currentColor);will-change:transform,opacity;}
.ms-bd-avatars{display:flex;align-items:center;flex-shrink:0;position:relative;z-index:1;}
.ms-bd-avatar-wrap{width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #e88aaa;background:rgba(232,136,170,0.15);margin-left:-8px;position:relative;animation:ms-bd-avatar-pulse 1.8s ease-in-out infinite;}
.ms-bd-avatar-wrap:first-child{margin-left:0;}
.ms-bd-avatar-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.ms-bd-avatar-fallback{display:flex;align-items:center;justify-content:center;color:#e88aaa;font-size:14px;}
.ms-bd-avatar-more{width:28px;height:28px;border-radius:50%;background:rgba(232,136,170,0.25);color:#e88aaa;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;margin-left:-6px;border:2px solid rgba(232,136,170,0.4);position:relative;z-index:0;flex-shrink:0;}
.ms-bd-cake{color:#e88aaa;font-size:18px;flex-shrink:0;display:inline-block;animation:ms-bd-cake-dance 1.6s ease-in-out infinite;transform-origin:bottom center;position:relative;z-index:1;}
.ms-bd-text{flex:1;position:relative;z-index:1;line-height:1.5;min-width:0;}
.ms-bd-text strong{background:linear-gradient(90deg,#e88aaa,var(--ms-accent),#ffb088,#e88aaa);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-weight:700;animation:ms-bd-text-shimmer 3s linear infinite;}
.ms-section-label{padding:14px 14px 6px 0;font-size:13px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);letter-spacing:0.02em;text-transform:none;display:flex;align-items:center;gap:8px;}
.ms-section-label::before{content:"";display:inline-block;width:3px;height:14px;background:var(--ms-accent);border-radius:2px;flex-shrink:0;}
.ms-divider{height:1px;background:var(--SmartThemeBorderColor,#333);margin:6px 14px;}
.ms-hl{background:rgba(var(--ms-accent-rgb),0.3);color:inherit;padding:0 1px;border-radius:2px;}
.ms-preview-content{padding:14px;line-height:1.7;font-size:13px;color:var(--SmartThemeBodyColor,#ccc);overflow-wrap:break-word;word-break:break-word;}
.ms-preview-content>:first-child{margin-top:0!important;}
.ms-preview-content h1{font-size:1.5em;font-weight:700;margin:0.7em 0 0.3em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h2{font-size:1.35em;font-weight:700;margin:0.6em 0 0.25em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h3{font-size:1.2em;font-weight:600;margin:0.5em 0 0.2em;color:var(--SmartThemeBodyColor,#eee);line-height:1.3;}
.ms-preview-content h4{font-size:1.08em;font-weight:600;margin:0.4em 0 0.15em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h5{font-size:0.95em;font-weight:600;margin:0.3em 0 0.1em;color:var(--SmartThemeBodyColor,#ddd);line-height:1.3;}
.ms-preview-content h6{font-size:0.85em;font-weight:600;margin:0.25em 0 0.1em;color:var(--SmartThemeQuoteColor,#bbb);line-height:1.3;}
.ms-preview-content strong{color:var(--SmartThemeEmColor,var(--ms-accent));font-weight:700;}
.ms-preview-content em{color:var(--SmartThemeEmColor,var(--ms-accent));font-style:italic;}
.ms-preview-content u{text-decoration-color:var(--SmartThemeUnderlineColor,var(--ms-accent));}
.ms-preview-content del{opacity:0.5;}
.ms-preview-content .ms-quote-text{color:var(--SmartThemeQuoteColor,#999);}
.ms-md-link{color:var(--ms-accent);text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer;}
.ms-md-link:hover{opacity:0.8;}
.ms-md-img{max-width:100%;border-radius:6px;margin:4px 0;display:block;}
.ms-md-hr{border:none;border-top:1px solid var(--SmartThemeBorderColor,#444);margin:10px 0;}
.ms-md-table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px;}
.ms-md-table th,.ms-md-table td{border:1px solid var(--SmartThemeBorderColor,#444);padding:6px 10px;text-align:left;}
.ms-md-table th{background:rgba(255,255,255,0.04);font-weight:600;color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-table td{color:var(--SmartThemeBodyColor,#ccc);}
.ms-task{list-style:none;margin-left:0!important;display:flex;align-items:flex-start;gap:6px;padding:2px 0;}
.ms-task input[type="checkbox"]{margin-top:3px;flex-shrink:0;cursor:pointer;}
.ms-task-done{opacity:0.55;}
.ms-task-done>span,.ms-task-done>strong,.ms-task-done>em{text-decoration:line-through;}
.ms-preview-content blockquote{border-left:3px solid var(--SmartThemeQuoteColor,var(--ms-accent));background:var(--SmartThemeBlurTintColor,rgba(var(--ms-accent-rgb),0.05));padding:5px 10px;margin:0.3em 0;color:var(--SmartThemeQuoteColor,#999);font-style:italic;border-radius:0 4px 4px 0;}
.ms-preview-content li{margin-left:18px;margin-bottom:0;padding:0;line-height:1.6;}
.ms-preview-content code.ms-ic{background:var(--SmartThemeBlurTintColor,rgba(128,128,128,0.2));color:var(--SmartThemeEmColor,var(--ms-accent));border:1px solid var(--SmartThemeBorderColor,rgba(128,128,128,0.3));padding:1px 5px;border-radius:3px;font-size:12px;word-break:break-all;}
.ms-preview-content pre.ms-codeblock{background:var(--SmartThemeBlurTintColor,rgba(0,0,0,0.3));border:1px solid var(--SmartThemeBorderColor,#444);box-shadow:inset 0 0 10px var(--SmartThemeShadowColor,transparent);border-radius:6px;padding:10px 12px;margin:6px 0;overflow-x:auto;font-size:12px;line-height:1.5;}
.ms-preview-content pre.ms-codeblock code{color:var(--SmartThemeBodyColor,#ccc);font-family:Consolas,"Courier New",monospace;white-space:pre-wrap;word-break:break-word;background:none;border:none;padding:0;border-radius:0;font-size:12px;}
.ms-details{margin:4px 0;}
.ms-summary{padding:2px 0px;cursor:pointer;font-weight:600;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);transition:background 0.15s;user-select:none;}
.ms-summary::marker{color:var(--ms-accent);}
.ms-summary::-webkit-details-marker{color:var(--ms-accent);}
.ms-summary:hover{opacity:0.8;}
.ms-details-body{padding:2px 0 2px 16px;line-height:1.7;}
.ms-details-body>:first-child{margin-top:0!important;}
.ms-pv-meta{flex:1;display:flex;flex-wrap:wrap;gap:4px;align-items:center;min-width:0;}
.ms-pv-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;color:var(--SmartThemeQuoteColor,#999);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);white-space:nowrap;}
.ms-pv-chip i{font-size:9px;flex-shrink:0;}
.ms-preview-actions{display:flex;gap:4px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-pa{padding:5px 12px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s;display:flex;align-items:center;gap:5px;}
.ms-pa:hover{background:rgba(255,255,255,0.06);}
.ms-pa.starred{color:var(--ms-accent);}
.ms-pa.danger:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-preview-send{display:flex;gap:4px;padding:8px 10px;border-top:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;}
.ms-send-btn{flex:1;padding:8px 4px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.03);color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;text-align:center;transition:background 0.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
.ms-send-btn:hover{background:rgba(255,255,255,0.08);}
.ms-send-btn i{margin-right:3px;}
.ms-form{padding:12px 14px;display:flex;flex-direction:column;gap:10px;}
.ms-form-edit{padding:10px 14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;flex:1;}
.ms-form-edit::-webkit-scrollbar{width:5px;}
.ms-form-edit::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-form-title{font-size:14px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-form-row{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.ms-field{display:flex;flex-direction:column;gap:3px;}
.ms-field label{font-size:12px;color:var(--SmartThemeQuoteColor,#888);font-weight:500;}
.ms-field input,.ms-field select,.ms-field textarea{appearance:none!important;-webkit-appearance:none!important;padding:7px 10px;background-color:var(--ms-themed-input-bg,var(--SmartThemeBlurTintColor,#222))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-radius:var(--ms-themed-input-radius,8px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:13px;font-family:inherit;outline:none;width:100%;box-sizing:border-box;}
.ms-field input,.ms-field select{height:33px;}
.ms-field input:focus,.ms-field select:focus,.ms-field textarea:focus{border-color:var(--SmartThemeQuoteColor,#777);}
.ms-field textarea{min-height:180px;max-height:60vh;resize:vertical;line-height:1.6;border-radius:0 0 8px 8px;overflow-y:auto;width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;}
.ms-content-field{position:relative!important;}
.ms-edit-scroll-top{position:absolute;bottom:48px;right:14px;width:28px;height:28px;border-radius:50%;background:transparent;border:none;color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:10;opacity:0.4;transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-edit-scroll-top:hover{background:rgba(var(--ms-accent-rgb,201,149,122),0.15);opacity:1;}
.ms-edit-scroll-top.visible{display:flex;}
.ms-edit-scroll-bottom{position:absolute;bottom:10px;right:14px;width:28px;height:28px;border-radius:50%;background:transparent;border:none;color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:10;opacity:0.4;transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-edit-scroll-bottom:hover{background:rgba(var(--ms-accent-rgb,201,149,122),0.15);opacity:1;}
.ms-edit-scroll-bottom.visible{display:flex;}
.ms-md-toolbar{display:flex;gap:2px;padding:2px 3px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;border-radius:8px 8px 0 0;flex-wrap:wrap;flex-shrink:0;}
.ms-md-btn{width:24px;height:24px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;border-radius:4px;font-size:12px;display:flex;align-items:center;justify-content:center;transition:background 0.12s,color 0.12s;}
.ms-md-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-md-btn.active{background:rgba(var(--ms-accent-rgb),0.2);color:var(--ms-accent);}
.ms-md-sep{width:1px;height:18px;background:var(--SmartThemeBorderColor,#444);margin:0 2px;flex-shrink:0;}
.ms-char-count{font-size:11px;color:var(--SmartThemeQuoteColor,#666);text-align:right;padding:2px 4px;flex-shrink:0;}
.ms-form-btns{display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;}
.ms-btn{padding:8px 20px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#ccc);border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;transition:background 0.15s;}
.ms-btn:hover{background:rgba(255,255,255,0.06);}
.ms-btn.primary{background:var(--SmartThemeQuoteColor,#555);color:var(--SmartThemeBodyColor,#eee);border-color:var(--SmartThemeQuoteColor,#555);}
.ms-btn.primary:hover{filter:brightness(1.15);}
.ms-btn.danger{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-btn.danger:hover{background:rgba(var(--ms-danger-rgb),0.12);}
.ms-tag-row{display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex-shrink:0;max-height:80px;overflow-y:auto;}
.ms-tag-toggle{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px solid var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#888);background:transparent;transition:all 0.15s;user-select:none;}
.ms-tag-toggle:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-tag-toggle.active{color:#fff;border-color:transparent;}
.ms-tag-toggle.ms-tag-excluded{border-style:dashed;border-color:var(--ms-danger);color:var(--ms-danger);text-decoration:line-through;background:rgba(var(--ms-danger-rgb),0.05);}
.ms-filter-mode-btn.ms-mode-exclude-active{background:rgba(var(--ms-danger-rgb),0.15);color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-tag-toggle .ms-tag-x{margin-left:2px;font-size:9px;opacity:0.6;}
.ms-add-tag-btn{padding:3px 8px;border-radius:12px;font-size:11px;cursor:pointer;border:1px dashed var(--SmartThemeBorderColor,#444);color:var(--SmartThemeQuoteColor,#666);background:transparent;}
.ms-add-tag-btn:hover{border-color:var(--SmartThemeQuoteColor,#888);color:var(--SmartThemeBodyColor,#aaa);}
.ms-filter-panel{padding:8px 12px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);display:none;flex-direction:column;gap:6px;flex-shrink:0;max-height:30vh;overflow-y:auto;}
.ms-filter-panel.open{display:flex;}
.ms-filter-section{font-size:10px;color:var(--SmartThemeQuoteColor,#666);font-weight:600;text-transform:uppercase;margin-top:2px;}
.ms-gitem{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.03);}
.ms-gitem-color{width:16px;height:16px;border-radius:50%;flex-shrink:0;cursor:pointer;border:2px solid transparent;}
.ms-gitem-color:hover{border-color:rgba(255,255,255,0.3);}
.ms-gitem-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-gitem-cnt{font-size:11px;color:var(--SmartThemeQuoteColor,#666);}
.ms-gitem-btn{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-gitem-btn:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-gitem-btn.danger:hover{color:var(--ms-danger);}
.ms-gitem.ms-gitem-selected{background:rgba(var(--ms-accent-rgb),0.10);}
.ms-gitem-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-gitem.ms-gitem-selected .ms-gitem-check{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-color-picker{display:flex;gap:5px;flex-wrap:wrap;padding:8px 14px;}
.ms-color-opt{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;}
.ms-color-opt:hover{border-color:rgba(255,255,255,0.4);}
.ms-color-opt.selected{border-color:#fff;}
.ms-color-custom{background:conic-gradient(from 45deg,hsl(0,55%,68%),hsl(45,55%,68%),hsl(90,55%,68%),hsl(150,55%,68%),hsl(210,55%,68%),hsl(270,55%,68%),hsl(330,55%,68%),hsl(360,55%,68%))!important;position:relative;overflow:hidden;box-shadow:inset 0 0 2px rgba(0,0,0,0.3);}
.ms-color-custom input[type="color"]{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;margin:0;}
.ms-color-custom::after{content:"+";color:#fff;font-size:13px;font-weight:bold;text-shadow:0 0 3px rgba(0,0,0,0.7);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;line-height:1;}
.ms-color-custom.selected::after{content:"✓";}
.ms-color-inline{display:flex;gap:5px;flex-wrap:wrap;padding:6px 14px 6px 50px;border-bottom:1px solid rgba(255,255,255,0.03);background:rgba(255,255,255,0.02);}
.ms-check-item{display:flex;align-items:center;gap:8px;padding:2px 14px;cursor:pointer;transition:background 0.12s;font-size:13px;}
.ms-check-item:hover{background:rgba(255,255,255,0.03);}
.ms-export-opts-tight{display:flex;flex-direction:column;gap:2px;}
.ms-import-opt{padding:12px 14px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;transition:background 0.15s,border-color 0.15s;margin-bottom:6px;}
.ms-import-opt:hover{background:rgba(255,255,255,0.04);border-color:var(--SmartThemeQuoteColor,#666);}
.ms-import-opt-title{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);}
.ms-import-opt-desc{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;}
.ms-dropdown{position:absolute;background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a));border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:5002;min-width:140px;padding:4px 0;display:none;max-height:60vh;overflow-y:auto;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.ms-dropdown::-webkit-scrollbar{width:4px;}
.ms-dropdown::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-dropdown-item{padding:7px 14px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:background 0.12s;white-space:nowrap;}
.ms-dropdown-item:hover{background:rgba(255,255,255,0.06);}
.ms-dropdown-item.active{color:var(--ms-accent);}
.ms-batch-tag-item{display:flex;align-items:center;gap:8px;padding:6px 12px;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-batch-tag-item:last-child{border-bottom:none;}
.ms-batch-tag-info{flex:1;display:flex;align-items:center;gap:6px;min-width:0;}
.ms-batch-tag-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);white-space:nowrap;}
.ms-batch-tag-btn{width:24px;height:24px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px;transition:background 0.12s;flex-shrink:0;}
.ms-batch-tag-btn:hover{background:rgba(255,255,255,0.08);}
.ms-batch-tag-btn.add-btn:hover{color:var(--ms-success);border-color:var(--ms-success);}
.ms-batch-tag-btn.rm-btn:hover{color:var(--ms-danger);border-color:var(--ms-danger);}
.ms-qp-item{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-qp-header{display:flex;align-items:center;padding:8px 14px;cursor:pointer;gap:8px;transition:background 0.12s;}
.ms-qp-header:hover{background:rgba(255,255,255,0.03);}
.ms-qp-header i.ms-qp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-qp-header i.ms-qp-arrow.open{transform:rotate(90deg);}
.ms-qp-header .ms-qp-title{flex:1;font-size:13px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-body{display:none;padding:6px 14px 10px 36px;font-size:12px;color:var(--SmartThemeQuoteColor,#999);line-height:1.5;overflow-wrap:break-word;word-break:break-word;}
.ms-qp-body.open{display:block;}
.ms-qp-insert{margin-top:6px;padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#aaa);border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;}
.ms-qp-insert:hover{background:rgba(255,255,255,0.06);}
.ms-qp-popup{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#444);border-top:none;align-items:center;flex-shrink:0;max-height:120px;overflow-y:auto;}
.ms-qp-popup::-webkit-scrollbar{width:4px;}
.ms-qp-popup::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
@media(max-width:768px){.ms-qp-chip{padding:3px 8px;font-size:11px;max-width:140px;}}
.ms-qp-chip{padding:4px 10px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(255,255,255,0.04);color:var(--SmartThemeBodyColor,#ccc);border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;transition:background 0.15s,border-color 0.15s,color 0.15s;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;}
.ms-qp-chip:hover{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-qp-chip:active{transform:scale(0.95);}
.ms-qp-popup-manage{font-size:11px;color:var(--SmartThemeQuoteColor,#777);cursor:pointer;margin-left:auto;white-space:nowrap;text-decoration:none;transition:color 0.15s;}
.ms-qp-popup-manage:hover{color:var(--SmartThemeBodyColor,#ccc);}
.ms-imp-preview{padding:8px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:8px;margin:6px 0;}
.ms-imp-preview-title{font-size:12px;font-weight:600;color:var(--SmartThemeBodyColor,#ccc);margin-bottom:6px;}
.ms-imp-preview-list{font-size:11px;color:var(--SmartThemeQuoteColor,#999);line-height:1.6;}
.ms-imp-preview-list span{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;color:#fff;margin:1px 2px;}
.ms-exp-group-toggle{display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-exp-group-toggle:hover{background:rgba(255,255,255,0.03);}
.ms-exp-group-toggle i.ms-exp-arrow{font-size:10px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:14px;flex-shrink:0;}
.ms-exp-group-toggle i.ms-exp-arrow.open{transform:rotate(90deg);}
.ms-exp-group-body{display:none;padding:4px 14px 8px 40px;font-size:11px;color:var(--SmartThemeQuoteColor,#888);line-height:1.6;max-height:150px;overflow-y:auto;}
.ms-exp-group-body.open{display:block;}
.ms-exp-group-body::-webkit-scrollbar{width:4px;}
.ms-exp-group-body::-webkit-scrollbar-thumb{background:var(--SmartThemeBorderColor,#444);border-radius:4px;}
.ms-exp-prompt-item{padding:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-reorder-item{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.12s;}
.ms-reorder-item:hover{background:rgba(255,255,255,0.03);}
.ms-reorder-item.ms-drag-over{box-shadow:inset 0 2px 0 0 var(--ms-accent);}
.ms-reorder-section-header.ms-drag-over{box-shadow:inset 0 0 0 2px var(--ms-accent);background:rgba(var(--ms-accent-rgb),0.12)!important;}
.ms-char-section-grip:active{cursor:grabbing!important;}
.ms-reorder-grip{cursor:grab;color:var(--SmartThemeQuoteColor,#555);font-size:12px;flex-shrink:0;padding:4px;touch-action:none;}
.ms-reorder-grip:active{cursor:grabbing;}
.ms-reorder-name{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-reorder-arrows{display:flex;gap:2px;flex-shrink:0;}
.ms-reorder-arrows button{width:26px;height:26px;border:none;background:transparent;color:var(--SmartThemeQuoteColor,#888);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:11px;transition:background 0.15s;}
.ms-reorder-arrows button:hover{background:rgba(255,255,255,0.08);color:var(--SmartThemeBodyColor,#ddd);}
.ms-history-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.12s;}
.ms-history-item:hover{background:rgba(255,255,255,0.04);}
.ms-history-info{flex:1;min-width:0;}
.ms-history-title{font-size:12px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-history-date{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;}
.ms-history-preview{font-size:11px;color:var(--SmartThemeQuoteColor,#777);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.ms-history-actions{display:flex;gap:2px;flex-shrink:0;}
.ms-diff-header{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-wrap:wrap;}
.ms-diff-label{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
.ms-diff-label.old{background:rgba(238,85,85,0.10);color:#e88;}
.ms-diff-label.new{background:rgba(92,184,92,0.10);color:#7dce7d;}
.ms-diff-meta{padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:12px;color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-del-text{color:#e88;text-decoration:line-through;}
.ms-diff-add-text{color:#7dce7d;}
.ms-diff-stats{display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);font-size:11px;flex-wrap:wrap;}
.ms-diff-stat-add{color:#7dce7d;}
.ms-diff-stat-del{color:#e88;}
.ms-diff-stat-same{color:var(--SmartThemeQuoteColor,#888);}
.ms-diff-toggle{padding:2px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeQuoteColor,#888);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;margin-left:auto;transition:background 0.15s,color 0.15s;}
.ms-diff-toggle:hover{background:rgba(255,255,255,0.06);color:var(--SmartThemeBodyColor,#ccc);}
.ms-diff-toggle.active{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);border-color:var(--ms-accent);}
.ms-diff-body{padding:0;font-size:12px;line-height:1.7;}
.ms-diff-line{display:flex;padding:1px 14px;min-height:22px;align-items:flex-start;transition:background 0.1s;}
.ms-diff-line.add{background:rgba(92,184,92,0.06);}
.ms-diff-line.del{background:rgba(238,85,85,0.06);}
.ms-diff-line.add:hover{background:rgba(92,184,92,0.12);}
.ms-diff-line.del:hover{background:rgba(238,85,85,0.12);}
.ms-diff-sign{width:20px;flex-shrink:0;text-align:center;font-weight:700;font-size:13px;line-height:1.7;user-select:none;}
.ms-diff-line.add .ms-diff-sign{color:#7dce7d;}
.ms-diff-line.del .ms-diff-sign{color:#e88;}
.ms-diff-line.same .ms-diff-sign{color:transparent;}
.ms-diff-text{flex:1;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;}
.ms-diff-line.add .ms-diff-text{color:#7dce7d;}
.ms-diff-line.del .ms-diff-text{color:#e88;text-decoration:line-through;opacity:0.8;}
.ms-diff-line.same .ms-diff-text{color:var(--SmartThemeBodyColor,#ccc);opacity:0.45;}
.ms-diff-body.ms-diff-changes-only .ms-diff-line.same{display:none;}
#${PANEL_ID} input[type="checkbox"]{-webkit-appearance:none;appearance:none;width:16px;height:16px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;background:transparent;cursor:pointer;position:relative;flex-shrink:0;transition:all 0.15s;vertical-align:middle;}
#${PANEL_ID} input[type="checkbox"]:checked{background:var(--ms-accent);border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]::before{content:none!important;}
#${PANEL_ID} input[type="checkbox"]::after{content:none!important;}
#${PANEL_ID} input[type="checkbox"]:checked::after{content:"\\2713"!important;position:absolute!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;color:#fff!important;font-size:10px!important;font-weight:bold!important;line-height:1!important;}#${PANEL_ID} input[type="checkbox"]:hover{border-color:var(--ms-accent);}
#${PANEL_ID} input[type="checkbox"]:disabled{opacity:0.4;cursor:default;}
#${PANEL_ID} input[type="checkbox"]:disabled:hover{border-color:var(--SmartThemeBorderColor,#555);}
#${PANEL_ID}.ms-drag-hover::before{content:"";position:absolute;inset:0;background:rgba(var(--ms-accent-rgb),0.08);border:2px dashed var(--ms-accent);border-radius:10px;z-index:5010;pointer-events:none;}
#${PANEL_ID}.ms-drag-hover::after{content:"\\f56f";font-family:"Font Awesome 6 Free";font-weight:900;position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);color:var(--ms-accent);font-size:32px;z-index:5011;pointer-events:none;opacity:0.7;}
.ms-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;}
.ms-stats-card{background:rgba(255,255,255,0.03);border:1px solid var(--SmartThemeBorderColor,#333);border-radius:10px;padding:14px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;overflow:hidden;}
.ms-stats-card .ms-stat-value{font-size:24px;font-weight:700;color:var(--SmartThemeBodyColor,#eee);line-height:1;}
.ms-stats-card .ms-stat-label{font-size:10px;color:var(--SmartThemeQuoteColor,#888);text-transform:uppercase;letter-spacing:0.05em;}
.ms-stats-card .ms-stat-icon{font-size:16px;margin-bottom:2px;opacity:0.5;}
.ms-stats-section{padding:14px 14px 6px 0;font-size:13px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);letter-spacing:0.02em;text-transform:none;display:flex;align-items:center;gap:8px;}
.ms-stats-section::before{content:"";display:inline-block;width:3px;height:14px;background:var(--ms-accent);border-radius:2px;flex-shrink:0;}
.ms-stats-rank{padding:0 14px;}
.ms-stats-rank-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-stats-rank-item:last-child{border-bottom:none;}
.ms-stats-rank-pos{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.ms-stats-rank-pos.gold{background:rgba(255,215,0,0.15);color:#ffd700;}
.ms-stats-rank-pos.silver{background:rgba(192,192,192,0.12);color:#c0c0c0;}
.ms-stats-rank-pos.bronze{background:rgba(205,127,50,0.12);color:#cd7f32;}
.ms-stats-rank-pos.normal{background:rgba(255,255,255,0.05);color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-rank-info{flex:1;min-width:0;}
.ms-stats-rank-name{font-size:12px;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-stats-rank-meta{font-size:10px;color:var(--SmartThemeQuoteColor,#777);margin-top:1px;}
.ms-stats-rank-bar-wrap{width:60px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;flex-shrink:0;}
.ms-stats-rank-bar{height:100%;border-radius:3px;background:var(--ms-accent);transition:width 0.4s ease;}
.ms-stats-rank-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);flex-shrink:0;min-width:28px;text-align:right;}
.ms-stats-group-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 14px 4px;}
.ms-stats-group-seg{height:100%;transition:width 0.4s ease;min-width:2px;}
.ms-stats-group-legend{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 10px;font-size:10px;color:var(--SmartThemeQuoteColor,#888);}
.ms-stats-group-legend-item{display:flex;align-items:center;gap:4px;}
.ms-stats-group-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.ms-stats-empty{text-align:center;padding:20px 14px;color:var(--SmartThemeQuoteColor,#555);font-size:12px;font-style:italic;}
.ms-series-group{border-bottom:1px solid rgba(255,255,255,0.05);}
.ms-series-check{width:18px;height:18px;border:2px solid var(--SmartThemeBorderColor,#555);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:transparent;transition:all 0.15s;cursor:pointer;}
.ms-series-check.ms-sc-all{background:var(--ms-accent);border-color:var(--ms-accent);color:#fff;}
.ms-series-check.ms-sc-some{border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-series-header{display:flex;align-items:center;padding:6px 14px 6px 10px;cursor:pointer;gap:6px;transition:background 0.12s;}
.ms-series-header:hover{background:rgba(255,255,255,0.03);}
.ms-series-arrow{font-size:9px;color:var(--SmartThemeQuoteColor,#666);transition:transform 0.2s;width:10px;flex-shrink:0;}
.ms-series-arrow.open{transform:rotate(90deg);}
.ms-series-title{flex:1;font-size:12px;color:var(--SmartThemeBodyColor,#ddd);font-weight:500;}
.ms-series-cnt{font-size:10px;color:var(--SmartThemeQuoteColor,#777);flex-shrink:0;}
.ms-series-body{display:none;border-left:2px solid rgba(var(--ms-accent-rgb),0.2);margin-left:14px;}
.ms-series-body.open{display:block;}
.ms-find-bar{display:flex;align-items:center;gap:4px;padding:4px 6px;background:var(--SmartThemeBlurTintColor,#222);border:1px solid var(--SmartThemeBorderColor,#444);border-bottom:none;flex-shrink:0;flex-wrap:wrap;}
.ms-find-input{appearance:none!important;-webkit-appearance:none!important;flex:1;padding:4px 8px;background-color:var(--ms-themed-input-bg,rgba(255,255,255,0.05))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-radius:var(--ms-themed-input-radius,4px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:12px;font-family:inherit;outline:none;min-width:60px;}
.ms-find-input:focus{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-find-count{font-size:11px;color:var(--SmartThemeQuoteColor,#888);white-space:nowrap;min-width:32px;text-align:center;flex-shrink:0;}
.ms-find-count.no-match{color:var(--ms-danger);}
#${PANEL_ID}.ms-fs-editor-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;right:auto!important;bottom:auto!important;transform:translateX(-50%)!important;zoom:1!important;}
.ms-fs-editor-overlay{position:absolute;inset:0;background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#1a1a2e));z-index:5005;display:flex;flex-direction:column;padding:8px 10px;gap:6px;background-image:var(--ms-panel-bg-image,none)!important;background-size:var(--ms-panel-bg-size,cover)!important;background-position:var(--ms-panel-bg-position,center)!important;background-repeat:var(--ms-panel-bg-repeat,no-repeat)!important;background-attachment:var(--ms-panel-bg-attachment,fixed)!important;}
.ms-fs-editor-overlay .ms-fs-header-bar{display:flex;align-items:center;gap:8px;padding:2px 4px 6px;border-bottom:1px solid var(--SmartThemeBorderColor,#333);flex-shrink:0;}
.ms-fs-editor-overlay .ms-fs-title-text{font-size:13px;font-weight:600;flex:1;color:var(--SmartThemeBodyColor,#ddd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ms-fs-editor-overlay .ms-md-toolbar{flex-shrink:0;}
.ms-fs-editor-overlay .ms-fs-content-wrap{flex:1;display:flex;flex-direction:column;min-height:0;position:relative;}
.ms-fs-editor-overlay .ms-fs-textarea{appearance:none!important;-webkit-appearance:none!important;flex:1;min-height:0;resize:none;padding:10px 12px;background-color:var(--ms-themed-input-bg,var(--SmartThemeBlurTintColor,#222))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-top:none!important;border-radius:var(--ms-themed-input-radius,0 0 8px 8px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:13px;font-family:Consolas,"Courier New",monospace;line-height:1.6;outline:none;width:100%;box-sizing:border-box;}
.ms-fs-editor-overlay .ms-fs-preview-pane{flex:1;overflow-y:auto;min-height:0;border:1px solid var(--SmartThemeBorderColor,#444);border-top:none;border-radius:0 0 8px 8px;padding:14px;}
.ms-fs-editor-overlay .ms-fs-footer-bar{display:flex;align-items:center;gap:8px;padding:4px 0;flex-shrink:0;}
.ms-fs-editor-overlay .ms-fs-footer-bar .ms-char-count{flex:1;text-align:left;padding:0;}
.ms-fs-editor-overlay .ms-fs-qp-popup{margin-bottom:0;border-radius:8px;border-top:1px solid var(--SmartThemeBorderColor,#444);}
@media(max-width:768px){#${PANEL_ID}.ms-fs-editor-mode{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;top:0!important;left:0!important;transform:none!important;border-radius:0!important;}}
#${PANEL_ID}.ms-bd-editor-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;right:auto!important;bottom:auto!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-modal-expand-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-focus-mode,#${PANEL_ID}.ms-bd-editor-mode,#${PANEL_ID}.ms-modal-expand-mode{zoom:1!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal{width:680px!important;max-width:94vw!important;max-height:84vh!important;display:flex!important;flex-direction:column!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-textarea{min-height:200px!important;height:30vh!important;max-height:45vh!important;resize:vertical!important;overflow-y:auto!important;scrollbar-width:none;-ms-overflow-style:none;}
#${PANEL_ID}.ms-bd-editor-mode .ms-modal-textarea::-webkit-scrollbar{width:0;display:none;}
#${PANEL_ID}.ms-focus-mode{width:96vw!important;max-width:96vw!important;height:90vh!important;max-height:90vh!important;left:50%!important;top:5vh!important;transform:translateX(-50%)!important;}
#${PANEL_ID}.ms-focus-mode .ms-header .ms-count{display:none;}
#${PANEL_ID}.ms-focus-mode .ms-body{overflow:hidden!important;padding:0!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit{padding:6px 10px!important;flex:1!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;min-height:0!important;gap:6px!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-field:not(.ms-content-field){display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit>.ms-form-row{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field{flex:1!important;display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important;}
#${PANEL_ID}.ms-focus-mode .ms-content-field>label{display:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit textarea{flex:1!important;min-height:0!important;max-height:none!important;resize:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-edit-preview-pane{flex:1!important;min-height:0!important;max-height:none!important;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-char-count{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode .ms-form-edit .ms-form-btns{flex-shrink:0;}
#${PANEL_ID}.ms-focus-mode #ms-footer{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-filter-panel{display:none!important;}
#${PANEL_ID}.ms-focus-mode #ms-toolbar .ms-form-title{display:none;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode{width:440px!important;max-width:92vw!important;height:auto!important;max-height:none!important;}
#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-body,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-toolbar,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-footer,#${PANEL_ID}.ms-collapsed.ms-focus-mode .ms-filter-panel{display:none!important;}
.ms-scroll-top{position:absolute;bottom:82px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);color: var(--ms-accent, var(--SmartThemeBodyColor, #aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-scroll-top:hover{background:rgba(255,255,255,0.1);}
.ms-scroll-top.visible{display:flex;}
.ms-scroll-bottom{position:absolute;bottom:44px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--SmartThemeBlurTintColor,#2a2a3a);border:1px solid var(--SmartThemeBorderColor,#444);color:var(--ms-accent,var(--SmartThemeBodyColor,#aaa));cursor:pointer;display:none;align-items:center;justify-content:center;font-size:14px;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:opacity 0.2s,background 0.15s;-webkit-tap-highlight-color:transparent;}
.ms-scroll-bottom:hover{background:rgba(255,255,255,0.1);}
.ms-scroll-bottom.visible{display:flex;}
.ms-sub-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--ms-accent);margin-left:3px;vertical-align:middle;animation:ms-sub-pulse 2s ease-in-out infinite;}
@keyframes ms-sub-pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
#${PANEL_ID}.ms-collapsed .ms-scroll-top,#${PANEL_ID}.ms-collapsed .ms-scroll-bottom{display:none!important;}
@media(max-width:768px){
  #${PANEL_ID}{width:92vw!important;left:50%!important;transform:translateX(-50%)!important;}
  .ms-modal-overlay .ms-modal{min-width:0!important;max-width:94%!important;}
  .ms-batch-bar .ms-batch-btn .ms-btn-label{display:none!important;}
  .ms-batch-bar .ms-batch-count{font-size:11px;}
  .ms-batch-bar{gap:3px;}
  .ms-batch-btn{padding:4px 8px;font-size:10px;}
  .ms-footer-btns{gap:5px;}.ms-footer-btns a{font-size:0!important;}.ms-footer-btns a i{font-size:12px!important;}
  #${PANEL_ID}.ms-focus-mode,
  #${PANEL_ID}.ms-bd-editor-mode,
  #${PANEL_ID}.ms-modal-expand-mode{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important;top:0!important;left:0!important;right:auto!important;bottom:auto!important;transform:none!important;border-radius:0!important;}
}
@media(max-width:500px){.ms-search{flex:1 1 100%;}}
.ms-modal-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:6000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.18s ease;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}
.ms-modal-overlay.visible{opacity:1;pointer-events:auto;}
.ms-modal{background:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a));border:1px solid var(--SmartThemeBorderColor,#444);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.5);min-width:280px;max-width:92%;max-height:86%;display:flex;flex-direction:column;transform:scale(0.94);transition:transform 0.18s ease;overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.ms-modal-overlay.visible .ms-modal{transform:scale(1);}
#${PANEL_ID} .ms-modal,
#${PANEL_ID} .ms-dropdown,
#${PANEL_ID} #ms-char-search-popup{
  background-color:var(--ms-popup-bg,var(--SmartThemeBlurTintColor,#2a2a3a))!important;
  background-image:var(--ms-panel-bg-image,none)!important;
  background-size:var(--ms-panel-bg-size,cover)!important;
  background-position:var(--ms-panel-bg-position,center)!important;
  background-repeat:var(--ms-panel-bg-repeat,no-repeat)!important;
  background-attachment:var(--ms-panel-bg-attachment,fixed)!important;
}
.ms-modal-header{padding:14px 16px 6px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
.ms-modal-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.ms-modal-icon.info{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);}
.ms-modal-icon.question{background:rgba(var(--ms-accent-rgb),0.15);color:var(--ms-accent);}
.ms-modal-icon.warning{background:rgba(196,140,40,0.15);color:#c47c20;}
.ms-modal-icon.danger{background:rgba(var(--ms-danger-rgb),0.15);color:var(--ms-danger);}
.ms-modal-icon.success{background:rgba(92,184,92,0.15);color:var(--ms-success);}
.ms-modal-title{font-size:14px;font-weight:600;color:var(--SmartThemeBodyColor,#ddd);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-modal-body{padding:6px 16px 14px;font-size:13px;color:var(--SmartThemeBodyColor,#ccc);line-height:1.6;overflow-y:auto;flex:1;min-height:0;scrollbar-width:none;-ms-overflow-style:none;}
.ms-modal-body::-webkit-scrollbar{width:0;height:0;display:none;}
.ms-modal-message{white-space:pre-wrap;word-break:break-word;margin-bottom:6px;}
.ms-modal-input,.ms-modal-textarea{appearance:none!important;-webkit-appearance:none!important;width:100%;padding:7px 10px;background-color:var(--ms-themed-input-bg,var(--SmartThemeBlurTintColor,#222))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-radius:var(--ms-themed-input-radius,6px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:13px;font-family:inherit;outline:none;margin-top:8px;box-sizing:border-box;}
.ms-modal-textarea{min-height:80px;resize:vertical;line-height:1.5;}
.ms-modal-input:focus,.ms-modal-textarea:focus{border-color:var(--ms-accent);}
.ms-modal-search{appearance:none!important;-webkit-appearance:none!important;width:100%;padding:6px 10px;background-color:var(--ms-themed-input-bg,var(--SmartThemeBlurTintColor,#222))!important;background-image:none!important;border:var(--ms-themed-input-border,1px solid var(--SmartThemeBorderColor,#444))!important;border-radius:var(--ms-themed-input-radius,6px)!important;box-shadow:var(--ms-themed-input-shadow,none)!important;color:var(--ms-themed-input-color,var(--SmartThemeBodyColor,#ccc))!important;font-size:12px;font-family:inherit;outline:none;margin-bottom:8px;box-sizing:border-box;}
.ms-modal-footer{padding:8px 16px 14px;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.ms-modal-btn{padding:6px 16px;border:1px solid var(--SmartThemeBorderColor,#444);background:transparent;color:var(--SmartThemeBodyColor,#ccc);border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit;transition:background 0.15s;min-width:60px;}
.ms-modal-btn:hover{background:rgba(255,255,255,0.06);}
.ms-modal-btn.primary{background:var(--ms-accent);color:#fff;border-color:var(--ms-accent);}
.ms-modal-btn.primary:hover{filter:brightness(1.1);}
.ms-modal-btn.danger{color:#fff;background:var(--ms-danger);border-color:var(--ms-danger);}
.ms-modal-btn.danger:hover{filter:brightness(1.1);}
.ms-modal-list{display:flex;flex-direction:column;gap:2px;margin-top:4px;}
.ms-modal-list-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:background 0.12s;border:1px solid transparent;}
.ms-modal-list-item:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.08);}
.ms-modal-list-icon{width:28px;height:28px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);overflow:hidden;}
.ms-modal-list-icon img{width:100%;height:100%;object-fit:cover;}
.ms-modal-list-info{flex:1;min-width:0;}
.ms-modal-list-name{font-size:13px;color:var(--SmartThemeBodyColor,#ddd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-modal-list-desc{font-size:10px;color:var(--SmartThemeQuoteColor,#888);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace;}
.ms-lost-card{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-lost-card:hover{background:rgba(255,255,255,0.02);}
.ms-lost-meta{display:flex;align-items:flex-start;gap:10px;}
.ms-lost-icon{width:38px;height:38px;border-radius:6px;background:rgba(var(--ms-danger-rgb),0.10);color:var(--ms-danger);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;}
.ms-lost-info{flex:1;min-width:0;}
.ms-lost-name{font-size:13px;font-weight:500;color:var(--SmartThemeBodyColor,#ddd);}
.ms-lost-fname{font-size:10px;color:var(--SmartThemeQuoteColor,#666);margin-top:2px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-lost-stats{font-size:11px;color:var(--SmartThemeBodyColor,#aaa);margin-top:4px;}
.ms-lost-samples{font-size:11px;color:var(--SmartThemeQuoteColor,#888);margin-top:4px;line-height:1.6;}
.ms-lost-samples>div{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ms-lost-badges{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;}
.ms-lost-badge{font-size:9px;padding:1px 6px;border-radius:3px;}
.ms-lost-actions{display:flex;gap:6px;margin-top:10px;justify-content:flex-end;}
.ms-switch{position:relative;display:inline-block;width:28px;height:14px;flex-shrink:0;vertical-align:middle;}
.ms-switch input{opacity:0;width:0;height:0;position:absolute;}
.ms-switch-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--SmartThemeBorderColor,#555);border-radius:14px;transition:0.25s;}
.ms-switch-slider:before{content:"";position:absolute;height:10px;width:10px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:0.25s;}
.ms-switch input:checked+.ms-switch-slider{background:var(--ms-accent);}
.ms-switch input:checked+.ms-switch-slider:before{transform:translateX(14px);}
#${PANEL_ID} .ms-form div[style*="font-size:13px"] .ms-switch{order:2;margin-left:auto;}
#${PANEL_ID} .ms-form div[style*="font-size:13px"]>span{order:1;}
.ms-filter-mode-btn{padding:1px 8px;border:1px solid var(--SmartThemeBorderColor,#444);background:rgba(var(--ms-accent-rgb),0.08);color:var(--ms-accent);border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;transition:all 0.15s;line-height:1.4;}
.ms-filter-mode-btn:hover{background:rgba(var(--ms-accent-rgb),0.18);border-color:var(--ms-accent);}
.ms-inject-indicator{display:none;align-items:center;gap:4px;font-size:11px;color:var(--ms-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;flex-shrink:1;min-width:0;}
.ms-inject-indicator.visible{display:inline-flex;cursor:pointer;}
.ms-inject-indicator i{font-size:10px;flex-shrink:0;}
#${PANEL_ID}.ms-collapsed .ms-inject-indicator{max-width:140px;}
.ms-send-btn.ms-inject-active{background:rgba(var(--ms-accent-rgb),0.18)!important;border-color:var(--ms-accent)!important;color:var(--ms-accent)!important;box-shadow:inset 0 0 0 1px rgba(var(--ms-accent-rgb),0.3);}
.ms-rpool-group{border-bottom:1px solid rgba(255,255,255,0.04);}
.ms-rpool-group-header{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;transition:background 0.12s;}
.ms-rpool-group-header:hover{background:rgba(255,255,255,0.03);}
.ms-rpool-group-body{padding:4px 8px 8px 18px;border-left:2px solid rgba(var(--ms-accent-rgb),0.15);margin-left:18px;}
.ms-rpool-item{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;cursor:pointer;}
.ms-rpool-item.disabled{opacity:0.35;pointer-events:none;}
.ms-rpool-series-label{display:flex;align-items:center;gap:5px;padding:5px 0 2px;font-size:12px;font-weight:500;cursor:pointer;user-select:none;}
.ms-rpool-series-items{padding-left:12px;}
.ms-rpool-excluded{opacity:0.4;text-decoration:line-through;}
.ms-inject-settings-row{display:flex;gap:8px;padding:6px 14px;align-items:center;flex-wrap:wrap;}
.ms-inject-radio{display:flex;align-items:center;gap:5px;padding:6px 12px;border:1px solid var(--SmartThemeBorderColor,#444);border-radius:8px;cursor:pointer;font-size:12px;color:var(--SmartThemeBodyColor,#ccc);transition:all 0.15s;}
.ms-inject-radio:hover{border-color:var(--SmartThemeQuoteColor,#666);}
.ms-inject-radio.active{background:rgba(var(--ms-accent-rgb),0.12);border-color:var(--ms-accent);color:var(--ms-accent);}
.ms-inject-radio input[type="radio"]{display:none;}
.ms-macro-info{padding:10px 14px;margin:6px 14px;background:rgba(var(--ms-accent-rgb),0.04);border:1px solid rgba(var(--ms-accent-rgb),0.12);border-radius:8px;font-size:11px;line-height:2;}
.ms-macro-info-title{font-weight:600;color:var(--SmartThemeBodyColor,#ddd);margin-bottom:2px;font-size:12px;}
.ms-macro-info code{background:rgba(var(--ms-accent-rgb),0.12);color:var(--ms-accent);padding:2px 7px;border-radius:4px;font-size:11px;font-family:Consolas,"Courier New",monospace;border:1px solid rgba(var(--ms-accent-rgb),0.2);letter-spacing:0.3px;}
.ms-macro-info .ms-macro-desc{color:var(--SmartThemeQuoteColor,#999);margin-left:6px;}
`;
}
