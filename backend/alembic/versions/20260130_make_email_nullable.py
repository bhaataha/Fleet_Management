"""Make email nullable for drivers

Revision ID: make_email_nullable
Revises: 
Create Date: 2026-01-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_email_nullable'
down_revision = None  # Update this if you have previous migrations
branch_labels = None
depends_on = None


def upgrade():
    # Make email column nullable in users table
    # This allows drivers to be created without email (they login with phone)
    op.alter_column('users', 'email',
                    existing_type=sa.String(length=255),
                    nullable=True)


def downgrade():
    # Revert email column to NOT NULL
    # WARNING: This will fail if there are users with NULL email
    op.alter_column('users', 'email',
                    existing_type=sa.String(length=255),
                    nullable=False)
