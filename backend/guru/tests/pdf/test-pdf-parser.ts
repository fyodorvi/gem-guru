#!/usr/bin/env node
import path from 'path';
import { parseStatement } from '../../src/statementParser';
import { StatementParseResult } from '../../src/models/statementParseResult';
import * as fs from 'fs';

// Import node-poppler with proper typing
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Poppler } = require('node-poppler') as { Poppler: new () => PopperInstance };

interface PopperInstance {
    pdfToText(filePath: string): Promise<string>;
}

const COLORS: Record<string, string> = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

// Constants for magic numbers
const TEXT_PREVIEW_LENGTH = 1000;
const SECTION_PREVIEW_LENGTH = 200;

interface TestOptions {
    filename: string;
    verbose: boolean;
    usePoppler: boolean;
    showText: boolean;
}

function colorize(text: string, color: string): string {
    return `${color}${text}${COLORS.reset}`;
}

function formatHeader(text: string): string {
    const line = '='.repeat(text.length + 4);
    return `${line}\n  ${text}\n${line}`;
}

function formatSection(title: string, content: string): string {
    return `${colorize(title, COLORS.bold + COLORS.cyan)}\n${content}\n`;
}

function formatResult(result: StatementParseResult): string {
    const output: string[] = [];
    
    output.push(formatSection('📊 PARSING RESULTS', ''));
    output.push(colorize(`• Total Purchases: ${result.parsedPurchases.length}`, COLORS.green));
    output.push(colorize(`• Statement Date: ${result.statementDate || 'N/A'}`, COLORS.blue));
    output.push(colorize(`• Due Date: ${result.dueDate || 'N/A'}`, COLORS.blue));
    output.push('');
    
    if (result.parsedPurchases.length > 0) {
        output.push(formatSection('💳 PURCHASES', ''));
        result.parsedPurchases.forEach((purchase, index) => {
            output.push(colorize(`Purchase ${index + 1}:`, COLORS.bold + COLORS.yellow));
            output.push(colorize(`  📅 Start Date: ${purchase.startDate}`, COLORS.gray));
            output.push(colorize(`  💰 Total: $${(purchase.total / 100).toFixed(2)}`, COLORS.green));
            output.push(colorize(`  💰 Remaining: $${(purchase.remaining / 100).toFixed(2)}`, COLORS.green));
            output.push(colorize(`  🏪 Merchant: ${purchase.name}`, COLORS.cyan));
            output.push(colorize(`  💳 Payment: ${purchase.paymentType || 'none'}`, COLORS.magenta));
            output.push(colorize(`  📅 Expiry: ${purchase.expiryDate}`, COLORS.blue));
            output.push('');
        });
    }
    
    return output.join('\n');
}

async function testWithPoppler(filePath: string, options: TestOptions): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(colorize('\n🔧 Testing with node-poppler (Poppler library)', COLORS.bold + COLORS.cyan));
    
    try {
        const poppler = new Poppler();
        const text = await poppler.pdfToText(filePath);
        
        if (options.showText) {
            // eslint-disable-next-line no-console
            console.log(formatSection('📄 EXTRACTED TEXT (Poppler)', text.substring(0, TEXT_PREVIEW_LENGTH) + '...'));
        }
        
        // Look for the promotional section
        const sectionMatch = text.match(/Unexpired Gem Visa promotional transactions[\s\S]*?(?=\n\n|\nStatement|\nPlease|$)/);
        if (sectionMatch) {
            // eslint-disable-next-line no-console
            console.log(colorize('✅ Found promotional section with Poppler', COLORS.green));
            // eslint-disable-next-line no-console
            console.log(colorize('First 200 chars:', COLORS.gray));
            // eslint-disable-next-line no-console
            console.log(sectionMatch[0].substring(0, SECTION_PREVIEW_LENGTH) + '...');
        } else {
            // eslint-disable-next-line no-console
            console.log(colorize('❌ Could not find promotional section', COLORS.red));
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.error(colorize(`❌ Error with node-poppler: ${errorMessage}`, COLORS.red));
        if (errorMessage.includes('pdftotext')) {
            // eslint-disable-next-line no-console
            console.log(colorize('\n💡 Install Poppler utilities:', COLORS.yellow));
            // eslint-disable-next-line no-console
            console.log(colorize('   macOS: brew install poppler', COLORS.gray));
            // eslint-disable-next-line no-console
            console.log(colorize('   Ubuntu: sudo apt-get install poppler-utils', COLORS.gray));
        }
    }
}

async function testWithPdfParse(filePath: string, options: TestOptions): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(colorize('\n🔧 Testing with pdf-parse (current approach)', COLORS.bold + COLORS.cyan));
    
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await parseStatement(fileBuffer);
        
        // eslint-disable-next-line no-console
        console.log(formatResult(result));
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.error(colorize(`❌ Error with pdf-parse: ${errorMessage}`, COLORS.red));
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const options: TestOptions = {
        filename: args[0] || '',
        verbose: args.includes('--verbose') || args.includes('-v'),
        usePoppler: args.includes('--poppler') || args.includes('-p'),
        showText: args.includes('--text') || args.includes('-t'),
    };

    if (args.includes('--help') || args.includes('-h')) {
        // eslint-disable-next-line no-console
        console.log(colorize(formatHeader('PDF Parser Tester'), COLORS.bold + COLORS.green));
        // eslint-disable-next-line no-console
        console.log(`
Usage: npm run test-pdf [filename] [options]

Options:
  --verbose, -v     Show verbose output
  --poppler, -p     Only test with poppler
  --text, -t        Show extracted text
  --help, -h        Show this help message

Examples:
  npm run test-pdf working.pdf
  npm run test-pdf not-working.pdf --poppler --text
  npm run test-pdf working.pdf --verbose
        `);
        return;
    }

    if (!options.filename) {
        // eslint-disable-next-line no-console
        console.error(colorize('❌ Please provide a filename', COLORS.red));
        return;
    }

    const samplesDir = path.join(__dirname, 'samples');
    const filePath = path.join(samplesDir, options.filename);

    if (!fs.existsSync(filePath)) {
        // eslint-disable-next-line no-console
        console.error(colorize(`❌ File not found: ${filePath}`, COLORS.red));
        // eslint-disable-next-line no-console
        console.log(colorize('Available files in samples/:', COLORS.yellow));
        const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.pdf'));
        files.forEach(file => {
            // eslint-disable-next-line no-console
            console.log(colorize(`  - ${file}`, COLORS.gray));
        });
        return;
    }

    // eslint-disable-next-line no-console
    console.log(colorize(formatHeader(`Testing PDF: ${options.filename}`), COLORS.bold + COLORS.green));

    if (options.usePoppler) {
        await testWithPoppler(filePath, options);
    } else {
        await testWithPdfParse(filePath, options);
        await testWithPoppler(filePath, options);
    }
}

// eslint-disable-next-line no-console
main().catch(console.error); 