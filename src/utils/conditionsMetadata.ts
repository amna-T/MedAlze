import { Condition } from "./xrayAnalysis";

interface ConditionMetadata {
  label: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export const CONDITIONS_METADATA: Record<Condition, ConditionMetadata> = {
  atelectasis: {
    label: "Atelectasis",
    description: "Partial or complete collapse of lung tissue",
    severity: "medium"
  },
  cardiomegaly: {
    label: "Cardiomegaly",
    description: "Enlarged heart",
    severity: "medium"
  },
  consolidation: {
    label: "Consolidation",
    description: "Region of normally compressible lung tissue that has filled with liquid",
    severity: "medium"
  },
  edema: {
    label: "Edema",
    description: "Excess fluid in the lungs",
    severity: "high"
  },
  effusion: {
    label: "Effusion",
    description: "Fluid buildup between the lungs and chest wall",
    severity: "medium"
  },
  emphysema: {
    label: "Emphysema",
    description: "Damage to the air sacs in lungs",
    severity: "high"
  },
  fibrosis: {
    label: "Fibrosis",
    description: "Scarring of lung tissue",
    severity: "high"
  },
  hernia: {
    label: "Hernia",
    description: "Protrusion of organs through the diaphragm",
    severity: "medium"
  },
  infiltration: {
    label: "Infiltration",
    description: "Substances in lung tissue that should not be present",
    severity: "medium"
  },
  mass: {
    label: "Mass",
    description: "Abnormal growth or tumor",
    severity: "high"
  },
  nodule: {
    label: "Nodule",
    description: "Small rounded growth or deposit",
    severity: "medium"
  },
  pleural_thickening: {
    label: "Pleural Thickening",
    description: "Thickening of the pleural space",
    severity: "medium"
  },
  pneumonia: {
    label: "Pneumonia",
    description: "Infection causing inflammation of the air sacs",
    severity: "high"
  },
  pneumothorax: {
    label: "Pneumothorax",
    description: "Collapsed lung due to air in pleural space",
    severity: "high"
  }
};