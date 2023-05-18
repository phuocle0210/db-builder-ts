import DatabaseBuilder from "./src";

const { DB } = DatabaseBuilder.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'nettruyen'
});

(async() => {
    console.log(await DB.table("manga")
    .where("id", 1)
    .first());
})();
