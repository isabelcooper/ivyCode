import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {User, UserStore} from "./UserStore";
import {Token} from "../userAuthtoken/TokenStore";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";

export class LogInHandler implements Handler {
  constructor(private userStore: UserStore, private tokenManager: TokenManagerClass){}

  async handle(req: Req): Promise<Res> {
    const reqBody: User = JSON.parse(req.bodyString());
    if (!(
      reqBody.email &&
      reqBody.password)
    ) {
      return ResOf(400, 'Bad request - missing required employee details')
    }

    let matchedUser: User | undefined;
    try {
      matchedUser = await this.userStore.login(reqBody.password, reqBody.email);
      if(!matchedUser) {
        return ResOf(401, 'User not recognised')
      }
    } catch (e) {
      return ResOf(500, `${e}`)
    }

    let token: Token;
    try {
      token = await this.tokenManager.generateAndStoreToken(matchedUser!.id!);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    }

    return ResOf(200, JSON.stringify({firstName: matchedUser.firstName, token: token.value}));
  }
}
