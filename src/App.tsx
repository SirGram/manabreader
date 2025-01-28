import { useEffect, useState } from "react";
import { parseEpub } from "./lib/epub/epubParser";
import { EpubRenderer, highlightWords } from "./lib/epub/epubRenderer";
import { getDeckCards, getDeckNames } from "./lib/anki/anki";

function App() {
  const [book, setBook] = useState<string[]>([]);
  const [section, setSection] = useState<string>("");
  const [currentSection, setCurrentSection] = useState(0);
  const [words, setWords] = useState<string[]>([]);

  const fetchEpub = async () => {
    try {
      const response = await fetch("/test/harry.epub");
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
    const initializeData = async () => {
      await fetchEpub();
      
      const fetchedWords = await getDeckCards("German", "Vocab");
      if (fetchedWords !== null) {
        setWords(fetchedWords);
      }
    };

    initializeData();
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

      <EpubRenderer html={section} words={words} />
    </>
  );
}

export default App;
