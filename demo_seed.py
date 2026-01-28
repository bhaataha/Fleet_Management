from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.security import get_password_hash

DB = SessionLocal()
try:
    slug = 'demo-org'
    now = datetime.utcnow()

    org_id = DB.execute(text("SELECT id FROM organizations WHERE slug = :slug"), {"slug": slug}).scalar()
    if not org_id:
        org_id = DB.execute(text("""
            INSERT INTO organizations (
                name, slug, display_name, contact_name, contact_email, contact_phone,
                plan_type, status, is_active, total_trucks, total_drivers,
                total_jobs_completed, storage_used_gb, created_at
            ) VALUES (
                :name, :slug, :display_name, :contact_name, :contact_email, :contact_phone,
                :plan_type, :status, :is_active, 0, 0, 0, 0.0, :created_at
            ) RETURNING id
        """), {
            "name": "Demo Organization",
            "slug": slug,
            "display_name": "Demo Organization",
            "contact_name": "Demo Admin",
            "contact_email": "admin@demo-org.local",
            "contact_phone": "0509990000",
            "plan_type": "trial",
            "status": "active",
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created org {org_id}")
    else:
        print(f"Org exists {org_id}")

    admin_email = 'admin@demo-org.local'
    driver_email = 'driver@demo-org.local'

    admin_id = DB.execute(text("SELECT id FROM users WHERE email = :email"), {"email": admin_email}).scalar()
    if not admin_id:
        admin_id = DB.execute(text("""
            INSERT INTO users (org_id, email, phone, name, password_hash, is_active, is_super_admin, org_role, created_at)
            VALUES (:org_id, :email, :phone, :name, :password_hash, :is_active, :is_super_admin, :org_role, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "email": admin_email,
            "phone": "0509990001",
            "name": "Demo Admin",
            "password_hash": get_password_hash('Demo@2026!'),
            "is_active": True,
            "is_super_admin": False,
            "org_role": "admin",
            "created_at": now
        }).scalar()
        print(f"Created admin user {admin_id}")
    else:
        print(f"Admin user exists {admin_id}")

    driver_user_id = DB.execute(text("SELECT id FROM users WHERE email = :email"), {"email": driver_email}).scalar()
    if not driver_user_id:
        driver_user_id = DB.execute(text("""
            INSERT INTO users (org_id, email, phone, name, password_hash, is_active, is_super_admin, org_role, created_at)
            VALUES (:org_id, :email, :phone, :name, :password_hash, :is_active, :is_super_admin, :org_role, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "email": driver_email,
            "phone": "0509990002",
            "name": "Demo Driver",
            "password_hash": get_password_hash('Demo123!'),
            "is_active": True,
            "is_super_admin": False,
            "org_role": "driver",
            "created_at": now
        }).scalar()
        print(f"Created driver user {driver_user_id}")
    else:
        print(f"Driver user exists {driver_user_id}")

    driver_id = DB.execute(text("SELECT id FROM drivers WHERE user_id = :uid"), {"uid": driver_user_id}).scalar()
    if not driver_id:
        driver_id = DB.execute(text("""
            INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
            VALUES (:org_id, :user_id, :name, :phone, :license_type, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "user_id": driver_user_id,
            "name": "Demo Driver",
            "phone": "0509990002",
            "license_type": "C",
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created driver profile {driver_id}")
    else:
        print(f"Driver profile exists {driver_id}")

    customer_id = DB.execute(text("SELECT id FROM customers WHERE org_id = :org_id AND name = :name"), {"org_id": org_id, "name": "Demo Customer"}).scalar()
    if not customer_id:
        customer_id = DB.execute(text("""
            INSERT INTO customers (org_id, name, contact_name, phone, email, is_active, created_at)
            VALUES (:org_id, :name, :contact_name, :phone, :email, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "name": "Demo Customer",
            "contact_name": "Demo Contact",
            "phone": "03-5550000",
            "email": "contact@demo-customer.local",
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created customer {customer_id}")
    else:
        print(f"Customer exists {customer_id}")

    from_site_id = DB.execute(text("SELECT id FROM sites WHERE org_id = :org_id AND name = :name"), {"org_id": org_id, "name": "Demo Quarry"}).scalar()
    if not from_site_id:
        from_site_id = DB.execute(text("""
            INSERT INTO sites (org_id, customer_id, name, address, site_type, is_generic, is_active, created_at)
            VALUES (:org_id, :customer_id, :name, :address, :site_type, :is_generic, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "customer_id": customer_id,
            "name": "Demo Quarry",
            "address": "Quarry Rd 1",
            "site_type": "general",
            "is_generic": True,
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created from_site {from_site_id}")
    else:
        print(f"From_site exists {from_site_id}")

    to_site_id = DB.execute(text("SELECT id FROM sites WHERE org_id = :org_id AND name = :name"), {"org_id": org_id, "name": "Demo Construction Site"}).scalar()
    if not to_site_id:
        to_site_id = DB.execute(text("""
            INSERT INTO sites (org_id, customer_id, name, address, site_type, is_generic, is_active, created_at)
            VALUES (:org_id, :customer_id, :name, :address, :site_type, :is_generic, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "customer_id": customer_id,
            "name": "Demo Construction Site",
            "address": "Build Ave 10",
            "site_type": "customer_project",
            "is_generic": False,
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created to_site {to_site_id}")
    else:
        print(f"To_site exists {to_site_id}")

    material_id = DB.execute(text("SELECT id FROM materials WHERE org_id = :org_id AND name = :name"), {"org_id": org_id, "name": "Crushed Stone"}).scalar()
    if not material_id:
        material_id = DB.execute(text("""
            INSERT INTO materials (org_id, name, name_hebrew, billing_unit, density, is_active, created_at)
            VALUES (:org_id, :name, :name_hebrew, :billing_unit, :density, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "name": "Crushed Stone",
            "name_hebrew": "חצץ",
            "billing_unit": "TON",
            "density": 1.6,
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created material {material_id}")
    else:
        print(f"Material exists {material_id}")

    truck_id = DB.execute(text("SELECT id FROM trucks WHERE org_id = :org_id AND plate_number = :plate"), {"org_id": org_id, "plate": "11-222-33"}).scalar()
    if not truck_id:
        truck_id = DB.execute(text("""
            INSERT INTO trucks (org_id, plate_number, model, truck_type, capacity_ton, capacity_m3, owner_type, is_active, created_at)
            VALUES (:org_id, :plate_number, :model, :truck_type, :capacity_ton, :capacity_m3, :owner_type, :is_active, :created_at)
            RETURNING id
        """), {
            "org_id": org_id,
            "plate_number": "11-222-33",
            "model": "Volvo FMX",
            "truck_type": "SEMI",
            "capacity_ton": 25,
            "capacity_m3": 15,
            "owner_type": "COMPANY",
            "is_active": True,
            "created_at": now
        }).scalar()
        print(f"Created truck {truck_id}")
    else:
        print(f"Truck exists {truck_id}")

    future_date = now + timedelta(days=3)
    job_id = DB.execute(text("""
        SELECT id FROM jobs WHERE org_id = :org_id AND customer_id = :customer_id AND scheduled_date = :scheduled_date
    """), {"org_id": org_id, "customer_id": customer_id, "scheduled_date": future_date}).scalar()
    if not job_id:
        job_id = DB.execute(text("""
            INSERT INTO jobs (
                org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date,
                planned_qty, unit, priority, driver_id, truck_id, status, is_billable,
                created_by, created_at
            ) VALUES (
                :org_id, :customer_id, :from_site_id, :to_site_id, :material_id, :scheduled_date,
                :planned_qty, :unit, :priority, :driver_id, :truck_id, :status, :is_billable,
                :created_by, :created_at
            ) RETURNING id
        """), {
            "org_id": org_id,
            "customer_id": customer_id,
            "from_site_id": from_site_id,
            "to_site_id": to_site_id,
            "material_id": material_id,
            "scheduled_date": future_date,
            "planned_qty": 20,
            "unit": "TON",
            "priority": 1,
            "driver_id": driver_id,
            "truck_id": truck_id,
            "status": "PLANNED",
            "is_billable": False,
            "created_by": admin_id,
            "created_at": now
        }).scalar()
        DB.execute(text("""
            INSERT INTO job_status_events (job_id, status, event_time, user_id)
            VALUES (:job_id, :status, :event_time, :user_id)
        """), {
            "job_id": job_id,
            "status": "PLANNED",
            "event_time": now,
            "user_id": admin_id
        })
        print(f"Created future job {job_id}")
    else:
        print(f"Future job exists {job_id}")

    # Ensure initial status event exists
    status_event_id = DB.execute(text("SELECT id FROM job_status_events WHERE job_id = :job_id"), {"job_id": job_id}).scalar()
    if not status_event_id:
        DB.execute(text("""
            INSERT INTO job_status_events (job_id, status, event_time, user_id)
            VALUES (:job_id, :status, :event_time, :user_id)
        """), {
            "job_id": job_id,
            "status": "PLANNED",
            "event_time": now,
            "user_id": admin_id
        })
        print("Created job_status_event")

    DB.commit()
    print("Demo org setup complete")
finally:
    DB.close()
