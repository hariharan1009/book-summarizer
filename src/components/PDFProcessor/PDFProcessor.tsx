"use client";

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Groq from "groq-sdk";
import styles from "./PDFProcessor.module.css";

import "pdfjs-dist/build/pdf.worker.min";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFBookFinder() {
  const [bookDetails, setBookDetails] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setBookDetails("");
    setCopied(false);

    try {
      const textContent = await extractTextFromPDF(file);
      await analyzeTextForBooks(textContent);
    } catch (err) {
      console.error("Error processing PDF:", err);
      setError("Failed to process PDF. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const pdfData = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          let textContent = "";

          // Only process first 3 pages
          const pagesToExtract = Math.min(pdf.numPages, 3);
          
          for (let i = 1; i <= pagesToExtract; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ");
            textContent += "\n\n";
          }

          resolve(textContent);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const analyzeTextForBooks = async (text: string) => {
    try {
      // Truncate text if too long to avoid API limits
      const truncatedText = text.length > 2000 ? text.substring(0, 4000) + "..." : text;
      
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a book detection assistant. Analyze the provided text and identify any mentioned books. For each book found, provide the following information:\n\n- Book Name: [Book's Name]\n- Author: [Author's Name]\n- Description: [A concise description of the book (up to 1000 words)] Cover main themes, key ideas, and why it's significant.Use clear paragraphsremove the * from response\n\nFormat your response as plain text using bullet points as shown above. Do not use any bold text or special symbols.",
          },
          {
            role: "user",
            content: `Please analyze this text and identify any books mentioned:\n\n${truncatedText}`
          }
        ],
        model: "llama3-70b-8192",
        max_tokens: 2000,
        temperature: 0.3
      });

      setBookDetails(response.choices[0]?.message?.content || "No books found in the document");
    } catch (error) {
      console.error("Error analyzing text:", error);
      setError("Failed to analyze document for books");
      setBookDetails("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookDetails)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className={styles.container}>
      <h1>PDF Book Finder</h1>
      <p>Upload a PDF to summarize books.</p>

      <div className={styles.uploadSection}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          disabled={loading}
        />
        {loading && <p>Analyzing document for books...</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {bookDetails && (
        <div className={styles.bookSection}>
          <div className={styles.sectionHeader}>
            <h3>Summarized Books:</h3>
            
          </div>
          <div className={styles.bookDetails}>
            {bookDetails.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button 
              onClick={copyToClipboard} 
              className={styles.copyButton}
              disabled={copied}
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
        </div>
      )}
    </div>
  );
}