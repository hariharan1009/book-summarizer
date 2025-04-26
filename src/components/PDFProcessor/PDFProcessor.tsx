"use client";

import React, { useState, useEffect } from "react";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { Groq } from "groq-sdk";
import styles from "./PDFProcessor.module.css";

// Import worker directly (Webpack 5+ / Vite compatible)
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
// Set worker path
GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ResumeAnalyzer() {
  const [groq, setGroq] = useState<Groq | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize services
  useEffect(() => {
    setGroq(
      new Groq({
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      })
    );
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      
      let extractedText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        extractedText += textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();
        
        if (i < pdf.numPages) extractedText += "\n\n";
      }

      setResumeText(extractedText);
    } catch (error) {
      console.error("PDF processing error:", error);
      setResumeText("Error: Failed to process PDF file");
    } finally {
      setLoading(false);
    }
  };

  async function analyzeResume() {
    if (!resumeText || !jobDescription) {
      alert("Please upload a resume and enter a job description");
      return;
    }

    if (!groq) {
      alert("AI service is not ready yet");
      return;
    }

    setLoading(true);
    const prompt = `
    Analyze this resume against the job description and provide specific recommendations:
    
    RESUME:
    ${resumeText}
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    Provide:
    1. Key skill matches
    2. Missing qualifications
    3. Specific improvement suggestions
    4. Overall fit assessment`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional career coach. Provide detailed, actionable feedback in clear paragraphs. Focus on specific skills and qualifications.",
          },
          { role: "user", content: prompt },
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
      });

      setAnalysis(response.choices[0]?.message?.content || "No analysis generated");
    } catch (error) {
      console.error("AI analysis error:", error);
      setAnalysis("Error: Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Resume Analyzer</h1>
      <p className={styles.subtitle}>Upload your resume and job description to get personalized feedback</p>

      <div className={styles.uploadContainer}>
        <label className={styles.uploadLabel}>
          {resumeText ? "Resume Uploaded ✓" : "Upload Resume (PDF)"}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className={styles.fileInput}
            disabled={loading}
          />
        </label>
      </div>

      <div className={styles.textColumns}>
        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>Resume Content</h3>
          <textarea
            className={styles.textArea}
            value={resumeText}
            rows={10}
            placeholder="Extracted resume text will appear here..."
            readOnly
          />
        </div>

        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>Job Description</h3>
          <textarea
            className={styles.textArea}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            placeholder="Paste the job description here..."
            disabled={loading}
          />
        </div>
      </div>

      <button
        className={`${styles.analyzeButton} ${loading ? styles.loading : ""}`}
        onClick={analyzeResume}
        disabled={loading || !resumeText || !jobDescription}
      >
        {loading ? (
          <span className={styles.spinner}></span>
        ) : (
          "Analyze Resume"
        )}
      </button>

      {analysis && (
        <div className={styles.analysisContainer}>
          <h2 className={styles.analysisTitle}>Analysis Results</h2>
          <div className={styles.analysisContent}>
            {analysis.split('\n\n').map((paragraph, i) => (
              <p key={i} className={styles.analysisParagraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}