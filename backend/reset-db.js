const { Client } = require('pg');

async function main() {
    // Try to use environment variables or reasonable defaults
    const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'admin',
        password: process.env.POSTGRES_PASSWORD || 'password',
        database: process.env.POSTGRES_DB || 'logistics_db',
    };

    console.log(`Connecting to ${config.host}:${config.port} as ${config.user} to db ${config.database}...`);

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected successfully.');

        // Check tables
        const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log('Found tables:', tables.join(', '));

        if (tables.includes('offers')) {
            console.log('Truncating offers...');
            await client.query('TRUNCATE TABLE offers CASCADE');
        } else {
            console.log('Table "offers" not found. Skipping.');
        }

        if (tables.includes('documents')) {
            console.log('Deleting shipment documents...');
            await client.query('DELETE FROM documents WHERE shipment_id IS NOT NULL');
        }

        if (tables.includes('shipments')) {
            console.log('Truncating shipments...');
            await client.query('TRUNCATE TABLE shipments CASCADE');
        }

        console.log('Done.');
    } catch (err) {
        console.error('Error executing reset:', err);
    } finally {
        await client.end();
    }
}

main();
