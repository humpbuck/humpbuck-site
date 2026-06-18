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
      <h1 className="mt-4 font-serif text-3xl tracking-tight">Blog</h1>
      <p className="mt-2 text-sm text-muted">
        Write and publish articles for the storefront blog. Use R2 or HTTPS URLs for cover
        images. Only <strong>Published</strong> posts appear on the site.
      </p>
      <div className="mt-6">
        <BlogArticleManager initialRows={posts} />
      </div>
    </div>
  );
}
