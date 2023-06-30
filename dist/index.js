"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
const moment_1 = __importDefault(require("moment"));
let connection;
let connectionConfig;
class Model {
    constructor(tableName) {
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
    getTableName() {
        return this.tableName;
    }
    ping() {
        try {
            this.connection.query("select 1");
        }
        catch (_) {
            return false;
        }
        return true;
    }
    end() {
        this.ping() && this.connection.end();
    }
    static response(data) {
        return JSON.parse(JSON.stringify(data));
    }
    formatCreatedAtAndUpdatedAt(results) {
        if (Array.isArray(results)) {
            return results.map(result => {
                result["created_at"] = "created_at" in result ? this.convertDate(result["created_at"]) : result["created_at"];
                result["updated_at"] = "updated_at" in result ? this.convertDate(result["updated_at"]) : result["updated_at"];
                return result;
            });
        }
        if ("created_at" in results) {
            results["created_at"] = this.convertDate(results["created_at"]);
        }
        if ("updated_at" in results) {
            results["updated_at"] = this.convertDate(results["updated_at"]);
        }
        return results;
    }
    showResult(results) {
        let showResult = { data: this.formatCreatedAtAndUpdatedAt(results) };
        if (this.hidden.length == 0 || showResult.data === undefined)
            return showResult;
        let hidden;
        if (Array.isArray(showResult.data)) {
            hidden = [];
            hidden = showResult.data.map(result => {
                const x = {};
                for (const key of this.hidden) {
                    x[key] = result[key];
                    delete result[key];
                }
                return x;
            });
            return { ...showResult, hidden };
        }
        hidden = {};
        for (const key of this.hidden) {
            hidden[key] = showResult.data[key];
            delete showResult.data[key];
        }
        return { ...showResult, hidden };
    }
    take(limit) {
        this.limit = limit;
        return this;
    }
    orderBy(field, orderBy = "ASC") {
        this.order = ` ORDER BY ${this.escape(field)} ${orderBy}`;
        return this;
    }
    orderByDesc(field) {
        return this.orderBy(field, "DESC");
    }
    orderByAsc(field) {
        return this.orderBy(field);
    }
    setOffSet(skip) {
        this.offset = skip;
        return this;
    }
    paginate(limit, page) {
        this.take(limit);
        page = page - 1 >= 0 ? (page - 1) : 0;
        this.offset = (page * limit);
        return this.execute()
            .then((data) => this.showResult(data))
            .then((data) => {
            return {
                ...data,
                current_page: (page + 1),
                total_page: data.data.length
            };
        });
    }
    async updateTimeStamp(field = "updated_at") {
        try {
            await this.update({
                [field]: this.getDateNow()
            });
            return true;
        }
        catch (_) {
            return false;
        }
    }
    async execute(sql = "") {
        if (!this.ping()) {
            this.connection = mysql2_1.default.createConnection(connectionConfig);
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
    getDateNow() {
        const format = "YYYY-MM-DD HH:mm:ss";
        return (0, moment_1.default)(Date.now()).format(format);
    }
    convertDate(timestamp) {
        const format = "YYYY-MM-DD HH:mm:ss";
        const date = (0, moment_1.default)(timestamp).format(format);
        return date;
    }
    save(model) {
        return () => {
            if ("updated_at" in this && "created_at" in this) {
                const format = "YYYY-MM-DD HH:mm:ss";
                this["created_at"] = (0, moment_1.default)(this["created_at"]).format(format);
                this["updated_at"] = (0, moment_1.default)(Date.now()).format(format);
            }
            return model.where("id", this["id"]).update(this);
        };
    }
    async get(fields = []) {
        return this.query(this.sql, fields);
    }
    async query(sql, fields = []) {
        if (fields.length > 0)
            this.sql = this.sql.replace("*", fields.join(", "));
        sql += this.order;
        if (this.limit != 0)
            sql += ` LIMIT ${this.limit} ${this.offset != 0 ? `OFFSET ${this.offset}` : ''}`;
        const targetName = this.constructor.name;
        if ((this instanceof Model) && targetName != "Model" && targetName != "ModelPool") {
            const [_, ...listMethods] = Object.getOwnPropertyNames(this.constructor.prototype);
            this.listMethodChildren = listMethods;
        }
        return this.execute(sql)
            .then(async (data) => {
            if (this.listMethodChildren.length > 0)
                for (const _data of data)
                    for (const methodChild of this.listMethodChildren)
                        _data[methodChild] = this[methodChild]()({ ..._data });
            if (data != undefined && Array.isArray(data) && data.length > 0)
                for (const d of data)
                    d["save"] = this.save.call(d, this);
            return this.showResult(data);
        })
            .catch((error) => {
            console.log(`ERROR::: ${error}`);
            return { data: [] };
        });
    }
    async find(primaryKey, fields = []) {
        this.where(this.primaryKey, "=", primaryKey);
        return await this.first(fields);
    }
    async first(fields = []) {
        this.take(1);
        return await this.query(this.sql, fields)
            .then(data => data)
            .then(({ data, hidden }) => {
            data = Array.isArray(data) && data.length > 0 ? data[0] : {};
            hidden = Array.isArray(hidden) && hidden.length > 0 ? hidden[0] : hidden;
            return { data, hidden };
        })
            .catch(_ => ({ data: {} }));
    }
    escape(data) {
        return `\`${data}\``;
    }
    async create(data) {
        this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
        const isArray = Array.isArray(data);
        const keys = Object.keys(isArray ? data[0] : data);
        const fillObject = Array(keys.length).fill("?");
        const fillResult = !isArray ? fillObject : Array(data.length).fill(`(${fillObject.join(", ")})`);
        if (isArray) {
            data.forEach((item) => keys.forEach((key) => this.listValue.push(item[key])));
        }
        else {
            this.listValue = keys.map(key => data[key]);
        }
        this.sql = this.sql
            .replace("__FIELDS__", keys.map(key => this.escape(key)).join(", "))
            .replace(isArray ? "(__VALUES__)" : "__VALUES__", fillResult.join(", "));
        return this.execute()
            .then((data) => data)
            .then(async (result) => {
            if (result.affectedRows != 0 && result.insertId != 0) {
                this.where("id", result.insertId);
                for (const _key of keys)
                    this.where(_key, data[_key]);
                const _result = await this.first();
                return _result;
            }
            return true;
        })
            .catch((err) => {
            console.log(err);
        });
    }
    getListKey(data) {
        const keys = Object.keys(data);
        return keys;
    }
    getListValueForKey(keys, obj) {
        return keys.map((key) => obj[key]);
    }
    sqlConvertKeyAndValue(find) {
        const keys = this.getListKey(find);
        // const values: mysqlValue[] = this.getListValueForKey(keys, find);
        for (const key of keys) {
            this.where(key, find[key]);
        }
        return this.sql;
    }
    sqlToConvertKeyAndValue(find) {
        const temp = this.sql;
        const sql = this.sqlConvertKeyAndValue(find);
        this.sql = temp;
        return sql;
    }
    async firstOrCreate(find, create = {}) {
        this.sqlConvertKeyAndValue(find);
        const findFirstData = await this.first();
        let result = { isCreated: false };
        return !findFirstData?.data || Object.keys(findFirstData.data).length == 0 ?
            { ...result, data: (await this.create({ ...create, ...find })) } :
            { isCreated: true, data: findFirstData };
    }
    async update(data) {
        data = Model.response(data);
        this.sql = this.sql
            .replace(`SELECT * FROM ${this.tableName}`, `UPDATE ${this.tableName} SET (__FIELDS_AND_VALUES__)`);
        const keys = Object.keys(data);
        const temp = this.listValue.length > 0 ? this.listValue : [];
        this.listValue = [];
        const _data = keys.map((key) => {
            this.listValue.push(data[key]);
            return (this.escape(key) + " = " + "?");
        });
        this.listValue = [...this.listValue, ...temp];
        this.sql = this.sql.replace("(__FIELDS_AND_VALUES__)", _data.join(", "));
        // console.log(this.sql, this.listValue);
        return await this.execute()
            .then((data) => data)
            .catch((error) => error);
    }
    kiemTraDieuKien(sql, dieuKien = "AND") {
        return sql.includes("WHERE") ? dieuKien : "WHERE";
    }
    where(field, condition, value = undefined) {
        const dieuKien = this.kiemTraDieuKien(this.sql);
        const checkCondition = value !== undefined && typeof (condition) === "string";
        this.sql += ` ${dieuKien} ${this.escape(field)} ${checkCondition ? condition : "="} ?`;
        this.listValue.push(checkCondition ? value : condition);
        // console.log(this.listValue);
        return this;
    }
    orWhere(field, condition, value = undefined) {
        const dieuKien = this.kiemTraDieuKien(this.sql, "OR");
        const checkCondition = value !== undefined && typeof (condition) === "string";
        this.sql += ` ${dieuKien} ${field} ${checkCondition ? condition : "="} ?`;
        this.listValue.push(checkCondition ? value : condition);
        // console.log(this.listValue);
        return this;
    }
    getQuery() {
        this.connection.end();
        return this.sql;
    }
    getQueryNotConnection() {
        return this.sql;
    }
    hasOne(tableName, primaryKey, foreign) {
        return (x) => {
            const tableNameRelationship = tableName.getTableName();
            const _sql = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]} LIMIT 1`;
            return async () => tableName.query(_sql)
                .then((data) => {
                return Array.isArray(data.data) ? data.data[0] : data.data;
            });
        };
    }
    hasMany(tableName, primaryKey, foreign) {
        return (x) => {
            const tableNameRelationship = tableName.getTableName();
            const sql = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]}`;
            return async () => {
                // console.log("da thuc thi", _sql, x);
                return tableName.query(sql);
            };
        };
    }
    //foreignKeyone la dinh nghia khoa ngoai cua doi tuong dang dinh nghia
    //foreignKeyTwo la dinh nghia khoa ngoai cua doi tuong muon join
    belongsToMany(target, tableName, foreignKeyOne, foreignKeyTwo) {
        return (x) => {
            /*
            SELECT m.name, c.* FROM `mangas` as m, `categories` as c, `categories_manga` cm
            WHERE m.id =  cm.manga_id
            AND c.id = cm.category_id;
            */
            const tableNameTarget = target.getTableName();
            const sql = `SELECT t1.* 
            FROM ${tableNameTarget} as t1, ${this.tableName} as t2, ${tableName} as t3
            WHERE t2.${this.primaryKey} = t3.${foreignKeyOne}
            AND t2.${this.primaryKey} = ${x.id}
            AND t1.${target.primaryKey} = t3.${foreignKeyTwo}`;
            return () => {
                return target.query(sql);
            };
        };
    }
}
exports.Model = Model;
class DB {
    static table(tableName) {
        return new Model(tableName);
    }
}
class DatabaseBuilder {
    static createConnection(config) {
        connectionConfig = config;
        connection = mysql2_1.default.createConnection(connectionConfig);
        return {
            DB,
            Model
        };
    }
}
exports.default = DatabaseBuilder;
