const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'admin',
    secretKey: 'password'
});

async function check() {
    try {
        console.log('Checking buckets...');
        const buckets = await minioClient.listBuckets();
        console.log('Buckets:', buckets);
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
