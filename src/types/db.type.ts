import mysql from "mysql2";

export type mysqlResult = (mysql.QueryError | mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader);
export type mysqlValue = string | number | boolean | undefined;
export type mysqlKey = string | number;