import * as fs from 'fs/promises';
import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

async function log(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${message}`);
}

async function encryptFile(filePath: string, password: string) {
    try {
        const data = await fs.readFile(filePath);
        const key = crypto.scryptSync(password, 'salt', 32);
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const outputFilePath = filePath + '_encrypted';
        await fs.writeFile(outputFilePath, Buffer.concat([iv, encrypted]));
        await log(`Berhasil mengenkripsi file ${filePath} menjadi ${outputFilePath}`);
    } catch (error) {
        await log(`Error ketika mengenkripsi file: ${error.message}`);
        throw error;
    }
}

async function decryptFile(filePath: string, password: string) {
    try {
        const data = await fs.readFile(filePath);
        const key = crypto.scryptSync(password, 'salt', 32);
        
        const iv = data.slice(0, 16);
        const encryptedText = data.slice(16);
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const outputFilePath = filePath.replace('_encrypted', '');
        await fs.writeFile(outputFilePath, decrypted);
        await log(`Berhasil mendekripsi file ${filePath} menjadi: ${outputFilePath}`);
    } catch (error) {
        if (error.message.includes('bad decrypt')) {
            await log(`Error, Terjadi Kesalahan: Password yang dimasukkan tidak tepat!`);
            throw new Error('Password yang dimasukkan tidak tepat!');
        }
        await log(`Error ketika mendekripsi file: ${error.message}`);
        throw error;
    }
}

async function main() {
    const [,, command, filePath, password] = process.argv;

    if (command === 'encrypt') {
        await encryptFile(filePath, password);
    } else if (command === 'decrypt') {
        await decryptFile(filePath, password);
    } else {
        console.error('Perintah tidak dikenali. Gunakan "encrypt" atau "decrypt" untuk melakukan perintah.');
    }
}

main().catch(console.error);
