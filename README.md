# Attention Lab · 真正理解 Transformer

中文交互式 Transformer 教程。通过概念解释、完整手算、维度追踪、代码示例、交互实验和练习，把公式与实际计算连接起来。

## 学习内容

- 10 节详细课程，62 个讲解小节；每课含回顾、自我解释题和测验。
- 30 道带解析的练习，4 份自评作业。
- 4 个交互实验：注意力、正弦位置编码、张量形状、生成与采样。
- 使用 LaTeX 与 KaTeX 排版公式，数学字体随网站提供，不依赖外部 CDN。
- 课程关联笔记、LaTeX 预览、自动本地保存、JSON 备份导入与导出。

## 源码与构建

在线学习：<https://jeezliu.github.io/attention-lab/>

应用继续使用原生 HTML、CSS 和 ES Modules，没有引入前端框架或打包器。
**只编辑 `src/`，不要编辑 `dist/`。** `dist/` 是可删除、可重建的产物，不再提交到 Git。

| 位置 | 用途 |
| --- | --- |
| `src/index.html` | 页面入口、资源引用和页脚 Star 入口 |
| `src/app.js` | 路由、页面交互、实验计算、笔记、学习记录和顶部 Star 入口 |
| `src/content.js` | 课程元数据、阶段、测验答案与解析、作业、Python 参考脚本 |
| `src/course-expanded.js` | 扩展课程正文、LaTeX 核心公式、回顾与自我解释题 |
| `src/math.js` | 公式转换、安全转义与 KaTeX 渲染 |
| `src/styles.css` | 页面与响应式样式 |
| `scripts/build.mjs` | 用 Node 标准库复制源码和锁定版本的 KaTeX，生成完整静态站点 |
| `scripts/serve.mjs` | 本地预览服务，支持根路径和 `/attention-lab/` 项目子路径 |
| `tests/` | 课程/数值/公式/构建检查、浏览器回归与旧版存储样本 |
| `.github/workflows/pages.yml` | PR 验证和 main 分支的 GitHub Pages 发布 |

构建保留原来的相对 URL、文件名和 hash 路由，不压缩、不改写应用代码。
KaTeX 来自 `package-lock.json` 锁定的 npm 包：复制 ES Module、自动渲染模块、CSS、全部字体和 LICENSE 到 `dist/vendor/katex/`，并生成 `.nojekyll`。
依赖解析和复制在临时目录完成后再替换 `dist/`，每次构建会清除旧产物，避免残留已删除的资源。构建不下载 CDN 文件，也不会读取浏览器学习记录。

## 本地开发

使用 Node.js **22.12 或更高版本**（CI 使用 Node 22）：

```sh
npm ci --ignore-scripts
npm run dev
```

打开 <http://localhost:4173/> 或 <http://localhost:4173/attention-lab/>。
`dev` 会先构建一次，再启动预览。**没有自动监听或热更新**；修改源码后，在另一个终端运行 `npm run build`，然后刷新浏览器。

也可以分开执行：

```sh
npm run build
npm run preview
```

预览默认仅监听本机；可通过 `HOST`、`PORT` 环境变量调整。纯静态产物也可以用任意 HTTP 服务运行，例如 `python3 -m http.server 8000 --directory dist`。不建议直接通过 `file://` 打开 ES Module 页面。

## 如何修改课程

1. 修改 `src/content.js` 中对应课程的标题、目标、练习 `checks` 或作业 `assignments`。课程 `id`、题目顺序和作业 `id` 被现有学习记录引用；不要随意重排、复用或更改这些标识。
2. 修改详细讲解时，优先编辑 `src/course-expanded.js` 的 `expandedLessons`。`content.js` 会用这些内容覆盖基础课文的 `sections`、`formula`，并补充 `recap`、`reflect`；只改基础 `sections` 不会改变已有扩展正文。
3. 新公式使用 LaTeX。正文中用 `String.raw` 保留反斜杠，并使用 `\(...\)`（行内）或 `\[...\]`（独立公式）。`formula` 字段直接存放 LaTeX，不加分隔符。例如：

```js
['缩放的原因', String.raw`将分数除以 \(\sqrt{d_k}\)，再计算 softmax。`]
```

4. 练习格式为 `[题目, 选项数组或 null, 正确选项索引或数值, 解析]`；选择题答案索引从 0 开始。当前课程有固定的 10 课/30 题约束，增加课程需要一起更新数据校验、进度 UI 和测试，并考虑旧记录迁移。
5. 运行完整验证，再提交分支和 Pull Request。

## 验证

首次准备浏览器测试环境：

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

`npm test` 会先重新构建并运行 Node 检查，再启动真实 Chromium 测试。运行测试前请停止占用 4173 端口的预览服务，避免误测旧页面。

```sh
npm run check       # 构建、课程/数值/存储校验、312 处 LaTeX、清洁且可重复的构建
npm run test:e2e    # 对当前 dist 做真实浏览器测试；单独使用前先 build
npx playwright show-report
```

浏览器测试在根路径和 `/attention-lab/` 下分别验证：10 课全部答题与持久化进度、错题订正、4 个实验的参数变化和计算结果、4 份作业草稿与自评、Python 脚本下载、笔记保存/公式预览/搜索/删除/导出、旧版 v1 数据读取、备份导出/确认恢复/无效导入、损坏数据保留、跨标签页冲突保护、导航搜索、移动菜单、Star 链接以及本地字体实际加载。
浏览器 JavaScript 错误、公式渲染错误和资源加载失败会使测试失败；不是只检查文件是否存在。

迁移基线为 `5b5f71980b52462995dc821538fd32bd6d019bae`。首次迁移时，生成的全部 71 个文件与该提交的 `dist/` 逐字节一致；后续课程编辑不要求继续与历史内容相同。

## 自动发布

仓库 **Settings → Pages → Source** 保持 **GitHub Actions**。

1. Pull Request 到 `main`：安装锁定依赖和 Chromium，重新生成 `dist/`，运行所有测试，保留浏览器报告；**不部署**。
2. 审查并合并 PR 后：`main` 的 push 重新执行同样的构建和测试。
3. 全部通过后，上传这次构建的 `dist/`，由独立 deploy job 发布到 GitHub Pages。
4. 手动 `workflow_dispatch` 也先验证；仅选择 `main` 时允许发布，其它分支只验证。

测试失败时不会部署。可以在 Actions 的 `playwright-report` artifact 中查看报告与失败 trace。推荐为 `main` 设置 PR 和 `verify` 必需检查；工作流本身不会禁止维护者直接推送 main。

## 学习记录兼容性

笔记、进度、答题记录与作业草稿保存在当前浏览器的 `localStorage` 中，键为 `attention-lab:v1`。应用不向服务器上传这些记录。

本次迁移未修改存储代码、键名或数据结构，也不改变 Pages 地址：

- 主键 `attention-lab:v1` 仍为 `{version: 1, data: ...}`。
- `data` 字段保持 `read`、`attempts`、`notes`、`work`、`days`、`lastLesson`、`labVisits`。
- 临时可写探测键仍为 `attention-lab:probe`，探测后立即删除。
- 导出备份仍为 `{app: "attention-lab", version: 1, exportedAt, data}`。

`tests/fixtures/storage-v1.json` 固定了包含中文笔记、测验、进度和作业草稿的旧版兼容样本。

浏览器按网站来源隔离数据。若从原 Sites 地址迁移：先在原站的「本地数据设置」导出全部记录，再到 GitHub Pages 网站导入备份。不同地址、设备或浏览器不会自动同步。网站代码更新不会清空同一地址下的学习记录。

## 教学边界

实验使用可检查的教学张量，并非训练后的语言模型。课程区分原论文 Post-LN 结构与练习中的 Pre-LN 实现。Python 作业需要在本地安装 PyTorch 后运行，网站不执行或自动评分 Python。

KaTeX 的第三方许可保留在 `dist/vendor/katex/LICENSE` 中。
