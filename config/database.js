const mySql = require('mysql');

//Providing parameter of user and database to establish connection


// var pool = mySql.createPool({
//     connectionLimit: 30,
//     host: "db5000761806.hosting-data.io",
//     user: "dbu906981",
//     password: "Ateeb@123",
//     database: "dbs690686",
//     port:"3306"
// });
var pool = mySql.createPool({
    connectionLimit: 30,
    host: "192.185.82.187",
    user: "njeeksa_atayyab",
    password: "ateeb",
    database: "njeeksa_db",
    port:"3306"
});
module.exports = pool;
 