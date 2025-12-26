import React, { useCallback } from 'react';
import { Upload, File, CheckCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

const FileUpload = ({ label, icon: Icon, acceptedTypes, onFileSelect, status = 'idle', progress = 0, file = null }) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState(file);

    // Sync with external prop if it changes (e.g. from Context on remount)
    React.useEffect(() => {
        setSelectedFile(file);
    }, [file]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragOver(true);
        } else if (e.type === 'dragleave') {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setSelectedFile(droppedFile);
            onFileSelect(droppedFile);
        }
    }, [onFileSelect]);

    const removeFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        onFileSelect(null);
    }

    return (
        <div
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-4 h-64 glass-card overflow-hidden",
                isDragOver ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/10 hover:border-white/20",
                selectedFile ? "border-success/50 bg-success/5" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`file-input-${label}`).click()}
        >
            <input
                id={`file-input-${label}`}
                type="file"
                className="hidden"
                accept={acceptedTypes}
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        onFileSelect(file);
                    }
                }}
            />

            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                selectedFile ? "bg-success/20 text-success scale-110" : "bg-white/5 text-slate-400 group-hover:scale-110 group-hover:text-white"
            )}>
                {selectedFile ? <CheckCircle size={32} /> : <Icon size={32} />}
            </div>

            <div className="text-center z-10">
                <h3 className={cn("text-lg font-semibold mb-1", selectedFile ? "text-success" : "text-white")}>
                    {selectedFile ? "File Uploaded" : label}
                </h3>
                <p className="text-sm text-slate-400 max-w-[200px]">
                    {selectedFile ? selectedFile.name : "Drag & Drop or Click to Upload"}
                </p>
            </div>

            {status === 'processing' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {selectedFile && (
                <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            )}

            {/* Decorative gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        </div>
    );
};

export default FileUpload;
