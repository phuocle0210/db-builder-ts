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

    console.log(await DB.table("chapters").firstOrCreate({
        manga_id: 59,
        title: "Chương 1",
        url: "https://truyenqqne.com/truyen-tranh/dai-su-phu-ha-son-11831-chap-1.html"
    }, {
        order: 1,
        views: 0,
        status: 1
    }));

    // console.log((await DB.table("manga").first() as any).id);
})();
