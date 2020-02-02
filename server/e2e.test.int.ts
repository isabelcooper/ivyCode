import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {buildEmployee, EmployeeStore} from "../src/signup-logIn-logout/EmployeeStore";
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
import {SqlEmployeeStore} from "../src/signup-logIn-logout/SqlEmployeeStore";

describe('E2E', function () {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenStore: TokenStore;
  let idGenerator: IdGenerator;
  let tokenManager: TokenManagerClass;

  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  const fileHandler = new FileHandler();

  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const authHeaders = {'authorization': `Basic ${encodedCredentials}`};
  const employee = buildEmployee();
  const fixedToken = Random.string('token');
  const clock = new FixedClock();

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    await testPostgresServer.start();

    employeeStore = new SqlEmployeeStore(database);
    tokenStore = new SqlTokenStore(database);

    idGenerator = new UniqueUserIdGenerator();
    tokenManager = new TokenManager(tokenStore, idGenerator, clock);

    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
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
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders),);
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);

      const employeeSameId = buildEmployee({employeeId: employee.employeeId});
      const response2 = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employeeSameId), authHeaders),);
      expect(response2.status).to.eql(401);
    });

    it('should not require a last name on registration', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders),);
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
    });

    it('should allow a known user to log in', async () => {
      await employeeStore.store(employee);
      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/login`,
        JSON.stringify({employeeId: employee.employeeId, pin: employee.pin}),
        authHeaders
      ));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
      expect(JSON.parse(response.bodyString()).token).to.exist;
    });

    it('should log a user out', async () => {
      await employeeStore.store(employee);
      await tokenStore.store(employee.employeeId, fixedToken, 5);

      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        authHeaders
      ));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

      const matchedToken = (await tokenStore.find(employee.employeeId, fixedToken))[0];

      expect(matchedToken!.value).to.eql(fixedToken);
      expect(Dates.stripMillis(matchedToken!.expiry)).to.be.at.most(new Date());
    });
  });

});
