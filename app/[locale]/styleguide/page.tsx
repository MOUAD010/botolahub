import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Style Guide",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const colorTokens = [
  {
    label: "Background / Foreground",
    swatch: "bg-background text-foreground border border-border",
  },
  { label: "Card", swatch: "bg-card text-card-foreground" },
  { label: "Primary (brand red)", swatch: "bg-primary text-primary-foreground" },
  { label: "Success (brand green)", swatch: "bg-success text-success-foreground" },
  { label: "Secondary", swatch: "bg-secondary text-secondary-foreground" },
  { label: "Muted", swatch: "bg-muted text-muted-foreground" },
  { label: "Accent", swatch: "bg-accent text-accent-foreground" },
  {
    label: "Destructive (soft fill)",
    swatch: "bg-destructive/10 text-destructive",
  },
  {
    label: "Link (mode-aware text)",
    swatch: "bg-card text-link border border-border",
  },
];

const fluidSizes = [
  { cls: "text-fluid-sm", label: "fluid-sm" },
  { cls: "text-fluid-base", label: "fluid-base" },
  { cls: "text-fluid-lg", label: "fluid-lg" },
  { cls: "text-fluid-xl", label: "fluid-xl" },
  { cls: "text-fluid-2xl", label: "fluid-2xl" },
  { cls: "text-fluid-3xl", label: "fluid-3xl" },
  { cls: "text-fluid-4xl", label: "fluid-4xl" },
  { cls: "text-fluid-score", label: "fluid-score (match scores)" },
];

export default async function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-8 sm:px-6 xl:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Style Guide
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Internal reference for KooraLive design tokens and base
          components. Not linked from navigation, excluded from search
          indexing.
        </p>
      </header>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.label} className="flex flex-col gap-2">
              <div
                className={`flex h-20 items-center justify-center rounded-lg text-sm font-medium ${token.swatch}`}
              >
                Aa
              </div>
              <div className="text-xs text-muted-foreground">
                {token.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <SwatchDot className="bg-live" label="live (pulse accent)" />
          <SwatchDot className="bg-destructive" label="relegation zone" />
          <SwatchDot className="bg-success" label="continental zone" />
        </div>
      </Section>

      <Separator />

      <Section title="Typography — fluid scale">
        <div className="flex flex-col gap-3">
          {fluidSizes.map((size) => (
            <div
              key={size.cls}
              className="flex flex-col gap-1 border-b border-border pb-3 last:border-0"
            >
              <span className={`${size.cls} font-semibold tracking-tight`}>
                Wydad AC 2–1 Raja CA
              </span>
              <span className="text-xs text-muted-foreground">
                {size.label} — resize the viewport to see it scale
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Note: interactive touch targets are bumped to 44×44px on mobile via
          explicit sizing (e.g. header icon buttons use{" "}
          <code>size-11 sm:size-8</code>), independent of this base button
          scale.
        </p>
      </Section>

      <Separator />

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="default">LIVE 62&apos;</Badge>
          <Badge variant="success">W</Badge>
          <Badge variant="destructive">Relegation</Badge>
          <Badge variant="secondary">FT</Badge>
          <Badge variant="outline">Upcoming</Badge>
        </div>
      </Section>

      <Separator />

      <Section title="Tabs">
        <Tabs defaultValue="overview" className="max-w-md">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3">
            Overview panel content.
          </TabsContent>
          <TabsContent value="lineups" className="pt-3">
            Lineups panel content.
          </TabsContent>
          <TabsContent value="stats" className="pt-3">
            Stats panel content.
          </TabsContent>
        </Tabs>
      </Section>

      <Separator />

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-end">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Wydad AC</TableCell>
              <TableCell className="text-end">42</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>Raja CA</TableCell>
              <TableCell className="text-end">39</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Separator />

      <Section title="Skeleton">
        <div className="flex max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function SwatchDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        aria-hidden="true"
        className={`inline-block size-3 rounded-full ${className}`}
      />
      {label}
    </div>
  );
}
