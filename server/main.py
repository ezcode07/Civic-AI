from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional
import logging
import pytesseract
from PIL import Image
import io

# Load environment variables first
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Civic-AI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_anon_key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_anon_key)

# Initialize Supabase Admin client (for bypassing RLS)
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_admin: Optional[Client] = None

if supabase_service_role_key:
    try:
        supabase_admin = create_client(supabase_url, supabase_service_role_key)
        logger.info("Supabase Admin client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase Admin client: {e}")
else:
    logger.warning("SUPABASE_SERVICE_ROLE_KEY not set. Admin operations may fail due to RLS.")

# Initialize OpenAI (optional - for better AI responses)
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_client = None
if openai_api_key:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
    except ImportError:
        logger.warning("OpenAI package not installed. Using fallback responses.")

# Security
security = HTTPBearer()

# Pydantic Models
class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user: dict
    message: str

class ErrorResponse(BaseModel):
    error: str
    message: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class QueryRequest(BaseModel):
    question: str
    language: str = "en"

class OCRResponse(BaseModel):
    extracted_text: str
    ai_explanation: str
    language: str
    status: str

# Auth Helper Functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate JWT token and return current user
    """
    try:
        # Get user from Supabase using the token
        user_response = supabase.auth.get_user(credentials.credentials)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user profile from database
        if supabase_admin:
            profile_response = supabase_admin.table("users").select("*").eq("id", user_response.user.id).execute()
        else:
            profile_response = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return profile_response.data[0]
    
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# AI Helper Functions
def generate_ai_response(text: str, language: str = "en") -> str:
    """
    Generate AI response for government/legal text
    """
    try:
        if openai_client:
            # Use OpenAI for better responses
            prompt = f"""
            You are Civic-AI, an AI assistant that helps citizens understand government schemes, legal notices, and public services in India.
            
            Please explain the following text in simple, easy-to-understand language:
            
            Text: {text}
            
            Instructions:
            - Use simple language that a common citizen can understand
            - Use bullet points for key information
            - Avoid legal jargon
            - Focus on practical implications
            - If it's about a government scheme, mention eligibility and how to apply
            - If it's a legal notice, explain what it means for the citizen
            - Keep the response helpful and actionable
            - Respond in {language} if possible, otherwise in English
            """
            
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        else:
            # Fallback response without OpenAI
            return generate_fallback_response(text, language)
    
    except Exception as e:
        logger.error(f"AI response generation error: {str(e)}")
        return generate_fallback_response(text, language)

def generate_fallback_response(text: str, language: str = "en") -> str:
    """
    Generate a fallback response when OpenAI is not available
    """
    return f"""# Document Analysis

## Extracted Text
{text[:500]}{'...' if len(text) > 500 else ''}

## AI Analysis
I've extracted the text from your document. Here's what I can help you understand:

## Key Points
• This appears to be a government or legal document
• The text contains important information that may affect your rights or benefits
• You may need to take specific actions based on this document

## Recommendations
1. **Read Carefully**: Review all the details in the extracted text
2. **Check Deadlines**: Look for any important dates or deadlines
3. **Verify Eligibility**: If this is about a scheme or benefit, check if you qualify
4. **Seek Help**: Contact local government offices if you need clarification
5. **Keep Records**: Save a copy of this document for your records

## Next Steps
• Visit the relevant government website for more information
• Contact the issuing authority if you have questions
• Apply for benefits or respond to notices as required

**Language**: {language}
**Source**: Document Analysis by Civic-AI

*For more detailed analysis, please ensure all text is clearly visible in the uploaded image.*"""

# Routes
@app.get("/")
def root():
    return {"status": "Civic-AI Backend is running", "message": "API is ready to serve requests"}

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """
    Create a new user account
    """
    try:
        # Create user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
            
        # Auto-confirm email if admin client is available (Hackathon mode)
        session = auth_response.session
        if supabase_admin:
            try:
                logger.info(f"Auto-confirming email for user {auth_response.user.id}")
                supabase_admin.auth.admin.update_user_by_id(
                    auth_response.user.id,
                    {"email_confirm": True}
                )
                
                # If session is missing (due to email confirmation requirement), try to login now
                if not session:
                    # Login to get the session
                    login_response = supabase.auth.sign_in_with_password({
                        "email": request.email,
                        "password": request.password
                    })
                    session = login_response.session
            except Exception as e:
                logger.warning(f"Failed to auto-confirm email or login: {e}")
        
        # Store user profile in database
        user_data = {
            "id": auth_response.user.id,
            "name": request.name,
            "email": request.email
        }
        
        # Use admin client if available to bypass RLS
        if supabase_admin:
            profile_response = supabase_admin.table("users").insert(user_data).execute()
        else:
            # Fallback to anon client (will likely fail with RLS)
            logger.warning("Using anon client for user profile creation. This may fail due to RLS.")
            profile_response = supabase.table("users").insert(user_data).execute()
        
        if not profile_response.data:
            # If profile creation fails, we should ideally clean up the auth user
            logger.error("Failed to create user profile")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        return AuthResponse(
            access_token=session.access_token if session else "",
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": request.name
            },
            message="Account created successfully"
        )
    
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        if "already registered" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return access token
    """
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get user profile
        if supabase_admin:
            profile_response = supabase_admin.table("users").select("*").eq("id", auth_response.user.id).execute()
        else:
            profile_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        user_profile = profile_response.data[0] if profile_response.data else {}
        
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": user_profile.get("name", "")
            },
            message="Login successful"
        )
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        if "invalid" in str(e).lower() or "credentials" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user details
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

@app.post("/api/ocr", response_model=OCRResponse)
async def process_image_ocr(
    file: UploadFile = File(...),
    language: str = "en",
    current_user: dict = Depends(get_current_user)
):
    """
    Extract text from uploaded image using OCR and provide AI explanation
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please upload a valid image file (PNG, JPG, JPEG)"
            )
        
        # Read image file
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )
        
        # Process image with OCR
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Extract text using pytesseract
            extracted_text = pytesseract.image_to_string(image, lang='eng')
            
            if not extracted_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No text could be extracted from the image. Please ensure the image contains clear, readable text."
                )
            
            # Generate AI explanation
            ai_explanation = generate_ai_response(extracted_text, language)
            
            logger.info(f"OCR processed successfully for user {current_user['id']}")
            
            return OCRResponse(
                extracted_text=extracted_text.strip(),
                ai_explanation=ai_explanation,
                language=language,
                status="success"
            )
            
        except Exception as ocr_error:
            logger.error(f"OCR processing error: {str(ocr_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process the image. Please ensure the image is clear and contains readable text."
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process the uploaded image"
        )

@app.post("/api/query")
async def ask_ai(data: QueryRequest, current_user: dict = Depends(get_current_user)):
    """
    Process user text queries about government schemes and services (Protected Route)
    """
    try:
        if not data.question.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question cannot be empty"
            )
        
        # Generate AI response
        ai_response = generate_ai_response(data.question, data.language)
        
        logger.info(f"Query processed successfully for user {current_user['id']}")
        
        return {
            "answer": ai_response,
            "language": data.language,
            "user_id": current_user["id"],
            "timestamp": "2024-12-29T12:00:00Z",
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process your query"
        )

# Health check endpoint (public)
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": "2024-12-29T12:00:00Z"}

"""
SQL for creating the users table in Supabase:

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own data
CREATE POLICY "Users can only access their own data" ON users
    FOR ALL USING (auth.uid() = id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""
