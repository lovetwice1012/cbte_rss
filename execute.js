const mysql = require('mysql');
const xml2js = require('xml2js');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'comebacktwitterembed',
    password: 'bluebird',
    database: 'ComebackTwitterEmbed'
});
async function execute() {
    return new Promise(async (resolve, reject) => {
        //RSSテーブルからデータを取得して変数rssに格納
        let rss = [];
        await new Promise(async (resolve, reject) => {
            connection.query('SELECT * FROM rss', (err, data) => {
                if (err) reject(err);
                rss = data;
                resolve();
            });
        });
        //取得したデータを一つずつ処理
        for (let i = 0; i < rss.length; i++) {
            // "https://nitter.sprink.cloud/{username}/rss" にアクセスして、XMLを取得
            let xml = {};
            try {
                xml = await new Promise((resolve, reject) => {
                    const https = require('https');
                    https.get(`https://nitter.sprink.cloud/${rss[i].username}/rss`, (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            resolve(data);
                        });
                    });
                });
            } catch (e) {
                console.log(e);
                continue;
            }
            //XMLをパース
            let parsed = {};
            try {
                parsed = await new Promise((resolve, reject) => {
                    xml2js.parseString(xml, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            } catch (e) {
                console.log(e);
                continue;
            }

            //pubDateをunixtimestampに変換したものがlastextractedより新しいものだけを取得
            let newItems = [];
            for (let j = 0; j < parsed.rss.channel[0].item.length; j++) {
                let pubDate = new Date(parsed.rss.channel[0].item[j].pubDate).getTime();
                if (pubDate > rss[i].lastextracted) {
                    newItems.push(parsed.rss.channel[0].item[j]);
                }
            }
            //新しいものがなければ次のループへ
            if (newItems.length === 0) continue;
            //linkのnitter.sprink.cloudをtwitter.comに変換し、変換したもののみの配列を作成
            const links = newItems.map((item) => {
                return item.link[0].replace('nitter.sprink.cloud', 'twitter.com');
            });

            //linksを改行で結合
            const linksString = links.join('\n');
            //linksStringが2000文字以上なら分割
            let linksArray = [];
            let stringsArray = [];
            if (linksString.length > 2000) {
                let linksArray = linksString.split('\n');
                let string = '';
                for (let j = 0; j < linksArray.length; j++) {
                    if (string.length + linksArray[j].length > 2000) {
                        stringsArray.push(string);
                        string = linksArray[j];
                    } else {
                        string += '\n' + linksArray[j];
                    }
                }
                stringsArray.push(string);
            } else {
                stringsArray.push(linksString);
            }
            //stringsArrayの中身をwebhookでそれぞれのチャンネルに送信
            for (let j = 0; j < stringsArray.length; j++) {
                const https = require('https');
                const data = JSON.stringify({
                    content: stringsArray[j]
                });
                // rss[i].webhook example https://discord.com/api/webhooks/1205121313308545034/BHgBDnguZ9d5ji4dA-l1IFHI-uMQXvfbSoF30LxiCVTZ25R2Wz__ZvqRjo0U3w_9IIGg
                const options = {
                    hostname: 'discord.com',
                    port: 443,
                    path: rss[i].webhook.split('discord.com')[1],
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
                };
                const req = https.request(options, (res) => {
                    console.log(`statusCode: ${res.statusCode}`);
                    res.on('data', (d) => {
                        process.stdout.write(d);
                    });
                });
                req.on('error', (error) => {
                    console.error(error);
                });
                req.write(data);
                req.end();
            }
            //最後にlastextractedを更新
            await new Promise((resolve, reject) => {
                connection.query('UPDATE rss SET lastextracted = ? WHERE username = ? AND webhook = ?', [Date.now(), rss[i].username, rss[i].webhook], (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }
        resolve();
    });
}
connection.connect(async (err) => {
    if (err) throw err;
    console.log('Connected!');
    await execute();
    connection.end();
});

