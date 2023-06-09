import mysql, { ResultSetHeader } from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey } from "./types/db.type";

let connectConfig: mysql.ConnectionOptions;

class DatabaseConnection {
    protected connection: mysql.Connection;

    constructor(config: mysql.ConnectionOptions = {}) {
        this.connection = mysql.createConnection(connectConfig);
    }
}

class Model extends DatabaseConnection {
    public sql: string;
    private sqlDefault: string;
    protected tableName: string;
    private listValue: mysqlValue[];
    protected primaryKey: mysqlKey;
    protected hidden: string[];
    private listMethodChildren: string[];
    private result: any;

    constructor(tableName: string) {
        super();

        this.result = null;
        this.listMethodChildren = [];
        this.primaryKey = "id";
        this.tableName = tableName;

        this.sqlDefault = `SELECT * FROM ${this.tableName}`;
        this.sql = this.sqlDefault;
        
        this.listValue = [];
        this.hidden = [];
    }

    private ping() {
        try {
            this.connection.query("select 1")
        } catch (_) {
            return false;
        }

        return true;
    }

    public end() {
        if (this.ping()) {
            this.connection.end();
        }
    }

    public getResult() {
        return JSON.parse(this.result);
    }

    private async execute(sql: string = ""): Promise<mysqlResult> {
        if (!this.ping()) {
            this.connection = mysql.createConnection(connectConfig);
        }

        return await new Promise((res, rej) => {
            this.connection.query(sql != "" ? sql : this.sql, this.listValue, (error, result) => {
                this.connection.end();
                this.listValue = [];
                this.sql = this.sqlDefault;

                if (error)
                    rej(error);

                res(result);
            });
        });
    }

    public async get(fields: string[] = []): Promise<mysqlResult> {
        if (fields.length > 0)
            this.sql = this.sql.replace("*", fields.join(", "));

        if ((this instanceof Model) && this.constructor.name != "Model") {
            // console.log(this.constructor.name)
            const [_, ...listMethods] = Object.getOwnPropertyNames(this.constructor.prototype);
            // console.log(listMethods);
            this.listMethodChildren = listMethods;
        }

        // console.log(this[listMethods[0] as keyof this]);

        return await this.execute()
            .then(async (data: any) => {
                this.result = JSON.stringify(data);

                if (this.listMethodChildren.length > 0) {
                    for (let i: number = 0; i < data.length; i++) {
                        for (let j: number = 0; j < this.listMethodChildren.length; j++) {
                            data[i][this.listMethodChildren[j]] = (this[this.listMethodChildren[j] as keyof this] as Function)()({ ...data[i] });
                        }
                    }
                    return data;
                }

                return data;
            })
            .catch((error: mysql.QueryError) => error);
    }

    public async find(primaryKey: mysqlKey, fields: string[] = []) {
        this.where("id", "=", primaryKey);
        return await this.get(fields).then((data: any) => data);
    }

    public async first(fields: string[] = []) {
        return await this.get(fields)
            .then((data: any) => data[0])
            .catch(_ => null);
    }

    private escape(data: string): string {
        return `\`${data}\``;
    }

    public async create(data: {}) {
        this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
        const keys: string[] = Object.keys(data);

        this.sql = this.sql
            .replace("__FIELDS__", keys.map(key => this.escape(key)).join(", "))
            .replace("__VALUES__", Array(keys.length).fill("?").join(", "));

        this.listValue = keys.map((key: string) => {
            return data[key as keyof Object] as keyof mysqlValue;
        });

        return await this.execute()
        .then((data: any) => data as mysql.ResultSetHeader)
        .then(async (result: mysql.ResultSetHeader) => {
            if(result.affectedRows != 0 && result.insertId != 0) {
                this.where("id", result.insertId);
                for(const _key of keys) this.where(_key, data[_key as keyof typeof data]);

                return await this.first();
            }

            return true;
        })
        .catch((error) => error);
    }

    private getListKey(data: {}): string[] {
        const keys: string[] = Object.keys(data);
        return keys;
    }

    private getListValueForKey(keys: string[], obj: {}) {
        return keys.map((key: string) => obj[key as keyof typeof obj]);
    }

    private sqlConvertKeyAndValue(find: {}): string {
        const keys: string[] = this.getListKey(find);
        // const values: mysqlValue[] = this.getListValueForKey(keys, find);
        for(const key of keys) {
            this.where(key, find[key as keyof typeof find])
        }
        return this.sql;
    }

    private sqlToConvertKeyAndValue(find: {}): string {
        const temp: string = this.sql;
        const sql = this.sqlConvertKeyAndValue(find);
        this.sql = temp;
        return sql;
    }

    public async firstOrCreate(find: {}, create: {}) {
        this.sqlConvertKeyAndValue(find);
        const findFirstData = await this.first();
        let result: {type?: string, data?: any} = { type: "create" };
        return !findFirstData ? {...result, data: await this.create({...create, ...find})} : {type: "first", data: findFirstData};
    }

    public async update(data: Object) {
        this.sql = this.sql
            .replace(`SELECT * FROM ${this.tableName}`, `UPDATE ${this.tableName} SET (__FIELDS_AND_VALUES__)`);

        const keys: string[] = Object.keys(data);

        const _data: string[] = keys.map((key: any) => {
            return (this.escape(key) + " = " + data[key as keyof Object]);
        });

        this.sql = this.sql.replace("(__FIELDS_AND_VALUES__)", _data.join(", "));
        return await this.execute()
        .then((data) => data)
        .catch((error) => error);
    }

    private kiemTraDieuKien(sql: string, dieuKien: string = "AND"): string {
        return sql.includes("WHERE") ? dieuKien : "WHERE";
    }

    public where(field: string, condition: mysqlValue, value: mysqlValue = undefined) {
        const dieuKien: string = this.kiemTraDieuKien(this.sql);
        const checkCondition: boolean = value !== undefined && typeof (condition) === "string";

        this.sql += ` ${dieuKien} ${field} ${checkCondition ? condition : "="} ?`;
        this.listValue.push(checkCondition ? value : condition);
        // console.log(this.listValue);
        return this;
    }

    public orWhere(field: string, condition: mysqlValue, value: mysqlValue = undefined) {
        const dieuKien: string = this.kiemTraDieuKien(this.sql, "OR");
        const checkCondition: boolean = value !== undefined && typeof (condition) === "string";

        this.sql += ` ${dieuKien} ${field} ${checkCondition ? condition : "="} ?`;
        this.listValue.push(checkCondition ? value : condition);
        // console.log(this.listValue);
        return this;
    }

    public getQuery(): string {
        this.connection.end();
        return this.sql;
    }

    public getQueryNotConnection(): string {
        return this.sql;
    }

    public hasOne(tableName: any, primaryKey: string, foreign: string) {
        return (x: any) => {
            const q = tableName.where(primaryKey, x[foreign]);
            q.end();
            // const _sql: string = `SELECT ${tableName}.* FROM ${this.tableName}, ${tableName}
            // WHERE ${this.tableName}.${foreign} = ${tableName}.${primaryKey}
            // AND ${this.tableName}.${foreign} = ${x[foreign]} LIMIT 1`;

            return () => q.first(); //return this.execute(_sql).then((data: any) => data[0]);
        }
    }

    public hasMany(tableName: any, primaryKey: string, foreign: string) {
        return (x: any) => {
            const q = tableName.where(primaryKey, x[foreign]);
            q.end();
            return () => q.get();
        }
    }
}


class DB {
    public static table(tableName: string) {
        return new Model(tableName);
    }
}

export default class DatabaseBuilder {
    public static createConnection(config: mysql.ConnectionOptions) {
        connectConfig = config;

        return {
            DB,
            Model
        }
    }
}