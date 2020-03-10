import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js";
import {expect} from "chai";
import {Random} from "../../utils/Random";
import {LibraryHandler} from "./LibraryHandler";
import {buildUser} from "../signup-logIn-logout/UserStore";
import {AlwaysFailsRecommendationStore, buildRecommendation, InMemoryRecommendationStore} from "./RecommendationStore";
import {FixedClock} from "../../utils/Clock";


describe('LibraryHandler', () => {
  const clock = new FixedClock();

  const recommendationStore = new InMemoryRecommendationStore();
  const libraryHandler = new LibraryHandler(recommendationStore, clock);
  const user = buildUser({id: Random.integer()});
  const recommendation = buildRecommendation({userId: user.id});

  beforeEach( async () => {});

  it('should expire token immediately and return Goodbye message', async () => {
    const response = await libraryHandler.handle(ReqOf(Method.POST, '/library', JSON.stringify(recommendation)));
    expect(response.status).to.eql(200);

    expect(recommendationStore.recommendations).to.eql([{
      ...recommendation,
      userId: user.id,
      date: new Date(clock.now())
    }]);
  });

  it('should throw error if store update fails', async () => {
    const failingLibraryHandler = new LibraryHandler(new AlwaysFailsRecommendationStore());
    const response = await failingLibraryHandler.handle(ReqOf(Method.POST, '/library', JSON.stringify(recommendation)));

    expect(response.status).to.eql(500, 'Recommendation failed to store');
  });
});
