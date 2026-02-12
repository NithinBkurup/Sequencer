# MPAS Sequencer Application

## Overview
Production sequencing and resequencing application for MPAS manufacturing system.

## Features

### Sequencing Module
- ✅ **No-click-required drag & drop** - Drag multiple items from left to right without clicking after each drag
- ✅ **Multi-select support** - Select multiple orders using checkboxes
- ✅ **Dynamic reordering** - Drag & drop to reorder scheduled orders
- ✅ **Auto-calculation** - Scheduled times auto-calculated based on takt time
- ✅ **Cancel button removed** - Only OK-Commit button for streamlined workflow

### Resequencing Module  
- ✅ **Swap buttons removed** - All operations via drag & drop
- ✅ **Row-level reordering** - Drag individual orders to swap schedule times
- ✅ **Material group reordering** - Drag material groups to swap entire blocks
- ✅ **Automatic sync** - Both views update automatically when changes are made
- ✅ **Cancel button removed** - Only OK-Commit button

### Common Features
- ✅ **Universal URL parameters** - Works with any plant/line combination
- ✅ **User tracking** - Username and Client ID captured via URL
- ✅ **Database logging** - All changes logged with user info

## Installation

1. Install dependencies:
```bash
npm install express cors mssql
```

2. Start the server:
```bash
node server.js
```

Server will run on http://localhost:3000

## URL Parameters

### Required Parameters
- `plant` - Plant code (e.g., 2002)
- `line` - Line code (e.g., 113, 102, 1c03)
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)

### Optional Parameters
- `material` - Material code filter (default: ALL)
- `username` or `user` - User performing the operation
- `clientid` or `client` - Client/workstation ID

## Usage Examples

### Sequencing URLs

**Plant 2002, Line 113:**
```
http://localhost:3000/sequencing.html?plant=2002&line=113&from=2025-12-20&to=2025-12-20&username=John&clientid=WS001
```

**Plant 2002, Line 102:**
```
http://localhost:3000/sequencing.html?plant=2002&line=102&from=2026-02-20&to=2026-02-20&username=Sarah&clientid=WS002
```

**Plant 2002, Line 1c03:**
```
http://localhost:3000/sequencing.html?plant=2002&line=1c03&from=2026-01-20&to=2026-01-20&username=Mike&clientid=WS003
```

### Resequencing URLs

**Plant 2002, Line 113:**
```
http://localhost:3000/resequencing.html?plant=2002&line=113&from=2025-12-20&to=2025-12-20&username=John&clientid=WS001
```

**Any Line - General Format:**
```
http://localhost:3000/resequencing.html?plant={PLANT}&line={LINE}&from={DATE}&to={DATE}&username={USER}&clientid={CLIENT}
```

## How to Use

### Sequencing Workflow

1. **Open sequencing page** with appropriate URL parameters
2. **Left panel** shows unscheduled orders
3. **Drag orders** from left to right panel (no click required!)
   - Drag single orders
   - Select multiple (checkbox) and drag together
   - Drag multiple times without clicking between drags
4. **Reorder** in right panel by dragging up/down
5. **Adjust takt time** if needed and click Recalc
6. **Click OK - Commit** to save to database

### Resequencing Workflow

1. **Open resequencing page** with appropriate URL parameters
2. **Left panel** shows scheduled orders (row view)
3. **Right panel** shows material groups (block view)
4. **Reorder individual orders:**
   - Drag orders up/down in left panel
   - Schedule times swap automatically
5. **Reorder material groups:**
   - Drag material groups up/down in right panel
   - All orders in the group move together
   - Both panels update automatically
6. **Click OK - Commit** to save to database

## Database Updates

### Sequencing Commit
Updates `MPAS_CREATED_ORDERS` table:
- Sets `ScheduledTime`
- Sets `Sflag = 1`
- Sets `SflagDateTime = GETDATE()`
- Sets `OrderStatus = 'Ready'`
- Sets `ModifiedBy = username`
- Sets `ClientID = clientid`
- Only updates where `MESReadStatus <> '1'`

### Resequencing Commit
Updates `MPAS_CREATED_ORDERS` table:
- Updates `ScheduledTime`
- Sets `Rflag = 1`
- Sets `RflagDateTime = GETDATE()`
- Sets `ModifiedBy = username`
- Sets `ClientID = clientid`
- Only updates where `MESReadStatus <> '1'`

## Technical Details

### Drag & Drop Implementation
- **No focus loss** - Optimized rendering preserves UI state
- **Multi-item support** - Drag badge shows count when multiple items selected
- **Visual feedback** - Drop zones highlight, dragged items fade
- **Cancel support** - Drop on left panel cancels the drag

### Files Structure
```
sequencing.html       - Main sequencing interface
resequencing.html     - Resequencing interface
server.js            - Express server with SQL integration
api.js               - Client API functions
app.js               - URL parameter handling
state.js             - State management
```

## Troubleshooting

### Orders not loading
- Check SQL server connection
- Verify stored procedure `usp_Get_MPAS_Orders_For_Sequencing` exists
- Check URL parameters are correct

### Drag not working
- Ensure browser supports HTML5 drag & drop
- Try refreshing the page
- Check browser console for errors

### Commit failing
- Verify database connection
- Check `MESReadStatus` field values
- Review server console for SQL errors

## Support

For issues or questions, check:
1. Browser console for client-side errors
2. Server console for SQL errors
3. Database table structure matches expected schema