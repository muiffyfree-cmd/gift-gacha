export function slugify(title: string): string {
  return title
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[/?#%]+/g, "");
}
