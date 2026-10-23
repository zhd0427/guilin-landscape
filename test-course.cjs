const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const course=require('./dist/course-content.js');
let drafts=0;
for(const view of Object.keys(course.views))for(const term of course.terms)for(const audience of Object.keys(course.audiences)){
 const draft=course.buildStory(view,term.id,audience);
 assert.match(draft.en,/Guilin, southern China/);
 assert.ok(draft.en.includes(course.views[view].en));
 assert.ok(draft.en.includes(term.id));
 assert.ok(draft.zh.includes(course.views[view].zh));
 assert.ok(draft.zh.includes(term.zh));
 assert.equal(draft.en.split('\n\n').length,3,'Place, explanation and invitation must stay distinct.');
 assert.ok(draft.en.endsWith('?'),'Every draft should invite a response.');
 assert.ok(!/[\u3400-\u9fff]/.test(draft.en),'English draft must be understandable without reading Chinese.');
 assert.ok(draft.en.split(/\s+/).length<160,'Classroom introduction must remain short.');
 drafts++;
}
assert.throws(()=>course.buildStory('missing','shanshui','visitor'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('dist/content.js','utf8'),ctx);
for(const place of ctx.window.GuilinContent.places)for(const key of ['storyEn','lookEn','locationEn','en'])assert.ok(place[key]?.trim());
for(const work of ctx.window.GuilinContent.works)for(const key of ['titleEn','authorEn','interpretation','backgroundEn','metaEn'])assert.ok(work[key]?.trim());
const page=fs.readFileSync('dist/index.html','utf8');
for(const source of ['course-content.js','experience-app.js','course-ui.js'])assert.ok(page.includes(source));
assert.ok(page.indexOf('course-content.js')<page.indexOf('experience-app.js'));
assert.ok(page.indexOf('experience-app.js')<page.indexOf('course-ui.js'));
assert.ok(page.includes('id="communication"'));
console.log(`Passed: ${drafts} bilingual audience-specific drafts, complete article translations and course initialization order.`);
