import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually since we can't depend on dotenv being installed (Vite project)
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
    console.error("Error: Could not find Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPdfs() {
    console.log("Searching for PDFs to delete...");

    // 1. Find the notes
    const { data: notes, error: fetchError } = await supabase
        .from('community_notes')
        .select('*')
        .or('image_url.ilike.%.pdf,tags.cs.{"PDF"}');

    if (fetchError) {
        console.error("Error fetching notes:", fetchError);
        return;
    }

    if (!notes || notes.length === 0) {
        console.log("No PDF notes found.");
        return;
    }

    console.log(`Found ${notes.length} PDF notes. Deleting...`);

    // 2. Delete from Storage
    const filePaths = notes.map(note => {
        // Extract path from public URL
        // URL format: .../storage/v1/object/public/notes_images/USER_ID/FILE_NAME
        const parts = note.image_url.split('/notes_images/');
        return parts.length > 1 ? parts[1] : null;
    }).filter(p => p !== null);

    if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
            .from('notes_images')
            .remove(filePaths);

        if (storageError) console.error("Error deleting files from storage:", storageError);
        else console.log(`Deleted ${filePaths.length} files from storage.`);
    }

    // 3. Delete from Database
    const ids = notes.map(n => n.id);
    const { error: deleteError } = await supabase
        .from('community_notes')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error("Error deleting records:", deleteError);
    } else {
        console.log("Successfully deleted PDF records from database.");
    }
}

cleanupPdfs();
