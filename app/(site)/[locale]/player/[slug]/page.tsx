import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { type Locale } from "@/lib/i18n/routing";
import { toIntlLocale } from "@/lib/i18n/format";
import { playerRepository, teamRepository } from "@/lib/repositories";
import type { PlayerMatchRating, PlayerSeasonStats } from "@/lib/types";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { PlayerProfileTabs } from "@/components/player/PlayerProfileTabs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { buildPersonJsonLd, JsonLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";
import { ratingToneSoft } from "@/lib/rating";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

// Shared per-request so generateMetadata and the page body don't each fetch
// the same player separately.
const getPlayer = cache((slug: string) => playerRepository.getBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const player = await getPlayer(slug);
  if (!player) return {};

  const description = `${player.name} — profile, season stats and recent ratings.`;

  return {
    title: player.name,
    description,
    alternates: {
      canonical: buildCanonical(locale, `/player/${slug}`),
      languages: buildLanguageAlternates(`/player/${slug}`),
    },
    openGraph: {
      title: player.name,
      description,
      url: buildCanonical(locale, `/player/${slug}`),
      ...(player.photoUrl ? { images: [{ url: player.photoUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: player.name,
      description,
      ...(player.photoUrl ? { images: [player.photoUrl] } : {}),
    },
  };
}

function ageFromId(id: string): number {
  const n = parseInt(id.replace("p", ""), 10) || 0;
  return 20 + (n % 14);
}

function heightFromId(id: string): number {
  const n = parseInt(id.replace("p", ""), 10) || 0;
  return 170 + (n % 20);
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const player = await getPlayer(slug);
  if (!player) notFound();

  const [team, seasonStats, recentRatings, t, tMatch, tCommon, tNav] =
    await Promise.all([
      teamRepository.getById(player.teamId),
      playerRepository.getSeasonStats(player.id),
      playerRepository.getRecentRatings(player.id, 12),
      getTranslations({ locale, namespace: "player" }),
      getTranslations({ locale, namespace: "match" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "nav" }),
    ]);

  const intlLocale = toIntlLocale(locale as Locale);
  const age = player.age ?? ageFromId(player.id);
  const height = player.heightCm ?? heightFromId(player.id);
  const nationality = player.nationality ?? "Morocco";
  const foot = player.preferredFoot ?? "right";
  const rating = seasonStats?.averageRating ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
      <JsonLd
        data={buildPersonJsonLd(
          {
            name: player.name,
            nationality: player.nationality,
            photoUrl: player.photoUrl,
          },
          `/${locale}/player/${slug}`
        )}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("botolaPro"), href: "/botola-pro" },
          ...(team ? [{ name: team.name, href: `/team/${team.slug}` }] : []),
          { name: player.name, href: `/player/${slug}` },
        ]}
      />

      <header className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5">
        {team && (
          <div
            aria-hidden
            className="pointer-events-none absolute -end-6 -top-8 size-40 opacity-[0.07] sm:size-52"
          >
            <Image
              src={team.badgeUrl}
              alt=""
              fill
              className="object-contain"
              unoptimized={team.badgeUrl.startsWith("/media/")}
            />
          </div>
        )}

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <PlayerAvatar
              src={player.photoUrl}
              alt={player.name}
              size={104}
              unoptimized={Boolean(player.photoUrl?.startsWith("/media/"))}
              className="ring-2 ring-border"
            />
            {team && (
              <Link
                href={`/team/${team.slug}`}
                className="absolute -end-1 -bottom-1 flex size-11 items-center justify-center rounded-full border-2 border-card bg-card shadow-md transition-transform hover:scale-105"
                title={team.name}
              >
                <Image
                  src={team.badgeUrl}
                  alt={team.name}
                  width={32}
                  height={32}
                  className="size-8"
                  unoptimized={team.badgeUrl.startsWith("/media/")}
                />
              </Link>
            )}
            {player.shirtNumber > 0 && (
              <span className="absolute -start-1 -top-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                {player.shirtNumber}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-start">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {player.name}
            </h1>
            {team && (
              <Link
                href={`/team/${team.slug}`}
                className="mt-2 inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Image
                  src={team.badgeUrl}
                  alt={team.name}
                  width={28}
                  height={28}
                  className="size-7"
                  unoptimized={team.badgeUrl.startsWith("/media/")}
                />
                {team.name}
              </Link>
            )}

            <dl className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
              <MetaChip label={t("nationality")} value={nationality} />
              <MetaChip
                label={t("age")}
                value={`${age} ${t("years")}`}
              />
              <MetaChip
                label={t("position")}
                value={t(`positions.${player.position}`)}
              />
              <MetaChip label={t("height")} value={`${height} cm`} />
              <MetaChip label={t("preferredFoot")} value={t(`foot.${foot}`)} />
            </dl>
          </div>

          {seasonStats && rating > 0 && (
            <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-5 py-3">
              <span className="text-xs uppercase text-muted-foreground">
                {t("rating")}
              </span>
              <span
                className={cn(
                  "rounded-md px-2.5 py-1 text-2xl font-bold tabular-nums",
                  ratingToneSoft(rating)
                )}
              >
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="flex flex-col gap-5 order-2 lg:order-1">
          <RatingSummaryChart
            ratings={recentRatings}
            title={t("summaryLastMonths")}
            ratingLabel={t("rating")}
          />
          {seasonStats && (
            <SeasonQuickStats
              stats={seasonStats}
              labels={{
                goals: tCommon("goals"),
                assists: t("assists"),
                appearances: t("appearances"),
                yellow: tMatch("yellowCards"),
                red: tMatch("redCards"),
              }}
            />
          )}
        </aside>

        <div className="min-w-0 order-1 lg:order-2">
          <PlayerProfileTabs
            ratings={recentRatings}
            seasonStats={seasonStats}
            team={team}
            seasonLabel={t("seasonLabel")}
            competitionName={tNav("botolaPro")}
            locale={locale as Locale}
            labels={{
              matches: t("matchesTab"),
              season: t("seasonTab"),
              career: t("careerTab"),
              rating: t("rating"),
              goals: tCommon("goals"),
              assists: t("assists"),
              appearances: t("appearances"),
              minutes: t("minutes"),
              yellow: tMatch("yellowCards"),
              red: tMatch("redCards"),
              vs: tCommon("vs"),
              noData: t("noData"),
              seasonOverview: t("seasonOverview"),
              attacking: t("attacking"),
              discipline: t("discipline"),
              perMatch: t("perMatch"),
              contributions: t("contributions"),
              goalsPerMatch: t("goalsPerMatch"),
              assistsPerMatch: t("assistsPerMatch"),
              cards: t("cardsTotal"),
              careerSoon: t("careerSoon"),
            }}
          />
        </div>

        <aside className="flex flex-col gap-5 order-3 lg:sticky lg:top-20 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1">
      <dt className="sr-only">{label}</dt>
      <dd className="text-muted-foreground">
        <span className="text-foreground">{value}</span>
      </dd>
    </div>
  );
}

function SeasonQuickStats({
  stats,
  labels,
}: {
  stats: PlayerSeasonStats;
  labels: {
    goals: string;
    assists: string;
    appearances: string;
    yellow: string;
    red: string;
  };
}) {
  const items = [
    { label: labels.appearances, value: stats.appearances },
    { label: labels.goals, value: stats.goals },
    { label: labels.assists, value: stats.assists },
    { label: labels.yellow, value: stats.yellowCards },
    { label: labels.red, value: stats.redCards },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dl className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RatingSummaryChart({
  ratings,
  title,
  ratingLabel,
}: {
  ratings: PlayerMatchRating[];
  title: string;
  ratingLabel: string;
}) {
  const bars = [...ratings].reverse().slice(-8);
  const max = 10;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex h-36 items-end gap-1.5">
        {bars.map((r) => {
          const pct = (r.rating / max) * 100;
          return (
            <div
              key={r.matchId}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${ratingLabel}: ${r.rating.toFixed(1)}`}
            >
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {r.rating.toFixed(1)}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-sm",
                  r.rating >= 7
                    ? "bg-success"
                    : r.rating >= 6
                      ? "bg-amber-500"
                      : "bg-destructive/70"
                )}
                style={{ height: `${pct}%`, minHeight: 8 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
