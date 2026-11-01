import { defineConfig } from 'vitepress';

/**
 * 海纳（Haina）平台文档站
 *
 * 读者：部署实施 + 行内运维。内容范围刻意收窄为「怎么装、怎么配、怎么运维」，
 * 架构决策 / 审计报告 / 一次性方案属于开发者文档（各应用仓 docs/），不进本站。
 *
 * 收录范围：平台下各应用的**可对外开放**文档，按应用分节；当前仅收录 OneFolio（访前一页纸）。
 *
 * 目录约定（单次构建、按路径分区，不拆多站）：
 *   <应用名>/            一个应用的全部页面，URL 前缀即该目录名，如 /onefolio/guide/quick-start
 *   artifacts/<应用名>/  该应用发版时推送的配置面工件（校验配置项覆盖用）
 *   根 index.md          平台首页（应用索引），不属于任何应用
 *
 * 新增应用 = 加一个目录 + nav 平铺一行 + sidebar 加一段，构建与发布链路不用动。
 *
 * 单一来源约定（重要）：
 * - 环境变量与配置项的事实源是 .env.example / docker-compose.yml / 系统设置页，
 *   本站只做汇总与解释；`pnpm check:docs` 会校验 .env.example 与 compose 里出现的
 *   每个配置项都能在本站配置参考页里找到，防止交付时漏配。
 */

/** 中文分词：MiniSearch 默认按空格切词，纯中文内容会退化成整段一个 token，⌘K 搜不到东西 */
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

/**
 * 文档仓地址（可选，由构建环境注入）。
 *
 * 本站面向公网，**不硬编码任何内部仓库地址**——代码仓是私有的，
 * 把它的路径/项目代号写进站点等于泄漏。未注入时「编辑此页」与仓库入口不渲染；
 * 拆出独立文档仓后由该仓 CI 注入，例如：
 *   DOCS_REPO_URL=https://<代码托管平台>/<org>/<docs-repo>
 */
const docsRepoUrl = process.env.DOCS_REPO_URL?.trim().replace(/\/+$/, '') || '';

/**
 * 「编辑此页」的完整前缀（可选）。
 *
 * 各托管平台的路径格式不同：GitHub 是 `<repo>/blob/main`，CNB 是 `<repo>/-/blob/main`。
 * 这里**不猜平台**，由构建环境直接给前缀，避免生成一个点了 404 的链接（已踩过一次）。
 */
const docsEditLink = process.env.DOCS_EDIT_LINK?.trim().replace(/\/+$/, '') || '';

export default defineConfig({
  lang: 'zh-CN',
  title: '海纳文档',
  titleTemplate: ':title · 海纳文档',
  description: '海纳平台下各应用的私有化部署、配置与运维文档（当前收录 OneFolio 访前一页纸）',
  /**
   * GitHub Pages 对无扩展名 URL 不做重写，开启 cleanUrls 会导致内页 404。
   * 故默认关闭（链接带 .html，任何静态托管都能直接用）；
   * 托管在支持重写的平台（nginx / Netlify / Vercel）时可设 CLEAN_URLS=1 打开。
   */
  cleanUrls: process.env.CLEAN_URLS === '1',
  lastUpdated: true,
  // README 是给维护者看的（怎么本地起、怎么发布），不作为站点页面
  srcExclude: ['README.md'],
  metaChunk: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0f172a' }],
    ['meta', { name: 'robots', content: 'index,follow' }],
  ],
  markdown: {
    lineNumbers: true,
  },
  // 站点域名确定后打开 sitemap（否则生成的 URL 是错的，不如不生成）：
  // sitemap: { hostname: 'https://<正式域名>' },
  themeConfig: {
    nav: [
      // 应用切换器：新增应用时在此平铺一行（应用少时下拉反而多一次点击），
      // 并在下方 sidebar 增加同名路径段。导航不随应用增多而变深。
      { text: 'OneFolio', link: '/onefolio/', activeMatch: '^/onefolio/' },
    ],

    // 每个应用的目录树只在自己的路径前缀下生效，应用之间互不干扰。
    // 用对象形式（而非单个数组）是按路径分派的前提。
    sidebar: {
      '/onefolio/': [
        {
          text: '开始部署',
          collapsed: false,
          items: [
            { text: '交付形态与部署步骤', link: '/onefolio/guide/quick-start' },
            { text: '环境变量与系统设置', link: '/onefolio/guide/configuration' },
            { text: '部署边界与容量', link: '/onefolio/guide/architecture' },
          ],
        },
        {
          text: '日常运维',
          collapsed: false,
          items: [
            { text: '运维总览', link: '/onefolio/guide/operations' },
            { text: '备份与恢复', link: '/onefolio/guide/backup' },
            { text: '升级与回滚', link: '/onefolio/guide/upgrade' },
            { text: '故障排查', link: '/onefolio/guide/troubleshooting' },
          ],
        },
        {
          text: '参考',
          collapsed: false,
          items: [{ text: 'API 参考', link: '/onefolio/api/' }],
        },
      ],
    },

    // 搜索：本地索引（构建期生成，不依赖任何外部服务，离线/内网同样可用）
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              [...segmenter.segment(text)]
                .filter((s) => s.isWordLike)
                .map((s) => s.segment),
            processTerm: (term: string) => term.toLowerCase(),
          },
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },

    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,
    // 未配置时不给编辑入口：宁可不显示，也不指向一个点了会 404 的地址
    editLink: docsEditLink
      ? { pattern: `${docsEditLink}/:path`, text: '在仓库中编辑此页' }
      : undefined,
    footer: {
      message: '海纳平台文档 · 内容源单向同步至发布仓',
      copyright: '海纳（Haina）',
    },
    socialLinks: docsRepoUrl ? [{ icon: 'github', link: docsRepoUrl }] : [],
  },
});
