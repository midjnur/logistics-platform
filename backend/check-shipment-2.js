const { Client } = require('pg');

const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'logistics_db',
    password: 'password',
    port: 5432,
});

async function check() {
    await client.connect();
    const res = await client.query("SELECT id, status FROM shipments WHERE id::text LIKE '277df7e4%'");
    console.log(res.rows);
    await client.end();
}

check();
