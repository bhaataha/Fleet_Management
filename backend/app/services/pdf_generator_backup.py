"""
PDF Generator for Delivery Notes and Job Reports
תעודות משלוח וסיכומי עבודה
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
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
    """Generate professional delivery note PDF"""
    
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
            bold=True,
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
        
        # Custom RTL style for Hebrew
        rtl_style = ParagraphStyle(
            'RTL',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=12,
            fontName=FONT_NAME,
        )
        
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=20,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12
        )
        
        # Title
        story.append(Paragraph(fix_hebrew("תעודת משלוח - Delivery Note"), title_style))
        story.append(Spacer(1, 0.5*cm))
        
        # Job Info Table
        job_info = [
            [fix_hebrew('מספר נסיעה:'), f"#{job_data.get('id', 'N/A')}"],
            [fix_hebrew('תאריך:'), job_data.get('scheduled_date', 'N/A')],
            [fix_hebrew('סטטוס:'), self._get_status_hebrew(job_data.get('status', 'unknown'))],
        ]
        
        if job_data.get('customer_name'):
            job_info.append([fix_hebrew('לקוח:'), job_data['customer_name']])
        
        job_table = Table(job_info, colWidths=[5*cm, 10*cm])
        job_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(job_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Route Section
        story.append(Paragraph(f"<b>{fix_hebrew('מסלול הובלה:')}</b>", rtl_style))
        story.append(Spacer(1, 0.3*cm))
        
        route_data = [
            [fix_hebrew('מאתר:'), job_data.get('from_site_name', 'N/A')],
            [fix_hebrew('כתובת:'), job_data.get('from_site_address', '-')],
            ['', ''],
            [fix_hebrew('לאתר:'), job_data.get('to_site_name', 'N/A')],
            [fix_hebrew('כתובת:'), job_data.get('to_site_address', '-')],
        ]
        
        route_table = Table(route_data, colWidths=[4*cm, 11*cm])
        route_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#dbeafe')),
            ('BACKGROUND', (0, 3), (0, 3), colors.HexColor('#dcfce7')),
            ('GRID', (0, 0), (-1, 1), 0.5, colors.grey),
            ('GRID', (0, 3), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(route_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Material & Quantity
        story.append(Paragraph(f"<b>{fix_hebrew('פרטי המטען:')}</b>", rtl_style))
        story.append(Spacer(1, 0.3*cm))
        
        material_data = [
            [fix_hebrew('חומר:'), job_data.get('material_name', 'N/A')],
            [fix_hebrew('כמות מתוכננת:'), f"{job_data.get('planned_qty', 0)} {job_data.get('unit', '')}"],
        ]
        
        if job_data.get('actual_qty'):
            material_data.append([fix_hebrew('כמות בפועל:'), f"{job_data['actual_qty']} {job_data.get('unit', '')}"])
        
        material_table = Table(material_data, colWidths=[5*cm, 10*cm])
        material_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fef3c7')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(material_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Driver & Truck
        if job_data.get('driver_name') or job_data.get('truck_plate'):
            story.append(Paragraph(f"<b>{fix_hebrew('פרטי רכב:')}</b>", rtl_style))
            story.append(Spacer(1, 0.3*cm))
            
            vehicle_data = []
            if job_data.get('driver_name'):
                vehicle_data.append([fix_hebrew('נהג:'), job_data['driver_name']])
            if job_data.get('truck_plate'):
                vehicle_data.append([fix_hebrew('משאית:'), job_data['truck_plate']])
            
            vehicle_table = Table(vehicle_data, colWidths=[5*cm, 10*cm])
            vehicle_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(vehicle_table)
            story.append(Spacer(1, 0.8*cm))
        
        # Notes
        if job_data.get('notes'):
            story.append(Paragraph(f"<b>{fix_hebrew('הערות:')}</b>", rtl_style))
            story.append(Spacer(1, 0.3*cm))
            story.append(Paragraph(job_data['notes'], rtl_style))
            story.append(Spacer(1, 0.8*cm))
        
        # Signature section
        story.append(Spacer(1, 1*cm))
        signature_data = [
            [fix_hebrew('חתימת מקבל:'), '________________________', fix_hebrew('תאריך:'), '____________'],
        ]
        sig_table = Table(signature_data, colWidths=[3*cm, 5*cm, 2*cm, 3*cm])
        sig_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(sig_table)
        
        # Footer
        story.append(Spacer(1, 1*cm))
        footer_text = fix_hebrew(f"נוצר אוטומטית ב-TruckFlow • {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=8,
            fontName=FONT_NAME,
            textColor=colors.grey
        )
        story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
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
