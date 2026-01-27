"""
Add 10 subcontractors and future jobs for testing
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import (
    Organization, User, Subcontractor, SubcontractorPriceList,
    Customer, Site, Material, Truck, Job, JobStatus, BillingUnit
)

def add_demo_data():
    db = SessionLocal()
    
    try:
        # Get demo organization
        demo_org = db.query(Organization).filter(Organization.slug == 'demo').first()
        if not demo_org:
            print("❌ Demo organization not found. Run create_demo_org.py first.")
            return
        
        print(f"✅ Found organization: {demo_org.name} (ID: {demo_org.id})")
        
        # Get existing data for creating jobs
        customers = db.query(Customer).filter(Customer.org_id == demo_org.id).all()
        sites = db.query(Site).filter(Site.org_id == demo_org.id).all()
        materials = db.query(Material).filter(Material.org_id == demo_org.id).all()
        
        if not customers or not sites or not materials:
            print("❌ Missing basic data (customers/sites/materials). Run setup scripts first.")
            return
        
        print(f"✅ Found {len(customers)} customers, {len(sites)} sites, {len(materials)} materials")
        
        # Create 10 subcontractors
        subcontractors_data = [
            {
                "name": "הובלות דוד",
                "company_name": "דוד הובלות בע״מ",
                "phone": "052-1234567",
                "email": "david@transport.com",
                "vat_id": "514123456",
                "contact_person": "דוד כהן",
                "truck_plate_number": "12-345-67",
                "payment_terms": "monthly",
                "notes": "קבלן ותיק, מהימן"
            },
            {
                "name": "משאיות משה",
                "company_name": "משה משאיות ושירותים בע״מ",
                "phone": "054-2345678",
                "email": "moshe@trucks.com",
                "vat_id": "514234567",
                "contact_person": "משה לוי",
                "truck_plate_number": "23-456-78",
                "payment_terms": "monthly",
                "notes": "מתמחה בהובלות עפר"
            },
            {
                "name": "חברת אבי להובלות",
                "company_name": "אבי הובלות 2000 בע״מ",
                "phone": "050-3456789",
                "email": "avi@haul.com",
                "vat_id": "514345678",
                "contact_person": "אבי מזרחי",
                "truck_plate_number": "34-567-89",
                "payment_terms": "weekly",
                "notes": "זמין בשבתות"
            },
            {
                "name": "יוסי טרקטורים",
                "company_name": "יוסי טרקטורים ומשאיות בע״מ",
                "phone": "052-4567890",
                "email": "yossi@tractors.com",
                "vat_id": "514456789",
                "contact_person": "יוסי אברהם",
                "truck_plate_number": "45-678-90",
                "payment_terms": "monthly",
                "notes": "יש גם טרקטור"
            },
            {
                "name": "רונן הובלות בע״מ",
                "company_name": "רונן הובלות ושינוע",
                "phone": "053-5678901",
                "email": "ronen@transport.co.il",
                "vat_id": "514567890",
                "contact_person": "רונן שמעון",
                "truck_plate_number": "56-789-01",
                "payment_terms": "monthly",
                "notes": "עובד גם בלילות"
            },
            {
                "name": "אלי משאיות כבדות",
                "company_name": "אלי משאיות כבדות ושירותים בע״מ",
                "phone": "054-6789012",
                "email": "eli@heavy.com",
                "vat_id": "514678901",
                "contact_person": "אלי חיים",
                "truck_plate_number": "67-890-12",
                "payment_terms": "monthly",
                "notes": "משאיות פול טריילר בלבד"
            },
            {
                "name": "דני הובלות מהירות",
                "company_name": "דני הובלות מהירות בע״מ",
                "phone": "050-7890123",
                "email": "danny@fast.co.il",
                "vat_id": "514789012",
                "contact_person": "דני יעקב",
                "truck_plate_number": "78-901-23",
                "payment_terms": "weekly",
                "notes": "מהיר ויעיל"
            },
            {
                "name": "שמואל שינוע ופינוי",
                "company_name": "שמואל שינוע ופינוי עפר בע״מ",
                "phone": "052-8901234",
                "email": "shmuel@removal.com",
                "vat_id": "514890123",
                "contact_person": "שמואל ביטון",
                "truck_plate_number": "89-012-34",
                "payment_terms": "monthly",
                "notes": "מתמחה בפינוי"
            },
            {
                "name": "חיים הובלות ואספקה",
                "company_name": "חיים הובלות ואספקה בע״מ",
                "phone": "053-9012345",
                "email": "haim@supply.co.il",
                "vat_id": "514901234",
                "contact_person": "חיים אוחנה",
                "truck_plate_number": "90-123-45",
                "payment_terms": "monthly",
                "notes": "גם אספקה מהמחצבה"
            },
            {
                "name": "יצחק טרנספורט",
                "company_name": "יצחק טרנספורט ושירותים בע״מ",
                "phone": "054-0123456",
                "email": "yitzhak@transport.com",
                "vat_id": "515012345",
                "contact_person": "יצחק משה",
                "truck_plate_number": "01-234-56",
                "payment_terms": "monthly",
                "notes": "קבלן חדש, מחירים טובים"
            }
        ]
        
        print("\n📦 Creating 10 subcontractors...")
        subcontractors = []
        for idx, sub_data in enumerate(subcontractors_data, 1):
            # Check if already exists
            existing = db.query(Subcontractor).filter(
                Subcontractor.org_id == demo_org.id,
                Subcontractor.name == sub_data["name"]
            ).first()
            
            if existing:
                print(f"   ⏭️  Subcontractor #{idx} '{sub_data['name']}' already exists")
                subcontractors.append(existing)
                continue
            
            subcontractor = Subcontractor(
                org_id=demo_org.id,
                **sub_data,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(subcontractor)
            db.flush()
            subcontractors.append(subcontractor)
            print(f"   ✅ Created subcontractor #{idx}: {sub_data['name']} (ID: {subcontractor.id})")
            
            # Create price lists for each subcontractor
            # Price per TRIP
            price_trip = SubcontractorPriceList(
                org_id=demo_org.id,
                subcontractor_id=subcontractor.id,
                price_per_trip=Decimal('300.00') + (idx * 10),  # 310, 320, 330...
                valid_from=datetime.utcnow() - timedelta(days=30),
                is_active=True,
                notes=f"מחיר נסיעה קבוע לקבלן {sub_data['name']}"
            )
            db.add(price_trip)
            
            # Price per TON
            price_ton = SubcontractorPriceList(
                org_id=demo_org.id,
                subcontractor_id=subcontractor.id,
                price_per_ton=Decimal('35.00') + idx,  # 36, 37, 38...
                valid_from=datetime.utcnow() - timedelta(days=30),
                is_active=True,
                notes=f"מחיר לטון לקבלן {sub_data['name']}"
            )
            db.add(price_ton)
            
            # Price per M3
            price_m3 = SubcontractorPriceList(
                org_id=demo_org.id,
                subcontractor_id=subcontractor.id,
                price_per_m3=Decimal('25.00') + idx,  # 26, 27, 28...
                valid_from=datetime.utcnow() - timedelta(days=30),
                is_active=True,
                notes=f"מחיר לקוב לקבלן {sub_data['name']}"
            )
            db.add(price_m3)
            
            print(f"      💰 Added 3 price lists (TRIP: {price_trip.price_per_trip}, TON: {price_ton.price_per_ton}, M3: {price_m3.price_per_m3})")
        
        db.commit()
        print(f"\n✅ Total subcontractors in system: {len(subcontractors)}")
        
        # Create future jobs (today + next 14 days)
        print("\n🚛 Creating future jobs with subcontractors...")
        
        # Billing units to cycle through
        billing_units = ['TRIP', 'TON', 'M3', 'KM']
        job_count = 0
        
        for day_offset in range(15):  # Today + 14 days
            job_date = datetime.utcnow() + timedelta(days=day_offset)
            
            # Create 2-4 jobs per day
            jobs_per_day = 2 + (day_offset % 3)  # 2, 3, or 4 jobs per day
            
            for job_num in range(jobs_per_day):
                # Select random data
                customer = customers[job_count % len(customers)]
                from_site = sites[job_count % len(sites)]
                to_site = sites[(job_count + 1) % len(sites)]
                if from_site.id == to_site.id:
                    to_site = sites[(job_count + 2) % len(sites)]
                
                material = materials[job_count % len(materials)]
                subcontractor = subcontractors[job_count % len(subcontractors)]
                billing_unit = billing_units[job_count % len(billing_units)]
                
                # Random quantity
                if billing_unit == 'TON':
                    qty = 10 + (job_count % 15)  # 10-24 tons
                elif billing_unit == 'M3':
                    qty = 8 + (job_count % 12)  # 8-19 m3
                elif billing_unit == 'KM':
                    qty = 15 + (job_count % 35)  # 15-49 km
                else:  # TRIP
                    qty = 1
                
                # Create job
                job = Job(
                    org_id=demo_org.id,
                    customer_id=customer.id,
                    from_site_id=from_site.id,
                    to_site_id=to_site.id,
                    material_id=material.id,
                    scheduled_date=job_date,
                    planned_qty=Decimal(str(qty)),
                    unit=material.billing_unit,
                    priority=0,
                    status=JobStatus.PLANNED,
                    is_subcontractor=True,
                    subcontractor_id=subcontractor.id,
                    subcontractor_billing_unit=billing_unit,
                    notes=f"נסיעה דמו - קבלן: {subcontractor.name}, חיוב לפי: {billing_unit}",
                    is_billable=False,
                    created_at=datetime.utcnow()
                )
                db.add(job)
                job_count += 1
                
                if job_count % 10 == 0:
                    db.flush()
                    print(f"   ✅ Created {job_count} jobs...")
        
        db.commit()
        print(f"\n✅ Total jobs created: {job_count}")
        print(f"   📅 Date range: {datetime.utcnow().date()} to {(datetime.utcnow() + timedelta(days=14)).date()}")
        print(f"   🔄 Billing units used: {', '.join(billing_units)}")
        
        # Summary
        print("\n" + "="*60)
        print("📊 DEMO DATA SUMMARY")
        print("="*60)
        print(f"✅ Organization: {demo_org.name}")
        print(f"✅ Subcontractors: {len(subcontractors)}")
        print(f"✅ Price Lists: {len(subcontractors) * 3} (3 per subcontractor)")
        print(f"✅ Future Jobs: {job_count}")
        print(f"✅ Jobs per day: 2-4")
        print(f"✅ Date range: Today + 14 days")
        print("="*60)
        
        print("\n🎉 Demo data added successfully!")
        print("\n💡 Now you can test:")
        print("   1. Reports → Subcontractor Payment Report")
        print("   2. Dispatch Board → View future jobs")
        print("   3. Edit jobs → Change billing unit (TRIP/TON/M3/KM)")
        print("   4. See price calculations in reports")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_demo_data()
