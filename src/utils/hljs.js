/**
 * hljs.js —— 按需引入的 highlight.js
 *
 * 直接 `import hljs from 'highlight.js'` 会打包全部 190+ 语言（约 1MB）。
 * 这里用 core + 手动注册常用语言，体积缩减约 80%，覆盖绝大多数博客代码块。
 * 需要新语言时在下面加一行 registerLanguage 即可。
 */
import hljs from 'highlight.js/lib/core';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml'; // HTML / SVG
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import powershell from 'highlight.js/lib/languages/powershell';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import plaintext from 'highlight.js/lib/languages/plaintext';

const languages = {
  javascript,
  typescript,
  xml,
  css,
  scss,
  json,
  python,
  java,
  c,
  cpp,
  csharp,
  go,
  rust,
  php,
  bash,
  shell,
  powershell,
  sql,
  yaml,
  markdown,
  diff,
  dockerfile,
  plaintext
};

for (const [name, lang] of Object.entries(languages)) {
  hljs.registerLanguage(name, lang);
}

// 常见别名
hljs.registerAliases(['js', 'jsx', 'mjs', 'cjs'], { languageName: 'javascript' });
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' });
hljs.registerAliases(['html', 'vue', 'svg'], { languageName: 'xml' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['c++'], { languageName: 'cpp' });
hljs.registerAliases(['cs'], { languageName: 'csharp' });
hljs.registerAliases(['sh', 'zsh', 'console'], { languageName: 'bash' });
hljs.registerAliases(['yml'], { languageName: 'yaml' });
hljs.registerAliases(['md'], { languageName: 'markdown' });
hljs.registerAliases(['text', 'txt'], { languageName: 'plaintext' });

export default hljs;
