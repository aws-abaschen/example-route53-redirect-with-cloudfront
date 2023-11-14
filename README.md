# Simple redirect to an URL with Cloudfront and Lambda function

Change the values in [the deploy file](./bin/s3-redirect-route53.ts):

```typescript
    domainNames: ['example.com', 'example.ch'],
    redirectUrl: 'https://some.full.url/with/complex/path?andQuery=params',
    subdomain: 'tiny'
```

will redirect `tiny.example.com` and `tiny.example.ch` to `https://some.full.url/with/complex/path?andQuery=params`. Only one certificate will be created using the first domain but with the corresponding SANs

### Get started

```
yarn
cdk bootstrap
cdk deploy
```

NB: it only deploys in `us-east-1` due to functions used and certificate validation but it could be possible to fiddle with the regions and have cross region.