// 资产查找器 主逻辑
// 依赖 lang.js
const CONFIG = {
    "Unity": [".prefab", ".mat", ".unity", ".asset", ".controller", ".anim", ".meta", ".asmdef"],
    "Unreal": [".uasset", ".umap", ".uproject", ".uplugin", ".ini", ".usf", ".ubulk", ".uexp"],
    "Godot": [".tscn", ".scn", ".gd", ".tres", ".import", ".cfg", ".escn", ".material"],
    "Models": [".fbx", ".obj", ".max", ".ma", ".blend", ".3ds", ".dae", ".gltf", ".stl", ".ply", ".glb"],
    "Textures": [".png", ".tga", ".jpg", ".psd", ".dds", ".hdr", ".exr", ".bmp", ".webp", ".tiff", ".heic"],
    "Design": [".psd", ".ai", ".sketch", ".xd", ".fig", ".svg", ".pdf", ".eps", ".indd", ".cdr"],
    "Code": [".cs", ".lua", ".js", ".ts", ".shader", ".h", ".cpp", ".py", ".java", ".go", ".rb", ".php", ".html", ".css", ".sh"],
    "Data": [".json", ".xml", ".yaml", ".yml", ".toml", ".txt", ".md", ".csv", ".bytes", ".bin", ".ini", ".log"],
    "Audio": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".alac", ".aiff", ".opus", ".wma"],
    "Video": [".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv", ".flv", ".mpeg", ".mpg", ".m4v", ".3gp"]
};
let db = [];
let selectedExts = new Set();
let currentCategoryId = null;

function getAllGroups() {
    const list = [];
    const overrides = loadGroupOverrides();
    Object.entries(CONFIG).forEach(([cat, extsOrig]) => {
        const exts = (overrides && overrides[cat]) ? overrides[cat].slice() : extsOrig.slice();
        list.push({ id: cat, name: cat, exts, isCustom: false });
    });
    const customGroups = loadCustomGroups();
    customGroups.forEach(g => list.push({ id: g.id, name: g.name, exts: g.exts.slice(), isCustom: true }));
    // 按名称字母序排序分组（不区分大小写）
    list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return list;
}

function initUI() {
    const sidebar = document.getElementById('formatCategories');
    const gridWrap = document.getElementById('formatGridWrap');
    if (!sidebar || !gridWrap) return;
    sidebar.innerHTML = '';
    const groups = getAllGroups();
    // 渲染侧栏
    groups.forEach((g, idx) => {
        const el = document.createElement('div'); el.className = 'cat-item'; el.dataset.id = g.id; el.innerHTML = `<span>${escapeHtml(g.name)}</span>`;
        el.addEventListener('click', () => { showCategory(g.id); });
        sidebar.appendChild(el);
        if (idx === 0) { currentCategoryId = g.id; el.classList.add('active'); }
    });
    // 绑定搜索与操作事件
    const search = document.getElementById('formatSearch'); if (search) search.addEventListener('input', () => renderCategoryGrid(currentCategoryId));
    // 注意：`clearSelection` 被有意省略（无操作）

    // 确保“添加组”按钮已绑定事件
    const addGroupBtn = document.getElementById('addGroupBtn'); if (addGroupBtn) addGroupBtn.addEventListener('click', addCustomGroup);

    const nameEl = document.getElementById('customGroupName'); if (nameEl) { nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('customGroupExts').focus(); } }); }
    const inputEl = document.getElementById('customGroupExts'); if (inputEl) { inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomGroup(); } }); }

    // 绑定选择文件夹按钮
    const chooseBtn = document.getElementById('chooseDirBtn'); if (chooseBtn) { chooseBtn.addEventListener('click', () => { const di = document.getElementById('dirInput'); if (di) di.click(); }); }
    const openFmtBtn = document.getElementById('openFormatBtn'); if (openFmtBtn) { openFmtBtn.addEventListener('click', () => { const back = document.getElementById('formatModalBackdrop'); if (back && back.getAttribute('aria-hidden') === 'false') hideFormatModal(); else showFormatModal(); }); }
    const fmtBackdrop = document.getElementById('formatModalBackdrop'); if (fmtBackdrop) fmtBackdrop.addEventListener('click', (e) => { if (e.target === fmtBackdrop) hideFormatModal(); });

    // 确保匹配模式复选框更新 UI 并刷新运行按钮状态
    document.querySelectorAll('.logic-chk, #caseSensitive, #ignoreSpaces').forEach(el => {
        if (!el) return;
        el.addEventListener('change', () => syncUI(el));
    });

    // 若输入文本变化，重新计算运行按钮状态（当输入为空时应禁用）
    const inputTextEl = document.getElementById('inputText');
    if (inputTextEl) {
        inputTextEl.addEventListener('input', updateRunBtnState);
        inputTextEl.addEventListener('change', updateRunBtnState);
    }

    // 默认不自动选中任何匹配模式；用户需手动选择以启用搜索
    // 自动选择逻辑已移除以符合用户偏好（默认全部不选）

    // 通过渲染委托绑定内置的编辑/删除/添加按钮
    showCategory(currentCategoryId);
    // 同步格式按钮的显示文本与当前选择
    updateFormatButtonText();
    // 确保运行按钮反映当前状态
    updateRunBtnState();
} 

function showFormatModal() {
    const back = document.getElementById('formatModalBackdrop'); const modal = document.querySelector('.format-modal'); const btn = document.getElementById('openFormatBtn');
    if (!back || !modal || !btn) return;
    // 在弹窗中渲染 UI，然后以按钮为锚点定位
    initUI();
    modal.style.position = 'absolute';
    back.setAttribute('aria-hidden','false');
    positionFormatModal();
    // 弹窗打开时监听窗口改变以重新定位
    window.addEventListener('resize', positionFormatModal);
    window.addEventListener('scroll', positionFormatModal, true);
    setTimeout(() => { const s = document.getElementById('formatSearch'); if (s) s.focus(); }, 30);
}

function hideFormatModal() {
    const back = document.getElementById('formatModalBackdrop'); const modal = document.querySelector('.format-modal');
    if (!back) return; back.setAttribute('aria-hidden','true');
    // 清理内联定位与事件监听
    if (modal) { modal.style.top = ''; modal.style.left = ''; }
    window.removeEventListener('resize', positionFormatModal);
    window.removeEventListener('scroll', positionFormatModal, true);
}

// 注意：按 Esc 关闭弹窗
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
    const back = document.getElementById('formatModalBackdrop'); if (back && back.getAttribute('aria-hidden') === 'false') hideFormatModal();
} });
function syncUI(el) {
    el.checked ? el.parentElement.classList.add('active') : el.parentElement.classList.remove('active');
    // 更新全选按钮状态
    if (typeof updateAllBtnState === 'function') updateAllBtnState();
    // 更新所属分类的全选状态
    const grid = el.closest('.format-grid');
    if (grid && typeof updateCatBtnState === 'function') updateCatBtnState(grid.getAttribute('data-cat'));
    // if matching mode changed, update run button state
    if (el.classList && el.classList.contains('logic-chk') && typeof updateRunBtnState === 'function') updateRunBtnState();
} 
function toggleCat(cat, state) {
    const group = getAllGroups().find(g => g.id === cat);
    if (!group) return;
    if (state === undefined) state = true;
    group.exts.forEach(e => { if (state) selectedExts.add(e); else selectedExts.delete(e); });
    if (currentCategoryId === cat) renderCategoryGrid(cat);
    updateAllBtnState();
}

// 切换分类全选/全不选（点击一次选中全部，再次点击则取消）
function toggleCatToggle(cat) {
    // Toggle all formats for the given category (uses tag-based selection)
    const group = getAllGroups().find(g => g.id === cat);
    if (!group) return;
    // determine if all are selected
    const allSelected = group.exts.length > 0 && group.exts.every(e => selectedExts.has(e));
    const newState = !allSelected;
    group.exts.forEach(e => { if (newState) selectedExts.add(e); else selectedExts.delete(e); });
    if (currentCategoryId === cat) renderCategoryGrid(cat);
    updateAllBtnState();
    updateFormatButtonText();
}

function updateCatBtnState(cat) {
    const headerBtn = document.querySelector(`.category-header .cat-toggle[data-cat="${cat}"]`);
    if (!headerBtn) return;
    const group = getAllGroups().find(g => g.id === cat);
    if (!group) return;
    const allSelected = group.exts.length > 0 && group.exts.every(e => selectedExts.has(e));
    if (allSelected) headerBtn.classList.add('active'); else headerBtn.classList.remove('active');
}


// updateAllBtnState is implemented later to reflect visible tags selection state (see below).

// Custom groups support (stored in localStorage)
function loadCustomGroups() {
    try { const v = JSON.parse(localStorage.getItem('customGroups') || '[]'); return Array.isArray(v) ? v : []; } catch(e) { return []; }
}
function saveCustomGroups(arr) { localStorage.setItem('customGroups', JSON.stringify(arr)); }

// 注意：自定义组与内置组一并渲染于格式面板（见 initUI）。

function addCustomGroup() {
    const nameEl = document.getElementById('customGroupName');
    const extsEl = document.getElementById('customGroupExts');
    if (!nameEl || !extsEl) return;
    const name = nameEl.value.trim();
    const raw = extsEl.value.trim();
    if (!name) { alert('请填写组名'); return; }
    if (!raw) { alert('请填写扩展名'); return; }
    const parts = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    const exts = [];
    for (let p of parts) {
        if (!p.startsWith('.')) p = '.' + p;
        p = p.toLowerCase();
        if (/^\.[a-z0-9_-]+$/.test(p)) exts.push(p);
    }
    if (!exts.length) { alert('没有有效的扩展名'); return; }
    // create id
    const groups = loadCustomGroups();
    const id = 'cg_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*1000).toString(36);
    groups.push({ id, name, exts });
    saveCustomGroups(groups);
    nameEl.value = '';
    extsEl.value = '';
    initUI();
}

function removeCustomGroup(id) {
    const groups = loadCustomGroups().filter(g => g.id !== id);
    saveCustomGroups(groups);
    initUI();
}

function editCustomGroupDialog(id) {
    const groups = loadCustomGroups();
    const g = groups.find(x => x.id === id);
    if (!g) return;
    showEditModal({ title: '编辑组', bodyHtml: `<label>组名<input id="modalGroupName" value="${escapeHtml(g.name)}"></label><label>扩展（逗号分隔）<textarea id="modalGroupExts">${escapeHtml(g.exts.map(e => e && e.startsWith('.') ? e.substring(1) : e).join(', '))}</textarea></label>`, onSave: () => {
        const nameInp = document.getElementById('modalGroupName'); const extsInp = document.getElementById('modalGroupExts');
        if (!nameInp || !extsInp) return false;
        const newName = nameInp.value.trim(); if (!newName) return false;
        const parts = extsInp.value.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
        const exts = [];
        for (let p of parts) { if (!p.startsWith('.')) p = '.' + p; p = p.toLowerCase(); if (/^\.[a-z0-9_-]+$/.test(p)) exts.push(p); }
        if (!exts.length) { alert('没有有效的扩展名，取消修改'); return false; }
        g.name = newName; g.exts = exts; saveCustomGroups(groups); initUI(); return true;
    }});
}

function clearCustomGroups() {
    if (!confirm('确认清空所有自定义类型组？')) return;
    localStorage.removeItem('customGroups');
    initUI();
}

// Built-in group overrides persistence
function loadGroupOverrides() {
    try { const v = JSON.parse(localStorage.getItem('groupOverrides') || '{}'); return typeof v === 'object' && v ? v : {}; } catch(e) { return {}; }
}
function saveGroupOverrides(obj) { localStorage.setItem('groupOverrides', JSON.stringify(obj)); }

function ensureOverrideForCategory(cat) {
    const o = loadGroupOverrides();
    if (!o[cat]) o[cat] = (CONFIG[cat] || []).slice();
    return o;
}

function removeExtFromBuiltIn(cat, ext) {
    const o = ensureOverrideForCategory(cat);
    o[cat] = o[cat].filter(e => e !== ext);
    saveGroupOverrides(o);
    initUI();
}

function editExtInBuiltIn(cat, oldExt) {
    const initial = oldExt && oldExt.startsWith('.') ? oldExt.substring(1) : oldExt;
    showEditModal({ title: '编辑扩展', bodyHtml: `<label>扩展名（无需前导 .）<input id="modalExtInput" value="${escapeHtml(initial)}"></label>`, onSave: () => {
        const inp = document.getElementById('modalExtInput'); if (!inp) return false;
        let p = inp.value.trim(); if (!p) return false;
        if (!p.startsWith('.')) p = '.' + p;
        p = p.toLowerCase();
        if (!/^\.[a-z0-9_-]+$/.test(p)) { alert('扩展名格式不合法'); return false; }
        const o = ensureOverrideForCategory(cat);
        o[cat] = o[cat].map(e => e === oldExt ? p : e);
        saveGroupOverrides(o);
        initUI();
        return true;
    }});
}

function addExtToBuiltIn(cat, raw) {
    if (!raw || !raw.trim()) return;
    const parts = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const o = ensureOverrideForCategory(cat);
    const current = new Set(o[cat]);
    for (let p of parts) {
        if (!p.startsWith('.')) p = '.' + p;
        p = p.toLowerCase();
        if (/^\.[a-z0-9_-]+$/.test(p)) current.add(p);
    }
    o[cat] = Array.from(current);
    saveGroupOverrides(o);
    initUI();
}

// 辅助：转义 HTML (已在 main.js 中定义，此处仅用于 lang.js 内部或保持引用)
// 统一使用 main.js 中的 escapeHtml

window.initUI = initUI;
window.syncUI = syncUI;
window.toggleCat = toggleCat;
window.toggleAll = toggleAll;
window.handleImport = handleImport;
window.handleSearch = handleSearch;
window.download = download;
window.updateProgress = updateProgress;
window.escapeHtml = escapeHtml;

// 内联编辑弹窗辅助
function showEditModal({title, bodyHtml, onSave}) {
    const backdrop = document.getElementById('editModalBackdrop');
    const body = document.getElementById('editModalBody');
    const titleEl = document.getElementById('editModalTitle');
    if (!backdrop || !body || !titleEl) return;
    titleEl.innerText = title || '编辑';
    body.innerHTML = bodyHtml || '';
    backdrop.setAttribute('aria-hidden','false');
    const saveBtn = document.getElementById('editModalSave');
    const cancelBtn = document.getElementById('editModalCancel');
    const cleanup = () => { saveBtn.removeEventListener('click', onSaveHandler); cancelBtn.removeEventListener('click', onCancel); backdrop.setAttribute('aria-hidden','true'); };
    const onSaveHandler = () => { try { const ok = !!onSave(); if (ok) cleanup(); } catch(e) { console.error(e); } };
    const onCancel = () => { backdrop.setAttribute('aria-hidden','true'); cleanup(); };
    saveBtn.addEventListener('click', onSaveHandler);
    cancelBtn.addEventListener('click', onCancel);
    // focus first input
    setTimeout(() => { const first = body.querySelector('input, textarea'); if (first) first.focus(); }, 10);
}

function hideEditModal() { const backdrop = document.getElementById('editModalBackdrop'); if (backdrop) backdrop.setAttribute('aria-hidden','true'); }

// Remove an extension from a group
function removeExtFromGroup(id, ext) {
    const groups = loadCustomGroups();
    const g = groups.find(x => x.id === id);
    if (!g) return;
    g.exts = g.exts.filter(e => e !== ext);
    saveCustomGroups(groups);
    initUI();
}

// Edit an extension in a group (prompt)
function editExtInGroup(id, oldExt) {
    // show inline modal to edit extension (no prompt)
    const initial = oldExt && oldExt.startsWith('.') ? oldExt.substring(1) : oldExt;
    showEditModal({ title: '编辑扩展', bodyHtml: `<label>扩展名（无需前导 .）<input id="modalExtInput" value="${escapeHtml(initial)}"></label>`, onSave: () => {
        const inp = document.getElementById('modalExtInput'); if (!inp) return false;
        let p = inp.value.trim(); if (!p) return false;
        if (!p.startsWith('.')) p = '.' + p;
        p = p.toLowerCase();
        if (!/^\.[a-z0-9_-]+$/.test(p)) { alert('扩展名格式不合法'); return false; }
        const groups = loadCustomGroups();
        const g = groups.find(x => x.id === id);
        if (!g) return false;
        g.exts = g.exts.map(e => e === oldExt ? p : e);
        saveCustomGroups(groups);
        initUI();
        return true;
    }});
}

// Add extension(s) to a group (supports comma separated), up to 8 per group
function addExtToGroup(id, raw) {
    if (!raw || !raw.trim()) return;
    const parts = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const groups = loadCustomGroups();
    const g = groups.find(x => x.id === id);
    if (!g) return;
    const current = new Set(g.exts);
    for (let p of parts) {
        if (!p.startsWith('.')) p = '.' + p;
        p = p.toLowerCase();
        if (/^\.[a-z0-9_-]+$/.test(p)) current.add(p);
    }
    g.exts = Array.from(current);
    saveCustomGroups(groups);
    initUI();
}

// Ensure at least one required filename matching mode is selected
function isMatchingModeSelected() {
    // required modes are marked with .required-chk
    return Array.from(document.querySelectorAll('.required-chk:checked')).length > 0;
} 
function updateRunBtnState() {
    const btn = document.getElementById('runBtn');
    if (!btn) return;
    const inputEl = document.getElementById('inputText');
    const hasInput = inputEl && inputEl.value && inputEl.value.trim().length > 0;
    // require: database indexed, at least one required matching mode selected, and input list not empty
    btn.disabled = !(db && db.length > 0 && isMatchingModeSelected() && hasInput);
}

function updateProgress(percent, show = true) {
    const wrap = document.getElementById('progressWrap');
    const fill = document.getElementById('progressFill');
    wrap.style.display = show ? 'block' : 'none';
    fill.style.width = percent + '%';
}

function updateChooseProgress(percent) {
    const btn = document.getElementById('chooseDirBtn'); if (!btn) return;
    const fill = btn.querySelector('.choose-progress-fill'); if (fill) fill.style.width = percent + '%';
    const status = btn.querySelector('.choose-status'); if (status) {
        const short = (LANGUAGES[currentLang] && LANGUAGES[currentLang].chooseIndexingShort) ? LANGUAGES[currentLang].chooseIndexingShort(percent) : (`索引中 ${percent}%`);
        status.innerText = short;
    }
}

function setChooseReady(total) {
    const btn = document.getElementById('chooseDirBtn'); if (!btn) return;
    const status = btn.querySelector('.choose-status');
    const label = btn.querySelector('.choose-label');
    if (status) {
        const ready = (LANGUAGES[currentLang] && LANGUAGES[currentLang].chooseReadyShort) ? LANGUAGES[currentLang].chooseReadyShort(total.toLocaleString()) : (`已索引 ${total} 个文件`);
        status.innerText = ready;
    }
    // 索引完成时，将按钮主文本替换为已记录的文件夹名（如果有）
    if (label) {
        const folderName = btn.dataset.folderName;
        if (folderName) {
            label.innerText = folderName;
            btn.title = folderName;
            btn.setAttribute('aria-label', folderName);
        } else {
            const defaultLabel = (LANGUAGES[currentLang] && LANGUAGES[currentLang].chooseFolder) ? LANGUAGES[currentLang].chooseFolder : '选择资产文件夹';
            label.innerText = defaultLabel;
            btn.title = defaultLabel;
            btn.setAttribute('aria-label', defaultLabel);
        }
    }
    const fill = btn.querySelector('.choose-progress-fill'); if (fill) { fill.style.width = '100%'; }
    // fade out progress fill after short delay
    setTimeout(() => { if (fill) { fill.style.opacity = '0'; fill.style.width = '0%'; } }, 1400);
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
    // import from file input
    const files = input.files;
    if (!files || !files.length) return;

    // 推断代表性文件夹名并保存在按钮的 dataset 中，显示由 setChooseReady 在索引完成后决定
    const chooseBtn = document.getElementById('chooseDirBtn');
    try {
        const arr = Array.from(files);
        let folderName = '';
        if (arr.length) {
            const f0 = arr[0];
            const wrp = f0.webkitRelativePath || f0.relativePath || (f0.path || '');
            if (wrp) {
                const parts = wrp.replace(/^\/+|\/+$/g, '').split('/');
                folderName = parts.length ? parts[0] : '';
            } else if (f0.path) {
                const p = (f0.path || '').replace(/\\/g, '/');
                const parts = p.split('/');
                folderName = parts.length > 1 ? parts[parts.length-2] : (parts[0] || '');
            }
        }
        if (!folderName && typeof LANGUAGES !== 'undefined' && LANGUAGES[currentLang] && LANGUAGES[currentLang].chooseFolder) folderName = LANGUAGES[currentLang].chooseFolder;
        if (chooseBtn && folderName) chooseBtn.dataset.folderName = folderName;
    } catch (e) { /* ignore */ }

    await processFiles(Array.from(files));
    // reset input so same folder can be re-selected
    try { input.value = ''; } catch(e) {}
}

async function processFiles(filesArr) {
    if (!filesArr || filesArr.length === 0) return;
    // Use the choose button UI for progress/status (older refs to dropZone/loadStatus no longer exist)
    const chooseBtn = document.getElementById('chooseDirBtn');
    if (chooseBtn) chooseBtn.classList.add('busy');
    updateChooseProgress(0);
    db = [];
    const total = filesArr.length;
    const chunkSize = 20000;
    for (let i = 0; i < total; i += chunkSize) {
        const end = Math.min(i + chunkSize, total);
        for (let j = i; j < end; j++) {
            const f = filesArr[j];
            const path = f.webkitRelativePath || f.relativePath || (f.path || f.name);
            const normalized = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
            const lastSlash = normalized.lastIndexOf('/');
            const fileName = normalized.substring(lastSlash + 1);
            const lastDot = fileName.lastIndexOf('.');
            db.push({
                d: normalized.substring(0, lastSlash),
                n: fileName,
                no: lastDot === -1 ? fileName : fileName.substring(0, lastDot),
                e: (lastDot === -1 ? "" : fileName.substring(lastDot)).toLowerCase()
            });
        }
        const p = Math.round((end / total) * 100);
        // update both global progress bar and the choose button mini-progress/status
        updateProgress(p);
        updateChooseProgress(p);
        await new Promise(r => setTimeout(r, 5));
    }
    updateProgress(100, false);
    if (chooseBtn) { chooseBtn.classList.remove('busy'); setChooseReady(total); }
    updateRunBtnState();
} 

// 注意：已禁用拖放导入与目录递归；请通过隐藏的文件输入(`#dirInput`) 并调用 `handleImport()` 导入文件。


// 将当前选中的分类渲染到右侧网格
function showCategory(catId) {
    currentCategoryId = catId;
    // mark active in sidebar
    document.querySelectorAll('.format-sidebar .cat-item').forEach(el => el.classList.toggle('active', el.dataset.id === catId));
    renderCategoryGrid(catId);
    // update category controls (edit / delete for custom groups)
    const controls = document.getElementById('categoryControls');
    if (!controls) return;
    controls.innerHTML = '';
    const groups = getAllGroups();
    const grp = groups.find(g => g.id === catId);
    if (!grp) return;
    if (grp.isCustom) {
        const editBtn = document.createElement('button'); editBtn.title = '编辑组'; editBtn.setAttribute('aria-label','编辑组'); editBtn.innerHTML = `<i class="fa-solid fa-pen" aria-hidden="true"></i>`; editBtn.addEventListener('click', (e) => { e.preventDefault(); editCustomGroupDialog(catId); });
        const delBtn = document.createElement('button'); delBtn.title = '删除组'; delBtn.setAttribute('aria-label','删除组'); delBtn.innerHTML = `<i class="fa-solid fa-trash" aria-hidden="true"></i>`; delBtn.addEventListener('click', (e) => { e.preventDefault(); if (confirm('确认删除该自定义组？')) removeCustomGroup(catId); });
        controls.appendChild(editBtn); controls.appendChild(delBtn);
    }
}

function renderCategoryGrid(catId) {
    const grid = document.getElementById('formatGridWrap');
    if (!grid) return;
    grid.innerHTML = '';
    const groups = getAllGroups();
    const search = (document.getElementById('formatSearch')?.value || '').toLowerCase().trim();

    if (search) {
        // Global search across all groups: collect unique extensions that match the search
        const map = new Map(); // ext -> first matching group name
        groups.forEach(group => {
            group.exts.forEach(ext => {
                const label = (ext && ext.startsWith('.')) ? ext.substring(1) : ext;
                if (!label) return;
                if (!label.toLowerCase().includes(search)) return;
                if (!map.has(ext)) map.set(ext, group.name);
            });
        });
        // sort matched results by label
        const results = Array.from(map.entries()).map(([ext, groupName]) => ({ ext, groupName, label: (ext && ext.startsWith('.')) ? ext.substring(1) : ext }));
        results.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
        results.forEach(r => {
            const tag = document.createElement('div');
            tag.className = 'format-tag' + (selectedExts.has(r.ext) ? ' active' : '');
            tag.dataset.ext = r.ext;
            tag.innerHTML = `<span>${escapeHtml(r.label)}</span><small style="margin-left:8px;color:#9b9b9b">${escapeHtml(r.groupName)}</small>`;
            tag.addEventListener('click', () => { toggleFormat(r.ext, tag); });
            grid.appendChild(tag);
        });
        // hide category-specific controls during global search
        const controls = document.getElementById('categoryControls'); if (controls) controls.setAttribute('aria-hidden', 'true');
    } else {
        // show single category
        const group = groups.find(g => g.id === catId);
        if (!group) return;
        const sortedExts = group.exts.slice().sort((x, y) => {
            const lx = (x && x.startsWith('.')) ? x.substring(1) : x;
            const ly = (y && y.startsWith('.')) ? y.substring(1) : y;
            return lx.toLowerCase().localeCompare(ly.toLowerCase());
        });
        sortedExts.forEach(ext => {
            const label = ext && ext.startsWith('.') ? ext.substring(1) : ext;
            const tag = document.createElement('div');
            tag.className = 'format-tag' + (selectedExts.has(ext) ? ' active' : '');
            tag.dataset.ext = ext;
            tag.innerHTML = `<span>${escapeHtml(label)}</span>`;
            tag.addEventListener('click', () => { toggleFormat(ext, tag); });
            grid.appendChild(tag);
        });
        const controls = document.getElementById('categoryControls'); if (controls) controls.setAttribute('aria-hidden', 'false');
    }

    updateAllBtnState();
}

function toggleFormat(ext, el) {
    if (selectedExts.has(ext)) selectedExts.delete(ext); else selectedExts.add(ext);
    if (el) el.classList.toggle('active', selectedExts.has(ext));
    updateAllBtnState();
    updateFormatButtonText();
}

function positionFormatModal() {
    const btn = document.getElementById('openFormatBtn'); const modal = document.querySelector('.format-modal'); const back = document.getElementById('formatModalBackdrop');
    if (!btn || !modal || !back || back.getAttribute('aria-hidden') === 'true') return;
    const rect = btn.getBoundingClientRect();
    const mw = modal.offsetWidth || 560;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let left = rect.left + window.scrollX;
    // keep modal within viewport
    if (left + mw > vw - 12) left = Math.max(12, vw - mw - 12);
    let top = rect.bottom + window.scrollY + 8;
    // if not enough space below, show above
    const mh = modal.offsetHeight || 320;
    if (top + mh > window.scrollY + (window.innerHeight || document.documentElement.clientHeight)) {
        top = rect.top + window.scrollY - mh - 8;
    }
    modal.style.left = left + 'px'; modal.style.top = top + 'px';
}

// 帮助弹窗定位：以帮助按钮为锚点（与格式弹窗相同定位逻辑）
function positionHelpModal() {
    const btn = document.getElementById('helpBtn'); const modal = document.querySelector('.help-modal'); const back = document.getElementById('helpModalBackdrop');
    if (!btn || !modal || !back || back.getAttribute('aria-hidden') === 'true') return;
    const rect = btn.getBoundingClientRect();
    const mw = modal.offsetWidth || 560;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let left = rect.left + window.scrollX;
    // keep modal within viewport
    if (left + mw > vw - 12) left = Math.max(12, vw - mw - 12);
    let top = rect.bottom + window.scrollY + 8;
    // if not enough space below, show above
    const mh = modal.offsetHeight || 320;
    if (top + mh > window.scrollY + (window.innerHeight || document.documentElement.clientHeight)) {
        top = rect.top + window.scrollY - mh - 8;
    }
    modal.style.left = left + 'px'; modal.style.top = top + 'px';
}

function updateFormatButtonText() {
    const btn = document.getElementById('openFormatBtn'); if (!btn) return;
    const t = LANGUAGES[currentLang] || {};
    const sel = Array.from(selectedExts).map(s => s && s.startsWith('.') ? s.substring(1) : s).filter(Boolean);
    if (!sel.length) { btn.innerText = t.filter || '文件格式筛选'; return; }
    const visible = sel.slice(0,3);
    const more = sel.length - visible.length;
    const pills = visible.map(l => `<span class="fmt-pill">${escapeHtml(l)}</span>`).join('');
    const moreHtml = more > 0 ? `<span class="fmt-more">+${more}</span>` : '';
    btn.innerHTML = `<span class="fmt-list">${pills}${moreHtml}</span>`;
}

function toggleAll(state) {
    const tags = Array.from(document.querySelectorAll('#formatGridWrap .format-tag'));
    if (!tags.length) return;
    if (typeof state === 'undefined') {
        const allSelected = tags.length > 0 && tags.every(t => t.classList.contains('active'));
        state = !allSelected;
    }
    tags.forEach(t => { const ext = t.dataset.ext; if (state) selectedExts.add(ext); else selectedExts.delete(ext); t.classList.toggle('active', state); });
    updateAllBtnState();
    updateFormatButtonText();
}

function updateAllBtnState() {
    const allBtn = document.getElementById('allBtn'); if (!allBtn) return;
    const tags = Array.from(document.querySelectorAll('#formatGridWrap .format-tag'));
    const allSelected = tags.length > 0 && tags.every(t => t.classList.contains('active'));
    if (allSelected) { allBtn.classList.add('active'); allBtn.innerText = (LANGUAGES[currentLang] && LANGUAGES[currentLang].none) ? LANGUAGES[currentLang].none : 'None'; }
    else { allBtn.classList.remove('active'); allBtn.innerText = (LANGUAGES[currentLang] && LANGUAGES[currentLang].all) ? LANGUAGES[currentLang].all : 'All'; }
}


// 注意：已禁用拖放导入；请使用隐藏的文件输入(`#dirInput`) 并调用 `handleImport()`。
async function handleSearch() {
    const rawInput = document.getElementById('inputText').value.trim();
    if (!rawInput) return;
    // 只要有输入就查找，不再依赖格式筛选
    const isCase = document.getElementById('caseSensitive').checked;
    const btn = document.getElementById('runBtn');
    const info = document.getElementById('outputInfo');
    btn.disabled = true;
    if (!isMatchingModeSelected()) {
        info.innerHTML = LANGUAGES[currentLang].pleaseSelectLogic || LANGUAGES[currentLang].pleaseSelect || 'Please select a matching mode';
        btn.disabled = false;
        return;
    }
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
    const selectedExtsLocal = selectedExts; // use currently selected format tags (Set)

    // extension filter: normalize selected extensions (ensure they start with .) when checking
    const normalizedSelectedExts = new Set(Array.from(selectedExtsLocal).map(s => s.startsWith('.') ? s : '.' + s));

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
            if (normalizedSelectedExts.size > 0 && !normalizedSelectedExts.has(file.e)) { processed++; continue; }

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
        // If fetching fails (e.g., page opened via file://), try to use an embedded
        // markdown fallback from the LANGUAGES table if available so the help can render.
        const fallback = (LANGUAGES[lang] && LANGUAGES[lang].helpMd) ? LANGUAGES[lang].helpMd : '';
        return { md: fallback, fromFile: false };
    }
}

async function renderHelpContent() {
    const bodyEl = document.getElementById('helpModalBody');
    if (!bodyEl) return;
    const t = LANGUAGES[currentLang] || {};
    const res = await loadHelpMarkdown(currentLang);
    // Render markdown if any is available (either fetched file or embedded fallback);
    // do not display extra fallback UI or buttons.
    if (res && res.md && res.md.trim()) {
        bodyEl.innerHTML = renderMarkdown(res.md);
    } else {
        bodyEl.innerHTML = '';
    }
    // update modal aria-label for accessibility
    const modal = document.querySelector('.help-modal'); if (modal) modal.setAttribute('aria-label', t.helpTitle || 'Help');
}

let _helpPrevBodyOverflow = null;
async function showHelp() {
    const wrap = document.getElementById('helpModalBackdrop');
    if (!wrap) return;
    await renderHelpContent();
    // show via aria attribute (CSS controls display and centering)
    wrap.setAttribute('aria-hidden','false');
    // also explicitly set display to flex to avoid CSS/environment glitches
    wrap.style.display = 'flex';
    const modal = wrap.querySelector('.help-modal');
    if (modal) {
        // ensure modal itself is visible
        modal.style.display = '';
        modal.focus();
    }
    // attach global pointerdown listener to close when clicking outside modal
    if (!window._helpPointerDown) {
        window._helpPointerDown = function(e) { const wrap2 = document.getElementById('helpModalBackdrop'); const modal2 = wrap2 ? wrap2.querySelector('.help-modal') : null; if (!modal2 || !modal2.contains(e.target)) hideHelp(); };
    }
    window.addEventListener('pointerdown', window._helpPointerDown, true);
    // prevent page scrolling while modal is open
    _helpPrevBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
}
function hideHelp() {
    const wrap = document.getElementById('helpModalBackdrop');
    if (!wrap) return;
    wrap.setAttribute('aria-hidden','true');
    // ensure backdrop is hidden visually too
    wrap.style.display = 'none';
    const modal = wrap.querySelector('.help-modal');
    if (modal) {
        modal.style.position = '';
        modal.style.left = '';
        modal.style.top = '';
        modal.style.transform = '';
        modal.style.margin = '';
        modal.style.display = 'none';
    }
    // remove global listener
    if (window._helpPointerDown) window.removeEventListener('pointerdown', window._helpPointerDown, true);
    // restore page scroll
    if (_helpPrevBodyOverflow !== null) document.body.style.overflow = _helpPrevBodyOverflow;
    _helpPrevBodyOverflow = null;
    // return focus to help button
    const hb = document.getElementById('helpBtn'); if (hb) hb.focus();
}



// 绑定帮助按钮与快捷键
window.addEventListener('DOMContentLoaded', () => {
    const hb = document.getElementById('helpBtn'); if (hb) hb.addEventListener('click', showHelp);
    const wrap = document.getElementById('helpModalBackdrop'); if (wrap) {
        wrap.addEventListener('click', (e) => { if (e.target === wrap) hideHelp(); });
        // Ensure help backdrop is hidden on load (defensive in case some styles/attributes changed)
        wrap.setAttribute('aria-hidden','true');
        // enforce hidden state to avoid any visual flash or leftover inline styles
        wrap.style.display = 'none';
        wrap.style.position = '';
        const modal = wrap.querySelector('.help-modal');
        if (modal) {
            modal.style.left = '';
            modal.style.top = '';
            modal.style.transform = '';
            modal.style.position = '';
            modal.style.margin = '';
            modal.style.display = 'none';
        }
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideHelp(); });
});

// 初始化行号计数器（确保在 DOM 完全加载后再运行）
window.addEventListener('DOMContentLoaded', () => { 
    attachLineCounter('inputText'); attachLineCounter('outputText'); 
    const dirInput = document.getElementById('dirInput');
});


// 注意：已禁用拖放导入；请使用隐藏的文件输入(`#dirInput`) 并调用 `handleImport()`。

// 已在 main.js 之前或其他地方定义，此处保持引用或通过全局访问。
// 若要在 main.js 中保留常用工具函数，建议只保留一个版本。
function escapeHtml(s) { 
    if (!s) return ''; 
    return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;'); 
}
