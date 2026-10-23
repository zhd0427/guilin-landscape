(()=>{
 'use strict';
 const content=window.GuilinCourse,pair=window.GuilinBilingual.render;
 const $=s=>document.querySelector(s),english=()=>document.documentElement.lang==='en';
 let selectedTerm='shanshui';
 function renderTerm(){
  const term=content.terms.find(item=>item.id===selectedTerm);
  $('#term-name').replaceChildren(document.createTextNode(term.zh+' · '+term.pinyin));
  const name=document.createElement('small');name.lang='en';name.textContent=term.en;$('#term-name').append(name);
  pair($('#term-literal'),'词面或常见译法：'+term.literal,'Literal / common rendering: '+term.literal);
  pair($('#term-explanation'),term.explanationZh,term.explanation);
  pair($('#term-example'),term.exampleZh,term.example);
  $('#term-source').href=term.source;
  document.querySelectorAll('[data-term]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.term===selectedTerm)));
 }
 function renderStory(){
  const draft=content.buildStory($('#story-place').value,$('#story-term').value,$('#story-audience').value);
  $('#story-output').textContent=draft.en;$('#story-translation').textContent=draft.zh;$('#story-copy-status').textContent='';
 }
 document.querySelectorAll('[data-term]').forEach(button=>button.addEventListener('click',()=>{selectedTerm=button.dataset.term;$('#story-term').value=selectedTerm;renderTerm();renderStory()}));
 ['story-place','story-audience'].forEach(id=>$('#'+id).addEventListener('change',renderStory));
 $('#story-term').addEventListener('change',()=>{selectedTerm=$('#story-term').value;renderTerm();renderStory()});
 $('#copy-story').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText($('#story-output').textContent);$('#story-copy-status').textContent=english()?'Copied. Make it your own.':'已复制英文，可以改写成自己的表达。'}
  catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('#story-output'));selection.removeAllRanges();selection.addRange(range);$('#story-output').focus({preventScroll:true});$('#story-copy-status').textContent=english()?'Text selected. Press Ctrl+C or use Copy.':'英文已选中，可按 Ctrl+C 或使用复制。'}
 });
 document.addEventListener('guilin-languagechange',()=>{renderTerm();renderStory()});
 renderTerm();renderStory();
})();
