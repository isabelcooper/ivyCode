import {InMemoryTokenStore, TokenStore} from "./TokenStore";
import {expect} from "chai";
import {Random} from "../../utils/Random";
import {FixedTokenGenerator} from "../../utils/IdGenerator";
import {TokenManager, TokenManagerClass} from "./TokenManager";
import {FixedClock} from "../../utils/Clock";

describe('TokenManager', () => {
  const userId = Random.integer();
  const fixedTokenValue = Random.string('fixed');
  const tokenGenerator = new FixedTokenGenerator();
  const clock = new FixedClock();
  let tokenStore: TokenStore;
  let tokenManager: TokenManagerClass;

  beforeEach(async () => {
    tokenStore = new InMemoryTokenStore(clock);
    tokenManager = new TokenManager(tokenStore, tokenGenerator, clock);
  });

  it('should generate and store a tokenValue', async () => {
    tokenGenerator.setToken(fixedTokenValue);

    await tokenManager.generateAndStoreToken(userId);

    const token = (await tokenStore.find(userId, fixedTokenValue))[0];
    expect(token.value).to.eql(fixedTokenValue);
  });

  it('should expire all tokens for the userId', async() => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(userId);

    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(userId);

    tokenGenerator.setToken(fixedTokenValue);
    const user2 = Random.integer();
    await tokenManager.generateAndStoreToken(user2);

    await tokenManager.expireTokens(userId);
    const tokens = await tokenStore.findAll();

    expect(tokens.length).to.eql(3);
    tokens.map( token => {
      expect(token.value).to.eql(fixedTokenValue);

      if(token.userId === userId) {
        expect(token.userId).to.eql(userId);
        expect(token.expiry).to.be.at.most(new Date());
      } else {
        expect(token.userId).to.eql(user2);
        expect(token.expiry).to.be.greaterThan(new Date());
      }
    });
  });

  it('should confirm if token is valid and update the expiry if so', async() => {
    const resultForInvalidToken = await tokenManager.validateAndUpdateToken(userId, fixedTokenValue);
    expect(resultForInvalidToken).to.eql(false);

    clock.moveForwardMins(5);

    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(userId);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(userId, fixedTokenValue);
    expect(resultForValidToken).to.eql(true);

    clock.moveForwardMins(5);
    expect((await tokenStore.findAll())[0].expiry.getMinutes()).to.be.eql(new Date(clock.now()).getMinutes());
  });

  it('should reject tokens which have expired', async() => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(userId);

    clock.moveForwardMins(6);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(userId, fixedTokenValue);
    expect(resultForValidToken).to.eql(false);

    clock.moveForwardMins(5);
    expect((await tokenStore.find(userId, fixedTokenValue))[0].expiry).to.be.lessThan(new Date(clock.now()));
  });

  it('should update expiry times', async () => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(userId);

    clock.moveForwardMins(4);
    await tokenManager.updateTokenExpiry(userId, fixedTokenValue);

    clock.moveForwardMins(3);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(userId, fixedTokenValue);
    expect(resultForValidToken).to.eql(true);
  });
});
