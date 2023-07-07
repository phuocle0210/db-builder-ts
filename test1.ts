import Builder from "./src/pool";
import { IModelResult } from "./src/types/db.type";

const { DB, ModelPool } = Builder.createConnection({
    host: "103.130.216.152",
    user: "khotruye1_save",
    database: "khotruye1_save",
    password: "01634550752aA!",
    connectionLimit: 20
});


class Manga extends ModelPool {
    constructor() {
        super("mangas");
        this.hidden = ['id'];
    }

    chapters() {
        return this.hasMany(chapterModel, "manga_id", "id");
    }

    categories() {
        return this.belongsToMany(categoryModel, "categories_manga", "manga_id", "category_id");
    }
}

class Category extends ModelPool {
    constructor() {
        super("categories");
    }
}

class Chapter extends ModelPool {
    constructor() {
        super("chapters");
        this.hidden = ['manga_id', 'url'];
    }

    chapterDetails() {
        return this.hasMany(chapterDetailModel, "chapter_id", "id");
    }
}

class ChapterDetail extends ModelPool {
    constructor() {
        super("chapter_details"); 
    }
}

const chapterModel = new Chapter();
const chapterDetailModel = new ChapterDetail();
const categoryModel = new Category();
const manga: Manga = new Manga();

(async() => {
    const x = [61943,61944,61945,61946,61947,61948,61949,61950,61951,61952,61953,61954,61955,61956,61957,61958,61959,61960,61961,61962,61963,61964,61965,61966,61967,61968,61969,61970,61971,61972,61973,61974,61975,61976,61977,61978,61979,61980,61981,61982,61983,61984,61985,61986,61987,61988,61989,61990,61991,61992,61993,61994,61995,61996,61997,61998,61999,62000,62001,62002,62003,62004,62005,62006,62007,62008,62009,62010,62011,62012,62013,62014,62015,62016,62017,62018,62019,62020,62021,62022,62023,62024,62025,62026,62027,62028,62029,62030,62031,62032,62033,62034,62035,62036,62037,62038,62039,62040,62041,62042,62043,62044,62045,62046,62047,62048,62049,62050,62051,62052,62053,62054,62055,62056,62057,62058,62059,62060,62061,62062,62063,62064,62065,62066,62067,62068,62069,62070,62071,62072,62073,62074,62075,62076,62077,62078,62079,62080,62081,62082,62083,62084,62085,62086,62087,62088,62089,62090,62091,62092,62093,62094,62095,62096,62097,62098,62099,62100,62101,62102,62103,62104,62105,62106,62107,62108,62109,62110,62111,62112,62113,62114,181766,225578,305571,305572,307873];
    console.log(
        await DB.table("chapters")
        .where("manga_id", 1010)
        .where("website", "truyenqq")
        .whereNotIn('id', x)
        .delete()
        );
})();