import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {AlwaysFailsEmployeeStore, buildUser, User, InMemoryUserStore} from "./UserStore";
import {LogInHandler} from "./LogInHandler";
import {Random} from "../../utils/Random";
import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../userAuthtoken/TokenManager";

describe('LogInHandler', () => {
  const userStore = new InMemoryUserStore();
  const tokenManager = new InMemoryTokenManager();
  const logInHandler = new LogInHandler(userStore, tokenManager);
  let user: User | undefined;
  const fixedToken = Random.string('token');

  before(async () => {
    tokenManager.setToken(fixedToken);
  });

  beforeEach(async () => {
    user = await userStore.store(buildUser());
  });

  it('should look up an existing user, returning their name and a generated token', async () => {
    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(user)
    ));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).firstName).to.eql(user!.firstName);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);

    const storedTokens = await tokenManager.tokens;
    expect(storedTokens[0].userId).to.eql(user!.id);
    expect(storedTokens[0].value).to.eql(fixedToken);
  });

  it('should error if pin does not match employeeId',async () => {
    const mismatchedEmployee = buildUser({id: user!.id});

    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(mismatchedEmployee)
    ));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('User not recognised');
  });

  it('should handle errors reading from the userStore', async () => {
    const handlerWithFailingStore = new LogInHandler(new AlwaysFailsEmployeeStore(), tokenManager);
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(user)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error: user not found ${user!.email}`
    );
  });

  it('should handle errors from the token generator or store', async () => {
    const handlerWithFailingStore = new LogInHandler(userStore, new AlwaysFailsTokenManager());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(user)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error retrieving token - please contact your administrator.`
    );
  });
});
