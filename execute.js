const mysql = require('mysql');
const xml2js = require('xml2js');
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

//もし引数に--premiumがあれば、premium_flagが1のものだけを処理
let premium_flag = 0;
if (process.argv.includes('--premium')) {
    premium_flag = 1;
}


const webProxyURLList = [
    "https://us1.proxysite.com/includes/process.php?action=update",
    "https://us2.proxysite.com/includes/process.php?action=update",
    "https://us3.proxysite.com/includes/process.php?action=update",
    "https://us4.proxysite.com/includes/process.php?action=update",
    "https://us5.proxysite.com/includes/process.php?action=update",
    "https://us6.proxysite.com/includes/process.php?action=update",
    "https://us7.proxysite.com/includes/process.php?action=update",
    "https://us8.proxysite.com/includes/process.php?action=update",
    "https://us9.proxysite.com/includes/process.php?action=update",
    "https://us10.proxysite.com/includes/process.php?action=update",
    "https://us11.proxysite.com/includes/process.php?action=update",
    "https://us12.proxysite.com/includes/process.php?action=update",
    "https://us13.proxysite.com/includes/process.php?action=update",
    "https://us14.proxysite.com/includes/process.php?action=update",
    "https://us15.proxysite.com/includes/process.php?action=update",
    "https://us16.proxysite.com/includes/process.php?action=update",
    "https://us17.proxysite.com/includes/process.php?action=update",
    "https://us18.proxysite.com/includes/process.php?action=update",
    "https://us19.proxysite.com/includes/process.php?action=update",
    "https://us20.proxysite.com/includes/process.php?action=update"
];

/* proxy request example

fetch(webwebProxyURLList[i % webProxyURLList.length], {
    "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*\/*;q=0.8",
    "accept-language": "ja;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Brave\";v=\"122\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-site",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "cookie": "PHPSESSID=77jr1evi3epoi7u7nqpculf5l6",
    "Referer": "https://www.proxysite.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": encodeURIComponent(`server-option=${webwebProxyURLList[i % webProxyURLList.length].split("/")[2].split(".")[0]}&d=https%3A%2F%2Fnitter.poast.org%2F${rss[i].username}%2Frss&allowCookies=on`),
    "method": "POST"
});

*/

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
        if (premium_flag === 1) rss = rss.filter((item) => item.premium_flag === 1);
        //取得したデータを一つずつ処理
        for (let i = 0; i < rss.length; i++) {
            if (rss[i].webhook === null) continue;
            if (rss[i].username === null) continue;
            // "https://nitter.poast.org/{username}/rss" にアクセスして、XMLを取得するが、もし失敗したら　"https://nitter.sprink.cloud/{username}/rss" にアクセスして、XMLを取得
            let xml = {};
            try {
                xml = await new Promise((resolve, reject) => {
                    fetch(webwebProxyURLList[i % webProxyURLList.length], {
                        "headers": {
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*\/*;q=0.8",
                        "accept-language": "ja;q=0.8",
                        "cache-control": "no-cache",
                        "content-type": "application/x-www-form-urlencoded",
                        "pragma": "no-cache",
                        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Brave\";v=\"122\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "document",
                        "sec-fetch-mode": "navigate",
                        "sec-fetch-site": "same-site",
                        "sec-fetch-user": "?1",
                        "sec-gpc": "1",
                        "upgrade-insecure-requests": "1",
                        "cookie": "PHPSESSID=77jr1evi3epoi7u7nqpculf5l6",
                        "Referer": "https://www.proxysite.com/",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                        },
                        "body": encodeURIComponent(`server-option=${webwebProxyURLList[i % webProxyURLList.length].split("/")[2].split(".")[0]}&d=https%3A%2F%2Fnitter.poast.org%2F${rss[i].username}%2Frss&allowCookies=on`),
                        "method": "POST"
                    }).then(async (res) => {
                        console.log(res.status)
                        const text = await res.text()
                        console.log(text)
                        if (res.status === 429){
                            console.log("rate limit exceeded")
                            console.log("wait 15 seconds to pass the rate limit")
                            await new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    resolve();
                                }
                                , 15000);
                            });
                            i--;
                            return reject("rate limit exceeded");
                        }
                        if(res.status === 404){
                            await new Promise((resolve, reject) => {
                                connection.query('DELETE FROM rss WHERE id = ?', [rss[i].id], (err) => {
                                    if (err) reject(err);
                                    reject();
                                });
                            });
                        }
                        console.log("wait 10 seconds to pass the rate limit")
                        await new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve();
                            }, 10000);
                        });
                        resolve(text);
                        console.log("done")
                    }).catch((e) => {

                        console.error(e);
                        if(e === "rate limit exceeded"){
                            return reject(e);
                        }
                        //if connection refused kill the process
                        if(e.code === "ECONNREFUSED"){
                            process.exit(0);
                        }
                        const https = require('https');
                        https.get(`https://nitter.sprink.cloud/${rss[i].username}/rss`, (res) => {
                            let data = '';
                            res.on('data', (chunk) => {
                                data += chunk;
                            });
                            res.on('end', () => {
                                resolve(data);
                            });
                        }).on('error', (e) => {
                            console.error(e);
                            reject(e);
                        });
                    });
                })
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
                console.log(xml);
                console.log(e);
                continue;
            }

            //pubDateをunixtimestampに変換したものがlastextractedより新しいものだけを取得
            let newItems = [];
            if(parsed?.rss?.channel[0]?.item === undefined || parsed?.rss?.channel[0]?.item === null) continue;
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
                req.on('error', async (error) => {
                    console.error(error);
                    if(req.statusCode === 404){
                        await new Promise((resolve, reject) => {
                            connection.query('DELETE FROM rss WHERE id = ?', [rss[i].id], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        });
                    }
                });
                req.write(data);
                req.end();
            }
            //最後にlastextractedを更新
            await new Promise((resolve, reject) => {
                connection.query('UPDATE rss SET lastextracted = ? WHERE id = ? AND username = ? AND webhook = ?', [Date.now(), rss[i].id, rss[i].username, rss[i].webhook], (err) => {
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

