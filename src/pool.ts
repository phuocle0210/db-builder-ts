import mysql, { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { Model } from "./index";

let connectConfig: mysql.Pool;

class ModelPool extends Model {
    public enableLoop: boolean;

    constructor(tableName: string) {
        super(tableName);
        this.enableLoop = false;
    }

    protected override async execute(sql: string = "", index: number = 0): Promise<any> {
        try {
            return await new Promise((res, rej) => {
                connectConfig.getConnection((err, connection) => {
                    if (err) {
                        console.log("Không thể kết nối");
                        rej("Không thể kết nối");
                    }
    
                    try {
                        
                        connection.query(sql != "" ? sql : this.sql, this.listValue, (error, results, fields) => {
                            this.listValue = [];
                            this.sql = this.sqlDefault;
                            this.limit = 0;
                            this.order = "";
    
                            if (error) {
                                rej(error);
                            }

                            res(results);
                        });
    
                        connection.release();
                    } catch (ex) {
                        rej(ex);
                    }
                });
            });
        } catch(ex) {
            if(this.enableLoop && index <= 5) {
                return this.execute(sql, ++index);
            }

            console.log(ex, this.listValue);
            throw ex;
        }
    }

    public destroy(): boolean {
        try {
            connectConfig.end();
            return true;
        } catch (_) {
            return false;
        }
    }
}

class DB {
    public static table(tableName: string) {
        return new ModelPool(tableName);
    }

    public static destroy(): boolean {
        try {
            connectConfig.end();
            return true;
        } catch (_) {
            return false;
        }
    }
}

export default class DatabaseBuilder {
    public static createConnection(config: mysql.PoolOptions) {
        connectConfig = mysql.createPool(config);

        return {
            DB,
            ModelPool
        }
    }
}