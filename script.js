const alphabetMinuscule = [
  "a", "b", "d", "ɖ", "e", "ɛ", "f",
  "g", "h", "i", "j", "k", "l", "m",
  "n", "ŋ", "o", "ɔ", "p", "r", "s",
  "t", "u", "ʋ", "v", "w", "y", "z"
];

const alphabetMajuscule = [
  "A", "B", "D", "Ɖ", "E", "Ɛ", "F",
  "G", "H", "I", "J", "K", "L", "M",
  "N", "Ŋ", "O", "Ɔ", "P", "R", "S",
  "T", "U", "Ʋ", "V", "W", "Y", "Z"
];

const chiffresSymboles = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  ".", ",", "?", "!", "'", '"', "(", ")", "-", "/"
];

const accents = {
  "a": ["á", "à", "â", "ã"],
  "e": ["é", "è", "ê", "ẽ"],
  "ɛ": ["ɛ́", "ɛ̀", "ɛ̃"],
  "i": ["í", "ì", "î", "ĩ"],
  "o": ["ó", "ò", "ô", "õ"],
  "ɔ": ["ɔ́", "ɔ̀", "ɔ̃"],
  "u": ["ú", "ù", "û", "ũ"],
  "A": ["Á", "À", "Â", "Ã"],
  "E": ["É", "È", "Ê", "Ẽ"],
  "Ɛ": ["Ɛ́", "Ɛ̀", "Ɛ̃"],
  "I": ["Í", "Ì", "Î", "Ĩ"],
  "O": ["Ó", "Ò", "Ô", "Õ"],
  "Ɔ": ["Ɔ́", "Ɔ̀", "Ɔ̃"],
  "U": ["Ú", "Ù", "Û", "Ũ"]
};

let majuscule = false;
let accentsActifs = false;
let modeChiffres = false;
let motActuel = "";
let score = { bon: 0, total: 0 };

const clavier = document.getElementById("clavier");
const zoneTexte = document.getElementById("texte");
let champActif = zoneTexte;

function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function estChampEditable(el) {
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !el.readOnly && !el.disabled;
}

function getChampActif() {
  if (estChampEditable(document.activeElement)) {
    champActif = document.activeElement;
  }
  if (!estChampEditable(champActif)) {
    champActif = zoneTexte;
  }
  return champActif;
}

function creerTouche(texte, onClick, classes = []) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = texte;
  classes.forEach((c) => btn.classList.add(c));
  btn.addEventListener("click", onClick);
  return btn;
}

function genererLettresAffichees(lettres) {
  const touches = [];
  lettres.forEach((lettre) => {
    touches.push(lettre);
    if (accentsActifs && accents[lettre]) {
      accents[lettre].forEach((accent) => touches.push(accent));
    }
  });
  return touches;
}

function afficherClavier() {
  clavier.innerHTML = "";

  const toucheShift = creerTouche("⇧", changerMode, ["key-special", "key-shift"]);
  if (majuscule) toucheShift.classList.add("active");
  if (modeChiffres) toucheShift.disabled = true;
  clavier.appendChild(toucheShift);

  const toucheAccent = creerTouche("Accent", () => {
    accentsActifs = !accentsActifs;
    afficherClavier();
  }, ["key-special", "key-action"]);
  if (accentsActifs) toucheAccent.classList.add("active");
  if (modeChiffres) toucheAccent.disabled = true;
  clavier.appendChild(toucheAccent);

  const touche123 = creerTouche(modeChiffres ? "ABC" : "123", () => {
    modeChiffres = !modeChiffres;
    accentsActifs = false;
    afficherClavier();
  }, ["key-special", "key-action"]);
  if (modeChiffres) touche123.classList.add("active");
  clavier.appendChild(touche123);

  const base = modeChiffres ? chiffresSymboles : (majuscule ? alphabetMajuscule : alphabetMinuscule);
  const touches = modeChiffres ? base : genererLettresAffichees(base);

  touches.forEach((car) => {
    clavier.appendChild(creerTouche(car, () => insererTexte(car)));
  });

  const actions = [
    { label: "Effacer", fn: effacer },
    { label: "Supprimer", fn: supprimer },
    { label: "Copier", fn: copier },
    { label: "Écouter", fn: parlerTexte }
  ];

  actions.forEach((action) => {
    clavier.appendChild(creerTouche(action.label, action.fn, ["key-special", "key-action"]));
  });
}

function insererTexte(caractere) {
  const champ = getChampActif();
  const debut = champ.selectionStart ?? champ.value.length;
  const fin = champ.selectionEnd ?? champ.value.length;
  champ.value = champ.value.slice(0, debut) + caractere + champ.value.slice(fin);
  champ.focus();
  champ.selectionStart = champ.selectionEnd = debut + caractere.length;

  if (champ.id === "recherche") {
    traduire();
  }
}

function changerMode() {
  majuscule = !majuscule;
  afficherClavier();
}

function effacer() {
  const champ = getChampActif();
  champ.value = "";
  champ.focus();
  if (champ.id === "recherche") traduire();
}

function supprimer() {
  const champ = getChampActif();
  const debut = champ.selectionStart ?? 0;
  const fin = champ.selectionEnd ?? 0;

  if (debut === fin && debut > 0) {
    champ.value = champ.value.slice(0, debut - 1) + champ.value.slice(fin);
    champ.selectionStart = champ.selectionEnd = debut - 1;
  } else {
    champ.value = champ.value.slice(0, debut) + champ.value.slice(fin);
    champ.selectionStart = champ.selectionEnd = debut;
  }

  champ.focus();
  if (champ.id === "recherche") traduire();
}

async function copier() {
  const champ = getChampActif();
  try {
    await navigator.clipboard.writeText(champ.value || "");
    alert("Texte copié.");
  } catch {
    alert("Copie impossible sur ce navigateur.");
  }
}

function trouverEntree(mot) {
  const cible = normaliser(mot);
  for (const key of Object.keys(dictionnaire)) {
    if (normaliser(key) === cible) return key;
  }
  return null;
}

function distanceLevenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cout);
    }
  }
  return dp[m][n];
}

function meilleureSuggestion(mot) {
  const cible = normaliser(mot);
  let meilleurMot = null;
  let meilleureDistance = Infinity;

  for (const item of Object.keys(dictionnaire)) {
    const d = distanceLevenshtein(cible, normaliser(item));
    if (d < meilleureDistance) {
      meilleureDistance = d;
      meilleurMot = item;
    }
  }

  if (meilleureDistance <= 3) return `${meilleurMot} -> ${dictionnaire[meilleurMot]}`;
  return null;
}

function traduire() {
  const entree = document.getElementById("recherche").value;
  const mot = normaliser(entree);
  const resultat = document.getElementById("resultat");

  if (!mot) {
    resultat.textContent = "";
    return;
  }

  const cleTrouvee = trouverEntree(mot);
  if (cleTrouvee) {
    resultat.textContent = `${cleTrouvee} -> ${dictionnaire[cleTrouvee]}`;
    return;
  }

  const suggestion = meilleureSuggestion(mot);
  resultat.textContent = suggestion
    ? `Mot non trouvé. Tu voulais peut-être : ${suggestion}`
    : "Mot non trouvé. Ajoute-le plus tard dans dictionnaire.js.";
}

function parler(texte) {
  if (!texte || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = "fr-FR";
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function parlerTexte() {
  const champ = getChampActif();
  parler((champ.value || "").trim());
}

function parlerResultat() {
  const contenu = document.getElementById("resultat").textContent;
  if (!contenu) return;
  const mina = contenu.split("->")[1]?.trim() || contenu;
  parler(mina);
}

function chargerFavoris() {
  try {
    return JSON.parse(localStorage.getItem("minalearn_favoris") || "[]");
  } catch {
    return [];
  }
}

function sauvegarderFavoris(favoris) {
  localStorage.setItem("minalearn_favoris", JSON.stringify(favoris));
}

function renderFavoris() {
  const favoris = chargerFavoris();
  const ul = document.getElementById("favoris");
  ul.innerHTML = "";

  if (!favoris.length) {
    const li = document.createElement("li");
    li.textContent = "Aucun favori pour le moment.";
    ul.appendChild(li);
    return;
  }

  favoris.forEach((item, index) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${item.fr} -> ${item.mina}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Retirer";
    btn.onclick = () => {
      const next = chargerFavoris();
      next.splice(index, 1);
      sauvegarderFavoris(next);
      renderFavoris();
    };

    li.appendChild(span);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function ajouterFavoriDepuisRecherche() {
  const entree = document.getElementById("recherche").value;
  const cle = trouverEntree(entree);

  if (!cle) {
    alert("Aucun mot exact à ajouter en favori.");
    return;
  }

  const favoris = chargerFavoris();
  if (favoris.some((f) => normaliser(f.fr) === normaliser(cle))) {
    alert("Ce mot est déjà dans tes favoris.");
    return;
  }

  favoris.push({ fr: cle, mina: dictionnaire[cle] });
  sauvegarderFavoris(favoris);
  renderFavoris();
}

function chargerScore() {
  try {
    return JSON.parse(localStorage.getItem("minalearn_score") || '{"bon":0,"total":0}');
  } catch {
    return { bon: 0, total: 0 };
  }
}

function sauvegarderScore() {
  localStorage.setItem("minalearn_score", JSON.stringify(score));
}

function afficherScore() {
  document.getElementById("score").textContent = `Score: ${score.bon}/${score.total}`;
}

function nouvelleQuestion() {
  const mots = Object.keys(dictionnaire);
  motActuel = mots[Math.floor(Math.random() * mots.length)];
  document.getElementById("question").textContent = `Traduis en mina : ${motActuel}`;
  document.getElementById("reponse").value = "";

  const feedback = document.getElementById("feedback");
  feedback.textContent = "";
  feedback.className = "resultat";
}

function verifier() {
  const reponse = normaliser(document.getElementById("reponse").value);
  const bonneReponse = normaliser(dictionnaire[motActuel]);
  const feedback = document.getElementById("feedback");

  score.total += 1;
  if (reponse === bonneReponse) {
    score.bon += 1;
    feedback.textContent = "Bonne réponse.";
    feedback.className = "resultat correct";
  } else {
    feedback.textContent = `Faux. Bonne réponse : ${dictionnaire[motActuel]}`;
    feedback.className = "resultat wrong";
  }

  sauvegarderScore();
  afficherScore();
}


const keyboardDock = document.getElementById("keyboardDock");
const keyboardBar = document.getElementById("keyboardBar");
const openKeyboardBtn = document.getElementById("openKeyboardBtn");
const hideKeyboardBtn = document.getElementById("hideKeyboardBtn");

let dragState = { active: false, offsetX: 0, offsetY: 0 };

function montrerClavier() {
  keyboardDock.classList.remove("hidden");
  openKeyboardBtn.style.display = "none";
}

function masquerClavier() {
  keyboardDock.classList.add("hidden");
  openKeyboardBtn.style.display = "inline-block";
}

function demarrerDrag(e) {
  dragState.active = true;
  const rect = keyboardDock.getBoundingClientRect();
  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
  const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
  dragState.offsetX = x - rect.left;
  dragState.offsetY = y - rect.top;
}

function deplacerClavier(e) {
  if (!dragState.active) return;
  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
  const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

  let left = x - dragState.offsetX;
  let top = y - dragState.offsetY;

  const maxLeft = window.innerWidth - keyboardDock.offsetWidth;
  const maxTop = window.innerHeight - keyboardDock.offsetHeight;

  left = Math.max(0, Math.min(left, Math.max(0, maxLeft)));
  top = Math.max(0, Math.min(top, Math.max(0, maxTop)));

  keyboardDock.style.left = `${left}px`;
  keyboardDock.style.top = `${top}px`;
  keyboardDock.style.right = "auto";
  keyboardDock.style.bottom = "auto";
}

function arreterDrag() {
  dragState.active = false;
}
function initialiser() {
  score = chargerScore();
  afficherScore();
  afficherClavier();
  renderFavoris();
  nouvelleQuestion();

  document.addEventListener("focusin", (event) => {
    if (estChampEditable(event.target)) champActif = event.target;
  });

  openKeyboardBtn.addEventListener("click", montrerClavier);
  hideKeyboardBtn.addEventListener("click", masquerClavier);

  keyboardBar.addEventListener("mousedown", demarrerDrag);
  document.addEventListener("mousemove", deplacerClavier);
  document.addEventListener("mouseup", arreterDrag);

  keyboardBar.addEventListener("touchstart", demarrerDrag, { passive: true });
  document.addEventListener("touchmove", deplacerClavier, { passive: true });
  document.addEventListener("touchend", arreterDrag);
}

initialiser();
