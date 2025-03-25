import { GraphQLResponse, FormsListResponse, FormDetailsResponse, FormSubmission } from './types';

const GRAPHQL_ENDPOINT = 'https://delicate-herring-66.hasura.app/v1/graphql';
console.log('Using GraphQL endpoint:', GRAPHQL_ENDPOINT);

/**
 * Execute a GraphQL query
 */
export async function executeGraphQLQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    console.log('Executing GraphQL query with variables:', variables);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GraphQL result:', result);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors.map((e: any) => e.message).join('\n'));
    }

    return result as T;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

/**
 * Fetch all forms
 */
export async function fetchForms(limit = 20, offset = 0): Promise<GraphQLResponse<FormsListResponse>> {
  const query = `
    query GetForms($limit: Int, $offset: Int) {
      core_core_dynamic_forms(limit: $limit, offset: $offset) {
        id
        name
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery<GraphQLResponse<FormsListResponse>>(query, { limit, offset });
}

/**
 * Fetch form fields by form ID
 */
export async function fetchFormFields(formId: string): Promise<GraphQLResponse<FormDetailsResponse>> {
  // Fetch all fields for now, but we could filter by form_id if the API supports it
  const query = `
    query GetFormFields($formId: uuid!) {
      core_core_dynamic_fields(where: { form_id: { _eq: $formId } }) {
        id
        name
        field_type
        description
        status
        __typename
        options
      }
    }
  `;

  // If the API doesn't support filtering by form_id, we'll fall back to all fields
  // and handle the form_id filtering on the client side
  try {
    return executeGraphQLQuery<GraphQLResponse<FormDetailsResponse>>(query, { formId });
  } catch (error) {
    console.error("Error with form_id filter, falling back to all fields:", error);
    // Fallback query without form_id filter
    const fallbackQuery = `
      query GetFormFields {
        core_core_dynamic_fields {
          id
          name
          field_type
          description
          status
          __typename
          options
        }
      }
    `;
    return executeGraphQLQuery<GraphQLResponse<FormDetailsResponse>>(fallbackQuery);
  }
}

/**
 * Submit form data
 */
export async function submitFormData(submission: FormSubmission): Promise<Response> {
  return apiRequest('POST', '/api/form-submissions', submission);
}

/**
 * API request helper
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }

  return res;
}
