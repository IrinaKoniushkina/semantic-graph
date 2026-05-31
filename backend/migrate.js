require("dotenv").config();

const fs = require("fs");
const path = require("path");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic(
    "neo4j",
    "57281292"
  )
);

const USERS_FILE =
  path.join(__dirname, "users.json");

const HISTORY_FILE =
  path.join(__dirname, "history.json");

async function migrateUsers(session) {

  if (!fs.existsSync(USERS_FILE)) {

    console.log("users.json не найден");

    return;
  }

  const raw =
    JSON.parse(
      fs.readFileSync(
        USERS_FILE,
        "utf8"
      )
    );

  const users =
    Array.isArray(raw)
      ? raw
      : (raw.users || []);

  console.log(
    `Найдено пользователей: ${users.length}`
  );

  for (const user of users) {

    await session.run(
      `
            MERGE (u:User {id:$id})

            SET
                u.login=$login,
                u.password=$password,
                u.role=$role,
                u.fullName=$fullName
            `,
      {
        id: user.id,
        login: user.login,
        password: user.password,
        role: user.role || "editor",
        fullName:
          user.fullName ||
          user.login
      }
    );

    console.log(
      `User migrated: ${user.login}`
    );
  }
}

async function migrateHistory(session) {

  if (!fs.existsSync(HISTORY_FILE)) {

    console.log("history.json не найден");

    return;
  }

  const history =
    JSON.parse(
      fs.readFileSync(
        HISTORY_FILE,
        "utf8"
      )
    );

  console.log(
    `Найдено записей истории: ${history.length}`
  );

  for (const item of history) {

    const id =
      item.id ||
      `${item.user}-${item.date}`;

    await session.run(
      `
            MERGE (h:History {id:$id})

            SET
                h.user=$user,
                h.action=$action,
                h.target=$target,
                h.date=$date
            `,
      {
        id,
        user: item.user || "",
        action: item.action || "",
        target: item.target || "",
        date: item.date || ""
      }
    );

    console.log(
      `History migrated: ${item.action}`
    );
  }
}

async function main() {

  const session =
    driver.session();

  try {

    console.log(
      "=== START MIGRATION ==="
    );

    await migrateUsers(session);

    await migrateHistory(session);

    console.log(
      "=== MIGRATION COMPLETE ==="
    );

  }

  catch (err) {

    console.error(
      "Ошибка миграции:",
      err
    );
  }

  finally {

    await session.close();

    await driver.close();
  }
}

main();