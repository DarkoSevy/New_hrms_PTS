import db from './database';

// Quick script to manually insert test user
db.run(
    'INSERT OR REPLACE INTO users (id, username, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['user1', 'admin', 'admin@pts.com', 'password', 'Administrator', 'Active', new Date().toISOString()],
    (err) => {
        if (err) {
            console.error('Error inserting user:', err);
        } else {
            console.log('✓ Test user inserted successfully');
        }
        process.exit(0);
    }
);
