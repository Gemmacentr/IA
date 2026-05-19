const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname)));
app.use(express.json());

// simple request logger to help debugging
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

app.get("/api/dogs", async (req, res) => {
  try {
    const count = 6;
    const apiUrl = `https://dog.ceo/api/breeds/image/random/${count}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Dog API non disponibile");
    }
    const data = await response.json();
    const names = ["Luna", "Bruno", "Nina", "Rocky", "Mila", "Otis"];
    const ages = [2, 4, 1, 3, 5, 2];
    const descriptions = [
      "Ama correre nel prato e fare nuovi amici.",
      "Dolce e calmo, perfetto per passeggiate lente.",
      "Curiosa e vivace, adora i giochi con la palla.",
      "Energico e allegro, sempre pronto all’avventura.",
      "Coccolona e socievole, adora la vicinanza umana.",
      "Affettuoso e intelligente, ama esplorare il quartiere.",
    ];
    const tags = [
      ["🎾 Attiva", "🦴 Golosa"],
      ["🐾 Gentile", "🌳 Amante del verde"],
      ["🧸 Coccolona", "🎉 Giocosa"],
      ["🚀 Energetico", "🦴 Appassionata"],
      ["💤 Tranquilla", "🤍 Affidabile"],
      ["🧠 Intelligente", "🐕 Amichevole"],
    ];
    const profiles = data.message.map((image, index) => ({
      id: index + 1,
      name: names[index] || `Amico ${index + 1}`,
      age: ages[index] || 3,
      image,
      description:
        descriptions[index] || "Splendido cagnolino pronto a fare amicizia.",
      tags: tags[index] || ["🐶 Amichevole"],
      energy: ["Alta", "Media", "Bassa"][index % 3],
      friendliness: ["Molto", "Buona", "Eccellente"][index % 3],
    }));
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(502).json({ message: "Errore nel recupero dei profili." });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message)
      return res
        .status(400)
        .json({ message: "Missing message in request body" });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ message: "Server misconfigured: missing OPENAI_API_KEY" });

    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Sei DoggoBot, un assistente amichevole che aiuta a trovare match per cani. Rispondi in italiano, in modo breve e simpatico, con consigli pratici per incontri tra cani.",
        },
        { role: "user", content: String(message) },
      ],
      max_tokens: 200,
      temperature: 0.9,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", data);
      throw new Error(data.error?.message || "OpenAI API error");
    }

    const reply = data.choices?.[0]?.message?.content || "";
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(502).json({ message: error.message || "Chat proxy error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`DoggoDate server in ascolto su http://localhost:${port}`);
});
