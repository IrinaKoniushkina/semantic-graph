const jwt = require("jsonwebtoken");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  "bolt://127.0.0.1:7687",
  neo4j.auth.basic("neo4j", "57281292")
);

const SECRET = "super-secret-key-2026";

async function login(login, password) {

  const session = driver.session();

  try {

    const result = await session.run(
      `
            MATCH (u:User {
                login:$login,
                password:$password
            })

            RETURN u
            `,
      { login, password }
    );

    if (!result.records.length) {
      return null;
    }

    const user =
      result.records[0]
        .get("u")
        .properties;

    const token = jwt.sign(
      {
        id: user.id,
        login: user.login,
        role: user.role
      },
      SECRET,
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        fullName:
          user.fullName ||
          user.login
      }
    };

  } finally {

    await session.close();
  }
}

function verifyToken(token) {

  try {
    return jwt.verify(token, SECRET);
  }

  catch {
    return null;
  }
}

module.exports = {
  login,
  verifyToken
};