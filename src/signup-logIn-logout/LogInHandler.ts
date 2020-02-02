import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {Employee, EmployeeStore} from "./EmployeeStore";
import {Token} from "../userAuthtoken/TokenStore";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";

export class LogInHandler implements Handler {
  constructor(private employeeStore: EmployeeStore, private tokenManager: TokenManagerClass){}

  async handle(req: Req): Promise<Res> {
    const reqBody: Employee = JSON.parse(req.bodyString());
    if (!(
      reqBody.employeeId &&
      reqBody.pin)
    ) {
      return ResOf(400, 'Bad request - missing required employee details')
    }

    let matchedEmployee: Employee | undefined;
    try {
      matchedEmployee = await this.employeeStore.login(reqBody.pin, reqBody.employeeId);
      if(!matchedEmployee) {
        return ResOf(401, 'User not recognised')
      }
    } catch (e) {
      return ResOf(500, `${e}`)
    }

    let token: Token;
    try {
      token = await this.tokenManager.generateAndStoreToken(matchedEmployee.employeeId);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    }

    return ResOf(200, JSON.stringify({firstName: matchedEmployee.firstName, token: token.value}));
  }
}
