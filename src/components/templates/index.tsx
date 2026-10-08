import type { PublicSite } from "@/lib/sites/public";
import type { TemplateId } from "@/lib/types";
import Bold from "./Bold";
import Classic from "./Classic";
import Split from "./Split";

const TEMPLATE_COMPONENTS: Record<TemplateId, typeof Bold> = { bold: Bold, classic: Classic, split: Split };

export function SiteTemplate({ site, template }: { site: PublicSite; template?: TemplateId }) {
  const Component = TEMPLATE_COMPONENTS[template ?? site.template] ?? Bold;
  return <Component site={site} />;
}
