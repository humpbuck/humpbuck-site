# 网站约定与要求（项目内长期记录）

本文件在仓库里**长期保存**你对站点的要求与和助手达成的约定，方便新开对话、换机器、或交给别人接着做时，**不依赖聊天工具本身的历史记录**（例如 Cursor / Codex 的对话不会自动同步进 Git）。

> **说明**  
> - 这里记录的是**结论与规则**，不是逐字聊天记录（完整对话会很长，也不适合进版本库）。重要对话结束后，请把新约定**追加**到下方对应小节，或写在「变更记录」里。  
> - 若你希望某次讨论一字不漏保留，可手动复制到本文件底部「附：原始摘录」或你自己的笔记。

## 0. 改站与协作原则（防「随便改站」、减少莫名 bug）

- **默认不改代码**：只有当你在**当次对话里明确说要改**（例如修某个 bug、加某功能、调某处文案）时，助手才应修改仓库里的实现；只是提问、要解释、要方案时，**以文字回答为主，不为了「顺手」去改站**。  
- **以书面约定为准**：对你站点「应该是什么样」的判断，以 **`docs/user-conventions.md` + 你在下面「可编辑」里写的** 为准，并参考 `AGENTS.md` 中的 Humpbuck 段；**不要**凭印象改行为，有歧义时先问一句再改。  
- **能小改就小改**：确需动代码时，**只动完成任务所必需的文件和行数**，不顺带「整理代码」、不扩大范围、不主动升级依赖。  
- Cursor 在仓库中启用了项目规则：`.cursor/rules/humpbuck-stability.mdc`（**始终生效**），用于约束助手的改动力度；在 Codex 中也应遵守同样的稳定性原则。

## 1. 读我顺序

1. 本文件 + `AGENTS.md` 里的 *Humpbuck — persistent notes*  
2. 实现细节以代码和 `prisma` / `.env.example` 为准

## 1.1 Codex 协作默认方式

- **可以直接用自然语言提需求**：例如“把首页 hero 文案改得更像美国站”“检查一下评论为什么前台没显示”“给产品页加一个 FAQ 区块”“这个报错帮我定位并修好”。
- **Codex 开始前先读约定和现有实现**：先看本文件与 `AGENTS.md`，再到仓库里确认真实实现位置；不要按旧版 Next.js 习惯直接下手。
- **默认流程是「改完停本地」**：完成修改并跑必要检查后，先汇报改了什么、有没有风险；**不自动 `commit`，不自动推送**。
- **只有你明确要求时才 `commit`**：未明确要求时，保留本地改动供你确认。
- **只有你明确说“同步到 GitHub”时才推送**：推送前仍需按本文件第 5 节核对 remote / SSH，再推到 `origin main`，由 Vercel 按现有设置自动部署。
- **如果你只是问方案、原因或实现方式**：先以文字分析为主，不直接改代码；只有你明确说“帮我改”时，才进入修改流程。
- **涉及 Prisma / Neon / Vercel 的变更**：除代码修改外，还应一并检查是否需要本地迁移、Vercel 环境变量调整，以及生产环境与 Neon 的连通性；未经你要求，不做危险操作。

## 2. 商品 PDP 与 R2 媒体

- **商品媒体以管理后台为准**：`gallery` / `detail` / `variants` / `promoVideo` 里填的 R2（或 HTTPS）链接即为前台展示来源（见 `resolveStorefrontProductMedia` in `lib/r2-pdp-media.ts`）。仅当某块在后台**留空**时，才按 `R2_GALLERY_SPECS_BY_SLUG` 对桶做 ListObjects / HEAD 发现补全。
- 桶内文件命名约定仍适用于「自动发现」兜底；在配置了 R2 S3 API 凭据时，用 **ListObjects** 列出（凭据同评论上传，见 `.env.example`）。  
- 部署 **Vercel** 时需在项目环境变量中配置 `DATABASE_URL`、R2 相关变量及（若与默认不同）`NEXT_PUBLIC_R2_PUBLIC_BASE`；公网 R2 若用自有域名，需在 `next.config.ts` 的 `images.remotePatterns` 中允许该 `hostname`，否则 `next/image` 可能不显示。  
- **前台图片**：凡展示 R2 公网 URL 的模块，应使用 `components/site/storefront-image.tsx` 的 **`StorefrontImage`**（不要用裸 `next/image` + 手写 `unoptimized`）。它会自动对 `isR2PublicObjectUrl` 为真的地址直连 R2，避免部分手机经 `/_next/image` 代理烂图。头像仍用 `ReviewerAvatar` / `HeaderUserAvatar` 等既有逻辑。  
- 目录里的 **`slug` 与商品 URL 一致**（如 `digitemp-2301`），与 R2 控制台文件夹名一致即可。

## 3. 评论与头像

- **页面上能看到的评论**来自数据库表 `ProductReview`（Prisma），**不是**扫 R2 的 `reviews/` 目录。仅有 R2 文件夹而没有数据库记录，PDP 仍会显示 “No reviews yet”。  
- 本地/新库在迁移后需要演示数据时：`npm run db:seed-reviews`（每品约 5–8 条、五星、主贴无图，见 `prisma/seed-reviews.ts`）。  
- 用户上传的**评论图**：压缩并 WebP 后走 presign 上传到 R2，路径规则为 `reviews/{slug}/…`，其中 **`{slug}` 为商品 URL slug**（与 `lib/catalog` 一致），**不要**用长商品标题作文件夹名，否则与 `lib/r2-review-upload.ts` 中逻辑不一致。  
- **头像（顶栏 = 评论）**：`User.image` 有值 → 本站图（R2 或 30 个**内置**预设 PNG，路径 `Avatar/avatars-default/avatars 01.png`…）；**为空**且允许 Gravatar → **Gravatar**（`lib/avatar-resolve.ts`）。否则 → **首字母**。旧数据可 `npm run db:fix-review-avatars`。

## 4. 数据库与迁移

- 结构变更用 Prisma 迁移；新环境在跑种子前执行：`npm run db:migrate`（通过 `scripts/migrate-with-env.ts` 加载 `.env` / `.env.local` 中的 `DATABASE_URL`）。

## 5. Git / GitHub 同步（本机双站独立 SSH）

**工作区即同步目标（最重要）：** 当前助手所在的**工作区是哪个仓库文件夹**，你说「同步到 GitHub」就**只同步该仓库**到其对应的 GitHub remote——**不要**推另一个站。

| 当前工作区文件夹 | 只同步到 |
|------------------|----------|
| `humpbuck-site` | `ouhao2016-creator/humpbuck-site` |
| `sadhakashop-site` | `sadhakashop-website/sadhakashop-website` |

助手应先确认工作区路径（或 `git remote -v`）再操作；**禁止**在 humpbuck 工作区推 sadhakashop，或反过来。

本机同时维护 **humpbuck-site** 与 **sadhakashop-site**，各自 GitHub 账号与 SSH 密钥**必须独立**，互不串用。配置在 **`C:\Users\Administrator\.ssh\config`**（换机器时需按同样规则重建）。

| 仓库 | GitHub 账号 | `git remote` Host 别名 | 本机私钥 | GitHub 上密钥 Title |
|------|-------------|-------------------------|----------|---------------------|
| **humpbuck-site** | `ouhao2016-creator` | `github.com-humpbuck` | `~/.ssh/id_ed25519` | `humpbuck` |
| **sadhakashop-site** | `sadhakashop-website` | `github.com-sadhakashop` | `~/.ssh/id_ed25519_sadhakashop` | （sadhakashop 专用） |

**humpbuck 以 GitHub 为准：** GitHub 上 `humpbuck` 密钥指纹为 `SHA256:0v8+sG9YkiVKYgS0/gX/8sJDoMg3ZEgxodBjTHRAHnw`，对应本机 **`id_ed25519`**（注释 `ouhao2016@gmail.com`）。**不要**把 `~/.ssh/id_ed25519_humpbuck` 当作 humpbuck 的推送密钥（那是另一把未登记密钥，会导致 `Permission denied`）。

**humpbuck-site 远程地址（已固定，勿改成 `git@github.com:`）：**

```text
git@github.com-humpbuck:ouhao2016-creator/humpbuck-site.git
```

**在 `humpbuck-site` 工作区说「同步到 GitHub」时，助手应：**

1. 确认当前目录是 **humpbuck-site**（`git remote -v` 含 `github.com-humpbuck`）  
2. `git status` / `git diff` / `git log -1` 确认待提交内容  
3. 仅在你明确要求时 `git commit`（勿擅自提交）  
4. 推送前验证：`ssh -T git@github.com-humpbuck`（应出现 `Hi ouhao2016-creator!`）  
5. `git push origin main`  
6. 若 SSH 失败：**先查**是否误用 `id_ed25519_humpbuck` 或 remote 是否丢失 `-humpbuck` 后缀；**不要**擅自换 GitHub 上的公钥，以 GitHub 已登记的 `id_ed25519` 为准调整 `~/.ssh/config`

**在 `sadhakashop-site` 工作区**的同步步骤见该仓库 `docs/user-conventions.md` §5（`github.com-sadhakashop` + `id_ed25519_sadhakashop`）。

**Prisma 迁移后推送：** 若改了 `schema.prisma`，部署前需在本地跑过 `npm run db:migrate`；Vercel 生产环境需能连同一套 Neon。

## 6. 变更记录（由你或助手在重要会话后追加）

| 日期 | 摘要 |
|------|------|
| 2026-04-23 | 建立本文件；约定：评论以 DB 为准、R2 评论图按 slug 分文件夹、PDP 媒体在具备 R2 API 时按桶内列表动态同步；Vercel 需配置环境变量。 |
| 2026-04-23 | 增加「非请求不随改、最小 diff」的协作原则；添加 `.cursor/rules/humpbuck-stability.mdc` 以稳定站点、减少无关改动。 |
| 2026-05-19 | 前台统一 `StorefrontImage`：R2 图直连 CDN，不经 `/_next/image`（修复部分手机主页/系列 hero 烂图）。 |
| 2026-05-19 | 新增前台语言 **ar**（阿拉伯语，RTL）；文案见 `messages/ar.json` 等，构建脚本 `scripts/build-ar-locale.mjs`。 |
| 2026-06-18 | 降 Vercel Fluid CPU：PDP 评论改 `unstable_cache`（去掉 `noStore`/`auth()` 动态化）；ISR 60s→300s；Blog/视频页改 ISR。 |
| 2026-06-18 | 停用自研访客统计（`/api/analytics/event` 不再写 Neon）；流量看 GA + Vercel Analytics；checkout 归因仍用 `traffic-attribution` 本地存储；移除商家后台 Traffic 页。 |
| 2026-06-21 | 记录本机双站 GitHub SSH：`humpbuck` 用 `github.com-humpbuck` + `~/.ssh/id_ed25519`（指纹与 GitHub 密钥 `humpbuck` 一致）；勿用 `id_ed25519_humpbuck`。 |
| 2026-06-21 | 约定：**当前 Cursor 工作区是哪个站，说「同步」就只推该站**；两站 remote/SSH 互不串用。 |
| 2026-06-29 | 增加 Codex 协作默认方式：可直接口语化提需求；Codex 先读约定与现有实现；默认改完停本地，不自动 commit、不自动推送；只有明确说“同步到 GitHub”时才按本文件第 5 节执行推送。 |

## 7. 附：你希望追加的个人要求（可编辑）

（在此下方向下写即可，例如：品牌措辞、不能出现的用语、定价比对规则、客服流程等。）

```

```
