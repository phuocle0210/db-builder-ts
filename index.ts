import mysql from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey } from "./types/db.type";


class DatabaseConnection {
    protected connection: mysql.Connection;

    constructor() {
        this.connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "dulieu"
        });
    }
}

class DB {
    public static table(tableName: string) {
        return new Model(tableName);
    }
}

export class Model extends DatabaseConnection {
    private sql: string;
    protected tableName: string;
    private listValue: mysqlValue[];
    protected primaryKey: mysqlKey;
    protected hidden: string[];

    constructor(tableName: string) {
        super();

        this.primaryKey = "id";
        this.tableName = tableName;
        this.sql = `SELECT * FROM ${this.tableName}`;
        this.listValue = [];
        this.hidden = [];
    }

    private async execute(): Promise<mysqlResult> {
        return await new Promise((res, rej) => {
            this.connection.query(this.sql, this.listValue, (error, result) => {
                this.connection.end();
                this.listValue = [];

                if(error)
                    rej(error);
                
                res(result);
            });
        });
    }

    public async get(fields: string[] = []): Promise<mysqlResult> {
        if(fields.length > 0) 
            this.sql = this.sql.replace("*", fields.join(", "));

        return await this.execute()
        .catch((error: mysql.QueryError) => error);
    }

    public async find(primaryKey: mysqlKey, fields: string[] = []) {
        this.where("id", "=", primaryKey);
        return await this.get(fields).then((data: any) => data);
    }

    public async create(data: Object) {
        this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
        const keys: string[] = Object.keys(data);
        
        this.sql = this.sql
        .replace("__FIELDS__", keys.join(", "))
        .replace("__VALUES__", Array(keys.length).fill("?").join(", "));

        this.listValue = keys.map((key: string) => {
            return data[key as keyof Object] as keyof mysqlValue;
        });

        return await this.execute()
        .then(() => true)
        .catch((error) => error);
    }

    public async update() {

    }

    public where(field: string, condition: mysqlValue, value: mysqlValue = undefined) {
        const dieuKien: string = this.sql.includes("where") ? "AND" : "WHERE";
        const checkCondition: boolean = value !== undefined && typeof(condition) === "string";

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
}
