export const highlightWords = (html: string, words: string[]): string => {
  if (words.length === 0) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);

  const textNodes: Node[] = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    textNodes.push(currentNode);
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent || parent.nodeName === "SCRIPT" || parent.nodeName === "STYLE")
      return;

    const text = textNode.nodeValue || "";
    const escapedWords = words.map((word) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // match exactly to raw word
    );
    const regex = new RegExp(`\\b(${escapedWords.join("|")})\\b`, "gi"); // whole word match

    const newHTML = text.replace(regex, '<span style="color: red;">$&</span>');

    if (newHTML !== text) {
      const tempDiv = doc.createElement("div");
      tempDiv.innerHTML = newHTML;
      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, textNode);
      }
      parent.removeChild(textNode);
    }
  });

  return doc.body.innerHTML;
};
