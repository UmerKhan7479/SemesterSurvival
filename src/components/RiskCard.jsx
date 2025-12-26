import React from 'react';
import { cn } from '../lib/utils';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const RiskCard = ({ topic, riskLevel, probability, description, color }) => {
    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return 'text-danger bg-danger/10 border-danger/20';
            case 'medium': return 'text-warning bg-warning/10 border-warning/20';
            case 'low': return 'text-success bg-success/10 border-success/20';
            default: return 'text-slate-400';
        }
    };

    const getBarColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return 'bg-danger';
            case 'medium': return 'bg-warning';
            case 'low': return 'bg-success';
            default: return 'bg-slate-400';
        }
    }

    return (
        <div className="glass-card p-5 rounded-2xl hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{topic}</h3>
                        <span className={cn("px-2 py-1 rounded-md text-xs font-bold border", getRiskColor(riskLevel))}>
                            {riskLevel.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{description}</p>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-slate-400 font-medium">Appearance Probability</span>
                        <span className="text-xl font-bold font-mono">{probability}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", getBarColor(riskLevel))}
                            style={{ width: `${probability}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Glow effect */}
            <div className={cn(
                "absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity",
                getBarColor(riskLevel)
            )} />

        </div>
    );
};

export default RiskCard;
