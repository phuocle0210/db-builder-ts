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

    public chapter() {
        return this.hasOne(new Chapter(), "manga_id", "id");
    }

    public chapters() {
        return this.hasMany(new Chapter(), "manga_id", "id");
    }
}

class Chapter extends Model {
    constructor() {
        super("chapters");
    }

    public manga() {
        return this.hasOne(new Manga(), "id", "manga_id");
    }
}

(async() => {
    // const m: Manga = new Manga();
    // const result: any = await m.get();
    // console.log(await result[0].chapters());

    const c: Chapter = new Chapter();
    const result: any = await c.get();
    console.log(JSON.stringify(result[0].created_at));

    // console.log((await DB.table("manga").first() as any).id);
})();
