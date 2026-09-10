---
title: Node.js 异步编程:从回调到 async/await
pubDate: 2026-09-06
description: 回顾 Node.js 异步模型的演变,从回调地狱到 Promise 再到 async/await,以及每种方式的适用场景。
tags:
  - Node.js
  - 前端
---

## 回调时代

最早的 Node.js 异步全靠回调嵌套:

```javascript
fs.readFile('a.txt', (err, data) => {
  fs.readFile('b.txt', (err, data) => {
    fs.readFile('c.txt', (err, data) => {
      // 回调地狱
    });
  });
});
```

层层嵌套,错误处理重复,代码向右延伸,俗称"回调地狱"。

## Promise 登场

Promise 把嵌套改成了链式调用:

```javascript
readFile('a.txt')
  .then(() => readFile('b.txt'))
  .then(() => readFile('c.txt'))
  .catch(err => console.error(err));
```

清爽多了,但逻辑复杂时还是不够直观。

## async/await

现在的主流写法,用同步的思维写异步代码:

```javascript
async function main() {
  try {
    await readFile('a.txt');
    await readFile('b.txt');
    await readFile('c.txt');
  } catch (err) {
    console.error(err);
  }
}
```

可读性最好,推荐作为首选。但理解 Promise 仍然是基础,因为 async/await 本质上是 Promise 的语法糖。
