"""add alerts table

Revision ID: add_alerts_002
Revises: 50897775e9cd
Create Date: 2026-01-27 12:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_alerts_002'
down_revision = '50897775e9cd'
branch_labels = None
depends_on = None


def upgrade():
    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        
        # Alert type and severity
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        
        # Content
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        
        # Entity relation
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        
        # Status
        sa.Column('status', sa.String(length=20), server_default='UNREAD', nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        
        # Target users
        sa.Column('created_for_user_id', sa.Integer(), nullable=True),
        sa.Column('created_for_role', sa.String(length=50), nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('alert_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_for_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL')
    )
    
    # Create indexes
    op.create_index('idx_alerts_org_user', 'alerts', ['org_id', 'created_for_user_id', 'status'])
    op.create_index('idx_alerts_type', 'alerts', ['alert_type', 'created_at'])
    op.create_index('idx_alerts_severity', 'alerts', ['severity', 'status'])
    op.create_index('idx_alerts_expiry', 'alerts', ['expires_at'], postgresql_where=sa.text('expires_at IS NOT NULL'))


def downgrade():
    op.drop_index('idx_alerts_expiry', table_name='alerts')
    op.drop_index('idx_alerts_severity', table_name='alerts')
    op.drop_index('idx_alerts_type', table_name='alerts')
    op.drop_index('idx_alerts_org_user', table_name='alerts')
    op.drop_table('alerts')
