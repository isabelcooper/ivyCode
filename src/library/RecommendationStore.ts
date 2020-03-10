import {Random} from "../../utils/Random";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Dates} from "../../utils/Dates";

enum RecommendationCategory {
  Book = "book",
  Article = "article",
  Podcast = "podcast",
  Film = "film",
  Exercise = "exercise"
}

const categories = [
  RecommendationCategory.Article,
  RecommendationCategory.Book,
  RecommendationCategory.Exercise,
  RecommendationCategory.Film,
  RecommendationCategory.Podcast
];

export interface Recommendation {
  title: string,
  date: Date,
  userId: number,
  category: RecommendationCategory,
  length: number //mins
}

export function buildRecommendation(partial?: Partial<Recommendation>): Recommendation {
  return {
    title: Random.string('title'),
    date: Random.date(),
    userId: Random.integer(),
    category: Random.oneOf(categories),
    length: Random.integer(1000), //mins
    ...partial
  }
}

export interface RecommendationStore {
  store(recommendation: Recommendation): Promise<Recommendation | undefined>;
}

export class InMemoryRecommendationStore implements RecommendationStore {
  public recommendations: Recommendation[] =[];

  async store(recommendation: Recommendation): Promise<Recommendation | undefined> {
    this.recommendations.push(recommendation);
    return recommendation;
  }
}

export class AlwaysFailsRecommendationStore implements RecommendationStore {
  async store(recommendation: Recommendation): Promise<Recommendation| undefined> {
    throw Error('store broken on user: ' + recommendation)
  }
}

export class SqlRecommendationStore implements RecommendationStore {
  constructor(private database: PostgresDatabase) {}

  async store(recommendation: Recommendation): Promise<Recommendation | undefined> {
    const formattedDate = `'${Dates.format(recommendation.date, Dates.YYYY_DASH_MM_DASH_DD_HH_MM_SS)}'`;
    const sqlStatement = `
      INSERT INTO recommendations (title, user_id, category, length, date) 
      VALUES ('${recommendation.title}','${recommendation.userId}','${recommendation.category}', ${recommendation.length}, ${formattedDate}) 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      title: row.title,
      date: row.date,
      userId: row.user_id,
      category: row.category,
      length: row.length
    }
  }

}
