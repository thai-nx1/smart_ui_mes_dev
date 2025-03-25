// GraphQL API types that match the expected API response structure
export interface GraphQLResponse<T> {
  data: T;
}

export interface FormsListResponse {
  core_core_dynamic_forms: Form[];
}

export interface FormDetailsResponse {
  core_core_dynamic_fields: Field[];
}

export interface Form {
  id: string;
  name: string;
  description: string;
  status: string;
  __typename: string;
}

export interface Field {
  id: string;
  name: string;
  field_type: FieldType;
  description: string | null;
  status: string;
  __typename: string;
  options?: FieldOption[];
}

export type FieldType = 'TEXT' | 'PARAGRAPH' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'DATE';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormSubmission {
  formId: string;
  data: Record<string, any>;
}

// Field value types for form state
export type FieldValue = string | number | boolean | string[] | null;

export interface FormState {
  [fieldId: string]: FieldValue;
}

// Colors for field types
export const fieldTypeColors: Record<FieldType, { bg: string, text: string }> = {
  'TEXT': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'PARAGRAPH': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'NUMBER': { bg: 'bg-green-100', text: 'text-green-800' },
  'SINGLE_CHOICE': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'MULTI_CHOICE': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'DATE': { bg: 'bg-indigo-100', text: 'text-indigo-800' }
};

// Mock choices for choice fields
export const mockChoices: FieldOption[] = [
  { id: '1', label: 'Lựa chọn 1', value: '1' },
  { id: '2', label: 'Lựa chọn 2', value: '2' },
  { id: '3', label: 'Lựa chọn 3', value: '3' },
  { id: '4', label: 'Lựa chọn 4', value: '4' }
];
