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

(async () => {
  const clock = Date;
  // TODO run locally
  
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  const employeeStore = new SqlUserStore(database);
  const tokenStore = new SqlTokenStore(database);

  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);

  const server = new Server(signUpHandler, logInHandler, logOutHandler);
  server.start();
})();
