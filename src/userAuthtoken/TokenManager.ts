import {Token, TokenStore} from "./TokenStore";
import {IdGenerator} from "../../utils/IdGenerator";
import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";

const TIME_TO_TOKEN_EXPIRY = 5;

export interface TokenManagerClass {
  generateAndStoreToken(userId: number): Promise<Token>

  expireTokens(userId: number): Promise<Token[]>;

  validateAndUpdateToken(userId: number, token: string): Promise<boolean>;

  updateTokenExpiry(userId: number, token: string): Promise<Token | undefined>;
}

export class InMemoryTokenManager implements TokenManagerClass {
  public availableTokenValue: string = '';
  public tokens: Token[] = [];

  async generateAndStoreToken(userId: number): Promise<Token> {
    const token = {userId, expiry: Dates.addMinutes(new Date(), 5), value: this.availableTokenValue};
    this.tokens.push(token);
    return token
  }

  public setToken(token: string): void {
    this.availableTokenValue = token;
  }

  public async expireTokens(userId: number): Promise<Token[]> {
    this.tokens.map(token => {
      if (token.userId === userId) {
        token.expiry = new Date()
      }
    });
    return this.tokens.filter(token => token.userId === userId);
  }

  public async validateAndUpdateToken(userId: number, token: string): Promise<boolean> {
    const valid = this.tokens.some(storedToken => {
        return storedToken.value === token
          && storedToken.userId === userId
          && storedToken.expiry >= new Date()
      }
    );
    if(valid){ await this.updateTokenExpiry(userId, token)}
    return valid
  }

  public async updateTokenExpiry(userId: number, tokenValue: string): Promise<Token | undefined> {
    this.tokens.map(token => {
      if( token.userId === userId && token.value === tokenValue) {
        return token.expiry === Dates.addMinutes(new Date(), 5);
      }
    });
    return this.tokens.find(token => token.userId === userId && token.value === tokenValue);
  }

}


export class AlwaysFailsTokenManager implements TokenManagerClass {
  async generateAndStoreToken(userId: number): Promise<Token> {
    throw Error('Issue with token management')
  }

  expireTokens(userId: number): Promise<Token[]> {
    throw Error('Issue with token management')
  }

  validateAndUpdateToken(userId: number, token: string): Promise<boolean> {
    throw Error('Issue with token management')
  }

  updateTokenExpiry(userId: number, token: string): Promise<Token | undefined> {
    throw Error('Issue with token management')
  }
}

export class TokenManager implements TokenManagerClass {
  constructor(private tokenStore: TokenStore, private idGenerator: IdGenerator, private clock: Clock) {}

  public async generateAndStoreToken(userId: number): Promise<Token> {
    const tokenValue = this.idGenerator.createToken();
    const storedToken = await this.tokenStore.store(userId, tokenValue, TIME_TO_TOKEN_EXPIRY);
    return {userId, value: tokenValue, expiry: storedToken.expiry}
  }

  public async expireTokens(userId: number): Promise<Token[]> {
    return await this.tokenStore.expireAll(userId);
  }

  public async validateAndUpdateToken(userId: number, token: string): Promise<boolean> {
    const matchingTokens = await this.tokenStore.find(userId, token);
    return matchingTokens.some(matchingToken => {
      return matchingToken.expiry >= new Date(this.clock.now())
    });
  }

  public async updateTokenExpiry(userId: number, token: string): Promise<Token | undefined> {
    return await this.tokenStore.updateTokenExpiry(userId, token, TIME_TO_TOKEN_EXPIRY);
  }
}
