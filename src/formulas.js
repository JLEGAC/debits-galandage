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
  const limit = material === "wood" ? 1230 : 1300;
  if (width > limit) return `La largeur de porte ${material === "wood" ? "bois" : "aluminium"} ne doit pas dépasser ${limit.toLocaleString("fr-FR")} mm.`;
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
