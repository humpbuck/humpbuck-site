/** `next/image`: avoid optimizer edge cases on these CDNs. */
export function shouldUnoptimizeAvatarUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return (
    url.includes("i.pravatar.cc") ||
    url.includes("gravatar.com") ||
    url.includes("api.dicebear.com")
  );
}
