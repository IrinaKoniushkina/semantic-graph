require("dotenv").config();

const iconNames = {
  museum: "Музей",
  monument: "Памятник",
  theater: "Театр",
  church: "Храм",
  park: "Парк",
  user: "Персоналии",
  building: "Здание"
};

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
const { login } = require('./auth');
const { authMiddleware, adminOnly } = require('./middleware/auth');
const { logAction } = require('./history');
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json())

const auth = require('./auth');
console.log(auth);

//Логин
app.post("/login", async (req, res) => {
  try {
    const { login: username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({
        error: "No credentials"
      });
    }

    const result = await login(username, password);
    if (!result) {
      return res.status(401).json({
        error: "Неверный логин или пароль"
      });
    }
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Сервер не отвечает"
    });
  }
});

// Получить граф
app.get("/places", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Place)
      OPTIONAL MATCH (p)-[r:RELATED]-(other:Place)
      RETURN p, r, other
    `);

    const nodesMap = {};
    const edgeMap = new Map();

    result.records.forEach(record => {
      const p = record.get("p").properties;

      // Ноды
      if (!nodesMap[p.id]) {
        let images = [];
        try {
          images = JSON.parse(p.images || "[]");
        } catch (e) {
          console.warn("Ошибка парсинга изображений:", p.images);
        }

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
          },
          geo: p.geo || ""
        };
      }

      // Связи
      const r = record.get("r");
      const other = record.get("other");

      if (r && other) {
        const id1 = p.id;
        const id2 = other.properties.id;

        const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

        const type = r.properties.type || "geo";
        const reason = r.properties.reason || "";

        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            id: key,
            source: id1 < id2 ? id1 : id2,
            target: id1 < id2 ? id2 : id1,
            relations: []
          });
        }

        edgeMap.get(key).relations.push({
          type,
          reason
        });
      }
    });

    const edges = [];
    edgeMap.forEach(edge => {
      edges.push(edge);
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

function computeDiff(oldNode, newNode) {
  const diff = [];
  const arraysEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  if (oldNode.name !== newNode.name) {
    diff.push({ field: "Название", old: oldNode.name, new: newNode.name });
  }
  if (oldNode.keywords !== newNode.keywords) {
    diff.push({ field: "Ключевые слова", old: oldNode.keywords, new: newNode.keywords });
  }
  if (!arraysEqual(oldNode.category || [], newNode.category || [])) {
    diff.push({
      field: "Категории",
      old: (oldNode.category || []).join(", "),
      new: (newNode.category || []).join(", ")
    });
  }
  if (oldNode.icon !== newNode.icon) {
    diff.push({ field: "Иконка", old: oldNode.icon, new: newNode.icon });
  }
  if ((oldNode.description || "") !== newNode.description) {
    diff.push({
      field: "Описание",
      old: (oldNode.description || "").substring(0, 100) + "...",
      new: newNode.description.substring(0, 100) + "..."
    });
  }
  if ((oldNode.history || "") !== newNode.history) {
    diff.push({
      field: "История",
      old: (oldNode.history || "").substring(0, 100) + "...",
      new: newNode.history.substring(0, 100) + "..."
    });
  }
  if ((oldNode.modern || "") !== newNode.modern) {
    diff.push({
      field: "Наши дни",
      old: (oldNode.modern || "").substring(0, 100) + "...",
      new: newNode.modern.substring(0, 100) + "..."
    });
  }
  if ((oldNode.geo || "") !== newNode.geo) {
    diff.push({ field: "Геоданные", old: oldNode.geo || "", new: newNode.geo });
  }
  return diff;
}

// Добавить/изменить вершину
app.post("/places", authMiddleware, async (req, res) => {
  const { node, related, mode } = req.body;

  if (!node || !node.id || !node.name?.trim()) {
    return res.status(400).json({ error: "Некорректные данные: id и name обязательны" });
  }

  const geo = (related || []).filter(r => r?.type === "geo");
  const history = (related || []).filter(r => r?.type === "history");
  const session = driver.session();

  try {
    const isEdit = mode === "edit";
    let oldImages = [];
    let oldNode = null;

    if (isEdit) {
      const oldRes = await session.run(
        `
          MATCH (p:Place {id:$id})
          RETURN p
        `,
        { id: node.id }
      );

      if (oldRes.records.length) {
        oldNode = oldRes.records[0]
          .get("p")
          .properties;
      }
      if (oldNode?.images) {
        oldImages = JSON.parse(oldNode.images);
      }
    }

    const newImages = node.content?.description?.images || [];

    // Удаление изображений
    if (isEdit) {
      const imagesToDelete = oldImages.filter(oldImg =>
        !newImages.some(newImg => newImg?.src === oldImg?.src)
      );

      for (const img of imagesToDelete) {
        if (!img?.src) continue;
        const key = img.src.split("/").pop();

        try {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
          console.log("Удалено из S3:", key);
        } catch (e) {
          console.warn("Не удалось удалить файл:", key, e.message);
        }
      }
    }
    let changes = [];
    let oldRelations = [];

    if (isEdit) {
      const oldRelationsRes = await session.run(`
        MATCH (p:Place {id:$id})-[r:RELATED]-(other:Place)
        RETURN other.name as target,
              r.type as type,
              r.reason as reason
      `, { id: node.id });

      oldRelations = oldRelationsRes.records.map(r => ({
        target: r.get("target"),
        type: r.get("type"),
        reason: r.get("reason") || ""
      }));
    }

    if (isEdit && oldNode) {
      const newDescription = node.content?.description?.text || "";
      const newHistory = node.content?.history || "";
      const newModern = node.content?.modern || "";
      const oldCategories = oldNode.category || [];
      const newCategories = node.category || [];
      const iconNames = {
        museum: "Музей",
        monument: "Памятник",
        church: "Церковь",
        theater: "Театр",
        park: "Парк",
        bridge: "Мост",
        building: "Здание"
      };

      //Название
      if ((oldNode.name || "") !== (node.name || "")) {
        changes.push({
          field: "Название",
          old: "Было: " + oldNode.name || "",
          new: "Стало: " + node.name || ""
        });
      }

      //Ключевые слова
      if ((oldNode.keywords || "") !== (node.keywords || "")) {
        changes.push({
          field: "Ключевые слова",
          old: "Было: " + oldNode.keywords || "",
          new: "Стало: " + node.keywords || ""
        });
      }

      //Категории
      if (JSON.stringify(oldCategories) !== JSON.stringify(newCategories)) {
        changes.push({
          field: "Категории",
          old: "Было: " + oldCategories.join(", "),
          new: "Стало: " + newCategories.join(", ")
        });
      }

      //Иконка
      if ((oldNode.icon || "") !== (node.icon || "")) {
        changes.push({
          field: "Иконка",
          old: "Было: " + iconNames[oldNode.icon] || oldNode.icon || "",
          new: "Стало: " + iconNames[node.icon] || node.icon || ""
        });
      }

      //Гео (Яндекс карта)
      if ((oldNode.geo || "") !== (node.geo || "")) {
        let geoAction = "Изменен виджет Яндекс Карт";
        if (!oldNode.geo && node.geo) geoAction = "Добавлен виджет Яндекс Карт";
        if (oldNode.geo && !node.geo) geoAction = "Удален виджет Яндекс Карт";

        changes.push({
          field: "Яндекс Карты",
          old: geoAction,
          new: ""
        });
      }

      //Описание
      if ((oldNode.description || "") !== newDescription) {
        changes.push({
          field: "Описание",
          old: "Текст изменен",
          new: ""
        });
      }

      //История
      if ((oldNode.history || "") !== newHistory) {
        changes.push({
          field: "История",
          old: "Текст изменен",
          new: ""
        });
      }

      //Наши дни
      if ((oldNode.modern || "") !== newModern) {
        changes.push({
          field: "Наши дни",
          old: "Текст изменен",
          new: ""
        });
      }
      console.log("CHANGES:", changes);
    }
    const newRelations = (related || []).map(r => ({
      id: r.id,
      target: r.name,
      type: r.type || "geo",
      reason: r.reason || ""
    }));

    const relationChanges = [];
    for (const newRel of newRelations) {
      const exists = oldRelations.find(oldRel =>
        oldRel.target === newRel.target &&
        oldRel.type === newRel.type &&
        (oldRel.reason || "") === (newRel.reason || "")
      );

      if (!exists) {
        if (newRel.type === "geo") {
          relationChanges.push(
            `Добавлена географическая связь с объектом "${newRel.target}"`
          );
        } else {
          relationChanges.push(
            `Добавлена культурно-историческая связь с объектом "${newRel.target}"` +
            (newRel.reason ? `. Причина: ${newRel.reason}` : "")
          );
        }
      }
    }

    for (const oldRel of oldRelations) {
      const exists = newRelations.find(newRel =>
        newRel.target === oldRel.target &&
        newRel.type === oldRel.type &&
        (newRel.reason || "") === (oldRel.reason || "")
      );

      if (!exists) {
        if (oldRel.type === "geo") {
          relationChanges.push(
            `Удалена географическая связь с объектом "${oldRel.target}"`
          );
        } else {
          relationChanges.push(
            `Удалена культурно-историческая связь с объектом "${oldRel.target}"`
          );
        }
      }
    }
    for (const newRel of newRelations) {
      const oldRel = oldRelations.find(rel =>
        rel.target === newRel.target &&
        rel.type === newRel.type
      );
      if (
        oldRel &&
        oldRel.type === "history" &&
        oldRel.reason !== newRel.reason
      ) {
        relationChanges.push(
          `Изменена причина связи с объектом "${newRel.target}". Было: "${oldRel.reason}". Стало: "${newRel.reason}"`
        );
      }
    }
    if (relationChanges.length) {
      changes.push({
        field: "Связи",
        old: relationChanges.join("\n"),
        new: ""
      });
    }

    //Создаём/обновляем ноду
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
          p.images = $images,
          p.geo = $geo
      `,
      {
        id: node.id,
        name: node.name.trim(),
        keywords: node.keywords || "",
        category: node.category || [],
        icon: node.icon || "museum",
        description: node.content?.description?.text || "",
        history: node.content?.history || "",
        modern: node.content?.modern || "",
        images: JSON.stringify(newImages),
        geo: node.geo || ""
      }
    );
    if (isEdit) {
      await session.run(
        `MATCH (p:Place {id: $id})-[r:RELATED]-() DELETE r`,
        { id: node.id }
      );
    }

    // Добавляем новые связи
    if (Array.isArray(related) && related.length > 0) {
      for (const rel of related) {
        if (!rel?.id) continue;
        const sourceId = node.id;
        const targetId = rel.id;
        const type = rel.type || "geo";
        await session.run(
          `
          MATCH (a:Place {id: $sourceId})
          MATCH (b:Place {id: $targetId})
          MERGE (a)-[r:RELATED {type: $type}]-(b)
          SET r.reason = $reason
          `,
          { sourceId, targetId, type, reason: rel.reason || "" }
        );
      }
    }
    console.log("SAVE HISTORY", {
      user: req.user.login,
      action: isEdit ? "EDIT_NODE" : "CREATE_NODE",
      target: node.name,
      changes
    });
    await logAction(
      req.user.login,
      isEdit ? "EDIT_NODE" : "CREATE_NODE",
      node.name,
      node.id,
      changes
    );
    res.json({ success: true });

  } catch (err) {
    console.error("Ошибка при сохранении места:", err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

//Удалить вершину
app.delete("/places/:id", authMiddleware, async (req, res) => {
  const id = String(req.params.id);
  const session = driver.session();
  try {
    //Получаем изображения
    const result = await session.run(
      `MATCH (p:Place {id: $id}) RETURN p.images AS images`,
      { id }
    );
    let images = [];
    if (result.records.length) {
      const raw = result.records[0].get("images");
      images = JSON.parse(raw || "[]");
    }

    //Удаляем файлы из S3
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
    //Удаляем ноду
    await session.run(
      `MATCH (p:Place {id: $id}) DETACH DELETE p`,
      { id }
    );
    await logAction(req.user.login, "DELETE_NODE", id);
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

//Загрузка изображений
app.post("/upload-images", authMiddleware, (req, res) => {
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

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  return Array.isArray(raw) ? raw : (raw.users || []);
}
function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify({ users }, null, 2)
  );
}

// Получить всех пользователей
app.get(
  "/users",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    const session =
      driver.session();
    try {
      const result =
        await session.run(`
                MATCH (u:User)
                RETURN u
                ORDER BY u.login
            `);
      const users =
        result.records.map(r => {
          const u =
            r.get("u").properties;
          return {
            id: u.id,
            login: u.login,
            role: u.role
          };
        });
      res.json(users);
    }
    catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Ошибка получения пользователей"
      });
    }
    finally {
      await session.close();
    }
  });

//ДОБАВИТЬ ПОЛЬЗОВАТЕЛЕЙ
app.post("/users", authMiddleware, adminOnly, async (req, res) => {
  const { login, password, role } = req.body;
  const session = driver.session();
  try {
    const existing =
      await session.run(
        `
          MATCH (u:User {
              login:$login
          })
          RETURN u
          `,
        { login }
      );
    if (existing.records.length) {
      return res.status(400).json({
        error: "Логин занят"
      });
    }
    const user = {
      id: Date.now().toString(),
      login,
      password,
      role: role || "editor"
    };
    await session.run(
      `
        CREATE (u:User)
        SET u=$user
        `,
      { user }
    );
    res.json({ success: true, user });
  }
  finally {
    await session.close();
  }
});

app.patch("/users/:id/role", authMiddleware, adminOnly, async (req, res) => {
  const session = driver.session();
  try {
    await session.run(
      `
        MATCH (u:User {id:$id})
        SET u.role=$role
      `,
      {
        id: req.params.id,
        role: req.body.role
      }
    );
    res.json({
      success: true
    });
  }
  finally {
    await session.close();
  }
});

//Удалить пользователя
app.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  const session = driver.session();
  try {
    await session.run(
      `
        MATCH (u:User {id:$id})
        DELETE u
      `,
      {
        id: req.params.id
      }
    );
    res.json({ success: true });
  }
  finally {
    await session.close();
  }
});

// Получить историю
app.get("/history", authMiddleware, adminOnly, async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `
        MATCH (h:History)
        RETURN h
        ORDER BY h.date DESC
      `
    );
    const history = result.records.map(r => {
      const item = r.get("h").properties;
      return {
        ...item,
        targetId: item.targetId,
        changes: item.changes
          ? JSON.parse(item.changes)
          : []
      };
    });
    res.json(history);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Ошибка получения истории"
    });
  }
  finally {
    await session.close();
  }
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT)
})
