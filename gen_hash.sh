#!/bin/bash
# Generate bcrypt hash for password "admin123"
docker exec fleet_backend python3 << 'PYEOF'
import bcrypt
password = "admin123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
echo "Hashed password: ${hashed}"
update_cmd="UPDATE users SET password_hash = '${hashed}' WHERE id = 2;"
echo "SQL Command:"
echo "${update_cmd}"
PYEOF
