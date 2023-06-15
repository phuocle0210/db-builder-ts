import Builder from "./src/pool";

const { DB } = Builder.createConnection({
    host: "103.130.216.152",
    user: "khotruye1_save",
    database: "khotruye1_save",
    password: "01634550752aA!",
    connectionLimit: 20
});

(async() => {
    for(let i = 1; i <= 1000; i+=1) {
        DB.table("users").firstOrCreate({
            username: "Hihihi",
            name: "Con chó này"
        }, {
            password: 1234214214
        })
        .then(data => console.log(data));
    }
})();