const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        console.log("Users found:", rows.length);
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Email: ${row.email}, Role: ${row.role}, Password: ${row.password}`);
        });
    });
});

db.close();
