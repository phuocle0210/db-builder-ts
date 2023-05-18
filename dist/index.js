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
const mysql2_1 = __importDefault(require("mysql2"));
let connectConfig;
class DatabaseConnection {
    constructor(config = {}) {
        this.connection = mysql2_1.default.createConnection(connectConfig);
    }
}
class Model extends DatabaseConnection {
    constructor(tableName) {
        super();
        this.primaryKey = "id";
        this.tableName = tableName;
        this.sql = `SELECT * FROM ${this.tableName}`;
        this.listValue = [];
        this.hidden = [];
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((res, rej) => {
                this.connection.query(this.sql, this.listValue, (error, result) => {
                    this.connection.end();
                    this.listValue = [];
                    if (error)
                        rej(error);
                    res(result);
                });
            });
        });
    }
    get(fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fields.length > 0)
                this.sql = this.sql.replace("*", fields.join(", "));
            return yield this.execute()
                .catch((error) => error);
        });
    }
    find(primaryKey, fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            this.where("id", "=", primaryKey);
            return yield this.get(fields).then((data) => data);
        });
    }
    first(fields = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(fields)
                .then((data) => data[0])
                .catch(_ => null);
        });
    }
    escape(data) {
        return `\`${data}\``;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sql = `INSERT INTO ${this.tableName}(__FIELDS__) VALUES(__VALUES__)`;
            const keys = Object.keys(data);
            this.sql = this.sql
                .replace("__FIELDS__", keys.map(key => this.escape(key)).join(", "))
                .replace("__VALUES__", Array(keys.length).fill("?").join(", "));
            this.listValue = keys.map((key) => {
                return data[key];
            });
            return yield this.execute()
                .then((data) => data)
                .catch((error) => error);
        });
    }
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sql = `UPDATE ${this.tableName} SET (__FIELDS_AND_VALUES__)`;
            const keys = Object.keys(data);
            const _data = keys.map((key) => {
                return (this.escape(key) + " = " + data[key]);
            });
            this.sql = this.sql.replace("(__FIELDS_AND_VALUES__)", _data.join(", "));
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
        this.sql += ` ${dieuKien} ${field} ${checkCondition ? condition : "="} ?`;
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
}
class DB {
    static table(tableName) {
        return new Model(tableName);
    }
}
class DatabaseBuilder {
    static createConnection(config) {
        connectConfig = config;
        return {
            DB,
            Model
        };
    }
}
exports.default = DatabaseBuilder;
