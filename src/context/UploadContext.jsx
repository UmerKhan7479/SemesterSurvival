import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
    const [syllabusFile, setSyllabusFile] = useState(null);
    const [pastPaperFiles, setPastPaperFiles] = useState([]);
    const [handoutsFile, setHandoutsFile] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [analysisData, setAnalysisData] = useState(null);

    // Auth State
    const [user, setUser] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);

    // Initialize Auth Listener
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchHistory(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchHistory(session.user.id);
            } else {
                setAnalysisHistory([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchHistory = async (userId) => {
        const { data, error } = await supabase
            .from('analysis_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) {
            // Map DB format back to App format
            const formatted = data.map(item => ({
                id: item.id,
                date: new Date(item.created_at).toLocaleDateString(),
                course: item.course_name,
                data: item.analysis_json,
                files: null // Files not persisted in this simple version
            }));
            setAnalysisHistory(formatted);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signup = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const loginWithProvider = async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        // State clears automatically via onAuthStateChange
        setSyllabusFile(null);
        setPastPaperFiles([]);
        setHandoutsFile(null);
        setCourseName("");
        setAnalysisData(null);
    };

    const addToHistory = async (report) => {
        // precise UI update immediately
        setAnalysisHistory(prev => [report, ...prev]);

        if (user) {
            // Persist to DB
            const { error } = await supabase.from('analysis_history').insert({
                user_id: user.id,
                course_name: report.course,
                analysis_json: report.data
            });
            if (error) console.error("Failed to save history:", error);
        }
    };

    const value = {
        syllabusFile, setSyllabusFile,
        pastPaperFiles, setPastPaperFiles,
        handoutsFile, setHandoutsFile,
        courseName, setCourseName,
        analysisData, setAnalysisData,
        user, login, logout, signup, loginWithProvider,
        analysisHistory, addToHistory
    };

    return (
        <UploadContext.Provider value={value}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error("useUpload must be used within an UploadProvider");
    }
    return context;
};
