import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Token, TokenStore} from "./TokenStore";

export class SqlTokenStore implements TokenStore {
  constructor(private database: PostgresDatabase) {
  }

  async store(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token> {
    const sqlStatement = `
      INSERT INTO tokens (user_id, value, expiry) 
      VALUES (${userId},'${tokenValue}', CURRENT_TIMESTAMP + INTERVAL '${timeToExpiry} minute') 
      RETURNING *;`;
    const insertedRow = (await this.database.query(sqlStatement)).rows[0];
    return {
      userId: insertedRow.user_id,
      value: insertedRow.value,
      expiry: new Date(insertedRow.expiry)
    }
  }

  async findAll(): Promise<Token[]> {
    const sqlStatement = `SELECT * FROM tokens`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        userId: row.user_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }

  async expireAll(userId: number): Promise<Token[]> {
    const sqlStatement = `
    UPDATE tokens
    SET expiry = CURRENT_TIMESTAMP
    WHERE user_id = '${userId}'
    RETURNING *;
   `;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        userId: row.employee_id,
        expiry: row.expiry,
        value: row.value
      }
    })
  }

  public async find(userId: number, token: string): Promise<Token[]> {
    const sqlStatement = `
    SELECT * FROM tokens 
    WHERE user_id = '${userId}'
    AND value = '${token}';
    `;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        userId: row.user_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }

  public async updateTokenExpiry(userId: number, tokenValue: string, timeToExpiry: number): Promise<Token | undefined> {
    const sqlStatement = `
    UPDATE tokens
    SET expiry = CURRENT_TIMESTAMP + INTERVAL '${timeToExpiry} minute'
    WHERE user_id = '${userId}'
    RETURNING *;
   `;
    const row = (await this.database.query(sqlStatement)).rows[0];
    return {
      userId: row.user_id,
      expiry: row.expiry,
      value: row.value
    }
  }
}
