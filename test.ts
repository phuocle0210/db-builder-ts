import DatabaseBuilder from "./src";

const { DB, Model } = DatabaseBuilder.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'nettruyen'
});

class Manga extends Model {
    constructor() {
        super("manga");
    }

    public user() {
        return this.hasOne("chapters", "manga_id", "id");
    }
}

(async() => {
    const m: Manga = new Manga();
    const result: any = await m.get();
    console.log(m.getResult());
})();
