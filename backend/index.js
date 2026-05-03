require("dotenv").config();

const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "57281292")
);

const BUCKET = process.env.S3_BUCKET;
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = 5000

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

const USERS_FILE = path.join(__dirname, "users.json");

app.use(cors())
app.use(express.json())

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

// ПОЛУЧИТЬ ГРАФ
app.get("/places", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Place)
      OPTIONAL MATCH (p)-[r:RELATED]-(other:Place)
      RETURN p, r, other
    `);

    const nodesMap = {};
    const edges = [];

    result.records.forEach(record => {
      const p = record.get("p").properties;

      let images = [];
      try {
        images = JSON.parse(p.images || "[]");
      } catch (e) {
        console.warn("Ошибка парсинга изображений:", p.images);
      }

      // НОДЫ
      if (!nodesMap[p.id]) {
        nodesMap[p.id] = {
          id: p.id,
          name: p.name,
          keywords: p.keywords,
          category: p.category || [],
          icon: p.icon,
          content: {
            description: {
              text: p.description,
              images: images
            },
            history: p.history,
            modern: p.modern
          }
        };
      }

      // СВЯЗИ
      const r = record.get("r");
      const other = record.get("other");

      if (r && other) {
        edges.push({
          id: r.identity.toString(),
          source: p.id,
          target: other.properties.id,
          type: r.properties.type || "geo"
        });
      }
    });

    res.json({
      nodes: Object.values(nodesMap),
      edges
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения данных" });
  } finally {
    await session.close();
  }
});

// ДОБАВИТЬ ИЛИ ИЗМЕНИТЬ ВЕРШИНУ
app.post("/places", async (req, res) => {
  const { node, related, mode } = req.body;

  if (!node || !node.id || !node.name) {
    return res.status(400).json({ error: "Некорректные данные" });
  }

  const session = driver.session();

  try {

    let oldImages = [];

    // 1. Получаем старые картинки
    if (mode === "edit") {
      const oldRes = await session.run(
        `MATCH (p:Place {id: $id}) RETURN p.images AS images`,
        { id: node.id }
      );

      if (oldRes.records.length) {
        oldImages = JSON.parse(oldRes.records[0].get("images") || "[]");
      }
    }

    const newImages = node.content?.description?.images || [];

    // 2. Удаляем лишние картинки из S3
    if (mode === "edit") {
      const imagesToDelete = oldImages.filter(oldImg =>
        !newImages.some(newImg => newImg.src === oldImg.src)
      );

      for (const img of imagesToDelete) {
        if (!img.src) continue;

        const key = img.src.split("/").pop();

        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
          }));
          console.log("Удалено при редактировании:", key);
        } catch (e) {
          console.warn("Ошибка удаления:", key, e.message);
        }
      }
    }

    // 3. Сохраняем ноду
    await session.run(
      `
      MERGE (p:Place {id: $id})
      SET p.name = $name,
          p.keywords = $keywords,
          p.category = $category,
          p.icon = $icon,
          p.description = $description,
          p.history = $history,
          p.modern = $modern,
          p.images = $images
      `,
      {
        id: node.id,
        name: node.name,
        keywords: node.keywords,
        category: node.category || [],
        icon: node.icon,
        description: node.content?.description?.text || "",
        history: node.content?.history || "",
        modern: node.content?.modern || "",
        images: JSON.stringify(newImages)
      }
    );

    // 4. Обновляем связи
    if (mode === "edit" && related !== null) {

      if (related.length > 0) {
        const newIds = related.map(r => r.id);

        const newRels = related.map(r => ({
          id: r.id,
          type: r.type || "geo"
        }));

        await session.run(
          `
          MATCH (p:Place {id: $id})-[r:RELATED]-(other)
          WHERE NOT any(rel IN $newRels WHERE rel.id = other.id AND rel.type = r.type)
          DELETE r
          `,
          { id: node.id, newRels }
        );
      }

    }

    if (Array.isArray(related) && related.length > 0) {
      for (const rel of related) {
        await session.run(
          `MATCH (p:Place {id: $id})
           MATCH (other:Place {id: $targetId})
           MERGE (p)-[r:RELATED {type: $type}]-(other)`,
          {
            id: node.id,
            targetId: rel.id,
            type: rel.type || "geo"
          }
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// УДАЛИТЬ ВЕРШИНУ
app.delete("/places/:id", async (req, res) => {
  const id = String(req.params.id);
  const session = driver.session();

  try {
    // 1. Получаем изображения
    const result = await session.run(
      `MATCH (p:Place {id: $id}) RETURN p.images AS images`,
      { id }
    );

    let images = [];

    if (result.records.length) {
      const raw = result.records[0].get("images");
      images = JSON.parse(raw || "[]");
    }

    // 2. Удаляем файлы из S3
    for (const img of images) {
      if (!img?.src) continue;

      const key = img.src.split("/").pop(); // имя файла

      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key
        }));
        console.log("Удалено из S3:", key);
      } catch (e) {
        console.warn("Ошибка удаления файла:", key, e.message);
      }
    }

    // 3. Удаляем ноду
    await session.run(
      `MATCH (p:Place {id: $id}) DETACH DELETE p`,
      { id }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

//ЗАГРУЗКА ИЗОБРАЖЕНИЯ
app.post("/upload-images", (req, res) => {
  upload.array("images")(req, res, async (err) => {

    if (err) {
      console.error("MULTER ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    try {
      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({ error: "Нет файлов" });
      }

      const urls = [];
      for (const file of files) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileName = Date.now() + "-" + safeName;

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype
        }));

        console.log("UPLOAD OK:", fileName);

        const url = `https://storage.yandexcloud.net/${BUCKET}/${fileName}`;
        urls.push(url);
      }

      res.json({ images: urls });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ error: err.message });
    }

  });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT)
})