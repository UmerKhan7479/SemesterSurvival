import React from 'react';
import RiskCard from '../components/RiskCard';
import TopicCluster from '../components/TopicCluster';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';

const Analysis = () => {
    const location = useLocation();
    const { analysisData } = useUpload();

    // Prioritize Context data (persisted), then Location state (transient), then null
    const serverData = analysisData || location.state?.analysisData;

    console.log("Analysis Render:", { serverData });

    // Empty State Check
    if (!serverData) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in">
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                    <RefreshCw className="text-slate-500" size={48} />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-500">
                    No Analysis Generated
                </h2>
                <p className="text-slate-400 max-w-md">
                    Please upload your syllabus and past papers on the Dashboard to generate a new Risk Report.
                </p>
                <Link to="/" className="px-8 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    const riskData = serverData?.topics || [];
    const clusterData = serverData?.clusterData || [];

    const questionsBreakdown = serverData?.questionsBreakdown || [];
    const importantQuestions = serverData?.importantQuestions || [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-full glass-card hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Risk Analysis Report</h1>
                        <p className="text-slate-400 text-sm">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-medium hover:bg-primary/20 hover:text-primary transition-colors"
                >
                    <RefreshCw size={16} />
                    Re-Analyze
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Risk Grid */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Risk Cards */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">Topic Risk Assessment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(riskData) && riskData.map((item, idx) => (
                                <RiskCard
                                    key={idx}
                                    topic={item.name || item.topic}
                                    riskLevel={item.riskLevel || item.risk}
                                    probability={item.probability || item.prob}
                                    description={item.description || item.desc}
                                />
                            ))}
                        </div>
                    </div>

                    {/* NEW: Questions Breakdown */}
                    {questionsBreakdown.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl">
                            <h2 className="text-lg font-semibold text-slate-300 mb-4">Detailed Topic Mapping</h2>
                            <div className="space-y-4">
                                {questionsBreakdown.map((q, i) => q ? (
                                    <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                        <p className="text-white font-medium mb-1">"{q.questionText || "Question..."}"</p>
                                        <div className="flex gap-2 text-xs">
                                            <span className="bg-primary/20 text-primary px-2 py-1 rounded-md">{q.chapter || "N/A"}</span>
                                            <span className="bg-white/10 text-slate-400 px-2 py-1 rounded-md">{q.topic || "Unknown"}</span>
                                        </div>
                                    </div>
                                ) : null)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Analysis */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">Cluster Analysis</h2>
                        <TopicCluster data={clusterData} />
                    </div>

                    {/* NEW: Important Questions */}
                    {importantQuestions.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-warning">
                            <h3 className="font-bold mb-4 text-warning">Most Repeated Questions</h3>
                            <ul className="space-y-4">
                                {importantQuestions.map((q, i) => q ? (
                                    <li key={i} className="text-sm text-slate-300">
                                        <div className="font-bold text-white mb-1">Q: {q.question || "..."}</div>
                                        <div className="text-xs text-slate-500">{q.reason || ""}</div>
                                    </li>
                                ) : null)}
                            </ul>
                        </div>
                    )}

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold mb-4">Study Recommendations</h3>
                        <ul className="space-y-4">
                            {riskData.slice(0, 3).map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-300">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                                    {item.studyTip || item.desc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analysis;
