---
title: CSS Grid 布局入门:从零到实战
pubDate: 2026-09-08
description: Grid 布局是现代 CSS 中最强大的二维布局系统,本文从基础概念讲起,配合常见布局场景让你快速上手。
tags:
  - 前端
  - CSS
---

## 什么是 Grid

CSS Grid 是一个**二维**布局系统,可以同时控制行和列。之前用 Flexbox 只能在一个方向上排列元素,而 Grid 让我们可以像画表格一样自由地安排页面结构。

## 基础概念

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 1rem;
}
```

- `grid-template-columns` 定义列数和宽度
- `repeat(3, 1fr)` 表示 3 列,每列等宽
- `gap` 设置单元格之间的间距

## 常见布局

两栏式、三栏式、卡片网格……Grid 都能轻松搞定。配合 `grid-template-areas` 还能用命名区域,可读性极佳。

## 总结

Grid 布局不难,但灵活度很高。建议多写多练,遇到布局问题第一时间想想 Grid 能不能解决。
