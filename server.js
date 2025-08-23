const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// serve a pasta public (ou docs se você escolheu docs/)
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
