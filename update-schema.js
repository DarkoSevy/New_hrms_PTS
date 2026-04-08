const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check if max_participants exists in training_programs
    db.all("PRAGMA table_info(training_programs)", (err, rows) => {
        if (err) {
            console.error('Error checking table info:', err);
            return;
        }

        const hasColumn = rows.some(row => row.name === 'max_participants');

        if (!hasColumn) {
            console.log('Adding max_participants column to training_programs...');
            db.run("ALTER TABLE training_programs ADD COLUMN max_participants INTEGER DEFAULT 20", (err) => {
                if (err) {
                    console.error('Error adding column:', err);
                } else {
                    console.log('Column added successfully.');
                }
            });
        } else {
            console.log('max_participants column already exists.');
        }
    });
});

db.close();
