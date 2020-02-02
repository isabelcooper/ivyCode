import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {User, UserStore} from "./UserStore";

export class SqlUserStore implements UserStore {
  constructor(private database: PostgresDatabase) {
  }

  async login(password: string, email: string): Promise<User | undefined> {
    const sqlStatement = `
      SELECT * FROM users 
      WHERE email = '${email}' 
      AND password = '${password}'
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      password: row.password
    }
  };

  async findAll(): Promise<User[]> {
    let sqlStatement = `SELECT * FROM users`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
          password: row.password
      }
    })
  }

  async store(user: User): Promise<User | undefined> {
    const lastNameInsert =  user.lastName ? `'${user.lastName}'` : null;
    const sqlStatement = `
      INSERT INTO users (first_name, last_name, email, password) 
      VALUES ('${user.firstName}',${lastNameInsert},'${user.email}','${user.password}') 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      password: row.password
    }
  }

  public async find(email: string): Promise<User | undefined> {
    const sqlStatement = `
      SELECT * FROM users 
      WHERE email = '${email}' 
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      password: row.password
    }
  }
}
