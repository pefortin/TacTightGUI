from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import subprocess
import datetime
import os
import shutil
from pydantic import BaseModel, Field
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import os
import logging
from dotenv import load_dotenv


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv("backend/.env")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
CORSMiddleware,
    allow_origins=[
        "*"  # Garde ceci en dernier recours
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)

# Set up rate limiting: 1 request per 20 seconds per client (by IP)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/")
async def root():
    return {"message": "Haptistrap API is running"}

@app.get("/generate-stl/")  # Ajouter cette route pour gérer les requêtes avec /api/
@limiter.limit("1/20 seconds")
async def generate_stl(
    request: Request,
    springThickness: float = Query(
        3.0, ge=3.0, le=5.0,
        description="Spring thickness (mm), must be between 3 and 5 inclusive"
    ),
    strapWidth: float = Query(
        26.0, ge=26.0,
        description="Strap width (mm), must be at least 26"
    ),
):

    if strapWidth < 26:
        raise HTTPException(status_code=400, detail="strapWidth must be at least 26 mm.")
    if springThickness < 3 or springThickness > 5:
        raise HTTPException(status_code=400, detail="springThickness must be between 3 and 5 mm.")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    # Répertoire de sortie temporaire
    output_dir = "/backend/output"
    
    # Créer le répertoire s'il n'existe pas
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"TacTight_{timestamp}.stl"
    output_path = os.path.join(output_dir, filename)

    # Créer aussi un répertoire local pour sauvegarder les copies
    local_save_dir = os.path.join(os.path.dirname(__file__), "generated_stl")
    os.makedirs(local_save_dir, exist_ok=True)
    local_save_path = os.path.join(local_save_dir, filename)

    scad_file = "TacTight.scad"
    cmd = [
        "openscad",
        "-o", output_path,
        f"-DspringThickness={springThickness}",
        f"-DstrapWidth={strapWidth}",
        scad_file,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"OpenSCAD error: {result.stderr}"
        )

    if not os.path.exists(output_path):
        raise HTTPException(
            status_code=500,
            detail="STL file was not generated"
        )

    # Sauvegarder une copie locale pour observation
    try:
        shutil.copy2(output_path, local_save_path)
        print(f"Copie sauvegardée localement : {local_save_path}")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde locale : {e}")
        # Ne pas interrompre le processus si la sauvegarde locale échoue

    return FileResponse(
        output_path, 
        filename=filename, 
        media_type='application/sla',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Contact form models
class ContactRequest(BaseModel):
    to: str = Field(..., description="Recipient email")
    from_email: str = Field(..., alias="from", description="Sender email")
    name: str = Field(..., min_length=1, max_length=100, description="Sender name")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    message: str = Field(..., min_length=10, max_length=5000, description="Email message")
    originalData: dict = Field(default={}, description="Original form data")

class ContactResponse(BaseModel):
    success: bool
    message: str
    timestamp: str

@app.post("/contact", response_model=ContactResponse)
async def send_contact_form(contact: ContactRequest):
    """
    Send contact form email to the specified recipient
    """
    try:
        logger.info(f"📧 Processing contact form from {contact.name} ({contact.from_email})")
        
        # Validate email addresses (basic validation)
        if not contact.from_email or "@" not in contact.from_email:
            raise HTTPException(status_code=400, detail="Invalid sender email address")
        
        if not contact.to or "@" not in contact.to:
            raise HTTPException(status_code=400, detail="Invalid recipient email address")
        
        # Create email content
        timestamp = datetime.now().isoformat()
        
        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: #6b8915; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .footer {{ padding: 10px; text-align: center; font-size: 12px; color: #666; }}
                .info-box {{ background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #6b8915; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>TacTight Contact Form</h2>
            </div>
            <div class="content">
                <div class="info-box">
                    <h3>Contact Information</h3>
                    <p><strong>Name:</strong> {contact.name}</p>
                    <p><strong>Email:</strong> {contact.from_email}</p>
                    <p><strong>Subject:</strong> {contact.subject}</p>
                    <p><strong>Date:</strong> {timestamp}</p>
                </div>
                
                <div class="info-box">
                    <h3>Message</h3>
                    <p>{contact.message.replace(chr(10), '<br>')}</p>
                </div>
            </div>
            <div class="footer">
                <p>This message was sent through the TacTight website contact form.</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        TacTight Contact Form Submission
        
        Name: {contact.name}
        Email: {contact.from_email}
        Subject: {contact.subject}
        Date: {timestamp}
        
        Message:
        {contact.message}
        
        ---
        This message was sent through the TacTight website contact form.
        """
        
        # Try to send email using different methods
        email_sent = False
        error_message = ""
        
        # Method 1: Try SMTP if configured
        try:
            smtp_server = os.getenv('SMTP_SERVER', 'smtp-mail.outlook.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_username = os.getenv('SMTP_USERNAME', '')
            smtp_password = os.getenv('SMTP_PASSWORD', '')
            
            if smtp_username and smtp_password:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"TacTight Contact: {contact.subject}"
                msg['From'] = smtp_username
                msg['To'] = contact.to
                msg['Reply-To'] = contact.from_email
                
                # Attach parts
                text_part = MIMEText(text_content, 'plain')
                html_part = MIMEText(html_content, 'html')
                
                msg.attach(text_part)
                msg.attach(html_part)
                
                # Send the email
                server = smtplib.SMTP(smtp_server, smtp_port)
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
                server.quit()
                
                email_sent = True
                logger.info(f"✅ Email sent successfully via SMTP to {contact.to}")
                
        except Exception as smtp_error:
            error_message = f"SMTP error: {str(smtp_error)}"
            logger.warning(f"⚠️ SMTP sending failed: {error_message}")
        
        # Method 2: Log to file as fallback (always do this for backup)
        try:
            log_dir = "contact_logs"
            os.makedirs(log_dir, exist_ok=True)
            
            log_filename = f"contact_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            log_path = os.path.join(log_dir, log_filename)
            
            with open(log_path, 'w', encoding='utf-8') as f:
                f.write("="*50 + "\n")
                f.write("TACTIGHT CONTACT FORM SUBMISSION\n")
                f.write("="*50 + "\n")
                f.write(f"Timestamp: {timestamp}\n")
                f.write(f"Name: {contact.name}\n")
                f.write(f"Email: {contact.from_email}\n")
                f.write(f"Subject: {contact.subject}\n")
                f.write(f"Recipient: {contact.to}\n")
                f.write("-"*30 + "\n")
                f.write("MESSAGE:\n")
                f.write("-"*30 + "\n")
                f.write(contact.message)
                f.write("\n" + "="*50 + "\n")
                
                if error_message:
                    f.write(f"EMAIL ERROR: {error_message}\n")
                    f.write("="*50 + "\n")
            
            logger.info(f"📝 Contact form logged to {log_path}")
            
        except Exception as log_error:
            logger.error(f"❌ Failed to log contact form: {log_error}")
        
        # Determine response
        if email_sent:
            return ContactResponse(
                success=True,
                message="Message sent successfully! We will get back to you soon.",
                timestamp=timestamp
            )
        else:
            # Email failed but we logged it
            logger.warning(f"📧 Email sending failed but contact form was logged: {error_message}")
            return ContactResponse(
                success=True,  # Still return success since we logged it
                message="Message received and logged. We will get back to you soon.",
                timestamp=timestamp
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Contact form error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process contact form: {str(e)}"
        )