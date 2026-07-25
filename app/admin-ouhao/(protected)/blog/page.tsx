import { AdminBackLink } from "@/components/admin/admin-back-link";
import { BlogArticleManager } from "@/components/admin/blog-article-manager";
import { adminPath } from "@/lib/admin-path";
import { listBlogPostsAdmin } from "@/lib/blog-posts";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();
  return (
    <div>
      <AdminBackLink href={adminPath()} label="Overview" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">Blog</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Write articles for the storefront Blog page. Paste R2 image/video URLs into
        the editor. Attach products from the dropdown below.
      </p>
      <div className="mt-6">
        <BlogArticleManager initialRows={posts} />
      </div>
    </div>
  );
}
