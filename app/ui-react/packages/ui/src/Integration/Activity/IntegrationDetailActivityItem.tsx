import { Col, Icon, ListView, Row, Table } from 'patternfly-react';
import * as React from 'react';

import './IntegrationDetailActivityItem.css';

export interface IIntegrationDetailActivityItemProps {
  date: string;
  errorCount: number;
  i18nErrorsFound: string;
  i18nHeaderStep?: string;
  i18nHeaderTime?: string;
  i18nHeaderDuration?: string;
  i18nHeaderDurationUnit?: string;
  i18nHeaderStatus?: string;
  i18nHeaderOutput?: string;
  i18nNoErrors: string;
  i18nNoOutput?: string;
  i18nNoSteps: string;
  i18nVersion: string;
  steps: JSX.Element[];
  time: string;
  version?: string;
}

const headerFormat = (value: string) => <Table.Heading>{value}</Table.Heading>;
const cellFormat = (value: string) => <Table.Cell>{value}</Table.Cell>;
const statusCellFormat = (status: string) => (
  <Table.Cell>
    {status === 'Success' ? (
      <>
        <Icon type="pf" name="ok" /> Success
      </>
    ) : (
      <>
        <Icon type="pf" name="error-circle-o" /> Error
      </>
    )}
  </Table.Cell>
);
const outputCellFormat = (output: string) => (
  <Table.Cell>
    <pre className="integration-detail-activity-item-step-output">{output}</pre>
  </Table.Cell>
);

export class IntegrationDetailActivityItem extends React.Component<
  IIntegrationDetailActivityItemProps
> {
  public render() {
    return (
      <ListView.Item
        className="integration-detail-activity-item"
        key={this.props.time}
        actions={
          <div className="integration-detail-activity-item__status-item">
            {this.props.errorCount > 0 ? (
              <span>
                <Icon type="pf" name="error-circle-o" />
                {'  '}
                {this.props.i18nErrorsFound}
              </span>
            ) : (
              <span>
                <Icon type="pf" name="ok" />
                {'  '}
                {this.props.i18nNoErrors}
              </span>
            )}
          </div>
        }
        leftContent={this.props.date}
        heading={<></>}
        description={this.props.time}
        additionalInfo={[
          <ListView.InfoItem key={1}>
            {this.props.i18nVersion}
            &nbsp;
            {this.props.version}
          </ListView.InfoItem>,
        ]}
      >
        <Row>
          {this.props.steps ? (
            <Col sm={11}>
              <Table.PfProvider
                striped={true}
                bordered={true}
                hover={true}
                columns={[
                  {
                    cell: {
                      formatters: [cellFormat],
                      property: 'step',
                    },
                    header: {
                      formatters: [headerFormat],
                      label: 'Step',
                    },
                  },
                  {
                    cell: {
                      formatters: [cellFormat],
                      property: 'time',
                    },
                    header: {
                      formatters: [headerFormat],
                      label: 'Time',
                    },
                  },
                  {
                    cell: {
                      formatters: [cellFormat],
                      property: 'duration',
                    },
                    header: {
                      formatters: [headerFormat],
                      label: 'Duration',
                    },
                  },
                  {
                    cell: {
                      formatters: [statusCellFormat],
                      property: 'status',
                    },
                    header: {
                      formatters: [headerFormat],
                      label: 'Status',
                    },
                  },
                  {
                    cell: {
                      formatters: [outputCellFormat],
                      property: 'output',
                    },
                    header: {
                      formatters: [headerFormat],
                      label: 'Output',
                    },
                  },
                ]}
              >
                <Table.Header />
                {this.props.steps}
              </Table.PfProvider>
            </Col>
          ) : (
            <Col sm={11}>
              <span>{this.props.i18nNoSteps}</span>
            </Col>
          )}
        </Row>
      </ListView.Item>
    );
  }
}
