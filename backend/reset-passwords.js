const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
    const config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'admin',
        password: process.env.POSTGRES_PASSWORD || 'password',
        database: process.env.POSTGRES_DB || 'logistics_db',
    };

    console.log(`Connecting to ${config.host}:${config.port} as ${config.user}...`);
    const client = new Client(config);

    try {
        await client.connect();

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password', salt);

        console.log('Resetting passwords to "password"...');

        // Update Shipper
        const shipperRes = await client.query(`
            UPDATE users 
            SET password_hash = $1 
            WHERE email = 'shipper@test.com'
            RETURNING id
        `, [hashedPassword]);

        if (shipperRes.rowCount > 0) {
            console.log('✅ Updated shipper@test.com');
        } else {
            console.log('⚠️ shipper@test.com not found. Inserting...');
            await client.query(`
                INSERT INTO users (email, phone, password_hash, role, first_name, last_name, company_name)
                VALUES ('shipper@test.com', '+1234567890', $1, 'SHIPPER', 'Shipper', 'User', 'Shipper Co')
            `, [hashedPassword]);
            console.log('✅ Created shipper@test.com');
        }

        // Update Carrier
        const carrierRes = await client.query(`
            UPDATE users 
            SET password_hash = $1 
            WHERE email = 'carrier@test.com'
            RETURNING id
        `, [hashedPassword]);

        if (carrierRes.rowCount > 0) {
            console.log('✅ Updated carrier@test.com');
        } else {
            console.log('⚠️ carrier@test.com not found. Inserting...');
            // Note: Carrier likely needs an entry in 'carriers' table too if we insert a new user
            // For now assuming if it exists we update, if not we warn or try best effort insert
            const userRes = await client.query(`
                INSERT INTO users (email, phone, password_hash, role)
                VALUES ('carrier@test.com', '+0987654321', $1, 'CARRIER')
                RETURNING id
            `, [hashedPassword]);
            const userId = userRes.rows[0].id;

            await client.query(`
                INSERT INTO carriers (user_id, first_name, last_name, passport_number)
                VALUES ($1, 'Carrier', 'User', 'PASS123')
            `, [userId]);
            console.log('✅ Created carrier@test.com');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
