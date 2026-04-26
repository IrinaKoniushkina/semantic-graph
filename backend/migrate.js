const fs = require("fs");
const path = require("path");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "57281292")
);

const DATA_FILE = path.join(__dirname, "../frontend/graph.json");

async function migrate() {
  const session = driver.session();

  const data = JSON.parse(fs.readFileSync(DATA_FILE));

  try {
    // 1. НОДЫ
    for (const node of data.nodes) {
      await session.run(
        `
        MERGE (p:Place {id: $id})
        SET p.name = $name,
            p.category = $category,
            p.keywords = $keywords,
            p.icon = $icon,
            p.description = $description,
            p.history = $history,
            p.modern = $modern,
            p.images = $images
        `,
        {
          id: node.id,
          name: node.name,
          category: node.category,
          keywords: node.keywords ?? "",
          icon: node.icon,
          description: node.content?.description?.text || "",
          history: node.content?.history || "",
          modern: node.content?.modern || "",
          images: JSON.stringify(node.content?.description?.images || [])
        }
      );
    }

    // 2. СВЯЗИ
    for (const edge of data.edges) {
      await session.run(
        `
        MATCH (a:Place {id: $source})
        MATCH (b:Place {id: $target})
        MERGE (a)-[:RELATED]->(b)
        `,
        {
          source: edge.source,
          target: edge.target
        }
      );
    }

    console.log("✅ Миграция завершена");

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

migrate();