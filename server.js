import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const queryDB = async (query, params = []) => {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.execute(query, params);
        return results;
    } finally {
        connection.release();
    }
};

app.get("/api/users", async (req, res) => {
    try {
        const users = await queryDB("SELECT * FROM users");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/api/users", async (req, res) => {
    const { name, email, age } = req.body;
    try {
        const result = await queryDB(
            "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
            [name, email, age]
        );
        res.status(201).json({ id: result.insertId, name, email, age });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, age } = req.body;
    try {
        await queryDB(
            "UPDATE users SET name=?, email=?, age=? WHERE id=?",
            [name, email, age, id]
        );
        res.json({ id, name, email, age });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await queryDB("DELETE FROM users WHERE id=?", [id]);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
