# Asset Finder — Usage Guide

## Overview
Asset Finder is a web-based bulk asset file search tool.
It can quickly locate resources in large projects and typically handles anywhere from tens of thousands to millions of files. The actual capacity depends on the browser's available memory, the length of individual file names/paths, and system resource limits. To keep the page responsive, indexing and searching are performed in chunks; additionally, filtering by file extensions can significantly reduce the number of files that need to be scanned, improving speed and stability.

## 1) Quick start — 5 steps
1. **Import your project**: Click the **📂 Import** button and select the folder that contains your assets.
2. **Select formats**: In the "Format Filters" choose which file extensions to include (you can enable or disable whole categories). If you are unsure, click **Select All** at the top.
3. **Choose match mode**: Pick a matching method in the "File Name Match Mode" section (see details below). Turn on **Case Sensitive** or **Ignore Spaces** as needed.
4. **Fill in queries**: In the left input box (`Files to Check - Relative Path List`), write one query per line using the format:

~~~
FileName    Relative/Path
or
FileName  <tab>  Relative/Path
~~~

For example:

~~~
Hero_Knight Assets/Characters
Stone_A  Assets/Environment/Rocks
~~~

Note: You may use multiple spaces or a Tab between the file name and the path; paths may contain subdirectories.

5. **Search and export**: Click **Search**. The search/indexing progress appears above the results. When complete, click **Export** to download the results as a text file (each line: `FileName.ext[TAB]relative/path`).

## 2) Match modes explained (examples)
- **Exact**: The file name (without extension) must match exactly. Example: query `Hero` will match `Hero.png` or `Hero.prefab`.
- **Prefix**: The file name starts with the query. Example: query `Stone` matches `Stone_A`, `Stone_B`.
- **Suffix**: The file name ends with the query. Example: query `_A` matches `Stone_A`.
- **Keyword**: The query appears anywhere in the file name (equivalent to a contains match).

Turning on **Ignore Spaces** usually increases hit rate (for example, `Hero Knight` can match `HeroKnight`).

## 3) Input / Output format and example
- Input: each line should be `FileName Relative/Path` (for example `MyMesh Assets/Models/Characters`).
- Output: each line will be `FileName.ext[TAB]relative/path` (for example `Hero_Knight.fbx\tAssets/Characters`).

Example:

~~~
Input:
Hero_Knight Assets/Characters
Stone_A Assets/Environment/Rocks

Output:
Hero_Knight.fbx	Assets/Characters
Stone_A.png	Assets/Environment/Rocks
~~~

## 4) Performance & large project tips
- Be patient when indexing very large projects (tens of thousands or millions of files).
- If the browser becomes sluggish during import, avoid heavy operations at the same time or import smaller folders in batches.

## 5) Frequently asked questions & troubleshooting
- Q: After importing, nothing can be found?  A: Make sure at least one file format is selected (or click **Select All**) and verify the input format is correct.
- Q: Help content doesn't render formatting (bold/list)?  A: The tool renders Markdown; use standard Markdown syntax (`# headings`, `- lists`, `**bold**`, code blocks with ``` or ~~~).
- Q: Local help files won't load when opening the HTML directly?  A: Some browsers block fetch requests under the `file://` protocol. Run a local server in the project folder (for example: `python -m http.server`) and open the page at `http://localhost:8000` to load local Markdown files normally.