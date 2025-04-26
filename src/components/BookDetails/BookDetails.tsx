'use client';

import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const ExtractPDF = () => {
  const [excerpt, setExcerpt] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setExcerpt('Please upload a valid PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ');
        if (fullText.split(/\s+/).length >= 100) break;
      }

      setExcerpt(fullText.split(/\s+/).slice(0, 100).join(' ') || 'No text extracted.');
    };
  };

  return (
    <div>
      <h1>Extract 100 Words from PDF</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      {excerpt && <p>{excerpt}</p>}
    </div>
  );
};

export default ExtractPDF;
