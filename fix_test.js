const fs = require('fs');
let code = fs.readFileSync('src/tests/UserContext.test.tsx', 'utf8');

code = code.replace(/triggerAuthChange\(null\)/g, 'act(() => triggerAuthChange(null))');
code = code.replace(/screen\.getByText\('Sign In'\)\.click\(\)/g, 'act(() => { screen.getByText("Sign In").click() })');
code = code.replace(/screen\.getByText\('Sign Out'\)\.click\(\)/g, 'act(() => { screen.getByText("Sign Out").click() })');

fs.writeFileSync('src/tests/UserContext.test.tsx', code);
