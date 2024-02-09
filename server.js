const expless = require('express');
const bodyParser = require('body-parser');
const app = expless();
const port = 3844;
const crypto = require('crypto')
const DiscordOauth2 = require("discord-oauth2");
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: '192.168.100.22',
    user: 'comebacktwitterembed',
    password: 'bluebird',
    database: 'ComebackTwitterEmbed'
});

const allowed_nonpremium_users_count = 20; 

// MySQLに接続
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

const oauth = new DiscordOauth2({
	clientId: "1161267455335862282",
	clientSecret: "nHw4FFnrqVwQTLQ3tVh-vadvXTeS6vSk",
	redirectUri: "https://autoextract.sprink.cloud/callback",
    //redirectUri: "http://localhost:3040/callback",
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const url = oauth.generateAuthUrl({
        scope: ["identify", "guilds"],
        state: crypto.randomBytes(16).toString("hex"),
    });
    //redirect to discord oauth2 url
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const token = await oauth.tokenRequest({
        code: code,
        scope: ["identify", "guilds"],
        grantType: "authorization_code",
    });
    const user = await oauth.getUser(token.access_token);
    const guilds = await oauth.getUserGuilds(token.access_token);
    //サーバーID1132814274734067772のサーバーに所属しているか確認
    const server = guilds.find(g => g.id === "1132814274734067772");
    if (!server) {
        res.send('条件を満たしていません。公式サーバーのアナウンスチャンネルを確認してください。');
        return;
    }
    //rssテーブルに同じuseridでpremium_flagが0のものがあるか確認
    connection.query('SELECT * FROM rss WHERE userid = ? AND premium_flag = 0', [user.id], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        if (result.length > 0) {
            //あれば登録を拒否する
            res.send('すでに登録されています');
        } else {
            //なければ新規作成
            //もしpremium_flagが1のものがあればregister?premium=1にリダイレクト
            connection.query('SELECT * FROM rss WHERE userid = ? AND premium_flag = 1 AND username IS NULL AND webhook IS NULL', [user.id], (err, result) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return;
                }
                if (result.length > 0) {
                    res.redirect('https://autoextract.sprink.cloud/register?premium=1&userid=' + user.id);
                    return;
                }else{
                    //もしpremium_flagが0のものがallowed_nonpremium_users_countより多ければ拒否
                    connection.query('SELECT * FROM rss WHERE premium_flag = 0', (err, result) => {
                        if (err) {
                            console.error('Error executing query:', err);
                            return;
                        }
                        if (result.length >= allowed_nonpremium_users_count) {
                            res.send('登録数が上限に達しています');
                            return;
                        }else{
                            connection.query('INSERT INTO rss (userid, created_at) VALUES (?, ?)', [user.id, new Date().getTime()], (err, result) => {
                                if (err) {
                                    console.error('Error executing query:', err);
                                    return;
                                }
                                res.redirect('https://autoextract.sprink.cloud/register?userid=' + user.id);
                            });
                        }
                    });
                }
            });
        }
    });
});

app.get('/register', (req, res) => {
    //register.htmlを返す
    res.sendFile(__dirname + '/html/register.html');
});

app.post('/register', (req, res) => {
    //POSTされたデータを受け取る
    const userid = req.body.userid;
    const username = req.body.username;
    const webhook = req.body.webhook;
    const premium = req.body.premium;
    const premium_code = req.body.premium_code;
    //データがundefinedかnullか空文字か確認
    if (!userid || !username || !webhook || !premium) {
        res.send('登録に失敗しました(パラメーター異常)');
        return;
    }
    //premiumが1の場合
    if (premium === '1') {
        //rssテーブルに同じuseridでpremium_flagが1のものがあり、usernameとwebhookがNULLのもので同じpremium_codeがあるか確認
        connection.query('SELECT * FROM rss WHERE userid = ? AND premium_flag = 1 AND username IS NULL AND webhook IS NULL AND premium_code = ?', [userid, premium_code], (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }
            if (result.length > 0) {
                //あればusernameとwebhookを更新
                connection.query('UPDATE rss SET username = ?, webhook = ? WHERE userid = ? AND premium_flag = 1 AND username IS NULL AND webhook IS NULL AND premium_code = ?', [username, webhook, userid, premium_code], (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return;
                    }
                    res.send('登録が完了しました');
                });
            } else {
                res.send('登録に失敗しました');
            }
        });
    } else {
        //premiumが0の場合
        //rssテーブルに同じuseridでpremium_flagが0のものがあり、usernameとwebhookがNULLのものがあるか確認
        connection.query('SELECT * FROM rss WHERE userid = ? AND premium_flag = 0 AND username IS NULL AND webhook IS NULL', [userid], (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }
            if (result.length > 0) {
                //あればusernameとwebhookを更新
                connection.query('UPDATE rss SET username = ?, webhook = ? WHERE userid = ? AND premium_flag = 0 AND username IS NULL AND webhook IS NULL', [username, webhook, userid], (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return;
                    }
                    res.send('登録が完了しました');
                });
            } else {
                res.send('登録に失敗しました(パラメーター不正)');
            }
        });
    }
});



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
