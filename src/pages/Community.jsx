import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { initClient, analyzeNote } from '../services/gemini.js';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import AlertDialog from '../components/AlertDialog';
import { useUpload } from '../context/UploadContext';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const Community = () => {
    const { user } = useUpload();
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [processingStage, setProcessingStage] = useState('');

    // Alert State
    const [alertConfig, setAlertConfig] = useState({ isOpen: false });

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('community_notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching notes:', error);
        else setNotes(data || []);

        setLoading(false);
    };

    const showAlert = (type, title, message, isConfirm = false, onConfirm = null, onCancel = null) => {
        setAlertConfig({
            isOpen: true,
            type,
            title,
            message,
            isConfirm,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => {
                if (onCancel) onCancel();
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndInitiateUpload(e.target.files[0]);
        }
    };

    const validateAndInitiateUpload = async (file) => {
        if (!user) {
            showAlert('error', 'Authentication Required', 'Please log in to upload notes to the Community Vault.');
            return;
        }

        // 1. Validate File Format
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            showAlert(
                'error',
                'Unsupported File Format',
                'Please upload valid files only.\nSupported formats:\n• Images (JPG, PNG)\n• PDF Documents'
            );
            return;
        }

        // 2. Check PDF Page Limit
        if (file.type === 'application/pdf') {
            try {
                const buffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

                if (pdf.numPages > 2) {
                    showAlert(
                        'warning',
                        'PDF Page Limit Exceeded',
                        `This PDF has ${pdf.numPages} pages. AI extraction is limited to 2 pages.\n\nDo you still want to upload it? (AI Search will be disabled for this file).`,
                        true,
                        () => performUpload(file, true), // user inputs YES, skipAI = true
                        () => { } // user inputs NO, do nothing
                    );
                    return;
                }
            } catch (err) {
                console.error("PDF Validation failed:", err);
                showAlert('warning', 'PDF Validation Warning', 'Could not verify PDF page count. Proceeding with caution.');
            }
        }

        performUpload(file, false);
    };

    const performUpload = async (file, skipAI) => {
        setIsUploading(true);
        setProcessingStage('Starting Upload...');

        try {
            let aiData = { title: "Untitled Note", tags: [], ocrText: "" };
            if (skipAI) {
                aiData.ocrText = "AI Extraction Skipped: PDF exceeded 2-page limit.";
                aiData.tags = ["PDF", "Large Document"];
                aiData.title = file.name.replace('.pdf', '');
            }

            // 3. Upload Image/PDF to Storage
            setProcessingStage('Uploading File to Storage...');
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('notes_images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('notes_images')
                .getPublicUrl(filePath);

            // 4. Analyze with Gemini (if allowed)
            if (!skipAI) {
                setProcessingStage('AI Analyzing (OCR & Tagging)...');
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                const client = initClient(apiKey);

                try {
                    const jsonStr = await analyzeNote(client, "gemini-1.5-pro", file);
                    const cleanJson = jsonStr.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleanJson);
                    aiData = { ...aiData, ...parsed };
                } catch (err) {
                    console.error("AI Analysis failed:", err);
                    aiData.ocrText = "AI Analysis Failed. Please try manually later.";
                }
            }

            // 5. Save to Database
            setProcessingStage('Saving to Vault...');
            const { error: dbError } = await supabase
                .from('community_notes')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    title: aiData.title || file.name,
                    ocr_text: aiData.ocrText,
                    tags: aiData.tags
                });

            if (dbError) throw dbError;

            // Refresh
            await fetchNotes();
            showAlert('success', 'Upload Successful', 'Your note has been added to the Community Vault!');

        } catch (error) {
            console.error("Upload failed:", error);
            showAlert('error', 'Upload Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setIsUploading(false);
            setProcessingStage('');
        }
    };

    const filteredNotes = notes.filter(note => {
        const term = searchTerm.toLowerCase();
        return (
            note.title?.toLowerCase().includes(term) ||
            note.ocr_text?.toLowerCase().includes(term) ||
            note.tags?.some(tag => tag.toLowerCase().includes(term))
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-500">
                        Community Vault
                    </h1>
                    <p className="text-slate-400 mt-1">
                        The "Hostel-Wide" Knowledge Graph. Shared by students, for students.
                    </p>
                </div>

                {/* Search & Upload */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search (e.g. 'OOP', 'Network Security')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                    </div>

                    <label className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium cursor-pointer transition-all shadow-lg
                        ${isUploading
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:opacity-90 hover:scale-105'}
                    `}>
                        {isUploading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Plus size={18} />
                        )}
                        <span className="hidden sm:inline">
                            {isUploading ? 'Processing...' : 'Upload Note'}
                        </span>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Processing Status */}
            {isUploading && (
                <div className="mb-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <Loader2 className="text-teal-400 animate-spin" />
                        <div>
                            <p className="text-teal-400 font-medium">{processingStage}</p>
                            <p className="text-xs text-teal-400/70">
                                {processingStage.includes('AI') ? 'Using Gemini Pro to read your note...' : 'Please wait...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loader */}
            {loading && !isUploading && (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="text-slate-600 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredNotes.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300">Vault is Empty</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Be the first "Topper" to contribute! Upload a messy note and let AI handle the rest.
                    </p>
                </div>
            )}

            {/* Masonry Grid (CSS Columns) */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {filteredNotes.map((note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        onClick={() => setSelectedNote(note)}
                    />
                ))}
            </div>

            {/* Note Detail Modal */}
            {selectedNote && (
                <NoteModal
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                />
            )}

            {/* Custom Alert Dialog */}
            <AlertDialog
                {...alertConfig}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
            />

        </div>
    );
};

export default Community;
