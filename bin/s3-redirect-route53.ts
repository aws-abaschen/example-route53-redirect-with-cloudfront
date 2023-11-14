#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3RedirectRoute53Stack } from '../lib/s3-redirect-route53-stack';

const app = new cdk.App();

new S3RedirectRoute53Stack(app, 'S3RedirectRoute53Stack', {

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  domainNames: ['example.com', `example.ch`],
  redirectUrl: 'https://some.full.url/with/complex/path?andQuery=params',
  subdomain: 'tiny'
});