import React, { useState } from 'react';
import { Upload, FileText, Zap, BookOpen, Download, Loader2, Sparkles } from 'lucide-react';
import { initClient, generateCheatSheetContent } from '../services/gemini.js';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const CheatSheetGenerator = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleGenerate = async () => {
        if (!file) {
            setError("Please upload a file first!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const client = initClient(apiKey);

            // Call our specific service function (handles extraction internally)
            const markdown = await generateCheatSheetContent(client, undefined, file);
            setResult(markdown);
        } catch (err) {
            console.error("Generation failed:", err);
            setError(`Generation failed: ${err.message || "Unknown error"}. Try a smaller file or different format.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const blob = new Blob([result], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cheat-Sheet-${file?.name || 'LastHour'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    Last Hour Rescue ⚡
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Turn that 50-page slide deck into a <span className="text-amber-400 font-bold">1-Page Survival Guide</span>.
                    Optimized for mobile reading on your way to the exam hall.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Upload & Controls */}
                <div className="bg-slate-900/50 border border-amber-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Upload className="text-amber-400" />
                        Upload Material
                    </h2>

                    <label className={`
                        border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                        ${file
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-white/10 hover:border-amber-400/50 hover:bg-white/5'}
                    `}>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="application/pdf,image/*,.pptx" />

                        {file ? (
                            <div className="text-center">
                                <FileText size={48} className="text-emerald-400 mx-auto mb-2" />
                                <p className="text-emerald-300 font-medium break-all">{file.name}</p>
                                <p className="text-xs text-emerald-500/70 mt-1">Ready to crunch!</p>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="font-medium">Drag PDF / Slides here</p>
                                <p className="text-xs opacity-50 mt-1">Accepts PDF, PPTX, Images</p>
                            </div>
                        )}
                    </label>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={!file || loading}
                        className={`
                            w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                            ${loading
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:scale-[1.02] hover:shadow-amber-500/25 active:scale-95'}
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Connecting to AI...
                            </>
                        ) : (
                            <>
                                <Sparkles className="fill-white" />
                                Generate Cheat Sheet
                            </>
                        )}
                    </button>

                    {/* Tips */}
                    <div className="mt-6 pt-6 border-t border-white/5 text-xs text-slate-500 space-y-2">
                        <p className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Extracts only definitions & formulas.</p>
                        <p className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Ignores introduction slides.</p>
                        <p className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> condenses 50 pages &rarr; 1 page.</p>
                    </div>
                </div>

                {/* Right Column: Result Preview */}
                <div className="min-h-[500px] relative">
                    <AnimatePresence mode='wait'>
                        {result ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col"
                            >
                                {/* Results Header */}
                                <div className="bg-slate-900/80 p-4 border-b border-white/10 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
                                    <h3 className="font-bold text-amber-400 flex items-center gap-2">
                                        <Zap size={18} />
                                        Your Survival Guide
                                    </h3>
                                    <button
                                        onClick={handleDownload}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Download Markdown"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>

                                {/* Markdown Content */}
                                <div className="p-6 overflow-y-auto max-h-[80vh] prose prose-invert prose-amber max-w-none">
                                    <style>{`
                                        .prose h1, .prose h2, .prose h3 { color: #fbbf24; margin-top: 1.5em; }
                                        .prose strong { color: #fff; }
                                        .prose ul { list-style-type: none; padding-left: 0; }
                                        .prose li { position: relative; padding-left: 1.5em; margin-bottom: 0.5em; }
                                        .prose li::before { content: "⚡"; position: absolute; left: 0; opacity: 0.7; }
                                    `}</style>
                                    <ReactMarkdown>{result}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl p-8 bg-slate-900/20">
                                <BookOpen size={64} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium opacity-50">Content will appear here</p>
                                <p className="text-sm opacity-30 max-w-xs text-center mt-2">
                                    Upload a document and hit generate to see the magic happen.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};

export default CheatSheetGenerator;
