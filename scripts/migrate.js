const fs = require("fs");
const path = require("path");
const pool = require("../server/config/database");
const env = require("../server/config/env");

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    LIMIT 1`,
    [env.db.database, tableName, columnName]
  );
  return rows.length > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [rows] = await connection.execute(
    `SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
    LIMIT 1`,
    [env.db.database, tableName, indexName]
  );
  return rows.length > 0;
}

async function runConditionalAlter(connection, statement) {
  const createIndexMatch = statement.match(/^CREATE\s+(UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+`?(\w+)`?\s+ON\s+`?(\w+)`?\s+(.+)$/i);
  if (createIndexMatch) {
    const unique = createIndexMatch[1] ? "UNIQUE " : "";
    const indexName = createIndexMatch[2];
    const tableName = createIndexMatch[3];
    const definition = createIndexMatch[4];
    if (await indexExists(connection, tableName, indexName)) {
      console.log(`Indice ignorado: ${tableName}.${indexName}`);
      return;
    }
    await connection.query(`CREATE ${unique}INDEX \`${indexName}\` ON \`${tableName}\` ${definition}`);
    console.log(`Indice criado: ${tableName}.${indexName}`);
    return;
  }

  const tableMatch = statement.match(/^ALTER TABLE\s+`?(\w+)`?/i);
  if (!tableMatch || !statement.includes("ADD COLUMN IF NOT EXISTS")) {
    await connection.query(statement);
    return;
  }

  const tableName = tableMatch[1];
  const lines = statement
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter((line) => line.toUpperCase().startsWith("ADD COLUMN IF NOT EXISTS"));

  for (const line of lines) {
    const match = line.match(/^ADD COLUMN IF NOT EXISTS\s+`?(\w+)`?\s+(.+)$/i);
    if (!match) continue;

    const columnName = match[1];
    const definition = match[2];
    if (await columnExists(connection, tableName, columnName)) {
      console.log(`Coluna ignorada: ${tableName}.${columnName}`);
      continue;
    }

    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    console.log(`Coluna criada: ${tableName}.${columnName}`);
  }
}

async function run() {
  const migrationsDir = path.join(__dirname, "..", "server", "database", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const connection = await pool.getConnection();

  try {
    await ensureMigrationsTable(connection);

    for (const file of files) {
      const [existing] = await connection.execute("SELECT id FROM migrations WHERE name = ?", [file]);

      if (existing.length > 0) {
        console.log(`Migration ignorada: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);

      await connection.beginTransaction();

      for (const statement of statements) {
        await runConditionalAlter(connection, statement);
      }

      await connection.execute("INSERT INTO migrations (name) VALUES (?)", [file]);
      await connection.commit();
      console.log(`Migration executada: ${file}`);
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Erro ao executar migrations:", error.message);
  process.exit(1);
});
