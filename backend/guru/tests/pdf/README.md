# PDF Parser Testing

This directory contains tools for testing and debugging the PDF statement parsing functionality.

## Structure

```
guru/tests/pdf/
├── README.md                    # This file
├── test-pdf-parser.ts          # Main testing script
└── samples/                    # PDF samples directory
    ├── May_21,_2025_statement.pdf  # Sample statement
    └── ... (add more PDFs here)
```

## Usage

### Prerequisites

Make sure you're in the `backend/guru` directory and have installed dependencies:

```bash
cd backend/guru
npm install
```

### Running the Test

```bash
npm run test-pdf <filename>
```

**Examples:**

```bash
# Test with the sample statement
npm run test-pdf May_21,_2025_statement.pdf

# Test with your own PDF file (place it in samples/ directory first)
npm run test-pdf my_statement.pdf
```

### Output

The script will display:

1. **Basic Information**
   - File name and path
   - File size
   - Loading status

2. **Parse Results**
   - Success/failure status
   - Extracted due date
   - Extracted statement date
   - Number of parsed purchases

3. **Purchases Detail**
   - Name/description
   - Total amount
   - Remaining balance
   - Start and expiry dates
   - Payment type and requirements

4. **Debug Information**
   - Extracted text sections (for debugging)
   - Error messages (if any)

### Adding New Test Files

1. Place your PDF files in the `guru/tests/pdf/samples/` directory
2. PDF files are automatically excluded from git (see `.gitignore`)
3. Run the test script with your filename

## Script Features

- **Colored output** for better readability
- **Detailed error reporting** with stack traces
- **Debug information** showing extracted text sections
- **Exit codes** (0 for success, 1 for failure)
- **File validation** to ensure files exist before processing

## Debugging Tips

1. **Check the extracted sections** - these show the raw text that was extracted from the PDF
2. **Look for parsing errors** - the script will show detailed error messages
3. **Verify PDF format** - ensure your PDF matches the expected Gem Visa statement format
4. **Test with known good files** - use the sample statement to verify the script works

## Expected PDF Format

The parser expects PDFs with:
- A section titled "Unexpired Gem Visa promotional transactions"
- Tabular data with statement dates, amounts, and expiry dates
- Due date information
- Statement date information

## Troubleshooting

If the parser fails:
1. Check if the PDF is a valid Gem Visa statement
2. Verify the PDF isn't corrupted or password-protected
3. Look at the extracted text sections to see what was actually parsed
4. Check if the PDF format has changed from the expected structure 