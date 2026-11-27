export interface PodcastDefinition {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

/** The shows that exist at launch. A new episode topic that is not listed here is rejected. */
export const PODCASTS: readonly PodcastDefinition[] = [
  {
    slug: 'tech',
    name: 'Daily Diff',
    description: 'What changed in technology today: AI, programming, security and hardware.',
    sortOrder: 0,
  },
  {
    slug: 'rest',
    name: 'Loose Ends',
    description: 'Everything that is not technology: world, politics, economy, science, culture and sport.',
    sortOrder: 1,
  },
];

export function findPodcastDefinition(slug: string): PodcastDefinition | undefined {
  return PODCASTS.find((podcast) => podcast.slug === slug);
}
