import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("No Supabase Credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectNotes() {
    console.log("--- Inspecting Database Notes ---");
    const { data: notes, error } = await supabase
        .from('community_notes')
        .select('id, title, image_url, tags')
        .limit(20);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (notes.length === 0) {
        console.log("Database is completely empty.");
    } else {
        console.log(`Found ${notes.length} total notes.`);
        notes.forEach(n => {
            console.log(`[${n.id}] ${n.title}`);
            console.log(`   URL: ${n.image_url}`);
            console.log(`   Tags: ${JSON.stringify(n.tags)}`);
            const isPdfUrl = n.image_url.toLowerCase().includes('.pdf');
            const hasPdfTag = n.tags && n.tags.includes('PDF');
            console.log(`   -> Is PDF? URL: ${isPdfUrl}, Tag: ${hasPdfTag}`);
            console.log("-".repeat(20));
        });
    }
}

inspectNotes();
