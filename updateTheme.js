const fs = require('fs');

['DonorDashboard', 'NgoDashboard', 'VolunteerDashboard'].forEach(name => {
  const file = 'd:/Food Waste Reduction Project/foodbridge/client/src/pages/dashboards/' + name + '.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('const toggleTheme')) {
    content = content.replace(/(const showToast.*?=\s*.*?\{.*?\};)/s, 
      `$1\n\n  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');\n  useEffect(() => {\n    document.documentElement.setAttribute('data-theme', theme);\n    localStorage.setItem('theme', theme);\n  }, [theme]);\n  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');`
    );
    
    content = content.replace(/<div className="db-topbar-right">\s*<button className="db-btn db-btn-ghost db-btn-sm">\s*<i className="fas fa-bell">/s,
      `<div className="db-topbar-right">\n              <button className="db-btn db-btn-ghost db-btn-sm" onClick={toggleTheme} aria-label="Toggle theme">\n                {theme === 'light' ? '🌙' : '☀️'}\n              </button>\n              <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell">`
    );
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + name);
  } else {
    console.log('Skipping ' + name);
  }
});
