import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {buildUser, UserStore} from "../src/signup-logIn-logout/UserStore";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {TokenStore} from "../src/userAuthtoken/TokenStore";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {Random} from "../utils/Random";
import {TokenManager, TokenManagerClass} from "../src/userAuthtoken/TokenManager";
import {IdGenerator, UniqueUserIdGenerator} from "../utils/IdGenerator";
import {Dates} from "../utils/Dates";
import {FileHandler} from "../utils/FileHandler";
import {FixedClock} from "../utils/Clock";
import {SqlTokenStore} from "../src/userAuthtoken/SqlTokenStore";
import {SqlUserStore} from "../src/signup-logIn-logout/SqlUserStore";

describe('E2E', function () {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;
  let userStore: UserStore;
  let tokenStore: TokenStore;
  let idGenerator: IdGenerator;
  let tokenManager: TokenManagerClass;

  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  const fileHandler = new FileHandler();

  const userToStore = buildUser({id: undefined});
  const fixedToken = Random.string('token');
  const clock = new FixedClock();

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetIvyCodeDatabase();
    await testPostgresServer.start();

    userStore = new SqlUserStore(database);
    tokenStore = new SqlTokenStore(database);

    idGenerator = new UniqueUserIdGenerator();
    tokenManager = new TokenManager(tokenStore, idGenerator, clock);

    signUpHandler = new SignUpHandler(userStore, tokenManager);
    logInHandler = new LogInHandler(userStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);

    server = new Server(signUpHandler, logInHandler, logOutHandler, fileHandler, port);
    await server.start();
  });

  afterEach(async () => {
    await testPostgresServer.stop();
    await server.stop();
  });

  describe('Sign up, log in and out', async () => {
    it('should allow an unknown user to register, but not twice', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(userToStore)));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(userToStore.firstName);

      const userSameId = buildUser({email: userToStore.email});
      const response2 = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(userSameId)));
      expect(response2.status).to.eql(401);
    });

  //   it('should not require a last name on registration', async () => {
  //     const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(userToStore)));
  //     expect(response.status).to.eql(200);
  //     expect(JSON.parse(response.bodyString()).firstName).to.eql(userToStore.firstName);
  //   });
  //
  //   it('should allow a known user to log in', async () => {
  //     await userStore.store(userToStore);
  //     const response = await httpClient(ReqOf(
  //       Method.POST,
  //       `http://localhost:${port}/login`,
  //       JSON.stringify({id: userToStore.id, password: userToStore.password})
  //     ));
  //     expect(response.status).to.eql(200);
  //     expect(JSON.parse(response.bodyString()).firstName).to.eql(userToStore.firstName);
  //     expect(JSON.parse(response.bodyString()).token).to.exist;
  //   });
  //
  //   it('should log a user out', async () => {
  //     const storedUser = await userStore.store(userToStore);
  //     await tokenStore.store(storedUser!.id!, fixedToken, 5);
  //
  //     const response = await httpClient(ReqOf(
  //       Method.POST,
  //       `http://localhost:${port}/logout`,
  //       JSON.stringify({id: userToStore.id})
  //     ));
  //
  //     expect(response.status).to.eql(200);
  //     expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
  //
  //     const matchedToken = (await tokenStore.find(userToStore.id, fixedToken))[0];
  //
  //     expect(matchedToken!.value).to.eql(fixedToken);
  //     expect(Dates.stripMillis(matchedToken!.expiry)).to.be.at.most(new Date());
  //   });
  });

});
