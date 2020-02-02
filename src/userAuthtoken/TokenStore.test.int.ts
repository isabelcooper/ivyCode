import {Random} from "../../utils/Random";
import {expect} from "chai";
import {TokenStore} from "./TokenStore";
import {Dates} from "../../utils/Dates";
import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {SqlTokenStore} from "./SqlTokenStore";
import {SqlUserStore} from "../signup-logIn-logout/SqlUserStore";
import {buildUser, User, UserStore} from "../signup-logIn-logout/UserStore";

describe('TokenStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let tokenStore: TokenStore;
  let userStore: UserStore;
  const value = Random.string();
  let user: User |undefined ;

  before(async () => {
    database = await testPostgresServer.startAndGetIvyCodeDatabase();
    tokenStore = new SqlTokenStore(database);

    userStore = new SqlUserStore(database);
    user = await userStore.store(buildUser());
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE tokens;`)
  });

  after( async() => {
    await testPostgresServer.stop()
  });

  it('should store tokens with expiry in 5 mins and user!.id', async () => {
    const storedToken = await tokenStore.store(user!.id!, value, 5);
    expect(storedToken.userId).to.eql(user!.id);
    expect(storedToken.value).to.eql(value);

    const dateTimeIn5Minutes = Dates.addMinutes(new Date(), 5);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].userId).to.eql(user!.id);
    expect(tokens[0].value).to.eql(value);
    expect(tokens[0].expiry.getDate()).to.eql(dateTimeIn5Minutes.getDate());
    expect(tokens[0].expiry.getMinutes()).to.eql(dateTimeIn5Minutes.getMinutes());
  });

  it('should update a token expiry date to now', async () => {
    await tokenStore.store(user!.id!, value, 5);
    await tokenStore.expireAll(user!.id!);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].userId).to.eql(user!.id);
    expect(tokens[0].value).to.eql(value);
    expect(tokens[0].expiry.getDate()).to.eql(new Date().getDate());
    expect(tokens[0].expiry.getMinutes()).to.eql(new Date().getMinutes());
  });

  it('should not be messing with other tokens on update', async () => {
    await tokenStore.store(user!.id!, value, 5);
    const user2 = await userStore.store(buildUser());

    await tokenStore.store(user2!.id!, Random.string(), 5);

    await tokenStore.expireAll(user!.id!);
    const dateTimeIn5Minutes = Dates.addMinutes(new Date(), 5);

    const user2Token = (await tokenStore.findAll()).find(token => token.userId === user2!.id);
    expect(user2Token!.userId).to.eql(user2!.id);
    expect(user2Token!.expiry.getDate()).to.eql(dateTimeIn5Minutes.getDate());
    expect(user2Token!.expiry.getMinutes()).to.eql(dateTimeIn5Minutes.getMinutes());
  });

  it('should return all tokens matching an user!.id! and token value', async () => {
    const user2 = await userStore.store(buildUser());

    await tokenStore.store(user!.id!, value, 5);
    await tokenStore.store(user!.id!, value, 5);

    const token2 = Random.string('token2', 16);
    await tokenStore.store(user!.id!, token2, 5);
    await tokenStore.store(user2!.id!, token2, 5);

    const result = await tokenStore.find(user!.id!, value);
    expect(result.length).to.eql(2);
    expect(result[0].value).to.eql(value);
    expect(result[0].userId).to.eql(user!.id!);
  });

  it('should update token expiry time', async() => {
    await tokenStore.store(user!.id!, value, 5);
    await tokenStore.updateTokenExpiry(user!.id!, value, 10);

    const token = (await tokenStore.find(user!.id!, value))[0];

    expect(token.expiry.getDate()).to.eql(new Date().getDate());
    const dateIn8Minutes = Dates.addMinutes(new Date(), 8);
    expect(token.expiry.getMinutes()).to.be.greaterThan(dateIn8Minutes.getMinutes());
  });
});
