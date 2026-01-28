"""add_permissions_is_active_created_at

Revision ID: 9a0b1c2d3e4f
Revises: 7f8e9d0a1b2c
Create Date: 2026-01-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a0b1c2d3e4f'
down_revision = '7f8e9d0a1b2c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'permissions' not in inspector.get_table_names():
        return

    existing_columns = {col['name'] for col in inspector.get_columns('permissions')}

    if 'is_active' not in existing_columns:
        op.add_column('permissions', sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.text('true')))
        op.alter_column('permissions', 'is_active', server_default=None)

    if 'created_at' not in existing_columns:
        op.add_column('permissions', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'permissions' not in inspector.get_table_names():
        return

    existing_columns = {col['name'] for col in inspector.get_columns('permissions')}

    if 'created_at' in existing_columns:
        op.drop_column('permissions', 'created_at')

    if 'is_active' in existing_columns:
        op.drop_column('permissions', 'is_active')
