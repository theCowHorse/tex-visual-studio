# Third-party components

The extension's own code is MIT-licensed. The following bundled assets retain
their upstream licenses.

- MathLive 0.111.1, Arno Gourdol and contributors, MIT. https://github.com/arnog/mathlive
  Distributed JS and fonts from the official npm package. License: media/mathlive/LICENSE.txt.
- TikZ Editor, Dominik Peters and contributors, MIT. https://github.com/DominikPeters/tikz-editor
  Included via the prebuilt browser assets from RyoNakagami/tikzc VS Code extension 0.3.3.
  License: licenses/tikz-editor-MIT.txt.
- TikZc webview adapter and build, Ryo Nakagami and contributors, MIT.
  https://github.com/RyoNakagami/tikzc/tree/v0.3.3/vscode-extension
  License: licenses/tikzc-MIT.txt.
- KaTeX fonts included with MathLive and the TikZc webview, SIL Open Font
  License 1.1. Copyright and reserved font names are taken from the bundled
  font metadata. License: licenses/katex-fonts-OFL-1.1.txt.
  Upstream: https://github.com/KaTeX/KaTeX
- MathJax New Computer Modern fonts (`mjx-ncm-*.woff2`), copyright 2024
  MathJax, Inc., based on New Computer Modern by Antonis Tsolomitis
  (2019–2021 per the bundled font metadata). These fonts retain their
  GUST Font License, which incorporates LPPL 1.3c or later.
  License: licenses/GUST-FONT-LICENSE.txt and licenses/LPPL-1.3c.txt.
  Font source: https://github.com/mathjax/MathJax-newcm-font
  Original work: https://ctan.org/pkg/newcomputermodern

The upstream TikZ webview includes local compatibility patches for standalone macro
boundaries and directional loop edges in the two compute bundles. The reproducible
patch script is scripts/patch-renderer.py. Original license notices are retained.
The host integration, formula UI,
selection handling, conflict checks, commands and packaging are new in this project.
The TikZc webview also bundles MathLive 0.107.1 (MIT),
React (MIT, licenses/react-MIT.txt), and MathJax code
(Apache-2.0, licenses/mathjax-Apache-2.0.txt), among other dependencies.
The vendor bundles retain their embedded notices, including those for
html2canvas, jsPDF dependencies, and DOMPurify.
Runtime network access and native TeX execution are disabled by the new host.

Upstream source for reproducibility: the tikzc v0.3.3 tag and official npm mathlive@0.111.1.
The newer TikZc 1.x release uses a different native Rust backend; it is not used here.
