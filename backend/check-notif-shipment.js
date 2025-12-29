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
    const res = await client.query("SELECT id, status, shipper_id FROM shipments WHERE id::text LIKE '%fd494eea%'");
    console.log('Shipment:', res.rows);

    if (res.rows.length > 0) {
        const offers = await client.query("SELECT id, carrier_id, status, offered_price FROM offers WHERE shipment_id = $1", [res.rows[0].id]);
        console.log('Offers:', offers.rows);
    }

    await client.end();
}

check();
