import torch
from PIL import Image
import numpy as np
import os
from torchvision import transforms

# ImageNet mean and standard deviation for normalization
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def preprocess_image(image_path: str) -> torch.Tensor:
    """
    Loads an image from the given path, applies CheXNet-specific preprocessing
    (resize to 256, center crop to 224, convert to tensor, normalize),
    and outputs a PyTorch tensor.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found at: {image_path}")

    img = Image.open(image_path).convert('RGB') # Ensure 3 channels
    print(f"DEBUG: Original image loaded. Mode: {img.mode}, Size: {img.size}")

    # Define PyTorch transforms with the specified sequence
    preprocess = transforms.Compose([
        transforms.Resize(256), # Resize the smaller edge to 256
        transforms.CenterCrop(224), # Crop the center 224x224
        transforms.ToTensor(), # Converts PIL Image to FloatTensor and scales to [0, 1]
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    
    img_tensor = preprocess(img)
    print(f"DEBUG: Image preprocessed. PyTorch tensor shape: {img_tensor.shape}, Dtype: {img_tensor.dtype}")
    print(f"DEBUG: Image tensor scaled to [0, 1] (after ToTensor). Min: {torch.min(img_tensor).item()}, Max: {torch.max(img_tensor).item()}")
    print(f"DEBUG: Image normalized with ImageNet mean/std. Min: {torch.min(img_tensor).item()}, Max: {torch.max(img_tensor).item()}, Mean: {torch.mean(img_tensor).item()}, Std: {torch.std(img_tensor).item()}")

    # Add a batch dimension: (C, H, W) -> (1, C, H, W)
    img_tensor = img_tensor.unsqueeze(0)
    print(f"DEBUG: Image tensor expanded with batch dimension. Final shape: {img_tensor.shape}, Dtype: {img_tensor.dtype}")
    
    return img_tensor