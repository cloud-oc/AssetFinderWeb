// 多语言文本配置
const LANGUAGES = {
    zh: {
        title: "资产查找器",
        description: "智能检索项目内的资产文件",
        filter: "文件格式筛选",
        all: "全选",
        none: "全不选",
        searchLogic: "文件名匹配模式",
        exact: "全字匹配",
        prefix: "前缀匹配",
        suffix: "后缀匹配",
        fuzzy: "关键词匹配",
        case: "区分大小写",
        ignoreSpace: "忽略空格",
        import: `<i class="fa-solid fa-folder-open"></i> 点击导入项目根目录`,
        input: "待查文件名-相对路径列表",
        output: "搜索结果",
        run: "开始搜索",
        export: "导出",
        indexing: percent => `<i class="fa-solid fa-spinner fa-spin"></i> 索引进度: ${percent}%`,
        ready: total => `<i class="fa-solid fa-check-circle"></i> 索引完成: <span class="count-tag">${total}</span> 个文件`,
        searching: percent => `<i class="fa-solid fa-magnifying-glass"></i> 搜索中... ${percent}%`, 
        found: count => `共找到 <span class=\"count-tag\">${count}</span> 个资源`,

        selectCat: "全选",
        pleaseSelect: "请至少选择一种格式！",
        switchToOther: "切换到英文",
        helpTitle: "使用说明",
    },
    en: {
        title: "Asset Finder Web",
        description: "Intelligently locate project asset files",
        filter: "Filter by File Format",
        all: "All",
        none: "None",
        searchLogic: "Filename Matching Mode",
        exact: "Exact Match",
        prefix: "Prefix Match",
        suffix: "Suffix Match",
        fuzzy: "Keyword Match",
        case: "Case Sensitive",
        ignoreSpace: "Ignore Spaces",
        import: `<i class="fa-solid fa-folder-open"></i> Click to import project root`,
        input: "Files to Check - Relative Path List",
        output: "Search Results",
        run: "Run Search",
        export: "Export",
        indexing: percent => `<i class="fa-solid fa-spinner fa-spin"></i> Indexing: ${percent}%`,
        ready: total => `<i class="fa-solid fa-check-circle"></i> ✅ Index Ready: <span class="count-tag">${total}</span> files`,
        searching: percent => `<i class="fa-solid fa-magnifying-glass"></i> Searching... ${percent}%`, 
        found: count => `Found <span class=\"count-tag\">${count}</span> assets`,

        selectCat: "Select All",
        pleaseSelect: "Please select at least one format!",
        switchToOther: "Switch to Chinese",
        helpTitle: "Help",
    }};

let currentLang = 'zh';

function setLang(lang) {
    currentLang = lang;
    const t = LANGUAGES[lang];
    document.getElementById('titleText').innerHTML = t.title + '<span class="logo-sub">' + (t.description || '') + '</span>';
    document.getElementById('filterTitle').innerText = t.filter;
    const allBtn = document.getElementById('allBtn'); if (allBtn) allBtn.innerText = t.all;
    const noneBtn = document.getElementById('noneBtn'); if (noneBtn) noneBtn.innerText = t.none;
    document.getElementById('searchLogicTitle').innerText = t.searchLogic;
    document.getElementById('inputTitle').innerText = t.input;
    document.getElementById('outputTitle').innerText = t.output;
    const loadStatusEl = document.getElementById('loadStatus'); if (loadStatusEl) loadStatusEl.innerHTML = t.import;
    const runEl = document.getElementById('runBtn'); if (runEl) { runEl.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><span class="btn-text">${t.run}</span>`; runEl.title = t.run; }
    const dlEl = document.getElementById('dlBtn'); if (dlEl) { dlEl.innerHTML = `<i class="fa-solid fa-download"></i><span class="btn-text">${t.export}</span>`; dlEl.title = t.export; }
    // 将文本放入独立的 span.label-text，避免替换节点导致输入框被移除
    document.querySelectorAll('.logic-chk').forEach((el, i) => {
        const label = el.parentElement;
        if (!label) return;
        let span = label.querySelector('.label-text');
        if (!span) { span = document.createElement('span'); span.className = 'label-text'; label.appendChild(span); }
        span.innerText = t[['exact','prefix','suffix','fuzzy'][i]];
    });

    const caseLabelEl = document.getElementById('caseLabel');
    if (caseLabelEl) {
        let span = caseLabelEl.querySelector('.label-text');
        if (!span) { span = document.createElement('span'); span.className = 'label-text'; caseLabelEl.appendChild(span); }
        span.innerText = t.case;
        caseLabelEl.prepend(document.getElementById('caseSensitive'));
    }

    // 新增忽略空格文案
    const ignoreLabel = document.getElementById('ignoreLabel');
    if (ignoreLabel) {
        let span = ignoreLabel.querySelector('.label-text');
        if (!span) { span = document.createElement('span'); span.className = 'label-text'; ignoreLabel.appendChild(span); }
        span.innerText = t.ignoreSpace;
        ignoreLabel.prepend(document.getElementById('ignoreSpaces'));
    }

    document.querySelectorAll('.category-header .cat-toggle').forEach(btn => btn.innerText = t.selectCat);
    if (typeof updateAllBtnState === 'function') updateAllBtnState();
    // 更新帮助按钮和弹窗内容
    const helpBtn = document.getElementById('helpBtn'); if (helpBtn) { helpBtn.title = t.helpTitle || 'Help'; helpBtn.setAttribute('aria-label', t.helpTitle || 'Help'); }
    const langBtn = document.getElementById('langSwitch'); if (langBtn) { const switchLabel = (t && t.switchToOther) ? t.switchToOther : ((lang === 'zh') ? '切换到英文' : 'Switch to Chinese'); langBtn.title = switchLabel; langBtn.setAttribute('aria-label', switchLabel); }
    if (typeof renderHelpContent === 'function') renderHelpContent();
    // 行号在语言切换或界面变更后需要刷新
    if (typeof updateGutter === 'function') { const it = document.getElementById('inputText'); const ot = document.getElementById('outputText'); if (it) updateGutter(it); if (ot) updateGutter(ot); }
}

function switchLang() {
    setLang(currentLang === 'zh' ? 'en' : 'zh');
}

document.addEventListener('DOMContentLoaded', () => { if (typeof initUI === 'function') initUI(); setLang(currentLang); });
