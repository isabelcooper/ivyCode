import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";
import {Random} from "../../utils/Random";

export interface Token {
  userId: number,
  value: string,
  expiry: Date
}

export interface TokenStore {
  expireAll(userId: number): Promise<Token[]>;

  find(userId: number, token: string): Promise<Token[]>;

  findAll(): Promise<Token[]>;

  store(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token>;

  updateTokenExpiry(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token | undefined>;
}

export class InMemoryTokenStore implements TokenStore {
  constructor(private clock: Clock = Date) {}

  private tokens: Token[] = [];

  public async find(userId: number, tokenValue: string): Promise<Token[]> {
    return this.tokens.filter(token => {
      return token.value === tokenValue && token.userId === userId
    });
  }

  public async findAll(): Promise<Token[]> {
    return this.tokens;
  }

  public async store(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token> {
    const now = new Date(this.clock.now());
    const token = {userId: userId, value: tokenValue, expiry: Dates.addMinutes(now, timeToExpiry)};
    this.tokens.push(token);
    return token
  }

  public async expireAll(userId: number): Promise<Token[]> {
    const now = new Date(this.clock.now());
    this.tokens.map(token => {
      if (token.userId === userId) {
        token.expiry = now
      }
    });
    return this.tokens.filter(token => token.userId === userId)!
  }

  public async updateTokenExpiry(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token | undefined> {
    const now = new Date(this.clock.now());
    this.tokens.map(token => {
      if(token.value === tokenValue && token.userId === userId) {
        const newExpiry = Dates.addMinutes(now, timeToExpiry);
        return token.expiry = newExpiry
      }
    });
      return this.tokens.find(token => token.value === tokenValue && token.userId === userId);
  }
}

export function buildToken(partial?: Partial<Token>): Token {
  return {
    userId: Random.integer(),
    expiry: new Date(Dates.addMinutes(new Date(), 5)),
    value: Random.string('tokenValue'),
    ...partial
  };
}
