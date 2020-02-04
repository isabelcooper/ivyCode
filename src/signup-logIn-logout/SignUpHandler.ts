import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {User, UserStore} from "./UserStore";
import {Token} from "../userAuthtoken/TokenStore";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";

export class SignUpHandler implements Handler {
  constructor(private userStore: UserStore, private tokenManager: TokenManagerClass){}

  async handle(req: Req): Promise<Res> {
    const user: User = JSON.parse(req.bodyString());
    if (!(
      user.firstName &&
      user.password &&
      user.email)
    ) {
      return ResOf(400, 'Bad request - missing required user details')
    }

    const isAlreadyUser = await this.userStore.find(user.email);
    if(isAlreadyUser) return ResOf(401, 'User already registered, please log in');

    let storedUser: User | undefined;
    try {
      storedUser = await this.userStore.store(user);
    } catch (e) {
      return ResOf(500, `Error storing new user - please contact your administrator. \n ${e}`)
    }

    let token: Token;
    try {
      token = await this.tokenManager.generateAndStoreToken(storedUser!.id!);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    }

    return ResOf(200, JSON.stringify({firstName: user.firstName, token: token.value}));
  }
}
