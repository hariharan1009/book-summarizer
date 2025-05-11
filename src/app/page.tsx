import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Book Summarizer AI</h1>
      <p className={styles.subtitle}>Extract, analyze, and summarize books effortlessly</p>
      
      <div className={styles.grid}>
        <Link href="/PDFBookFinder" className={styles.card}>
          <h2>PDF Text Summarizer <span className={styles.arrow}>&rarr;</span></h2>
          <p>Extract and summarize text from any PDF document.</p>
        </Link>

        <Link href="/Bookname" className={styles.card}>
          <h2>Book Finder by Name <span className={styles.arrow}>&rarr;</span></h2>
          <p>Detect and analyze books mentioned in your PDF.</p>
        </Link>
      </div>
    </div>
  );
}