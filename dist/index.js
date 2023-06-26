"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    showResult(results) {
        let showResult = { data: results };
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
            return Object.assign(Object.assign({}, showResult), { hidden });
        }
        hidden = {};
        for (const key of this.hidden) {
            hidden[key] = showResult.data[key];
            delete showResult.data[key];
        }
        return Object.assign(Object.assign({}, showResult), { hidden });
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
            return Object.assign(Object.assign({}, data), { current_page: (page + 1), total_page: data.data.length });
        });
    }
    updateTimeStamp(field = "updated_at") {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    execute(sql = "") {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ping()) {
                this.connection = mysql2_1.default.createConnection(connectionConfig);
            }
            this.sql += this.order;
            if (this.limit != 0)
                this.sql += ` LIMIT ${this.limit} OFFSET ${this.offset}`;
            return yield new Promise((res, rej) => {
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
        });
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
    get(fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fields.length > 0)
                this.sql = this.sql.replace("*", fields.join(", "));
            const targetName = this.constructor.name;
            if ((this instanceof Model) && targetName != "Model" && targetName != "ModelPool") {
                // console.log(this.constructor.name)
                const [_, ...listMethods] = Object.getOwnPropertyNames(this.constructor.prototype);
                // console.log(listMethods);
                this.listMethodChildren = listMethods;
            }
            // console.log(this[listMethods[0] as keyof this]);
            return yield this.execute()
                .then((data) => __awaiter(this, void 0, void 0, function* () {
                if (this.listMethodChildren.length > 0) {
                    // for (let i: number = 0; i < data.length; i++) {
                    //     for (let j: number = 0; j < this.listMethodChildren.length; j++) {
                    //         data[i][this.listMethodChildren[j]] = 
                    //         (this[this.listMethodChildren[j] as keyof this] as Function)()({ ...data[i] });
                    //     }
                    // }
                    for (const _data of data)
                        for (const methodChild of this.listMethodChildren)
                            _data[methodChild] = this[methodChild]()(Object.assign({}, _data));
                }
                for (const d of data) {
                    d["save"] = this.save.call(d, this);
                }
                // console.log(this.showResult(data));
                return this.showResult(data);
            }))
                .catch((error) => {
                console.log(error);
                return { data: [] };
            });
        });
    }
    find(primaryKey, fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            this.where(this.primaryKey, "=", primaryKey);
            return yield this.first(fields);
        });
    }
    first(fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(fields)
                .then(data => data)
                .then(({ data, hidden }) => {
                data = Array.isArray(data) && data.length > 0 ? data[0] : data;
                hidden = Array.isArray(hidden) && hidden.length > 0 ? hidden[0] : hidden;
                return { data, hidden };
            })
                .catch(_ => ({ data: {}, hidden: undefined }));
        });
    }
    escape(data) {
        return `\`${data}\``;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                .then((result) => __awaiter(this, void 0, void 0, function* () {
                if (result.affectedRows != 0 && result.insertId != 0) {
                    this.where("id", result.insertId);
                    for (const _key of keys)
                        this.where(_key, data[_key]);
                    const _result = yield this.first();
                    return _result;
                }
                return true;
            }))
                .catch((err) => {
                console.log(err);
            });
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
    firstOrCreate(find, create = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sqlConvertKeyAndValue(find);
            const findFirstData = yield this.first();
            let result = { isCreated: false };
            return !(findFirstData === null || findFirstData === void 0 ? void 0 : findFirstData.data) || Object.keys(findFirstData.data).length == 0 ? Object.assign(Object.assign({}, result), { data: (yield this.create(Object.assign(Object.assign({}, create), find))) }) :
                { isCreated: true, data: findFirstData };
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            console.log(this.sql, this.listValue);
            return yield this.execute()
                .then((data) => data)
                .catch((error) => error);
        });
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
            // const q = tableName.where(primaryKey, x[foreign]);
            // q.end();
            const tableNameRelationship = tableName.getTableName();
            const _sql = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]} LIMIT 1`;
            return () => this.execute(_sql).then((data) => tableName.showResult(data[0])); //return this.execute(_sql).then((data: any) => data[0]);
        };
    }
    hasMany(tableName, primaryKey, foreign) {
        return (x) => {
            const tableNameRelationship = tableName.getTableName();
            tableName.sql = `SELECT ${tableNameRelationship}.* FROM ${this.tableName}, ${tableNameRelationship}
            WHERE ${this.tableName}.${foreign} = ${tableNameRelationship}.${primaryKey}
            AND ${this.tableName}.${foreign} = ${x[foreign]}`;
            return () => {
                // console.log("da thuc thi", _sql, x);
                return tableName.get();
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
            target.sql = `SELECT t1.* 
            FROM ${tableNameTarget} as t1, ${this.tableName} as t2, ${tableName} as t3
            WHERE t2.${this.primaryKey} = t3.${foreignKeyOne}
            AND t2.${this.primaryKey} = ${x.id}
            AND t1.${target.primaryKey} = t3.${foreignKeyTwo}`;
            // console.log(target.sql);
            return () => target.get();
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
