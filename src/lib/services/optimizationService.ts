import type { ResumeData } from '../resume';
import type { Suggestion } from './jdAnalyzer';
export function applySuggestion(data:ResumeData,suggestion:Suggestion):ResumeData {if(!suggestion.field||typeof suggestion.replacement!=='string')return data;return {...data,[suggestion.field]:suggestion.replacement};}
