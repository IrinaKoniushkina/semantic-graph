const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = 5000

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

const minioClient = require("./minioClient")

app.use(cors())
app.use(express.json())

const DATA_FILE = path.join(__dirname, "../frontend/graph.json")

/* -------------------------
Чтение файла graph.json
------------------------- */

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

/* -------------------------
Запись в graph.json
------------------------- */

function writeData(data) {

fs.writeFileSync(
DATA_FILE,
JSON.stringify(data, null, 2),
"utf8"
)

}

/* -------------------------
Получить весь граф
------------------------- */

app.get("/places", (req, res) => {

const data = readData()

res.json(data)

})

/* -------------------------
Добавить или изменить вершину
------------------------- */

app.post("/places", (req, res) => {

const { node, relatedIds, mode } = req.body

if (!node || !node.id || !node.name) {
return res.status(400).json({ error: "Некорректные данные" })
}

const data = readData()

if (!data.nodes) data.nodes = []
if (!data.edges) data.edges = []

/* ---------- РЕДАКТИРОВАНИЕ ---------- */

if (mode === "edit") {

const index = data.nodes.findIndex(n => n.id === node.id)

if (index === -1) {
return res.status(404).json({ error: "Вершина не найдена" })
}

data.nodes[index] = node

// удаляем старые связи
data.edges = data.edges.filter(e =>
e.source !== node.id && e.target !== node.id
)

}

/* ---------- ДОБАВЛЕНИЕ ---------- */

else {

data.nodes.push(node)

}

/* ---------- СОЗДАЕМ НОВЫЕ СВЯЗИ ---------- */

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

/* -------------------------
Удалить вершину
------------------------- */

app.delete("/places/:id", (req, res) => {

const id = req.params.id

const data = readData()

// удаляем вершину
data.nodes = data.nodes.filter(n => n.id !== id)

// удаляем связи
data.edges = data.edges.filter(e =>
e.source !== id && e.target !== id
)

writeData(data)

res.json({ success: true })

})

/* -------------------------
Запуск сервера
------------------------- */
app.post("/upload-images", upload.array("images"), async (req, res) => {

  const files = req.files
  const urls = []

  for (const file of files) {

    const fileName = Date.now() + "-" + file.originalname

    await minioClient.putObject(
      "city-images",
      fileName,
      file.buffer
    )

    const url = `http://localhost:9000/city-images/${fileName}`

    urls.push(url)
  }

  res.json({ images: urls })
})

app.listen(PORT, () => {

console.log("Server running on http://localhost:" + PORT)

})