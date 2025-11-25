const db = require('./src/config/db-users');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        const hash = await bcrypt.hash('password', 10);
        console.log('New hash:', hash);
        await db.query("UPDATE usuarios SET password_hash = $1 WHERE email = 'admin@example.com'", [hash]);
        console.log('Password updated successfully');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
