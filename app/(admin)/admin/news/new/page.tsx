import { NewsEditor } from "@/components/admin/NewsEditor";
import { emptyNewsForm } from "@/lib/admin/news-form";

export default function NewNewsPage() {
  return <NewsEditor initial={emptyNewsForm()} />;
}
