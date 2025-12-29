
export enum WorkflowStage {
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  CONFIRMATION = 'CONFIRMATION',
  FORMATTING = 'FORMATTING',
  COMPLETED = 'COMPLETED'
}

export interface AnalysisResult {
  summary: string[];
  uncertainTerms: string[];
  fullTranscript: string;
}

export interface SubtitleLine {
  text: string;
}
