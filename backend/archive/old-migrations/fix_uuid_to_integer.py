"""
Fix UUID vs Integer org_id type mismatch
Change all org_id from UUID to Integer in models to match database schema
"""
import re
import os

# Path to models file
models_file = 'backend/app/models/__init__.py'

# Read the file
with open(models_file, 'r', encoding='utf-8') as f:
    content = f.content()

# Pattern to match: org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), ...)
# Replace with: org_id = Column(Integer, ForeignKey("organizations.id"), ...)

# Pattern 1: org_id with UUID
pattern1 = r'org_id = Column\(UUID\(as_uuid=True\), ForeignKey\("organizations\.id"\), nullable=False, index=True\)'
replacement1 = 'org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)'

# Pattern 2: created_by with UUID  
pattern2 = r'created_by = Column\(UUID\(as_uuid=True\)\)'
replacement2 = 'created_by = Column(Integer)'

# Apply replacements
content = re.sub(pattern1, replacement1, content)
content = re.sub(pattern2, replacement2, content)

# Also fix Organization.id from UUID to Integer
pattern3 = r'id = Column\(UUID\(as_uuid=True\), primary_key=True, default=uuid\.uuid4, index=True\)'
replacement3 = 'id = Column(Integer, primary_key=True, autoincrement=True, index=True)'
content = re.sub(pattern3, replacement3, content)

# Write back
with open(models_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Fixed {models_file}")
print("Changes made:")
print("  - org_id: UUID → Integer")
print("  - created_by: UUID → Integer")  
print("  - Organization.id: UUID → Integer")
