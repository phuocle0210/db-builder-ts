import mysql from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey } from "./types/db.type";
declare class DatabaseConnection {
    protected connection: mysql.Connection;
    constructor(config?: mysql.ConnectionOptions);
}
declare class Model extends DatabaseConnection {
    sql: string;
    private sqlDefault;
    protected tableName: string;
    private listValue;
    protected primaryKey: mysqlKey;
    protected hidden: string[];
    private listMethodChildren;
    private result;
    constructor(tableName: string);
    private ping;
    end(): void;
    getResult(): any;
    private execute;
    get(fields?: string[]): Promise<mysqlResult>;
    find(primaryKey: mysqlKey, fields?: string[]): Promise<any>;
    first(fields?: string[]): Promise<any>;
    private escape;
    create(data: {}): Promise<any>;
    private getListKey;
    private getListValueForKey;
    private sqlConvertKeyAndValue;
    private sqlToConvertKeyAndValue;
    firstOrCreate(find: {}, create: {}): Promise<{
        data: any;
        isCreated: boolean;
    }>;
    update(data: Object): Promise<any>;
    private kiemTraDieuKien;
    where(field: string, condition: mysqlValue, value?: mysqlValue): this;
    orWhere(field: string, condition: mysqlValue, value?: mysqlValue): this;
    getQuery(): string;
    getQueryNotConnection(): string;
    hasOne(tableName: any, primaryKey: string, foreign: string): (x: any) => () => any;
    hasMany(tableName: any, primaryKey: string, foreign: string): (x: any) => () => any;
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
