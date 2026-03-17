const fs = require('fs');
const file = 'd:/Food Waste Reduction Project/foodbridge/client/src/services/api.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/api\.(post|get|patch|put|delete)\(`\/([^`]+)`/g, (match, method, path) => {
    return `api.${method}(\`${path}\``;
});

fs.writeFileSync(file, content);
console.log('Fixed slashes in template literals');