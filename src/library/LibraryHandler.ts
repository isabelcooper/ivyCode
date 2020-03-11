import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {Clock} from "../../utils/Clock";
import {Recommendation, RecommendationStore} from "./RecommendationStore";

export class LibraryHandler implements Handler {
  constructor(private recommendationManager: RecommendationStore, private clock: Clock = Date) {
  }

  async handle(req: Req): Promise<Res> {
    const body = JSON.parse(req.bodyString());
    const userId = req.header('userId') as string;
    const recommendation: Recommendation = {
      userId: parseInt(userId),
      date: new Date(this.clock.now()),
      title: body.title,
      category: body.category,
      length: body.length
    };

    try{
      await this.recommendationManager.store(recommendation);
    } catch (e) {
      return ResOf(500, e)
    }

    return ResOf(200, 'Stored');
  }

}
