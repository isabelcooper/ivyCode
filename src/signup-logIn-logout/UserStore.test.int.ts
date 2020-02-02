import {buildUser, UserStore} from "./UserStore";
import {expect} from "chai";
import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {SqlUserStore} from "./SqlUserStore";

describe('UserStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let userStore: UserStore;
  const user = buildUser();

  before(async () => {
    database = await testPostgresServer.startAndGetIvyCodeDatabase();
    userStore = new SqlUserStore(database);
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE users CASCADE;`);
  });

  after(async () => {
    await testPostgresServer.stop()
  });

  it('should store a user', async () => {
    const storedUser = await userStore.store(user);
    expect(storedUser).to.eql({
      ...user,
      id: 1
    });
  });

  it('should not blow up if user has no last name', async () => {
    const userNoLastName = buildUser({lastName: undefined});
    const storedUser = await userStore.store(userNoLastName);
    expect(storedUser).to.eql({
      ...userNoLastName,
      id: 2,
      lastName: null,
    });
  });

  it('should retrieve a user by id', async () => {
    await userStore.store(user);

    const foundUser = await userStore.find(user.email);
    expect(foundUser).to.eql({
      ...user,
      id: 3
    });
  });

  it('should not error if no matching user is found', async () => {
    const retrievedUser = await userStore.find(user.email);
    expect(retrievedUser).to.eql(undefined);
  });

  it('should retrieve all employees', async () => {
    await userStore.store(user);
    const user2 = buildUser();
    await userStore.store(user2);

    expect(await userStore.findAll()).to.eql([
      {...user, id: 4},
      {...user2, id: 5}
    ]);
  });

  it('should find a user based on employeeId and pin code', async () => {
    await userStore.store(user);
    expect(await userStore.login(user.password, user.email)).to.eql({
      ...user,
      id: 6
    })
  });
});


//TODO: better id management
