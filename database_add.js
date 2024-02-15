const mysql = require('mysql');
const fs = require('fs');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'comebacktwitterembed',
    password: 'bluebird',
    database: 'ComebackTwitterEmbed'
});

process.on('uncaughtException', function (err) {
    console.log(err);
});

process.on('unhandledRejection', function (err) {
    console.log(err);
});

//sql.txtから文字列を取得して改行で分割
let sql = fs.readFileSync('sql.txt', 'utf-8').split('\n');
//取得した文字列を一つずつ実行
for (let i = 0; i < sql.length; i++)
    connection.query(sql[i], (err) => {
        if (err) console.log(err);
    });

connection.end();

