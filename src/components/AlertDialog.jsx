import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AlertDialog = ({ isOpen, type = 'info', title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', isConfirm = false }) => {
    if (!isOpen) return null;

    const icons = {
        error: <AlertCircle className="text-red-500" size={32} />,
        warning: <AlertCircle className="text-amber-500" size={32} />,
        success: <CheckCircle className="text-emerald-500" size={32} />,
        info: <Info className="text-blue-500" size={32} />,
    };

    const bgColors = {
        error: "bg-red-500/10 border-red-500/20",
        warning: "bg-amber-500/10 border-amber-500/20",
        success: "bg-emerald-500/10 border-emerald-500/20",
        info: "bg-blue-500/10 border-blue-500/20",
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={isConfirm ? undefined : onConfirm}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className={`p-6 border-b border-white/5 flex gap-4 items-start ${bgColors[type]}`}>
                    <div className="shrink-0 p-2 bg-slate-950/50 rounded-full border border-white/5">
                        {icons[type]}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="p-4 bg-slate-900 flex justify-end gap-3">
                    {isConfirm && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-transform active:scale-95",
                            type === 'error' ? "bg-red-500 hover:bg-red-600" :
                                type === 'warning' ? "bg-amber-600 hover:bg-amber-700" :
                                    "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AlertDialog;
