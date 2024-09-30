const { Client } = require('pg');
//require('dotenv').config();

async function getConnection(){
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'Delleve',
        database: 'wastetracker'
    });
    
    await client.connect();
    return client;

}

    
module.exports = getConnection;
