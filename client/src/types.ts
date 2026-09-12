export interface Beer {
  id: number;
  name: string;
  brewery: string | null;
  avgScore: number;
  ratingCount: number;
  createdAt: string;
}

export interface RatingDto {
  person: string;
  score: number;
}

export interface Tasting {
  id: number;
  beerId: number;
  beerName: string;
  brewery: string | null;
  food: string | null;
  createdAt: string;
  avgScore: number;
  ratings: RatingDto[];
}

export interface PersonStat {
  person: string;
  avgScore: number;
  count: number;
}

export const PERSONS = ["Adam", "Emil", "Victor"] as const;
export type Person = (typeof PERSONS)[number];

export interface NewTastingPayload {
  beerId?: number;
  beerName?: string;
  brewery?: string;
  food: string;
  scores: Record<Person, number>;
}

export interface UpdateTastingPayload {
  food: string;
  scores: Record<Person, number>;
}
