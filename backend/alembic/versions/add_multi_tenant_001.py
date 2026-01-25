"""add multi-tenant support

Revision ID: add_multi_tenant_001
Revises: b2ed0bcee5a7
Create Date: 2026-01-25 16:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'add_multi_tenant_001'
down_revision = 'b2ed0bcee5a7'
branch_labels = None
depends_on = None

# Default organization ID for existing data
DEFAULT_ORG_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

def upgrade():
    """
    Add multi-tenant support to the database
    
    Steps:
    1. Create organizations table
    2. Add org_id to all existing tables (nullable first)
    3. Create default organization for existing data
    4. Populate org_id in all tables
    5. Make org_id NOT NULL
    6. Add foreign keys and indexes
    """
    
    # Step 1: Create organizations table
    print("Creating organizations table...")
    
    # Check if table already exists
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND table_name='organizations'
    """))
    
    if result.fetchone() is None:
        op.create_table(
            'organizations',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('name', sa.String(200), nullable=False),
            sa.Column('slug', sa.String(100), unique=True, nullable=False),
            sa.Column('display_name', sa.String(200)),
            
            # Contact
            sa.Column('contact_name', sa.String(200)),
            sa.Column('contact_email', sa.String(255), unique=True, nullable=False),
            sa.Column('contact_phone', sa.String(20)),
            sa.Column('vat_id', sa.String(50)),
            
            # Address
            sa.Column('address', sa.Text()),
            sa.Column('city', sa.String(100)),
            sa.Column('postal_code', sa.String(20)),
            sa.Column('country', sa.String(3), server_default='ISR'),
            
            # Subscription
            sa.Column('plan_type', sa.String(50), nullable=False, server_default='trial'),
            sa.Column('plan_start_date', sa.Date()),
            sa.Column('plan_end_date', sa.Date()),
            sa.Column('trial_ends_at', sa.DateTime(timezone=True)),
            
            # Limits
            sa.Column('max_trucks', sa.Integer(), server_default='5'),
            sa.Column('max_drivers', sa.Integer(), server_default='10'),
            sa.Column('max_storage_gb', sa.Integer(), server_default='10'),
            sa.Column('features_json', postgresql.JSONB(), server_default='{}'),
            
            # Billing
            sa.Column('billing_cycle', sa.String(20), server_default='monthly'),
            sa.Column('billing_email', sa.String(255)),
            sa.Column('last_payment_date', sa.Date()),
            sa.Column('next_billing_date', sa.Date()),
            sa.Column('total_paid', sa.DECIMAL(10, 2), server_default='0'),
            
            # Settings
            sa.Column('timezone', sa.String(50), server_default='Asia/Jerusalem'),
            sa.Column('locale', sa.String(10), server_default='he'),
            sa.Column('currency', sa.String(3), server_default='ILS'),
            sa.Column('settings_json', postgresql.JSONB(), server_default='{}'),
            
            # Branding
            sa.Column('logo_url', sa.Text()),
            sa.Column('primary_color', sa.String(7)),
            sa.Column('custom_domain', sa.String(255)),
            
            # Status
            sa.Column('status', sa.String(50), nullable=False, server_default='active'),
            sa.Column('suspended_reason', sa.Text()),
            
            # Stats
            sa.Column('total_trucks', sa.Integer(), server_default='0'),
            sa.Column('total_drivers', sa.Integer(), server_default='0'),
            sa.Column('total_jobs_completed', sa.Integer(), server_default='0'),
            sa.Column('storage_used_gb', sa.DECIMAL(10, 2), server_default='0'),
            
            # Metadata
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.Column('created_by', postgresql.UUID(as_uuid=True)),
        )
        print("  ✓ Created organizations table")
    else:
        print("  ⊘ Organizations table already exists")
    
    # Indexes for organizations
    op.create_index('idx_organizations_slug', 'organizations', ['slug'])
    op.create_index('idx_organizations_status', 'organizations', ['status'])
    op.create_index('idx_organizations_plan_type', 'organizations', ['plan_type'])
    op.create_index('idx_organizations_contact_email', 'organizations', ['contact_email'])
    
    # Step 2: Add org_id column to all tables (nullable first)
    print("Adding org_id columns to existing tables (nullable)...")
    
    tables_to_update = [
        'users',
        'customers',
        'sites',
        'drivers',
        'trucks',
        'trailers',
        'materials',
        'price_lists',
        'jobs',
        'job_status_events',
        'delivery_notes',
        'weigh_tickets',
        'files',
        'statements',
        'statement_lines',
        'payments',
        'payment_allocations',
        'expenses',
    ]
    
    for table in tables_to_update:
        try:
            # Check if column already exists
            conn = op.get_bind()
            result = conn.execute(sa.text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='{table}' AND column_name='org_id'
            """))
            if result.fetchone() is None:
                op.add_column(table, sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=True))
                print(f"  ✓ Added org_id to {table}")
            else:
                print(f"  ⊘ {table} already has org_id")
        except Exception as e:
            print(f"  ⚠ Warning for {table}: {e}")
    
    # Step 3: Create default organization
    print("Creating default organization for existing data...")
    op.execute(f"""
        INSERT INTO organizations (
            id,
            name,
            slug,
            display_name,
            contact_email,
            plan_type,
            status,
            max_trucks,
            max_drivers,
            max_storage_gb,
            created_at
        ) VALUES (
            '{DEFAULT_ORG_ID}'::uuid,
            'Default Organization',
            'default-org',
            'TruckFlow Main',
            'admin@truckflow.com',
            'enterprise',
            'active',
            999,
            999,
            1000,
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
    """)
    
    # Step 4: Populate org_id in all existing data
    print("Populating org_id in existing data...")
    for table in tables_to_update:
        try:
            op.execute(f"""
                UPDATE {table}
                SET org_id = '{DEFAULT_ORG_ID}'::uuid
                WHERE org_id IS NULL;
            """)
            count = op.get_bind().execute(f"SELECT COUNT(*) FROM {table} WHERE org_id = '{DEFAULT_ORG_ID}'::uuid").scalar()
            print(f"  ✓ Updated {count} rows in {table}")
        except Exception as e:
            print(f"  ⚠ Warning for {table}: {e}")
    
    # Step 5: Make org_id NOT NULL
    print("Making org_id NOT NULL...")
    for table in tables_to_update:
        try:
            op.alter_column(table, 'org_id', nullable=False)
            print(f"  ✓ Made org_id NOT NULL in {table}")
        except Exception as e:
            print(f"  ⚠ Warning for {table}: {e}")
    
    # Step 6: Add foreign keys
    print("Adding foreign key constraints...")
    for table in tables_to_update:
        try:
            op.create_foreign_key(
                f'fk_{table}_org',
                table, 'organizations',
                ['org_id'], ['id'],
                ondelete='CASCADE'
            )
            print(f"  ✓ Added FK constraint for {table}")
        except Exception as e:
            print(f"  ⚠ Warning for {table}: {e}")
    
    # Step 7: Add indexes
    print("Adding indexes for org_id...")
    for table in tables_to_update:
        try:
            op.create_index(f'idx_{table}_org_id', table, ['org_id'])
            print(f"  ✓ Created index for {table}")
        except Exception as e:
            print(f"  ⚠ Warning for {table}: {e}")
    
    # Step 8: Update users table with new columns
    print("Updating users table with super_admin and org_role...")
    try:
        op.add_column('users', sa.Column('is_super_admin', sa.Boolean(), server_default='false', nullable=False))
        op.add_column('users', sa.Column('org_role', sa.String(50), server_default='user', nullable=False))
        print("  ✓ Added is_super_admin and org_role to users")
    except Exception as e:
        print(f"  ⚠ Warning: {e}")
    
    print("✅ Multi-tenant migration completed!")


def downgrade():
    """
    Remove multi-tenant support
    
    WARNING: This will remove the org_id column from all tables
    and delete the organizations table. Use with caution!
    """
    
    print("Rolling back multi-tenant support...")
    
    # Remove new columns from users
    try:
        op.drop_column('users', 'org_role')
        op.drop_column('users', 'is_super_admin')
    except Exception as e:
        print(f"Warning: {e}")
    
    tables_to_update = [
        'users', 'customers', 'sites', 'drivers', 'trucks', 'trailers',
        'materials', 'price_lists', 'jobs', 'job_status_events',
        'delivery_notes', 'weigh_tickets', 'files', 'statements',
        'statement_lines', 'payments', 'payment_allocations', 'expenses'
    ]
    
    # Drop indexes
    for table in tables_to_update:
        try:
            op.drop_index(f'idx_{table}_org_id')
        except Exception as e:
            print(f"Warning: {e}")
    
    # Drop foreign keys
    for table in tables_to_update:
        try:
            op.drop_constraint(f'fk_{table}_org', table, type_='foreignkey')
        except Exception as e:
            print(f"Warning: {e}")
    
    # Drop org_id columns
    for table in tables_to_update:
        try:
            op.drop_column(table, 'org_id')
        except Exception as e:
            print(f"Warning: {e}")
    
    # Drop organizations indexes
    try:
        op.drop_index('idx_organizations_contact_email')
        op.drop_index('idx_organizations_plan_type')
        op.drop_index('idx_organizations_status')
        op.drop_index('idx_organizations_slug')
    except Exception as e:
        print(f"Warning: {e}")
    
    # Drop organizations table
    op.drop_table('organizations')
    
    print("✅ Rollback completed!")
