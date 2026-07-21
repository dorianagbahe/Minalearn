const $ = (selector) => document.querySelector(selector);
const alphabetMinuscule = ["a","b","d","ɖ","e","ɛ","f","g","h","i","j","k","l","m","n","ŋ","o","ɔ","p","r","s","t","u","ʋ","v","w","y","z"];
const alphabetMajuscule = ["A","B","D","Ɖ","E","Ɛ","F","G","H","I","J","K","L","M","N","Ŋ","O","Ɔ","P","R","S","T","U","Ʋ","V","W","Y","Z"];
const chiffresSymboles = ["1","2","3","4","5","6","7","8","9","0",".",",","?","!","'",'"',"(",")","-","/"];
const accents = {a:["á","à","â","ã"],e:["é","è","ê","ẽ"],ɛ:["ɛ́","ɛ̀","ɛ̃"],i:["í","ì","î","ĩ"],o:["ó","ò","ô","õ"],ɔ:["ɔ́","ɔ̀","ɔ̃"],u:["ú","ù","û","ũ"]};
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
let state = { category:"bases", current:"", question:1, answered:false, upper:false, accents:false, numbers:false, activeField:$("#texte") };
let score = storage.get("minalearn_score", {bon:0,total:0});
let toastTimer;

function normalize(value="") { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim(); }
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2200); }
function favorites() { return storage.get("minalearn_favoris",[]); }
function saveFavorites(items) { storage.set("minalearn_favoris",items); renderFavorites(); updateDashboard(); }

function updateStreak() {
  const today=new Date().toISOString().slice(0,10); const activity=storage.get("minalearn_activity",{last:null,streak:0});
  if(activity.last!==today){ const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10); activity.streak=activity.last===yesterday?activity.streak+1:1; activity.last=today; storage.set("minalearn_activity",activity); }
  return activity.streak;
}
function updateDashboard() {
  const done=Math.min(score.total,5), accuracy=score.total?Math.round(score.bon/score.total*100):0;
  $("#goalPercent").textContent=`${done*20}%`; $("#goalBar").style.width=`${done*20}%`; $("#goalText").textContent=`${done} exercice${done>1?"s":""} sur 5 terminé${done>1?"s":""}`;
  $("#streakValue").textContent=updateStreak(); $("#learnedValue").textContent=score.bon; $("#accuracyValue").textContent=`${accuracy}%`; $("#favoriteValue").textContent=favorites().length;
}

function newQuestion() {
  const pool=categories[state.category] || Object.keys(dictionnaire); let next=pool[Math.floor(Math.random()*pool.length)]; if(pool.length>1) while(next===state.current) next=pool[Math.floor(Math.random()*pool.length)];
  state.current=next; state.answered=false; $("#question").textContent=next.charAt(0).toUpperCase()+next.slice(1); $("#reponse").value=""; $("#feedback").textContent=""; $("#feedback").className="feedback"; $("#checkBtn").textContent="Vérifier";
  $("#questionCount").textContent=`Question ${state.question}`; $("#quizProgressText").textContent=`Parcours : ${state.category}`; $("#quizProgressBar").style.width=`${((state.question-1)%5)*25}%`; $("#reponse").focus();
}
function checkAnswer() {
  if(state.answered){ state.question=state.question%5+1; newQuestion(); return; }
  const answer=$("#reponse").value; if(!answer.trim()) return toast("Écrivez une réponse avant de vérifier.");
  const correct=normalize(answer)===normalize(dictionnaire[state.current]); score.total++; state.answered=true;
  if(correct){ score.bon++; $("#feedback").textContent="✓ Excellente réponse !"; $("#feedback").className="feedback correct"; }
  else { $("#feedback").textContent=`La bonne réponse est « ${dictionnaire[state.current]} ».`; $("#feedback").className="feedback wrong"; }
  $("#checkBtn").textContent="Question suivante →"; storage.set("minalearn_score",score); updateDashboard();
}
function showHint() { const value=dictionnaire[state.current]; const visible=value.split(" ").map(word=>word[0]+" •".repeat(Math.max(0,word.length-1))).join("  "); $("#feedback").textContent=`Indice : ${visible}`; $("#feedback").className="feedback"; }

function findEntry(value) { const target=normalize(value); return Object.keys(dictionnaire).find(key=>normalize(key)===target); }
function renderSuggestions(query="") {
  const target=normalize(query); let words=Object.keys(dictionnaire).filter(key=>!target||normalize(key).includes(target)).slice(0,5); if(!target) words=["bonjour","merci","maison","eau"];
  $("#suggestions").innerHTML=""; words.forEach(word=>{ const button=document.createElement("button"); button.type="button"; button.textContent=word; button.onclick=()=>{$("#recherche").value=word; translate(word)}; $("#suggestions").appendChild(button); });
}
function translate(value=$("#recherche").value) {
  renderSuggestions(value); const key=findEntry(value); const result=$("#resultat");
  if(!value.trim()){ result.innerHTML='<div class="empty-state"><span>文</span><p>Commencez à écrire pour découvrir une traduction.</p></div>'; return; }
  if(!key){ result.innerHTML='<div class="empty-state"><p>Aucun résultat exact. Essayez une suggestion ci-dessus.</p></div>'; return; }
  const saved=favorites().some(item=>item.fr===key); result.innerHTML=`<div class="result-content"><div class="translation-main"><small>Traduction en mina</small><h3>${dictionnaire[key]}</h3><p>${key}</p></div><button class="round-action ${saved?"saved":""}" data-result-save aria-label="Ajouter aux favoris">★</button></div>`;
  result.querySelector("[data-result-save]").onclick=()=>toggleFavorite(key);
}
function toggleFavorite(key) { const items=favorites(), index=items.findIndex(item=>item.fr===key); if(index>=0){items.splice(index,1);toast("Mot retiré des favoris.")}else{items.unshift({fr:key,mina:dictionnaire[key]});toast("Mot ajouté aux favoris.")} saveFavorites(items); translate(key); }
function renderFavorites() {
  const items=favorites(), list=$("#favoris"); list.innerHTML=""; $("#favoriteBadge").textContent=items.length;
  if(!items.length){ list.innerHTML='<li class="no-favorite">Vos mots enregistrés apparaîtront ici.</li>'; return; }
  items.forEach(item=>{ const li=document.createElement("li"); li.innerHTML=`<p><b>${item.mina}</b><small>${item.fr}</small></p><button aria-label="Retirer">×</button>`; li.querySelector("button").onclick=()=>toggleFavorite(item.fr); list.appendChild(li); });
}

function editable(el) { return el && ["INPUT","TEXTAREA"].includes(el.tagName) && !el.disabled; }
function activeField() { if(editable(document.activeElement)) state.activeField=document.activeElement; return state.activeField || $("#texte"); }
function insertText(char) { const field=activeField(), start=field.selectionStart??field.value.length, end=field.selectionEnd??field.value.length; field.value=field.value.slice(0,start)+char+field.value.slice(end); field.focus(); field.selectionStart=field.selectionEnd=start+char.length; field.dispatchEvent(new Event("input")); }
function makeKey(label, action, special=false) { const button=document.createElement("button"); button.type="button"; button.textContent=label; if(special) button.classList.add("key-special"); button.onclick=action; return button; }
function renderKeyboard() {
  const keyboard=$("#clavier"); keyboard.innerHTML=""; const shift=makeKey("⇧",()=>{state.upper=!state.upper;renderKeyboard()},true); if(state.upper)shift.classList.add("active"); keyboard.append(shift);
  const accent=makeKey("Accents",()=>{state.accents=!state.accents;renderKeyboard()},true); if(state.accents)accent.classList.add("active"); keyboard.append(accent);
  keyboard.append(makeKey(state.numbers?"ABC":"123",()=>{state.numbers=!state.numbers;renderKeyboard()},true)); let chars=state.numbers?chiffresSymboles:(state.upper?alphabetMajuscule:alphabetMinuscule);
  if(state.accents&&!state.numbers) chars=chars.flatMap(char=>[char,...(accents[char.toLowerCase()]||[])]); chars.forEach(char=>keyboard.append(makeKey(char,()=>insertText(char))));
  keyboard.append(makeKey("Espace",()=>insertText(" "),true),makeKey("⌫",()=>{const f=activeField(),s=f.selectionStart;if(s>0){f.value=f.value.slice(0,s-1)+f.value.slice(f.selectionEnd);f.selectionStart=f.selectionEnd=s-1;f.dispatchEvent(new Event("input"))}},true));
}
function showKeyboard(){ $("#keyboardDock").classList.remove("hidden"); } function hideKeyboard(){ $("#keyboardDock").classList.add("hidden"); }

document.addEventListener("focusin",e=>{if(editable(e.target))state.activeField=e.target});
document.querySelectorAll(".path-item").forEach(button=>button.onclick=()=>{document.querySelectorAll(".path-item").forEach(item=>item.classList.remove("active"));button.classList.add("active");state.category=button.dataset.category;state.question=1;newQuestion()});
$("#checkBtn").onclick=checkAnswer; $("#hintBtn").onclick=showHint; $("#reponse").addEventListener("keydown",e=>{if(e.key==="Enter")checkAnswer()});
$("#resetScoreBtn").onclick=()=>{score={bon:0,total:0};storage.set("minalearn_score",score);state.question=1;updateDashboard();newQuestion();toast("Progression réinitialisée.")};
$("#recherche").addEventListener("input",e=>translate(e.target.value)); document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#recherche").focus();location.hash="dictionnaire"}});
$("#showKeyboardBtn").onclick=showKeyboard; $("#hideKeyboardBtn").onclick=hideKeyboard; $("#clearTextBtn").onclick=()=>{$("#texte").value="";$("#texte").dispatchEvent(new Event("input"))};
$("#copyTextBtn").onclick=async()=>{try{await navigator.clipboard.writeText($("#texte").value);toast("Texte copié.")}catch{toast("Copie impossible.")}};
$("#texte").addEventListener("input",e=>{$("#charCount").textContent=`${e.target.value.length} caractère${e.target.value.length>1?"s":""}`});
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");const dark=document.body.classList.contains("dark");storage.set("minalearn_theme",dark?"dark":"light");$("#themeBtn").textContent=dark?"☀":"☾"};
if(storage.get("minalearn_theme","light")==="dark"){document.body.classList.add("dark");$("#themeBtn").textContent="☀"}
renderKeyboard(); renderSuggestions(); renderFavorites(); updateDashboard(); newQuestion();
