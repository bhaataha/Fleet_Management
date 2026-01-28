"""
PDF Generator for Delivery Notes and Job Reports
תעודות משלוח וסיכומי עבודה
"""
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, Optional
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
        
        # Page number
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont(FONT_NAME, 8)
        page_text = fix_hebrew(f"עמוד {self._pageNumber} מתוך {page_count}")
        self.drawString(2*cm, 0.7*cm, page_text)
        
        self.restoreState()


class StatementCanvas(canvas.Canvas):
    """Canvas for statement PDF with org header and TruckFlow footer"""

    def __init__(self, org_info: Dict[str, Any], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.org_info = org_info or {}

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

    def _resolve_logo_path(self, logo_url: Optional[str]) -> Optional[str]:
        if not logo_url:
            return None
        if logo_url.startswith('/uploads/'):
            return f"/app{logo_url}"
        return None

    def draw_page_decorations(self, page_count: int):
        self.saveState()

        page_width, page_height = self._pagesize

        # Header background (light)
        self.setFillColor(colors.HexColor('#f8fafc'))
        self.rect(0, page_height - 2.2*cm, page_width, 2.2*cm, fill=1, stroke=0)

        # Header line
        self.setStrokeColor(colors.HexColor('#e5e7eb'))
        self.setLineWidth(1)
        self.line(2*cm, page_height - 2.2*cm, page_width - 2*cm, page_height - 2.2*cm)

        # Logo (left)
        logo_url = self.org_info.get('logo_url')
        logo_path = self._resolve_logo_path(logo_url)
        if logo_path and os.path.exists(logo_path):
            try:
                img = ImageReader(logo_path)
                self.drawImage(img, 2*cm, page_height - 1.9*cm, width=3*cm, height=1.4*cm, preserveAspectRatio=True, mask='auto')
            except Exception:
                pass

        # Org name and email (right)
        org_name = self.org_info.get('org_name') or ""
        org_email = self.org_info.get('org_email') or ""
        org_phone = self.org_info.get('org_phone') or ""
        org_vat = self.org_info.get('org_vat') or ""
        self.setFillColor(colors.HexColor('#111827'))
        self.setFont(FONT_NAME, 14)
        self.drawRightString(page_width - 2*cm, page_height - 1.1*cm, fix_hebrew(org_name))
        details = []
        if org_email:
            details.append(org_email)
        if org_phone:
            details.append(f"{fix_hebrew('טל')}: {org_phone}")
        if org_vat:
            details.append(f"{fix_hebrew('ח.פ')}: {org_vat}")

        if details:
            self.setFont(FONT_NAME, 9)
            self.setFillColor(colors.HexColor('#6b7280'))
            self.drawRightString(page_width - 2*cm, page_height - 1.6*cm, " | ".join(details))

        # Footer
        self.setFillColor(colors.HexColor('#f3f4f6'))
        self.rect(0, 0, page_width, 2.6*cm, fill=1, stroke=0)

        self.setStrokeColor(colors.HexColor('#e5e7eb'))
        self.setLineWidth(1)
        self.line(2*cm, 2.5*cm, page_width - 2*cm, 2.5*cm)

        # TruckFlow brand (left)
        self.setFillColor(colors.HexColor('#1e40af'))
        self.setFont(FONT_NAME, 11)
        self.drawString(2*cm, 1.7*cm, "TruckFlow")
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont(FONT_NAME, 8)
        self.drawString(2*cm, 1.2*cm, "FLEET MANAGEMENT")

        # Footer details (right)
        self.setFillColor(colors.HexColor('#6b7280'))
        self.setFont(FONT_NAME, 8)
        self.drawRightString(page_width - 2*cm, 1.9*cm, fix_hebrew("© 2026 TruckFlow. כל הזכויות שמורות."))
        self.drawRightString(page_width - 2*cm, 1.3*cm, fix_hebrew("פותח ונבנה על ידי נינגה תקשורת והנדסה"))
        self.drawRightString(page_width - 2*cm, 0.9*cm, fix_hebrew("054-774-8823"))

        # Page number
        self.setFont(FONT_NAME, 8)
        page_text = fix_hebrew(f"עמוד {self._pageNumber} מתוך {page_count}")
        self.drawRightString(page_width - 2*cm, 0.4*cm, page_text)

        self.restoreState()


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float)):
        return str(value)
    return str(value)


def generate_simple_report_pdf(
    title: str,
    subtitle: str,
    headers: list,
    rows: list,
    org_info: Optional[Dict[str, Any]] = None,
) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2.5*cm, bottomMargin=2.5*cm)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='HebrewTitle', fontName=FONT_NAME, fontSize=18, alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle(name='HebrewSubtitle', fontName=FONT_NAME, fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor('#6b7280'), spaceAfter=10))
    styles.add(ParagraphStyle(name='HebrewCell', fontName=FONT_NAME, fontSize=9, alignment=TA_RIGHT))

    elements = []
    elements.append(Paragraph(fix_hebrew(title), styles['HebrewTitle']))
    if subtitle:
        elements.append(Paragraph(fix_hebrew(subtitle), styles['HebrewSubtitle']))

    table_data = []
    table_data.append([fix_hebrew(_normalize_text(h)) for h in headers])
    for row in rows:
        table_data.append([fix_hebrew(_normalize_text(cell)) for cell in row])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


class CustomerReportPDF:
    def generate(self, payload: Dict[str, Any], org_info: Optional[Dict[str, Any]] = None) -> BytesIO:
        title = "דוח לקוח"
        subtitle = f"{payload.get('customer_name', '')} | {payload.get('period_from', '')} - {payload.get('period_to', '')}"
        headers = ["תאריך", "נסיעה #", "מאתר", "לאתר", "חומר", "כמות", "יחידה", "מחיר יחידה", "סה\"כ"]
        rows = [
            [
                line.get('date', ''),
                line.get('job_id', ''),
                line.get('from_site', ''),
                line.get('to_site', ''),
                line.get('material', ''),
                line.get('quantity', ''),
                translate_unit(line.get('unit', '')),
                line.get('unit_price', ''),
                line.get('total', '')
            ]
            for line in payload.get('lines', [])
        ]
        return generate_simple_report_pdf(title, subtitle, headers, rows, org_info)


class ARAgingPDF:
    def generate(self, payload: Dict[str, Any], org_info: Optional[Dict[str, Any]] = None) -> BytesIO:
        title = "דוח חובות לקוחות"
        subtitle = f"נכון ליום: {payload.get('as_of_date', '')}"
        headers = ["לקוח", "0-30", "31-60", "61-90", "90+", "סה\"כ"]
        rows = [
            [
                line.get('customer', ''),
                line.get('current', ''),
                line.get('days_30', ''),
                line.get('days_60', ''),
                line.get('days_90', ''),
                line.get('total', '')
            ]
            for line in payload.get('lines', [])
        ]
        return generate_simple_report_pdf(title, subtitle, headers, rows, org_info)


class DailyJobsPDF:
    def generate(self, payload: Dict[str, Any], org_info: Optional[Dict[str, Any]] = None) -> BytesIO:
        title = "דוח נסיעות יומי"
        subtitle = f"תאריך: {payload.get('date', '')}"
        headers = ["נסיעה #", "לקוח", "נהג", "משאית", "מאתר", "לאתר", "חומר", "כמות", "יחידה", "סטטוס"]
        rows = [
            [
                line.get('job_id', ''),
                line.get('customer', ''),
                line.get('driver', ''),
                line.get('truck', ''),
                line.get('from_site', ''),
                line.get('to_site', ''),
                line.get('material', ''),
                line.get('quantity', ''),
                translate_unit(line.get('unit', '')),
                line.get('status', '')
            ]
            for line in payload.get('lines', [])
        ]
        return generate_simple_report_pdf(title, subtitle, headers, rows, org_info)


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

        # Document Info (professional header box)
        issue_date = datetime.now().strftime('%d/%m/%Y %H:%M')
        doc_number = f"DN-{job_data.get('id', 'N/A')}"
        doc_info = [
            [fix_hebrew('מספר תעודה'), doc_number, fix_hebrew('תאריך הנפקה'), issue_date],
            [fix_hebrew('מספר נסיעה'), f"#{job_data.get('id', 'N/A')}", fix_hebrew('סטטוס'), self._get_status_hebrew(job_data.get('status', 'unknown'))],
        ]
        doc_table = Table(doc_info, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
        doc_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#eef2ff')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#eef2ff')),
            ('GRID', (0, 0), (-1, -1), 0.75, colors.HexColor('#c7d2fe')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#1e40af')),
        ]))
        story.append(doc_table)
        story.append(Spacer(1, 0.7*cm))
        
        # Job Info Table with enhanced styling
        job_info = []
        
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
        if job_info:
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
            [fix_hebrew('שם המקבל:'), '________________________', fix_hebrew('חתימת מקבל:'), '________________________'],
            [fix_hebrew('תאריך:'), '____________', fix_hebrew('חותמת:'), '____________'],
        ]
        sig_table = Table(signature_data, colWidths=[3*cm, 6.5*cm, 3*cm, 4.5*cm])
        sig_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#1e40af')),
            ('PADDING', (0, 0), (-1, -1), 6),
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


class StatementPDF:
    """Generate professional monthly statement PDF"""

    def __init__(self):
        self.buffer = BytesIO()
        self.pagesize = A4
        self.width, self.height = self.pagesize

    def generate(self, statement_data: Dict[str, Any]) -> BytesIO:
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=3.2*cm,
            bottomMargin=3.2*cm
        )

        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=21,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=10,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12,
        )

        section_style = ParagraphStyle(
            'Section',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=12,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            spaceBefore=10,
        )

        story.append(Paragraph(fix_hebrew('סיכום חודשי ללקוח'), title_style))
        story.append(Paragraph(fix_hebrew('דוח חיוב מרכזי לתקופה'), subtitle_style))

        # Statement header
        info = [
            [fix_hebrew('מספר סיכום'), statement_data.get('number', ''), fix_hebrew('תאריך הפקה'), statement_data.get('issued_at', '')],
            [fix_hebrew('לקוח'), fix_hebrew(statement_data.get('customer_name', '')),
             fix_hebrew('תקופה'), statement_data.get('period', '')],
        ]
        info_table = Table(info, colWidths=[3.4*cm, 6.2*cm, 3.4*cm, 4.2*cm])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#1e40af')),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.6*cm))

        # Summary totals
        story.append(Paragraph(fix_hebrew('סיכום'), section_style))
        totals = [
            [fix_hebrew('סה"כ לפני מע"מ'), statement_data.get('subtotal', ''),
             fix_hebrew('מע"מ'), statement_data.get('tax', '')],
            [fix_hebrew('סה"כ לתשלום'), statement_data.get('total', ''),
             fix_hebrew('יתרה'), statement_data.get('balance', '')],
        ]
        totals_table = Table(totals, colWidths=[3.4*cm, 6.2*cm, 3.4*cm, 4.2*cm])
        totals_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf3')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bbf7d0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#166534')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#166534')),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 0.6*cm))

        # Lines table
        story.append(Paragraph(fix_hebrew('פירוט נסיעות'), section_style))
        header = [
            fix_hebrew('סה"כ'),
            fix_hebrew('מחיר יחידה'),
            fix_hebrew('כמות'),
            fix_hebrew('משאית'),
            fix_hebrew('חומר'),
            fix_hebrew('נסיעה #'),
        ]
        rows = [header]
        for line in statement_data.get('lines', []):
            rows.append([
                str(line.get('total', '')),
                str(line.get('unit_price', '')),
                str(line.get('qty', '')),
                fix_hebrew(line.get('truck_plate') or '-'),
                fix_hebrew(line.get('material_name') or '-'),
                f"#{line.get('job_id', '')}",
            ])

        lines_table = Table(rows, colWidths=[2.8*cm, 2.6*cm, 2.2*cm, 3*cm, 4.2*cm, 2.1*cm])
        lines_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 9),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        story.append(lines_table)

        org_info = {
            "org_name": statement_data.get('org_name'),
            "org_email": statement_data.get('org_email'),
            "org_phone": statement_data.get('org_phone'),
            "org_vat": statement_data.get('org_vat'),
            "logo_url": statement_data.get('logo_url'),
        }

        def _canvasmaker(*args, **kwargs):
            return StatementCanvas(org_info, *args, **kwargs)

        doc.build(story, canvasmaker=_canvasmaker)
        self.buffer.seek(0)
        return self.buffer


class SubcontractorPaymentPDF:
    """Generate subcontractor payment report PDF"""

    def __init__(self):
        self.buffer = BytesIO()
        self.pagesize = landscape(A4)
        self.width, self.height = self.pagesize

    def generate(self, report_data: Dict[str, Any], org_info: Dict[str, Any]) -> BytesIO:
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=3.0*cm,
            bottomMargin=3.0*cm
        )

        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=20,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontSize=10,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12,
        )

        section_style = ParagraphStyle(
            'Section',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=12,
            fontName=FONT_NAME,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            spaceBefore=10,
        )

        story.append(Paragraph(fix_hebrew('דוח תשלום לקבלן משנה'), title_style))
        story.append(Paragraph(fix_hebrew('חישוב תשלום לפי נסיעות ומחירון'), subtitle_style))

        info = [
            [fix_hebrew('קבלן'), fix_hebrew(report_data.get('subcontractor_name', '')),
             fix_hebrew('טלפון'), fix_hebrew(report_data.get('subcontractor_phone', '') or '-')],
            [fix_hebrew('משאית'), fix_hebrew(report_data.get('subcontractor_plate', '') or '-'),
             fix_hebrew('תקופה'), f"{report_data.get('period_from', '')} - {report_data.get('period_to', '')}"],
            [fix_hebrew('תאריך הפקה'), report_data.get('generated_at', ''), '', '']
        ]
        info_table = Table(info, colWidths=[3.2*cm, 6.2*cm, 3.2*cm, 4.4*cm])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#1e40af')),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.6*cm))

        totals = report_data.get('totals', {})
        totals_table = Table([
            [fix_hebrew('סה"כ נסיעות'), totals.get('total_jobs', '0'), fix_hebrew('סה"כ כמות'), totals.get('total_quantity', '0')],
            [fix_hebrew('סה"כ לתשלום'), totals.get('total_amount', '0'), '', '']
        ], colWidths=[3.2*cm, 6.2*cm, 3.2*cm, 4.4*cm])
        totals_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 10),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf3')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bbf7d0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#166534')),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 0.6*cm))

        story.append(Paragraph(fix_hebrew('פירוט נסיעות'), section_style))
        header = [
            fix_hebrew('סה"כ'),
            fix_hebrew('יחידת חיוב'),
            fix_hebrew('כמות'),
            fix_hebrew('חומר'),
            fix_hebrew('לאתר'),
            fix_hebrew('מאתר'),
            fix_hebrew('לקוח'),
            fix_hebrew('נסיעה #'),
            fix_hebrew('תאריך'),
        ]
        rows = [header]
        for line in report_data.get('lines', []):
            rows.append([
                line.get('price', ''),
                fix_hebrew(line.get('unit', '') or '-'),
                line.get('quantity', ''),
                fix_hebrew(translate_unit(line.get('unit')) if line.get('unit') else '-'),
                fix_hebrew(line.get('material') or '-'),
                fix_hebrew(line.get('to_site') or '-'),
                fix_hebrew(line.get('from_site') or '-'),
                fix_hebrew(line.get('customer') or '-'),
                f"#{line.get('job_id', '')}",
                line.get('date', ''),
            ])

        lines_table = Table(rows, colWidths=[2.2*cm, 2.0*cm, 1.7*cm, 3.0*cm, 3.1*cm, 3.1*cm, 3.0*cm, 1.9*cm, 2.0*cm])
        lines_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), FONT_NAME, 7),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        story.append(lines_table)

        def _canvasmaker(*args, **kwargs):
            return StatementCanvas(org_info, *args, **kwargs)

        doc.build(story, canvasmaker=_canvasmaker)
        self.buffer.seek(0)
        return self.buffer
