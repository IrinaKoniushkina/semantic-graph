const neo4j =
  require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    "neo4j",
    "57281292"
  )
);

async function logAction(user, action, target, changes = []) {
  const session = driver.session();
  try {
    await session.run(
      `
        CREATE (h:History {
            id:$id,
            user:$user,
            action:$action,
            target:$target,
            targetId:$targetId,
            date:$date,
            changes: $changes
        })
      `,
      {
        id: Date.now().toString(),
        user,
        action,
        target,
        targetId,
        date: new Date().toISOString(),
        changes: JSON.stringify(changes)
      }
    );
  } finally {
    await session.close();
  }
}

module.exports = { logAction };