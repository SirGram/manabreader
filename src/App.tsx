import { useEffect, useState } from "react";
import { parseEpub } from "./lib/epub/epubParser";
import { highlightWords } from "./lib/epub/highlight";
import { getDeckCards, getDeckNames } from "./lib/anki/anki";

function App() {
  const [book, setBook] = useState<string[]>([]);
  const [section, setSection] = useState<string>("");
  const [currentSection, setCurrentSection] = useState(0);
  const words = ["german", "stories", "detail", "illustration"];

  const fetchEpub = async () => {
    try {
      const response = await fetch("/test/ahoi.epub");
      if (!response.ok)
        throw new Error(`Failed to fetch EPUB: ${response.statusText}`);

      const blob = await response.blob();
      const epubFile = new File([blob], "book.epub", {
        type: "application/epub+zip",
      });
      const texts = await parseEpub(epubFile);

      setBook(texts);
    } catch (error) {
      console.error("Error fetching EPUB:", error);
    }
  };

  const [deckNames, setDeckNames] = useState<string[]>([]);

  useEffect(() => {
    fetchEpub();
    getDeckCards("German");
    console.log(deckNames);
  }, []);

  useEffect(() => {
    if (book) {
      const highlightedText = highlightWords(book[currentSection], words);
      setSection(highlightedText);
    }
  }, [book, currentSection]);

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentSection((prev) => {
      if (direction === "prev") return Math.max(0, prev - 1);
      return Math.min(book.length - 1, prev + 1);
    });
  };

  if (book.length === 0) return <div>Loading...</div>;

  return (
    <>
      <div className="controls">
        <button
          className="text-5xl"
          onClick={() => handlePageChange("prev")}
          disabled={currentSection === 0}
        >
          Prev
        </button>
        <span>
          Page {currentSection + 1} of {book.length}
        </span>
        <button
          className="text-5xl"
          onClick={() => handlePageChange("next")}
          disabled={currentSection === book.length - 1}
        >
          Next
        </button>
      </div>

      <div
        dangerouslySetInnerHTML={{ __html: section }}
        className="prose max-w-none mb-6"
      />
    </>
  );
}

export default App;
