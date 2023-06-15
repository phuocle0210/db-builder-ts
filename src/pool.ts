import mysql, { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise"

let connectConfig: mysql.Pool; 

type mysqlValue = any;

class Model {
    protected sql: string;
    private sqlDefault: string;
    protected tableName: string;
    protected promisePool: PoolConnection;
    protected listValue: any[];
    protected listField: string[];
    private listMethodChildren: any[];

    constructor(tableName: string) {
        this.tableName = tableName;
        this.sqlDefault = `SELECT * FROM ${this.tableName}`;
        this.sql = this.sqlDefault;
        this.listValue = [];
        this.listField = [];
        this.listMethodChildren = [];
        this.promisePool = connectConfig.promise();
    }

    private async execute(sql: string = "") {
        return await new Promise((res, rej) => {
            connectConfig.getConnection((err, connection) => {
                if (err) rej("Không thể kết nối");

                connection.query(sql != "" ? sql : this.sql, this.listValue, (error, results, fields) => {
                    this.listValue = [];
                    this.sql = this.sqlDefault;
                    connection.destroy();

                    if (error)rej(err);
                    // console.log(results);
                    res(results);
                });
            });
        });
    }

    public async get(fields: string[] = []) {
        if (fields.length > 0)
            this.sql = this.sql.replace("*", fields.join(", "));

        if ((this instanceof Model) && this.constructor.name != "Model") {
                // console.log(this.constructor.name)
            const [_, ...listMethods] = Object.getOwnPropertyNames(this.constructor.prototype);
                // console.log(listMethods);
            this.listMethodChildren = listMethods;
        }

        return await this.execute()
        .then(async (data: any) => {
            if (this.listMethodChildren.length > 0) {
                for (let i: number = 0; i < data.length; i++) {
                    for (let j: number = 0; j < this.listMethodChildren.length; j++) {
                        data[i][this.listMethodChildren[j]] = 
                        (this[this.listMethodChildren[j] as keyof this] as Function)()({ ...data[i] });
                    }
                }
                return data;
            }

            return data;
        })
        .catch(err => console.log(err));
    }

    public async first() {
        return await this.get()
        .then((data: any) => data[0])
        .catch(err => {
            console.log(err);
            return null;
        });
    }

    private escape(data: string): string { return `\`${data}\`` };

    private kiemTraDieuKien(sql: string, dieuKien: string = "AND"): string {
        return sql.includes("WHERE") ? dieuKien : "WHERE";
    }

    public where(field: string, condition: mysqlValue, value: mysqlValue = undefined) {
        const dieuKien: string = this.kiemTraDieuKien(this.sql);
        const checkCondition: boolean = value !== undefined && typeof (condition) === "string";

        this.sql += ` ${dieuKien} ${this.escape(field)} ${checkCondition ? condition : "="} ?`;
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

    public async create(data: {} | {}[]) {
        this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
        
        const isArray: boolean = Array.isArray(data);
        type dataType = keyof typeof data;

        const keys: string[] = Object.keys(isArray ? data[0 as dataType] : data);
        this.listField = keys;

        const fillObject: string[] = Array(keys.length).fill("?");
        const fillResult: string[] = !isArray ? fillObject : Array((data as typeof Array).length).fill(`(${fillObject.join(", ")})`);

        if(isArray) {
            (data as []).forEach((item) => keys.forEach((key) => this.listValue.push(item[key])));
        } else {
            this.listValue = keys.map(key => data[key as dataType]);
        }

        this.sql = this.sql
            .replace("__FIELDS__", keys.map(key => this.escape(key)).join(", "))
            .replace(isArray ? "(__VALUES__)" : "__VALUES__", fillResult.join(", "));

        return this.execute()
        .then((data: any) => data as ResultSetHeader)
        .then(async (result: ResultSetHeader) => {
            if(result.affectedRows != 0 && result.insertId != 0) {
                this.where("id", result.insertId);
                for(const _key of keys) this.where(_key, data[_key as keyof typeof data]);
                const _result = await this.first();
                return _result;
            }

            return true;
        });
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

    public async firstOrCreate(find: {}, create: {} = {}) {
        this.sqlConvertKeyAndValue(find);
        const findFirstData = await this.first();
        let result: {isCreated: boolean, data?: any} = { isCreated: false };

        return !findFirstData ? 
        {...result, data: (await this.create({...create, ...find})) } : 
        {isCreated: true, data: findFirstData};
    }

    public hasOne(tableName: any, primaryKey: string, foreign: string) {
        return (x: any) => {
            // const q = tableName.where(primaryKey, x[foreign]);
            // q.end();
            const tableNameRelationship: string = tableName.getTableName();

            const _sql: string = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]} LIMIT 1`;

            return () => this.execute(_sql).then((data: any) => data[0]); //return this.execute(_sql).then((data: any) => data[0]);
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
    public static createConnection(config: mysql.PoolOptions) {
        connectConfig = mysql.createPool(config);

        return {
            DB,
            Model
        }
    }
}