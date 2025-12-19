// Asset Finder 主逻辑
// 依赖 lang.js
const CONFIG = {
    "Unity": [".prefab", ".mat", ".unity", ".asset", ".controller", ".anim", ".meta", ".asmdef"],
    "Unreal": [".uasset", ".umap", ".uproject", ".uplugin", ".ini", ".usf", ".ubulk", ".uexp"],
    "Godot": [".tscn", ".scn", ".gd", ".tres", ".import", ".cfg", ".escn", ".material"],
    "Models": [".fbx", ".obj", ".max", ".ma", ".blend", ".3ds", ".dae", ".gltf"],
    "Textures": [".png", ".tga", ".jpg", ".psd", ".dds", ".hdr", ".exr", ".bmp"],
    "Design": [".psd", ".ai", ".sketch", ".xd", ".fig", ".svg", ".pdf", ".eps"],
    "Code": [".cs", ".lua", ".js", ".ts", ".shader", ".h", ".cpp", ".py"],
    "Data": [".json", ".xml", ".yaml", ".txt", ".csv", ".bytes", ".bin", ".ini"],
    "Audio/Vid": [".mp3", ".wav", ".ogg", ".mp4", ".mov", ".flac", ".aac", ".m4a"]
};
let db = [];
function initUI() {
    const container = document.getElementById('extFilters');
    container.innerHTML = '';
    Object.entries(CONFIG).forEach(([cat, exts]) => {
        const div = document.createElement('div');
        div.className = 'format-category';
        div.innerHTML = `
            <div class="category-header"><strong>${cat}</strong><button class="cat-toggle" data-cat="${cat}" onclick="toggleCatToggle('${cat}')"></button></div>
            <div class="format-grid" data-cat="${cat}">
                ${exts.map(e => `<label class="mode-item"><input type="checkbox" value="${e}" onchange="syncUI(this)">${e}</label>`).join('')}
            </div>`;
        container.appendChild(div);
        // 初始化分类全选按钮的状态
        if (typeof updateCatBtnState === 'function') updateCatBtnState(cat);
    });
    document.querySelectorAll('.logic-chk, #caseSensitive, #ignoreSpaces').forEach(el => el.addEventListener('change', () => syncUI(el)));
}
function syncUI(el) {
    el.checked ? el.parentElement.classList.add('active') : el.parentElement.classList.remove('active');
    // 更新全选按钮状态
    if (typeof updateAllBtnState === 'function') updateAllBtnState();
    // 更新所属分类的全选状态
    const grid = el.closest('.format-grid');
    if (grid && typeof updateCatBtnState === 'function') updateCatBtnState(grid.getAttribute('data-cat'));
}
function toggleCat(cat, state) {
    document.querySelectorAll(`.format-grid[data-cat="${cat}"] input`).forEach(i => { i.checked = state; syncUI(i); });
}

// 切换分类全选/全不选（点击一次选中全部，再次点击则取消）
function toggleCatToggle(cat) {
    const inputs = Array.from(document.querySelectorAll(`.format-grid[data-cat="${cat}"] input`));
    if (!inputs.length) return;
    const allSelected = inputs.every(i => i.checked);
    const newState = !allSelected;
    inputs.forEach(i => { i.checked = newState; syncUI(i); });
    if (typeof updateCatBtnState === 'function') updateCatBtnState(cat);
}

function updateCatBtnState(cat) {
    const inputs = Array.from(document.querySelectorAll(`.format-grid[data-cat="${cat}"] input`));
    const headerBtn = document.querySelector(`.category-header .cat-toggle[data-cat="${cat}"]`);
    if (!headerBtn) return;
    const allSelected = inputs.length > 0 && inputs.every(i => i.checked);
    if (allSelected) headerBtn.classList.add('active'); else headerBtn.classList.remove('active');
}
function toggleAll(state) {
    const inputs = Array.from(document.querySelectorAll('#extFilters input'));
    if (typeof state === 'undefined') {
        // 如果全部已经选中，则取消全部，否则选中全部
        const allSelected = inputs.length > 0 && inputs.every(i => i.checked);
        state = !allSelected;
    }
    inputs.forEach(i => { i.checked = state; syncUI(i); });
    if (typeof updateAllBtnState === 'function') updateAllBtnState();
}

function updateAllBtnState() {
    const inputs = Array.from(document.querySelectorAll('#extFilters input'));
    const allBtn = document.getElementById('allBtn');
    if (!allBtn) return;
    const allSelected = inputs.length > 0 && inputs.every(i => i.checked);
    if (allSelected) allBtn.classList.add('active'); else allBtn.classList.remove('active');
}
function updateProgress(percent, show = true) {
    const wrap = document.getElementById('progressWrap');
    const fill = document.getElementById('progressFill');
    wrap.style.display = show ? 'block' : 'none';
    fill.style.width = percent + '%';
}

function updateSearchProgress(percent, show = true) {
    const wrap = document.getElementById('searchProgressWrap');
    const fill = document.getElementById('searchProgressFill');
    const info = document.getElementById('outputInfo');
    if (!wrap || !fill) return;
    wrap.style.display = show ? 'block' : 'none';
    fill.style.width = Math.max(0, Math.min(100, percent)) + '%';
    if (show && info && LANGUAGES[currentLang] && LANGUAGES[currentLang].searching) {
        info.innerHTML = LANGUAGES[currentLang].searching(percent);
    }
}
async function handleImport(input) {
    const files = input.files;
    if (!files.length) return;
    const status = document.getElementById('loadStatus');
    const zone = document.getElementById('dropZone');
    zone.classList.add('busy');
    db = [];
    const total = files.length;
    const chunkSize = 20000;
    for (let i = 0; i < total; i += chunkSize) {
        const end = Math.min(i + chunkSize, total);
        for (let j = i; j < end; j++) {
            const f = files[j];
            const path = f.webkitRelativePath;
            const lastSlash = path.lastIndexOf('/');
            const fileName = path.substring(lastSlash + 1);
            const lastDot = fileName.lastIndexOf('.');
            db.push({
                d: path.substring(0, lastSlash),
                n: fileName,
                no: lastDot === -1 ? fileName : fileName.substring(0, lastDot),
                e: (lastDot === -1 ? "" : fileName.substring(lastDot)).toLowerCase()
            });
        }
        const p = Math.round((end / total) * 100);
        updateProgress(p);
        status.innerHTML = LANGUAGES[currentLang].indexing(p);
        await new Promise(r => setTimeout(r, 5));
    }
    updateProgress(100, false);
    zone.classList.remove('busy');
    status.innerHTML = LANGUAGES[currentLang].ready(total.toLocaleString());
    document.getElementById('runBtn').disabled = false;
}
async function handleSearch() {
    const rawInput = document.getElementById('inputText').value.trim();
    if (!rawInput) return;
    // 只要有输入就查找，不再依赖格式筛选
    const isCase = document.getElementById('caseSensitive').checked;
    const btn = document.getElementById('runBtn');
    const info = document.getElementById('outputInfo');
    btn.disabled = true;
    // 文本区域触发行号更新
    if (typeof updateGutter === 'function') updateGutter(document.getElementById('inputText'));
    // 解析输入：文件名 [空格] 相对路径
    const stripSpace = s => s.replace(/\s+/g, '');
    // 允许多空格分隔，且路径可带空格
    const queryLines = rawInput.split('\n').filter(l => l.trim()).map(line => {
        // 只分割第一个空白，后面全是路径
        const match = line.trim().match(/^(\S+)\s+(.+)$/);
        if (!match) return null;
        return {
            name: match[1], // 不在此处做大小写处理/去空格，由 normalize 统一处理
            path: match[2].trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
        };
    }).filter(Boolean);

    let matches = [];
    const ignoreSpaces = document.getElementById('ignoreSpaces').checked;
    const selectedExts = new Set(Array.from(document.querySelectorAll('#extFilters input:checked')).map(i => i.value));

    const normalize = s => {
        let out = isCase ? s : s.toLowerCase();
        if (ignoreSpaces) out = out.replace(/\s+/g, '');
        return out;
    };

    const nameEquals = (fileName, qName) => {
        const fNorm = normalize(fileName);
        const qNorm = normalize(qName);
        if (fNorm === qNorm) return true;
        // 兼容性回退：若用户没有选中忽略空格，也允许去空格比较（与 Python 脚本行为一致）
        const fNoSpace = (isCase ? fileName : fileName.toLowerCase()).replace(/\s+/g, '');
        const qNoSpace = (isCase ? qName : qName.toLowerCase()).replace(/\s+/g, '');
        return fNoSpace === qNoSpace;
    };

    const totalFiles = db.length;
    const totalSteps = Math.max(1, totalFiles * queryLines.length);
    let processed = 0;
    let lastPercent = -1;
    updateSearchProgress(0, true);

    for (const q of queryLines) {
        const qPathNorm = normalize(q.path);
        // 收集所有候选项
        const candidates = [];
        for (const file of db) {
            // 扩展名过滤（如果有选择则只匹配被选中的格式）
            if (selectedExts.size > 0 && !selectedExts.has(file.e)) { processed++; continue; }

            const fileDirRaw = file.d.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
            const fileDirNorm = normalize(fileDirRaw);

            // 路径匹配：如果提供了路径则要求包含（更接近 Python 的 os.walk 行为）
            if (qPathNorm && !fileDirNorm.includes(qPathNorm)) { processed++; continue; }

            if (!nameEquals(file.no, q.name)) { processed++; continue; }

            candidates.push(file);
            processed++;
            const p = Math.round((processed / totalSteps) * 100);
            if (p !== lastPercent) { updateSearchProgress(p, true); lastPercent = p; }
        }

        if (candidates.length === 0) continue;

        // 选择最深的候选（按目录层级或路径长度）
        candidates.sort((a, b) => {
            const aDepth = a.d.split('/').filter(Boolean).length;
            const bDepth = b.d.split('/').filter(Boolean).length;
            if (aDepth !== bDepth) return bDepth - aDepth; // 深度越大优先
            return b.d.length - a.d.length; // 否则路径越长优先
        });

        const chosen = candidates[0];
        matches.push(`${chosen.n} ${chosen.d}`);
    }
    document.getElementById('outputText').value = matches.join('\n');
    // 更新输出处的行号显示
    if (typeof updateGutter === 'function') updateGutter(document.getElementById('outputText'));
    info.innerHTML = LANGUAGES[currentLang].found(matches.length.toLocaleString());
    updateProgress(100, false);
    updateSearchProgress(100, false);
    btn.disabled = false;
    document.getElementById('dlBtn').disabled = matches.length === 0;
}
function download() {
    const blob = new Blob([document.getElementById('outputText').value], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Search_Export_${Date.now()}.txt`;
    a.click();
}

// 行号同步辅助
function updateGutter(textarea) {
    const wrapper = textarea.closest('.code-wrapper');
    if (!wrapper) return;
    const gutter = wrapper.querySelector('.gutter');
    if (!gutter) return;
    const lines = textarea.value.split('\n').length || 1;
    // 使用textarea的实际行高来设置 gutter 行高度，保证对齐
    const cs = window.getComputedStyle(textarea);
    let lineHeight = parseFloat(cs.lineHeight);
    if (!lineHeight || isNaN(lineHeight)) {
        // 回退值（像素）
        const fontSize = parseFloat(cs.fontSize) || 15;
        lineHeight = Math.round(fontSize * 1.5);
    }
    let html = '';
    for (let i = 1; i <= lines; i++) html += `<div class="gutter-line" style="height:${lineHeight}px;line-height:${lineHeight}px">${i}</div>`;
    gutter.innerHTML = html;
    // 保持滚动同步
    gutter.scrollTop = textarea.scrollTop;
}

function attachLineCounter(id) {
    const ta = document.getElementById(id);
    if (!ta) return;
    // 初始化并绑定事件
    updateGutter(ta);
    ta.addEventListener('input', () => { updateGutter(ta); syncEditorButtons(); });
    ta.addEventListener('scroll', () => updateGutter(ta));
}

// 保证输入/输出的按钮与 textarea 精确等高
function syncEditorButtons() {
    document.querySelectorAll('.editor-row').forEach(row => {
        const ta = row.querySelector('textarea');
        const btn = row.querySelector('button');
        if (!ta || !btn) return;
        const h = ta.clientHeight;
        // 准确设置像素高度，包含边框盒模型
        btn.style.height = h + 'px';
    });
}

// 在窗口尺寸变化时同步按钮高度
window.addEventListener('resize', () => syncEditorButtons());
// 在 DOMContentLoaded 已经调用 attachLineCounter；再一次确保按钮尺寸同步
window.addEventListener('DOMContentLoaded', () => setTimeout(() => { syncEditorButtons(); }, 10));

// 固定主题为黑白灰点缀（不随时间变化）
function setThemeByTime() {
    // keep as no-op to avoid errors if called elsewhere
    document.documentElement.style.setProperty('--primary', '#9e9e9e');
    document.documentElement.style.setProperty('--progress-bar', `linear-gradient(90deg, var(--primary), #bdbdbd)`);
}

// 简单的 Markdown 渲染器（仅用于帮助弹窗，轻量实现）
function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function renderMarkdown(md) {
    if (!md) return '';
    // normalize CRLF and convert unicode bullets to - for list parsing
    md = md.replace(/\r\n/g, '\n').replace(/^[ \t]*[•·]\s+/gm, '- ');
    const lines = md.split('\n');
    let out = '';
    let inList = false;
    let inPre = false;
    for (let line of lines) {
        // support ``` and ~~~ fences
        if (/^(```|~~~)/.test(line)) {
            inPre = !inPre;
            if (inPre) out += '<pre><code>';
            else out += '</code></pre>';
            continue;
        }
        if (inPre) { out += escapeHtml(line) + '\n'; continue; }
        if (/^###\s+/.test(line)) { if (inList) { out += '</ul>'; inList = false; } out += `<h3>${escapeHtml(line.replace(/^###\s+/,''))}</h3>`; continue; }
        if (/^##\s+/.test(line)) { if (inList) { out += '</ul>'; inList = false; } out += `<h2>${escapeHtml(line.replace(/^##\s+/,''))}</h2>`; continue; }
        if (/^#\s+/.test(line)) { if (inList) { out += '</ul>'; inList = false; } out += `<h1>${escapeHtml(line.replace(/^#\s+/,''))}</h1>`; continue; }
        if (/^\s*-\s+/.test(line)) {
            if (!inList) { inList = true; out += '<ul>'; }
            let item = line.replace(/^\s*-\s+/, '');
            // handle inline code and bold inside list items
            item = item.replace(/`([^`]+)`/g, (_,m) => `<code>${escapeHtml(m)}</code>`);
            item = item.replace(/\*\*([^*]+)\*\*/g, (_,m) => `<strong>${escapeHtml(m)}</strong>`);
            out += `<li>${item}</li>`;
            continue;
        }
        if (/^\s*\d+\.\s+/.test(line)) {
            if (!inList) { inList = true; out += '<ul>'; }
            let item = line.replace(/^\s*\d+\.\s+/, '');
            item = item.replace(/`([^`]+)`/g, (_,m) => `<code>${escapeHtml(m)}</code>`);
            item = item.replace(/\*\*([^*]+)\*\*/g, (_,m) => `<strong>${escapeHtml(m)}</strong>`);
            out += `<li>${item}</li>`;
            continue;
        }
        if (line.trim() === '') { if (inList) { out += '</ul>'; inList = false; } out += '<p></p>'; continue; }
        // inline code and bold
        let t = line.replace(/`([^`]+)`/g, (_,m) => `<code>${escapeHtml(m)}</code>`);
        t = t.replace(/\*\*([^*]+)\*\*/g, (_,m) => `<strong>${escapeHtml(m)}</strong>`);
        out += `<p>${t}</p>`;
    }
    if (inList) out += '</ul>';
    return out;
}

async function loadHelpMarkdown(lang) {
    const file = `help_${lang}.md`;
    try {
        const res = await fetch(file, {cache:'no-store'});
        if (res.ok) {
            const text = await res.text();
            return { md: text, fromFile: true, path: file };
        }
        throw new Error('no file');
    } catch (e) {
        const fallback = (LANGUAGES[lang] && LANGUAGES[lang].helpMd) ? LANGUAGES[lang].helpMd : '';
        return { md: fallback, fromFile: false };
    }
}

async function renderHelpContent() {
    const bodyEl = document.getElementById('helpModalBody');
    if (!bodyEl) return;
    const t = LANGUAGES[currentLang] || {};
    const res = await loadHelpMarkdown(currentLang);
    bodyEl.innerHTML = renderMarkdown(res.md || '');
    // show small note if loaded from file
    let note = bodyEl.querySelector('.help-note'); if (note) note.remove();
    const footer = document.createElement('div'); footer.className = 'help-note';
    footer.style.marginTop = '12px'; footer.style.fontSize = '12px'; footer.style.color = '#9b9b9b';
    footer.innerText = res.fromFile ? `Loaded from ${res.path} (you can edit this file)` : `Using built-in help content`;
    bodyEl.appendChild(footer);
    // update modal aria-label for accessibility
    const modal = document.querySelector('.help-modal'); if (modal) modal.setAttribute('aria-label', t.helpTitle || 'Help');
}

let _helpPrevBodyOverflow = null;
async function showHelp() {
    const wrap = document.getElementById('helpModalBackdrop');
    if (!wrap) return;
    await renderHelpContent();
    wrap.style.display = 'flex';
    wrap.setAttribute('aria-hidden','false');
    // prevent page scrolling while modal is open
    _helpPrevBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    // focus modal for accessibility so keyboard scrolls the modal
    const modal = wrap.querySelector('.help-modal'); if (modal) modal.focus();
}
function hideHelp() {
    const wrap = document.getElementById('helpModalBackdrop');
    if (!wrap) return;
    wrap.style.display = 'none';
    wrap.setAttribute('aria-hidden','true');
    // restore page scroll
    if (_helpPrevBodyOverflow !== null) document.body.style.overflow = _helpPrevBodyOverflow;
    _helpPrevBodyOverflow = null;
    // return focus to help button
    const hb = document.getElementById('helpBtn'); if (hb) hb.focus();
}

// 绑定帮助按钮与快捷键
window.addEventListener('DOMContentLoaded', () => {
    const hb = document.getElementById('helpBtn'); if (hb) hb.addEventListener('click', showHelp);
    const wrap = document.getElementById('helpModalBackdrop'); if (wrap) wrap.addEventListener('click', (e) => { if (e.target === wrap) hideHelp(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideHelp(); });
});

// 初始化行号计数器（确保在 DOM 完全加载后再运行）
window.addEventListener('DOMContentLoaded', () => { attachLineCounter('inputText'); attachLineCounter('outputText'); });
window.initUI = initUI;
window.syncUI = syncUI;
window.toggleCat = toggleCat;
window.toggleAll = toggleAll;
window.handleImport = handleImport;
window.handleSearch = handleSearch;
window.download = download;
window.updateProgress = updateProgress;
