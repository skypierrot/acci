# Lagging V2 - Refactored Lagging Indicators Page

This is a completely refactored version of the lagging indicators page, built according to the specifications in the refactoring guideline.

## Key Improvements

### 1. Correct Accident Code Parsing
- Properly parses accident codes in format: `HHH-AA-YYYY-NNN`
- Extracts year from YYYY position (not from accident date)
- Extracts site code from AA position

### 2. Accurate Calculations
- **LTIR/TRIR**: Uses 200,000 as default constant (not 1,000,000)
- **Indirect Damage**: Correctly calculated as Direct × 4
- **Loss Days**: 
  - Death = 7,500 days
  - Others = Actual calculation from return date - absence start date
  - Fallback to accident date if dates missing

### 3. Proper Data Filtering
- **Human Accidents**: Only includes '인적' and '복합' types for accident/victim counts
- **Property Damage**: Only includes '물적' and '복합' types
- **LTIR Targets**: Death, Serious, Minor, Other
- **TRIR Targets**: Death, Serious, Minor, Hospital, Other

### 4. Modular Architecture
```
lagging-v2/
├── types/          # TypeScript type definitions
├── services/       # API and calculation services
├── cards/          # KPI card components
├── charts/         # Chart components
├── common/         # Shared components
└── hooks/          # Custom React hooks
```

### 5. Performance Optimizations
- Batch API for fetching all data in one request
- Memory caching with 5-minute TTL
- Efficient data transformations
- Optimized re-renders with proper React patterns

### 6. Mobile Responsive Design
- Tab navigation for mobile screens
- Responsive grid layouts
- Touch-friendly controls
- Optimized chart sizes for small screens

## Usage

Access the new page at: `/lagging-v2`

## API Endpoints

- `GET /api/lagging/v2/summary/:year` - Get summary for specific year
- `POST /api/lagging/v2/clear-cache` - Clear cache for testing

## Components

### KPI Cards
- `AccidentCountCard` - Shows accident counts (total, employee, contractor, by site)
- `VictimCountCard` - Shows victim counts and injury types
- `PropertyDamageCard` - Shows direct and indirect property damage
- `LTIRCard` - Lost Time Injury Rate with constant toggle
- `TRIRCard` - Total Recordable Injury Rate with constant toggle
- `SeverityRateCard` - Severity rate and loss days

### Charts
- `BasicTrendChart` - 5-year trend of accidents, victims, property damage
- `BasicSafetyIndexChart` - 5-year trend of LTIR, TRIR, severity rate
- `DetailedAccidentChart` - 10-year stacked chart by site
- `DetailedSafetyIndexChart` - 10-year detailed LTIR/TRIR by employee type
- `DetailedSeverityRateChart` - 10-year severity rate with loss days

## Testing

To test the implementation:

1. Ensure backend is running with docker-compose
2. Access `/lagging-v2` in the browser
3. Verify calculations match the guideline specifications
4. Test year selection and chart type switching
5. Check mobile responsiveness

## Migration from Old Version

The old version (`/lagging`) remains untouched. Once this v2 version is validated:
1. Update navigation links to point to `/lagging-v2`
2. Optionally redirect `/lagging` to `/lagging-v2`
3. Archive or remove old implementation files