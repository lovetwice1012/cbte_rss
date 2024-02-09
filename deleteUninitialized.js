const mysql = require('mysql');
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

async function execute() {
    connection.query('SELECT * FROM rss WHERE premium_flag = 0 AND username IS NULL AND webhook IS NULL', [], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        if (result.length > 0) {
            //もしcreated_atが72時間以上前の場合、削除
            for (let i = 0; i < result.length; i++) {
                if (new Date().getTime() - result[i].created_at > 259200000) {
                    connection.query('DELETE FROM rss WHERE id = ?', [result[i].id], (err, result) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            return;
                        }
                    });
                }
            }
        }
    });
}

execute();