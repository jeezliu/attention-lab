# Attention Lab · 真正理解 Transformer

中文交互式 Transformer 教程。通过概念解释、完整手算、维度追踪、代码示例、交互实验和练习，把公式与实际计算连接起来。

## 学习内容

- 10 节详细课程，62 个讲解小节；每课含回顾、自我解释题和测验。
- 30 道带解析的练习，4 份自评作业。
- 4 个交互实验：注意力、正弦位置编码、张量形状、生成与采样。
- 使用 LaTeX 与 KaTeX 排版公式，数学字体随网站提供，不依赖外部 CDN。
- 课程关联笔记、LaTeX 预览、自动本地保存、JSON 备份导入与导出。

## 本地运行

静态网站入口是 `dist/index.html`，通过 HTTP 服务运行：

```sh
python3 -m http.server 8000 --directory dist
```

打开 `http://localhost:8000/`。浏览网站不需要安装 npm 依赖。

## 验证

使用 Node.js 22.12 或更高版本：

```sh
npm ci --ignore-scripts
npm run check
```

检查课程完整性、答案、注意力计算、因果遮罩、数值稳定性、备份验证、本地存储、课程与实验渲染、312 处 LaTeX 表达式以及本地字体资源。

## 自动部署

`.github/workflows/pages.yml` 配置 GitHub Actions：

1. 向 `main` 推送代码后，自动安装验证依赖并运行检查。
2. 检查通过后，将 `dist/` 发布到 GitHub Pages。
3. Pull Request 只运行检查，不发布；也可在 Actions 页面手动启动部署。

仓库的 **Settings → Pages → Source** 使用 **GitHub Actions**。站点使用相对资源路径与 hash 路由，可部署在 GitHub Pages 项目子路径中。

## 学习记录

笔记、进度、答题记录与作业草稿保存在当前浏览器的 `localStorage` 中，键为 `attention-lab:v1`。应用不向服务器上传这些记录。

浏览器按网站来源隔离数据。若从原 Sites 地址迁移：先在原站的「本地数据设置」导出全部记录，再到 GitHub Pages 网站导入备份。不同地址、设备或浏览器不会自动同步。网站代码更新不会清空同一地址下的学习记录。

## 教学边界

实验使用可检查的教学张量，并非训练后的语言模型。课程区分原论文 Post-LN 结构与练习中的 Pre-LN 实现。Python 作业需要在本地安装 PyTorch 后运行，网站不执行或自动评分 Python。

KaTeX 的第三方许可保留在 `dist/vendor/katex/LICENSE` 中。
