import mysql from "mysql2";

export type mysqlResult = (mysql.QueryError | mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader);
export type mysqlValue = any;
export type mysqlKey = string | number;
export type MysqlResults = {} | {}[];

export interface IModelResult {
    data: MysqlResults,
    hidden?: MysqlResults
}