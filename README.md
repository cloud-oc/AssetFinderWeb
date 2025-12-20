# Asset Finder Web  
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

**简短说明**  
Asset Finder 是一个轻量的前端工具，用于在本地项目目录中快速查找资源文件，支持大规模文件索引、格式筛选、多语言帮助与导出搜索结果功能。

---

## 功能 ✅
- 从本地选择项目根目录并索引文件（依赖浏览器对 `webkitdirectory` 的支持）
- 按文件类型分类筛选（Unity / Unreal / Textures / Models / 等）
- 多语言支持：中文（默认）与英文，帮助文档可通过 `help_zh.md` / `help_en.md` 编辑
- 多种匹配模式：**全字 / 前缀 / 后缀 / 关键词**，支持**区分大小写**与**忽略空格**
- 支持导出搜索结果为文本文件（`Search_Export_*.txt`）

---

## 界面美化 🎨
- 更新日期：2025-12-20
- 风格参考：Fluent Design + 明日方舟（Arknight）
- 主要改动：
  - 采用统一的 CSS 变量（配色、圆角、阴影）便于维护
  - 主色调整为青色高光（`--primary`）并增强进度/按钮高光
  - 全局减小圆角（`--radius-sm/md/lg`），使界面更精致利落
  - 添加了顶部玻璃（backdrop-filter）和卡片顶部的高光条，增强层次感
  - 调整按钮/卡片阴影与 hover/focus 效果以统一视觉语言

---

## 演示与在线使用 🌐
- **在线使用（推荐）**：你可以直接访问在线演示并使用工具：
  https://cloud-oc.github.io/AssetFinderWeb/
  在该页面，你可以点击顶部的 **导入（📂）** 并手动选择本地项目文件夹来进行索引；导入过程需要你在浏览器中通过选择文件夹来授予访问权限，浏览器不会自动访问你的文件系统。
  帮助文档（`help_zh.md` / `help_en.md`）也会在托管页面中正常加载。

- **本地运行（可选）**：如果你想在本地开发或调试，请克隆仓库并使用静态服务器：
```bash
git clone <your-repo-url>
cd Asset-Finder
python -m http.server 8000
# 或
npx http-server -c-1
```
然后访问 `http://localhost:8000`。

---

## 使用说明 📋
1. 点击顶部 **导入（📂）**，选择项目根目录（支持文件夹选择）。
2. 等待索引完成，页面会显示索引进度与完成文件数。
3. 在“待查文件名-相对路径列表”中按行输入查询，格式为：
```
文件名 相对/子路径
```
示例：
```
Hero_Knight Assets/Characters
Stone_A Assets/Environment/Rocks
```
4. 选择所需的文件格式筛选与匹配选项（区分大小写 / 忽略空格）。
5. 点击 **开始搜索**，完成后可点击 **导出** 保存结果为文本文件。

> 提示：若未勾选任何格式筛选，默认不会返回结果，请使用“全选”或至少勾选一种格式。

---

## 部署（GitHub Pages）📦
仓库已包含 GitHub Actions 工作流示例 `.github/workflows/gh-pages.yml`，用于将仓库根目录发布到 GitHub Pages。
- 若要停止自动部署，可在仓库的 **Actions** 页面中禁用该 workflow，或将触发方式改为 `workflow_dispatch`（手动触发）。
- 删除 workflow 文件会停止自动部署，但已发布的页面会保留直到你在仓库设置中更改 Pages 发布设置。

---

## 开发与本地调试 🛠️
- 建议使用静态服务器进行预览（见上文）。
- 主要代码文件：`index.html`、`main.js`、`lang.js`、`style.css`。帮助文本位于 `help_zh.md` / `help_en.md`。

---

## 兼容与限制 ⚠️
- 文件夹导入依赖 `webkitdirectory`（Chrome / Edge / Chromium 支持最佳）。
- 虽然实现了分块索引以提升性能，但浏览器和设备内存仍可能限制能索引的文件量。

---

## 贡献 🤝
欢迎提交 Issue 或 PR：增加功能（例如正则匹配、路径边界匹配、取消搜索等）、修复 bug 或改进文档/翻译。

---

## 许可证 📜
本项目采用 **Apache License 2.0** 。
