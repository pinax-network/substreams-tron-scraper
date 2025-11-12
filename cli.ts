#!/usr/bin/env bun
import { spawn } from 'child_process';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const VERSION = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')).version;

const SERVICES = {
    'metadata': {
        path: './services/metadata_rpc.ts',
        description: 'Run metadata RPC service to fetch token metadata'
    },
    'trc20-balances': {
        path: './services/trc20_balances_rpc.ts',
        description: 'Run TRC20 balances RPC service'
    },
    'native-balances': {
        path: './services/native_balances_rpc.ts',
        description: 'Run native TRX balances RPC service'
    }
};

function printHelp() {
    console.log(`
Substreams Tron Scraper CLI v${VERSION}

Usage: cli.ts <command> [options]

Commands:
  run <service>     Run a specific service
  list              List all available services
  version           Show version information
  help              Show this help message

Services:
${Object.entries(SERVICES).map(([name, info]) => `  ${name.padEnd(20)} ${info.description}`).join('\n')}

Environment Variables (can be overridden with command line flags):
  --clickhouse-url <url>         ClickHouse database URL (default: http://localhost:8123)
  --clickhouse-username <user>   ClickHouse username (default: default)
  --clickhouse-password <pass>   ClickHouse password
  --clickhouse-database <db>     ClickHouse database name (default: default)
  --node-url <url>               TRON RPC node URL (default: https://tron-evm-rpc.publicnode.com)
  --concurrency <num>            Number of concurrent RPC requests (default: 10)
  --enable-prometheus            Enable Prometheus metrics endpoint
  --prometheus-port <port>       Prometheus metrics HTTP port (default: 9090)

Examples:
  cli.ts run metadata
  cli.ts run trc20-balances --concurrency 20
  cli.ts run native-balances --enable-prometheus --prometheus-port 8080
  cli.ts list
  cli.ts version
`);
}

function listServices() {
    console.log(`\nAvailable Services:\n`);
    Object.entries(SERVICES).forEach(([name, info]) => {
        console.log(`  ${name.padEnd(20)} ${info.description}`);
    });
    console.log('');
}

function showVersion() {
    console.log(`Substreams Tron Scraper CLI v${VERSION}`);
}

function parseArgs(args: string[]): { env: Record<string, string>, remaining: string[] } {
    const env: Record<string, string> = {};
    const remaining: string[] = [];
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('--')) {
            const flag = arg.slice(2);
            
            switch (flag) {
                case 'clickhouse-url':
                    env.CLICKHOUSE_URL = args[++i];
                    break;
                case 'clickhouse-username':
                    env.CLICKHOUSE_USERNAME = args[++i];
                    break;
                case 'clickhouse-password':
                    env.CLICKHOUSE_PASSWORD = args[++i];
                    break;
                case 'clickhouse-database':
                    env.CLICKHOUSE_DATABASE = args[++i];
                    break;
                case 'node-url':
                    env.NODE_URL = args[++i];
                    break;
                case 'concurrency':
                    env.CONCURRENCY = args[++i];
                    break;
                case 'enable-prometheus':
                    env.ENABLE_PROMETHEUS = 'true';
                    break;
                case 'prometheus-port':
                    env.PROMETHEUS_PORT = args[++i];
                    break;
                default:
                    console.error(`Unknown flag: ${arg}`);
                    process.exit(1);
            }
        } else {
            remaining.push(arg);
        }
    }
    
    return { env, remaining };
}

function runService(serviceName: string, envOverrides: Record<string, string>) {
    const service = SERVICES[serviceName as keyof typeof SERVICES];
    
    if (!service) {
        console.error(`Error: Unknown service '${serviceName}'`);
        console.log(`\nAvailable services: ${Object.keys(SERVICES).join(', ')}`);
        process.exit(1);
    }
    
    console.log(`Starting service: ${serviceName}\n`);
    
    const servicePath = resolve(__dirname, service.path);
    
    // Merge environment variables
    const env = {
        ...process.env,
        ...envOverrides
    };
    
    const child = spawn('bun', ['run', servicePath], {
        stdio: 'inherit',
        env
    });
    
    child.on('error', (err) => {
        console.error(`Failed to start service: ${err.message}`);
        process.exit(1);
    });
    
    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    printHelp();
    process.exit(0);
}

const command = args[0];

switch (command) {
    case 'help':
    case '--help':
    case '-h':
        printHelp();
        break;
        
    case 'version':
    case '--version':
    case '-v':
        showVersion();
        break;
        
    case 'list':
        listServices();
        break;
        
    case 'run':
        if (args.length < 2) {
            console.error('Error: Service name required');
            console.log('Usage: cli.ts run <service>');
            console.log(`Available services: ${Object.keys(SERVICES).join(', ')}`);
            process.exit(1);
        }
        const { env, remaining } = parseArgs(args.slice(2));
        runService(args[1], env);
        break;
        
    default:
        console.error(`Error: Unknown command '${command}'`);
        printHelp();
        process.exit(1);
}
