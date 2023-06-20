import mysql from "mysql2";
import { Model } from "./index";
declare class ModelPool extends Model {
    constructor(tableName: string);
    protected execute(sql?: string): Promise<any>;
    destroy(): boolean;
}
declare class DB {
    static table(tableName: string): ModelPool;
    static destroy(): boolean;
}
export default class DatabaseBuilder {
    static createConnection(config: mysql.PoolOptions): {
        DB: typeof DB;
        ModelPool: typeof ModelPool;
    };
}
export {};
