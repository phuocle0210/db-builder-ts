import mysql from "mysql2";
import { PoolConnection } from "mysql2/promise";
type mysqlValue = any;
declare class Model {
    protected sql: string;
    private sqlDefault;
    protected tableName: string;
    protected promisePool: PoolConnection;
    protected listValue: any[];
    protected listField: string[];
    private listMethodChildren;
    constructor(tableName: string);
    private execute;
    get(fields?: string[]): Promise<any>;
    first(): Promise<any>;
    private escape;
    private kiemTraDieuKien;
    where(field: string, condition: mysqlValue, value?: mysqlValue): this;
    orWhere(field: string, condition: mysqlValue, value?: mysqlValue): this;
    create(data: {} | {}[]): Promise<any>;
    update(data: Object): Promise<unknown>;
    private getListKey;
    private getListValueForKey;
    private sqlConvertKeyAndValue;
    private sqlToConvertKeyAndValue;
    firstOrCreate(find: {}, create?: {}): Promise<{
        data: any;
        isCreated: boolean;
    }>;
    hasOne(tableName: any, primaryKey: string, foreign: string): (x: any) => () => Promise<any>;
    hasMany(tableName: any, primaryKey: string, foreign: string): (x: any) => () => any;
}
declare class DB {
    static table(tableName: string): Model;
}
export default class DatabaseBuilder {
    static createConnection(config: mysql.PoolOptions): {
        DB: typeof DB;
        Model: typeof Model;
    };
}
export {};
