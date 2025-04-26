import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>BOOK Processor</h1>
      <div className={styles.grid}>
        <Link href="/PDFBookFinder" className={styles.card}>
          <h2>extractTextFromPDf summirize &rarr;</h2>
          <p>Extract text from first 3 pages of a PDF</p>
        </Link>

        <Link href="/Bookname" className={styles.card}>
          <h2>Book Finder ny name &rarr;</h2>
          <p>Detect mentioned books in a PDF document</p>
        </Link>
      </div>
    </div>
  );
}