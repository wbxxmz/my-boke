import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// RSS 2.0：订阅入口 /my-boke/rss.xml
// 注意：base 为 /my-boke，链接必须带前缀，否则订阅器会打到根路径 404
export async function GET(context: APIContext) {
  const posts = (await getCollection('posts')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/';

  return rss({
    title: 'wbxxmz 的博客',
    description: '一个用 Astro 搭建的个人博客：ROS2 学习日志与 AI 选型',
    site: new URL(base, context.site!),
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `posts/${post.id}/`,
    })),
    customData: '<language>zh-CN</language>',
  });
}
