import { StatementParseResult, ParsedPurchase } from './models/statementParseResult';
import pdfParse from 'pdf-parse';

export async function parseStatement(pdfBuffer: Buffer): Promise<StatementParseResult> {
    try {
        // Extract text using pdf-parse
        const data = await pdfParse(pdfBuffer);
        const fullText = data.text;
        
        const result: StatementParseResult = {
            success: false,
            parsedPurchases: [],
            extractedSections: []
        };

        // Add the full text for debugging
        result.extractedSections.push(fullText);

        // Extract due date from the statement
        const dueDate = extractDueDate(fullText);
        if (dueDate) {
            result.dueDate = dueDate;
        }

        // Look for the main section
        const gemVisaPromotionalRegex = /Unexpired Gem Visa promotional transactions/i;
        if (!gemVisaPromotionalRegex.test(fullText)) {
            result.error = "Could not find 'Unexpired Gem Visa promotional transactions' section in the PDF";
            return result;
        }

        // Extract the section after "Unexpired Gem Visa promotional transactions"
        const sectionMatch = fullText.match(/Unexpired Gem Visa promotional transactions([\s\S]*?)(?=\n\n|\f|$)/i);
        if (!sectionMatch) {
            result.error = "Could not extract the promotional transactions section content";
            return result;
        }

        const sectionText = sectionMatch[1];
        
        // Parse the purchases using the new column-based approach
        const purchases = parsePromotionalPurchasesByColumns(sectionText, fullText);
        result.parsedPurchases = purchases;

        if (result.parsedPurchases.length === 0) {
            result.error = "No promotional purchases found in the statement. This might be due to PDF formatting or text extraction issues.";
            // Add the section for debugging
            result.extractedSections.push(`Section text: ${sectionText}`);
        } else {
            result.success = true;
        }

        return result;

    } catch (error) {
        return {
            success: false,
            error: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: [],
            extractedSections: []
        };
    }
}

function parsePromotionalPurchasesByColumns(sectionText: string, fullText: string): ParsedPurchase[] {
    const purchases: ParsedPurchase[] = [];
    
    // Split text into lines and clean them
    const lines = sectionText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for header line to understand column positions
    let headerLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('statement date') || line.includes('description') || line.includes('total purchase') || line.includes('outstanding balance') || line.includes('promotion expiry')) {
            headerLineIndex = i;
            break;
        }
    }
    
    console.log('📊 Header line found at index:', headerLineIndex);
    if (headerLineIndex >= 0) {
        console.log('📊 Header line content:', lines[headerLineIndex]);
    }
    
    // Process each line after the header
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines or lines that look like headers/separators
        if (line.length < 10) continue;
        if (line.includes('Statement date')) continue;
        if (line.includes('Description')) continue;
        if (line.includes('Total purchase')) continue;
        if (line.includes('Outstanding balance')) continue;
        if (line.includes('Promotion Expiry')) continue;
        if (line.match(/^[-\s]+$/)) continue; // Skip separator lines
        
        console.log('🔍 Processing line:', line);
        
        // Parse the line using multiple approaches
        const purchase = parsePurchaseLine(line, fullText);
        if (purchase) {
            purchases.push(purchase);
            console.log('✅ Successfully parsed purchase:', purchase.name);
        } else {
            console.log('❌ Failed to parse line:', line);
        }
    }
    
    return purchases;
}

function parsePurchaseLine(line: string, fullText: string): ParsedPurchase | null {
    try {
        console.log('🔍 Parsing line:', line);
        
        // Expected patterns from the PDF:
        // Pattern 1: Date$Amount$Amount+DateDescription Text
        // Pattern 2: Date$Amount$Amount+Date+Description Text  
        // We need to separate amounts that are concatenated with dates
        
        // First, let's extract all the components using regex
        const components = extractLineComponents(line);
        if (!components) {
            console.log('❌ Could not extract components from line');
            return null;
        }
        
        console.log('🔧 Extracted components:', components);
        
        // Look for payment requirements in the surrounding lines
        const paymentInfo = parsePaymentRequirementsFromContext(line, fullText);
        
        console.log('💰 Parsed amounts - Total:', components.totalAmount, 'Outstanding:', components.outstandingBalance);
        console.log('📅 Dates - Statement:', components.statementDate, 'Expiry:', components.expiryDate);
        console.log('📝 Description:', components.description);
        console.log('💳 Payment info:', paymentInfo);
        
        // Validate amounts
        if (components.totalAmount <= 0 || components.outstandingBalance < 0 || components.outstandingBalance > components.totalAmount) {
            console.log('❌ Invalid amounts - Total:', components.totalAmount, 'Outstanding:', components.outstandingBalance);
            return null;
        }
        
        return {
            name: components.description,
            total: components.totalAmount,
            remaining: components.outstandingBalance,
            startDate: normalizeDate(components.statementDate),
            expiryDate: normalizeDate(components.expiryDate),
            minimumPayment: paymentInfo.minimumPayment,
            interestFreeMonths: paymentInfo.interestFreeMonths,
            paymentType: paymentInfo.paymentType
        };
        
    } catch (error) {
        console.error('❌ Error parsing purchase line:', error);
        return null;
    }
}

function extractLineComponents(line: string): {
    statementDate: string;
    totalAmount: number;
    outstandingBalance: number;
    expiryDate: string;
    description: string;
} | null {
    
    // Pattern: Date$Amount$Amount[OptionalText]Date[Description]
    // Example: "06/05/2025$1,364.00$1,364.0021/11/202506 months interest free"
    // Example: "18/09/2023$908.00$465.4517/09/2025Apple Financial Services"
    
    // Step 1: Extract the first date (statement date)
    const firstDateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (!firstDateMatch) {
        console.log('❌ No statement date found at start of line');
        return null;
    }
    const statementDate = firstDateMatch[1];
    
    // Step 2: Extract amounts after the first date
    const afterFirstDate = line.substring(statementDate.length);
    const amountMatches = afterFirstDate.match(/^\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (!amountMatches) {
        console.log('❌ Could not find two amounts after statement date');
        return null;
    }
    
    // Convert dollars to cents (backend expects cents)
    const totalAmount = Math.round(parseFloat(amountMatches[1].replace(/,/g, '')) * 100);
    const outstandingBalance = Math.round(parseFloat(amountMatches[2].replace(/,/g, '')) * 100);
    
    // Step 3: Find the expiry date
    // It should come after the amounts, might be concatenated with other text
    const afterAmounts = afterFirstDate.substring(amountMatches[0].length);
    
    // Look for the next date pattern
    const expiryDateMatch = afterAmounts.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (!expiryDateMatch) {
        console.log('❌ No expiry date found after amounts');
        return null;
    }
    const expiryDate = expiryDateMatch[1];
    
    // Step 4: Extract description
    // It comes after the expiry date
    const afterExpiryDate = afterAmounts.substring(afterAmounts.indexOf(expiryDate) + expiryDate.length);
    let description = afterExpiryDate.trim();
    
    // Clean up description - remove common payment terms that are not part of the merchant name
    description = description
        .replace(/^\d+\s*months?\s*interest\s*free\s*/i, '') // Remove "6 months interest free"
        .replace(/Monthly\s*payments?\s*required\s*/i, '') // Remove monthly payment text
        .replace(/Fixed\s*payment.*$/i, '') // Remove fixed payment text
        .replace(/^\d+mth\s*instalment\s*int\s*free\s*/i, '') // Remove "36mth instalment int free"
        .trim();
    
    // If description is empty or too short, try to extract merchant name
    if (!description || description.length < 3) {
        // Look for merchant names in common patterns
        const merchantMatch = afterExpiryDate.match(/([A-Za-z][A-Za-z\s\-\.]+)$/);
        if (merchantMatch) {
            description = merchantMatch[1].trim();
        }
        
        // Fallback to a generic name
        if (!description || description.length < 3) {
            description = `Purchase ${statementDate}`;
        }
    }
    
    return {
        statementDate,
        totalAmount,
        outstandingBalance,
        expiryDate,
        description
    };
}

function parsePaymentRequirementsFromContext(currentLine: string, fullText: string): {
    minimumPayment?: number;
    interestFreeMonths?: number;
    paymentType: 'fixed' | 'monthly' | 'none';
} {
    const result: {
        minimumPayment?: number;
        interestFreeMonths?: number;
        paymentType: 'fixed' | 'monthly' | 'none';
    } = {
        paymentType: 'none'
    };
    
    // Split full text into lines to find context around the current line
    const lines = fullText.split(/[\n\r]+/).map(line => line.trim());
    const currentLineIndex = lines.findIndex(line => line.includes(currentLine.substring(0, 20)));
    
    // Look in the current line and the next few lines specifically for this purchase
    const linesToCheck = [];
    if (currentLineIndex >= 0) {
        // Check current line and next 3 lines only (to avoid picking up requirements from other purchases)
        for (let i = currentLineIndex; i < Math.min(currentLineIndex + 4, lines.length); i++) {
            linesToCheck.push(lines[i]);
            // Stop if we hit another purchase line (starts with a date)
            if (i > currentLineIndex && lines[i].match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
                break;
            }
        }
    } else {
        // Fallback: only check the current line
        linesToCheck.push(currentLine);
    }
    
    const contextText = linesToCheck.join(' ');
    console.log('🔍 Checking payment context for purchase:', contextText.substring(0, 200));
    
    // Look for fixed payment requirements in the immediate context of this purchase
    const fixedPaymentMatch = contextText.match(/Fixed payment \$?([\d,]+\.?\d*) required/i);
    if (fixedPaymentMatch) {
        result.minimumPayment = parseFloat(fixedPaymentMatch[1].replace(/,/g, ''));
        result.paymentType = 'fixed';
        console.log('💰 Found fixed payment requirement for this purchase:', result.minimumPayment);
        return result;
    }
    
    // Look for monthly payment requirements with specific months
    const monthlyPaymentMatch = contextText.match(/(\d+)\s*months?\s*interest\s*free.*monthly\s*payments?\s*required/i);
    if (monthlyPaymentMatch) {
        result.interestFreeMonths = parseInt(monthlyPaymentMatch[1]);
        result.paymentType = 'monthly';
        console.log('📅 Found monthly payment requirement for this purchase:', result.interestFreeMonths, 'months');
        return result;
    }
    
    // Look for just "monthly payments required" following interest-free months
    if (contextText.match(/monthly\s*payments?\s*required/i)) {
        // Look for months in the current line or immediate context
        const monthsMatch = contextText.match(/(\d+)\s*months?\s*interest\s*free/i);
        if (monthsMatch) {
            result.interestFreeMonths = parseInt(monthsMatch[1]);
            result.paymentType = 'monthly';
            console.log('📅 Found monthly payment requirement from context for this purchase:', result.interestFreeMonths, 'months');
            return result;
        }
    }
    
    // Look for interest-free periods in the immediate context (but don't assume they require payments)
    const interestFreeMatch = contextText.match(/(\d+)\s*months?\s*interest\s*free/i);
    if (interestFreeMatch) {
        // Only treat as monthly payment requirement if there's also mention of payments
        if (contextText.match(/payment/i)) {
            result.interestFreeMonths = parseInt(interestFreeMatch[1]);
            result.paymentType = 'monthly';
            console.log('📅 Found interest-free period with payment requirement for this purchase:', result.interestFreeMonths, 'months');
            return result;
        } else {
            console.log('📅 Found interest-free period but no payment requirement for this purchase:', interestFreeMatch[1], 'months');
        }
    }
    
    console.log('📝 No specific payment requirements found for this purchase');
    return result;
}

function convertNZDateToUTC(nzDateStr: string): string {
    try {
        // Parse DD/MM/YYYY format as NZ date
        const parts = nzDateStr.split('/');
        if (parts.length !== 3) {
            throw new Error(`Invalid date format: ${nzDateStr}`);
        }
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            throw new Error(`Invalid date components: ${nzDateStr}`);
        }
        
        // To match the UI's date format, we need to create a date that represents
        // the same calendar day in UTC. The UI stores dates as start of day UTC.
        // So for NZ date "15/06/2025", we want to store as "2025-06-15T00:00:00.000Z"
        // regardless of timezone conversion.
        
        // Create the date directly in UTC format to match UI behavior
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        
        console.log(`📅 NZ Date: ${nzDateStr} -> UTC (calendar day match): ${utcDate.toISOString()}`);
        
        return utcDate.toISOString();
    } catch (error) {
        console.error('❌ Error converting NZ date to UTC:', error);
        // Fallback to basic conversion if timezone conversion fails
        return normalizeDate(nzDateStr) + 'T00:00:00.000Z';
    }
}



function extractDueDate(fullText: string): string | null {
    try {
        // Look for "Due date:" followed by a date in DD/MM/YYYY format
        const dueDateMatch = fullText.match(/Due date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dueDateMatch) {
            const dateStr = dueDateMatch[1];
            console.log('📅 Found due date in statement (NZ timezone):', dateStr);
            
            // Convert NZ date to UTC ISO format
            const utcIsoDate = convertNZDateToUTC(dateStr);
            console.log('📅 Converted NZ due date to UTC:', utcIsoDate);
            return utcIsoDate;
        }
        
        console.log('❌ No due date found in statement');
        return null;
    } catch (error) {
        console.error('❌ Error extracting due date:', error);
        return null;
    }
}

function normalizeDate(dateStr: string): string {
    try {
        // Parse DD/MM/YYYY format to ISO format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    } catch (error) {
        return dateStr;
    }
} 