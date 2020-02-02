import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "../src/signup-logIn-logout/EmployeeStore";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {Random} from "../utils/Random";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {InMemoryTokenManager} from "../src/userAuthtoken/TokenManager";
import {Dates} from "../utils/Dates";
import {FileHandler} from "../utils/FileHandler";

require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenManager: InMemoryTokenManager;
  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  const fileHandler = new FileHandler();

  const employee = buildEmployee();
  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const basicAuthHeaders = {'authorization': `Basic ${encodedCredentials}`};

  const fixedToken = Random.string('token');

  beforeEach(async () => {
    tokenManager = new InMemoryTokenManager();
    employeeStore = new InMemoryEmployeeStore();
    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
    tokenManager.setToken(fixedToken);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
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
    it('should allow a new employee to be created and return the name & token of the employee if successful', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), basicAuthHeaders));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
      expect(JSON.parse(response.bodyString()).token).to.exist;
    });

    it('should allow an existing user to login using employeeId and pin, returning their name', async () => {
      await employeeStore.store(employee);
      const loginDetails = {
        employeeId: employee.employeeId,
        pin: employee.pin
      };
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/login`, JSON.stringify(loginDetails), basicAuthHeaders));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
      expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
    });

    it('should allow logout given an employeeId', async () => {
      await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), basicAuthHeaders));
      expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
      expect(tokenManager.tokens[0].expiry).to.be.greaterThan(new Date());

      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

      expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
      expect(Dates.stripMillis(tokenManager.tokens[0].expiry)).to.be.at.most(new Date());
    });

    it('should not error on logout even if the user wasn\'t logged in..', async () => {
      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
    });
  });

  describe.skip('Loading home', () => {
    it('should load home', async () => {
      const response = await httpClient(ReqOf(
        Method.GET,
        `http://localhost:${port}/`,
        undefined,
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('<title>IvyCode</title>');
    });

    it('should load css (no auth needed)', async () => {
      const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/docs/style.css`));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('font-family: "Helvetica Neue"');
    });
  });
});
