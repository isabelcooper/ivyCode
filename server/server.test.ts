import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {buildUser, InMemoryUserStore, UserStore} from "../src/signup-logIn-logout/UserStore";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {Random} from "../utils/Random";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {InMemoryTokenManager} from "../src/userAuthtoken/TokenManager";
import {Dates} from "../utils/Dates";
import {FileHandler} from "../utils/FileHandler";
import {buildRecommendation} from "../src/library/RecommendationStore";
import {StaticFileReader} from "../src/fileReader/StaticFileReader";

require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let userStore: UserStore;
  let tokenManager: InMemoryTokenManager;
  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  const fileHandler = new FileHandler(new StaticFileReader());

  const user = buildUser();
  const fixedToken = Random.string('token');

  beforeEach(async () => {
    tokenManager = new InMemoryTokenManager();
    userStore = new InMemoryUserStore();
    signUpHandler = new SignUpHandler(userStore, tokenManager);
    tokenManager.setToken(fixedToken);
    logInHandler = new LogInHandler(userStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);
    server = new Server(signUpHandler, logInHandler, logOutHandler, fileHandler, port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should respond 200 on health', async () => {
    const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/health`));
    expect(response.status).to.eql(200);
  });

  describe('Signing up, logging in and out', () => {
    it('should allow a new user to be created and return the name & token of the user if successful', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(user)));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(user.firstName);
      expect(JSON.parse(response.bodyString()).token).to.exist;
    });

    it('should allow an existing user to login using employeeId and password, returning their name', async () => {
      await userStore.store(user);
      const loginDetails = {
        email: user.email,
        password: user.password
      };
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/login`, JSON.stringify(loginDetails)));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(user.firstName);
      expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
    });

    it('should allow logout given an employeeId', async () => {
      await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(user)));
      expect(tokenManager.tokens[0].userId).to.equal(user.id);
      expect(tokenManager.tokens[0].expiry).to.be.greaterThan(new Date());

      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({id: user.id})
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

      expect(tokenManager.tokens[0].userId).to.equal(user.id);
      expect(Dates.stripMillis(tokenManager.tokens[0].expiry)).to.be.at.most(new Date());
    });

    it('should not error on logout even if the user wasn\'t logged in..', async () => {
      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({id: user.id})
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
    });
  });

  describe('Library', async () => {
    it('should store a recommendation', async () => {
      const recommendation = buildRecommendation();
      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/library`,
        JSON.stringify(recommendation)
      ));

      expect(response.status).to.eql(200);
    });
  });

  describe.skip('Loading home', () => {
    it('should default to home', async () => {
      const response = await httpClient(ReqOf(
        Method.GET,
        `http://localhost:${port}/`
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('<title>Ivy Code</title>');
    });

    it('should load css (no auth needed)', async () => {
      const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/docs/style.css`));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('font-family: "Helvetica Neue"');
    });
  });
});
