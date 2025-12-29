# Risks and Mitigations

## 1. AI Hallucinations
**Risk**: The AI might provide incorrect legal advice or misinterpret a document.
**Mitigation**: 
- Display a prominent disclaimer: "Information provided by AI. Please verify with official sources."
- Use "Grounding" techniques (RAG) to restrict AI answers to the provided text only.
- Implement a feedback loop where users can report incorrect answers.

## 2. Data Privacy
**Risk**: Users uploading sensitive personal documents (Aadhaar, PAN card).
**Mitigation**:
- Encrypt data at rest and in transit.
- Implement auto-deletion policies (delete document images after processing).
- Use PII redaction before sending text to third-party AI models.

## 3. OCR Accuracy
**Risk**: Poor quality images or handwriting may lead to incorrect text extraction.
**Mitigation**:
- Implement image preprocessing (contrast enhancement, deskewing) before OCR.
- Allow users to manually edit the extracted text before AI analysis.
- Prompt users to retake photos if quality is low.

## 4. Regulatory Compliance
**Risk**: Providing "legal advice" without a license.
**Mitigation**:
- Clearly frame the service as "informational" and "simplification," not legal counsel.
- Terms of Service must explicitly state the limitations of the platform.
