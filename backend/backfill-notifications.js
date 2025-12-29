const { Client } = require('pg');

const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'logistics_db',
    password: 'password',
    port: 5432,
});

async function run() {
    await client.connect();

    try {
        // 1. Get Carrier Users
        const carriers = await client.query("SELECT id FROM users WHERE role = 'CARRIER'");
        if (carriers.rows.length === 0) {
            console.log('No carriers found.');
            return;
        }
        const carrierIds = carriers.rows.map(r => r.id);

        // 2. Get Open Shipments (Recent, e.g. unrelated to time, just OPEN)
        const shipments = await client.query("SELECT id, pickup_address, delivery_address, created_at FROM shipments WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT 5");

        console.log(`Found ${shipments.rows.length} open shipments.`);

        for (const shipment of shipments.rows) {
            const title = 'New Shipment Available';
            const message = `From ${shipment.pickup_address} to ${shipment.delivery_address}`;
            const type = 'SHIPMENT_CREATED';
            const metadata = JSON.stringify({ shipmentId: shipment.id });
            const createdAt = new Date().toISOString();
            // Use current time so it appears at top, or shipment time? Current time is better for "New Alert".

            for (const userId of carrierIds) {
                // Check if exists?
                // Ideally yes, but for this script we assume missing.
                // We'll just insert.

                await client.query(`
                  INSERT INTO notifications ("userId", title, message, type, metadata, "isRead", "createdAt")
                  VALUES ($1, $2, $3, $4, $5, false, $6)
              `, [userId, title, message, type, metadata, createdAt]);
            }
        }

        console.log(`Backfilled notifications for ${carrierIds.length} carriers.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
