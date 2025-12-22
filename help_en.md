# Asset Finder — Full Usage Guide

## Overview
Asset Finder uses a **smart search** core (tolerant matching, ignore-spaces, keyword/fuzzy modes, and preferring the deepest directory when multiple candidates exist). It can handle anywhere from tens of thousands to millions of files, but the **actual capacity depends on available browser memory, file metadata size and system limits**. To remain responsive, indexing and searching use chunked processing; filtering by extensions reduces the scanned set and improves performance.

## 1) Quick start — 5 steps
1. **Import**: Click **📂 Import** and select your project root folder (folder selection supported). The browser will index files under that folder.

> Tip: The search engine runs in **smart mode** and will attempt tolerant/multiple matching strategies to increase hit rate.
2. **Select formats**: Use the Format Filters to choose which file extensions to include (you can toggle entire categories). If unsure, click **Select All**.
3. **Enter queries**: In the left input box ("Files to Check - Relative Path List") put one query per line using the format:

~~~
FileName path/relative
~~~

Examples:

~~~
Hero_Knight Assets/Characters
Stone_A Assets/Environment/Rocks
~~~

Note: Separate filename and path with space or tab; paths may contain subdirectories.

4. **Set match options**: Choose one of the match modes (Exact / Prefix / Suffix / Keyword). Toggle **Case Sensitive** or **Ignore Spaces** if needed.
5. **Search & Export**: Click **Search**. The progress bar shows indexing/searching progress. When finished, click **Export** to download a text file (format: `FileName.ext[TAB]relative/path`).

## 2) Match modes explained
- **Exact**: filename (without extension) must be exactly equal.
- **Prefix**: filename starts with the query.
- **Suffix**: filename ends with the query.
- **Keyword/Fuzzy**: query appears anywhere in the filename.

Tip: turn on **Ignore Spaces** to improve matching when filenames contain/omit spaces.

## 3) Input/Output
- Input: `FileName path/relative` per line.
- Output: `FileName.ext[TAB]relative/path` per line.

## 4) Handling large projects
- Indexing large projects may take some time; please be patient while the progress bar updates.
- If the browser feels unresponsive, try importing smaller folders or wait until indexing completes.

## 5) Troubleshooting
- If results are empty: ensure you selected at least one format or clicked **Select All**.
- If help content (Markdown) doesn't load when opening the HTML directly: some browsers block fetch from `file://`. Run a simple local server (`python -m http.server`) and open `http://localhost:8000` to enable local file loading.