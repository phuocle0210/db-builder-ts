import mysql from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey, MysqlResults, IModelResult } from "./types/db.type";
type ConnectType = mysql.Connection | mysql.Pool;
export declare class Model {
    sql: string;
    protected sqlDefault: string;
    protected tableName: string;
    protected listValue: mysqlValue[];
    primaryKey: string;
    protected hidden: string[];
    protected listMethodChildren: string[];
    protected connection: ConnectType;
    protected limit: number;
    protected order: string;
    protected offset: number;
    constructor(tableName: string);
    getTableName(): string;
    private ping;
    end(): void;
    static response(data: MysqlResults): any;
    private formatCreatedAtAndUpdatedAt;
    showResult(results: MysqlResults): IModelResult;
    take(limit: number): this;
    orderBy(field: string, orderBy?: "ASC" | "DESC"): this;
    orderByDesc(field: string): this;
    orderByAsc(field: string): this;
    setOffSet(skip: number): this;
    paginate(limit: number, page: number): Promise<{
        current_page: number;
        total_page: 0;
        data: MysqlResults;
        hidden?: MysqlResults | undefined;
    }>;
    updateTimeStamp(field?: string): Promise<boolean>;
    protected execute(sql?: string): Promise<mysqlResult>;
    private getDateNow;
    private convertDate;
    private save;
    get(fields?: string[]): Promise<IModelResult>;
    query(sql: string, fields?: string[]): Promise<IModelResult | {
        data: never[];
    }>;
    find(primaryKey: mysqlKey, fields?: string[]): Promise<IModelResult>;
    first(fields?: string[]): Promise<IModelResult>;
    private escape;
    create(data: {}): Promise<true | void | IModelResult>;
    protected getListKey(data: {}): string[];
    protected getListValueForKey(keys: string[], obj: {}): never[];
    protected sqlConvertKeyAndValue(find: {}): string;
    protected sqlToConvertKeyAndValue(find: {}): string;
    firstOrCreate(find: {}, create?: {}): Promise<{
        data: boolean | void | IModelResult;
        isCreated: boolean;
    }>;
    update(data: Object): Promise<any>;
    private kiemTraDieuKien;
    where(field: string, condition: mysqlValue, value?: mysqlValue): this;
    orWhere(field: string, condition: mysqlValue, value?: mysqlValue): this;
    getQuery(): string;
    getQueryNotConnection(): string;
    protected hasOne(tableName: any, primaryKey: string, foreign: string): (x: any) => () => any;
    protected hasMany(tableName: any, primaryKey: string, foreign: string): (x: any) => () => any;
    protected belongsToMany(target: any, tableName: string, foreignKeyOne: string, foreignKeyTwo: string): (x: any) => () => any;
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
