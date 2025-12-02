import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import uuid
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import json # Import the json module

# Import functions from our modules
from model import load_densenet_model, predict_image, CONDITIONS
from utils import preprocess_image

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure CORS for specific origins
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://medalze.vercel.app",
            "https://*.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configuration from environment variables
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'static/uploads')

# Get the backend directory path
backend_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.getenv('MODEL_PATH', 'model/chexnet.pth')

# Make model path absolute if it's relative
if not os.path.isabs(model_path):
    model_path = os.path.join(backend_dir, model_path)

# Normalize the path to remove ./ and other artifacts
model_path = os.path.normpath(model_path)

app.config['MODEL_PATH'] = model_path
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey') # For session management, good practice
app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY') # Get Gemini API key

# --- DEBUGGING START ---
print(f"DEBUG: GEMINI_API_KEY from .env: {app.config['GEMINI_API_KEY']}")
print(f"DEBUG: MODEL_PATH from .env: {app.config['MODEL_PATH']}")
# --- DEBUGGING END ---

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Load the model once when the app starts
try:
    chexnet_model = load_densenet_model(app.config['MODEL_PATH']) # Changed variable name
    print("DEBUG: CheXNet model loaded successfully in app.py.")
except Exception as e:
    print(f"ERROR: Failed to load AI model on startup: {e}")
    chexnet_model = None # Set to None if loading fails

# Initialize Gemini AI
gemini_model = None
if app.config['GEMINI_API_KEY']:
    try:
        # Configure the API key globally before initializing the model
        genai.configure(api_key=app.config['GEMINI_API_KEY'])
        
        # List available models for debugging
        print("\n--- Listing Available Gemini Models ---")
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                print(f"- {m.name} (Supports generateContent)")
            else:
                print(f"- {m.name}")
        print("-------------------------------------\n")

        # Use 'gemini-pro-latest' as it's explicitly listed and supports generateContent
        gemini_model = genai.GenerativeModel(model_name='gemini-pro-latest')
        print("DEBUG: Gemini AI model 'gemini-pro-latest' initialized successfully.")
    except Exception as e:
        # --- DEBUGGING START ---
        print(f"ERROR: Failed to initialize Gemini AI model with provided API key. Error details: {e}")
        # --- DEBUGGING END ---
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables. Report generation will not work.")


@app.route('/')
def index():
    """
    Root endpoint to check if the server is running.
    """
    return jsonify({
        "status": "MedAlze Flask API is running!",
        "model_loaded": chexnet_model is not None, # Changed variable name
        "gemini_initialized": gemini_model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint to accept an uploaded chest X-ray image and return disease probabilities.
    """
    if chexnet_model is None: # Changed variable name
        return jsonify({"error": "AI model not loaded. Please check server logs."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        try: 
            # Save the uploaded file temporarily
            filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            print(f"DEBUG: File saved temporarily at {filepath}")

            # Preprocess the image
            preprocessed_image = preprocess_image(filepath)
            print(f"DEBUG: Image preprocessed. Shape: {preprocessed_image.shape}, Dtype: {preprocessed_image.dtype}")

            # Run inference
            disease_probabilities, no_significant_finding = predict_image(chexnet_model, preprocessed_image) # Changed variable name
            
            # --- DEBUGGING START ---
            # Find the top prediction for logging
            top_condition = max(disease_probabilities, key=disease_probabilities.get)
            top_confidence = disease_probabilities[top_condition]
            print(f"DEBUG: CheXNet Top Prediction: {top_condition} with confidence {top_confidence:.4f}. No significant finding flag: {no_significant_finding}")
            # --- DEBUGGING END ---

            # Clean up the temporary file
            os.remove(filepath)
            print(f"DEBUG: Temporary file {filepath} removed.")

            return jsonify({
                "status": "success",
                "predictions": disease_probabilities,
                "conditions_order": CONDITIONS, # To ensure frontend knows the order
                "no_significant_finding": no_significant_finding # Include the new flag
            }), 200

        except FileNotFoundError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            print(f"Prediction error: {e}")
            return jsonify({"error": f"Error during prediction: {e}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Allowed types: png, jpg, jpeg, gif"}), 400

@app.route('/generate_report', methods=['POST'])
def generate_report_endpoint():
    """
    Endpoint to generate a medical report using Gemini AI based on analysis results and patient info.
    """
    if gemini_model is None:
        return jsonify({"error": "Gemini AI model not initialized. Please check server logs and GEMINI_API_KEY."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    analysis_results = data.get('analysisResults')
    patient_info = data.get('patientInfo')
    conditions_metadata = data.get('conditionsMetadata') # Frontend will send this

    if not analysis_results or not patient_info or not conditions_metadata:
        return jsonify({"error": "Missing analysisResults, patientInfo, or conditionsMetadata in request body"}), 400

    try: 
        # Construct the prompt using the received data
        condition_label = conditions_metadata[analysis_results['condition']]['label']
        condition_description = conditions_metadata[analysis_results['condition']]['description']
        condition_severity = conditions_metadata[analysis_results['condition']]['severity'].upper()

        prompt_lines = [
            "Generate a comprehensive medical report for an X-ray analysis.",
            "The output MUST be a JSON object with the following keys: \"summary\", \"findings\", \"impression\", \"recommendations\".",
            "Each value should be a string.",
            "",
            "Patient Information:",
            f"- ID: {patient_info['id']}",
        ]

        if patient_info.get('age'):
            prompt_lines.append(f"- Age: {patient_info['age']}")
        if patient_info.get('gender'):
            prompt_lines.append(f"- Gender: {patient_info['gender']}")
        if patient_info.get('clinicalHistory'):
            prompt_lines.append(f"- Clinical History: {patient_info['clinicalHistory']}")

        prompt_lines.extend([
            "",
            "Primary AI Analysis Result (MAIN FOCUS of this Report):", # Even stronger emphasis
            f"- Detected Condition: {condition_label}",
            f"- Description: {condition_description}",
            f"- Confidence Level: {(analysis_results['confidence'] * 100):.1f}%",
            f"- Severity Level: {condition_severity}",
        ])

        if analysis_results.get('additionalContext'):
            prompt_lines.append(f"\nSecondary AI-Detected Conditions (for comprehensive overview, but NOT the primary focus of 'Key Findings' or 'Impression'):") # Clarify role and deemphasize
            prompt_lines.append(analysis_results['additionalContext'])
        
        # Add specific instruction for no significant finding
        if analysis_results.get('noSignificantFinding'):
            prompt_lines.append("\nIMPORTANT: The AI model detected no significant findings with high confidence. The report should reflect this uncertainty and recommend further human review.")
            prompt_lines.append("For 'Key Findings', state that no clear abnormalities were identified by AI, but suggest manual review.")
            prompt_lines.append("For 'Impression', suggest 'No acute cardiopulmonary abnormality detected by AI, but clinical correlation and radiologist review are recommended.'")
            prompt_lines.append("For 'Recommendations', strongly advise a radiologist's comprehensive review and correlation with clinical history.")


        prompt_lines.extend([
            "",
            "Generate a comprehensive medical report for an X-ray analysis. The report MUST EXCLUSIVELY focus on the 'Detected Condition' provided as the MAIN FOCUS for the 'Key Findings' and 'Impression' sections.", # Stronger instruction
            "The output MUST be a JSON object with the following keys: \"summary\", \"findings\", \"impression\", \"recommendations\".",
            "Each value should be a string.",
            f"For \"Key Findings\", STRICTLY describe only the specific characteristics and anatomical location related to {condition_label}. Do NOT include findings for other conditions here.", # Very explicit
            "For \"Impression\", provide a concise summary, focusing SOLELY on the primary detected condition. Include differential diagnoses if relevant to the primary condition.", # Very explicit
            "For \"Recommendations\", include appropriate follow-up timing and any additional imaging or clinical correlation needed, related to the primary condition.",
        ])

        prompt = "\n".join(prompt_lines)
        print(f"DEBUG: Gemini AI prompt:\n{prompt}") # Log the full prompt

        # Configure safety settings for content generation
        safety_settings = [
            {
                "category": HarmCategory.HARM_CATEGORY_HARASSMENT,
                "threshold": HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                "threshold": HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                "threshold": HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                "threshold": HarmBlockThreshold.BLOCK_NONE,
            },
        ]

        response = gemini_model.generate_content(prompt, safety_settings=safety_settings)
        response_text = response.text
        print(f"DEBUG: Raw Gemini AI response text:\n{response_text}") # Log raw response

        # --- START FIX ---
        # Extract the JSON string from the markdown block
        json_start = response_text.find("```json")
        json_end = response_text.rfind("```")

        if json_start != -1 and json_end != -1 and json_start < json_end:
            raw_json_string = response_text[json_start + len("```json"):json_end].strip()
            print(f"DEBUG: Extracted raw JSON string:\n{raw_json_string}")
            try:
                parsed_report_dict = json.loads(raw_json_string)
                return jsonify({"report": parsed_report_dict}), 200
            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to parse extracted JSON string: {e}")
                return jsonify({"error": "Failed to parse AI generated report. Invalid JSON format after extraction."}), 500
        else:
            # If no markdown block is found, try to parse the whole response_text as JSON
            try:
                parsed_report_dict = json.loads(response_text)
                return jsonify({"report": parsed_report_dict}), 200
            except json.JSONDecodeError as e:
                print(f"ERROR: Gemini AI response was not a valid JSON string or markdown block: {e}")
                print(f"Raw Gemini AI response: {response_text}")
                return jsonify({"error": "Failed to parse AI generated report. Unexpected response format."}), 500
        # --- END FIX ---

    except Exception as e:
        print(f"Error generating report with Gemini AI: {e}")
        return jsonify({"error": f"Failed to generate report: {e}"}), 500


# Global error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad Request", "message": str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found", "message": str(error)}), 404

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Internal Server Error", "message": str(error)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 10000))
    app.run(debug=False, host='0.0.0.0', port=port)