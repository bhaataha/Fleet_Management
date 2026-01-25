"""
Add GPS coordinates to existing sites
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models import Site

def add_locations():
    db = SessionLocal()
    
    # Site locations (approximate coordinates in Israel)
    locations = {
        'פרויקט רמת אביב': (32.1133, 34.8036),  # Tel Aviv
        'פרויקט הרצליה פיתוח': (32.1656, 34.8116),  # Herzliya
        'מגדלי עזריאלי ראשון': (31.9730, 34.7925),  # Rishon LeZion
        'עזריאלי חולון': (32.0128, 34.7743),  # Holon
        'פרויקט נתניה מערב': (32.3215, 34.8532),  # Netanya
        'כביש 531 - קטע ב׳': (31.8969, 34.8186),  # Route 531
        'מחצבת נשר': (32.7940, 35.0279),  # Nesher Quarry (north)
        'מזבלה אריאל': (32.1059, 35.1816),  # Ariel area
    }
    
    try:
        for site_name, (lat, lng) in locations.items():
            site = db.query(Site).filter(Site.name == site_name).first()
            if site:
                site.lat = lat
                site.lng = lng
                print(f"✅ Updated {site_name}: {lat}, {lng}")
            else:
                print(f"⚠️  Site not found: {site_name}")
        
        db.commit()
        print("\n🎉 Site locations updated successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_locations()
