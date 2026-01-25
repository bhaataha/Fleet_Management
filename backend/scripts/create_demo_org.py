"""
Create DEMO Organization with Rich Sample Data

This creates a separate DEMO organization that clients can explore
without affecting real production data.

Run with:
docker exec fleet_backend python scripts/create_demo_org.py
"""
import sys
sys.path.insert(0, '/app')

from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import uuid4
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Organization, User, UserRoleModel, UserRole,
    Customer, Site, Material, Driver, Truck, Job,
    PriceList, Statement, StatementLine, Payment, PaymentAllocation,
    JobStatusEvent, DeliveryNote, StatementStatus, BillingUnit
)

def create_demo_organization():
    db = SessionLocal()
    try:
        print("🎯 Creating DEMO Organization with Rich Sample Data...")
        print("="*60)
        
        # === ORGANIZATION ===
        print("\n🏢 Creating DEMO organization...")
        org = db.query(Organization).filter(Organization.slug == "demo").first()
        
        if org:
            print(f"  ⚠️  DEMO org already exists (ID: {org.id})")
            user_input = input("  Delete and recreate? (yes/no): ").strip().lower()
            if user_input != "yes":
                print("  ⏭️  Skipping...")
                return
            
            print(f"  🗑️  Deleting existing DEMO org...")
            # Delete will cascade to all related tables due to foreign keys
            db.delete(org)
            db.commit()
            print(f"  ✅ Deleted old DEMO org")
        
        org = Organization(
            id=uuid4(),
            name="הדגמה - חברת הובלות ישראל",
            slug="demo",
            display_name="DEMO - Fleet Management Israel",
            contact_name="מנהל מערכת",
            contact_email="demo@fleet-demo.co.il",
            contact_phone="050-0000000",
            vat_id="999999999",
            address="דרך מנחם בגין 125",
            city="תל אביב",
            postal_code="6701101",
            country="IL",
            plan_type="professional",
            status="active",
            max_trucks=20,
            max_drivers=20,
            max_storage_gb=50,
            timezone="Asia/Jerusalem",
            locale="he",
            currency="ILS",
            trial_ends_at=None
        )
        db.add(org)
        db.flush()
        print(f"  ✅ Created: {org.display_name} (ID: {org.id})")
        
        org_id = org.id
        
        # === ADMIN USER ===
        print("\n👤 Creating DEMO admin user...")
        admin = User(
            org_id=org_id,
            name="מנהל הדגמה",
            email="demo@demo.com",
            phone="050-0000000",
            password_hash=get_password_hash("demo123"),
            is_active=True
        )
        db.add(admin)
        db.flush()
        
        admin_role = UserRoleModel(
            org_id=org_id,
            user_id=admin.id,
            role=UserRole.ADMIN
        )
        db.add(admin_role)
        db.flush()
        print(f"  ✅ Admin: demo@demo.com / demo123")
        
        # === CUSTOMERS ===
        print("\n📋 Creating customers...")
        customers_data = [
            {
                "name": "עזריאלי נכסים בע״מ",
                "vat_id": "510123456",
                "contact_name": "אורי כהן",
                "phone": "03-6081000",
                "email": "uri@azrieli.com",
                "address": "מגדל עזריאלי עגול, תל אביב",
                "payment_terms": "שוטף+60"
            },
            {
                "name": "סולל בונה בע״מ",
                "vat_id": "510234567",
                "contact_name": "דנה לוי",
                "phone": "03-7654321",
                "email": "dana@solel.co.il",
                "address": "דרך השלום 53, תל אביב",
                "payment_terms": "שוטף+45"
            },
            {
                "name": "אפריקה ישראל בע״מ",
                "vat_id": "510345678",
                "contact_name": "יוסי אברהם",
                "phone": "09-9609609",
                "email": "yossi@africa-isr.co.il",
                "address": "רחוב הנחושת 3, ראשון לציון",
                "payment_terms": "שוטף+30"
            },
            {
                "name": "אלקטרה נדל״ן בע״מ",
                "vat_id": "510456789",
                "contact_name": "מיכל שמש",
                "phone": "03-5111111",
                "email": "michal@electra.co.il",
                "address": "רחוב תוצרת הארץ 8, תל אביב",
                "payment_terms": "שוטף+60"
            },
            {
                "name": "דניה סיבוס בע״מ",
                "vat_id": "510567890",
                "contact_name": "רוני ברק",
                "phone": "04-8111111",
                "email": "roni@danya.co.il",
                "address": "שדרות ירושלים 1, חיפה",
                "payment_terms": "שוטף+45"
            },
            {
                "name": "משה רזי בניה בע״מ",
                "vat_id": "510678901",
                "contact_name": "משה רזי",
                "phone": "050-7777777",
                "email": "moshe@razi-bina.co.il",
                "address": "רחוב הפרחים 12, נתניה",
                "payment_terms": "שוטף+30"
            }
        ]
        
        customers = []
        for c_data in customers_data:
            customer = Customer(org_id=org_id, **c_data)
            db.add(customer)
            db.flush()
            customers.append(customer)
            print(f"  ✅ {customer.name}")
        
        # === SITES ===
        print("\n🏗️ Creating sites (projects)...")
        sites_data = [
            # עזריאלי
            {"customer_id": customers[0].id, "name": "מגדלי עזריאלי - ראשון לציון", "address": "שדרות ירושלים 1, ראשון לציון", "lat": 31.9665, "lng": 34.8059},
            {"customer_id": customers[0].id, "name": "עזריאלי הרצליה", "address": "רחוב הנדיב 1, הרצליה פיתוח", "lat": 32.1656, "lng": 34.8138},
            {"customer_id": customers[0].id, "name": "עזריאלי חולון", "address": "רחוב סוקולוב 88, חולון", "lat": 32.0114, "lng": 34.7755},
            
            # סולל בונה
            {"customer_id": customers[1].id, "name": "פרויקט רמת אביב ג׳", "address": "רחוב אינשטיין 12, תל אביב", "lat": 32.1143, "lng": 34.7981},
            {"customer_id": customers[1].id, "name": "כביש 531 - הרחבה", "address": "כביש 531, צומת בית דגן", "lat": 32.0008, "lng": 34.8253},
            {"customer_id": customers[1].id, "name": "מנהרות הכרמל", "address": "כביש 4, חיפה", "lat": 32.8156, "lng": 34.9892},
            
            # אפריקה ישראל
            {"customer_id": customers[2].id, "name": "פארק ראשונים", "address": "שדרות הנשיא 100, ראשון לציון", "lat": 31.9646, "lng": 34.8077},
            {"customer_id": customers[2].id, "name": "פרויקט בית שמש", "address": "רחוב הרב קוק 55, בית שמש", "lat": 31.7464, "lng": 34.9885},
            
            # אלקטרה
            {"customer_id": customers[3].id, "name": "פרויקט נתניה מערב", "address": "רחוב ויצמן 200, נתניה", "lat": 32.3294, "lng": 34.8513},
            {"customer_id": customers[3].id, "name": "גני תקווה - יוקרה", "address": "רחוב הגבורה 7, גני תקווה", "lat": 32.0589, "lng": 34.8722},
            
            # דניה סיבוס
            {"customer_id": customers[4].id, "name": "מסילת הכרמלית", "address": "שדרות הנשיא, חיפה", "lat": 32.8156, "lng": 35.0649},
            {"customer_id": customers[4].id, "name": "כביש חוצה ישראל - קטע 18", "address": "כביש 6, צומת סוקולוב", "lat": 32.3515, "lng": 34.9292},
            
            # משה רזי
            {"customer_id": customers[5].id, "name": "שכונת פארק המדע", "address": "רחוב העצמאות 88, נתניה", "lat": 32.3215, "lng": 34.8532},
            {"customer_id": customers[5].id, "name": "פרויקט קיסריה", "address": "אזור תעשייה, קיסריה", "lat": 32.5046, "lng": 34.8969},
            
            # מקורות חומרים (משותפים)
            {"customer_id": customers[0].id, "name": "מחצבת נשר רמלה", "address": "אזור תעשייה נשר, רמלה", "lat": 31.9196, "lng": 34.8719},
            {"customer_id": customers[0].id, "name": "מחצבת ראש העין", "address": "ליד צומת ראש העין", "lat": 32.0957, "lng": 34.9593},
            {"customer_id": customers[0].id, "name": "מחצבת חדרה", "address": "אזור תעשייה חדרה דרום", "lat": 32.4339, "lng": 34.9168},
            
            # יעדי פינוי
            {"customer_id": customers[0].id, "name": "מזבלה אריאל", "address": "אזור תעשייה אריאל", "lat": 32.1069, "lng": 35.1808},
            {"customer_id": customers[0].id, "name": "מתקן מיחזור דודאים", "address": "צומת דודאים", "lat": 31.5606, "lng": 34.7394},
        ]
        
        sites = []
        for s_data in sites_data:
            site = Site(org_id=org_id, is_active=True, **s_data)
            db.add(site)
            db.flush()
            sites.append(site)
            print(f"  ✅ {site.name[:50]}")
        
        # === MATERIALS ===
        print("\n🪨 Creating materials...")
        materials_data = [
            {"name": "עפר", "name_hebrew": "עפר", "billing_unit": BillingUnit.TON, "is_active": True},
            {"name": "חצץ", "name_hebrew": "חצץ", "billing_unit": BillingUnit.TON, "is_active": True},
            {"name": "מצע", "name_hebrew": "מצע", "billing_unit": BillingUnit.TON, "is_active": True},
            {"name": "חול", "name_hebrew": "חול", "billing_unit": BillingUnit.M3, "is_active": True},
            {"name": "פסולת בניין", "name_hebrew": "פסולת בניין", "billing_unit": BillingUnit.TON, "is_active": True},
            {"name": "אספלט", "name_hebrew": "אספלט", "billing_unit": BillingUnit.TON, "is_active": True},
            {"name": "בטון", "name_hebrew": "בטון", "billing_unit": BillingUnit.M3, "is_active": True},
            {"name": "חומר מילוי", "name_hebrew": "חומר מילוי", "billing_unit": BillingUnit.M3, "is_active": True},
        ]
        
        materials = []
        for m_data in materials_data:
            material = Material(org_id=org_id, **m_data)
            db.add(material)
            db.flush()
            materials.append(material)
            print(f"  ✅ {material.name_hebrew}")
        
        # === TRUCKS ===
        print("\n🚛 Creating trucks...")
        trucks_data = [
            {"plate_number": "12-345-67", "model": "וולוו FH16", "capacity_ton": Decimal("30"), "capacity_m3": Decimal("20"), "is_active": True},
            {"plate_number": "23-456-78", "model": "מרצדס אקטרוס 2551", "capacity_ton": Decimal("28"), "capacity_m3": Decimal("18"), "is_active": True},
            {"plate_number": "34-567-89", "model": "סקניה R500", "capacity_ton": Decimal("32"), "capacity_m3": Decimal("22"), "is_active": True},
            {"plate_number": "45-678-90", "model": "מאן TGX 33.480", "capacity_ton": Decimal("29"), "capacity_m3": Decimal("19"), "is_active": True},
            {"plate_number": "56-789-01", "model": "איווקו סטרליס 410", "capacity_ton": Decimal("27"), "capacity_m3": Decimal("17"), "is_active": True},
            {"plate_number": "67-890-12", "model": "וולוו FM 420", "capacity_ton": Decimal("26"), "capacity_m3": Decimal("16"), "is_active": True},
            {"plate_number": "78-901-23", "model": "מרצדס ארוקס 3340", "capacity_ton": Decimal("31"), "capacity_m3": Decimal("21"), "is_active": True},
            {"plate_number": "89-012-34", "model": "סקניה G450", "capacity_ton": Decimal("28"), "capacity_m3": Decimal("18"), "is_active": True},
            {"plate_number": "90-123-45", "model": "מאן TGS 35.400", "capacity_ton": Decimal("30"), "capacity_m3": Decimal("20"), "is_active": True},
            {"plate_number": "01-234-56", "model": "איווקו טרקר 450", "capacity_ton": Decimal("29"), "capacity_m3": Decimal("19"), "is_active": True},
        ]
        
        trucks = []
        for t_data in trucks_data:
            truck = Truck(org_id=org_id, **t_data)
            db.add(truck)
            db.flush()
            trucks.append(truck)
            print(f"  ✅ {truck.plate_number} - {truck.model}")
        
        # === DRIVERS ===
        print("\n👨‍✈️ Creating drivers...")
        drivers_data = [
            {"name": "משה כהן", "phone": "050-1111111", "email": "moshe@demo.com", "password": "driver123"},
            {"name": "דוד לוי", "phone": "052-2222222", "email": "david@demo.com", "password": "driver123"},
            {"name": "יוסי אברהם", "phone": "053-3333333", "email": "yossi@demo.com", "password": "driver123"},
            {"name": "אבי שמש", "phone": "054-4444444", "email": "avi@demo.com", "password": "driver123"},
            {"name": "רוני ברק", "phone": "055-5555555", "email": "roni@demo.com", "password": "driver123"},
            {"name": "אלי גבאי", "phone": "050-6666666", "email": "eli@demo.com", "password": "driver123"},
            {"name": "שלומי דהן", "phone": "052-7777777", "email": "shlomi@demo.com", "password": "driver123"},
            {"name": "ניר מזרחי", "phone": "053-8888888", "email": "nir@demo.com", "password": "driver123"},
            {"name": "אורי פרץ", "phone": "054-9999999", "email": "uri@demo.com", "password": "driver123"},
            {"name": "גיא אזולאי", "phone": "055-0000000", "email": "guy@demo.com", "password": "driver123"},
        ]
        
        drivers = []
        for d_data in drivers_data:
            user = User(
                org_id=org_id,
                name=d_data["name"],
                email=d_data["email"],
                phone=d_data["phone"],
                password_hash=get_password_hash(d_data["password"]),
                is_active=True
            )
            db.add(user)
            db.flush()
            
            role = UserRoleModel(
                org_id=org_id,
                user_id=user.id,
                role=UserRole.DRIVER
            )
            db.add(role)
            db.flush()
            
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
            drivers.append(driver)
            print(f"  ✅ {driver.name}")
        
        # === PRICE LISTS ===
        print("\n💰 Creating price lists...")
        price_lists_data = [
            # עזריאלי - מחירים מיוחדים
            {"customer_id": customers[0].id, "material_id": materials[0].id, "unit": "TON", "base_price": Decimal("120"), "min_charge": Decimal("2000"), "wait_fee_per_hour": Decimal("150"), "valid_from": date(2024, 1, 1)},
            {"customer_id": customers[0].id, "material_id": materials[1].id, "unit": "TON", "base_price": Decimal("135"), "min_charge": Decimal("2200"), "valid_from": date(2024, 1, 1)},
            
            # סולל בונה
            {"customer_id": customers[1].id, "material_id": materials[0].id, "unit": "TON", "base_price": Decimal("115"), "min_charge": Decimal("1800"), "wait_fee_per_hour": Decimal("120"), "valid_from": date(2024, 1, 1)},
            {"customer_id": customers[1].id, "material_id": materials[2].id, "unit": "TON", "base_price": Decimal("125"), "valid_from": date(2024, 1, 1)},
            
            # מחירים כלליים (ללא לקוח ספציפי)
            {"customer_id": None, "material_id": materials[0].id, "unit": "TON", "base_price": Decimal("130"), "min_charge": Decimal("2000"), "valid_from": date(2024, 1, 1)},
            {"customer_id": None, "material_id": materials[1].id, "unit": "TON", "base_price": Decimal("140"), "min_charge": Decimal("2200"), "valid_from": date(2024, 1, 1)},
            {"customer_id": None, "material_id": materials[2].id, "unit": "TON", "base_price": Decimal("135"), "min_charge": Decimal("2100"), "valid_from": date(2024, 1, 1)},
            {"customer_id": None, "material_id": materials[3].id, "unit": "M3", "base_price": Decimal("85"), "min_charge": Decimal("1500"), "valid_from": date(2024, 1, 1)},
            {"customer_id": None, "material_id": materials[4].id, "unit": "TON", "base_price": Decimal("95"), "valid_from": date(2024, 1, 1)},
            {"customer_id": None, "material_id": materials[5].id, "unit": "TON", "base_price": Decimal("160"), "valid_from": date(2024, 1, 1)},
        ]
        
        for pl_data in price_lists_data:
            price_list = PriceList(org_id=org_id, **pl_data)
            db.add(price_list)
        db.flush()
        print(f"  ✅ Created {len(price_lists_data)} price lists")
        
        # === JOBS ===
        print("\n📦 Creating jobs (varied statuses across dates)...")
        
        today = date.today()
        jobs_count = 0
        
        # סטטוסים שונים להדגמה
        statuses = ["PLANNED", "ASSIGNED", "ENROUTE_PICKUP", "LOADED", "ENROUTE_DROPOFF", "DELIVERED", "CLOSED"]
        
        # יצירת נסיעות ל-30 ימים אחרונים
        for days_ago in range(30, -1, -1):
            job_date = today - timedelta(days=days_ago)
            num_jobs = 3 if days_ago < 7 else 2  # יותר נסיעות בשבוע האחרון
            
            for i in range(num_jobs):
                # בחירת סטטוס לפי תאריך
                if days_ago > 7:
                    status = "CLOSED"
                elif days_ago > 2:
                    status = "DELIVERED"
                elif days_ago == 1:
                    status = statuses[i % len(statuses)]
                elif days_ago == 0:  # היום
                    status = statuses[i % (len(statuses) - 1)]  # ללא CLOSED
                else:
                    status = "PLANNED"
                
                customer = customers[i % len(customers)]
                material = materials[i % len(materials)]
                driver = drivers[i % len(drivers)]
                truck = trucks[i % len(trucks)]
                
                # בחירת אתרים - מקור ויעד
                from_site = sites[14 + (i % 3)]  # מחצבות
                to_site = sites[i % 14]  # פרויקטים
                
                qty = Decimal(str(20 + (i * 5)))
                unit = material.billing_unit.value
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    planned_qty=qty,
                    actual_qty=qty if status in ["DELIVERED", "CLOSED"] else None,
                    unit=unit,
                    driver_id=driver.id,
                    truck_id=truck.id,
                    scheduled_date=job_date,
                    status=status,
                    priority=1,
                    pricing_total=qty * Decimal("120") if status in ["DELIVERED", "CLOSED"] else None
                )
                db.add(job)
                db.flush()
                
                # הוספת אירועי סטטוס
                if status != "PLANNED":
                    event = JobStatusEvent(
                        org_id=org_id,
                        job_id=job.id,
                        status=status,
                        event_time=datetime.combine(job_date, datetime.min.time()) + timedelta(hours=8 + i),
                        user_id=admin.id
                    )
                    db.add(event)
                
                # Note: תעודות משלוח דורשות חתימה - נדלג על זה ב-DEMO
                # במציאות יהיה קובץ חתימה ממובייל
                
                jobs_count += 1
        
        db.flush()
        print(f"  ✅ Created {jobs_count} jobs with varied statuses")
        
        # === STATEMENTS & PAYMENTS ===
        print("\n🧾 Creating statements and payments...")
        
        # יצירת חשבוניות לחודש שעבר
        last_month = today.replace(day=1) - timedelta(days=1)
        month_start = last_month.replace(day=1)
        month_end = last_month
        
        statements_count = 0
        for customer in customers[:3]:  # 3 לקוחות ראשונים
            # מצא נסיעות שהסתיימו בחודש שעבר
            delivered_jobs = db.query(Job).filter(
                Job.org_id == org_id,
                Job.customer_id == customer.id,
                Job.status.in_(["DELIVERED", "CLOSED"]),
                Job.scheduled_date >= month_start,
                Job.scheduled_date <= month_end
            ).all()
            
            if not delivered_jobs:
                continue
            
            # יצירת חשבונית
            subtotal = sum(j.pricing_total or Decimal("0") for j in delivered_jobs)
            tax = subtotal * Decimal("0.17")
            total = subtotal + tax
            
            statement = Statement(
                org_id=org_id,
                customer_id=customer.id,
                period_from=month_start,
                period_to=month_end,
                number=f"ST-{statements_count + 1:06d}",
                status=StatementStatus.SENT if statements_count < 2 else StatementStatus.PAID,
                subtotal=subtotal,
                tax=tax,
                total=total,
                created_by=admin.id
            )
            db.add(statement)
            db.flush()
            
            # שורות חשבונית
            for job in delivered_jobs:
                line = StatementLine(
                    org_id=org_id,
                    statement_id=statement.id,
                    job_id=job.id,
                    description=f"הובלת {job.material.name_hebrew} מ-{job.from_site.name[:20]} ל-{job.to_site.name[:20]}",
                    qty=job.actual_qty or job.planned_qty,
                    unit_price=Decimal("120"),
                    total=job.pricing_total or Decimal("0")
                )
                db.add(line)
            
            # תשלום אם החשבונית שולמה
            if statement.status == StatementStatus.PAID:
                payment = Payment(
                    org_id=org_id,
                    customer_id=customer.id,
                    amount=total,
                    paid_at=month_end + timedelta(days=30),
                    method="העברה בנקאית",
                    reference=f"REF-{statements_count + 1:04d}",
                    created_by=admin.id
                )
                db.add(payment)
                db.flush()
                
                allocation = PaymentAllocation(
                    org_id=org_id,
                    payment_id=payment.id,
                    statement_id=statement.id,
                    amount=total
                )
                db.add(allocation)
            
            statements_count += 1
            print(f"  ✅ Statement for {customer.name}: ₪{total:,.2f}")
        
        db.commit()
        
        # === SUMMARY ===
        print("\n" + "="*60)
        print("✅ DEMO Organization Created Successfully!")
        print("="*60)
        
        print("\n📊 Summary:")
        print(f"  🏢 Organization: {org.display_name}")
        print(f"     Slug: {org.slug}")
        print(f"     ID: {org.id}")
        print(f"\n  📋 {len(customers)} Customers")
        print(f"  🏗️  {len(sites)} Sites/Projects")
        print(f"  🪨 {len(materials)} Materials")
        print(f"  🚛 {len(trucks)} Trucks")
        print(f"  👨‍✈️ {len(drivers)} Drivers")
        print(f"  📦 {jobs_count} Jobs (across 30 days)")
        print(f"  🧾 {statements_count} Statements")
        print(f"  💰 {len(price_lists_data)} Price Lists")
        
        print("\n🔐 Login Credentials:")
        print(f"  Admin: demo@demo.com / demo123")
        print(f"\n  Drivers (all use password: driver123):")
        for d in drivers_data[:5]:
            print(f"    • {d['name']}: {d['email']}")
        print(f"    • ... and {len(drivers_data) - 5} more drivers")
        
        print("\n💡 Tips:")
        print("  • Use Super Admin to switch to this DEMO organization")
        print("  • Jobs span last 30 days with varied statuses")
        print("  • Some statements are PAID, some are SENT (pending)")
        print("  • Price lists include both customer-specific and general pricing")
        
        print("\n✨ Ready for client demos!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_demo_organization()
