// import {Handler, Req, Res} from "http4js";
// import {ResOf} from "http4js/core/Res";
// import {Clock} from "../../utils/Clock";
//
// export class LibraryHandler implements Handler {
//   constructor(private recommendationManager: RecommendationStore, private clock: Clock = Date) {
//   }
//
//   async handle(req: Req): Promise<Res> {
//     const reqBody = JSON.parse(req.bodyString());
//     const userId = reqBody.id as number;
//
//     try{
//       this.recommendationManager.store();
//     } catch (e) {
//       return ResOf(500, e)
//     }
//
//     return ResOf(200, 'Stored');
//   }
//
// }
