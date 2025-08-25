import smtplib
from socket import gaierror
from email.mime.text import MIMEText
import ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
import logging
import os
from datetime import datetime
from dotenv import load_dotenv
from app.utils.geolocation import get_geolocation
 
load_dotenv()

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

SMTP_SERVER  = os.getenv('SMTP_SERVER')
SMTP_LOGIN   = os.getenv('SMTP_LOGIN')
SMTP_PASSWD  = os.getenv('SMTP_PASSWD')
REACT_APP_URL = os.getenv('REACT_APP_URL')
API_VERSION_STR = os.getenv('API_VERSION_STR')


def email_results(receiver, the_file, message_text=None):
    index_of_sep = the_file.rfind(os.path.sep)
    filename = the_file[index_of_sep + 1:-4]

    subject = 'AI Researchers Results'
    sender = "dphiggins@gmail.com"
    if not message_text:
        message_text = """
        Please find attached your research results.

        We would appreciate any feedback on your experience.

        Thank you for being a beta tester!
        """
    message = construct_message_with_attachment(subject, sender, receiver, message_text, the_file)
    send_message_ssl(sender, receiver, message)

def send_email_verification(receiver, verification_token, first_name):
    subject = 'Please Verify your email'
    sender = "judging_app@gmail.com"
    redirect_url = f"{REACT_APP_URL}/verify/{verification_token}"
    
    message_html = VERIFICATION_MESSAGE.format(first_name=first_name, redirect_url=redirect_url)
    
    message = construct_message_with_html(subject, sender, receiver, message_html=message_html)
    send_message_ssl(sender, receiver, message)

def send_magic_link(receiver, verification_token, first_name):
    subject = 'Please Verify your email'
    sender = "judging_app@gmail.com"
    redirect_url = f"{REACT_APP_URL}/verify/{verification_token}"
    
    message_html = MAGIC_LINK_MESSAGE.format(first_name=first_name, redirect_url=redirect_url)
    
    message = construct_message_with_html(subject, sender, receiver, message_html=message_html)
    send_message_ssl(sender, receiver, message)

def reset_password_email(receiver, verification_token, first_name, reqesting_ip):
    now = datetime.now()
    request_time = now.strftime("%b %d %Y %I:%M:%S %p")
    geolocation = get_geolocation(reqesting_ip)
        
    subject = 'Reset Password Request'
    sender = "llm_researcher@gmail.com"
    
    message_html = f"""
    <html>
    <style>
        .container {{
            display: table;
            width: 100%;
            border-collapse: collapse;
        }}

        .row {{
            display: table-row;
        }}

        .cell {{
            display: table-cell;
            padding: 8px;
            border: 1px solid #ccc;
        }}

        .label {{
            font-weight: bold;
        }}
    </style>
        <body>
            <h1>Reset your password</h1>
            <p>Dear { first_name },</p>
            <p>You are receiving this email as there has been a request to reset your password.</p>
            <div>
                <a href="{REDIRECT_URL}/reset-password/{verification_token}" target="_blank">
                <button style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    Reset Password
                </button>
                </a>
            </div>
            <div>
            <p>The request came from the following location. If this was not you, you can safely ignore this email.</p>
            </div>
            <div class="container">
                <div class="row">
                    <div class="cell label">IP</div>
                    <div class="cell value">{reqesting_ip}</div>
                </div>
                <div class="row">
                    <div class="cell label">Time</div>
                    <div class="cell value">{request_time}</div>
                </div>
                <div class="row">
                    <div class="cell label">City</div>
                    <div class="cell value">{geolocation['city']}</div>
                </div>
                <div class="row">
                    <div class="cell label">Region</div>
                    <div class="cell value">{geolocation['region']}</div>
                </div>
                <div class="row">
                    <div class="cell label">Country</div>
                    <div class="cell value">{geolocation['country']}</div>
                </div>
            </div>
            <p>Thanks,</p>
            <p>Dan</p>
        </body>
    </html>
    """
    message = construct_message_with_html(subject, sender, receiver, message_html=message_html)
    send_message_ssl(sender, receiver, message)

def construct_message_with_html(subject, sender, receiver, message_text=None, message_html=None):
    the_message = MIMEMultipart()
    the_message['Subject'] = subject
    the_message['To'] = receiver
    the_message['From'] = sender
    the_message.preamble = 'I am not using a MIME-aware mail reader.\n'

    if message_text:
        the_message.attach(MIMEText(message_text, "plain"))
    if message_html:
        the_message.attach(MIMEText(message_html, "html"))

    return the_message.as_string()


def construct_message_with_attachment(subject, sender, receiver, message_text, the_file):
    zip_file = open(the_file, 'rb')
    the_message = MIMEMultipart()
    the_message['Subject'] = subject
    the_message['To'] = receiver
    the_message['From'] = sender
    the_message.preamble = 'I am not using a MIME-aware mail reader.\n'

    the_message.attach(MIMEText(message_text, "plain"))

    msg = MIMEBase('application', 'zip')
    msg.set_payload(zip_file.read())
    encoders.encode_base64(msg)

    index_of_sep = the_file.rfind(os.path.sep)
    msg.add_header('Content-Disposition', 'attachment', filename=the_file[index_of_sep+1:])
    the_message.attach(msg)
    return the_message.as_string()


def send_message(sender, receiver, message):
    try:
        port = 587
        with smtplib.SMTP(SMTP_SERVER, port) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_LOGIN, SMTP_PASSWD)
            server.sendmail(sender, receiver, message)
    except (gaierror, ConnectionRefusedError):
        logging.debug("Failed to connect to the server. Bad connection settings?")
    except smtplib.SMTPServerDisconnected:
        logging.debug("Failed to connect to the server. Wrong user/password?")
    except smtplib.SMTPException as e:
        logging.debug("SMTP error occurred: {}".format(str(e)))
    else:
        logging.debug("SMTP sent to: {}".format(receiver))


def send_message_ssl(sender, receiver, message):
    try:
        port = 465
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, port, context=context) as server:
            server.login(SMTP_LOGIN, SMTP_PASSWD)
            server.sendmail(sender, receiver, message)
    except (gaierror, ConnectionRefusedError):
        logging.debug("Failed to connect to the server. Bad connection settings?")
    except smtplib.SMTPServerDisconnected:
        logging.debug("Failed to connect to the server. Wrong user/password?")
    except smtplib.SMTPException as e:
        logging.debug("SMTP error occurred: {}".format(str(e)))
    else:
        logging.debug("SMTP sent to: {}".format(receiver))


VERIFICATION_MESSAGE = """
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 30px;">
      
      <!-- Header / Logo -->
      <h1 style="color:#09a1ec; text-align: center;">Welcome to Judging App!</h1>

      <!-- Greeting -->
      <p>Dear {first_name},</p>

      <!-- Welcome message -->
      <p>
        We’re thrilled to have you join us! 
        To get started, please verify your email by clicking the button below.
      </p>

      <!-- Call-to-action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{redirect_url}" target="_blank" 
           style="display: inline-block; background-color: #09a1ec; color: white; text-decoration: none; 
                  padding: 12px 25px; border-radius: 5px; font-weight: bold;">
          Verify Email
        </a>
      </div>

      <!-- Fallback link -->
      <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
      <p style="word-break: break-all;">
        <a href="{redirect_url}" style="color:#09a1ec;">{redirect_url}</a>
      </p>

      <!-- Closing / signature -->
      <p>
        Once verified, you can start creating and managing events.
      </p>

      <p>Best regards,<br>Dan</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <!-- Footer / support -->
      <p style="font-size: 12px; color: #999; text-align: center;">
        If you did not sign up for this account, please ignore this email or contact our support team.
      </p>

    </div>
  </body>
</html>
"""

MAGIC_LINK_MESSAGE = """
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 30px;">
      
      <!-- Header / Logo -->
      <h1 style="color:#09a1ec; text-align: center;">Welcome to MAGIC LINK for the Judging App!</h1>

      <!-- Greeting -->
      <p>Dear {first_name},</p>

      <!-- Welcome message -->
      <p>
        ✨ Your Magic Link is ready! Click it to instantly regain full access. 
        And for the next 15 minutes, you can even update your password without any extra steps.
      </p>

      <!-- Call-to-action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{redirect_url}" target="_blank" 
           style="display: inline-block; background-color: #09a1ec; color: white; text-decoration: none; 
                  padding: 12px 25px; border-radius: 5px; font-weight: bold;">
          Get Connected Now
        </a>
      </div>

      <!-- Fallback link -->
      <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
      <p style="word-break: break-all;">
        <a href="{redirect_url}" style="color:#09a1ec;">{redirect_url}</a>
      </p>

      <!-- Closing / signature -->
      <p>
        Once verified, you can start creating and managing events.
      </p>

      <p>Best regards,<br>Dan</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <!-- Footer / support -->
      <p style="font-size: 12px; color: #999; text-align: center;">
        If you did not request this link, please ignore this email or contact our support team.
      </p>

    </div>
  </body>
</html>
"""
