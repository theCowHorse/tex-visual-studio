# TeX Visual Studio

为 VS Code 提供离线公式编辑器和 TikZ 画布。可以用模板插入公式、修改已有公式，或拖动 TikZ 图形并把修改写回 LaTeX 源码。

## 安装

需要 VS Code 1.85 或更新版本。从仓库的 **Releases** 下载最新的 `.vsix`。在 VS Code 按 **Ctrl+Shift+P**（macOS 为 **Cmd+Shift+P**），运行 **Extensions: Install from VSIX...**（扩展：从 VSIX 安装），选择下载的文件。也可在命令行安装。

```sh
code --install-extension tex-visual-studio-0.1.4.vsix
```

插件已包含公式引擎、字体和 TikZ 画布，安装后可离线编辑。正式编译 LaTeX 文档时，继续使用自己的 TeX 工具链。

## 使用

| 功能 | Windows / Linux | macOS |
| --- | --- | --- |
| 编辑或插入公式 | Ctrl+Alt+Shift+M | Cmd+Option+Shift+M |
| 打开 TikZ 画布 | Ctrl+Alt+Shift+T | Cmd+Option+Shift+T |

快捷键也可通过编辑器右键菜单或命令面板中的 `TeX Visual` 命令替代。源码内的 [examples/demo.tex](examples/demo.tex) 包含可以直接试用的公式与图形。

### 公式

1. 在 `.tex` 或 Markdown 文档中，把光标放进公式，或选中一段 LaTeX，然后打开公式面板。把光标放在普通文本的插入位置可新建公式。
2. 直接输入，或使用分数、微积分、矩阵、希腊字母等模板和“公式键盘”。按 Tab 切换占位符。上方公式和下方 LaTeX 文本框双向同步。
3. 点击“写回文档”或勾选“自动写回”，再回到原文档保存。原文档支持撤销。

支持识别 `$...$`、`$$...$$`、`\(...\)`、`\[...\]` 和常见的 equation、align、gather 环境。面板会保留已有定界符。新建时默认使用 `\[...\]`，也可选择行内或纯公式代码。

可视化修改会保留源码的换行、缩进、注释和标签。公式引擎可能规范化部分命令或花括号。复杂多行公式和自定义宏可以直接在文本框中修改。如果在原文档里改过面板正在编辑的公式，请重新打开面板再写回。

### TikZ

在已保存的文件中定位 `\begin{tikzpicture} ... \end{tikzpicture}`，打开画布。也可通过命令面板的 **TeX Visual: 新建 TikZ 图形** 创建文件。

拖动节点或调整连线会自动更新原文档的文本缓冲区，修改源码也会刷新画布。用原文档的保存和撤销操作管理修改。多个图形可以通过画布导航切换。

画布支持常见节点、路径和形状。复杂宏、循环和部分 TikZ 宏包的预览可能与 TeX 编译结果不同。上游菜单中的本机编译、文件导入和部分导出功能需要相应的宿主支持。

## 从源码构建

源码包含运行所需的第三方资源。使用 Node.js 20 或更新版本运行测试，使用 Python 3 构建，无需安装 npm 依赖。在仓库根目录运行：

```sh
npm test
python scripts/package.py --output-dir dist --source-zip
```

`dist/` 会生成 `.vsix` 安装包和 `-source.zip` 源码包。省略 `--source-zip` 时只构建安装包。

发布新版本时更新 `package.json` 中的版本与 [CHANGELOG.md](CHANGELOG.md)，重新构建。在 GitHub 创建对应的版本标签，例如 `v0.1.4`，将 VSIX 附加到该版本的 Release。

本项目使用 MIT 许可，详见 [LICENSE](LICENSE)。公式编辑基于 MathLive，TikZ 画布基于 TikZ Editor 和 TikZc。随附资源的来源、许可和本项目的补丁见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
