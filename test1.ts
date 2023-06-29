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
    const { data: listManga }: IModelResult = await manga.take(5).orderByDesc("created_at").get();
    const { data: listChapter, hidden: hiddenListChapter }: IModelResult = await (listManga as any)[0].chapters();
    const { data: listChapterDetail }: IModelResult = await (listChapter as any)[0].chapterDetails();
    console.log(listChapterDetail);
})();