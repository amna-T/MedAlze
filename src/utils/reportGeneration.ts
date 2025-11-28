// Removed GoogleGenerativeAI import as it's now handled by the backend

import { Condition } from './xrayAnalysis';
import { CONDITIONS_METADATA } from './conditionsMetadata'; // Keep this for sending to backend

// Define the Flask backend URL
const FLASK_BACKEND_URL = import.meta.env.VITE_FLASK_BACKEND_URL || 'http://localhost:5000';

interface AnalysisResults {
  condition: Condition;
  confidence: number;
  additionalContext?: string;
  noSignificantFinding?: boolean; // Added this line
}

// Define the structure for the generated report
export interface GeneratedReport {
  summary: string;
  findings: string;
  impression: string;
  recommendations: string;
}

export const generateReport = async (
  analysisResults: AnalysisResults,
  patientInfo: {
    id: string;
    age?: number;
    gender?: string;
    clinicalHistory?: string;
    additionalContext?: string; // This is for patient-specific context, not AI analysis context
  }
): Promise<GeneratedReport> => {
  try {
    const response = await fetch(`${FLASK_BACKEND_URL}/generate_report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisResults,
        patientInfo,
        conditionsMetadata: CONDITIONS_METADATA, // Send metadata to backend for prompt construction
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend report generation failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // The backend now returns an object like { "report": { ... } } or { "raw_response": "..." }
    if (data.report) {
      // data.report is already a JavaScript object, no need to parse it again.
      const parsedReport: GeneratedReport = data.report; 
      return parsedReport;
    } else if (data.raw_response) {
      // If the backend explicitly sends raw_response, it means it couldn't generate valid JSON.
      throw new Error(`AI generated raw response (not valid JSON): ${data.raw_response}`);
    } else {
      throw new Error('Unexpected response format from backend report generation.');
    }

  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error(`Failed to generate report: ${(error as Error).message}`);
  }
};