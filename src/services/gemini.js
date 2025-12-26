import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Initialize the Google GenAI client.
 * @param {string} apiKey 
 * @returns {GoogleGenerativeAI | null}
 */
export const initClient = (apiKey) => {
    if (!apiKey) {
        return null;
    }
    try {
        return new GoogleGenerativeAI(apiKey);
    } catch (error) {
        console.error("Failed to initialize client:", error);
        throw new Error(`Failed to initialize client: ${error.message}`);
    }
};

/**
 * Analyzes an exam question image against a syllabus to map topics.
 * @param {GoogleGenerativeAI} client 
 * @param {string} modelId 
 * @param {string} syllabusText 
 * @param {File} imageFile 
 * @returns {Promise<string>}
 */
const analyzePaperMapping = async (client, modelId, syllabusText, imageFile) => {
    const model = client.getGenerativeModel({ model: modelId });

    const prompt = `
    SYLLABUS CONTENT:
    ${syllabusText.substring(0, 30000)} # Truncate to avoid context limit if huge

    TASK:
    Analyze the provided image of an exam paper.
    For each visible question:
    1. Identify the question text.
    2. Find the exact matching Chapter or Topic in the Syllabus.
    3. Provide a 'Study Tip' based on the syllabus context.
    `;

    const imagePart = await fileToGenerativePart(imageFile);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
};

/**
 * Analyzes multiple past papers to generate a risk and probability report.
 * @param {GoogleGenerativeAI} client 
 * @param {string} modelId 
 * @param {string} syllabusText 
 * @param {File[]} imageFiles 
 * @returns {Promise<string>}
 */
export const analyzeRiskReport = async (client, modelId = "gemma-3-27b-it", syllabusText, imageFiles) => {
    const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
            temperature: 0.3,
            // responseMimeType: "application/json" // Gemma-3-27b-it does not support this yet
        }
    });

    const prompt = `
    You are a Statistical Analyst for University Exams.
    
    SYLLABUS / CONTEXT:
    ${syllabusText.substring(0, 20000)}
    
    TASK:
    1. Analyze ALL the provided images of past papers. 
    2. FIRST, EXTRACT all visible questions TRANSCRIBED EXACTLY from the images. Do not invent questions.
    3. If the images are blurry, do your best to transcribe the actual text present.
    4. Count how often specific Topics (relevant to the Syllabus/Context) appear.
    5. Generate a Risk Report in JSON format.
    6. IMPORTANT: Return ONLY valid JSON.

    OUTPUT JSON SCHEMA:
    {
        "successProbability": number, // 0-100 estimate
        "syllabusCoverage": number, // 0-100 estimate
        "topics": [
            {
                "name": "Topic Name",
                "frequency": "High" | "Medium" | "Low",
                "riskLevel": "High" | "Medium" | "Low",
                "probability": number, // 0-100
                "description": "Brief explanation",
                "studyTip": "Actionable tip" 
            }
        ],
        "clusterData": [
            { "x": number, "y": number, "z": number, "risk": "High" | "Medium" | "Low" }
        ],
        "questionsBreakdown": [
            {
                "questionText": "Short excerpt of question...",
                "chapter": "Chapter Name",
                "year": "2023/2024 etc (estimate)",
                "topic": "Specific Topic"
            }
        ],
        "importantQuestions": [
            {
                "question": "Full question text",
                "reason": "Repeated 3 times",
                "priority": "High"
            }
        ]
    }
    `;

    const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
};

import * as pdfjsLib from 'pdfjs-dist';

// Explicitly set worker to the matching version on unpkg to avoid version mismatches
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF file.
 * @param {File} file 
 * @returns {Promise<string>}
 */
const extractPdfText = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load the document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = "";

        // Limit pages to avoid browser freeze on huge files
        const maxPages = Math.min(pdf.numPages, 30);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Add a space between items to prevent words merging
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `\n--- Page ${i} ---\n${pageText}`;
        }

        return fullText;
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        throw new Error("Could not read PDF text. Please ensure it is a valid text-based PDF.");
    }
};

/**
 * Generates a condensed cheat sheet from a slide deck or notes file.
 * Generates a condensed cheat sheet with model fallback.
 * @param {GoogleGenerativeAI} client 
 * @param {string} ignoredModelId - Ignored in favor of fallback list
 * @param {File} file 
 * @returns {Promise<string>} Markdown string
 */
export const generateCheatSheetContent = async (client, ignoredModelId, file) => {
    // 1. Extract Text
    let promptContext = "";
    if (file.type === "application/pdf") {
        promptContext = await extractPdfText(file);
    } else {
        throw new Error("Current mode supports PDF files only for 50+ page analysis.");
    }

    if (!promptContext || promptContext.length < 50) {
        throw new Error("Extracted text is too short. Is this a scanned image PDF? Try a text-based PDF.");
    }

    // 2. Define Model Candidates provided by Google AI Studio
    // Order: User Request (Gemma 3) -> Experimental (2.0) -> Best/Cheapest (1.5 Flash) -> Legacy
    const candidates = [
        "gemma-3-27b-it",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.0-pro"
    ];

    let lastError = null;

    // 3. Attempt Generation with Fallback
    for (const modelId of candidates) {
        try {
            console.log(`Attempting model: ${modelId}`);
            const model = client.getGenerativeModel({
                model: modelId,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192
                }
            });

            const prompt = `
            You are a "Last Hour" Revision Expert.
            
            TASK:
            Analyze the following course notes/slides text and create a **Single-Page Smart Cheat Sheet**.
            
            GOAL:
            The student has their exam in 1 hour. They need to memorize the CRITICAL information only.
            
            OUTPUT FORMAT:
            - **Header**: Course Title & "Last Hour Guide"
            - **Section 1: The "Must Memorize" Formulas/Definitions** (Use LaTeX or clean text)
            - **Section 2: Key Concepts vs. Common Pitfalls**
            - **Section 3: Timeline / Process Flows**
            - **Section 4: Golden Keywords**
            
            CONSTRAINTS:
            - IGNORE introductions, generic examples.
            - Condense into 1-2 mobile screens.
            - Use Emoji bullets (⚠️, 💡, ⚡).
            - Format strictly as Markdown.
            
            INPUT TEXT:
            ${promptContext.substring(0, 30000)} 
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (err) {
            console.warn(`Model ${modelId} failed:`, err.message);
            lastError = err;
            // Continue to next candidate
        }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message || "Unknown"}`);
};

/**
 * Analyzes a note image to extract title, tags, and text.
 * @param {GoogleGenerativeAI} client
 * @param {string} modelId
 * @param {File} imageFile
 * @returns {Promise<string>} JSON string
 */
export const analyzeNote = async (client, modelId = "gemini-1.5-pro", imageFile) => {
    const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
            temperature: 0.1, // Lower temperature for more factual extraction
            maxOutputTokens: 8192,
        }
    });

    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = `
    You are an EXPERT OCR SYSTEM.
    Analyze this document (PDF/Image) of study notes.

    YOUR TASKS:
    1. **Title**: Generate a concise title.
    2. **Tags**: Identify key tags.
    3. **OCR / Full Text**: Perform a VERBATIM transcription.
       
    TRANSCRIPTION RULES:
    - EXTRACT TEXT FROM EVERY SINGLE PAGE. Do not stop after the first page.
    - DO NOT SUMMARIZE. Write the exact text found in the document.
    - If the document is long, continue transcribing until the very end.
    - Use Markdown headers (##) to separate pages or sections if clear.
    - Be precise with formulas and technical terms.

    OUTPUT JSON SCHEMA (Return ONLY raw, valid JSON):
    {
        "title": "String",
        "tags": ["String", "String"],
        "ocrText": "String (Markdown supported)"
    }
    
    IMPORTANT: Return ONLY valid JSON.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
};

// Helper to convert File to GoogleGenerativeAI part
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}
