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
        return this.hasMany(new Chapter(), "manga_id", "id");
    }

    categories() {
        return this.belongsToMany(new Category(), "categories_manga", "manga_id", "category_id");
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
        return this.hasMany(new ChapterDetail(), "chapter_id", "id");
    }
}

class ChapterDetail extends ModelPool {
    constructor() {
        super("chapter_details"); 
    }
}

(async() => {
    const manga: Manga = new Manga();
    const { data, hidden }: IModelResult = await manga
    .take(5)
    .orderByDesc("created_at")
    .get();
    
    console.log(hidden)
    console.log(await (data as any)[1].categories());
})();