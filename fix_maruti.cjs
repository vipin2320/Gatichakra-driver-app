const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/Maruti Swift Dzire \(City Cab\)/g, '{driverProfile?.vehicleModel || ""} ({driverProfile?.vehicleType || ""})');

fs.writeFileSync('src/App.tsx', code);
