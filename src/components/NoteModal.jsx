import React from 'react';
import { X, Download, Tag, FileText, Copy, Check } from 'lucide-react';

const NoteModal = ({ note, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    if (!note) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(note.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Determine extension dynamically
            const isPdf = note.image_url.toLowerCase().includes('.pdf');
            const ext = isPdf ? 'pdf' : 'jpg';
            link.download = `${note.title || 'note'}.${ext}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(note.image_url, '_blank');
        }
    };

    const handleCopyText = () => {
        if (note.ocr_text) {
            navigator.clipboard.writeText(note.ocr_text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isPdf = note.image_url && note.image_url.toLowerCase().includes('.pdf');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">

                {/* Close Button (Mobile) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 md:hidden bg-black/50 p-2 rounded-full text-white"
                >
                    <X size={20} />
                </button>

                {/* Left: Image/PDF View */}
                <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative group">
                    {isPdf ? (
                        <iframe
                            src={`${note.image_url}#toolbar=0`}
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    ) : (
                        <img
                            src={note.image_url}
                            alt={note.title}
                            className="max-h-[50vh] md:max-h-full w-auto object-contain"
                        />
                    )}

                    {/* Action Bar */}
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 transition-opacity ${isPdf ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform shadow-lg pointer-events-auto"
                        >
                            <Download size={18} /> Download
                        </button>
                    </div>
                </div>

                {/* Right: Details & Sidebar */}
                <div className="w-full md:w-1/3 flex flex-col bg-slate-900 border-l border-white/10">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2 leading-tight">{note.title || "Untitled Note"}</h2>
                            <div className="flex flex-wrap gap-2">
                                {note.tags && note.tags.map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button onClick={onClose} className="hidden md:block text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* OCR Text / Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} /> Extracted Text
                            </h3>
                            <button
                                onClick={handleCopyText}
                                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? "Copied" : "Copy Text"}
                            </button>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-xl border border-white/5 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono relative">
                            {note.ocr_text || "No text extracted."}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/5 md:hidden">
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform"
                        >
                            <Download size={18} /> Download Image
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default NoteModal;
