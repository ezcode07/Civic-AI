from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables first
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow both localhost and 127.0.0.1
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Civic-AI Backend is running", "message": "API is ready to serve requests"}

class QueryRequest(BaseModel):
    question: str
    language: str = "en"

@app.post("/api/query")
def ask_ai(data: QueryRequest):
    """
    Process user queries about government schemes and services
    """
    # Enhanced response based on the question
    response_content = f"""# Government Information Response

## Your Question
{data.question}

## AI Analysis
Based on your query, I can help you understand government schemes, legal notices, and public services.

## Key Information
• Government schemes are designed to support citizens in various aspects of life
• Eligibility criteria vary by scheme and location
• Most applications can be submitted online through official portals
• Required documents typically include identity proof, address proof, and income certificates

## Next Steps
1. **Verify Eligibility**: Check if you meet the specific criteria for the scheme
2. **Gather Documents**: Collect all required documentation
3. **Apply Online**: Use official government portals when possible
4. **Track Status**: Monitor your application progress regularly

## Important Notes
• Always use official government websites for applications
• Beware of middlemen who may charge unnecessary fees
• Keep copies of all submitted documents
• Contact local government offices if you need assistance

**Language**: {data.language}
**Source**: Government of India Official Information

*This is a demonstration response. In production, this would connect to real government databases and AI models for accurate, up-to-date information.*"""

    return {
        "answer": response_content,
        "language": data.language,
        "timestamp": "2024-12-29T12:00:00Z",
        "status": "success"
    }
