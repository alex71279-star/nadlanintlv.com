
const dict=[...document.querySelectorAll('[data-en]')];let lang='en';
document.getElementById('langBtn').onclick=()=>{lang=lang==='en'?'he':'en';document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';dict.forEach(el=>el.textContent=el.dataset[lang]);document.getElementById('langBtn').textContent=lang==='he'?'English':'עברית';};
