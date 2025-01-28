import { useState, useRef, useEffect } from "react";

import dict from "/test/dict.json";

export const highlightWords = (html: string, words: string[]): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const highlightedWords = new Set(words.map((word) => word.toLowerCase()));

  const processText = (text: string): string => {
    // Split text while preserving non-word characters
    return text.replace(
      /(\p{L}[\p{L}'-]*)|([^\p{L}]+)/giu,
      (match, word, nonWord) => {
        if (word) {
          const isHighlighted = highlightedWords.has(word.toLowerCase());
          const escapedWord = word.replace(/"/g, "&quot;");
          return `<span class="clickable-word ${
            isHighlighted ? "highlighted" : ""
          }" 
                      data-word="${escapedWord}">
                  ${word}
                </span>`;
        }
        return nonWord || match;
      }
    );
  };

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  const nodes: Node[] = [];

  while ((node = walker.nextNode())) nodes.push(node);

  nodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent || parent.nodeName === "SCRIPT" || parent.nodeName === "STYLE")
      return;

    const processed = processText(textNode.nodeValue || "");
    if (processed === textNode.nodeValue) return;

    const wrapper = doc.createElement("div");
    wrapper.innerHTML = processed;

    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, textNode);
    }
    parent.removeChild(textNode);
  });

  return doc.body.innerHTML;
};

export const EpubRenderer = ({
  html,
  words,
}: {
  html: string;
  words: string[];
}) => {
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    rect: DOMRect;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processedHtml = highlightWords(html, words);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.classList?.contains("clickable-word")) {
        const rect = target.getBoundingClientRect();
        setSelectedWord({
          word: target.dataset.word || "",
          rect: rect,
        });
      }
    };

    containerRef.current?.addEventListener("click", handleClick);
    return () =>
      containerRef.current?.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="p-10 text-justify">
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {selectedWord && (
        <DictionaryPopup
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
};

const DictionaryPopup = ({
  word,
  onClose,
}: {
  word: { word: string; rect: DOMRect };
  onClose: () => void;
}) => {
  const normalizedDict = Object.entries(dict).reduce((acc, [key, value]) => {
    // Normalize key to lowercase and remove diacritics for matching
    const normalizedKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    acc[normalizedKey] = value;
    return acc;
  }, {} as Record<string, string>);

  const normalizedWord = word.word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const definition = normalizedDict[normalizedWord];
  return (
    <div
      className="bg-white p-4 border-2 rounded-md"
      style={{
        position: "absolute",
        left: `${word.rect.left + window.scrollX}px`,
        top: `${word.rect.bottom + window.scrollY + 4}px`,
      }}
    >
      <div className="popup-content ">
        <h3>{word.word}</h3>
        {definition && <p className="text-sm">{definition}</p>}
      </div>
    </div>
  );
};
