"""
Add Material-Specific Price Lists for Testing
עדכון מחירונים: הוספת מחירים שונים לפי סוג חומר

דוגמה: קבלן משנה שמבדיל בין מחירי חומרים:
- מצע: 20 ש"ח/טון
- חצץ: 25 ש"ח/טון
- עפר: 18 ש"ח/טון
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import Subcontractor, Material, SubcontractorPriceList, Organization
from datetime import datetime, timedelta
from sqlalchemy.orm import Session


def add_material_specific_prices(db: Session):
    """
    Add material-specific price lists for first 3 subcontractors
    Each will have different prices for different materials
    """
    
    # Get first organization
    org = db.query(Organization).first()
    if not org:
        print("❌ No organization found!")
        return
    
    print(f"✅ Using organization: {org.name} (ID: {org.id})")
    
    # Get first 3 subcontractors
    subcontractors = db.query(Subcontractor).filter(
        Subcontractor.org_id == org.id
    ).limit(3).all()
    
    if not subcontractors:
        print("❌ No subcontractors found! Run add_subcontractors_and_jobs.py first")
        return
    
    print(f"✅ Found {len(subcontractors)} subcontractors")
    
    # Get materials
    materials = db.query(Material).filter(
        Material.org_id == org.id
    ).all()
    
    if not materials:
        print("❌ No materials found!")
        return
    
    print(f"✅ Found {len(materials)} materials: {[m.name for m in materials]}")
    
    # Create material-specific prices
    today = datetime.now()
    created_count = 0
    
    for idx, subcontractor in enumerate(subcontractors):
        print(f"\n📋 Setting material-specific prices for: {subcontractor.name}")
        
        # Different pricing strategy per subcontractor
        base_prices = {
            0: {"TON": 20, "M3": 28, "TRIP": 350},  # Subcontractor 1
            1: {"TON": 22, "M3": 30, "TRIP": 370},  # Subcontractor 2
            2: {"TON": 19, "M3": 26, "TRIP": 340},  # Subcontractor 3
        }
        
        prices = base_prices[idx]
        
        for material in materials:
            # Create TON price for material
            if "TON" in prices:
                ton_price = SubcontractorPriceList(
                    org_id=org.id,
                    subcontractor_id=subcontractor.id,
                    material_id=material.id,  # 🔥 SPECIFIC TO THIS MATERIAL
                    price_per_ton=prices["TON"] + (idx * 2),  # Vary by material
                    min_charge=150.0,
                    valid_from=today,
                    valid_to=None,  # Forever
                    notes=f"מחיר {material.name} בלבד - {prices['TON'] + (idx * 2)} ש\"ח/טון",
                    is_active=True
                )
                db.add(ton_price)
                created_count += 1
                print(f"  ✓ {material.name}: {prices['TON'] + (idx * 2)} ₪/טון")
        
        # Add one general price list (no material_id) as fallback
        general_price = SubcontractorPriceList(
            org_id=org.id,
            subcontractor_id=subcontractor.id,
            material_id=None,  # General - applies to all materials without specific price
            price_per_trip=prices["TRIP"],
            min_charge=200.0,
            valid_from=today,
            valid_to=None,
            notes="מחיר כללי לכל החומרים (ללא הגדרה ספציפית)",
            is_active=True
        )
        db.add(general_price)
        created_count += 1
        print(f"  ✓ כללי: {prices['TRIP']} ₪/נסיעה")
    
    db.commit()
    print(f"\n✅ Created {created_count} material-specific price lists!")
    
    # Show summary
    print("\n📊 Summary:")
    for subcontractor in subcontractors:
        price_count = db.query(SubcontractorPriceList).filter(
            SubcontractorPriceList.subcontractor_id == subcontractor.id
        ).count()
        print(f"  {subcontractor.name}: {price_count} price lists")


def main():
    db = SessionLocal()
    try:
        print("🚀 Adding Material-Specific Price Lists...")
        print("=" * 60)
        add_material_specific_prices(db)
        print("=" * 60)
        print("✅ Done!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
