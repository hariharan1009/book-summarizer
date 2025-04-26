import BookSummarizer from "@/components/BookSummary/BookSummary";
import ResumeAnalyzer from "@/components/PDFProcessor/PDFProcessor";
// import ExtractWords from "@/components/BookDetails/BookDetails";

const SummaryPage = () => {
    return (
        <main>
            <h1>Book Summarizer</h1>
            {/* <BookSummarizer /> */}
            <ResumeAnalyzer /> 
        </main>
    );
};

export default SummaryPage;
  