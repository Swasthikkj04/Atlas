import { HttpDiscoveryService } from '../infrastructure/discovery/http/http-discovery.service';
import { DnsDiscoveryService } from '../infrastructure/discovery/dns/dns-discovery.service';
import { SslDiscoveryService } from '../infrastructure/discovery/ssl/ssl-discovery.service';

async function testGithub() {
  const httpService = new HttpDiscoveryService();
  const dnsService = new DnsDiscoveryService();
  const sslService = new SslDiscoveryService();

  console.log('=== DISCOVERING GITHUB.COM ===');
  const httpResult = await httpService.discover('github.com');
  const dnsResult = await dnsService.discover('github.com');
  const sslResult = await sslService.discover('github.com');

  console.log('\n--- HTTP RESULT ---');
  console.log(JSON.stringify(httpResult, null, 2));

  console.log('\n--- DNS RESULT ---');
  console.log(JSON.stringify(dnsResult, null, 2));

  console.log('\n--- SSL RESULT ---');
  console.log(JSON.stringify(sslResult, null, 2));
}

testGithub().catch(console.error);
