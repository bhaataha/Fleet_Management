#!/usr/bin/env python3
import bcrypt

password = 'Admin@2026'
salt = bcrypt.gensalt(rounds=12)
hash_val = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
print(f'Hash: {hash_val}')
print(f'Password: {password}')
