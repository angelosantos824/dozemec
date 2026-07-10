const fs = require("fs");
const path = require("path");
const pool = require("../server/config/database");

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
        await connection.query(statement);
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
