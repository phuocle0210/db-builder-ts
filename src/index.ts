import mysql, { ResultSetHeader } from "mysql2";
import { mysqlResult, mysqlValue, mysqlKey, MysqlResults, IModelResult } from "./types/db.type";
import moment from "moment";

type ConnectType = mysql.Connection | mysql.Pool;

let connection: ConnectType;
let connectionConfig: mysql.ConnectionOptions;

export class Model {
    public sql: string;
    protected sqlDefault: string;
    protected tableName: string;
    protected listValue: mysqlValue[];
    public primaryKey: string;
    protected hidden: string[];
    protected listMethodChildren: string[];
    protected connection: ConnectType;
    protected limit: number;
    protected order: string;
    protected offset: number;

    constructor(tableName: string) {
        this.listMethodChildren = [];
        this.primaryKey = "id";
        this.tableName = tableName;
        this.connection = connection;
        this.limit = 0;
        this.offset = 0;
        this.order = "";

        this.sqlDefault = `SELECT * FROM ${this.tableName}`;
        this.sql = this.sqlDefault;
        
        this.listValue = [];
        this.hidden = [];
    }

    public getTableName(): string {
        return this.tableName;
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
        this.ping() && this.connection.end();
    }

    public static response(data: MysqlResults) {
        return JSON.parse(JSON.stringify(data));
    }

    private formatCreatedAtAndUpdatedAt(results: MysqlResults) {
        if(Array.isArray(results)) {
            return results.map(result => {
                result["created_at"] = "created_at" in result ? this.convertDate(result["created_at"]) : result["created_at"];
                result["updated_at"] = "updated_at" in result ? this.convertDate(result["updated_at"]) : result["updated_at"];
                return result;
            });
        }

        if("created_at" in results) {
            results["created_at"] = this.convertDate(results["created_at"] as string);
        }

        if("updated_at" in results) {
            results["updated_at"] = this.convertDate(results["updated_at"] as string);
        }

        return results;
    }

    public showResult(results: MysqlResults) {
        let showResult: IModelResult = {data: this.formatCreatedAtAndUpdatedAt(results)};

        if(this.hidden.length == 0 || showResult.data === undefined)
            return showResult;

        let hidden: typeof results;
        type ResultType = keyof typeof results;

        if(Array.isArray(showResult.data)) {
            hidden = [];

            hidden = showResult.data.map(result => {
                const x: typeof showResult.data[0] = {};

                for(const key of this.hidden) {
                    x[key as ResultType] = result[key as ResultType];
                    delete result[key as ResultType];
                }

                return x;
            });

            return {...showResult, hidden};
        }

        hidden = {};

        for(const key of this.hidden) {
            type ResultType = keyof typeof results;
            hidden[key as ResultType] = showResult.data[key as ResultType];
            delete showResult.data[key as ResultType];
        }

        return {...showResult, hidden};
    }

    public take(limit: number): this {
        this.limit = limit;
        return this;
    }

    public orderBy(field: string, orderBy: "ASC" | "DESC" = "ASC"): this {
        this.order = ` ORDER BY ${this.escape(field)} ${orderBy}`;
        return this;
    }

    public orderByDesc(field: string): this {
        return this.orderBy(field, "DESC");
    }

    public orderByAsc(field: string) {
        return this.orderBy(field);
    }

    public setOffSet(skip: number) {
        this.offset = skip;
        return this;
    }

    public paginate(limit: number, page: number) {
        this.take(limit);

        page = page - 1 >= 0 ? (page - 1) : 0;

        this.offset = (page * limit);

        return this.execute()
        .then((data: mysqlResult) => this.showResult(data))
        .then((data: IModelResult) => {
            return {
                ...data,
                current_page: (page + 1),
                total_page: (data.data as []).length
            }
        });
    }

    public async updateTimeStamp(field: string = "updated_at"): Promise<boolean> {
        try {
            await this.update({
                [field]: this.getDateNow()
            });
            return true;
        } catch(_) {
            return false;
        }
    }

    protected async execute(sql: string = ""): Promise<mysqlResult> {
        if (!this.ping()) {
            this.connection = mysql.createConnection(connectionConfig);
        }
        return await new Promise((res, rej) => {
            this.connection.query(sql != "" ? sql : this.sql, this.listValue, (error, result, fields) => {
                this.connection.end();

                this.listValue = [];
                this.sql = this.sqlDefault;
                this.limit = 0;
                this.order = "";

                if (error)
                    rej(error);

                res(result);
            });
        });
    }

    private getDateNow(): string {
        const format = "YYYY-MM-DD HH:mm:ss";
        return moment(Date.now()).format(format);
    }

    private convertDate(timestamp: string) {
        const format = "YYYY-MM-DD HH:mm:ss";
        const date = moment(timestamp as string).format(format);
        return date;
    }

    private save(model: this) {
        return () => {
            if("updated_at" in this && "created_at" in this) {
                const format = "YYYY-MM-DD HH:mm:ss";
                this["created_at"] = moment(this["created_at"] as string).format(format);
                this["updated_at"] = moment(Date.now()).format(format);
            }

            return model.where("id", this["id" as keyof this]).update(this);
        }
    }

    public async get(fields: string[] = []): Promise<IModelResult> {
        return this.query(this.sql, fields);
    }

    public async query(sql: string, fields: string[] = []) {
        if (fields.length > 0)
            this.sql = this.sql.replace("*", fields.join(", "));

        sql += this.order;
                        
        if (this.limit != 0)
            sql += ` LIMIT ${this.limit} ${this.offset != 0 ? `OFFSET ${this.offset}` : ''}`;

        const targetName: string = this.constructor.name;
        if ((this instanceof Model) && targetName != "Model" && targetName != "ModelPool") {
            const [_, ...listMethods] = Object.getOwnPropertyNames(this.constructor.prototype);
            this.listMethodChildren = listMethods;
        }

        return this.execute(sql)
        .then(async (data: any) => {
            if(this.listMethodChildren.length > 0)
                for(const _data of data)
                    for(const methodChild of this.listMethodChildren as string[])
                        _data[methodChild] = (this[methodChild as keyof this] as Function)()({ ..._data });

            if(data != undefined && Array.isArray(data) && data.length > 0)
                for(const d of data) d["save"] = this.save.call(d, this);
            
            return this.showResult(data);
        })
        .catch((error: any) => {
            console.log(`ERROR::: ${error}`);
            return { data: [] }
        });
    }

    public async find(primaryKey: mysqlKey, fields: string[] = []) {
        this.where(this.primaryKey, "=", primaryKey);
        return await this.first(fields);
    }

    public async first(fields: string[] = []): Promise<IModelResult> {
        this.take(1);

        return await this.query(this.sql, fields)
        .then(data => data as IModelResult)
        .then(({ data, hidden}) => {
            data = Array.isArray(data) && data.length > 0 ? data[0] : {};
            hidden = Array.isArray(hidden) && hidden.length > 0 ? hidden[0] : hidden;
            return {data, hidden};
        })
        .catch(_ => ({data: {}}));
    }

    private escape(data: string): string {
        return `\`${data}\``;
    }

    public async create(data: {}) {
        this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
        
        const isArray: boolean = Array.isArray(data);
        type dataType = keyof typeof data;

        const keys: string[] = Object.keys(isArray ? data[0 as dataType] : data);

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
        })
        .catch((err) => {
            console.log(err);
        })
    }

    protected getListKey(data: {}): string[] {
        const keys: string[] = Object.keys(data);
        return keys;
    }

    protected getListValueForKey(keys: string[], obj: {}) {
        return keys.map((key: string) => obj[key as keyof typeof obj]);
    }

    protected sqlConvertKeyAndValue(find: {}): string {
        const keys: string[] = this.getListKey(find);
        // const values: mysqlValue[] = this.getListValueForKey(keys, find);
        for(const key of keys) {
            this.where(key, find[key as keyof typeof find])
        }
        return this.sql;
    }

    protected sqlToConvertKeyAndValue(find: {}): string {
        const temp: string = this.sql;
        const sql = this.sqlConvertKeyAndValue(find);
        this.sql = temp;
        return sql;
    }

    public async firstOrCreate(find: {}, create: {} = {}) {
        this.sqlConvertKeyAndValue(find);
        const findFirstData = await this.first();
        let result: {isCreated: boolean, data?: any} = { isCreated: false };

        return !findFirstData?.data || Object.keys(findFirstData.data).length == 0 ? 
        {...result, data: (await this.create({...create, ...find})) } : 
        {isCreated: true, data: findFirstData};
    }

    public async update(data: Object) {
        data = Model.response(data);

        this.sql = this.sql
            .replace(`SELECT * FROM ${this.tableName}`, `UPDATE ${this.tableName} SET (__FIELDS_AND_VALUES__)`);

        const keys: string[] = Object.keys(data);
        const temp: any[] = this.listValue.length > 0 ? this.listValue : [];
        this.listValue = [];

        const _data: string[] = keys.map((key: any) => {
            this.listValue.push(data[key as keyof Object]);
            return (this.escape(key) + " = " + "?");
        });

        this.listValue = [...this.listValue, ...temp];

        this.sql = this.sql.replace("(__FIELDS_AND_VALUES__)", _data.join(", "));

        // console.log(this.sql, this.listValue);
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

    public getQuery(): string {
        this.connection.end();
        return this.sql;
    }

    public getQueryNotConnection(): string {
        return this.sql;
    }

    protected hasOne(tableName: any, primaryKey: string, foreign: string) {
        return (x: any) => {
            const tableNameRelationship: string = tableName.getTableName();

            const _sql: string = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]} LIMIT 1`;

            return async () => tableName.query(_sql)
            .then((data: IModelResult) => {
                return Array.isArray(data.data) ? data.data[0] : data.data
            });
        }
    }

    protected hasMany(tableName: any, primaryKey: string, foreign: string) {
        return (x: any) => {
            const tableNameRelationship: string = tableName.getTableName();

            const sql: string = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]}`;

            return async () => {
                // console.log("da thuc thi", _sql, x);
                return tableName.query(sql);
            };
        }
    }

    //foreignKeyone la dinh nghia khoa ngoai cua doi tuong dang dinh nghia
    //foreignKeyTwo la dinh nghia khoa ngoai cua doi tuong muon join
    protected belongsToMany(target: any, tableName: string, foreignKeyOne: string, foreignKeyTwo: string) {
        return (x: any) => {
            /* 
            SELECT m.name, c.* FROM `mangas` as m, `categories` as c, `categories_manga` cm 
            WHERE m.id =  cm.manga_id
            AND c.id = cm.category_id;
            */
            const tableNameTarget = target.getTableName();

            const sql: string = `SELECT t1.* 
            FROM ${tableNameTarget} as t1, ${this.tableName} as t2, ${tableName} as t3
            WHERE t2.${this.primaryKey} = t3.${foreignKeyOne}
            AND t2.${this.primaryKey} = ${x.id}
            AND t1.${target.primaryKey} = t3.${foreignKeyTwo}`;

            return () => {
                return target.query(sql);
            };
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
        connectionConfig = config;
        connection = mysql.createConnection(connectionConfig);

        return {
            DB,
            Model
        }
    }
}