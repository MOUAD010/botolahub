import { Link } from "@/lib/i18n/navigation";
import { buildBreadcrumbJsonLd, JsonLd } from "@/lib/seo/jsonld";

export interface BreadcrumbItem {
  name: string;
  /** Every item needs its own real URL for BreadcrumbList JSON-LD, even the
   * current page — only the visual rendering (last item = plain text)
   * differs from that URL's presence. */
  href: string;
}

export function Breadcrumbs({
  items,
  locale,
}: {
  items: BreadcrumbItem[];
  locale: string;
}) {
  const jsonLdItems = items.map((item) => ({
    name: item.name,
    path: `/${locale}${item.href === "/" ? "" : item.href}`,
  }));

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(jsonLdItems)} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <li key={item.name} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < items.length - 1 ? (
                <Link href={item.href} className="hover:text-foreground hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
