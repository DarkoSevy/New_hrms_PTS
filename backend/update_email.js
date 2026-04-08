const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("UPDATE users SET email = 'admin@pts.com' WHERE email = 'admin'", function (err) {
        if (err) {
            console.error("Error updating email:", err);
            return;
        }
        console.log(`Row(s) updated: ${this.changes}`);
    });

    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err);
            return;
        }
        console.log("Updated Users:", JSON.stringify(rows, null, 2));
    });
});

db.close();
