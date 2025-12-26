import React from 'react';
import { Tag, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

const NoteCard = ({ note, onClick }) => {
    return (
        <div
            onClick={() => onClick(note)}
            className="group relative break-inside-avoid mb-6 cursor-pointer"
        >
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">

                {/* Image / Preview */}
                <div className="aspect-[3/4] w-full overflow-hidden bg-slate-800 relative flex items-center justify-center">
                    {note.image_url && note.image_url.toLowerCase().includes('.pdf') ? (
                        <div className="flex flex-col items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-500">
                            <FileText size={64} className="mb-2" />
                            <span className="text-sm font-bold text-slate-300">PDF Document</span>
                        </div>
                    ) : note.image_url ? (
                        <img
                            src={note.image_url}
                            alt={note.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-600">
                            <FileText size={48} />
                        </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {note.title || "Untitled Note"}
                    </h3>

                    <div className="flex flex-wrap gap-1.5">
                        {note.tags && note.tags.slice(0, 3).map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 text-[10px] font-medium text-slate-300"
                            >
                                <Tag size={10} /> {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteCard;
