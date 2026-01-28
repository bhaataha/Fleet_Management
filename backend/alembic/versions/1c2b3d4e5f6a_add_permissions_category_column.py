"""add_permissions_category_column

Revision ID: 1c2b3d4e5f6a
Revises: 2085cb77c833
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c2b3d4e5f6a'
down_revision = '2085cb77c833'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'permissions' not in inspector.get_table_names():
        op.create_table(
            'permissions',
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String(100), unique=True, nullable=False, index=True),
            sa.Column('display_name', sa.String(200), nullable=True),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('category', sa.String(50), nullable=True),
            sa.Column('is_active', sa.Boolean, default=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index('ix_permissions_id', 'permissions', ['id'], unique=False)
        op.create_index('ix_permissions_name', 'permissions', ['name'], unique=True)
        return

    existing_columns = {col['name'] for col in inspector.get_columns('permissions')}
    if 'category' not in existing_columns:
        op.add_column('permissions', sa.Column('category', sa.String(50), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'permissions' not in inspector.get_table_names():
        return

    existing_columns = {col['name'] for col in inspector.get_columns('permissions')}
    if 'category' in existing_columns:
        op.drop_column('permissions', 'category')
