interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: any;
}

interface AnkiConnectResponse<T> {
  error: string | null;
  result: T;
}

async function invokeAnkiConnect<T>(request: AnkiConnectRequest): Promise<T> {
  try {
    const response = await fetch("/anki", {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: AnkiConnectResponse<T> = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.result;
  } catch (error) {
    console.error("AnkiConnect error:", error);
    throw error;
  }
}

export async function getDeckNames(): Promise<string[] | null> {
  try {
    const deckNames = await invokeAnkiConnect<string[]>({
      action: "deckNames",
      version: 6,
    });
    return deckNames;
  } catch (error) {
    console.warn("Couldn't connect to Anki:", error);
    return null;
  }
}

export async function getDeckCards(deckName: string): Promise<string[] | null> {
  try {
    const deckCards = await invokeAnkiConnect<string[]>({
      action: "findCards",
      version: 6,
      params: { query: `deck:${deckName}` },
    });
    console.log(deckCards);
    return deckCards;
  } catch (error) {
    console.warn("Couldn't connect to Anki:", error);
    return null;
  }
}
