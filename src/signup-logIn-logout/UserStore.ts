import {Random} from "../../utils/Random";

export interface User {
  id?: number,
  firstName: string,
  lastName?: string,
  email: string,
  password: string
}

export function buildUser(partial?: Partial<User>) : User {
  return {
    id: Random.integer(),
    firstName: Random.string('firstName'),
    lastName: Random.string('lastName'),
    email: Random.string('email'),
    password: Random.string('password'),
    ...partial
  };
}

export interface UserStore {
  login(password: string, email: string): Promise<User | undefined>;

  findAll(): Promise<User[]>;

  store(user: User): Promise<User | undefined>;

  find(email: string): Promise<User | undefined>;
}

export class InMemoryUserStore implements UserStore {
  public users: User[] = [];

  public async login(password: string, email: string): Promise<User | undefined> {
    return (this.users.find(user => {
      return user.email === email && user.password === password
    }))
  }

  public async findAll(): Promise<User[]> {
    return this.users
  }

  public async store(user: User): Promise<User> {
    this.users.push(user);
    return user
  }

  public async find(email: string): Promise<User | undefined> {
    return this.users.find(user => email === user.email)
  }
}

export class AlwaysFailsEmployeeStore implements UserStore {
  findAll(): Promise<User[]> {
    throw Error('store broken');
  }

  store(user: User): Promise<User> {
    throw Error('store broken on user: ' + user)
  }

  login(password: string, email: string): Promise<User | undefined> {
    throw Error('user not found ' + email)
  }

  public async find(email: string): Promise<User | undefined> {
    return undefined;
  }
}
