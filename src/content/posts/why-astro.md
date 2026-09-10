---
title: 为什么选择 Astro 写博客
pubDate: 2026-09-09
description: Astro 的岛屿架构、内容集合和 Markdown 支持，让它成为写博客的好选择。
tags:
  - Astro
  - 前端
---

## 内容优先

Astro 内置 **Content Collections**，可以用 Zod 给文章的 frontmatter 定义类型，
标题、日期、标签写错了在构建时就能发现。

## 默认不发送 JS

Astro 页面默认渲染成纯 HTML，只有你在页面里放入交互组件（"岛屿"）时，
才会加载对应的 JavaScript，博客这种以阅读为主的站点性能特别好。

## 上手简单

新建一篇文章只需要在 `src/content/posts/` 里加一个 `.md` 文件，
首页列表和文章详情页会自动生成，不用改任何路由代码。
