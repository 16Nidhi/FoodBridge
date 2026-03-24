const fs = require('fs');
const path = require('path');

const cssFiles = [
    'src/index.css',
    'src/pages/Home.css',
    'src/pages/Login.css',
    'src/components/common/Navbar.css',
    'src/components/common/Footer.css',
    'src/components/common/Dashboard.css'
];

const variables = `
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --card-bg: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;
  --accent: #10b981;
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #020617;
  --card-bg: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --accent: #34d399;
}
`;

function replaceColors(content) {
    let newContent = content;

    // Backgrounds
    newContent = newContent.replace(/background(-color)?\s*:\s*(#fff|#ffffff|white|\#f8fafc)([\s;!])/gi, 'background$1: var(--bg-primary)$3');
    newContent = newContent.replace(/background(-color)?\s*:\s*(#000|#000000|black|\#0f172a)([\s;!])/gi, 'background$1: var(--bg-primary)$3');
    newContent = newContent.replace(/background(-color)?\s*:\s*(#1e293b|#f1f5f9)([\s;!])/gi, 'background$1: var(--card-bg)$3');
    
    // Cards & Sections
    newContent = newContent.replace(/background\s*:\s*var\(--c-card\)/g, 'background: var(--card-bg)');
    newContent = newContent.replace(/background\s*:\s*var\(--c-bg\)/g, 'background: var(--bg-primary)');
    newContent = newContent.replace(/background\s*:\s*var\(--c-gradient-bg\)/g, 'background: var(--bg-primary)');
    
    // Colors
    newContent = newContent.replace(/color\s*:\s*(#000|#000000|black|#0f172a)([\s;!])/gi, 'color: var(--text-primary)$2');
    newContent = newContent.replace(/color\s*:\s*(#fff|#ffffff|white|#f1f5f9)([\s;!])/gi, 'color: var(--text-primary)$2');
    newContent = newContent.replace(/color\s*:\s*var\(--c-text\)/g, 'color: var(--text-primary)');
    newContent = newContent.replace(/color\s*:\s*var\(--c-muted\)/g, 'color: var(--text-secondary)');
    
    // Borders
    newContent = newContent.replace(/border-color\s*:\s*(#e2e8f0|#334155|#cbd5e1|#475569)([\s;!])/gi, 'border-color: var(--border-color)$2');
    newContent = newContent.replace(/border(-[a-z]+)?\s*:\s*([^;]+)(#e2e8f0|#334155|#cbd5e1|#475569)([\s;!])/gi, 'border$1: $2var(--border-color)$4');
    
    // General hex codes replacing
    // primary accent background
    newContent = newContent.replace(/#10b981|#34d399|var\(--c-primary\)/gi, 'var(--accent)');
    
    // Hardcoded white/black remaining
    newContent = newContent.replace(/:\s*#fff(fff)?([\s;!])/gi, ': var(--bg-secondary)$2');
    newContent = newContent.replace(/:\s*white([\s;!])/gi, ': var(--card-bg)$1');
    newContent = newContent.replace(/:\s*#000(000)?([\s;!])/gi, ': var(--text-primary)$2');

    return newContent;
}

cssFiles.forEach(file => {
    const fullPath = path.join(__dirname, 'foodbridge/client', file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        if (file === 'src/index.css') {
            // Remove old :root and [data-theme='dark'] blocks and insert the new variables
            content = content.replace(/:root\s*{[^}]*}/, variables);
            // also remove the old dark theme block, by searching for [data-theme='dark'] { ... }
            content = content.replace(/\[data-theme='dark'\]\s*{[^}]*}/, '');
        }
        
        let updatedContent = replaceColors(content);
        fs.writeFileSync(fullPath, updatedContent);
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${fullPath}`);
    }
});
