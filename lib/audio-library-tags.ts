/** Shared tag vocabulary for library upload suggestions and filter chips. */
export const LIBRARY_TAG_FILTERS = [
  "Lobby",
  "Elevator",
  "Retail",
  "Relaxing",
  "Energetic",
] as const;

export type LibraryTagFilter = (typeof LIBRARY_TAG_FILTERS)[number];
