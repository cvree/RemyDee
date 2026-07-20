/* Syntax-check every inline <script> block with new Function(code). */
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || 'RemyDee_TheLostLexicon.html', 'utf8');
const blocks = [];
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = re.exec(html))) blocks.push({ code: m[1], at: html.slice(0, m.index).split('\n').length });
let fail = 0;
blocks.forEach((b, i) => {
  try { new Function(b.code); console.log(`block ${i + 1} (line ${b.at}): OK (${b.code.length} chars)`); }
  catch (e) { fail++; console.error(`block ${i + 1} (line ${b.at}): SYNTAX ERROR — ${e.message}`); }
});
console.log(fail ? `FAIL: ${fail} block(s) with errors` : `PASS: all ${blocks.length} script blocks parse`);
process.exit(fail ? 1 : 0);
