// Define the Flask backend URL
const FLASK_BACKEND_URL = import.meta.env.VITE_FLASK_BACKEND_URL || 'http://localhost:5000';

// The CONDITIONS array MUST match the one in your backend/model.py in order and content.
// This order is crucial for correctly mapping the model's output probabilities to labels.
// These are the PascalCase/Pascal_Case names from the NIH ChestX-ray dataset.
export const CONDITIONS = [
  'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 'Mass', 'Nodule',
  'Pneumonia', 'Pneumothorax', 'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
  'Pleural_Thickening', 'Hernia'
] as const;

// Helper to convert PascalCase or Pascal_Case (from backend) to snake_case (for frontend metadata lookup)
const toSnakeCase = (name: string): string => {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // Handles cases like 'PneumoThorax' -> 'Pneumo_Thorax'
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')     // Handles cases like 'Nodule' -> 'nodule'
    .toLowerCase()                             // Convert to lowercase
    .replace(/_([_]+)/g, '_');                 // Replace multiple underscores with a single one (e.g., 'pleural__thickening' -> 'pleural_thickening')
};

export type Condition = ReturnType<typeof toSnakeCase>; // Condition type will now be snake_case

export interface AnalysisResult {
  condition: Condition;
  confidence: number;
  allPredictions: Array<{
    condition: Condition;
    probability: number;
  }>;
  noSignificantFinding?: boolean; // New field
}

/**
 * Analyzes an X-ray image by sending it to the Flask backend for prediction.
 * @param imageFile The File object of the X-ray image.
 * @returns A Promise that resolves to an AnalysisResult object.
 */
export const analyzeXRay = async (imageFile: File): Promise<AnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${FLASK_BACKEND_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend prediction failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success' || !data.predictions || !data.conditions_order) {
      throw new Error('Invalid response from backend prediction service.');
    }

    const backendPredictions: { [key: string]: number } = data.predictions;
    const conditionsOrder: string[] = data.conditions_order; // These are now expected to be PascalCase/Pascal_Case

    const noSignificantFinding: boolean = data.no_significant_finding || false; // Get the new flag

    const allPredictions: Array<{ condition: Condition; probability: number }> = conditionsOrder.map(
      (conditionKey: string) => ({
        condition: toSnakeCase(conditionKey), // Convert to snake_case for frontend metadata lookup
        probability: parseFloat(backendPredictions[conditionKey].toFixed(4)),
      })
    ).sort((a, b) => b.probability - a.probability); // Sort by probability descending

    const topPrediction = allPredictions[0];

    return {
      condition: topPrediction.condition,
      confidence: topPrediction.probability,
      allPredictions,
      noSignificantFinding, // Include the new flag
    };
  } catch (error) {
    console.error('Error analyzing X-ray with backend:', error);
    throw new Error(`Failed to analyze X-ray: ${(error as Error).message}`);
  }
};

// Removed loadModel and preprocessImage as they are no longer needed for frontend TF.js inference.
// If you need local image preprocessing for display or other purposes, these can be re-added.