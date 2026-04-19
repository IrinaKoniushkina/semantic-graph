
const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const app = express()
const PORT = 5000

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

const USERS_FILE = path.join(__dirname, "users.json");

app.use(cors())
app.use(express.json())

const DATA_FILE = path.join(__dirname, "../frontend/graph.json")

// АВТОРИЗАЦИЯ
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

app.post("/login", (req, res) => {
  const { login, password } = req.body;
  const data = readUsers();
  const user = data.users.find(u =>
    u.login === login && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }
  res.json({ success: true });
});



// ЧТЕНИЕ ФАЙЛА
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { nodes: [], edges: [] }
  }
  const raw = fs.readFileSync(DATA_FILE)
  try {
    return JSON.parse(raw)
  } catch {
    return { nodes: [], edges: [] }
  }
}
// ЗАПИСЬ В ГРАФ
function writeData(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  )
}

// ПОЛУЧИТЬ ГРАФ
app.get("/places", (req, res) => {
  const data = readData()
  res.json(data)
})

// ДОБАВИТЬ ИЛИ ИЗМЕНИТЬ ВЕРШИНУ
app.post("/places", (req, res) => {
  const { node, relatedIds, mode } = req.body
  if (!node || !node.id || !node.name) {
    return res.status(400).json({ error: "Некорректные данные" })
  }
  const data = readData()
  if (!data.nodes) data.nodes = []
  if (!data.edges) data.edges = []

  // РЕДАКТИРОВАНИЕ
  if (mode === "edit") {
    const index = data.nodes.findIndex(n => n.id === node.id)
    if (index === -1) {
      return res.status(404).json({ error: "Вершина не найдена" })
    }
    data.nodes[index] = node
    data.edges = data.edges.filter(e =>
      e.source !== node.id && e.target !== node.id
    )
  }

  //ДОБАВЛЕНИЕ
  else {
    data.nodes.push(node)
  }
  if (Array.isArray(relatedIds)) {

    relatedIds.forEach(relId => {
      data.edges.push({
        id: "edge_" + Date.now() + "_" + Math.random(),
        source: node.id,
        target: relId,
        type: "related"
      })
    })
  }
  writeData(data)
  res.json({ success: true })
})

// УДАЛИТЬ ВЕРШИНУ
app.delete("/places/:id", (req, res) => {
  const id = req.params.id
  const data = readData()
  data.nodes = data.nodes.filter(n => n.id !== id)
  data.edges = data.edges.filter(e =>
    e.source !== id && e.target !== id
  )
  writeData(data)
  res.json({ success: true })
})

app.post("/upload-images", upload.array("images"), (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: "Нет файлов" });
    }

    const urls = [];

    for (const file of files) {

      if (!file.buffer) {
        throw new Error("Файл повреждён (buffer пустой)");
      }

      // безопасное имя файла
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9.]/g, "_");

      const fileName = Date.now() + "-" + safeName;
      const filePath = path.join(UPLOAD_DIR, fileName);

      fs.writeFileSync(filePath, file.buffer);

      urls.push(`http://localhost:5000/uploads/${fileName}`);
    }

    res.json({ images: urls });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT)
})