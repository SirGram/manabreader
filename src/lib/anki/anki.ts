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

export async function getDeckCards(
  deckName: string,
  fieldName: string
): Promise<string[] | null> {
  try {
    const cardIds = await invokeAnkiConnect<string[]>({
      action: "findCards",
      version: 6,
      params: { query: `deck:${deckName}` },
    });
    const cardsInfo = await invokeAnkiConnect<any[]>({
      action: "cardsInfo",
      version: 6,
      params: { cards: cardIds },
    });
    const words: string[] = cardsInfo.map((card) => card.fields[fieldName].value);
    console.log(cardsInfo);

    return words;
  } catch (error) {
    console.warn("Couldn't connect to Anki:", error);
    return null;
  }
}
