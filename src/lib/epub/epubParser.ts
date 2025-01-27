import JSZip from "jszip";

export async function parseEpub(epubFile: File): Promise<string[]> {
  try {
    // Load zip
    const zip = await JSZip.loadAsync(epubFile);

    const opfFileEntry = zip.file(/.*\.opf/)[0];
    if (!opfFileEntry) throw new Error("OPF file not found in EPUB");

    const opfFile = await opfFileEntry.async("text");

    // Parse the OPF file as XML
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfFile, "text/xml");
    if (!opfDoc) throw new Error("Invalid OPF file");

    // Extract spine items (ordered content)
    const spineItems = Array.from(opfDoc.querySelectorAll("spine itemref")).map(
      (item) => item.getAttribute("idref")
    );

    // Extract manifest items (file references)
    const texts: string[] = [];
    for (const itemId of spineItems) {
      if (!itemId) continue;

      const itemElement = opfDoc.querySelector(
        `manifest > item[id="${itemId}"]`
      );
      if (!itemElement) {
        console.error(`Item with id ${itemId} not found in manifest`);
        continue;
      }

      const itemHref = itemElement.getAttribute("href");
      if (!itemHref) {
        console.error(`Item with id ${itemId} has no href attribute`);
        continue;
      }
      const contentRoot = findContentRoot(zip);
      const normalizedPath = normalizePath(contentRoot, itemHref);

      const itemFile = zip.file(normalizedPath);
      if (!itemFile) {
        console.error(`File ${itemHref} not found in EPUB`);
        continue;
      }

      const itemContent = await itemFile.async("text");
      texts.push(itemContent);
    }

    return texts;
  } catch (error) {
    console.error("Error parsing EPUB:", error);
    throw error;
  }
}

function normalizePath(base: string, path: string): string {
  // Remove any leading slash
  path = path.replace(/^\//, "");
  if (!base) return path;

  // Combine base path with item path
  const parts = [...base.split("/"), ...path.split("/")];
  const resolvedParts: string[] = [];

  for (const part of parts) {
    if (part === "." || !part) continue;
    if (part === "..") {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join("/");
}

function findContentRoot(zip: JSZip): string {
  const files = Object.keys(zip.files);
  const opfFile = files.find((file) => file.endsWith(".opf"));
  if (!opfFile) return "";
  return opfFile.split("/").slice(0, -1).join("/");
}
