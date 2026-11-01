# 海纳文档站

VitePress 平台文档站，读者是**部署实施与行内运维**。本仓承载海纳平台下各应用**可对外开放**的
「装、配、运维」文档，按应用分节；当前仅收录 OneFolio（访前一页纸）。
本仓是站点内容的**唯一来源**。
（本仓内容会同步到公开的 GitHub 发布仓，**不要写入任何内部地址**：应用仓路径、
制品库域名、项目/客户代号、内网地址。）

- 各应用仓只保留 `docs/`（开发者文档：架构决策、审计报告等），不在本仓；
- 本仓**不硬编码任何内部地址**（仓库路径、制品库域名、项目代号一律用占位符）——
  应用仓私有、本站公网可见，两者边界不同；
- 内容只放「装、配、运维」，每条结论都对应可执行命令或界面位置。

## 目录结构（按应用分区）

```text
.
├── index.md                  # 平台首页：应用索引，不属于任何应用
├── onefolio/                 # 应用 OneFolio，URL 前缀 /onefolio/
│   ├── index.md              # 应用首页
│   ├── guide/                # 装 / 配 / 运维 / 排障
│   └── api/                  # API 参考
├── artifacts/onefolio/       # 该应用发版时推送的配置面工件
├── .vitepress/config.mts     # 站点配置：nav 平铺应用、sidebar 按路径前缀分派
└── scripts/                  # 配置项覆盖校验
```

**单次构建、按路径分区**，不拆多站：一次 `pnpm build` 出全部应用的页面，
各自挂在 `/<应用名>/` 下。

### 接入新应用

1. 建 `<应用名>/` 目录，放 `index.md` + 该应用的页面（URL 前缀就是目录名）；
2. `.vitepress/config.mts` 的 `nav` 平铺加一行；
3. 同一文件的 `sidebar` 加一段 `'/<应用名>/': [...]`；
4. 若该应用有配置面工件，放 `artifacts/<应用名>/`，并在 workflow 校验步骤里加一道。

已有应用的 URL 不受影响——这正是按目录分区而不是每个应用一个仓/一个站的原因。

## 本地预览

```bash
pnpm install          # 首次
pnpm dev              # http://localhost:5173
pnpm build            # 产物：.vitepress/dist
pnpm preview          # 预览构建产物
```

## 配置项覆盖校验（发版前的闸门）

```bash
# 工件由应用仓发版时推送（artifacts/onefolio/config-surface.json，随 tag 更新）
pnpm check:config:surface

# 手工导出一份工件（无应用仓环境时）需在应用仓执行：
#   node scripts/export-config-surface.mjs
```

规则：工件里出现的**每个配置项名称**都必须能在 `onefolio/guide/configuration.md` 找到说明。
新增环境变量却漏写文档时校验失败——这类漏配在交付现场的表现是「客户按文档配完起不来」。

工件只含变量名与必填标记、**不含取值**，因此可以安全跨仓传递；
两侧各有一份等价的解析实现（应用仓 `scripts/lib/config-surface.mjs`、本仓
`scripts/config-surface.mjs`），契约是工件的 JSON 结构（`schemaVersion`），不做源码同步。

## 关联链路

```text
应用仓（私有，不在本仓文档中给出地址）
  │  打 tag：导出 config-surface.json → 推送到本仓 artifacts/<应用名>/
  ▼
本仓 haina-docs · 内容源（私有，CNB）
  │  push → git-sync 单向同步
  ▼
发布源（github.com/h1s97x/haina-docs，公开）
  │  Actions：校验配置项覆盖 → 构建 → 发布
  ▼
GitHub Pages → https://h1s97x.github.io/haina-docs/
```

| 角色           | 负责                                     | 不负责                 |
| -------------- | ---------------------------------------- | ---------------------- |
| 应用仓         | 导出并推送配置面工件（版本对齐的事实源） | 不构建、不发布站点     |
| 本仓（内容源） | 唯一内容编辑入口，提交即同步             | 不做发布前校验         |
| GitHub 发布仓  | 校验配置项覆盖 + 构建 + 发布 Pages       | 不编辑内容（只被消费） |

校验闸放在发布源，是因为「源码仓暴露的配置项是否都有文档」只有在文档仓才检得全；
放在发布前而不是源码仓，能保证**任何一次发布都经过这道闸**。

## 发布细节

| 项         | 说明                                                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 站点地址   | `https://h1s97x.github.io/haina-docs/`（项目站点，位于 `/<repo>/` 子路径，workflow 用 `github.event.repository.name` 自动传 `--base`，仓改名无需改 workflow）                                                 |
| 入口链接   | `DOCS_REPO_URL`（仓库入口）、`DOCS_EDIT_LINK`（「编辑此页」前缀）由 workflow 注入。两个平台路径格式不同（GitHub `/blob/main`、CNB `/-/blob/main`），所以前缀由环境给出、不在配置里猜平台                    |
| 自定义域名 | 绑定后把 workflow 的 `--base=/.../` 改成 `--base=/`，并在仓内加 `CNAME`                                                                                                                                     |
| cleanUrls  | **默认关闭**：GitHub Pages 不做无扩展名 URL 重写，开启会导致内页 404，因此链接统一带 `.html`。迁到 nginx / Netlify 等支持重写的平台时可设 `CLEAN_URLS=1`（nginx 需 `try_files $uri $uri.html $uri/ =404;`） |
| 404        | VitePress 会生成 `404.html`，GitHub Pages 直接可用                                                                                                                                                          |
| 域名确定后 | 在 `.vitepress/config.mts` 打开 `sitemap.hostname`                                                                                                                                                          |

## 同步注意

- 内容只在**本仓**编辑；`git-sync` 是单向的（本仓 → GitHub 发布仓），不要在 GitHub 侧直接改内容。
- 本仓与 GitHub 发布仓**改名必须成对**：CNB 侧 `.cnb.yml` 的 `target_url`、本 README 里的地址。
  GitHub 侧 workflow 不用改（base 与入口链接都由 `github.repository` 推导）。
- 若本仓出现**重写历史**（rebase / amend / 强制推送），`git-sync` 会因非快进被拒而同步失败
  （GitHub 侧仍是旧提交）。此时需在 GitHub 侧做一次强制更新或重建仓库，之后恢复正常。

## 写作约定

1. **不要复制正文**：事实源是源码仓的 `.env.example` / `docker-compose.yml` 与代码，本站只做汇总与解释。
2. **危险操作必须用 `::: danger` 显式标注**（清卷重来、删表、轮换密钥导致会话失效等）。
3. **每条结论尽量对应可执行命令或界面位置**（哪个页签、哪个文件、哪条命令）。
4. **不写内部信息**：仓库路径、制品库域名、项目/客户代号、内网地址一律用占位符
   （`<镜像仓库>`、`<报告类型 code>` 等）。
