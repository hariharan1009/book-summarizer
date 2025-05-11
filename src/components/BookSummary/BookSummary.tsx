'use client'
import '@/app/globals.css';
import { useState } from 'react';
import styles from './BookSummary.module.css';

export default function BookSummarizer() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSummary = async () => {
    if (!title || !author) {
      setError('Please enter both book title and author');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [{
            role: 'user',
            content: `Provide a 200-300 word summary of "${title}" by ${author}. 
                      Cover main themes, key ideas, and why it's significant. 
                      Use clear paragraphs.remove the ** from the paragraph`
          }],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.choices[0]?.message?.content || 'No summary generated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Groq API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Book Summary Generator</h1>
      
      <div className={styles.inputSection}>
        <div className={styles.formGroup}>
          <label>Book Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Atomic Habits"
            disabled={isLoading}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Author</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g., James Clear"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Generating...' : 'Get Summary'}
        </button>
        
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Analyzing "{title}"...</p>
        </div>
      )}

      {summary && (
        <div className={styles.summarySection}>
          <h2>
            Summary of <span className={styles.highlight}>{title}</span>
            {author && ` by ${author}`}
          </h2>
          <div className={styles.summaryText}>
            {summary.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(summary);
              alert('Summary copied!');
            }}
            className={styles.copyButton}
          >
            📋 Copy Summary
          </button>
        </div>
      )}
    </div>
  );
}