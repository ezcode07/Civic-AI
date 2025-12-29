# User Flows

## 1. User Onboarding
1.  **Landing Page**: User visits the site and sees the value proposition.
2.  **Signup**: User enters email/password.
    *   *Backend Action*: Creates user in Supabase, auto-confirms email (Hackathon mode), logs user in.
3.  **Dashboard**: User is redirected to the main dashboard.

## 2. Document Analysis
1.  **Upload**: User clicks "Analyze Document" and uploads an image.
2.  **Processing**:
    *   Frontend sends image to Backend.
    *   Backend performs OCR to extract text.
    *   Backend sends text to AI for simplification.
3.  **Result**: User sees the extracted text and a simplified summary side-by-side.
4.  **Chat**: User can ask follow-up questions about the document.

## 3. Scheme Search
1.  **Query**: User types "schemes for farmers in Maharashtra".
2.  **Search**: Backend queries the vector database (future scope) or uses AI to fetch relevant info.
3.  **Results**: List of eligible schemes with application links is displayed.
