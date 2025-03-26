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
 * Tạo mới một trường (field)
 */
export async function createField(field: {
  name: string;
  field_type: string;
  description?: string;
  organization_id: string;
  status?: string;
}): Promise<GraphQLResponse<any>> {
  const query = `
    mutation CreateField($field: core_core_dynamic_fields_insert_input!) {
      insert_core_core_dynamic_fields_one(object: $field) {
        id
        name
        field_type
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { field });
}

/**
 * Cập nhật thông tin trường (field)
 */
export async function updateField(
  fieldId: string, 
  updates: {
    name?: string;
    description?: string;
    status?: string;
  }
): Promise<GraphQLResponse<any>> {
  const query = `
    mutation UpdateField($fieldId: uuid!, $updates: core_core_dynamic_fields_set_input!) {
      update_core_core_dynamic_fields_by_pk(
        pk_columns: { id: $fieldId }, 
        _set: $updates
      ) {
        id
        name
        field_type
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { fieldId, updates });
}

/**
 * Xóa một trường (field) khỏi một form cụ thể
 */
export async function removeFieldFromForm(formFieldId: string): Promise<GraphQLResponse<any>> {
  const query = `
    mutation RemoveFieldFromForm($formFieldId: uuid!) {
      delete_core_core_dynamic_form_fields_by_pk(id: $formFieldId) {
        id
        dynamic_field_id
        dynamic_form_id
      }
    }
  `;

  return executeGraphQLQuery(query, { formFieldId });
}

/**
 * Đọc thông tin chi tiết của một trường (field)
 */
export async function fetchFieldDetails(fieldId: string): Promise<GraphQLResponse<any>> {
  const query = `
    query GetFieldDetails($fieldId: uuid!) {
      core_core_dynamic_fields_by_pk(id: $fieldId) {
        id
        name
        field_type
        description
        configuration
        organization_id
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { fieldId });
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
  // Sử dụng đúng format truy vấn GraphQL từ mẫu được cung cấp
  const query = `
    query FormDetail($id: uuid!) {
      core_core_dynamic_forms_by_pk(id: $id) {
        id
        name
        description
        organization_id
        status
        core_dynamic_form_fields {
          id
          dynamic_field_id
          dynamic_form_id
          core_dynamic_field {
            id
            name
            description
            field_type
            configuration
            organization_id
            status
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;

  console.log("Fetching form details with ID:", formId);
  return executeGraphQLQuery<GraphQLResponse<FormDetailsResponse>>(query, { id: formId });
}

/**
 * Submit form data using GraphQL mutation
 */
export async function submitFormData(submission: FormSubmission): Promise<GraphQLResponse<any>> {
  // Cấu trúc mutation theo mẫu được cung cấp
  const query = `
    mutation SubmissionForm($formId: uuid!, $userId: uuid!, $organizationId: uuid!, $submissionData: jsonb!, $workflowId: uuid!) {
      insert_core_core_submission_forms(objects: {
        form_id: $formId, 
        user_id: $userId, 
        organization_id: $organizationId, 
        submission_data: $submissionData, 
        workflow_id: $workflowId
      }) {
        affected_rows
        returning {
          id
          code
          form_id
          organization_id
          user_id
          workflow_id
          submission_data
        }
      }
    }
  `;

  // Biến đổi dữ liệu cho phù hợp với định dạng mutation
  const submissionFields = Object.entries(submission.data).map(([fieldId, fieldData]) => {
    // fieldData giờ đây là một đối tượng có chứa value, name, và field_type
    return {
      id: fieldId,
      name: fieldData.name,
      field_type: fieldData.field_type,
      value: fieldData.value
    };
  });

  const variables = {
    formId: submission.formId,
    userId: "5c065b51-3862-4004-ae96-ca23245aa21e", // Sử dụng ID cố định từ mẫu
    organizationId: "8c96bdee-09ef-40ce-b1fa-954920e71efe", // Sử dụng ID cố định từ mẫu
    submissionData: submissionFields,
    workflowId: "add1fe74-3c9a-4b4c-a43a-b9a1d4c5c5b2" // Sử dụng ID cố định từ mẫu
  };

  console.log("Submitting form with data:", variables);
  return executeGraphQLQuery(query, variables);
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
