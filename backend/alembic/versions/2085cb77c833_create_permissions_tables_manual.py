"""create_permissions_tables_manual

Revision ID: 2085cb77c833
Revises: 8638f613c082
Create Date: 2026-01-27 11:14:52.073242

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '2085cb77c833'
down_revision = '8638f613c082'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_permissions table
    op.create_table(
        'user_permissions',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('org_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('permission_name', sa.String(100), nullable=False),
        sa.Column('granted', sa.Boolean, default=True, nullable=False),
        sa.Column('granted_by', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True)),
        sa.Column('notes', sa.Text),
        
        sa.UniqueConstraint('user_id', 'permission_name', name='uq_user_permission')
    )
    
    # Create indexes
    op.create_index('idx_user_permissions_user', 'user_permissions', ['user_id'])
    op.create_index('idx_user_permissions_org', 'user_permissions', ['org_id'])
    
    # Create phone_otps table
    op.create_table(
        'phone_otps',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('phone', sa.String(20), nullable=False, index=True),
        sa.Column('org_id', UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('otp_code', sa.String(6), nullable=False),
        sa.Column('attempts', sa.Integer, default=0),
        sa.Column('used', sa.Boolean, default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('used_at', sa.DateTime(timezone=True)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('ip_address', sa.String(45)),
    )


def downgrade() -> None:
    op.drop_table('phone_otps')
    op.drop_index('idx_user_permissions_org', 'user_permissions')
    op.drop_index('idx_user_permissions_user', 'user_permissions')
    op.drop_table('user_permissions')
