"""
PDF Generator for Delivery Notes and Job Reports
תעודות משלוח וסיכומי עבודה
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from typing import Dict, Any
import os
from bidi.algorithm import get_display
import arabic_reshaper


# Register Hebrew font (DejaVu Sans supports Hebrew)
try:
    # Try to register DejaVu Sans font (common on Linux)
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
        'DejaVuSans.ttf'
    ]
    
    font_registered = False
    for font_path in font_paths:
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('HebrewFont', font_path))
            font_registered = True
            break
    
    if not font_registered:
        # Fallback to Helvetica if Hebrew font not found
        print("Warning: Hebrew font not found, using Helvetica")
        FONT_NAME = 'Helvetica'
    else:
        FONT_NAME = 'HebrewFont'
except Exception as e:
    print(f"Error registering font: {e}, using Helvetica")
    FONT_NAME = 'Helvetica'


def fix_hebrew(text: str) -> str:
    """Fix Hebrew text for proper RTL display in PDF"""
    if not text:
        return text
    # Reshape Arabic/Hebrew characters and apply BiDi algorithm
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


# Unit translations
UNIT_LABELS = {
    'TON': fix_hebrew('טון'),
    'M3': fix_hebrew('מ״ק'),
    'TRIP': fix_hebrew('נסיעה'),
    'KM': fix_hebrew('ק״מ'),
}


def translate_unit(unit: str) -> str:
    """Translate billing unit to Hebrew"""
    return UNIT_LABELS.get(unit.upper() if unit else '', unit)


class NumberedCanvas(canvas.Canvas):
    """Canvas with page numbers and header/footer"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        """Draw header and footer on each page"""
        # Header
        self.saveState()
        
        # Header background
        self.setFillColor(colors.HexColor('#1e40af'))  # TruckFlow blue
        self.rect(0, A4[1] - 2*cm, A4[0], 2*cm, fill=1, stroke=0)
        
        # Company name
        self.setFillColor(colors.white)
        self.setFont(FONT_NAME, 20)
        self.drawString(2*cm, A4[1] - 1.3*cm, "TruckFlow")
        
        self.setFont(FONT_NAME, 10)
        self.drawString(2*cm, A4[1] - 1.7*cm, "FLEET MANAGEMENT")
        
        # Footer
        self.setFillColor(colors.HexColor('#f3f4f6'))
        self.rect(0, 0, A4[0], 2.5*cm, fill=1, stroke=0)
        
        # Footer line
        self.setStrokeColor(colors.HexColor('#1e40af'))
        self.setLineWidth(2)
        self.line(2*cm, 2.3*cm, A4[0] - 2*cm, 2.3*cm)
        
        # Copyright
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont(FONT_NAME, 9)
        copyright_text = fix_hebrew(f"© {datetime.now().year} TruckFlow. כל הזכויות שמורות.")
        self.drawRightString(A4[0] - 2*cm, 1.7*cm, copyright_text)
        
        # Developer info
        self.setFillColor(colors.HexColor('#1e40af'))
        self.setFont(FONT_NAME, 8)
        dev_text = fix_hebrew("פותח ונבנה על ידי")
        self.drawRightString(A4[0] - 2*cm, 1.2*cm, dev_text)
        
        self.setFont(FONT_NAME, 9)
        self.setFillColor(colors.HexColor('#374151'))
        self.drawRightString(A4[0] - 2*cm, 0.7*cm, fix_hebrew("נינגה תקשורת והנדסה") + " • 054-774-8823")
        
        # Page number
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont(FONT_NAME, 8)
        page_text = fix_hebrew(f"עמוד {self._pageNumber} מתוך {page_count}")
        self.drawString(2*cm, 0.7*cm, page_text)
        
        self.restoreState()


class DeliveryNotePDF:
    """Generate professional delivery note PDF with TruckFlow branding"""
    
    def __init__(self):
        self.buffer = BytesIO()
        self.pagesize = A4
        self.width, self.height = self.pagesize
        
    def generate(self, job_data: Dict[str, Any]) -> BytesIO:
        """Generate PDF and return buffer"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=3*cm,  # Space for header
            bottomMargin=3*cm  # Space for footer
        )
        
        # Build content
        story = []
        styles = getSampleStyleSheet()
        
        # Custom RTL style for Hebrew
        rtl_style = ParagraphStyle(
            'RTL',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=11,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#374151'),
        )
        
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=24,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=20,
            spaceBefore=10,
        )
        
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=14,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=8,
            spaceBefore=12,
        )
        
        # Title with decorative line
        story.append(Paragraph(fix_hebrew("תעודת משלוח"), title_style))
        
        # Decorative line
        line_table = Table([['']], colWidths=[17*cm])
        line_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.HexColor('#1e40af')),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.HexColor('#93c5fd')),
        ]))
        story.append(line_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Job Info Table with enhanced styling
        job_info = [
            [f"#{job_data.get('id', 'N/A')}", fix_hebrew('נסיעה #')],
            [job_data.get('scheduled_date', 'N/A'), fix_hebrew('תאריך:')],
            [self._get_status_hebrew(job_data.get('status', 'unknown')), fix_hebrew('סטטוס:')],
        ]
        
        if job_data.get('customer_name'):
            customer_info = fix_hebrew(job_data['customer_name'])
            if job_data.get('customer_contact'):
                customer_info += f"\n{fix_hebrew('איש קשר:')} {fix_hebrew(job_data['customer_contact'])}"
            if job_data.get('customer_phone'):
                customer_info += f" • {job_data['customer_phone']}"
            job_info.append([customer_info, fix_hebrew('לקוח:')])
        
        job_table = Table(job_info, colWidths=[13*cm, 4*cm])
        job_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#dbeafe')),
            ('BACKGROUND', (0, 0), (0, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#93c5fd')),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('FONTNAME', (1, 0), (1, -1), FONT_NAME),
            ('FONTSIZE', (1, 0), (1, -1), 10),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e40af')),
        ]))
        story.append(job_table)
        story.append(Spacer(1, 1*cm))
        
        # Route Section
        story.append(Paragraph(fix_hebrew('מסלול'), section_style))
        
        route_data = [
            ['', fix_hebrew('מאתר')],
            ['', fix_hebrew(job_data.get('from_site_name', 'N/A'))],
            ['', fix_hebrew(job_data.get('from_site_address', '-'))],
            ['←', ''],
            ['', fix_hebrew('לאתר')],
            ['', fix_hebrew(job_data.get('to_site_name', 'N/A'))],
            ['', fix_hebrew(job_data.get('to_site_address', '-'))],
        ]
        
        route_table = Table(route_data, colWidths=[1*cm, 16*cm])
        route_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 3), (0, 3), 'CENTER'),
            ('BACKGROUND', (1, 0), (1, 2), colors.HexColor('#f0fdf4')),
            ('BACKGROUND', (1, 4), (1, 6), colors.HexColor('#fef3c7')),
            ('FONTNAME', (1, 0), (1, 0), FONT_NAME),
            ('FONTSIZE', (1, 0), (1, 0), 10),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#059669')),
            ('FONTNAME', (1, 4), (1, 4), FONT_NAME),
            ('FONTSIZE', (1, 4), (1, 4), 10),
            ('TEXTCOLOR', (1, 4), (1, 4), colors.HexColor('#d97706')),
            ('GRID', (1, 0), (1, 2), 1, colors.HexColor('#86efac')),
            ('GRID', (1, 4), (1, 6), 1, colors.HexColor('#fde047')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('FONTSIZE', (0, 3), (0, 3), 18),
            ('TEXTCOLOR', (0, 3), (0, 3), colors.HexColor('#1e40af')),
        ]))
        story.append(route_table)
        story.append(Spacer(1, 1*cm))
        
        # Material & Quantity
        story.append(Paragraph(fix_hebrew('חומר וכמות'), section_style))
        
        material_data = [
            [fix_hebrew(job_data.get('material_name', 'N/A')), fix_hebrew('חומר')],
            [f"{job_data.get('planned_qty', 0)} {translate_unit(job_data.get('unit', ''))}", fix_hebrew('כמות מתוכננת')],
        ]
        
        if job_data.get('actual_qty'):
            material_data.append([f"{job_data['actual_qty']} {translate_unit(job_data.get('unit', ''))}", fix_hebrew('כמות בפועל')])
        
        material_table = Table(material_data, colWidths=[12*cm, 5*cm])
        material_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ede9fe')),
            ('BACKGROUND', (0, 0), (0, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#c4b5fd')),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('FONTSIZE', (1, 0), (1, -1), 10),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#6d28d9')),
        ]))
        story.append(material_table)
        story.append(Spacer(1, 1*cm))
        
        # Manual Price Override (if exists)
        if job_data.get('manual_override_total'):
            story.append(Paragraph(fix_hebrew('מחיר'), section_style))
            
            price_data = [
                [f"₪{float(job_data['manual_override_total']):.2f}", fix_hebrew('מחיר מותאם אישית')],
            ]
            
            if job_data.get('manual_override_reason'):
                price_data.append([fix_hebrew(job_data['manual_override_reason']), fix_hebrew('סיבה')])
            
            price_table = Table(price_data, colWidths=[12*cm, 5*cm])
            price_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#fef3c7')),
                ('BACKGROUND', (0, 0), (0, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#fde047')),
                ('PADDING', (0, 0), (-1, -1), 10),
                ('FONTSIZE', (1, 0), (1, -1), 10),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#d97706')),
                ('FONTNAME', (0, 0), (0, 0), FONT_NAME),
                ('FONTSIZE', (0, 0), (0, 0), 14),
                ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#d97706')),
            ]))
            story.append(price_table)
            story.append(Spacer(1, 1*cm))
        
        # Driver & Truck
        if job_data.get('driver_name') or job_data.get('truck_plate'):
            story.append(Paragraph(fix_hebrew('צי'), section_style))
            
            vehicle_data = []
            if job_data.get('driver_name'):
                driver_info = fix_hebrew(job_data['driver_name'])
                if job_data.get('driver_phone'):
                    driver_info += f"\n{job_data['driver_phone']}"
                if job_data.get('driver_license'):
                    driver_info += f"\n{fix_hebrew('רישיון')} {job_data['driver_license']}"
                vehicle_data.append([driver_info, fix_hebrew('נהג')])
            
            if job_data.get('truck_plate'):
                truck_info = job_data['truck_plate']
                if job_data.get('truck_model'):
                    truck_info += f"\n{fix_hebrew(job_data['truck_model'])}"
                if job_data.get('truck_capacity'):
                    truck_info += f"\n{job_data['truck_capacity']} {fix_hebrew('טון')}"
                vehicle_data.append([truck_info, fix_hebrew('משאית')])
            
            vehicle_table = Table(vehicle_data, colWidths=[12*cm, 5*cm])
            vehicle_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#dbeafe')),
                ('BACKGROUND', (0, 0), (0, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#93c5fd')),
                ('PADDING', (0, 0), (-1, -1), 10),
                ('FONTSIZE', (1, 0), (1, -1), 10),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e40af')),
            ]))
            story.append(vehicle_table)
            story.append(Spacer(1, 1*cm))
        
        # Notes
        if job_data.get('notes'):
            story.append(Paragraph(fix_hebrew('הערות'), section_style))
            notes_table = Table([[fix_hebrew(job_data['notes'])]], colWidths=[17*cm])
            notes_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef9c3')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fde047')),
                ('PADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(notes_table)
            story.append(Spacer(1, 1*cm))
        
        # Signature section
        story.append(Spacer(1, 1*cm))
        signature_data = [
            ['____________', fix_hebrew('תאריך:'), '________________________', fix_hebrew('חתימת מקבל:')],
        ]
        sig_table = Table(signature_data, colWidths=[5*cm, 2*cm, 7*cm, 3*cm])
        sig_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (2, 0), (2, 0), colors.HexColor('#1e40af')),
        ]))
        story.append(sig_table)
        
        # Build PDF with custom canvas
        doc.build(story, canvasmaker=NumberedCanvas)
        self.buffer.seek(0)
        return self.buffer
    
    def _get_status_hebrew(self, status: str) -> str:
        """Convert status to Hebrew"""
        status_map = {
            'PLANNED': fix_hebrew('מתוכנן'),
            'ASSIGNED': fix_hebrew('משובץ'),
            'ENROUTE_PICKUP': fix_hebrew('בדרך לטעינה'),
            'LOADED': fix_hebrew('נטען'),
            'ENROUTE_DROPOFF': fix_hebrew('בדרך לפריקה'),
            'DELIVERED': fix_hebrew('הושלם'),
            'CLOSED': fix_hebrew('סגור'),
            'CANCELED': fix_hebrew('בוטל')
        }
        return status_map.get(status.upper(), status)
