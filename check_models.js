import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
}

const apiKey = env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.log("No API Key found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function check() {
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-pro",
        "gemini-pro-vision"
    ];

    fs.writeFileSync('model_report.txt', "--- MODEL CHECK START ---\n");
    for (const m of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Test");
            await result.response;
            fs.appendFileSync('model_report.txt', `[PASS] ${m}\n`);
        } catch (e) {
            fs.appendFileSync('model_report.txt', `[FAIL] ${m} -> ${e.message.slice(0, 50)}\n`);
        }
    }
    fs.appendFileSync('model_report.txt', "--- MODEL CHECK END ---\n");
    console.log("Check complete. Read model_report.txt");
}

check();
