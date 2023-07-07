"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const index_1 = require("./index");
let connectConfig;
class ModelPool extends index_1.Model {
    constructor(tableName) {
        super(tableName);
        this.enableLoop = false;
    }
    async execute(sql = "", index = 0) {
        var temp = this.listValue;
        try {
            return await new Promise((res, rej) => {
                connectConfig.getConnection((err, connection) => {
                    if (err) {
                        console.log("Không thể kết nối");
                        rej("Không thể kết nối");
                    }
                    try {
                        connection.query((sql != "" ? sql : this.sql), this.listValue, (error, results, fields) => {
                            this.sql = this.sqlDefault;
                            this.listValue = [];
                            this.limit = 0;
                            this.order = "";
                            if (error) {
                                rej(error);
                            }
                            res(results);
                        });
                        connection.release();
                    }
                    catch (ex) {
                        rej(ex);
                    }
                });
            });
        }
        catch (ex) {
            if (this.enableLoop && index <= 5) {
                return this.execute(sql, ++index);
            }
            console.log(ex, this.listValue, temp);
            throw ex;
        }
    }
    destroy() {
        try {
            connectConfig.end();
            return true;
        }
        catch (_) {
            return false;
        }
    }
}
class DB {
    static table(tableName) {
        return new ModelPool(tableName);
    }
    static destroy() {
        try {
            connectConfig.end();
            return true;
        }
        catch (_) {
            return false;
        }
    }
}
class DatabaseBuilder {
    static createConnection(config) {
        connectConfig = mysql2_1.default.createPool(config);
        return {
            DB,
            ModelPool
        };
    }
}
exports.default = DatabaseBuilder;
