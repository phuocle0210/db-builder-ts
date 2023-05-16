import mysql from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey } from "./types/db.type";
declare class DatabaseConnection {
    protected connection: mysql.Connection;
    constructor(config?: mysql.ConnectionOptions);
}
declare class Model extends DatabaseConnection {
    sql: string;
    protected tableName: string;
    private listValue;
    protected primaryKey: mysqlKey;
    protected hidden: string[];
    constructor(tableName: string);
    private execute;
    get(fields?: string[]): Promise<mysqlResult>;
    find(primaryKey: mysqlKey, fields?: string[]): Promise<any>;
    create(data: Object): Promise<any>;
    update(): Promise<void>;
    where(field: string, condition: mysqlValue, value?: mysqlValue): this;
    getQuery(): string;
    getQueryNotConnection(): string;
}
declare class DB {
    static table(tableName: string): Model;
}
export default class DatabaseBuilder {
    static createConnection(config: mysql.ConnectionOptions): {
        DB: typeof DB;
        Model: typeof Model;
    };
}
export {};
