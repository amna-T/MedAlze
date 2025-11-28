import torch
import torch.nn as nn
from torchvision import models

class CheXNet(nn.Module):
    def __init__(self, num_classes=14):
        super(CheXNet, self).__init__()

        # Load pre-trained DenseNet-121 model
        # Use weights="IMAGENET1K_V1" for torchvision versions >= 0.13
        self.model = models.densenet121(weights="IMAGENET1K_V1")
        
        # Get the number of input features for the classifier layer
        num_ftrs = self.model.classifier.in_features
        
        # Replace the original classifier with a new one for 14 classes and Sigmoid activation
        self.model.classifier = nn.Sequential(
            nn.Linear(num_ftrs, num_classes),
            nn.Sigmoid() # Sigmoid for multi-label classification
        )

    def forward(self, x):
        return self.model(x)