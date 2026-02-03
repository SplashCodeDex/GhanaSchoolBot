import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * Script to generate tokens.json for Google Drive OAuth
 * Usage: npx ts-node src/utils/generate-tokens.ts
 */

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const CREDENTIALS_PATH = path.resolve(__dirname, '../../', config.googleDrive.credentialsPath);
const TOKEN_PATH = path.resolve(__dirname, '../../', config.googleDrive.tokenPath);

async function main() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error(`Error: Credentials file not found at ${CREDENTIALS_PATH}`);
        console.log('Please download your OAuth Desktop Client JSON from Google Cloud Console and save it as "client_secrets.json" in the root directory.');
        return;
    }

    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:');
    console.log(authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            if (!token) return console.error('Token is null');

            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program execution
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('Token stored to', TOKEN_PATH);
        });
    });
}

main().catch(console.error);
