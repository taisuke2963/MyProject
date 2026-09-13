require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { EMPLOYEES } = require("./employees");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

app.get("/api/employees", (req, res) => {
  res.json(
    EMPLOYEES.map(({ id, name, role, avatar, tagline }) => ({
      id,
      name,
      role,
      avatar,
      tagline,
    }))
  );
});

app.post("/api/chat", async (req, res) => {
  const { employeeId, messages } = req.body;

  const employee = EMPLOYEES.find((e) => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: "指定されたバーチャル社員が見つかりません。" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages は空でない配列である必要があります。" });
  }

  if (!anthropic) {
    return res.status(503).json({
      error:
        "ANTHROPIC_API_KEY が設定されていません。.env に設定してサーバーを再起動してください。",
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: employee.systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI応答の生成中にエラーが発生しました。" });
  }
});

app.listen(port, () => {
  console.log(`バーチャル社員チャットアプリが起動しました: http://localhost:${port}`);
});
