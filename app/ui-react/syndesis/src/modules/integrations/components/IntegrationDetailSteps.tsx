import {
  ENDPOINT,
  getIntegrationStepIcon,
  getSteps,
  HIDE_FROM_CONNECTION_PAGES,
} from '@syndesis/api';
import { Integration } from '@syndesis/models';
import {
  IntegrationStepsHorizontalItem,
  IntegrationStepsHorizontalView,
  PageSection,
} from '@syndesis/ui';
import * as React from 'react';
import resolvers from '../../resolvers';
import { IUIStep } from './editor/interfaces';
import { toUIStepKindCollection } from './editor/utils';

export interface IIntegrationDetailStepsProps {
  integration: Integration;
}

export class IntegrationDetailSteps extends React.Component<
  IIntegrationDetailStepsProps
> {
  public render() {
    const flowId = this.props.integration.flows![0].id!;
    const steps = getSteps(this.props.integration, flowId);

    return (
      <PageSection variant={'light'}>
        <IntegrationStepsHorizontalView>
          {toUIStepKindCollection(steps).map((s: IUIStep, idx: number) => {
            const isFirst = idx === 0;
            const stepUri =
              s.stepKind === ENDPOINT && !s.metadata[HIDE_FROM_CONNECTION_PAGES]
                ? resolvers.connections.connection.details({
                    connection: s.connection!,
                  }).pathname
                : undefined;

            return (
              <React.Fragment key={idx + s.id!}>
                <IntegrationStepsHorizontalItem
                  name={s.name}
                  title={s.title}
                  icon={getIntegrationStepIcon(
                    process.env.PUBLIC_URL,
                    this.props.integration,
                    flowId,
                    idx
                  )}
                  href={stepUri}
                  isFirst={isFirst}
                />
              </React.Fragment>
            );
          })}
        </IntegrationStepsHorizontalView>
      </PageSection>
    );
  }
}
