# 网站约定与要求（项目内长期记录）

本文件在仓库里**长期保存**你对站点的要求与和助手达成的约定，方便新开对话、换机器、或交给别人接着做时，**不依赖 Cursor 的聊天记录**（Cursor 不会自动把对话同步进 Git）。

> **说明**  
> - 这里记录的是**结论与规则**，不是逐字聊天记录（完整对话会很长，也不适合进版本库）。重要对话结束后，请把新约定**追加**到下方对应小节，或写在「变更记录」里。  
> - 若你希望某次讨论一字不漏保留，可手动复制到本文件底部「附：原始摘录」或你自己的笔记。

## 0. 改站与协作原则（防「随便改站」、减少莫名 bug）

- **默认不改代码**：只有当你在**当次对话里明确说要改**（例如修某个 bug、加某功能、调某处文案）时，助手才应修改仓库里的实现；只是提问、要解释、要方案时，**以文字回答为主，不为了「顺手」去改站**。  
- **以书面约定为准**：对你站点「应该是什么样」的判断，以 **`docs/user-conventions.md` + 你在下面「可编辑」里写的** 为准，并参考 `AGENTS.md` 中的 Humpbuck 段；**不要**凭印象改行为，有歧义时先问一句再改。  
- **能小改就小改**：确需动代码时，**只动完成任务所必需的文件和行数**，不顺带「整理代码」、不扩大范围、不主动升级依赖。  
- Cursor 在仓库中启用了项目规则：`.cursor/rules/humpbuck-stability.mdc`（**始终生效**），用于约束助手的改动力度。

## 1. 读我顺序

1. 本文件 + `AGENTS.md` 里的 *Humpbuck — persistent notes*  
2. 实现细节以代码和 `prisma` / `.env.example` 为准

## 2. 商品 PDP 与 R2 媒体

- 商品主图/变体/细节/视频应与 **Cloudflare R2** 中 `products/{slug}/` 下实际文件**一致**；在配置了 R2 S3 API 凭据时，用 **ListObjects** 动态列出，数量与桶内一致（见 `lib/r2-pdp-media.ts`；凭据同评论上传，见 `.env.example`）。  
- 部署 **Vercel** 时需在项目环境变量中配置 `DATABASE_URL`、R2 相关变量及（若与默认不同）`NEXT_PUBLIC_R2_PUBLIC_BASE`；公网 R2 若用自有域名，需在 `next.config.ts` 的 `images.remotePatterns` 中允许该 `hostname`，否则 `next/image` 可能不显示。  
- 目录里的 **`slug` 与商品 URL 一致**（如 `digitemp-2301`），与 R2 控制台文件夹名一致即可。

## 3. 评论与头像

- **页面上能看到的评论**来自数据库表 `ProductReview`（Prisma），**不是**扫 R2 的 `reviews/` 目录。仅有 R2 文件夹而没有数据库记录，PDP 仍会显示 “No reviews yet”。  
- 本地/新库在迁移后需要演示数据时：`npm run db:seed-reviews`（每品约 5–8 条、五星、主贴无图，见 `prisma/seed-reviews.ts`）。  
- 用户上传的**评论图**：压缩并 WebP 后走 presign 上传到 R2，路径规则为 `reviews/{slug}/…`，其中 **`{slug}` 为商品 URL slug**（与 `lib/catalog` 一致），**不要**用长商品标题作文件夹名，否则与 `lib/r2-review-upload.ts` 中逻辑不一致。  
- **头像（顶栏 = 评论）**：`User.image` 有值 → 本站图（R2 或 30 个 **Open Peeps 风** 预设，DiceBear `open-peeps`，见 [openpeeps.com](https://www.openpeeps.com/)）；**为空**且允许 Gravatar → **Gravatar**（`lib/avatar-resolve.ts`）。否则 → **首字母**。旧数据可 `npm run db:fix-review-avatars`。

## 4. 数据库与迁移

- 结构变更用 Prisma 迁移；新环境在跑种子前执行：`npm run db:migrate`（通过 `scripts/migrate-with-env.ts` 加载 `.env` / `.env.local` 中的 `DATABASE_URL`）。

## 5. 变更记录（由你或助手在重要会话后追加）

| 日期 | 摘要 |
|------|------|
| 2026-04-23 | 建立本文件；约定：评论以 DB 为准、R2 评论图按 slug 分文件夹、PDP 媒体在具备 R2 API 时按桶内列表动态同步；Vercel 需配置环境变量。 |
| 2026-04-23 | 增加「非请求不随改、最小 diff」的协作原则；添加 `.cursor/rules/humpbuck-stability.mdc` 以稳定站点、减少无关改动。 |

## 6. 附：你希望追加的个人要求（可编辑）

（在此下方向下写即可，例如：品牌措辞、不能出现的用语、定价比对规则、客服流程等。）

```

```
