// import {ReqOf} from "http4js/core/Req";
// import {Method} from "http4js";
// import {expect} from "chai";
// import {Random} from "../../utils/Random";
// import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../userAuthtoken/TokenManager";
// import {LibraryHandler} from "./LibraryHandler";
// import {buildUser} from "../signup-logIn-logout/UserStore";
// import {buildRecommendation} from "./RecommendationStore";
// import {FixedClock} from "../../utils/Clock";
//
// interface RecommendationStore {
// }
//
// class InMemoryRecommendationStore {
//
// }
//
// describe('LibraryHandler', () => {
//   const clock = new FixedClock();
//
//   const recommendationStore = new InMemoryRecommendationStore();
//   const libraryHandler = new LibraryHandler(recommendationStore, clock);
//   const fixedToken = Random.string('token');
//   const user = buildUser({id: Random.integer()});
//   const recommendation = buildRecommendation({userId: user.id});
//
//   beforeEach( async () => {});
//
//   it('should expire token immediately and return Goodbye message', async () => {
//     const response = await libraryHandler.handle(ReqOf(Method.POST, '/library', JSON.stringify(recommendation)));
//     expect(response.status).to.eql(200);
//
//     expect(recommendationStore.stored).to.eql({
//       ...recommendation,
//       userId: user.id,
//       date: clock.now()
//     });
//   });
//
//   it('should throw error if store update fails', async () => {
//     const logOutHandler = new LibraryHandler(new AlwaysFailsTokenManager());
//     const response = await logOutHandler.handle(ReqOf(Method.POST, '/logout', JSON.stringify({id: user.id})));
//
//     expect(response.status).to.eql(500, 'Log out failed - please contact your administrator.');
//   });
// });
