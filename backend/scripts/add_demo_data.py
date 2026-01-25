"""
Add demo data to Fleet Management System

Run with:
docker exec fleet_backend python scripts/add_demo_data.py
"""
import sys
sys.path.insert(0, '/app')

from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Organization, User, UserRoleModel, UserRole,
    Customer, Site, Material, Driver, Truck, Trailer, Job
)

def add_demo_data():
    db = SessionLocal()
    try:
        print("🚀 Adding demo data...")
        
        # Get organization
        org = db.query(Organization).first()
        if not org:
            org = Organization(name="Fleet Management Co.", timezone="Asia/Jerusalem")
            db.add(org)
            db.flush()
            print(f"✅ Created organization: {org.name}")
        
        org_id = org.id
        
        # === CUSTOMERS ===
        print("\n📋 Creating customers...")
        customers_data = [
            {"name": "חברת בניה ישראל בע״מ", "vat_id": "515123456", "contact_name": "יוסי כהן", "phone": "050-1234567"},
            {"name": "קבוצת עזריאלי", "vat_id": "515234567", "contact_name": "דנה לוי", "phone": "052-9876543"},
            {"name": "אלקטרה נדל״ן", "vat_id": "515345678", "contact_name": "מיכאל אברהם", "phone": "054-1112222"},
            {"name": "סולל בונה", "vat_id": "515456789", "contact_name": "רונית שמש", "phone": "053-3334444"},
        ]
        
        customers = []
        for c_data in customers_data:
            customer = db.query(Customer).filter(
                Customer.org_id == org_id,
                Customer.name == c_data["name"]
            ).first()
            
            if not customer:
                customer = Customer(org_id=org_id, **c_data)
                db.add(customer)
                db.flush()
                print(f"  ✅ {customer.name}")
            else:
                print(f"  ⏭️  {customer.name} (exists)")
            customers.append(customer)
        
        # === SITES ===
        print("\n🏗️ Creating sites...")
        sites_data = [
            # Customer 1 sites
            {"customer_id": customers[0].id, "name": "פרויקט רמת אביב", "address": "רחוב ירקון 123, תל אביב"},
            {"customer_id": customers[0].id, "name": "פרויקט הרצליה פיתוח", "address": "דרך השרון 45, הרצליה"},
            # Customer 2 sites
            {"customer_id": customers[1].id, "name": "מגדלי עזריאלי ראשון", "address": "שדרות ירושלים 1, ראשון לציון"},
            {"customer_id": customers[1].id, "name": "עזריאלי חולון", "address": "רחוב סוקולוב 88, חולון"},
            # Customer 3 sites
            {"customer_id": customers[2].id, "name": "פרויקט נתניה מערב", "address": "רחוב ויצמן 200, נתניה"},
            # Customer 4 sites
            {"customer_id": customers[3].id, "name": "כביש 531 - קטע ב׳", "address": "כביש 531, צומת בית דגן"},
            # Common sites
            {"customer_id": customers[0].id, "name": "מחצבת נשר", "address": "אזור תעשייה נשר"},
            {"customer_id": customers[0].id, "name": "מזבלה אריאל", "address": "אזור תעשייה אריאל"},
        ]
        
        sites = []
        for s_data in sites_data:
            site = db.query(Site).filter(
                Site.org_id == org_id,
                Site.name == s_data["name"]
            ).first()
            
            if not site:
                site = Site(org_id=org_id, **s_data)
                db.add(site)
                db.flush()
                print(f"  ✅ {site.name}")
            else:
                print(f"  ⏭️  {site.name} (exists)")
            sites.append(site)
        
        # === MATERIALS ===
        print("\n🪨 Creating materials...")
        materials_data = [
            {"name": "עפר", "name_hebrew": "עפר", "billing_unit": "TON"},
            {"name": "חצץ", "name_hebrew": "חצץ", "billing_unit": "TON"},
            {"name": "מצע", "name_hebrew": "מצע", "billing_unit": "TON"},
            {"name": "חול", "name_hebrew": "חול", "billing_unit": "M3"},
            {"name": "פסולת בניין", "name_hebrew": "פסולת בניין", "billing_unit": "TON"},
            {"name": "אספלט", "name_hebrew": "אספלט", "billing_unit": "TON"},
        ]
        
        materials = []
        for m_data in materials_data:
            material = db.query(Material).filter(
                Material.org_id == org_id,
                Material.name == m_data["name"]
            ).first()
            
            if not material:
                material = Material(org_id=org_id, **m_data)
                db.add(material)
                db.flush()
                print(f"  ✅ {material.name_hebrew}")
            else:
                print(f"  ⏭️  {material.name_hebrew} (exists)")
            materials.append(material)
        
        # === TRUCKS ===
        print("\n🚛 Creating trucks...")
        trucks_data = [
            {"plate_number": "12-345-67", "model": "וולוו FH16", "capacity_ton": 30, "capacity_m3": 20},
            {"plate_number": "23-456-78", "model": "מרצדס אקטרוס", "capacity_ton": 28, "capacity_m3": 18},
            {"plate_number": "34-567-89", "model": "סקניה R500", "capacity_ton": 32, "capacity_m3": 22},
            {"plate_number": "45-678-90", "model": "מאן TGX", "capacity_ton": 29, "capacity_m3": 19},
            {"plate_number": "56-789-01", "model": "איווקו סטרליס", "capacity_ton": 27, "capacity_m3": 17},
        ]
        
        trucks = []
        for t_data in trucks_data:
            truck = db.query(Truck).filter(
                Truck.org_id == org_id,
                Truck.plate_number == t_data["plate_number"]
            ).first()
            
            if not truck:
                truck = Truck(org_id=org_id, is_active=True, **t_data)
                db.add(truck)
                db.flush()
                print(f"  ✅ {truck.plate_number} - {truck.model}")
            else:
                print(f"  ⏭️  {truck.plate_number} (exists)")
            trucks.append(truck)
        
        # === DRIVERS (with users) ===
        print("\n👨‍✈️ Creating drivers...")
        drivers_data = [
            {"name": "משה כהן", "phone": "050-1111111", "email": "moshe@fleet.com", "password": "driver123"},
            {"name": "דוד לוי", "phone": "052-2222222", "email": "david@fleet.com", "password": "driver123"},
            {"name": "יוסי אברהם", "phone": "053-3333333", "email": "yossi@fleet.com", "password": "driver123"},
            {"name": "אבי שמש", "phone": "054-4444444", "email": "avi@fleet.com", "password": "driver123"},
            {"name": "רוני ברק", "phone": "055-5555555", "email": "roni@fleet.com", "password": "driver123"},
        ]
        
        drivers = []
        for d_data in drivers_data:
            # Check if driver exists
            driver = db.query(Driver).filter(
                Driver.org_id == org_id,
                Driver.name == d_data["name"]
            ).first()
            
            if not driver:
                # Create user first
                user = db.query(User).filter(User.email == d_data["email"]).first()
                if not user:
                    user = User(
                        org_id=org_id,
                        name=d_data["name"],
                        email=d_data["email"],
                        password_hash=get_password_hash(d_data["password"]),
                        is_active=True
                    )
                    db.add(user)
                    db.flush()
                    
                    # Add DRIVER role
                    role = UserRoleModel(
                        org_id=org_id,
                        user_id=user.id,
                        role=UserRole.DRIVER
                    )
                    db.add(role)
                    db.flush()
                
                # Create driver
                driver = Driver(
                    org_id=org_id,
                    user_id=user.id,
                    name=d_data["name"],
                    phone=d_data["phone"],
                    license_type="C",
                    is_active=True
                )
                db.add(driver)
                db.flush()
                print(f"  ✅ {driver.name} (email: {d_data['email']})")
            else:
                print(f"  ⏭️  {driver.name} (exists)")
            drivers.append(driver)
        
        # === JOBS ===
        print("\n📦 Creating jobs...")
        today = datetime.now().date()
        
        jobs_data = [
            # Today's jobs
            {
                "customer_id": customers[0].id,
                "from_site_id": sites[6].id,  # מחצבת נשר
                "to_site_id": sites[0].id,    # רמת אביב
                "material_id": materials[0].id,  # עפר
                "planned_qty": 25,
                "unit": "TON",
                "driver_id": drivers[0].id,
                "truck_id": trucks[0].id,
                "scheduled_date": today,
                "status": "ASSIGNED"
            },
            {
                "customer_id": customers[0].id,
                "from_site_id": sites[6].id,  # מחצבת נשר
                "to_site_id": sites[1].id,    # הרצליה
                "material_id": materials[1].id,  # חצץ
                "planned_qty": 28,
                "unit": "TON",
                "driver_id": drivers[1].id,
                "truck_id": trucks[1].id,
                "scheduled_date": today,
                "status": "ENROUTE_PICKUP"
            },
            {
                "customer_id": customers[1].id,
                "from_site_id": sites[6].id,
                "to_site_id": sites[2].id,    # עזריאלי ראשון
                "material_id": materials[2].id,  # מצע
                "planned_qty": 30,
                "unit": "TON",
                "driver_id": drivers[2].id,
                "truck_id": trucks[2].id,
                "scheduled_date": today,
                "status": "LOADED"
            },
            {
                "customer_id": customers[2].id,
                "from_site_id": sites[4].id,   # נתניה
                "to_site_id": sites[7].id,     # מזבלה אריאל
                "material_id": materials[4].id,  # פסולת
                "planned_qty": 22,
                "unit": "TON",
                "driver_id": drivers[3].id,
                "truck_id": trucks[3].id,
                "scheduled_date": today,
                "status": "ENROUTE_DROPOFF"
            },
            {
                "customer_id": customers[3].id,
                "from_site_id": sites[6].id,
                "to_site_id": sites[5].id,     # כביש 531
                "material_id": materials[5].id,  # אספלט
                "planned_qty": 26,
                "unit": "TON",
                "driver_id": drivers[4].id,
                "truck_id": trucks[4].id,
                "scheduled_date": today,
                "status": "ASSIGNED"
            },
            # Tomorrow's jobs
            {
                "customer_id": customers[0].id,
                "from_site_id": sites[6].id,
                "to_site_id": sites[0].id,
                "material_id": materials[0].id,
                "planned_qty": 27,
                "unit": "TON",
                "driver_id": drivers[0].id,
                "truck_id": trucks[0].id,
                "scheduled_date": today + timedelta(days=1),
                "status": "PLANNED"
            },
            {
                "customer_id": customers[1].id,
                "from_site_id": sites[6].id,
                "to_site_id": sites[3].id,    # עזריאלי חולון
                "material_id": materials[3].id,  # חול
                "planned_qty": 18,
                "unit": "M3",
                "driver_id": drivers[1].id,
                "truck_id": trucks[1].id,
                "scheduled_date": today + timedelta(days=1),
                "status": "PLANNED"
            },
        ]
        
        for j_data in jobs_data:
            job = Job(org_id=org_id, priority=1, **j_data)
            db.add(job)
        
        db.commit()
        print(f"  ✅ Created {len(jobs_data)} jobs")
        
        print("\n" + "="*50)
        print("✅ Demo data created successfully!")
        print("="*50)
        print("\n📊 Summary:")
        print(f"  • {len(customers)} Customers")
        print(f"  • {len(sites)} Sites")
        print(f"  • {len(materials)} Materials")
        print(f"  • {len(trucks)} Trucks")
        print(f"  • {len(drivers)} Drivers")
        print(f"  • {len(jobs_data)} Jobs")
        
        print("\n👥 Driver Logins:")
        for d in drivers_data:
            print(f"  • {d['name']}: {d['email']} / {d['password']}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_demo_data()
