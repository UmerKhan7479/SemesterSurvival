import React, { useState } from 'react';
import { Upload, FileText, BookOpen, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { initClient, analyzeRiskReport } from '../services/gemini';

import { useUpload } from '../context/UploadContext';

const Dashboard = () => {
    // Use Global Context for Uploads
    const {
        syllabusFile, setSyllabusFile,
        pastPaperFiles, setPastPaperFiles,
        handoutsFile, setHandoutsFile,
        courseName, setCourseName,
        analysisData, setAnalysisData,
        analysisHistory, addToHistory
    } = useUpload();

    // Remove mock defaults - start empty/zero
    const [successRate, setSuccessRate] = useState(analysisData?.successProbability || 0);
    const [stats, setStats] = useState({
        papers: pastPaperFiles.length || 0,
        mapped: analysisData?.syllabusCoverage || 0,
        highRisk: analysisData?.topics ? analysisData.topics.filter(t => t.riskLevel?.toLowerCase() === 'high').length : 0
    });


    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const navigate = useNavigate();

    // Handle single file upload for now
    const handleSyllabusSelect = (file) => setSyllabusFile(file);
    const handlePaperSelect = (file) => setPastPaperFiles(file ? [file] : []);
    const handleHandoutSelect = (file) => setHandoutsFile(file);

    const handleAnalyze = async () => {
        if ((!syllabusFile && !courseName) || pastPaperFiles.length === 0) {
            alert("Please provide a Course Name (or Syllabus) and at least one Past Paper.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                alert("API Key missing! Please set VITE_GEMINI_API_KEY in .env");
                setIsAnalyzing(false);
                return;
            }

            const client = initClient(apiKey);

            // Use user input course name as context to avoid hallucination
            const contextText = courseName ? `Course: ${courseName}` : "General University Exam";

            const jsonString = await analyzeRiskReport(client, "gemma-3-27b-it", contextText, pastPaperFiles);

            // Clean up markdown code blocks if the model includes them
            const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            // Create History Record
            const historyItem = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                course: courseName || "Unknown Course",
                data: data,
                files: { syllabus: syllabusFile, papers: pastPaperFiles }
            };

            // Update State
            setAnalysisData(data); // Save to global context
            addToHistory(historyItem); // Add to history

            setSuccessRate(data.successProbability || 0);
            setStats({
                papers: pastPaperFiles.length,
                mapped: data.syllabusCoverage || 0,
                highRisk: data.topics.filter(t => t.riskLevel?.toLowerCase() === 'high').length
            });

            // Navigate or pass data to Analysis page (optional, for now just updating dashboard)
            console.log("Analysis Data:", data);
            navigate('/analysis'); // Context handles data passing now

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed. See console for details.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Hero Section / Success Probability */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Semester Probability of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Success</span></h2>
                        <p className="text-slate-400 mb-6 max-w-md">Based on your current uploads and syllabus coverage. Upload more past papers to increase accuracy.</p>
                        <Link to="/analysis" className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/25">
                            View Detailed Risk Report
                        </Link>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={502} strokeDashoffset={502 - (502 * successRate) / 100} className="text-accent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-bold text-white drop-shadow-md">{successRate}%</span>
                            <span className="text-xs text-accent uppercase tracking-widest mt-1">Success</span>
                        </div>
                    </div>

                    {/* Background elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold">{stats.papers}</h4>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Past Papers</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold">{stats.mapped}%</h4>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Syllabus Mapped</p>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold">{stats.highRisk}</h4>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">High Risk Topics</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Upload className="text-primary" size={24} />
                    <span>Upload Materials</span>
                </h3>

                {/* Course Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Course Name / Subject</label>
                    <input
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g. Data Warehousing, Linear Algebra..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleAnalyze();
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <FileUpload
                        label="Syllabus"
                        icon={BookOpen}
                        acceptedTypes=".pdf,.doc,.docx"
                        onFileSelect={handleSyllabusSelect}
                        file={syllabusFile}
                    />
                    <FileUpload
                        label="Past Papers"
                        icon={FileText}
                        acceptedTypes=".pdf,.jpg,.png"
                        onFileSelect={handlePaperSelect}
                        file={pastPaperFiles[0]}
                    />
                    <FileUpload
                        label="Handouts/Notes"
                        icon={FileText}
                        acceptedTypes=".pdf,.ppt,.pptx"
                        onFileSelect={handleHandoutSelect}
                        file={handoutsFile}
                    />
                </div>

                {/* Submit / Analyze Action */}
                <div className="flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={cn(
                            "group relative px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 flex items-center gap-3",
                            isAnalyzing ? "opacity-75 cursor-not-allowed" : "hover:scale-105"
                        )}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Analyzing via Gemini...
                            </>
                        ) : (
                            <>
                                Start Semester Analysis
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* History Section */}
            {analysisHistory.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FileText className="text-primary" size={24} />
                        <span>Recent Analysis History</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisHistory.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setAnalysisData(item.data);
                                    setCourseName(item.course);
                                    // Optionally restore files if needed
                                    navigate('/analysis');
                                }}
                                className="glass-panel p-5 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{item.course}</h4>
                                    <span className="text-xs text-slate-500">{item.date}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <AlertCircle size={14} className={item.data.successProbability > 70 ? "text-success" : "text-warning"} />
                                        <span>{item.data.successProbability}% Success</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
