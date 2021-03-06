import {
  Action,
  ActionDescriptor,
  Connection,
  Integration,
  IntegrationDeployment,
  Step,
  StepKind,
} from '@syndesis/models';
import { saveAs } from 'file-saver';
import produce from 'immer';
import * as React from 'react';
import { ApiContext } from './ApiContext';
import { callFetch } from './callFetch';
import { PUBLISHED, UNPUBLISHED } from './constants';
import { createStep, insertStepIntoFlowBefore, setStepInFlow } from './helpers';

export const useIntegrationHelpers = () => {
  const apiContext = React.useContext(ApiContext);

  /**
   * adds a step of type connection to the provided integration object.
   *
   * @param integration - the integration object to modify
   * @param connection - the connection object that's been used to set up the
   * step
   * @param action - the action that's been used to set up the step
   * @param flowId - the zero-based index of the flow where to add the step
   * @param position - the zero-based index of the steps where to add the step
   * @param configuredProperties - the values configured by the user for the step
   *
   * @todo should we check `flow` and `position` to see if they are valid?
   * @todo perhaps rename it with a better name
   */
  const addConnection = async (
    integration: Integration,
    connection: Connection,
    action: Action,
    flowId: string,
    position: number,
    configuredProperties: any
  ): Promise<Integration> => {
    const actionDescriptor = await getActionDescriptor(
      connection.id!,
      action.id!,
      configuredProperties
    );
    return produce(integration, draft => {
      const step: Step = {
        action,
        configuredProperties,
        connection,
        id: flowId,
      };
      if (actionDescriptor) {
        step.action!.descriptor = actionDescriptor;
      }
      step.stepKind = 'endpoint';
      draft.flows = draft.flows!.map(f => {
        if (f.id === flowId) {
          f.steps!.splice(position, 0, step);
        }
        return f;
      });
      draft.tags = Array.from(new Set([...(draft.tags || []), connection.id!]));
    });
  };

  /**
   * adds a step of type stepKind to the provided integration object.
   *
   * @param integration - the integration object to modify
   * @param stepKind - the action that's been used to set up the step
   * @param flowId - the zero-based index of the flow where to add the step
   * @param position - the zero-based index of the steps where to add the step
   * @param configuredProperties - the values configured by the user for the step
   *
   * @todo should we check `flow` and `position` to see if they are valid?
   * @todo perhaps rename it with a better name
   */
  const addStep = async (
    integration: Integration,
    stepKind: StepKind,
    flowId: string,
    position: number,
    configuredProperties: any
  ): Promise<Integration> => {
    return produce(integration, draft => {
      const step: Step = {
        ...createStep(),
        ...stepKind,
        configuredProperties,
      };

      return insertStepIntoFlowBefore(draft, flowId, step, position);
    });
  };

  /**
   * Fetches the deployment of the given integration id at the given version
   * @param id
   * @param version
   */
  const getDeployment = async (id: string, version: string | number) => {
    const response = await callFetch({
      headers: apiContext.headers,
      method: 'GET',
      url: `${apiContext.apiUri}/integrations/${id}/deployments/${version}`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as IntegrationDeployment;
  };

  /**
   * Patches an integration using the supplied attributes
   *
   * @param id
   * @param options
   */
  const setAttributes = async (id: string, options: any) => {
    const response = await callFetch({
      body: options,
      headers: apiContext.headers,
      method: 'PATCH',
      url: `${apiContext.apiUri}/integrations/${id}`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  /**
   * Replaces the current draft to the one at the specified version
   * @param id
   * @param version
   */
  const replaceDraft = async (id: string, version: string | number) => {
    const deployment = await getDeployment(id, version);
    await setAttributes(id, {
      flows: deployment.spec!.flows,
    });
  };

  /**
   * Delete the integration with the specified ID, empty response is returned
   * @param id
   */
  const deleteIntegration = async (id: string) => {
    const response = await callFetch({
      headers: apiContext.headers,
      method: 'DELETE',
      url: `${apiContext.apiUri}/integrations/${id}`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  /**
   * Uploads and imports the supplied file as a new integration
   * @param file
   */
  const importIntegration = async (file: File) => {
    const response = await callFetch({
      body: file,
      contentType: 'application/zip',
      headers: apiContext.headers,
      includeContentType: false,
      method: 'POST',
      url: `${apiContext.apiUri}/integration-support/import`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  /**
   * Requests a .zip file of the integration, using the specified filename
   * @param id
   * @param fileName
   */
  const exportIntegration = async (id: string, fileName: string) => {
    return callFetch({
      headers: apiContext.headers,
      method: 'GET',
      url: `${apiContext.apiUri}/integration-support/export.zip?id=${id}`,
    }).then(async body => saveAs(await body.blob(), fileName));
  };

  /**
   * Fetches the descriptor for the specified action
   * @param connectionId
   * @param actionId
   * @param configuredProperties
   */
  const getActionDescriptor = async (
    connectionId: string,
    actionId: string,
    configuredProperties: any
  ): Promise<ActionDescriptor | null> => {
      if (configuredProperties) {
        const response = await callFetch({
          body: configuredProperties,
          headers: apiContext.headers,
          method: 'POST',
          url: `${
            apiContext.apiUri
            }/connections/${connectionId}/actions/${actionId}`,
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return (await response.json()) as ActionDescriptor;
      } else {
        return null;
    }
  };

  /**
   * Deploy the integration with the specified ID and version.  Empty response is returned
   *
   * @param id
   * @param version
   * @param isIntegrationDeployment
   */
  const deployIntegration = async (
    id: string,
    version: string | number,
    isIntegrationDeployment = false
  ) => {
    const response = await callFetch({
      body: isIntegrationDeployment ? { targetState: PUBLISHED } : {},
      headers: apiContext.headers,
      method: isIntegrationDeployment ? 'POST' : 'PUT',
      url: isIntegrationDeployment
        ? `${
            apiContext.apiUri
          }/integrations/${id}/deployments/${version}/targetState`
        : `${apiContext.apiUri}/integrations/${id}/deployments`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  /**
   * Request that the given integration ID at the given version be deactivated, empty response is returned
   * @param id
   * @param version
   */
  const undeployIntegration = async (id: string, version: string | number) => {
    const response = await callFetch({
      body: { targetState: UNPUBLISHED },
      headers: apiContext.headers,
      method: 'POST',
      url: `${
        apiContext.apiUri
      }/integrations/${id}/deployments/${version}/targetState`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  };

  /**
   * updates a step of type connection to the provided integration object.
   *
   * @param integration - the integration object to modify
   * @param connection - the connection object that's been used to set up the
   * step
   * @param action - the action that's been used to set up the step
   * @param flowId - the zero-based index of the flow where to add the step
   * @param position - the zero-based index of the steps where to add the step
   * @param configuredProperties - the values configured by the user for the step
   *
   * @todo perhaps rename it with a better name
   * @todo should we check `flow` and `position` to see if they are valid?
   */
  const updateConnection = async (
    integration: Integration,
    connection: Connection,
    action: Action,
    flowId: string,
    position: number,
    configuredProperties: any
  ): Promise<Integration> => {
    const actionDescriptor = await getActionDescriptor(
      connection.id!,
      action.id!,
      configuredProperties
    );
    return produce(integration, draft => {
      const step: Step = {
        action,
        configuredProperties,
        connection,
        id: flowId,
      };
      if (actionDescriptor) {
        step.action!.descriptor = actionDescriptor;
      }
      step.stepKind = 'endpoint';
      draft.flows = draft.flows!.map(f => {
        if (f.id === flowId) {
          f.steps![position] = step;
        }
        return f;
      });
    });
  };

  /**
   * updates a step of type stepKind to the provided integration object.
   *
   * @param integration - the integration object to modify
   * @param stepKind - the action that's been used to set up the step
   * @param flowId - the zero-based index of the flow where to add the step
   * @param position - the zero-based index of the steps where to add the step
   * @param configuredProperties - the values configured by the user for the step
   *
   * @todo should we check `flow` and `position` to see if they are valid?
   * @todo perhaps rename it with a better name
   */
  const updateStep = async (
    integration: Integration,
    stepKind: StepKind,
    flowId: string,
    position: number,
    configuredProperties: any
  ): Promise<Integration> => {
    return produce(integration, draft => {
      const step: Step = {
        ...stepKind,
        configuredProperties,
      };

      return setStepInFlow(draft, flowId, step, position);
    });
  };

  /**
   * updates a step of type connection to the provided integration object if
   * a step exists at the provided `flow` and `position` indexes; a new step is
   * added otherwise.
   *
   * @param integration - the integration object to modify
   * @param connection - the connection object that's been used to set up the
   * step
   * @param action - the action that's been used to set up the step
   * @param flowId - the zero-based index of the flow where to add the step
   * @param position - the zero-based index of the steps where to add the step
   * @param configuredProperties - the values configured by the user for the step
   *
   * @todo perhaps rename it with a better name
   * @todo should we check `flow` and `position` to see if they are valid?
   */
  const updateOrAddConnection = async (
    integration: Integration,
    connection: Connection,
    action: Action,
    flowId: string,
    position: number,
    configuredProperties: any
  ): Promise<Integration> => {
    const actionDescriptor = await getActionDescriptor(
      connection.id!,
      action.id!,
      configuredProperties
    );
    return produce(integration, draft => {
      const step: Step = {
        action,
        configuredProperties,
        connection,
        id: flowId,
      };
      if (actionDescriptor) {
        step.action!.descriptor = actionDescriptor;
      }
      step.stepKind = 'endpoint';
      draft.flows = draft.flows!.map(f => {
        if (f.id === flowId) {
          if (f.steps![position]) {
            f.steps![position] = step;
          } else {
            f.steps!.splice(position, 0, step);
            draft.tags = Array.from(
              new Set([...(draft.tags || []), connection.id!])
            );
          }
        }
        return f;
      });
    });
  };

  /**
   * asynchronously saves the provided integration, returning the saved
   * integration in case of success.
   *
   * @param integration
   *
   * @todo make the returned object immutable to avoid uncontrolled changes
   */
  const saveIntegration = async (
    integration: Integration
  ): Promise<Integration> => {
    const response = await callFetch({
      body: integration,
      headers: apiContext.headers,
      method: integration.id ? 'PUT' : 'POST',
      url: integration.id
        ? `${apiContext.apiUri}/integrations/${integration.id}`
        : `${apiContext.apiUri}/integrations`,
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return !integration.id
      ? ((await response.json()) as Integration)
      : Promise.resolve(integration);
  };

  /**
   * Tags the integration with the given CI/CD environments
   * @param integrationId
   * @param environments
   */
  const tagIntegration = async (
    integrationId: string,
    environments: string[]
  ) => {
    return callFetch({
      body: environments,
      headers: apiContext.headers,
      method: 'PUT',
      url: `${apiContext.apiUri}/public/integrations/${integrationId}/tags`,
    });
  };

  return {
    addConnection,
    addStep,
    deleteIntegration,
    deployIntegration,
    exportIntegration,
    getActionDescriptor,
    getDeployment,
    importIntegration,
    replaceDraft,
    saveIntegration,
    setAttributes,
    tagIntegration,
    undeployIntegration,
    updateConnection,
    updateOrAddConnection,
    updateStep,
  };
};
