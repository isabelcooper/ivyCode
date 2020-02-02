import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {SignUpHandler} from "./SignUpHandler";
import {AlwaysFailsEmployeeStore, buildUser, InMemoryUserStore, User, UserStore} from "./UserStore";
import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../userAuthtoken/TokenManager";
import {Random} from "../../utils/Random";

describe('SignUpHandler', () => {
  let userStore: UserStore;
  let tokenManager: InMemoryTokenManager;
  let signUpHandler: SignUpHandler;
  const fixedToken = Random.string('token');
  const user: User = buildUser();

  beforeEach(() => {
    userStore = new InMemoryUserStore();
    tokenManager = new InMemoryTokenManager();
    signUpHandler = new SignUpHandler(userStore, tokenManager);
  });

  it('should register a new user and return their name and a token', async () => {
    tokenManager.setToken(fixedToken);
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(user)));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).firstName).to.eql(user.firstName);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
    expect( await userStore.findAll()).to.eql([user])
  });

  it('should not error if no last name provided', async() => {
    tokenManager.setToken(fixedToken);
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(user)));

    expect(response.status).to.eql(200);
  });

  it('should not allow an existing user to sign up a second time',async () =>{
    await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(user)));

    const employeeWithSameId = buildUser({id: user.id});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(employeeWithSameId)));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('User already registered, please log in');
  });

  it('should error if required sign up info is missing',async () => {
    const brokenEmployee = buildUser({id: undefined});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(brokenEmployee)));

    expect(response.status).to.eql(400);
    expect(response.bodyString()).to.eql('Bad request - missing required user details');
  });

  it('should handle errors storing new users', async () => {
    const handlerWithFailingStore = new SignUpHandler(new AlwaysFailsEmployeeStore(), tokenManager);
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/signup', JSON.stringify(user)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error storing new user - please contact your administrator. \n Error: store broken on user: ${user}`
    );
  });

  it('should handle errors from the token generator or store', async () => {
    const handlerWithFailingStore = new SignUpHandler(userStore, new AlwaysFailsTokenManager());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/signup', JSON.stringify(user)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error retrieving token - please contact your administrator.`
    );
  });
});
