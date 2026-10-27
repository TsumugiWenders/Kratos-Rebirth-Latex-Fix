# Kratos-Rebirth LaTeX Fix

为 Kratos-Rebirth 博客提供构建时的 LaTeX 公式渲染，以及配套的公式排版修复。

项目内置 Markdown 渲染引擎、KaTeX 样式和字体，通过安装脚本接入 Hexo。浏览器直接显示构建好的公式，无需从 CDN 加载公式渲染器或字体。

## 功能

- 支持 `$...$`、`\(...\)` 行内公式。
- 支持 `$$...$$`、`\[...\]` 独立公式，以及 `equation`、`align`、`gather` 等环境。
- 输出 HTML 和 MathML，保留公式的可访问性信息。
- 行内公式与文字基线对齐，避免每个短公式下方出现小滚动条。
- 为独立公式编号预留留白，避免编号的微小溢出触发不必要的滚动条。
- 超出容器宽度的独立公式仍可横向滚动，不会简单隐藏超出的内容。
- 公式颜色继承正文，适配主题的明暗配色。
- 根据 Hexo 的 `root` 配置生成样式资源路径，支持子目录部署。

> 本项目会接管 Hexo 的 Markdown 渲染，不只是添加一份 CSS。已有文章如依赖其他 Markdown 渲染器的扩展语法，需要在部署前检查生成效果。公式语法支持范围由内置 KaTeX 决定，不等同于完整的 LaTeX 排版系统。

## 安装

准备一个已经可以正常构建的 Hexo 博客，以及可用的 Node.js 环境。下面的 GitHub Actions 示例使用 Node.js 24。

在博客目录旁克隆插件，运行安装脚本：

```bash
git clone https://github.com/TsumugiWenders/Kratos-Rebirth-Latex-Fix.git
node Kratos-Rebirth-Latex-Fix/tools/install.js /path/to/your-hexo-blog
```

将 `/path/to/your-hexo-blog` 替换为博客根目录，也就是包含 `_config.yml` 的目录。路径包含空格时请加引号。

插件仓库本身不需要执行 `npm install` 或 `pnpm install`；博客项目的依赖仍需要正常安装。

安装完成后，博客目录中会增加：

```text
your-hexo-blog/
├── scripts/
│   └── kratos-latex.js          # Hexo 加载入口
└── kratos-latex-runtime/
    ├── lib/plugin.js
    ├── vendor/                 # 渲染引擎、CSS 和字体
    ├── LICENSE
    └── THIRD_PARTY_NOTICES.md
```

然后在博客目录重新生成：

```bash
pnpm exec hexo clean
pnpm exec hexo generate
```

使用其他包管理器时，换成对应的 Hexo 调用方式即可。安装脚本可以重复执行以更新插件；如果 `scripts/kratos-latex.js` 已存在且不是本安装器生成的文件，脚本会拒绝覆盖。

## 公式写法

### 行内公式

```markdown
像素 $x_{ij}$ 与类中心 $M_{jk}$ 的差值。

也可以写成 \(x_{ij} - M_{jk}\)。
```

### 独立公式

建议让起止分隔符各占一行：

```markdown
$$
d_{ik}=\sqrt{\sum_{j=1}^{p}(x_{ij}-M_{jk})^2}
$$
```

也支持 `\[` 和 `\]` 分隔符。

### 带编号的公式

```latex
\begin{equation}
R_{\mathrm{rs}}=Qf\frac{b_b}{a+b_b}
\end{equation}
```

不需要编号时可使用 `equation*`。多行对齐示例：

```latex
\begin{align*}
a &= b+c \\
d &= e+f
\end{align*}
```

## 配置

无需配置即可使用。可选配置写入博客根目录的 `_config.yml`，而不是主题配置文件：

```yaml
kratos_latex:
  strict: true
  macros:
    '\RR': '\mathbb{R}'
  markdown:
    html: true
    linkify: true
    typographer: false
    breaks: false
```

宏定义使用 YAML 单引号字符串，反斜杠不需要额外转义。

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `strict` | `true` | 公式解析失败时中止构建，并报告文章路径和错误原因。设为 `false` 后记录警告，以错误代码文本显示无法解析的公式。 |
| `macros` | `{}` | 自定义 KaTeX 宏，可在文章中使用，例如 `$\RR$`。 |
| `markdown.html` | `true` | 允许 Markdown 中的原始 HTML。 |
| `markdown.linkify` | `true` | 自动识别链接。 |
| `markdown.typographer` | `false` | 是否启用 Markdown 排版字符替换。 |
| `markdown.breaks` | `false` | 是否将段落内的普通换行转换成 `<br>`。 |

这里的 `strict` 是插件的错误处理开关，不是 KaTeX 同名选项的透传。渲染引擎固定使用 `trust: false`，不会开放需要信任的 KaTeX 命令。

## 接入 GitHub Actions

如果博客在 GitHub Actions 中构建，可在构建步骤之前加入以下步骤。示例假设 Hexo 项目已签出或准备在 `template/` 中，且博客依赖已经安装：

```yaml
- name: Checkout LaTeX plugin
  uses: actions/checkout@v5
  with:
    repository: TsumugiWenders/Kratos-Rebirth-Latex-Fix
    path: latex-plugin
    persist-credentials: false

- name: Install LaTeX plugin
  run: |
    node "$GITHUB_WORKSPACE/latex-plugin/tools/install.js" \
         "$GITHUB_WORKSPACE/template"

- name: Build site
  working-directory: template
  run: pnpm exec hexo generate
```

插件会随博客构建输出到：

```text
public/assets/kratos-latex/
├── katex.min.css
└── fonts/
```

页面会自动引用对应样式，无需在主题模板中手动插入 `<link>`。

**单独更新插件仓库不会自动触发博客仓库的工作流。** 如果博客工作流只监听自身仓库的 `push` 和 `workflow_dispatch`，更新插件后需要在博客仓库手动运行工作流，或提交博客修改。


## 常见问题

### 为什么有的公式仍有横向滚动条？

超过正文宽度的独立公式会保留横向滚动，这是为了让完整公式和编号都可以查看。本项目修复的是短公式或编号微小溢出造成的多余滚动条，不会将所有滚动条强制隐藏。

手机可用宽度更小，同一条公式在电脑上不滚动、在手机上需要滚动是正常现象。特别长的行内公式建议改为独立公式。

### 公式无样式或字体加载失败

检查构建目录是否包含 `assets/kratos-latex/katex.min.css` 和 `fonts/`，部署时是否上传了整个目录，以及 Hexo 的 `root` 是否与实际部署路径一致。

### 构建提示公式解析错误

默认会停止构建。根据错误中的文章路径检查分隔符、括号和命令是否正确，并确认该命令受内置 KaTeX 支持。需要暂时保留错误文本时，可以设置 `kratos_latex.strict: false`；该设置不会修复语法本身。

### 已安装其他 Markdown 或数学渲染插件

本项目会在初始化结束后再次注册 Markdown 渲染器，以减少插件加载顺序带来的覆盖问题。但这不保证与所有第三方扩展兼容。请检查已有语法和公式效果，避免同一段公式又被前端 MathJax 或 KaTeX 自动渲染脚本重复处理。

## 卸载

从博客目录移除本插件生成的 `scripts/kratos-latex.js` 和 `kratos-latex-runtime/`，并移除工作流中的插件安装步骤。确认博客有可用的 Markdown 渲染器后，清理、重新生成并部署。

## 仓库结构

```text
lib/plugin.js             Hexo 渲染器注册、样式注入和资源输出
tools/install.js          无额外依赖的安装脚本
vendor/engine.cjs         已打包的 Markdown / KaTeX 渲染引擎
vendor/katex/katex.min.css  KaTeX 基础样式与主题适配规则
vendor/katex/fonts/       本地字体
THIRD_PARTY_NOTICES.md    第三方组件及字体许可
```

## 许可证

项目代码使用 [MIT License](LICENSE)。内置第三方组件和字体的许可信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
