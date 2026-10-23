(function(root){
 'use strict';
 const terms=[
  {id:'shanshui',zh:'山水',pinyin:'shān shuǐ',en:'Shanshui · landscape as art',literal:'mountains and water',
   explanation:'Shanshui names a Chinese landscape painting tradition as well as mountains and water. A tiny boat beside a great peak can invite us to think about our place in nature.',
   explanationZh:'“山水”既指山与水，也是一种中国绘画传统。宏大的山峰与小小的舟，可以引导我们思考人与自然的关系。',
   example:'In Guilin, mountains and water become shanshui: a landscape we can explore through both nature and art.',
   exampleZh:'在桂林，山与水成为“山水”：我们既可以从自然出发，也可以通过艺术来理解它。',
   source:'https://www.metmuseum.org/exhibitions/listings/2017/streams-and-mountains/exhibition-themes'},
  {id:'liubai',zh:'留白',pinyin:'liú bái',en:'Liubai · meaningful open space',literal:'leave white',
   explanation:'In landscape painting, unpainted areas can suggest water, mist or distance. Explain what the space helps a viewer imagine.',
   explanationZh:'在山水画中，未画满的地方可以让人联想到水面、云雾或距离。向读者说明这片空间让人想象什么，会更容易理解。',
   example:'The unpainted paper suggests a quiet river and gives our eyes room to wander.',
   exampleZh:'留白的纸面让人联想到安静的江面，也让视线有了游走的空间。',
   source:'https://static.artmuseum.princeton.edu/asian-art/china/resources/landscape-painting'},
  {id:'yijing',zh:'意境',pinyin:'yì jìng',en:'Yijing · a world of feeling',literal:'artistic conception',
   explanation:'Yijing is often translated as “artistic conception”. For a first-time visitor, describe how a scene brings mood, meaning and imagination together. This is an accessible explanation of a complex idea.',
   explanationZh:'“意境”常译为 artistic conception。面对初次接触这个概念的读者，可以解释景色如何把情绪、意义和想象联系起来。这是对复杂概念的入门说明。',
   example:'The misty peaks create a peaceful mood, inviting us to imagine a journey beyond the picture.',
   exampleZh:'雾中的山峰营造出宁静的氛围，邀请我们想象画面之外的旅程。',
   source:'https://link.springer.com/article/10.1007/s40636-023-00273-9'}
 ];
 const views={
  elephant:{en:'Elephant Trunk Hill',zh:'象鼻山',detail:'Its arch and hillside suggest an elephant drinking from the river.',detailZh:'它的拱洞与山体轮廓让人联想到一头正在江边饮水的大象。'},
  horses:{en:'Nine Horse Fresco Hill',zh:'九马画山',detail:'Visitors imagine horses in the light and dark patterns of its riverside cliff.',detailZh:'人们从临江岩壁深浅交错的纹理中想象马的姿态。'},
  xingping:{en:'Xingping on the Li River',zh:'兴坪漓江',detail:'Layers of limestone peaks rise beside the river, with reflections when the water is calm.',detailZh:'层层石灰岩山峰耸立江边，平静的水面有时会映出山影。'}
 };
 const audiences={
  visitor:{en:'A first-time visitor',zh:'初次到访的朋友',opening:'Let me introduce',openingZh:'我想向你介绍'},
  art:{en:'An art lover',zh:'喜欢艺术的朋友',opening:'Imagine a landscape becoming a painting at',openingZh:'想象一幅由真实风景展开的画卷，地点是'},
  nature:{en:'A nature lover',zh:'喜欢自然的朋友',opening:'Take a closer look at',openingZh:'一起仔细看看'}
 };
 function buildStory(viewId,termId,audienceId){
  const v=views[viewId],t=terms.find(term=>term.id===termId),a=audiences[audienceId];
  if(!v||!t||!a)throw new Error('Choose a valid view, cultural idea and audience.');
  const opening=a.opening+' '+v.en+' in Guilin, southern China. '+v.detail;
  const openingZh=a.openingZh+'中国南方桂林的'+v.zh+'。'+v.detailZh;
  const bridge={
   shanshui:{en:'In Chinese art, shanshui means “mountains and water” and names a landscape painting tradition. Here, the view invites us to imagine our place in nature.',zh:'在中国艺术中，“山水”既是山与水，也是山水画传统。这片风景邀请我们想象自己与自然的关系。'},
   liubai:{en:'This view can help us explain liubai: open space in a painting can suggest water, mist or distance. Look for the space between the hills as well as the hills themselves.',zh:'借助眼前的景色，可以解释画中的“留白”：空白能让人联想到水、云雾或距离。观看山峰时，也看看山峰之间的空间。'},
   yijing:{en:'To introduce yijing, try describing the mood this view creates and the journey it makes you imagine. Different viewers may find different feelings in the same landscape.',zh:'介绍“意境”时，可以说说这片风景带来的情绪，以及它让你想象的旅程。面对同一片山水，不同的人也可以有不同的感受。'}
  }[termId];
  const question=audienceId==='art'?{en:'How would you paint this scene?',zh:'如果由你作画，你会怎样表现这里？'}:audienceId==='nature'?{en:'What would you do to help keep this river clear?',zh:'你会怎样帮助守护这条清澈的江？'}:{en:'Does this view remind you of a place you know?',zh:'这片风景会让你想起自己熟悉的地方吗？'};
  return {en:opening+'\n\n'+bridge.en+'\n\n'+question.en,zh:openingZh+'\n\n'+bridge.zh+'\n\n'+question.zh};
 }
 const api={terms,views,audiences,buildStory};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.GuilinCourse=api;
})(typeof window==='object'?window:globalThis);
