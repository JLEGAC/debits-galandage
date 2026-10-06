const EPSILON = 1e-8;

// Lit les expressions arithmétiques comme des formes affines, sans eval().
function affine(expression) {
  const tokens = expression.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*|(?:\d+(?:\.\d*)?|\.\d+)|[()+*/-]/g) || [];
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const constant = n => ({ c: n, v: {} });
  const variable = name => ({ c: 0, v: { [name]: 1 } });
  const combine = (a,b,factor=1) => {
    const v = { ...a.v };
    for (const [k,n] of Object.entries(b.v)) v[k] = (v[k] || 0) + factor*n;
    return { c: a.c + factor*b.c, v };
  };
  const scale = (a,n) => ({ c:a.c*n, v:Object.fromEntries(Object.entries(a.v).map(([k,x])=>[k,x*n])) });
  function primary(){
    if(peek()==="-"){take();return scale(primary(),-1)}
    if(peek()==="+"){take();return primary()}
    if(peek()==="("){take();const x=sum();if(take()!==")")throw Error("Parenthèse manquante");return x}
    const t=take(); if(t==null)throw Error("Expression incomplète");
    if(/^\d/.test(t)||t.startsWith("."))return constant(Number(t));
    if(/^[A-Za-zÀ-ÿ_]/.test(t))return variable(t);
    throw Error("Élément inattendu : "+t);
  }
  function product(){let x=primary();while(peek()==="*"||peek()==="/"){const op=take(),y=primary();if(op==="*"){if(Object.keys(x.v).length&&Object.keys(y.v).length)throw Error("Formule non linéaire");x=Object.keys(x.v).length?scale(x,y.c):scale(y,x.c)}else{if(Object.keys(y.v).length||Math.abs(y.c)<EPSILON)throw Error("Division invalide ou non linéaire");x=scale(x,1/y.c)}}return x}
  function sum(){let x=product();while(peek()==="+"||peek()==="-"){const op=take();x=combine(x,product(),op==="+"?1:-1)}return x}
  const result=sum();if(position!==tokens.length)throw Error("La formule contient une syntaxe non reconnue");return result;
}

export function evaluateExpression(expression, values) {
  const form = affine(expression);
  let result = form.c;
  for (const [name, coefficient] of Object.entries(form.v)) {
    if (!Number.isFinite(values[name])) return null;
    result += coefficient * values[name];
  }
  return Number.isFinite(result) ? result : null;
}

export function doorWidthWarning(width, material) {
  if (!Number.isFinite(width)) return null;
  if (width < 680) return "La largeur de porte doit être d’au moins 680 mm.";
  const limit = material === "bois" || material === "wood" ? 1230 : 1300;
  if (width > limit) return `La largeur de porte ${limit === 1230 ? "bois" : "aluminium"} ne doit pas dépasser ${limit} mm.`;
  return null;
}

export function solveRelations(relations, givens) {
  const names = new Set(Object.keys(givens));
  const rows = relations.map(({ equation }) => {
    const [left,right,...rest] = equation.split("=");
    if(!left||!right||rest.length)throw Error("Relation mal formée : "+equation);
    const a=affine(left),b=affine(right),vars={...a.v};
    for(const [k,n] of Object.entries(b.v))vars[k]=(vars[k]||0)-n;
    for(const k of Object.keys(vars))names.add(k);
    return { vars, c:a.c-b.c };
  });
  const columns=[...names], matrix=rows.map(row=>[...columns.map(k=>row.vars[k]||0),-row.c]);
  for(const [k,value] of Object.entries(givens)){const row=Array(columns.length+1).fill(0);row[columns.indexOf(k)]=1;row[columns.length]=value;matrix.push(row)}
  let pivotRow=0;const pivotCols=[];
  for(let col=0;col<columns.length&&pivotRow<matrix.length;col++){
    let best=pivotRow;for(let r=pivotRow+1;r<matrix.length;r++)if(Math.abs(matrix[r][col])>Math.abs(matrix[best][col]))best=r;
    if(Math.abs(matrix[best][col])<EPSILON)continue;
    [matrix[pivotRow],matrix[best]]=[matrix[best],matrix[pivotRow]];
    const divisor=matrix[pivotRow][col];for(let j=col;j<=columns.length;j++)matrix[pivotRow][j]/=divisor;
    for(let r=0;r<matrix.length;r++)if(r!==pivotRow){const factor=matrix[r][col];for(let j=col;j<=columns.length;j++)matrix[r][j]-=factor*matrix[pivotRow][j]}
    pivotCols[pivotRow]=col;pivotRow++;
  }
  for(const row of matrix)if(row.slice(0,columns.length).every(n=>Math.abs(n)<EPSILON)&&Math.abs(row[columns.length])>EPSILON)throw Error("Les cotes saisies sont incompatibles avec les formules.");
  const values={...givens};
  for(let r=0;r<pivotRow;r++){const col=pivotCols[r];if(matrix[r].slice(col+1,columns.length).every(n=>Math.abs(n)<EPSILON))values[columns[col]]=matrix[r][columns.length]}
  return values;
}

function variablesInEquation(equation) {
  return [...new Set((equation.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*/g) || []).filter(token => !["x"].includes(token)))];
}

// Résout les sous-ensembles de relations indépendants pour conserver les calculs
// des autres familles de cotes lorsqu'une famille contient une contradiction.
export function solveRelationGroups(relations, givens, preferredKey = null) {
  const parent = new Map();
  const root = key => {
    if (!parent.has(key)) parent.set(key, key);
    if (parent.get(key) !== key) parent.set(key, root(parent.get(key)));
    return parent.get(key);
  };
  const join = (a, b) => { const ra = root(a), rb = root(b); if (ra !== rb) parent.set(rb, ra); };
  const relationVars = relations.map(relation => variablesInEquation(relation.equation));
  for (const vars of relationVars) for (const name of vars.slice(1)) join(vars[0], name);
  const groups = new Map();
  relations.forEach((relation, index) => {
    const vars = relationVars[index];
    const key = vars.length ? root(vars[0]) : `relation-${index}`;
    if (!groups.has(key)) groups.set(key, { relations: [], vars: new Set() });
    const group = groups.get(key);
    group.relations.push(relation);
    vars.forEach(name => group.vars.add(name));
  });
  // Une cote saisie sans relation reste disponible telle quelle.
  const values = {};
  const conflicts = [];
  for (const group of groups.values()) {
    const groupGivens = Object.fromEntries(Object.entries(givens).filter(([key]) => group.vars.has(key)));
    try {
      Object.assign(values, solveRelations(group.relations, groupGivens));
    } catch {
      const givenKeys = Object.keys(groupGivens);
      const conflictKeys = minimalConflict(group.relations, groupGivens);
      const involved = conflictKeys.length ? conflictKeys : givenKeys;
      conflicts.push({ vars: group.vars, givenKeys: involved });

      // Garde une solution visible en prenant la dernière cote modifiée comme
      // référence, tout en conservant chaque saisie contradictoire dans l'UI.
      const independent = Object.fromEntries(Object.entries(groupGivens).filter(([key]) => !involved.includes(key)));
      const anchors = [preferredKey, ...involved].filter((key, index, list) => key && involved.includes(key) && list.indexOf(key) === index);
      let recovered = false;
      for (const anchor of anchors) {
        const candidate = { ...independent, [anchor]: groupGivens[anchor] };
        try {
          Object.assign(values, solveRelations(group.relations, candidate));
          recovered = true;
          break;
        } catch { /* essaie une autre cote de référence */ }
      }
      if (!recovered && anchors.length) {
        Object.assign(values, solveRelations(group.relations, { [anchors[0]]: groupGivens[anchors[0]] }));
      }
    }
  }
  for (const [key, value] of Object.entries(givens)) values[key] = value;
  return { values, conflicts };
}

// Affiche la cote mini dans le champ unique « Lisse Basse » tant qu’aucune
// cote de réservation n’a été fournie pour calculer la longueur réelle.
export function applyMinimumDimensions(values, manualValues, vantail) {
  const resolved = { ...values };
  const reservationKeys = vantail === "simple"
    ? ["MPR", "LB", "LHF", "LREM"]
    : ["EM", "ENTRAXE", "LRAIL", "LB", "LHF", "LREM"];
  const hasReservationInput = reservationKeys.some(key => Object.hasOwn(manualValues, key));
  if (!hasReservationInput && Number.isFinite(resolved.LBmini)) {
    resolved.LB = resolved.LBmini;
    resolved.LHF = resolved.LBmini;
    resolved.LREM = resolved.LB + 19;
  }
  return resolved;
}

export const applyMinimumLisseBasse = (values, manualValues) => applyMinimumDimensions(values, manualValues, "simple");

function minimalConflict(relations, givens) {
  let keys = Object.keys(givens);
  if (keys.length < 2) return keys;
  // Réduit l'ensemble des saisies à celles nécessaires pour conserver l'incompatibilité.
  for (const key of [...keys]) {
    const candidate = Object.fromEntries(keys.filter(other => other !== key).map(other => [other, givens[other]]));
    try { solveRelations(relations, candidate); } catch { keys = keys.filter(other => other !== key); }
  }
  return keys;
}
