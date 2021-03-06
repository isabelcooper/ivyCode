import {Server} from "./server/server";
import {SignUpHandler} from "./src/signup-logIn-logout/SignUpHandler";
import {PostgresMigrator} from "./database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "./config/prod";
import {PostgresDatabase} from "./database/postgres/PostgresDatabase";
import {Pool} from "pg";
import {LogInHandler} from "./src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "./src/signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./src/userAuthtoken/TokenManager";
import {SqlTokenStore} from "./src/userAuthtoken/SqlTokenStore";
import {SqlUserStore} from "./src/signup-logIn-logout/SqlUserStore";
import {InMemoryUserStore, UserStore} from "./src/signup-logIn-logout/UserStore";
import {InMemoryTokenStore, TokenStore} from "./src/userAuthtoken/TokenStore";

(async () => {
  const local = Boolean(process.env.LOCAL);
  const clock = Date;
  let employeeStore: UserStore;
  let tokenStore: TokenStore;

  if(local) {
    employeeStore = new InMemoryUserStore();
    tokenStore = new InMemoryTokenStore();
  } else {
    await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

    const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
    employeeStore = new SqlUserStore(database);
    tokenStore = new SqlTokenStore(database);
  }

  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);

  const server = new Server(signUpHandler, logInHandler, logOutHandler);
  server.start();
})();
