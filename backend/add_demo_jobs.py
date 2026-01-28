#!/usr/bin/env python3
"""
הוספת נתוני דמו נוספים לארגון הדגמה
- נסיעות להיום ומחר
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import random

# Add backend to path
sys.path.insert(0, '/app')

# Organization ID
ORG_ID = '2b0018bd-31c3-4d89-ab46-9a3219a44f2b'

def add_demo_jobs():
    """הוספת נסיעות דמו להיום ומחר"""
    
    db_url = os.getenv("DATABASE_URL", "postgresql://fleet_user:fleet_password@postgres:5432/fleet_management")
    
    print("🚀 הוספת נתוני דמו - נסיעות")
    print("=" * 60)
    
    try:
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # קבלת נתונים קיימים
        print("📊 שולף נתונים קיימים...")
        
        customers = session.execute(
            text("SELECT id, name FROM customers WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        sites = session.execute(
            text("SELECT id, name FROM sites WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        materials = session.execute(
            text("SELECT id, name FROM materials WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        drivers = session.execute(
            text("SELECT id, name FROM drivers WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        trucks = session.execute(
            text("SELECT id, plate_number FROM trucks WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        subcontractors = session.execute(
            text("SELECT id, name FROM subcontractors WHERE org_id = :org_id AND is_active = true"),
            {"org_id": ORG_ID}
        ).fetchall()
        
        print(f"✓ {len(customers)} לקוחות")
        print(f"✓ {len(sites)} אתרים")
        print(f"✓ {len(materials)} חומרים")
        print(f"✓ {len(drivers)} נהגים")
        print(f"✓ {len(trucks)} משאיות")
        print(f"✓ {len(subcontractors)} קבלני משנה")
        print()
        
        if not all([customers, sites, materials, drivers, trucks]):
            print("❌ חסרים נתונים בסיסיים! יש להוסיף קודם לקוחות/אתרים/חומרים/נהגים/משאיות")
            return
        
        # יצירת נסיעות להיום ומחר
        print("🚛 יוצר נסיעות...")
        
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        
        statuses = ['PLANNED', 'ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF', 'DELIVERED']
        units = ['TON', 'M3', 'TRIP']
        
        jobs_created = 0
        
        # נסיעות להיום (20 נסיעות)
        for i in range(20):
            customer = random.choice(customers)
            from_site = random.choice(sites)
            to_site = random.choice([s for s in sites if s.id != from_site.id])
            material = random.choice(materials)
            driver = random.choice(drivers)
            truck = random.choice(trucks)
            unit = random.choice(units)
            status = random.choice(statuses)
            
            # זמן אקראי בין 06:00 ל-18:00
            hour = random.randint(6, 18)
            minute = random.randint(0, 59)
            scheduled_time = today.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # כמות אקראית
            if unit == 'TON':
                planned_qty = random.randint(10, 30)
            elif unit == 'M3':
                planned_qty = random.randint(8, 25)
            else:  # TRIP
                planned_qty = 1
            
            # 20% סיכוי לקבלן משנה
            is_subcontractor = random.random() < 0.2
            subcontractor_id = random.choice(subcontractors).id if is_subcontractor and subcontractors else None
            
            session.execute(
                text("""
                    INSERT INTO jobs (
                        org_id, customer_id, from_site_id, to_site_id, material_id,
                        scheduled_date, planned_qty, unit, status,
                        driver_id, truck_id, is_subcontractor, subcontractor_id,
                        priority, created_at, updated_at
                    ) VALUES (
                        :org_id, :customer_id, :from_site_id, :to_site_id, :material_id,
                        :scheduled_date, :planned_qty, :unit, :status,
                        :driver_id, :truck_id, :is_subcontractor, :subcontractor_id,
                        :priority, :created_at, :updated_at
                    )
                """),
                {
                    "org_id": ORG_ID,
                    "customer_id": customer.id,
                    "from_site_id": from_site.id,
                    "to_site_id": to_site.id,
                    "material_id": material.id,
                    "scheduled_date": scheduled_time,
                    "planned_qty": planned_qty,
                    "unit": unit,
                    "status": status,
                    "driver_id": driver.id,
                    "truck_id": truck.id,
                    "is_subcontractor": is_subcontractor,
                    "subcontractor_id": subcontractor_id,
                    "priority": random.randint(0, 2),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            jobs_created += 1
        
        print(f"✓ נוצרו {jobs_created} נסיעות להיום")
        
        # נסיעות למחר (15 נסיעות מתוכננות)
        jobs_created_tomorrow = 0
        for i in range(15):
            customer = random.choice(customers)
            from_site = random.choice(sites)
            to_site = random.choice([s for s in sites if s.id != from_site.id])
            material = random.choice(materials)
            unit = random.choice(units)
            
            # זמן אקראי בין 06:00 ל-18:00
            hour = random.randint(6, 18)
            minute = random.randint(0, 59)
            scheduled_time = tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # כמות אקראית
            if unit == 'TON':
                planned_qty = random.randint(10, 30)
            elif unit == 'M3':
                planned_qty = random.randint(8, 25)
            else:  # TRIP
                planned_qty = 1
            
            # רוב הנסיעות מחר יהיו PLANNED או ASSIGNED
            status = random.choice(['PLANNED', 'PLANNED', 'PLANNED', 'ASSIGNED'])
            driver_id = random.choice(drivers).id if status == 'ASSIGNED' else None
            truck_id = random.choice(trucks).id if status == 'ASSIGNED' else None
            
            # 15% סיכוי לקבלן משנה
            is_subcontractor = random.random() < 0.15
            subcontractor_id = random.choice(subcontractors).id if is_subcontractor and subcontractors else None
            
            session.execute(
                text("""
                    INSERT INTO jobs (
                        org_id, customer_id, from_site_id, to_site_id, material_id,
                        scheduled_date, planned_qty, unit, status,
                        driver_id, truck_id, is_subcontractor, subcontractor_id,
                        priority, created_at, updated_at
                    ) VALUES (
                        :org_id, :customer_id, :from_site_id, :to_site_id, :material_id,
                        :scheduled_date, :planned_qty, :unit, :status,
                        :driver_id, :truck_id, :is_subcontractor, :subcontractor_id,
                        :priority, :created_at, :updated_at
                    )
                """),
                {
                    "org_id": ORG_ID,
                    "customer_id": customer.id,
                    "from_site_id": from_site.id,
                    "to_site_id": to_site.id,
                    "material_id": material.id,
                    "scheduled_date": scheduled_time,
                    "planned_qty": planned_qty,
                    "unit": unit,
                    "status": status,
                    "driver_id": driver_id,
                    "truck_id": truck_id,
                    "is_subcontractor": is_subcontractor,
                    "subcontractor_id": subcontractor_id,
                    "priority": random.randint(0, 2),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            jobs_created_tomorrow += 1
        
        print(f"✓ נוצרו {jobs_created_tomorrow} נסיעות למחר")
        
        # Commit
        session.commit()
        
        print()
        print("=" * 60)
        print("✅ נתוני הדמו נוספו בהצלחה!")
        print("=" * 60)
        print(f"📊 סה\"כ נסיעות חדשות: {jobs_created + jobs_created_tomorrow}")
        print(f"   - היום: {jobs_created}")
        print(f"   - מחר: {jobs_created_tomorrow}")
        print()
        
    except Exception as e:
        if 'session' in locals():
            session.rollback()
        print(f"❌ שגיאה: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        if 'session' in locals():
            session.close()


if __name__ == "__main__":
    add_demo_jobs()
