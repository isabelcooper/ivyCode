import {routes, Routing} from "http4js/core/Routing";
import {Method} from "http4js/core/Methods";
import {NativeHttpServer} from "http4js/servers/NativeHttpServer";
import {ResOf} from "http4js/core/Res";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {FileHandler} from "../utils/FileHandler";

require('dotenv').config();

export class Server {
  private server: Routing;

  constructor(
    signUpHandler: SignUpHandler,
    logInHandler: LogInHandler,
    logOutHandler: LogOutHandler,
    fileHandler: FileHandler = new FileHandler(),
    private port: number = 3330
  ) {
    this.server = routes(Method.GET, '/health', async () => ResOf(200))
      .withPost('/signup', signUpHandler)
      .withPost('/login', logInHandler)
      .withPost('/logout', logOutHandler)

      .asServer(new NativeHttpServer(parseInt(process.env.PORT!) || this.port));
  }

  start() {
    try {
      this.server.start();
    } catch (e) {
      console.log("Error on server start:", e)
    }
    console.log(`Server running on port ${this.port}`)
  }

  stop() {
    this.server.stop();
  }
}

