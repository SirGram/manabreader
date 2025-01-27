import { useEffect, useState } from "react";
import { parseEpub } from "./lib/epub/epubParser";

function App() {
  const [sections, setSections] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState(0);

  const fetchEpub = async () => {
    try {
      const epubFilePath = "/test/ahoi.epub";
      const response = await fetch(epubFilePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB: ${response.statusText}`);
      }
      const blob = await response.blob();

      const epubFile = new File([blob], "book.epub", {
        type: "application/epub+zip",
      });

      const texts = await parseEpub(epubFile);
      setSections(texts);
    } catch (error) {
      console.error("Error fetching EPUB:", error);
    }
  };

  useEffect(() => {
    fetchEpub();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentSection(page % sections.length);
  };

  return (
    <>
      <button
        className="text-5xl"
        onClick={() => handlePageChange(currentSection - 1)}
      >
        Prev
      </button>
      <button
        className="text-5xl"
        onClick={() => {
          handlePageChange(currentSection + 1);
        }}
      >
        Next
      </button>
      {/* Epub renderer here */}
      <div
        dangerouslySetInnerHTML={{ __html: sections[currentSection] }}
        className="prose max-w-none mb-6"
      />
    </>
  );
}

export default App;
