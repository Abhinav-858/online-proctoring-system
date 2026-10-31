// AnomalyDetector.js - ML-Based Malpractice Scoring Engine
// Part of Module 4: Anomaly Detection Engine
//
// Approach: Weighted Linear Feature Scoring + Threshold Classification
// Equivalent to a logistic regression classifier with manually set weights
// based on domain knowledge of exam cheating patterns.

const FEATURE_WEIGHTS = {
  tabSwitchCount:    { weight: 0.25, baseline: 5, description: 'Tab/window switches during exam' },
  totalIdleTime:     { weight: 0.10, baseline: 120, description: 'Total idle seconds (no interaction)' },
  avgKeystrokeRate:  { weight: 0.05, baseline: 10, description: 'Avg keystrokes/min (low = suspicious)', invert: true },
  gazeAwayDuration:  { weight: 0.20, baseline: 60, description: 'Seconds looking away from screen' },
  faceAbsentDuration:{ weight: 0.20, baseline: 30, description: 'Seconds face not detected' },
  noiseSpikeCount:   { weight: 0.05, baseline: 5, description: 'Sustained high-noise periods' },
  rapidSubmissions:  { weight: 0.10, baseline: 3, description: 'Questions answered in < 5 seconds' },
  copyPasteAttempts: { weight: 0.05, baseline: 3, description: 'Copy/paste/right-click attempts' },
};

const RISK_LEVELS = {
  LOW: { label: 'Low Risk', range: '0-30', verdict: 'APPROVED', color: '#10b981', description: 'Exam completed within integrity standards. No patterns of systemic cheating detected.' },
  MEDIUM: { label: 'Medium Risk', range: '31-60', verdict: 'MANUAL REVIEW RECOMMENDED', color: '#f59e0b', description: 'Multiple warning triggers registered. Review the activity timeline before grading.' },
  HIGH: { label: 'High Risk', range: '61-100', verdict: 'FLAGGED / SUSPENDED', color: '#ef4444', description: 'Integrity threshold breached. Multiple major violations or screen termination occurred.' },
};

class AnomalyDetector {
  constructor(weights = FEATURE_WEIGHTS) {
    this.weights = weights;
  }

  // Normalize a raw feature value to 0-1 scale
  _normalize(value, baseline, invert = false) {
    if (invert) {
      // For inverted features (e.g., keystroke rate), lower values are MORE suspicious
      // A rate of 0 = 1.0 (max suspicion), rate >= baseline = 0.0 (normal)
      if (value >= baseline) return 0;
      return 1 - (value / baseline);
    }
    // Normal: higher values are more suspicious
    if (value <= 0) return 0;
    if (value >= baseline) return 1;
    return value / baseline;
  }

  // Analyze activity summary and produce risk assessment
  analyze(activitySummary) {
    const featureScores = {};
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [featureName, config] of Object.entries(this.weights)) {
      const rawValue = activitySummary[featureName] || 0;
      const normalizedScore = this._normalize(rawValue, config.baseline, config.invert || false);
      const weightedScore = normalizedScore * config.weight;

      featureScores[featureName] = {
        rawValue: Math.round(rawValue * 100) / 100,
        normalizedScore: Math.round(normalizedScore * 100) / 100,
        weight: config.weight,
        weightedContribution: Math.round(weightedScore * 100) / 100,
        description: config.description,
      };

      weightedSum += weightedScore;
      totalWeight += config.weight;
    }

    // Scale to 0-100
    const riskScore = Math.min(100, Math.round((weightedSum / totalWeight) * 100));

    // Classify risk level
    let riskLevel;
    if (riskScore <= 30) {
      riskLevel = RISK_LEVELS.LOW;
    } else if (riskScore <= 60) {
      riskLevel = RISK_LEVELS.MEDIUM;
    } else {
      riskLevel = RISK_LEVELS.HIGH;
    }

    return {
      riskScore,
      riskLevel,
      featureScores,
      summary: {
        totalFeaturesAnalyzed: Object.keys(featureScores).length,
        highestContributor: this._getHighestContributor(featureScores),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Find the feature that contributed most to the risk score
  _getHighestContributor(featureScores) {
    let maxFeature = null;
    let maxContribution = -1;
    for (const [name, score] of Object.entries(featureScores)) {
      if (score.weightedContribution > maxContribution) {
        maxContribution = score.weightedContribution;
        maxFeature = name;
      }
    }
    return maxFeature ? {
      feature: maxFeature,
      contribution: maxContribution,
      description: featureScores[maxFeature].description,
    } : null;
  }
}

export { FEATURE_WEIGHTS, RISK_LEVELS, AnomalyDetector };
export default AnomalyDetector;
