import torch
import torch.nn as nn
from torchvision import models
import os
import numpy as np

class CheXNet(nn.Module):
    def __init__(self, num_classes=14):
        super(CheXNet, self).__init__()

        # Load pre-trained DenseNet-121 model without pre-trained weights
        self.model = models.densenet121(weights=None)
        
        # Get the number of input features for the classifier layer
        num_ftrs = self.model.classifier.in_features
        
        # Replace the original classifier with a new one for 14 classes
        # IMPORTANT: Include Sigmoid here if the .pth model was trained with it
        self.model.classifier = nn.Sequential(
            nn.Linear(num_ftrs, num_classes),
            nn.Sigmoid() # Sigmoid for multi-label classification
        )

    def forward(self, x):
        return self.model(x)

# Define the 14 conditions in the order that the CheXNet model was likely trained on
# for the NIH ChestX-ray dataset. This order is crucial for correctly mapping the
# model's output probabilities to labels.
# Source: Common order used in CheXNet implementations for NIH ChestX-ray.
CONDITIONS = [
    'Atelectasis', 'Cardiomegaly', 'Effusion', 'Infiltration', 'Mass', 'Nodule',
    'Pneumonia', 'Pneumothorax', 'Consolidation', 'Edema', 'Emphysema', 'Fibrosis',
    'Pleural_Thickening', 'Hernia'
]

# Threshold for considering a finding "not significant" or highly uncertain
# You can adjust this value.
# - Increase it (e.g., to 0.5 or 0.6) to make the model more conservative.
# - Decrease it (e.g., to 0.2) to make the model more aggressive.
NO_FINDING_THRESHOLD = 0.35 

_chexnet_model = None

def load_densenet_model(model_path: str):
    """
    Loads the PyTorch CheXNet model from the .pth file.
    """
    global _chexnet_model
    if _chexnet_model is None:
        if not model_path or not os.path.exists(model_path):
            print(f"ERROR: PyTorch model file not found at: {model_path}. Please ensure the model is correctly placed and MODEL_PATH is set in .env.")
            raise FileNotFoundError(f"AI model file not found at: {model_path}")
            
        print(f"Loading PyTorch CheXNet model from: {model_path}")
        try:
            _chexnet_model = CheXNet()
            
            # Load the raw state_dict from the .pth file
            print(f"DEBUG: Loading state_dict from {model_path}")
            state_dict = torch.load(model_path, map_location=torch.device('cpu'))
            
            # Create a new state_dict to handle potential key mismatches
            new_state_dict = {}
            for k, v in state_dict.items():
                if k.startswith('features.'):
                    new_key = 'model.' + k
                    new_state_dict[new_key] = v
                elif k.startswith('classifier.'):
                    new_key = 'model.' + k
                    new_state_dict[new_key] = v
                else:
                    new_state_dict[k] = v
            
            # Attempt to load the state_dict
            try:
                _chexnet_model.load_state_dict(new_state_dict, strict=True)
                print("DEBUG: State dictionary loaded strictly.")
            except RuntimeError as e:
                print(f"WARNING: Strict load failed: {e}")
                _chexnet_model.load_state_dict(new_state_dict, strict=False)
                print("DEBUG: State dictionary loaded non-strictly.")

            _chexnet_model.eval()  # Set model to evaluation mode
            _chexnet_model = _chexnet_model.to(torch.device('cpu'))  # Ensure on CPU
            
            # Disable gradients to save memory
            for param in _chexnet_model.parameters():
                param.requires_grad = False
            
            print("PyTorch CheXNet model loaded successfully and optimized for inference.")

        except Exception as e:
            print(f"ERROR: Failed to load PyTorch model from {model_path}. Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise RuntimeError(f"Failed to load AI model: {type(e).__name__}: {e}")
    return _chexnet_model

def predict_image(model: CheXNet, image_tensor: torch.Tensor) -> tuple[dict, bool]:
    """
    Performs inference on a preprocessed image tensor using the loaded CheXNet model.
    Returns a dictionary of condition probabilities and a boolean indicating if no significant finding was detected.
    """
    if model is None:
        raise ValueError("AI model is not loaded.")
    
    model.eval() # Ensure model is in evaluation mode
    
    # Convert to float32 for inference (more stable than float16 for this model)
    image_tensor = image_tensor.float()
    
    with torch.no_grad(): # Disable gradient calculation for inference
        # Run inference with CPU (explicit)
        with torch.inference_mode():
            output = model(image_tensor.cpu())
            # Detach output immediately to free memory
            probabilities = output.squeeze(0).detach().cpu().numpy().tolist()

    # Map probabilities to condition names
    predictions = {CONDITIONS[i]: prob for i, prob in enumerate(probabilities)}

    # Determine if there's no significant finding based on the highest probability
    max_probability = max(predictions.values())
    no_significant_finding = max_probability < NO_FINDING_THRESHOLD
    
    return predictions, no_significant_finding