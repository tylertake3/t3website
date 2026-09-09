import { getCollection, type CollectionEntry } from 'astro:content';
import copy from '../content/pages/insights.json';

export type Insight = CollectionEntry<'insights'>;

/* A middling silent-reading pace. Counted from the body so an editor never has
   to type a reading time, and it can never disagree with the article. */
const WORDS_PER_MINUTE = 200;

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** The human name for a topic id, from the page's own topic list. */
export function topicLabel(id: string): string {
  return copy.topics.find((topic) => topic.id === id)?.label ?? id;
}

/** Live articles, newest first. Drafts never leave the editor. */
export async function publishedInsights(): Promise<Insight[]> {
  const live = await getCollection('insights', ({ data }) => !data.draft);
  return live.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** The article held at the top of the listing: the newest marked featured,
    or simply the newest if none is. */
export function pickFeatured(articles: Insight[]): Insight | undefined {
  return articles.find((article) => article.data.featured) ?? articles[0];
}

/** Same topic first, then whatever is newest, never the article itself. */
export function relatedTo(article: Insight, all: Insight[], limit = 4): Insight[] {
  const others = all.filter((entry) => entry.id !== article.id);
  const sameTopic = others.filter((entry) => entry.data.topic === article.data.topic);
  const rest = others.filter((entry) => entry.data.topic !== article.data.topic);
  return [...sameTopic, ...rest].slice(0, limit);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** Machine-readable date for <time datetime> and structured data. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
