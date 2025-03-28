import { executeGraphQLQuery } from './api';
import { GraphQLResponse } from './types';

/**
 * Lấy chi tiết workflow bằng ID
 */
export async function fetchWorkflowDetails(workflowId: string): Promise<GraphQLResponse<any>> {
  const query = `
    query GetWorkflowDetails($workflowId: uuid!) {
      core_core_dynamic_workflows_by_pk(id: $workflowId) {
        id
        name
        description
        organization_id
        core_dynamic_workflow_transitions {
          id
          name
          from_status_id
          to_status_id
          form_id
          organization_id
          workflow_id
          core_dynamic_from_status {
            id
            name
            description
            organization_id
          }
          core_dynamic_to_status {
            id
            name
            description
            organization_id
          }
        }
      }
    }
  `;

  console.log('Calling fetchWorkflowDetails with workflowId:', workflowId);
  return executeGraphQLQuery(query, { workflowId });
}