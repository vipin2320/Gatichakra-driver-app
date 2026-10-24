const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/Ramesh Kumar/g, '{driverProfile?.name || "Driver"}');
code = code.replace(/Ramesh K\./g, '{driverProfile?.name?.split(" ")[0] || "Driver"}');
code = code.replace(/UP 16 AB 1234/g, '{driverProfile?.vehicleNumber || ""}');

fs.writeFileSync('src/App.tsx', code);
