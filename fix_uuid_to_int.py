#!/usr/bin/env python3
"""Fix all org_id columns from UUID to Integer"""

import re
import os

files = [
    'backend/app/models/__init__.py',
    'backend/app/models/permissions.py',
    'backend/app/models/alert.py',
]

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count replacements before
        count_before = len(re.findall(r'UUID\(as_uuid=True\), ForeignKey\("organizations\.id"', content))
        
        # Replace all org_id UUID declarations with Integer
        content = re.sub(
            r'UUID\(as_uuid=True\), ForeignKey\("organizations\.id"',
            'Integer, ForeignKey("organizations.id"',
            content
        )
        
        # Count replacements after
        count_after = len(re.findall(r'UUID\(as_uuid=True\), ForeignKey\("organizations\.id"', content))
        replacements = count_before - count_after
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✓ {file_path}: {replacements} replacements')
    except Exception as e:
        print(f'✗ {file_path}: {e}')
