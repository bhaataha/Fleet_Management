"""
Create COMPLETE DEMO Data for Testing
סקריפט יצירת נתוני דמו מלאים למערכת

כולל:
- ארגון (Organization)
- משתמשים (Users)
- לקוחות (Customers)
- אתרים (Sites)
- נהגים (Drivers)
- משאיות (Trucks)
- קבלני משנה (Subcontractors)
- חומרים (Materials)
- מחירונים (Price Lists)
- נסיעות (Jobs)
- תעודות משלוח (Delivery Notes)
- חשבוניות (Statements)
- תשלומים (Payments)

הרצה:
docker exec fleet_backend python scripts/create_full_demo_data.py

או מתוך הקונטיינר:
docker exec -it fleet_backend bash
cd /app
python scripts/create_full_demo_data.py
"""
import sys
sys.path.insert(0, '/app')

from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import uuid4
import random
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Organization, User, UserRoleModel, UserRole,
    Customer, Site, Material, Driver, Truck, Trailer,
    Job, JobStatus, BillingUnit, 
    PriceList, Statement, StatementLine, Payment, PaymentAllocation,
    JobStatusEvent, DeliveryNote, StatementStatus,
    Subcontractor, SubcontractorPriceList
)


def delete_existing_demo():
    """מחיקת נתוני דמו קיימים"""
    db = SessionLocal()
    try:
        print("\n🗑️  מחיקת נתוני דמו קיימים...")
        
        # בדיקה אם קיים ארגון דמו
        org = db.query(Organization).filter(Organization.slug == "demo").first()
        if org:
            print(f"   ➤ מוחק ארגון דמו: {org.name} (ID: {org.id})")
            
            # מחיקה ישירה מ-DB (ע"י SQL) במקום דרך SQLAlchemy
            # כדי למנוע בעיות עם CASCADE
            from sqlalchemy import text
            
            db.execute(text("DELETE FROM statement_lines WHERE statement_id IN (SELECT id FROM statements WHERE org_id = :org_id)"), {"org_id": org.id})
            db.execute(text("DELETE FROM payment_allocations WHERE payment_id IN (SELECT id FROM payments WHERE org_id = :org_id)"), {"org_id": org.id})
            db.execute(text("DELETE FROM payments WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM statements WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM job_status_events WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM delivery_notes WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM job_files WHERE job_id IN (SELECT id FROM jobs WHERE org_id = :org_id)"), {"org_id": org.id})
            db.execute(text("DELETE FROM jobs WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM subcontractor_price_lists WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM subcontractors WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM price_lists WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM trucks WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM trailers WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM drivers WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM materials WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM sites WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM customers WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM user_roles WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM users WHERE org_id = :org_id"), {"org_id": org.id})
            db.execute(text("DELETE FROM organizations WHERE id = :org_id"), {"org_id": org.id})
            
            db.commit()
            print("   ✅ נתוני דמו קיימים נמחקו")
        else:
            print("   ℹ️  לא נמצאו נתוני דמו קיימים")
            
    finally:
        db.close()


def create_organization():
    """יצירת ארגון דמו"""
    db = SessionLocal()
    try:
        print("\n🏢 יצירת ארגון דמו...")
        
        org = Organization(
            id=uuid4(),
            name="חברת הובלות עפר דמו",
            slug="demo",
            display_name="🚛 דמו - הובלות עפר ישראל",
            contact_name="דוד כהן",
            contact_email="demo@demo.com",
            contact_phone="050-1234567",
            vat_id="512345678",
            address="רחוב התעשייה 123",
            city="תל אביב",
            postal_code="6107101",
            country="ISR",
            plan_type="professional",
            plan_start_date=date.today() - timedelta(days=90),
            trial_ends_at=None,
            max_trucks=50,
            max_drivers=50,
            max_storage_gb=100,
            timezone="Asia/Jerusalem",
            locale="he",
            currency="ILS",
            status="active",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        
        print(f"   ✅ ארגון נוצר: {org.name}")
        print(f"      ID: {org.id}")
        
        return org
        
    finally:
        db.close()


def create_users(org_id):
    """יצירת משתמשים"""
    db = SessionLocal()
    try:
        print("\n👥 יצירת משתמשים...")
        
        users_data = [
            {
                "name": "דמו אדמין",
                "email": "demo@demo.com",
                "phone": "050-1111111",
                "password": "demo123",
                "org_role": "admin",
                "is_super_admin": False
            },
            {
                "name": "סדרן ראשי",
                "email": "dispatcher@demo.com",
                "phone": "050-2222222",
                "password": "demo123",
                "org_role": "dispatcher",
                "is_super_admin": False
            },
            {
                "name": "הנהלת חשבונות",
                "email": "accounting@demo.com",
                "phone": "050-3333333",
                "password": "demo123",
                "org_role": "accounting",
                "is_super_admin": False
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user = User(
                org_id=org_id,
                name=user_data["name"],
                email=user_data["email"],
                phone=user_data["phone"],
                password_hash=get_password_hash(user_data["password"]),
                org_role=user_data["org_role"],
                is_super_admin=user_data["is_super_admin"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(user)
            created_users.append(user)
            print(f"   ✅ משתמש: {user.name} ({user.email})")
        
        db.commit()
        return created_users
        
    finally:
        db.close()


def create_customers(org_id):
    """יצירת לקוחות"""
    db = SessionLocal()
    try:
        print("\n🏭 יצירת לקוחות...")
        
        customers_data = [
            {
                "name": "חברת בנייה ישראל בע\"מ",
                "vat_id": "512222222",
                "contact_name": "משה לוי",
                "phone": "03-5551111",
                "email": "moshe@build-il.co.il",
                "address": "רחוב הבנאים 45, תל אביב",
                "payment_terms": "שוטף+60"
            },
            {
                "name": "פרויקטים בירושלים בע\"מ",
                "vat_id": "512333333",
                "contact_name": "יוסי כהן",
                "phone": "02-6662222",
                "email": "yossi@jerusalem-proj.co.il",
                "address": "רחוב יפו 123, ירושלים",
                "payment_terms": "שוטף+30"
            },
            {
                "name": "בונים את הצפון בע\"מ",
                "vat_id": "512444444",
                "contact_name": "דוד אברהם",
                "phone": "04-8883333",
                "email": "david@north-build.co.il",
                "address": "שדרות בן גוריון 78, חיפה",
                "payment_terms": "שוטף+45"
            },
            {
                "name": "תשתיות דרום בע\"מ",
                "vat_id": "512555555",
                "contact_name": "רחל מזרחי",
                "phone": "08-6664444",
                "email": "rachel@south-infra.co.il",
                "address": "רחוב הרצל 56, באר שבע",
                "payment_terms": "שוטף+60"
            },
            {
                "name": "קבוצת אלקטרה",
                "vat_id": "512666666",
                "contact_name": "אבי שלום",
                "phone": "03-7775555",
                "email": "avi@electra-group.co.il",
                "address": "רחוב דרך השלום 234, תל אביב",
                "payment_terms": "שוטף+90"
            }
        ]
        
        customers = []
        for cust_data in customers_data:
            customer = Customer(
                org_id=org_id,
                **cust_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(customer)
            customers.append(customer)
            print(f"   ✅ לקוח: {customer.name}")
        
        db.commit()
        for c in customers:
            db.refresh(c)
        
        return customers
        
    finally:
        db.close()


def create_sites(org_id, customers):
    """יצירת אתרים"""
    db = SessionLocal()
    try:
        print("\n📍 יצירת אתרים...")
        
        # אתרים כלליים (מחצבות, מזבלות)
        generic_sites = [
            {
                "name": "מחצבת אבן חיפה",
                "address": "כביש 75, חיפה",
                "lat": Decimal("32.7940"),
                "lng": Decimal("35.0489"),
                "site_type": "general",
                "is_generic": True,
                "opening_hours": "06:00-18:00",
                "access_notes": "כניסה משער צפון, נדרש אישור מראש",
                "contact_name": "יוסי כהן",
                "contact_phone": "04-8881234"
            },
            {
                "name": "מחצבת נשר רמלה",
                "address": "אזור תעשייה רמלה",
                "lat": Decimal("31.9293"),
                "lng": Decimal("34.8611"),
                "site_type": "general",
                "is_generic": True,
                "opening_hours": "05:00-17:00",
                "access_notes": "שער ראשי, דרישה לתיאום מראש",
                "contact_name": "דני לוי",
                "contact_phone": "08-9251234"
            },
            {
                "name": "מזבלת אריאל",
                "address": "אזור תעשייה אריאל",
                "lat": Decimal("32.1058"),
                "lng": Decimal("35.1827"),
                "site_type": "general",
                "is_generic": True,
                "opening_hours": "06:00-16:00",
                "access_notes": "שער דרומי, נדרש תו חניה",
                "contact_name": "משה אברהם",
                "contact_phone": "03-9361234"
            },
            {
                "name": "מחצבת הר הכרמל",
                "address": "הר הכרמל, חיפה",
                "lat": Decimal("32.7666"),
                "lng": Decimal("34.9864"),
                "site_type": "general",
                "is_generic": True,
                "opening_hours": "07:00-17:00",
                "access_notes": "דרך עפר, מומלץ ג'יפ",
                "contact_name": "רון כהן",
                "contact_phone": "04-8242345"
            }
        ]
        
        sites = []
        for site_data in generic_sites:
            site = Site(
                org_id=org_id,
                customer_id=None,
                **site_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(site)
            sites.append(site)
            print(f"   ✅ אתר כללי: {site.name}")
        
        # אתרי לקוחות (פרויקטים)
        customer_sites = [
            # לקוח 1 - חברת בנייה ישראל
            {
                "customer": customers[0],
                "name": "פרויקט מגדלי תל אביב",
                "address": "רחוב ארלוזורוב 234, תל אביב",
                "lat": Decimal("32.0928"),
                "lng": Decimal("34.7806"),
                "site_type": "customer_project",
                "opening_hours": "07:00-17:00",
                "access_notes": "כניסה דרך שער אחורי",
                "contact_name": "משה לוי",
                "contact_phone": "050-1234567"
            },
            {
                "customer": customers[0],
                "name": "פרויקט שכונת הדר",
                "address": "הדר, חיפה",
                "lat": Decimal("32.8050"),
                "lng": Decimal("34.9899"),
                "site_type": "customer_project",
                "opening_hours": "06:00-18:00",
                "access_notes": "חניה בתיאום מראש",
                "contact_name": "משה לוי",
                "contact_phone": "050-1234567"
            },
            # לקוח 2 - פרויקטים בירושלים
            {
                "customer": customers[1],
                "name": "פרויקט רובע חדש",
                "address": "גבעת שאול, ירושלים",
                "lat": Decimal("31.7964"),
                "lng": Decimal("35.1838"),
                "site_type": "customer_project",
                "opening_hours": "07:00-16:00",
                "access_notes": "דרישה לאישור ביטחוני",
                "contact_name": "יוסי כהן",
                "contact_phone": "050-2345678"
            },
            # לקוח 3 - בונים את הצפון
            {
                "customer": customers[2],
                "name": "כביש 6 צפון - קטע א׳",
                "address": "כביש 6 סמוך לצומת עכו",
                "lat": Decimal("32.9281"),
                "lng": Decimal("35.0816"),
                "site_type": "customer_project",
                "opening_hours": "06:00-18:00",
                "access_notes": "כניסה ליד קילומטר 89",
                "contact_name": "דוד אברהם",
                "contact_phone": "050-3456789"
            },
            # לקוח 4 - תשתיות דרום
            {
                "customer": customers[3],
                "name": "תחנת רכבת באר שבע מזרח",
                "address": "באר שבע מזרח",
                "lat": Decimal("31.2422"),
                "lng": Decimal("34.8104"),
                "site_type": "customer_project",
                "opening_hours": "05:00-17:00",
                "access_notes": "תיאום עם מנהל הפרויקט",
                "contact_name": "רחל מזרחי",
                "contact_phone": "050-4567890"
            }
        ]
        
        for site_data in customer_sites:
            customer = site_data.pop("customer")
            site = Site(
                org_id=org_id,
                customer_id=customer.id,
                is_generic=False,
                **site_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(site)
            sites.append(site)
            print(f"   ✅ אתר לקוח: {site.name} ({customer.name})")
        
        db.commit()
        for s in sites:
            db.refresh(s)
        
        return sites
        
    finally:
        db.close()


def create_materials(org_id):
    """יצירת חומרים"""
    db = SessionLocal()
    try:
        print("\n🪨 יצירת חומרים...")
        
        materials_data = [
            {"name": "עפר חפור", "name_hebrew": "עפר חפור", "billing_unit": BillingUnit.TON, "density": Decimal("1.6")},
            {"name": "חצץ 0-4", "name_hebrew": "חצץ 0-4", "billing_unit": BillingUnit.TON, "density": Decimal("1.7")},
            {"name": "חצץ 4-16", "name_hebrew": "חצץ 4-16", "billing_unit": BillingUnit.TON, "density": Decimal("1.65")},
            {"name": "מצע סוג א'", "name_hebrew": "מצע סוג א'", "billing_unit": BillingUnit.M3, "density": Decimal("1.8")},
            {"name": "חול בנייה", "name_hebrew": "חול בנייה", "billing_unit": BillingUnit.M3, "density": Decimal("1.5")},
            {"name": "אספלט", "name_hebrew": "אספלט", "billing_unit": BillingUnit.TON, "density": Decimal("2.3")},
            {"name": "פסולת בניין", "name_hebrew": "פסולת בניין", "billing_unit": BillingUnit.M3, "density": Decimal("1.4")},
            {"name": "אבן מתפוררת", "name_hebrew": "אבן מתפוררת", "billing_unit": BillingUnit.TON, "density": Decimal("1.75")}
        ]
        
        materials = []
        for mat_data in materials_data:
            material = Material(
                org_id=org_id,
                **mat_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(material)
            materials.append(material)
            print(f"   ✅ חומר: {material.name} ({material.billing_unit.value})")
        
        db.commit()
        for m in materials:
            db.refresh(m)
        
        return materials
        
    finally:
        db.close()


def create_drivers_and_users(org_id):
    """יצירת נהגים ומשתמשים"""
    db = SessionLocal()
    try:
        print("\n👨‍✈️ יצירת נהגים...")
        
        drivers_data = [
            {"name": "יוסי כהן", "phone": "050-7771111", "license_type": "C+E"},
            {"name": "משה לוי", "phone": "050-7772222", "license_type": "C+E"},
            {"name": "דוד אברהם", "phone": "050-7773333", "license_type": "C"},
            {"name": "שלמה בן דוד", "phone": "050-7774444", "license_type": "C+E"},
            {"name": "יעקב מזרחי", "phone": "050-7775555", "license_type": "C"},
            {"name": "אבי שלום", "phone": "050-7776666", "license_type": "C+E"},
            {"name": "רון כהן", "phone": "050-7777777", "license_type": "C"},
            {"name": "דני לוי", "phone": "050-7778888", "license_type": "C+E"}
        ]
        
        drivers = []
        for idx, driver_data in enumerate(drivers_data, 1):
            # יצירת משתמש לנהג
            user = User(
                org_id=org_id,
                name=driver_data["name"],
                email=f"driver{idx}@demo.com",
                phone=driver_data["phone"],
                password_hash=get_password_hash("demo123"),
                org_role="driver",
                is_super_admin=False,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.flush()  # כדי לקבל את ה-ID
            
            # יצירת נהג
            driver = Driver(
                org_id=org_id,
                user_id=user.id,
                name=driver_data["name"],
                phone=driver_data["phone"],
                license_type=driver_data["license_type"],
                license_expiry=datetime.utcnow() + timedelta(days=365*2),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(driver)
            drivers.append(driver)
            print(f"   ✅ נהג: {driver.name} ({driver.license_type})")
        
        db.commit()
        for d in drivers:
            db.refresh(d)
        
        return drivers
        
    finally:
        db.close()


def create_trucks(org_id, drivers):
    """יצירת משאיות"""
    db = SessionLocal()
    try:
        print("\n🚛 יצירת משאיות...")
        
        trucks_data = [
            {"plate": "12-345-67", "model": "וולוו FH16", "type": "פול טריילר", "cap_ton": 30, "cap_m3": 20},
            {"plate": "23-456-78", "model": "מרצדס אקטרוס", "type": "סמי טריילר", "cap_ton": 25, "cap_m3": 18},
            {"plate": "34-567-89", "model": "סקניה R450", "type": "פול טריילר", "cap_ton": 32, "cap_m3": 22},
            {"plate": "45-678-90", "model": "מאן TGX", "type": "סמי טריילר", "cap_ton": 28, "cap_m3": 19},
            {"plate": "56-789-01", "model": "איווקו סטרליס", "type": "פול טריילר", "cap_ton": 30, "cap_m3": 21},
            {"plate": "67-890-12", "model": "וולוו FM", "type": "דאבל", "cap_ton": 20, "cap_m3": 15},
            {"plate": "78-901-23", "model": "מרצדס ארוקס", "type": "סמי טריילר", "cap_ton": 26, "cap_m3": 17},
            {"plate": "89-012-34", "model": "סקניה P320", "type": "דאבל", "cap_ton": 18, "cap_m3": 14}
        ]
        
        trucks = []
        for idx, truck_data in enumerate(trucks_data):
            # שיוך נהג ראשי למשאית
            primary_driver = drivers[idx % len(drivers)]
            
            truck = Truck(
                org_id=org_id,
                plate_number=truck_data["plate"],
                model=truck_data["model"],
                truck_type=truck_data["type"],
                capacity_ton=Decimal(str(truck_data["cap_ton"])),
                capacity_m3=Decimal(str(truck_data["cap_m3"])),
                insurance_expiry=datetime.utcnow() + timedelta(days=180),
                test_expiry=datetime.utcnow() + timedelta(days=365),
                owner_type="COMPANY",
                primary_driver_id=primary_driver.id,
                secondary_driver_ids=[],
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(truck)
            trucks.append(truck)
            print(f"   ✅ משאית: {truck.plate_number} - {truck.model} (נהג: {primary_driver.name})")
        
        db.commit()
        for t in trucks:
            db.refresh(t)
        
        return trucks
        
    finally:
        db.close()


def create_subcontractors(org_id):
    """יצירת קבלני משנה"""
    db = SessionLocal()
    try:
        print("\n👷 יצירת קבלני משנה...")
        
        subcontractors_data = [
            {
                "name": "הובלות צפון בע\"מ",
                "company_name": "הובלות צפון בע\"מ",
                "vat_id": "513111111",
                "contact_person": "אבי נורדמן",
                "phone": "04-9991234",
                "email": "avi@north-haul.co.il",
                "truck_plate_number": "91-111-11",
                "payment_terms": "monthly",
                "notes": "קבלן אמין, זמין 24/7"
            },
            {
                "name": "משאיות דרום",
                "company_name": "משאיות דרום עצמאי",
                "vat_id": "513222222",
                "contact_person": "יוסי דרומי",
                "phone": "08-6551234",
                "email": "yossi@south-trucks.co.il",
                "truck_plate_number": "92-222-22",
                "payment_terms": "monthly",
                "notes": "התמחות בפסולת בניין"
            },
            {
                "name": "הובלות מרכז",
                "company_name": "הובלות מרכז בע\"מ",
                "vat_id": "513333333",
                "contact_person": "דני כהן",
                "phone": "03-5551234",
                "email": "danny@center-haul.co.il",
                "truck_plate_number": "93-333-33",
                "payment_terms": "monthly",
                "notes": "2 משאיות זמינות"
            }
        ]
        
        subcontractors = []
        for sub_data in subcontractors_data:
            subcontractor = Subcontractor(
                org_id=org_id,
                **sub_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(subcontractor)
            subcontractors.append(subcontractor)
            print(f"   ✅ קבלן משנה: {subcontractor.name} ({subcontractor.truck_plate_number})")
        
        db.commit()
        for s in subcontractors:
            db.refresh(s)
        
        return subcontractors
        
    finally:
        db.close()


def create_price_lists(org_id, customers, materials, sites):
    """יצירת מחירונים"""
    db = SessionLocal()
    try:
        print("\n💰 יצירת מחירונים...")
        
        # מחירון כללי (ללא לקוח ספציפי)
        general_prices = [
            # עפר חפור
            {"material": materials[0], "from_site": sites[0], "to_site": sites[4], "base_price": 120, "unit": BillingUnit.TON},
            {"material": materials[0], "from_site": sites[1], "to_site": sites[5], "base_price": 115, "unit": BillingUnit.TON},
            
            # חצץ
            {"material": materials[1], "from_site": sites[0], "to_site": sites[4], "base_price": 140, "unit": BillingUnit.TON},
            {"material": materials[2], "from_site": sites[1], "to_site": sites[5], "base_price": 145, "unit": BillingUnit.TON},
            
            # מצע
            {"material": materials[3], "from_site": sites[0], "to_site": sites[4], "base_price": 95, "unit": BillingUnit.M3},
            
            # חול
            {"material": materials[4], "from_site": sites[1], "to_site": sites[6], "base_price": 85, "unit": BillingUnit.M3},
            
            # אספלט
            {"material": materials[5], "from_site": sites[2], "to_site": sites[7], "base_price": 180, "unit": BillingUnit.TON}
        ]
        
        price_lists = []
        for price_data in general_prices:
            material = price_data["material"]
            from_site = price_data["from_site"]
            to_site = price_data["to_site"]
            
            price_list = PriceList(
                org_id=org_id,
                customer_id=None,  # מחיר כללי
                material_id=material.id,
                from_site_id=from_site.id if from_site else None,
                to_site_id=to_site.id if to_site else None,
                unit=price_data["unit"],
                base_price=Decimal(str(price_data["base_price"])),
                min_charge=Decimal("500"),
                trip_surcharge=Decimal("50"),
                wait_fee_per_hour=Decimal("100"),
                night_surcharge_pct=Decimal("20"),
                valid_from=datetime.utcnow() - timedelta(days=30),
                valid_to=None,
                created_at=datetime.utcnow()
            )
            db.add(price_list)
            price_lists.append(price_list)
            print(f"   ✅ מחיר כללי: {material.name} - {from_site.name if from_site else 'כללי'} → {to_site.name if to_site else 'כללי'} = ₪{price_data['base_price']}/{price_data['unit'].value}")
        
        # מחירונים ללקוחות ספציפיים (מחיר מיוחד)
        customer_prices = [
            # לקוח 1 - הנחה של 10%
            {"customer": customers[0], "material": materials[0], "from_site": sites[0], "to_site": sites[4], "base_price": 108, "unit": BillingUnit.TON},
            {"customer": customers[0], "material": materials[1], "from_site": sites[0], "to_site": sites[4], "base_price": 126, "unit": BillingUnit.TON},
            
            # לקוח 2 - הנחה של 5%
            {"customer": customers[1], "material": materials[0], "from_site": sites[1], "to_site": sites[6], "base_price": 109, "unit": BillingUnit.TON},
            
            # לקוח 3 - מחיר מיוחד לכמויות גדולות
            {"customer": customers[2], "material": materials[3], "from_site": sites[0], "to_site": sites[7], "base_price": 88, "unit": BillingUnit.M3}
        ]
        
        for price_data in customer_prices:
            customer = price_data["customer"]
            material = price_data["material"]
            from_site = price_data.get("from_site")
            to_site = price_data.get("to_site")
            
            price_list = PriceList(
                org_id=org_id,
                customer_id=customer.id,
                material_id=material.id,
                from_site_id=from_site.id if from_site else None,
                to_site_id=to_site.id if to_site else None,
                unit=price_data["unit"],
                base_price=Decimal(str(price_data["base_price"])),
                min_charge=Decimal("450"),
                trip_surcharge=Decimal("40"),
                wait_fee_per_hour=Decimal("90"),
                night_surcharge_pct=Decimal("15"),
                valid_from=datetime.utcnow() - timedelta(days=30),
                valid_to=None,
                created_at=datetime.utcnow()
            )
            db.add(price_list)
            price_lists.append(price_list)
            print(f"   ✅ מחיר ללקוח {customer.name}: {material.name} = ₪{price_data['base_price']}/{price_data['unit'].value}")
        
        db.commit()
        return price_lists
        
    finally:
        db.close()


def create_subcontractor_price_lists(org_id, subcontractors, materials):
    """יצירת מחירוני קבלני משנה"""
    db = SessionLocal()
    try:
        print("\n💵 יצירת מחירוני קבלני משנה...")
        
        sub_prices = []
        
        # קבלן 1 - מחירים לטון
        sub_prices.append({
            "subcontractor": subcontractors[0],
            "material": materials[0],
            "price_per_ton": 80,
            "price_per_trip": 600
        })
        
        # קבלן 2 - מחירים למ"ק
        sub_prices.append({
            "subcontractor": subcontractors[1],
            "material": materials[3],
            "price_per_m3": 65,
            "price_per_trip": 550
        })
        
        # קבלן 3 - מחירים לנסיעה
        sub_prices.append({
            "subcontractor": subcontractors[2],
            "material": materials[4],
            "price_per_trip": 500,
            "price_per_ton": 75
        })
        
        price_lists = []
        for price_data in sub_prices:
            subcontractor = price_data["subcontractor"]
            material = price_data.get("material")
            
            price_list = SubcontractorPriceList(
                org_id=org_id,
                subcontractor_id=subcontractor.id,
                material_id=material.id if material else None,
                price_per_trip=Decimal(str(price_data.get("price_per_trip", 0))) if price_data.get("price_per_trip") else None,
                price_per_ton=Decimal(str(price_data.get("price_per_ton", 0))) if price_data.get("price_per_ton") else None,
                price_per_m3=Decimal(str(price_data.get("price_per_m3", 0))) if price_data.get("price_per_m3") else None,
                min_charge=Decimal("400"),
                valid_from=datetime.utcnow() - timedelta(days=30),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(price_list)
            price_lists.append(price_list)
            
            price_str = []
            if price_data.get("price_per_ton"):
                price_str.append(f"₪{price_data['price_per_ton']}/טון")
            if price_data.get("price_per_m3"):
                price_str.append(f"₪{price_data['price_per_m3']}/מ\"ק")
            if price_data.get("price_per_trip"):
                price_str.append(f"₪{price_data['price_per_trip']}/נסיעה")
            
            print(f"   ✅ מחירון קבלן {subcontractor.name}: {', '.join(price_str)}")
        
        db.commit()
        return price_lists
        
    finally:
        db.close()


def create_jobs(org_id, customers, sites, materials, drivers, trucks, subcontractors):
    """יצירת נסיעות"""
    db = SessionLocal()
    try:
        print("\n🚚 יצירת נסיעות...")
        
        jobs = []
        
        # נסיעות עבר (30 ימים אחרונים)
        for day_offset in range(30, 0, -1):
            job_date = datetime.utcnow() - timedelta(days=day_offset)
            
            # 3-8 נסיעות ביום
            num_jobs = random.randint(3, 8)
            
            for _ in range(num_jobs):
                customer = random.choice(customers)
                material = random.choice(materials[:6])  # רק חומרים פופולריים
                
                # בחירת אתרים
                from_site = random.choice(sites[:4])  # מחצבות
                # אתרי יעד - אתרי הלקוח או כלליים
                possible_to_sites = [s for s in sites[4:] if s.customer_id == customer.id]
                if not possible_to_sites:  # אם אין אתרים ללקוח, קח כלליים
                    possible_to_sites = [s for s in sites if s.is_generic and s != from_site]
                to_site = random.choice(possible_to_sites)
                
                # בחירת משאית ונהג
                truck = random.choice(trucks[:6])  # רק משאיות פעילות
                driver = [d for d in drivers if d.id == truck.primary_driver_id][0] if truck.primary_driver_id else random.choice(drivers)
                
                # כמות מתאימה למשאית
                if material.billing_unit == BillingUnit.TON:
                    planned_qty = random.randint(20, int(truck.capacity_ton))
                else:
                    planned_qty = random.randint(15, int(truck.capacity_m3))
                
                # סטטוס לפי תאריך
                if day_offset > 7:
                    status = JobStatus.CLOSED
                    actual_qty = Decimal(str(planned_qty * random.uniform(0.9, 1.05)))
                elif day_offset > 3:
                    status = JobStatus.DELIVERED
                    actual_qty = Decimal(str(planned_qty * random.uniform(0.95, 1.0)))
                elif day_offset > 1:
                    status = random.choice([JobStatus.LOADED, JobStatus.ENROUTE_DROPOFF])
                    actual_qty = None
                else:
                    status = random.choice([JobStatus.PLANNED, JobStatus.ASSIGNED])
                    actual_qty = None
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    priority=random.randint(0, 2),
                    driver_id=driver.id,
                    truck_id=truck.id,
                    planned_qty=Decimal(str(planned_qty)),
                    actual_qty=actual_qty,
                    unit=material.billing_unit,
                    status=status,
                    is_subcontractor=False,
                    is_billable=status in [JobStatus.DELIVERED, JobStatus.CLOSED],
                    created_at=job_date,
                    updated_at=datetime.utcnow()
                )
                db.add(job)
                jobs.append(job)
        
        # נסיעות קבלני משנה (עבר)
        for day_offset in range(15, 0, -1):
            job_date = datetime.utcnow() - timedelta(days=day_offset)
            
            # 1-2 נסיעות קבלן ביום
            if random.random() > 0.3:  # 70% סיכוי ליום עם קבלן
                subcontractor = random.choice(subcontractors)
                customer = random.choice(customers)
                material = random.choice(materials[:4])
                
                from_site = random.choice(sites[:3])
                # אתרי יעד - אתרי הלקוח או כלליים
                possible_to_sites = [s for s in sites[4:] if s.customer_id == customer.id]
                if not possible_to_sites:  # אם אין אתרים ללקוח, קח כלליים
                    possible_to_sites = [s for s in sites if s.is_generic and s != from_site]
                to_site = random.choice(possible_to_sites)
                
                planned_qty = random.randint(18, 30)
                
                if day_offset > 5:
                    status = JobStatus.CLOSED
                    actual_qty = Decimal(str(planned_qty * random.uniform(0.95, 1.0)))
                else:
                    status = random.choice([JobStatus.DELIVERED, JobStatus.LOADED])
                    actual_qty = Decimal(str(planned_qty)) if status == JobStatus.DELIVERED else None
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    priority=1,
                    driver_id=None,
                    truck_id=None,
                    planned_qty=Decimal(str(planned_qty)),
                    actual_qty=actual_qty,
                    unit=material.billing_unit,
                    status=status,
                    is_subcontractor=True,
                    subcontractor_id=subcontractor.id,
                    subcontractor_billing_unit="TON" if material.billing_unit == BillingUnit.TON else "M3",
                    is_billable=status in [JobStatus.DELIVERED, JobStatus.CLOSED],
                    created_at=job_date,
                    updated_at=datetime.utcnow()
                )
                db.add(job)
                jobs.append(job)
        
        # ============================================
        # נסיעות עתיד (30 ימים קדימה) - 100 נסיעות
        # ============================================
        print("   📅 יוצר נסיעות עתידיות...")
        
        future_jobs_count = 0
        target_future_jobs = 100
        
        for day_offset in range(1, 31):  # 30 ימים קדימה
            job_date = datetime.utcnow() + timedelta(days=day_offset)
            
            # כמה נסיעות ליצור היום כדי להגיע ל-100
            remaining_days = 31 - day_offset
            remaining_jobs = target_future_jobs - future_jobs_count
            
            if remaining_days > 0:
                avg_jobs_per_day = max(2, remaining_jobs // remaining_days)
                num_jobs = random.randint(max(1, avg_jobs_per_day - 1), avg_jobs_per_day + 2)
            else:
                num_jobs = remaining_jobs
            
            for _ in range(num_jobs):
                if future_jobs_count >= target_future_jobs:
                    break
                
                customer = random.choice(customers)
                material = random.choice(materials[:6])  # רק חומרים פופולריים
                
                # בחירת אתרים
                from_site = random.choice(sites[:4])  # מחצבות
                # אתרי יעד - אתרי הלקוח או כלליים
                possible_to_sites = [s for s in sites[4:] if s.customer_id == customer.id]
                if not possible_to_sites:  # אם אין אתרים ללקוח, קח כלליים
                    possible_to_sites = [s for s in sites if s.is_generic and s != from_site]
                to_site = random.choice(possible_to_sites)
                
                # בחירת משאית ונהג
                truck = random.choice(trucks[:6])  # רק משאיות פעילות
                driver = [d for d in drivers if d.id == truck.primary_driver_id][0] if truck.primary_driver_id else random.choice(drivers)
                
                # כמות מתאימה למשאית
                if material.billing_unit == BillingUnit.TON:
                    planned_qty = random.randint(20, int(truck.capacity_ton))
                else:
                    planned_qty = random.randint(15, int(truck.capacity_m3))
                
                # סטטוס לנסיעות עתידיות
                if day_offset <= 2:  # יומיים הקרובים - כבר משוייכות
                    status = JobStatus.ASSIGNED
                else:  # שאר הנסיעות - מתוכננות
                    status = JobStatus.PLANNED
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    priority=random.randint(0, 2),
                    driver_id=driver.id if status == JobStatus.ASSIGNED else None,
                    truck_id=truck.id if status == JobStatus.ASSIGNED else None,
                    planned_qty=Decimal(str(planned_qty)),
                    actual_qty=None,
                    unit=material.billing_unit,
                    status=status,
                    is_subcontractor=False,
                    is_billable=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(job)
                jobs.append(job)
                future_jobs_count += 1
            
            if future_jobs_count >= target_future_jobs:
                break
        
        # נסיעות קבלני משנה עתידיות
        for day_offset in range(1, 16):  # 15 ימים קדימה
            job_date = datetime.utcnow() + timedelta(days=day_offset)
            
            # 1 נסיעת קבלן ביום (70% סיכוי)
            if random.random() > 0.3:
                subcontractor = random.choice(subcontractors)
                customer = random.choice(customers)
                material = random.choice(materials[:4])
                
                from_site = random.choice(sites[:3])
                # אתרי יעד - אתרי הלקוח או כלליים
                possible_to_sites = [s for s in sites[4:] if s.customer_id == customer.id]
                if not possible_to_sites:
                    possible_to_sites = [s for s in sites if s.is_generic and s != from_site]
                to_site = random.choice(possible_to_sites)
                
                planned_qty = random.randint(18, 30)
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    priority=1,
                    driver_id=None,
                    truck_id=None,
                    planned_qty=Decimal(str(planned_qty)),
                    actual_qty=None,
                    unit=material.billing_unit,
                    status=JobStatus.PLANNED,
                    is_subcontractor=True,
                    subcontractor_id=subcontractor.id,
                    subcontractor_billing_unit="TON" if material.billing_unit == BillingUnit.TON else "M3",
                    is_billable=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(job)
                jobs.append(job)
        
        # ============================================
        # נסיעות עתידיות לימים ספציפיים (27, 28, 30 ימים קדימה)
        # ============================================
        print("   📆 יוצר נסיעות לימים ספציפיים (27, 28, 30 ימים קדימה)...")
        
        specific_days = [27, 28, 30]
        for day_offset in specific_days:
            job_date = datetime.utcnow() + timedelta(days=day_offset)
            
            # 8-12 נסיעות ביום מיוחד
            num_jobs = random.randint(8, 12)
            
            for _ in range(num_jobs):
                customer = random.choice(customers)
                material = random.choice(materials[:6])
                
                # בחירת אתרים
                from_site = random.choice(sites[:4])  # מחצבות
                possible_to_sites = [s for s in sites[4:] if s.customer_id == customer.id]
                if not possible_to_sites:
                    possible_to_sites = [s for s in sites if s.is_generic and s != from_site]
                to_site = random.choice(possible_to_sites)
                
                # בחירת משאית ונהג
                truck = random.choice(trucks)
                driver = [d for d in drivers if d.id == truck.primary_driver_id][0] if truck.primary_driver_id else random.choice(drivers)
                
                # כמות מתאימה למשאית
                if material.billing_unit == BillingUnit.TON:
                    max_capacity = max(25, int(truck.capacity_ton))  # לפחות 25
                    planned_qty = random.randint(20, max_capacity)
                else:
                    max_capacity = max(20, int(truck.capacity_m3))  # לפחות 20
                    planned_qty = random.randint(15, max_capacity)
                
                # עדיפות גבוהה יותר לנסיעות אלה
                priority = random.randint(1, 2)
                
                job = Job(
                    org_id=org_id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    priority=priority,
                    driver_id=None,  # טרם משובץ
                    truck_id=None,   # טרם משובץ
                    planned_qty=Decimal(str(planned_qty)),
                    actual_qty=None,
                    unit=material.billing_unit,
                    status=JobStatus.PLANNED,
                    is_subcontractor=False,
                    is_billable=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(job)
                jobs.append(job)
        
        db.commit()
        for j in jobs:
            db.refresh(j)
        
        # חישוב סטטיסטיקות
        now = datetime.utcnow().replace(tzinfo=None)
        past_jobs = len([j for j in jobs if j.scheduled_date.replace(tzinfo=None) < now])
        future_jobs = len([j for j in jobs if j.scheduled_date.replace(tzinfo=None) >= now])
        
        print(f"   ✅ נוצרו {len(jobs)} נסיעות")
        print(f"      - עבר (30 ימים): {past_jobs}")
        print(f"      - עתיד (30 ימים): {future_jobs}")
        print(f"      - משאיות חברה: {len([j for j in jobs if not j.is_subcontractor])}")
        print(f"      - קבלני משנה: {len([j for j in jobs if j.is_subcontractor])}")
        
        return jobs
        
    finally:
        db.close()


def main():
    """הרצת הסקריפט"""
    print("\n" + "="*70)
    print("🚛 יצירת נתוני דמו מלאים למערכת Fleet Management")
    print("="*70)
    
    # בדיקה אם למחוק נתונים קיימים
    print("\n⚠️  שים לב: פעולה זו תמחק את כל נתוני הדמו הקיימים!")
    confirm = input("האם להמשיך? (yes/no): ").strip().lower()
    
    if confirm != "yes":
        print("❌ הפעולה בוטלה")
        return
    
    # מחיקת נתונים קיימים
    delete_existing_demo()
    
    # יצירת נתונים חדשים
    print("\n" + "="*70)
    print("📝 יצירת נתוני דמו חדשים...")
    print("="*70)
    
    org = create_organization()
    users = create_users(org.id)
    customers = create_customers(org.id)
    sites = create_sites(org.id, customers)
    materials = create_materials(org.id)
    drivers = create_drivers_and_users(org.id)
    trucks = create_trucks(org.id, drivers)
    subcontractors = create_subcontractors(org.id)
    price_lists = create_price_lists(org.id, customers, materials, sites)
    sub_price_lists = create_subcontractor_price_lists(org.id, subcontractors, materials)
    jobs = create_jobs(org.id, customers, sites, materials, drivers, trucks, subcontractors)
    
    # סיכום
    print("\n" + "="*70)
    print("✅ נתוני הדמו נוצרו בהצלחה!")
    print("="*70)
    print(f"""
📊 סיכום נתוני דמו:

🏢 ארגון:          1 (ID: {org.id})
👥 משתמשים:        {len(users) + len(drivers)} (מנהלים: {len(users)}, נהגים: {len(drivers)})
🏭 לקוחות:         {len(customers)}
📍 אתרים:          {len(sites)} (כלליים: {len([s for s in sites if s.is_generic])}, לקוחות: {len([s for s in sites if not s.is_generic])})
🪨 חומרים:         {len(materials)}
👨‍✈️ נהגים:          {len(drivers)}
🚛 משאיות:         {len(trucks)}
👷 קבלני משנה:     {len(subcontractors)}
💰 מחירונים:       {len(price_lists)} (כלליים + ללקוחות)
💵 מחירוני קבלנים: {len(sub_price_lists)}
🚚 נסיעות:         {len(jobs)}

📧 פרטי התחברות:
   ➤ אדמין:         demo@demo.com / demo123
   ➤ סדרן:          dispatcher@demo.com / demo123
   ➤ הנהלת חשבונות: accounting@demo.com / demo123
   ➤ נהגים:         driver1@demo.com ... driver{len(drivers)}@demo.com / demo123

🌐 כתובת מערכת:    http://localhost:3010
🔗 API:             http://localhost:8001

""")
    print("="*70)


if __name__ == "__main__":
    main()
