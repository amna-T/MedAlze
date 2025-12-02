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
    Loads the PyTorch CheXNet model from the .pth file with memory optimizations.
    """
    global _chexnet_model
    if _chexnet_model is None:
        if not model_path or not os.path.exists(model_path):
            print(f"ERROR: PyTorch model file not found at: {model_path}.")
            raise FileNotFoundError(f"AI model file not found at: {model_path}")
            
        print(f"Loading PyTorch CheXNet model from: {model_path}")
        try:
            import gc
            gc.collect()  # Force garbage collection before loading
            
            _chexnet_model = CheXNet()
            
            # Load state_dict with minimal memory overhead
            print(f"Loading state_dict...")
            state_dict = torch.load(model_path, map_location=torch.device('cpu'))
            
            # Create new state_dict with key renaming
            new_state_dict = {}
            for k, v in state_dict.items():
                if k.startswith(('features.', 'classifier.')):
                    new_state_dict['model.' + k] = v
                else:
                    new_state_dict[k] = v
            
            # Load state dict
            _chexnet_model.load_state_dict(new_state_dict, strict=False)

            # Optimize for inference
            _chexnet_model.eval()
            _chexnet_model = _chexnet_model.to(torch.device('cpu'))
            
            # Disable gradients to save memory
            for param in _chexnet_model.parameters():
                param.requires_grad = False
            
            # Convert to float16 for memory efficiency (if supported)
            try:
                _chexnet_model = _chexnet_model.half()
                print("Model converted to float16 for memory efficiency.")
            except Exception as e:
                print(f"Could not convert to float16: {e}. Using float32.")
            
            # Clear memory
            del state_dict, new_state_dict
            gc.collect()
            
            print("CheXNet model loaded successfully with memory optimizations.")

        except Exception as e:
            print(f"ERROR: Failed to load model: {type(e).__name__}: {e}")
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
    
    model.eval()
    
    with torch.no_grad():
        with torch.inference_mode():
            # Convert to same dtype as model (could be float16 or float32)
            image_tensor = image_tensor.to(next(model.parameters()).dtype)
            output = model(image_tensor.cpu())
            probabilities = output.squeeze(0).detach().cpu().float().numpy().tolist()

    # Map probabilities to condition names
    predictions = {CONDITIONS[i]: prob for i, prob in enumerate(probabilities)}

    # Determine if there's no significant finding based on the highest probability
    max_probability = max(predictions.values())
    no_significant_finding = max_probability < NO_FINDING_THRESHOLD
    
    return predictions, no_significant_finding