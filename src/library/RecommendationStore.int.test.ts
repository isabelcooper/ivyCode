import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {expect} from "chai";
import {buildRecommendation, RecommendationStore, SqlRecommendationStore} from "./RecommendationStore";
import {buildUser, UserStore} from "../signup-logIn-logout/UserStore";
import {SqlUserStore} from "../signup-logIn-logout/SqlUserStore";
import {Dates} from "../../utils/Dates";

describe('RecommendationStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let recommendationStore: RecommendationStore;
  let userStore: UserStore;
  const user = buildUser();

  before(async () => {
    database = await testPostgresServer.startAndGetIvyCodeDatabase();
    recommendationStore = new SqlRecommendationStore(database);
    userStore = new SqlUserStore(database);
    await userStore.store(user)
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE recommendations;`);
  });

  after(async () => {
    await testPostgresServer.stop()
  });

  it('should store a new recommendation', async () => {
    const storedUser = await userStore.find(user.email);
    const recommendation = buildRecommendation({userId: storedUser!.id});

    const storedRecommendation = await recommendationStore.store(recommendation);

    expect(storedRecommendation!.title).to.eql(recommendation.title);
    expect(storedRecommendation!.userId).to.eql(recommendation.userId);
    expect(storedRecommendation!.category).to.eql(recommendation.category);
    expect(storedRecommendation!.length).to.eql(recommendation.length);

    expect(Dates.format(storedRecommendation!.date)).to.eql(Dates.format(recommendation.date));

    //TODO add mapper to handle date formatting - and test date properly
  });
});
