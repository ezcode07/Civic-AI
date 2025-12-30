from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from typing import Optional
import logging
from PIL import Image
import io
import platform

# Load environment variables first
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Civic-AI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",os.getenv("CORS_ORIGIN")],
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

# Initialize Google Gemini
import google.generativeai as genai

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    try:
        genai.configure(api_key=gemini_api_key)
        logger.info("Google Gemini initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Google Gemini: {e}")
else:
    logger.warning("GEMINI_API_KEY not set. AI features will use fallback responses.")

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
    chat_id: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str

class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender: str
    content: str
    created_at: str

class OCRResponse(BaseModel):
    extracted_text: str
    ai_explanation: str
    language: str
    status: str
    chat_id: Optional[str] = None

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
    Generate AI response for government/legal text using Google Gemini
    """
    try:
        if gemini_api_key:
            # Use Gemini for responses - using gemini-1.5-flash for better performance
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            You are Civic-AI, an expert AI assistant dedicated to helping citizens understand government schemes, legal notices, and public services in India.
            
            Your task is to explain the following text in simple, clear, and easy-to-understand language.
            
            Input Text:
            "{text}"
            
            Response Guidelines:
            1. **Simplify**: Use plain language. Avoid complex legal or bureaucratic jargon.
            2. **Structure**: Use clear headings and bullet points.
            3. **Actionable**: Highlight what the user needs to do (e.g., deadlines, documents needed, where to apply).
            4. **Context**: Explain *why* this is important.
            5. **Language**: Respond in {language}. If the requested language is not supported, respond in English.
            
            Format your response in Markdown.
            """
            
            response = model.generate_content(prompt)
            return response.text
        else:
            logger.warning("Gemini API key missing during request. Using fallback.")
            # Fallback response without Gemini
            return generate_fallback_response(text, language)
    
    except Exception as e:
        logger.error(f"AI response generation error: {str(e)}")
        return generate_fallback_response(text, language)

def generate_fallback_response(text: str, language: str = "en") -> str:
    """
    Generate a fallback response when Gemini is not available
    """
    return f"""# Service Notice

**Note:** The AI processing service is currently unavailable (API Key missing or connection error). 

However, we have successfully received your input.

## Extracted/Received Text
> {text[:300]}{'...' if len(text) > 300 else ''}

## What you can do next:
1. **Review the text** above to ensure it was captured correctly.
2. **Try again later** when the AI service is restored.
3. **Consult official sources** for critical information.

*System Message: Please check the server logs and configuration.*
"""

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

# Chat Routes
@app.get("/api/chats", response_model=list[ChatResponse])
async def get_chats(current_user: dict = Depends(get_current_user)):
    """
    Get all chats for the current user
    """
    try:
        if supabase_admin:
            response = supabase_admin.table("chats").select("*").eq("user_id", current_user["id"]).order("updated_at", desc=True).execute()
        else:
            response = supabase.table("chats").select("*").eq("user_id", current_user["id"]).order("updated_at", desc=True).execute()
        
        return response.data
    except Exception as e:
        logger.error(f"Get chats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chats"
        )

@app.post("/api/chats", response_model=ChatResponse)
async def create_chat(current_user: dict = Depends(get_current_user)):
    """
    Create a new chat session
    """
    try:
        chat_data = {
            "user_id": current_user["id"],
            "title": "New Conversation"
        }
        
        if supabase_admin:
            response = supabase_admin.table("chats").insert(chat_data).execute()
        else:
            response = supabase.table("chats").insert(chat_data).execute()
            
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create chat")
            
        return response.data[0]
    except Exception as e:
        logger.error(f"Create chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat"
        )

@app.get("/api/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def get_chat_messages(chat_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all messages for a specific chat
    """
    try:
        # Verify chat ownership
        if supabase_admin:
            chat_check = supabase_admin.table("chats").select("id").eq("id", chat_id).eq("user_id", current_user["id"]).execute()
        else:
            chat_check = supabase.table("chats").select("id").eq("id", chat_id).eq("user_id", current_user["id"]).execute()
            
        if not chat_check.data:
            raise HTTPException(status_code=404, detail="Chat not found")

        if supabase_admin:
            response = supabase_admin.table("messages").select("*").eq("chat_id", chat_id).order("created_at", desc=False).execute()
        else:
            response = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at", desc=False).execute()
            
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch messages"
        )

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a specific chat and all its messages
    """
    try:
        # Verify chat ownership
        if supabase_admin:
            chat_check = supabase_admin.table("chats").select("id").eq("id", chat_id).eq("user_id", current_user["id"]).execute()
        else:
            chat_check = supabase.table("chats").select("id").eq("id", chat_id).eq("user_id", current_user["id"]).execute()
            
        if not chat_check.data:
            raise HTTPException(status_code=404, detail="Chat not found or access denied")

        # Delete chat (messages will cascade delete due to foreign key constraint)
        if supabase_admin:
            supabase_admin.table("chats").delete().eq("id", chat_id).execute()
        else:
            supabase.table("chats").delete().eq("id", chat_id).execute()
            
        return {"message": "Chat deleted successfully", "id": chat_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat"
        )

@app.post("/api/ocr", response_model=OCRResponse)
async def process_image_ocr(
    file: UploadFile = File(...),
    language: str = "en",
    chat_id: Optional[str] = None,
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
        
        # Create chat if not provided
        active_chat_id = chat_id
        if not active_chat_id:
            try:
                chat_data = {"user_id": current_user["id"], "title": "Image Analysis"}
                if supabase_admin:
                    chat_res = supabase_admin.table("chats").insert(chat_data).execute()
                else:
                    chat_res = supabase.table("chats").insert(chat_data).execute()
                if chat_res.data:
                    active_chat_id = chat_res.data[0]["id"]
            except Exception as e:
                logger.error(f"Failed to create auto-chat: {e}")

        # Process image with Gemini Vision
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            if gemini_api_key:
                # Use Gemini Vision for direct image analysis
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                prompt = f"""
                You are Civic-AI, an expert AI assistant.
                
                Please analyze this image of a government document or notice.
                
                Return a JSON response with two fields:
                1. "extracted_text": The full text extracted from the image.
                2. "explanation": A simple, clear explanation of what the document is about, including key actions, dates, or requirements.
                
                The "explanation" should be in {language} and formatted in Markdown.
                """
                
                response = model.generate_content([prompt, image], generation_config={"response_mime_type": "application/json"})
                
                try:
                    import json
                    response_data = json.loads(response.text)
                    extracted_text = response_data.get("extracted_text", "Text could not be extracted.")
                    ai_explanation = response_data.get("explanation", "Analysis could not be generated.")
                except Exception as json_error:
                    logger.error(f"JSON parsing error: {json_error}")
                    extracted_text = "Error parsing AI response."
                    ai_explanation = response.text # Fallback to raw text
            else:
                # Fallback if no API key
                extracted_text = "AI Service Unavailable"
                ai_explanation = "Please configure the GEMINI_API_KEY to enable image analysis."
            
            # Save messages to database if we have a chat_id
            if active_chat_id:
                try:
                    # Save User Message (Image + Extracted Text)
                    user_content = f"📷 **Image Uploaded:** {file.filename}\n\n**Extracted Text:**\n> {extracted_text[:500]}{'...' if len(extracted_text) > 500 else ''}"
                    
                    user_msg = {
                        "chat_id": active_chat_id,
                        "sender": "user",
                        "content": user_content
                    }
                    
                    # Save AI Message
                    ai_msg = {
                        "chat_id": active_chat_id,
                        "sender": "ai",
                        "content": ai_explanation
                    }
                    
                    if supabase_admin:
                        supabase_admin.table("messages").insert([user_msg, ai_msg]).execute()
                        # Update chat title based on first message if needed, or just update timestamp
                        supabase_admin.table("chats").update({"updated_at": "now()"}).eq("id", active_chat_id).execute()
                    else:
                        supabase.table("messages").insert([user_msg, ai_msg]).execute()
                        supabase.table("chats").update({"updated_at": "now()"}).eq("id", active_chat_id).execute()
                        
                except Exception as db_error:
                    logger.error(f"Failed to save messages: {db_error}")

            logger.info(f"Image processed successfully for user {current_user['id']}")
            
            return OCRResponse(
                extracted_text=extracted_text,
                ai_explanation=ai_explanation,
                language=language,
                status="success",
                chat_id=active_chat_id
            )
            
        except Exception as ocr_error:
            logger.error(f"Image processing error: {str(ocr_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process the image. Please ensure the image is clear."
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
        
        # Create chat if not provided
        active_chat_id = data.chat_id
        if not active_chat_id:
            try:
                # Generate a title from the first few words of the question
                title = " ".join(data.question.split()[:5]) + "..."
                chat_data = {"user_id": current_user["id"], "title": title}
                
                if supabase_admin:
                    chat_res = supabase_admin.table("chats").insert(chat_data).execute()
                else:
                    chat_res = supabase.table("chats").insert(chat_data).execute()
                    
                if chat_res.data:
                    active_chat_id = chat_res.data[0]["id"]
            except Exception as e:
                logger.error(f"Failed to create auto-chat: {e}")

        # Generate AI response
        ai_response = generate_ai_response(data.question, data.language)
        
        # Save messages to database if we have a chat_id
        if active_chat_id:
            try:
                # Save User Message
                user_msg = {
                    "chat_id": active_chat_id,
                    "sender": "user",
                    "content": data.question
                }
                
                # Save AI Message
                ai_msg = {
                    "chat_id": active_chat_id,
                    "sender": "ai",
                    "content": ai_response
                }
                
                if supabase_admin:
                    supabase_admin.table("messages").insert([user_msg, ai_msg]).execute()
                    supabase_admin.table("chats").update({"updated_at": "now()"}).eq("id", active_chat_id).execute()
                else:
                    supabase.table("messages").insert([user_msg, ai_msg]).execute()
                    supabase.table("chats").update({"updated_at": "now()"}).eq("id", active_chat_id).execute()
                    
            except Exception as db_error:
                logger.error(f"Failed to save messages: {db_error}")
        
        logger.info(f"Query processed successfully for user {current_user['id']}")
        
        return {
            "answer": ai_response,
            "language": data.language,
            "user_id": current_user["id"],
            "chat_id": active_chat_id,
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

CREATE TABLE chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for chats and messages
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can access their own chats" ON chats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access messages in their chats" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );
"""
