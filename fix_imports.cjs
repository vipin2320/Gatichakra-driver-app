const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace("Crown\n}", "Crown, Map\n}");
fs.writeFileSync('src/App.tsx', content);
