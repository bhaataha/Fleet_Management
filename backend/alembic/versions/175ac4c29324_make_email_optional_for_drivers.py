"""make_email_optional_for_drivers

Revision ID: 175ac4c29324
Revises: 2085cb77c833
Create Date: 2026-01-27 15:03:22.509083

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '175ac4c29324'
down_revision = '2085cb77c833'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make email nullable (drivers can use phone-only login)
    op.alter_column('users', 'email',
                    existing_type=sa.String(255),
                    nullable=True)
    
    # Try to drop unique constraint if it exists
    # (Different DBs might name it differently)
    try:
        op.drop_constraint('users_email_key', 'users', type_='unique')
    except:
        # If constraint doesn't exist, try to drop the index instead
        try:
            op.drop_index('ix_users_email', 'users')
        except:
            pass  # Constraint/index doesn't exist, that's OK
    
    # Add partial unique index (only for non-null emails)
    op.create_index('ix_users_email_unique', 'users', ['email'], 
                   unique=True, 
                   postgresql_where=sa.text('email IS NOT NULL'))


def downgrade() -> None:
    # Drop partial unique index
    op.drop_index('ix_users_email_unique', 'users')
    
    # Add back unique constraint
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    
    # Make email non-nullable again
    op.alter_column('users', 'email',
                    existing_type=sa.String(255),
                    nullable=False)
