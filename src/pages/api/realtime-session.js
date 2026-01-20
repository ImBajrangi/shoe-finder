// POST /api/realtime-session
// Generates ephemeral WebRTC tokens for OpenAI Realtime API
// Keeps OPENAI_API_KEY server-side only

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Realtime API error:", errorText);
      return res.status(response.status).json({
        error: "Failed to create realtime session",
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
