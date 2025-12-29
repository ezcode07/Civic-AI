# System Architecture

## 🏗 High-Level Overview

The application follows a modern client-server architecture, leveraging cloud services for scalability and AI capabilities.

```mermaid
graph TD
    Client[Next.js Frontend] -->|HTTP/REST| Server[FastAPI Backend]
    Server -->|Auth & Data| Supabase[Supabase (PostgreSQL + Auth)]
    Server -->|OCR| Tesseract[Tesseract OCR Engine]
    Server -->|AI Processing| OpenAI[OpenAI API]
    
    subgraph "Data Flow"
    Client -- Upload Image --> Server
    Server -- Extract Text --> Tesseract
    Server -- Analyze Text --> OpenAI
    Server -- Store Result --> Supabase
    end
```

## 🔧 Tech Stack

### Frontend
- **Framework**: Next.js 15 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks / Context
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **OCR**: Tesseract / Pillow
- **AI Integration**: OpenAI API (GPT-3.5/4)
- **Validation**: Pydantic

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for document images)
