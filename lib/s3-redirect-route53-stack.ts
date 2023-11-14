import * as cdk from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, Function, FunctionCode, FunctionEventType } from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CnameRecord, HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface S3RedirectRoute53StackProps extends cdk.StackProps {
  domainNames: string[];
  subdomain?: string;
  redirectUrl: string;
}
export class S3RedirectRoute53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: S3RedirectRoute53StackProps) {
    super(scope, id, props);

    //create a lambda function that returns with 301
    const lambda = new Function(this, 'redirect', {
      code: FunctionCode.fromInline(`function handler(event) {return {statusCode: 301,headers: {location: { value: '${props.redirectUrl}' }}};}`)
    });
    const { certificate, domainNames, hostedZones } = this.createCertificate(props.subdomain ?? 'tiny', props.domainNames);
    const distrib = new Distribution(this, `Distribution`, {
      defaultBehavior: {
        origin: new HttpOrigin(new URL(props.redirectUrl).hostname),
        functionAssociations: [{
          function: lambda,
          eventType: FunctionEventType.VIEWER_REQUEST,
        }],
      },
      domainNames,
      certificate: certificate
    });

    this.createRecords(distrib, { certificate, domainNames, hostedZones });

  }



  createCertificate(subdomain: string, subjectAlternativeNames: string[]) {
    const domainNames = subjectAlternativeNames.map(name => `${subdomain}.${name}`);
    const hostedZones = subjectAlternativeNames.reduce((acc: { [key: string]: IHostedZone }, hostedZoneName: string): { [key: string]: IHostedZone } => {
      const key = `${subdomain}.${hostedZoneName}`;
      if (acc[key]) return acc;
      return {
        ...acc,
        [key]: HostedZone.fromLookup(this, `hostedZone-${hostedZoneName.replaceAll('.', '-')}`, { domainName: hostedZoneName })
      };
    }
      , {});

    const certificate = new Certificate(this, `Certificate`, {
      domainName: domainNames[0],
      subjectAlternativeNames: domainNames,
      validation: CertificateValidation.fromDnsMultiZone(hostedZones)
    });
    return {
      certificate,
      domainNames,
      hostedZones
    };
  }

  createRecords(distribution: Distribution, props: { certificate: Certificate, domainNames: string[], hostedZones: { [key: string]: IHostedZone } }) {
    props.domainNames.forEach(domainName => {
      const cnameRecord = new CnameRecord(this, `CnameRecord-${domainName.replaceAll('.', '-')}`, {
        recordName: domainName,
        zone: props.hostedZones[domainName],
        domainName: distribution.domainName,
      });
      new cdk.CfnOutput(this, `dns-${domainName.replaceAll('.', '-')}`, {
        value: cnameRecord.domainName
      });
    });
    return;

  }
}
