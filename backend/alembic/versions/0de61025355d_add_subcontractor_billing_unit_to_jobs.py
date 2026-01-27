"""add_subcontractor_billing_unit_to_jobs

Revision ID: 0de61025355d
Revises: add_multi_tenant_001
Create Date: 2026-01-26 23:15:41.084636

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0de61025355d'
down_revision = 'add_multi_tenant_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add subcontractor_billing_unit column to jobs table
    # This allows choosing how to bill subcontractor: TON, M3, TRIP, KM
    op.add_column('jobs', sa.Column('subcontractor_billing_unit', sa.String(10), nullable=True))


def downgrade() -> None:
    # Remove subcontractor_billing_unit column
    op.drop_column('jobs', 'subcontractor_billing_unit')
