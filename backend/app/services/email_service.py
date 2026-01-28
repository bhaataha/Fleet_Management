from email.message import EmailMessage
from typing import List, Optional, Tuple
import smtplib
import ssl


def send_email_smtp(
    smtp_settings: dict,
    to_email: str,
    subject: str,
    body: str,
    attachments: Optional[List[Tuple[str, bytes, str]]] = None,
) -> None:
    """
    Send an email via SMTP.

    smtp_settings keys:
      host, port, username, password, use_tls, use_ssl, from_email, from_name
    attachments: list of (filename, content_bytes, mime_type)
    """
    host = smtp_settings.get("host")
    port = smtp_settings.get("port")
    username = smtp_settings.get("username")
    password = smtp_settings.get("password")
    use_tls = smtp_settings.get("use_tls", True)
    use_ssl = smtp_settings.get("use_ssl", False)
    from_email = smtp_settings.get("from_email") or username
    from_name = smtp_settings.get("from_name")

    if not host or not port:
        raise ValueError("SMTP host/port are required")
    if not from_email:
        raise ValueError("SMTP from_email is required")

    msg = EmailMessage()
    msg["Subject"] = subject or ""
    msg["To"] = to_email
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg.set_content(body or "")

    for attachment in attachments or []:
        filename, data, mime_type = attachment
        if mime_type and "/" in mime_type:
            maintype, subtype = mime_type.split("/", 1)
        else:
            maintype, subtype = "application", "octet-stream"
        msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    context = ssl.create_default_context()

    if use_ssl:
        server = smtplib.SMTP_SSL(host, int(port), context=context, timeout=20)
    else:
        server = smtplib.SMTP(host, int(port), timeout=20)
        server.ehlo()
        if use_tls:
            server.starttls(context=context)
            server.ehlo()

    if username and password:
        server.login(username, password)

    server.send_message(msg)
    server.quit()