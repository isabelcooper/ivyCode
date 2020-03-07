import {Random} from "../../utils/Random";

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

interface Recommendation {
  title: string,
  date: Date,
  userId: number,
  category: RecommendationCategory,
  // category: RecommendationCategory.Article |
  //   RecommendationCategory.Book |
  //   RecommendationCategory.Exercise |
  //   RecommendationCategory.Film |
  //   RecommendationCategory.Podcast // use enum as type?
  // tags: Array,
  length: number //mins
}

export function buildRecommendation(partial?: Partial<Recommendation>): Recommendation {
  return {
    title: Random.string('title'),
    date: Random.date(),
    userId: Random.integer(),
    category: Random.oneOf(categories),
    // tags: Array,
    length: Random.integer(1000), //mins
    ...partial
  }
}
