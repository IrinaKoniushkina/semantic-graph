const fs = require("fs");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "57281292")
);

async function migrate() {
  const session = driver.session();

  const data = JSON.parse(fs.readFileSync("../frontend/graph.json", "utf-8"));

  try {
    await session.run(
      `
      UNWIND $edges AS e
      MATCH (a:Place {id: e.source})
      MATCH (b:Place {id: e.target})
      MERGE (a)-[r:RELATED {type: e.type}]->(b)
      `,
      { edges: data.edges }
    );

    console.log("✔ Связи восстановлены");
  } catch (err) {
    console.error("Ошибка:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

migrate();