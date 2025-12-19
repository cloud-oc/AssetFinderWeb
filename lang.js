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
        helpMd: `# 资产查找器 使用指南

### 简介
快速在项目目录（支持百万级文件）中搜索需要的资源文件。输入格式为：
~~~
文件名 相对/子路径
~~~
每行一条查询，文件名与路径之间用空格或 Tab 分隔。

### 操作步骤
1. 点击 **📂 导入**，选择项目根目录（支持文件夹选择）。
2. 在 **文件格式筛选** 中选择要搜索的文件类型（可按类开启/关闭）。
3. 在 **待查文件名-相对路径列表** 中按行输入要查的文件名与路径提示。
4. 选择 **文件名匹配模式**（全字/前缀/后缀/关键词），并根据需要开启 **区分大小写** 或 **忽略空格**。
5. 点击 **开始搜索**，搜索进度会在结果上方显示，完成后可点击 **导出** 导出结果。

### 输入示例
~~~
Hero_Knight Assets/Characters
Stone_A Assets/Environment/Rocks
~~~

### 匹配规则要点
- **忽略空格**：移除文件名和路径中的空格后匹配（增加命中率）。
- **区分大小写**：开启后匹配将区分大小写。
- **格式筛选**：若未勾选任何格式，默认不会返回结果，请至少选择一种格式或使用全选。

### 导出
搜索结果会以 <code>文件名.扩展名 [制表符] 相对路径</code> 的格式导出为文本文件。

---
如果你希望增加更多搜索选项（例如正则匹配、路径边界匹配、或取消搜索），告诉我你的优先项。`,
    },
    en: {
        title: "Asset Finder",
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
        helpMd: `# Asset Finder — Usage Guide

### Overview
Quickly search for resource files across large projects (supports millions of files). Input format:
~~~
FileName path/relative
~~~
One query per line — separate filename and path with space or tab.

### Steps
1. Click **📂 Import** and choose the project root folder (folder selection supported).
2. Choose file type filters in **Format Filters** (enable/disable categories).
3. Paste or type queries into **FileName - Relative Path List** (one per line).
4. Pick **Match Mode** (Exact / Prefix / Suffix / Keyword) and toggle **Case Sensitive** or **Ignore Spaces** as needed.
5. Click **Search**. Progress appears above results; you can **Export** results when done.

### Input Example
~~~
Hero_Knight Assets/Characters
Stone_A Assets/Environment/Rocks
~~~

### Matching notes
- **Ignore Spaces**: strips spaces from file and path names before matching (increases tolerance).
- **Case Sensitive**: enable to make matches case-sensitive.
- **Format Filters**: if no formats are selected, no results will be returned; use Select All if unsure.

### Export
Results are exported as <code>FileName.ext[TAB]relative/path</code> in a plain text file.

---
If you'd like features such as regex matching, path-boundary matching, or a cancel-search button, tell me which you'd prefer.`,
    }
};

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
