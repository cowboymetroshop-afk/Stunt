/* ============================================================
   PITBIKE STUNT SIMULATOR 3D
   ============================================================ */

/* ============ ТЕКСТУРЫ ============ */
function makeCanvasTexture(size, drawFn, repeatX=1, repeatY=1){
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  drawFn(g, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

const roadTex = makeCanvasTexture(256, (g,s)=>{
  g.fillStyle = '#6e5738'; g.fillRect(0,0,s,s);
  for(let i=0;i<1200;i++){
    const x=Math.random()*s, y=Math.random()*s;
    const r=1+Math.random()*2.5;
    const v=Math.floor(90+Math.random()*70);
    g.fillStyle = `rgb(${v},${v*0.8|0},${v*0.55|0})`;
    g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
  for(let i=0;i<300;i++){
    const x=Math.random()*s, y=Math.random()*s;
    g.fillStyle = `rgba(40,30,20,${0.3+Math.random()*0.4})`;
    g.fillRect(x,y,2,2);
  }
}, 4, 40);

const grassTex = makeCanvasTexture(256, (g,s)=>{
  g.fillStyle = '#3f6b2e'; g.fillRect(0,0,s,s);
  for(let i=0;i<3000;i++){
    const x=Math.random()*s, y=Math.random()*s;
    const len = 3+Math.random()*5;
    const v = Math.floor(80+Math.random()*90);
    g.strokeStyle = `rgb(${v*0.4|0},${v},${v*0.3|0})`;
    g.lineWidth = 0.8+Math.random()*0.8;
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+(Math.random()-0.5)*2, y-len); g.stroke();
  }
}, 12, 60);

const barkTex = makeCanvasTexture(128, (g,s)=>{
  g.fillStyle = '#4a3520'; g.fillRect(0,0,s,s);
  for(let i=0;i<80;i++){
    const x = Math.random()*s;
    g.strokeStyle = `rgba(30,20,10,${0.4+Math.random()*0.5})`;
    g.lineWidth = 1+Math.random()*2;
    g.beginPath(); g.moveTo(x,0);
    for(let y=0;y<s;y+=8) g.lineTo(x+(Math.random()-0.5)*4, y);
    g.stroke();
  }
});

const rockTex = makeCanvasTexture(128, (g,s)=>{
  g.fillStyle = '#5a5a5a'; g.fillRect(0,0,s,s);
  for(let i=0;i<800;i++){
    const x=Math.random()*s, y=Math.random()*s;
    const v = Math.floor(60+Math.random()*90);
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.beginPath(); g.arc(x,y,0.5+Math.random()*2,0,7); g.fill();
  }
});

/* ============ СЦЕНА ============ */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dc8ee);
scene.fog = new THREE.Fog(0x9dc8ee, 100, 400);

const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 900);
scene.add(new THREE.HemisphereLight(0xcfe5ff, 0x3f5a2a, 0.9));

const sun = new THREE.DirectionalLight(0xfff2cc, 1.2);
sun.position.set(80, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sunD = 60;
sun.shadow.camera.left = -sunD;
sun.shadow.camera.right = sunD;
sun.shadow.camera.top = sunD;
sun.shadow.camera.bottom = -sunD;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 300;
sun.shadow.bias = -0.0006;
scene.add(sun);
scene.add(sun.target);

/* ============================================================
   ПРЕСЕТЫ
   ============================================================ */
const PRESETS = {
  verylow: { name:'Очень низкая', pixelRatio:0.5, shadows:false,
    shadowMapSize:512, fogNear:60, fogFar:180, anisotropy:1 },
  low: { name:'Низкая', pixelRatio:0.75, shadows:true,
    shadowMapSize:512, fogNear:70, fogFar:220, anisotropy:2 },
  medium: { name:'Средняя', pixelRatio:1, shadows:true,
    shadowMapSize:1024, fogNear:90, fogFar:300, anisotropy:4 },
  high: { name:'Высокая', pixelRatio:Math.min(devicePixelRatio, 1.5), shadows:true,
    shadowMapSize:2048, fogNear:100, fogFar:400, anisotropy:8 },
  veryhigh: { name:'Очень высокая', pixelRatio:Math.min(devicePixelRatio, 2), shadows:true,
    shadowMapSize:4096, fogNear:120, fogFar:500, anisotropy:16 }
};
let currentPreset = 'high';

function applyPreset(key){
  const p = PRESETS[key];
  if(!p) return;
  currentPreset = key;

  renderer.setPixelRatio(p.pixelRatio);
  renderer.setSize(innerWidth, innerHeight);

  renderer.shadowMap.enabled = p.shadows;
  renderer.shadowMap.type = p.shadows ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
  sun.castShadow = p.shadows;
  if(sun.shadow.map){
    sun.shadow.map.dispose();
    sun.shadow.map = null;
  }
  sun.shadow.mapSize.set(p.shadowMapSize, p.shadowMapSize);

  if(scene.fog){
    scene.fog.near = p.fogNear;
    scene.fog.far = p.fogFar;
  }
  [roadTex, grassTex, barkTex, rockTex].forEach(t=>{
    t.anisotropy = p.anisotropy;
    t.needsUpdate = true;
  });
  document.querySelectorAll('.preset-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.preset === key);
  });
  const mp = document.getElementById('menuPreset');
  if(mp) mp.textContent = p.name;
  try{ localStorage.setItem('pitbike3d_preset', key); }catch(e){}
}
try{
  const saved = localStorage.getItem('pitbike3d_preset');
  if(saved && PRESETS[saved]) currentPreset = saved;
}catch(e){}

/* ============================================================
   ДОРОГА
   ============================================================ */
const WORLD_LEN = 2400;
const ROAD_HALF = 3.5;
const SEG_LEN = 6;
const N_SEGS = WORLD_LEN / SEG_LEN;
const roadPoints = [];

function buildRoadPath(){
  roadPoints.length = 0;
  let curve = 0, hill = 0, x = 0;
  for(let i=0;i<=N_SEGS;i++){
    const z = i * SEG_LEN;
    curve += (Math.sin(i*0.06)*0.55 + Math.sin(i*0.19+1.3)*0.35) * 0.14;
    curve = Math.max(-1.1, Math.min(1.1, curve*0.965));
    hill += Math.sin(i*0.045+0.5)*0.32 + Math.sin(i*0.15)*0.15;
    hill = Math.max(-6, Math.min(10, hill));
    x += curve * 0.6;
    const yaw = curve * 0.35;
    roadPoints.push({ x, z, y: hill, yaw,
      dirX: Math.sin(yaw), dirZ: Math.cos(yaw) });
  }
}
buildRoadPath();

function buildTerrain(){
  const geo = new THREE.BufferGeometry();
  const pos = [], uv = [], col = [], idx = [];
  const lanes = [
    { off: -40,           h: -0.8, c: [0.24, 0.48, 0.18], uvU: 0.0 },
    { off: -ROAD_HALF-2,  h: -0.25,c: [0.42, 0.55, 0.22], uvU: 0.15 },
    { off: -ROAD_HALF,    h:  0,   c: [0.62, 0.50, 0.32], uvU: 0.30 },
    { off: 0,             h:  0,   c: [0.68, 0.55, 0.36], uvU: 0.50 },
    { off: ROAD_HALF,     h:  0,   c: [0.62, 0.50, 0.32], uvU: 0.70 },
    { off: ROAD_HALF+2,   h: -0.25,c: [0.42, 0.55, 0.22], uvU: 0.85 },
    { off: 40,            h: -0.8, c: [0.24, 0.48, 0.18], uvU: 1.0 }
  ];
  const L = lanes.length;
  for(let i=0;i<roadPoints.length;i++){
    const p = roadPoints[i];
    const nx = p.dirZ, nz = -p.dirX;
    for(let j=0;j<L;j++){
      const lane = lanes[j];
      pos.push(p.x + nx*lane.off, p.y + lane.h, p.z + nz*lane.off);
      uv.push(lane.uvU * 8, i * 0.5);
      col.push(lane.c[0], lane.c[1], lane.c[2]);
    }
  }
  for(let i=0;i<roadPoints.length-1;i++){
    for(let j=0;j<L-1;j++){
      const a = i*L + j;
      const b = i*L + j + 1;
      const c = (i+1)*L + j;
      const dd = (i+1)*L + j + 1;
      idx.push(a, c, b, b, c, dd);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: grassTex, vertexColors: true, roughness: 1, metalness: 0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
scene.add(buildTerrain());

function buildRoadTop(){
  const geo = new THREE.BufferGeometry();
  const pos = [], uv = [], idx = [];
  const L = 3;
  const offs = [-ROAD_HALF, 0, ROAD_HALF];
  for(let i=0;i<roadPoints.length;i++){
    const p = roadPoints[i];
    const nx = p.dirZ, nz = -p.dirX;
    for(let j=0;j<L;j++){
      pos.push(p.x + nx*offs[j], p.y + 0.03, p.z + nz*offs[j]);
      uv.push(j/(L-1), i*0.4);
    }
  }
  for(let i=0;i<roadPoints.length-1;i++){
    for(let j=0;j<L-1;j++){
      const a = i*L + j;
      const b = i*L + j + 1;
      const c = (i+1)*L + j;
      const dd = (i+1)*L + j + 1;
      idx.push(a, c, b, b, c, dd);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
scene.add(buildRoadTop());

/* ============================================================
   ГОРЫ
   ============================================================ */
function makeMountainRange(zStart, color, height, step){
  const geo = new THREE.BufferGeometry();
  const verts = [], idx = [];
  const span = 900;
  const n = Math.floor(span/step);
  for(let i=0;i<=n;i++){
    const x = -span/2 + i*step;
    const h = height * (0.4 + 0.6*Math.abs(Math.sin(i*0.4)))
            + Math.sin(i*1.3)*height*0.3;
    verts.push(x, 0, zStart);
    verts.push(x, h, zStart);
  }
  for(let i=0;i<n;i++){
    const a = i*2, b = i*2+1, c = i*2+2, dd = i*2+3;
    idx.push(a,b,c, b,dd,c);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts,3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, side: THREE.DoubleSide, fog: true
  }));
}
scene.add(makeMountainRange(-500, 0x7a9bc0, 70, 16));
scene.add(makeMountainRange(-420, 0x6285a8, 55, 12));
scene.add(makeMountainRange(-360, 0x4d6d8e, 40, 9));

/* ============================================================
   ДЕРЕВЬЯ И КАМНИ
   ============================================================ */
const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1 });
const leafMat  = new THREE.MeshStandardMaterial({ color: 0x2e6b2a, roughness: 1, flatShading: true });
const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3a7a30, roughness: 1, flatShading: true });

function makeTree(){
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 2.2, 7), trunkMat);
  trunk.position.y = 1.1; trunk.castShadow = true; g.add(trunk);
  for(let i=0;i<3;i++){
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.3 - i*0.28, 1.7, 8),
      i%2 ? leafMat : leafMat2);
    cone.position.y = 2.2 + i*0.9;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}
for(let i=3; i<roadPoints.length-3; i+=3){
  const p = roadPoints[i];
  const nx = p.dirZ, nz = -p.dirX;
  for(const side of [-1, 1]){
    if(Math.random() < 0.6) continue;
    const off = ROAD_HALF + 6 + Math.random()*12;
    const t = makeTree();
    t.position.set(p.x + nx*side*off, p.y - 0.8, p.z + nz*side*off);
    t.scale.setScalar(0.7 + Math.random()*0.8);
    t.rotation.y = Math.random()*Math.PI*2;
    scene.add(t);
  }
}

const rockMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 1, flatShading: true });
for(let i=2; i<roadPoints.length-2; i+=2){
  if(Math.random() < 0.55) continue;
  const p = roadPoints[i];
  const nx = p.dirZ, nz = -p.dirX;
  const side = Math.random()<0.5?-1:1;
  const off = ROAD_HALF + 1 + Math.random()*3;
  const s = 0.2 + Math.random()*0.5;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
  rock.position.set(p.x + nx*side*off, p.y - 0.1 + s*0.3, p.z + nz*side*off);
  rock.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
  rock.castShadow = true; rock.receiveShadow = true;
  scene.add(rock);
}

/* ============================================================
   БАЙК
   ============================================================ */
const bikeRoot = new THREE.Group();
const trickPivot = new THREE.Group();
const chassis = new THREE.Group();
const wheelPivotF = new THREE.Group();
const wheelPivotR = new THREE.Group();

bikeRoot.add(trickPivot);
trickPivot.add(chassis);
chassis.add(wheelPivotF);
chassis.add(wheelPivotR);

scene.add(bikeRoot);

const REAR_AXLE = { x: 0, y: 0.42, z: -0.85 };
trickPivot.position.set(REAR_AXLE.x, REAR_AXLE.y, REAR_AXLE.z);
chassis.position.set(-REAR_AXLE.x, -REAR_AXLE.y, -REAR_AXLE.z);

let matFrame = new THREE.MeshStandardMaterial({ color:0xd02020, roughness:0.45, metalness:0.4 });
const matDark  = new THREE.MeshStandardMaterial({ color:0x1a1a1a, roughness:0.7, metalness:0.2 });
const matChrome= new THREE.MeshStandardMaterial({ color:0xbbbbbb, roughness:0.25, metalness:0.9 });
const matTire  = new THREE.MeshStandardMaterial({ color:0x181818, roughness:0.9 });

function makeWheel(radius, thickness){
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 24), matTire);
  tire.rotation.y = Math.PI/2; tire.castShadow = true; g.add(tire);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius*0.55, radius*0.55, thickness*0.5, 12), matChrome);
  disc.rotation.z = Math.PI/2; disc.castShadow = true; g.add(disc);
  for(let i=0;i<6;i++){
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(radius*0.05, radius*1.05, thickness*0.15), matChrome);
    spoke.rotation.z = (i/6)*Math.PI*2;
    g.add(spoke);
  }
  return g;
}

wheelPivotF.position.set(0, 0.45, 0.85);
wheelPivotR.position.set(0, 0.42, -0.85);
const frontWheel = makeWheel(0.42, 0.12);
const rearWheel  = makeWheel(0.40, 0.13);
wheelPivotF.add(frontWheel);
wheelPivotR.add(rearWheel);

const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 1.4), matFrame);
frameMesh.position.set(0, 0.6, 0); frameMesh.castShadow = true; chassis.add(frameMesh);

const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.7), matFrame);
tank.position.set(0, 0.9, 0.15); tank.castShadow = true; chassis.add(tank);

const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.6),
  new THREE.MeshStandardMaterial({ color:0x111111, roughness:0.9 }));
seat.position.set(0, 1.02, -0.35); seat.castShadow = true; chassis.add(seat);

const engine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.5), matDark);
engine.position.set(0, 0.55, -0.05); engine.castShadow = true; chassis.add(engine);

const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 10), matChrome);
exhaust.rotation.x = Math.PI/2;
exhaust.position.set(0.28, 0.7, -0.6); exhaust.castShadow = true; chassis.add(exhaust);

for(const sx of [-0.18, 0.18]){
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), matChrome);
  fork.position.set(sx, 0.75, 0.75); fork.rotation.x = -0.15;
  fork.castShadow = true; chassis.add(fork);
}

const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), matDark);
handlebar.rotation.z = Math.PI/2;
handlebar.position.set(0, 1.2, 0.62); handlebar.castShadow = true; chassis.add(handlebar);

for(const sx of [-0.42, 0.42]){
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8),
    new THREE.MeshStandardMaterial({ color:0x222222 }));
  grip.rotation.z = Math.PI/2;
  grip.position.set(sx, 1.2, 0.62); chassis.add(grip);
}

const headlight = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12),
  new THREE.MeshBasicMaterial({ color:0xffffcc }));
headlight.position.set(0, 0.95, 0.86); chassis.add(headlight);

/* --- Ездок --- */
const rider = new THREE.Group();
chassis.add(rider);
const matBody  = new THREE.MeshStandardMaterial({ color:0x1a2a4c, roughness:0.7 });
const matSkin  = new THREE.MeshStandardMaterial({ color:0xe8b48a, roughness:0.8 });
const matHelmet= new THREE.MeshStandardMaterial({ color:0xff2200, roughness:0.3, metalness:0.5 });
const matVisor = new THREE.MeshStandardMaterial({ color:0x111133, roughness:0.1, metalness:0.9 });

const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.35), matBody);
torso.position.set(0, 1.35, -0.15); torso.castShadow = true; rider.add(torso);

const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), matHelmet);
helmet.position.set(0, 1.9, -0.05); helmet.castShadow = true; rider.add(helmet);

const visor = new THREE.Mesh(
  new THREE.SphereGeometry(0.225, 16, 16, 0, Math.PI*2, 0, Math.PI/2.4), matVisor);
visor.position.copy(helmet.position);
visor.rotation.x = -0.2; rider.add(visor);

function makeArm(side){
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 8), matBody);
  upper.position.set(0, -0.27, 0); upper.castShadow = true; g.add(upper);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), matBody);
  fore.position.set(0, -0.75, 0); g.add(fore);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), matSkin);
  hand.position.set(0, -1.0, 0); g.add(hand);
  g.rotation.x = -1.15;
  g.rotation.z = side * 0.35;
  g.position.set(side*0.28, 1.6, -0.05);
  return g;
}
const armL = makeArm(-1), armR = makeArm(1);
rider.add(armL, armR);

function makeLeg(side){
  const g = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 8), matBody);
  thigh.position.set(0, -0.27, 0); g.add(thigh);
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), matBody);
  shin.position.set(0, -0.72, 0); g.add(shin);
  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.28), matDark);
  boot.position.set(0, -1.0, 0.05); g.add(boot);
  g.rotation.x = 0.55;
  g.rotation.z = side * 0.1;
  g.position.set(side*0.22, 1.0, -0.3);
  return g;
}
const legL = makeLeg(-1), legR = makeLeg(1);
rider.add(legL, legR);

/* ============================================================
   МАГАЗИН
   ============================================================ */
const BIKES = [
  { id:'stock',  name:'STOCK',    icon:'🛵', price:0,    color:0xd02020,
    stats:{ maxSpeed:38, accel:16, turn:1.7, balanceRest:0.22, gravity:2.2 } },
  { id:'mx',     name:'MOTO-X',   icon:'🏍', price:500,  color:0x1a66ff,
    stats:{ maxSpeed:46, accel:18, turn:1.9, balanceRest:0.20, gravity:2.0 } },
  { id:'super',  name:'SUPERMOTO',icon:'🏁', price:1200, color:0xffcc00,
    stats:{ maxSpeed:52, accel:22, turn:1.6, balanceRest:0.24, gravity:2.4 } },
  { id:'stunt',  name:'STUNT PRO',icon:'🔥', price:2500, color:0xff5500,
    stats:{ maxSpeed:42, accel:20, turn:2.0, balanceRest:0.18, gravity:1.6 } },
  { id:'monster',name:'MONSTER',  icon:'👹', price:5000, color:0x111111,
    stats:{ maxSpeed:55, accel:24, turn:1.5, balanceRest:0.26, gravity:2.8 } }
];
const COLORS = [
  { id:'red',    name:'КРАСНЫЙ',  hex:0xd02020, price:0 },
  { id:'blue',   name:'СИНИЙ',    hex:0x1a66ff, price:150 },
  { id:'green',  name:'ЗЕЛЁНЫЙ',  hex:0x22cc44, price:150 },
  { id:'yellow', name:'ЖЁЛТЫЙ',   hex:0xffcc00, price:150 },
  { id:'purple', name:'ФИОЛЕТ',   hex:0xaa22dd, price:300 },
  { id:'orange', name:'ОРАНЖ',    hex:0xff6600, price:300 },
  { id:'pink',   name:'РОЗОВЫЙ',  hex:0xff44aa, price:400 },
  { id:'white',  name:'БЕЛЫЙ',    hex:0xeeeeee, price:400 },
  { id:'black',  name:'ЧЁРНЫЙ',   hex:0x1a1a1a, price:400 },
  { id:'chrome', name:'ХРОМ',     hex:0xcccccc, price:1000, metal:1 }
];

const SAVE_KEY = 'pitbike3d_save_v3';
let save = {
  coins: 0,
  ownedBikes: ['stock'],
  currentBike: 'stock',
  ownedColors: ['red'],
  currentColor: 'red',
  totalTricks: 0,
  maxStuntTime: 0
};
try{
  const raw = localStorage.getItem(SAVE_KEY);
  if(raw) Object.assign(save, JSON.parse(raw));
}catch(e){}
function writeSave(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){}
}
function getBikeStats(){
  const b = BIKES.find(x => x.id === save.currentBike);
  return (b || BIKES[0]).stats;
}

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
const bike = {
  x:0, y:0, z:0,
  heading:0,
  speed:0,
  maxSpeed:38,
  steer:0,
  lean:0,
  wheelSpin:0,

  pitch:0,
  pitchVel:0,
  stuntMode:false,

  trickTimer:0,
  trickName:'',
  noHanderAmt:0,
  noFooterAmt:0,

  airborne:false,
  airVel:0,
  airY:0,

  crashed:false,
  crashTimer:0,
  crashRoll:0,
  crashRollVel:0,

  bob:0,
  stuntTime:0
};

const PITCH_MIN = -0.10;
const PITCH_MAX = 1.85;
const PITCH_CRASH_MAX = 2.10;
const PITCH_CRASH_MIN = -0.30;
const STUNT_EXIT_THRESHOLD = 0.06;   // при выравнивании до этого угла выходим из станта

const keys = { gas:false, brake:false, left:false, right:false };
let paused = false;
let shopOpen = false;
let graphicsOpen = false;

/* ============================================================
   UI
   ============================================================ */
const speedTxt = document.getElementById('speed');
const gearTxt = document.getElementById('gear');
const stateTxt = document.getElementById('state');
const coinsTxt = document.getElementById('coins');
const stuntBadge = document.getElementById('stuntBadge');
const balanceWrap = document.getElementById('balanceWrap');
const balanceFill = document.getElementById('balanceFill');
const bigMsg = document.getElementById('bigMsg');
const comboMsg = document.getElementById('comboMsg');
const fpsTxt = document.getElementById('fps');
const menuEl = document.getElementById('menu');
const shopEl = document.getElementById('shop');
const graphicsEl = document.getElementById('graphics');
const startHint = document.getElementById('startHint');
const shopContent = document.getElementById('shopContent');
const shopCoinsEl = document.getElementById('shopCoins');
const menuCoinsEl = document.getElementById('menuCoins');
const menuTricksEl = document.getElementById('menuTricks');
const menuStuntTimeEl = document.getElementById('menuStuntTime');
const menuBtn = document.getElementById('menuBtn');
const stuntTouchBtn = document.querySelector('.tbtnStunt');

setTimeout(()=>startHint.classList.add('hide'), 5000);

/* ============================================================
   ВВОД — КЛАВИАТУРА
   ============================================================ */
addEventListener('keydown', e=>{
  if(e.repeat) return;
  switch(e.code){
    case 'KeyW': case 'ArrowUp': keys.gas = true; break;
    case 'KeyS': case 'ArrowDown': keys.brake = true; break;
    case 'KeyA': case 'ArrowLeft': keys.left = true; break;
    case 'KeyD': case 'ArrowRight': keys.right = true; break;

    case 'ShiftLeft': case 'ShiftRight':
      if(!paused && !shopOpen && !graphicsOpen) toggleStunt();
      break;

    case 'Space':
      e.preventDefault();
      if(!paused && !shopOpen && !graphicsOpen) doJump();
      break;

    case 'KeyQ': if(bike.stuntMode) doTrick('WHEELIE'); break;
    case 'KeyE': if(bike.stuntMode) doTrick('STOPPIE'); break;
    case 'KeyZ': if(bike.stuntMode) doTrick('NO-HANDER'); break;
    case 'KeyX': if(bike.stuntMode) doTrick('NO-FOOTER'); break;
    case 'KeyR': resetBike(); break;

    case 'Escape':
      e.preventDefault();
      if(graphicsOpen) closeGraphics();
      else if(shopOpen) closeShop();
      else togglePause();
      break;
  }
});
addEventListener('keyup', e=>{
  switch(e.code){
    case 'KeyW': case 'ArrowUp': keys.gas = false; break;
    case 'KeyS': case 'ArrowDown': keys.brake = false; break;
    case 'KeyA': case 'ArrowLeft': keys.left = false; break;
    case 'KeyD': case 'ArrowRight': keys.right = false; break;
  }
});

/* ============================================================
   ВВОД — ТАЧ-КНОПКИ
   ============================================================ */
function bindTouchBtn(el, onDown, onUp){
  if(!el) return;
  const start = (e)=>{ e.preventDefault(); el.classList.add('pressed'); onDown && onDown(); };
  const end   = (e)=>{ e.preventDefault(); el.classList.remove('pressed'); onUp && onUp(); };
  el.addEventListener('touchstart', start, {passive:false});
  el.addEventListener('touchend', end, {passive:false});
  el.addEventListener('touchcancel', end, {passive:false});
  // для отладки на ПК с мышью
  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', end);
  el.addEventListener('mouseleave', end);
}

document.querySelectorAll('#touch .tbtn').forEach(btn=>{
  const key = btn.dataset.key;
  switch(key){
    case 'gas':
      bindTouchBtn(btn, ()=>keys.gas=true, ()=>keys.gas=false);
      break;
    case 'brake':
      bindTouchBtn(btn, ()=>keys.brake=true, ()=>keys.brake=false);
      break;
    case 'left':
      bindTouchBtn(btn, ()=>keys.left=true, ()=>keys.left=false);
      break;
    case 'right':
      bindTouchBtn(btn, ()=>keys.right=true, ()=>keys.right=false);
      break;
    case 'stunt':
      bindTouchBtn(btn, ()=>{
        if(!paused && !shopOpen && !graphicsOpen) toggleStunt();
      });
      break;
    case 'jump':
      bindTouchBtn(btn, ()=>{
        if(!paused && !shopOpen && !graphicsOpen) doJump();
      });
      break;
    case 'wheelie':
      bindTouchBtn(btn, ()=>{ if(bike.stuntMode) doTrick('WHEELIE'); });
      break;
    case 'stoppie':
      bindTouchBtn(btn, ()=>{ if(bike.stuntMode) doTrick('STOPPIE'); });
      break;
    case 'nohander':
      bindTouchBtn(btn, ()=>{ if(bike.stuntMode) doTrick('NO-HANDER'); });
      break;
    case 'nofooter':
      bindTouchBtn(btn, ()=>{ if(bike.stuntMode) doTrick('NO-FOOTER'); });
      break;
  }
});

/* Кнопка меню на телефоне */
menuBtn.onclick = ()=>{
  if(shopOpen) closeShop();
  else if(graphicsOpen) closeGraphics();
  else togglePause();
};

/* ============================================================
   СТАНТ
   ============================================================ */
function updateStuntButtonVisual(){
  if(!stuntTouchBtn) return;
  stuntTouchBtn.classList.toggle('active', bike.stuntMode);
}

function toggleStunt(){
  if(bike.crashed){ resetBike(); return; }
  if(bike.airborne) return;

  bike.stuntMode = !bike.stuntMode;
  balanceWrap.classList.toggle('active', bike.stuntMode);
  stuntBadge.classList.toggle('show', bike.stuntMode);
  stateTxt.textContent = bike.stuntMode ? 'СТАНТ' : 'Едем прямо';
  updateStuntButtonVisual();

  if(bike.stuntMode){
    bike.pitch = 0.55;
    bike.pitchVel = (Math.random()-0.5)*0.5;
    bike.speed = Math.max(bike.speed, 10);
    bike.stuntTime = 0;
  } else {
    if(bike.stuntTime > 2 && !bike.crashed){
      const bonus = Math.floor(bike.stuntTime * 10);
      addCoins(bonus);
      showCombo('+' + bonus + ' 💰 (стант ' + bike.stuntTime.toFixed(1) + 'с)');
    }
    bike.pitch = 0; bike.pitchVel = 0;
  }
}

/* Авто-выход из станта при выравнивании на 2 колеса (без падения) */
function autoExitStunt(){
  if(!bike.stuntMode) return;
  // Если нос опустился почти до горизонтали — плавно выходим в обычный режим
  if(bike.pitch <= STUNT_EXIT_THRESHOLD && bike.pitchVel <= 0){
    bike.stuntMode = false;
    balanceWrap.classList.remove('active');
    stuntBadge.classList.remove('show');
    stateTxt.textContent = 'Едем прямо';
    updateStuntButtonVisual();
    bike.pitch = 0;
    bike.pitchVel = 0;
    if(bike.stuntTime > 2){
      const bonus = Math.floor(bike.stuntTime * 10);
      addCoins(bonus);
      showCombo('+' + bonus + ' 💰 (стант ' + bike.stuntTime.toFixed(1) + 'с)');
    }
    bike.stuntTime = 0;
  }
}

/* ============================================================
   ТРЮКИ
   ============================================================ */
const trickList = {
  WHEELIE:   { duration: 1.6, bonus: 30, label:'WHEELIE!' },
  STOPPIE:   { duration: 1.6, bonus: 30, label:'STOPPIE!' },
  'NO-HANDER':{ duration: 2.0, bonus: 60, label:'NO-HANDER!' },
  'NO-FOOTER':{ duration: 2.0, bonus: 60, label:'NO-FOOTER!' }
};

function doTrick(name){
  const t = trickList[name];
  if(!t) return;
  if(bike.trickTimer > 0) return;
  bike.trickName = name;
  bike.trickTimer = t.duration;

  if(name === 'WHEELIE')   bike.pitchVel += 1.4;
  if(name === 'STOPPIE')   bike.pitchVel -= 1.6;
  if(name === 'NO-HANDER') bike.noHanderAmt = 1;
  if(name === 'NO-FOOTER') bike.noFooterAmt = 1;

  showMsg(t.label);
  addCoins(t.bonus);
  save.totalTricks++;
  writeSave();
}

function doJump(){
  if(bike.crashed || bike.airborne) return;
  if(bike.stuntMode) return;
  bike.airborne = true;
  bike.airVel = 7.5;
  bike.airY = 0;
}

/* ============================================================
   СООБЩЕНИЯ
   ============================================================ */
function showMsg(t){
  bigMsg.textContent = t;
  bigMsg.classList.remove('show');
  void bigMsg.offsetWidth;
  bigMsg.classList.add('show');
}
let comboTimeout = null;
function showCombo(t){
  comboMsg.textContent = t;
  comboMsg.classList.add('show');
  if(comboTimeout) clearTimeout(comboTimeout);
  comboTimeout = setTimeout(()=>comboMsg.classList.remove('show'), 1600);
}
function addCoins(n){
  save.coins += n;
  writeSave();
  updateCoinsUI();
}
function updateCoinsUI(){
  coinsTxt.textContent = save.coins;
  shopCoinsEl.textContent = save.coins;
  menuCoinsEl.textContent = save.coins;
}

/* ============================================================
   CRASH
   ============================================================ */
function crash(reason){
  if(bike.crashed) return;
  bike.crashed = true;
  bike.crashTimer = 2.4;
  bike.stuntMode = false;
  bike.crashRoll = 0;
  bike.crashRollVel = (Math.random()<0.5?-1:1) * 3.0;
  showMsg(reason);
  balanceWrap.classList.remove('active');
  stuntBadge.classList.remove('show');
  stateTxt.textContent = 'АВАРИЯ';
  updateStuntButtonVisual();
  const penalty = Math.min(save.coins, 20);
  save.coins -= penalty;
  writeSave();
  updateCoinsUI();
}

function resetBike(){
  const stats = getBikeStats();
  Object.assign(bike, {
    x:0, y:0, z:0, heading:0, speed:0, maxSpeed:stats.maxSpeed,
    steer:0, lean:0, wheelSpin:0,
    pitch:0, pitchVel:0, stuntMode:false,
    trickTimer:0, trickName:'',
    noHanderAmt:0, noFooterAmt:0,
    airborne:false, airVel:0, airY:0,
    crashed:false, crashTimer:0, crashRoll:0, crashRollVel:0,
    stuntTime:0
  });
  balanceWrap.classList.remove('active');
  stuntBadge.classList.remove('show');
  stateTxt.textContent = 'Едем прямо';
  updateStuntButtonVisual();
}

/* ============================================================
   ФИЗИКА
   ============================================================ */
function getRoadHeightAt(z){
  const i = Math.max(0, Math.min(roadPoints.length-2, Math.floor(z / SEG_LEN)));
  const t = (z - i*SEG_LEN) / SEG_LEN;
  return roadPoints[i].y * (1-t) + roadPoints[i+1].y * t;
}

function update(dt){
  if(paused || shopOpen || graphicsOpen) return;

  const stats = getBikeStats();
  bike.maxSpeed = stats.maxSpeed;

  if(bike.crashed){
    bike.crashTimer -= dt;
    bike.speed *= Math.pow(0.05, dt);
    bike.crashRoll += bike.crashRollVel * dt;
    bike.crashRollVel *= Math.pow(0.4, dt);
    if(bike.crashTimer <= 0) resetBike();
    return;
  }

  /* --- разгон / тормоз --- */
  if(!bike.stuntMode){
    if(keys.gas)   bike.speed += stats.accel * dt;
    if(keys.brake) bike.speed -= (stats.accel*1.8) * dt;
    bike.speed -= bike.speed * 0.35 * dt;
  } else {
    /*
       В СТАНТЕ:
       Газ (W) — закидывает назад (нос вверх) + ПРОДОЛЖАЕТ набирать скорость
       Тормоз (S) — клюёт вперёд + немного тормозит
    */
    if(keys.gas){
      bike.pitchVel += 1.5 * dt;
      bike.speed += stats.accel * 0.55 * dt;   // скорость в станте набирается медленнее
    }
    if(keys.brake){
      bike.pitchVel -= 1.8 * dt;
      bike.speed -= 6 * dt;                    // тормоз слегка тормозит
    }
    // Естественное сопротивление в станте — поменьше, чтобы ехал дальше
    bike.speed -= bike.speed * 0.12 * dt;
    if(bike.speed < 3) bike.speed = 3;
    bike.stuntTime += dt;
  }
  bike.speed = Math.max(0, Math.min(bike.maxSpeed, bike.speed));

  /* --- руление --- */
  const steerTarget = (keys.right?1:0) - (keys.left?1:0);
  bike.steer += (steerTarget - bike.steer) * Math.min(1, 8*dt);

  const spdFactor = Math.min(1, bike.speed / 8);
  const turnRate = (bike.stuntMode ? stats.turn * 0.55 : stats.turn) * spdFactor;
  bike.heading -= bike.steer * turnRate * dt;

  const targetLean = bike.steer * 0.38 * spdFactor;
  bike.lean += (targetLean - bike.lean) * Math.min(1, 6*dt);

  /* --- движение --- */
  bike.x += Math.sin(bike.heading) * bike.speed * dt;
  bike.z += Math.cos(bike.heading) * bike.speed * dt;

  const roadY = getRoadHeightAt(bike.z);

  if(bike.airborne){
    bike.airVel -= 18 * dt;
    bike.airY += bike.airVel * dt;
    if(bike.airY <= 0){
      bike.airborne = false;
      bike.airY = 0;
      bike.airVel = 0;
    }
    bike.y = roadY + bike.airY;
  } else {
    bike.y = roadY;
  }

  bike.wheelSpin += (bike.speed / 0.42) * dt;

  /* --- СТАНТ --- */
  if(bike.stuntMode){
    const restAngle = stats.balanceRest;
    const grav = stats.gravity;

    bike.pitchVel += (restAngle - bike.pitch) * grav * dt;
    bike.pitchVel *= Math.pow(0.6, dt);
    bike.pitchVel += (Math.random()-0.5) * 1.2 * dt;

    if(bike.pitch > PITCH_MAX){
      bike.pitchVel -= (bike.pitch - PITCH_MAX) * 14 * dt;
    }
    if(bike.pitch < PITCH_MIN){
      bike.pitchVel += (PITCH_MIN - bike.pitch) * 14 * dt;
    }

    bike.pitch += bike.pitchVel * dt;

    if(bike.pitch > PITCH_CRASH_MAX){ crash('УПАЛ НАЗАД!'); return; }
    if(bike.pitch < PITCH_CRASH_MIN){ crash('УПАЛ ВПЕРЁД!'); return; }

    const norm = (bike.pitch - PITCH_MIN) / (PITCH_MAX - PITCH_MIN);
    balanceFill.style.width = (Math.max(0, Math.min(1, norm))*100) + '%';

    // Авто-выход при выравнивании на 2 колеса
    autoExitStunt();
  } else {
    bike.pitch += (0 - bike.pitch) * Math.min(1, 5*dt);
    bike.pitchVel = 0;
    if(bike.stuntTime > save.maxStuntTime){
      save.maxStuntTime = bike.stuntTime;
      writeSave();
    }
    bike.stuntTime = 0;
  }

  /* --- трюки --- */
  if(bike.trickTimer > 0){
    bike.trickTimer -= dt;
    if(bike.trickName === 'NO-HANDER'){
      bike.noHanderAmt = Math.min(1, bike.trickTimer);
    }
    if(bike.trickName === 'NO-FOOTER'){
      bike.noFooterAmt = Math.min(1, bike.trickTimer);
    }
  } else {
    bike.noHanderAmt = Math.max(0, bike.noHanderAmt - dt*3);
    bike.noFooterAmt = Math.max(0, bike.noFooterAmt - dt*3);
  }

  bike.bob += dt * (3 + bike.speed*0.6);

  speedTxt.innerHTML = Math.round(bike.speed*3.6) + ' <small>км/ч</small>';
  gearTxt.textContent = bike.stuntMode ? 'STUNT'
    : (bike.speed < 0.5 ? 'N' : (bike.speed < 16 ? '1' : '2'));
}

/* ============================================================
   ТРАНСФОРМЫ
   ============================================================ */
function applyTransforms(){
  bikeRoot.position.set(bike.x, bike.y, bike.z);
  bikeRoot.rotation.set(0, bike.heading, bike.lean + bike.crashRoll);

  let extraPitch = 0;
  if(bike.trickName === 'WHEELIE' && bike.trickTimer > 0) extraPitch = 0.45;
  if(bike.trickName === 'STOPPIE' && bike.trickTimer > 0) extraPitch = -0.35;

  const totalPitch = bike.pitch + extraPitch;

  const theta = -totalPitch;
  const fwDz = 1.7;
  const fwDy = 0.03;
  const frontY = fwDy * Math.cos(theta) - fwDz * Math.sin(theta);
  const baseY = fwDy;
  let liftY = 0;
  if(frontY < baseY){
    liftY = baseY - frontY;
  }
  liftY = Math.min(liftY, 0.40);

  trickPivot.position.set(
    REAR_AXLE.x,
    REAR_AXLE.y + liftY,
    REAR_AXLE.z
  );
  trickPivot.rotation.x = theta;

  frontWheel.rotation.x = -bike.wheelSpin;
  rearWheel.rotation.x  = -bike.wheelSpin;
  wheelPivotF.rotation.y = bike.steer * 0.5;

  armL.rotation.z = -0.35 - bike.noHanderAmt * 1.6;
  armR.rotation.z =  0.35 + bike.noHanderAmt * 1.6;
  armL.position.y = 1.6 + bike.noHanderAmt * 0.3;
  armR.position.y = 1.6 + bike.noHanderAmt * 0.3;

  legL.rotation.z = -0.1 - bike.noFooterAmt * 1.2;
  legR.rotation.z =  0.1 + bike.noFooterAmt * 1.2;
  legL.rotation.x = 0.55 + bike.noFooterAmt * 0.5;
  legR.rotation.x = 0.55 + bike.noFooterAmt * 0.5;
}

/* ============================================================
   КАМЕРА
   ============================================================ */
const camOffset = new THREE.Vector3(-4.5, 3.2, -6.5);
const camLookOffset = new THREE.Vector3(0, 1.2, 1.5);
const camSmooth = new THREE.Vector3(camOffset.x, camOffset.y, camOffset.z);

function updateCamera(dt){
  const cos = Math.cos(bike.heading), sin = Math.sin(bike.heading);
  const ox = camOffset.x * cos + camOffset.z * sin;
  const oz = -camOffset.x * sin + camOffset.z * cos;

  const shakeX = Math.sin(bike.bob*2.3) * Math.min(0.08, bike.speed*0.005);
  const shakeY = Math.cos(bike.bob*3.1) * Math.min(0.05, bike.speed*0.003);

  const targetPos = new THREE.Vector3(
    bike.x + ox + shakeX,
    bike.y + camOffset.y + shakeY,
    bike.z + oz
  );

  camSmooth.lerp(targetPos, Math.min(1, 6*dt));
  camera.position.copy(camSmooth);

  const lookX = bike.x + camLookOffset.x;
  const lookY = bike.y + camLookOffset.y + bike.pitch*0.3;
  const lookZ = bike.z + camLookOffset.z;
  camera.lookAt(lookX, lookY, lookZ);
}

/* ============================================================
   МЕНЮ / МАГАЗИН / ГРАФИКА
   ============================================================ */
function togglePause(){
  paused = !paused;
  menuEl.classList.toggle('show', paused);
  if(paused) updateMenuStats();
}
function updateMenuStats(){
  menuCoinsEl.textContent = save.coins;
  menuTricksEl.textContent = save.totalTricks;
  menuStuntTimeEl.textContent = save.maxStuntTime.toFixed(1) + 'с';
  const mp = document.getElementById('menuPreset');
  if(mp) mp.textContent = PRESETS[currentPreset].name;
}

document.querySelectorAll('.menu-btn').forEach(btn=>{
  const act = btn.dataset.act;
  if(act){
    btn.onclick = ()=>{
      if(act === 'resume') togglePause();
      if(act === 'shop') openShop();
      if(act === 'graphics') openGraphics();
      if(act === 'reset'){ resetBike(); togglePause(); }
      if(act === 'closeShop') closeShop();
      if(act === 'closeGraphics') closeGraphics();
      if(act === 'resetProgress'){
        if(confirm('Сбросить ВЕСЬ прогресс?')){
          save = {
            coins:0, ownedBikes:['stock'], currentBike:'stock',
            ownedColors:['red'], currentColor:'red',
            totalTricks:0, maxStuntTime:0
          };
          writeSave();
          applyBikeSkin();
          updateCoinsUI();
          updateMenuStats();
          closeShop();
          paused = false;
          menuEl.classList.remove('show');
        }
      }
    };
  }
});

document.querySelectorAll('.preset-btn').forEach(btn=>{
  btn.onclick = ()=>{ applyPreset(btn.dataset.preset); };
});

function openShop(){
  shopOpen = true;
  shopEl.classList.add('show');
  menuEl.classList.remove('show');
  shopCoinsEl.textContent = save.coins;
  renderShop('bikes');
}
function closeShop(){
  shopOpen = false;
  shopEl.classList.remove('show');
  if(paused) menuEl.classList.add('show');
}
function openGraphics(){
  graphicsOpen = true;
  graphicsEl.classList.add('show');
  menuEl.classList.remove('show');
  document.querySelectorAll('.preset-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.preset === currentPreset);
  });
}
function closeGraphics(){
  graphicsOpen = false;
  graphicsEl.classList.remove('show');
  if(paused) menuEl.classList.add('show');
}

document.querySelectorAll('.shop-tabs .tab').forEach(tab=>{
  tab.onclick = ()=>{
    document.querySelectorAll('.shop-tabs .tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    renderShop(tab.dataset.tab);
  };
});

function renderShop(tab){
  shopContent.innerHTML = '';
  shopCoinsEl.textContent = save.coins;
  if(tab === 'bikes') renderBikes();
  else if(tab === 'colors') renderColors();
}

function renderBikes(){
  BIKES.forEach(b => {
    const owned = save.ownedBikes.includes(b.id);
    const active = save.currentBike === b.id;
    const el = document.createElement('div');
    el.className = 'shop-item' + (owned ? ' owned' : '') + (active ? ' active' : '');
    el.innerHTML = `
      <div class="icon">${b.icon}</div>
      <div class="name">${b.name}</div>
      <div class="stats">
        Макс: ${b.stats.maxSpeed}<br>
        Разгон: ${b.stats.accel}<br>
        Управл: ${b.stats.turn}<br>
        Стант: ${(3 - b.stats.gravity).toFixed(1)}
      </div>
      <div class="price">${b.price === 0 ? 'СТАРТ' : '💰 ' + b.price}</div>
      <button></button>
    `;
    const btn = el.querySelector('button');
    if(active){
      btn.textContent = '✓ АКТИВЕН'; btn.className = 'use'; btn.disabled = true;
    } else if(owned){
      btn.textContent = 'ВЫБРАТЬ'; btn.className = 'use';
      btn.onclick = ()=>{ save.currentBike = b.id; writeSave(); applyBikeSkin(); renderBikes(); };
    } else if(save.coins >= b.price){
      btn.textContent = 'КУПИТЬ'; btn.className = 'buy';
      btn.onclick = ()=>{
        save.coins -= b.price;
        save.ownedBikes.push(b.id);
        save.currentBike = b.id;
        writeSave(); updateCoinsUI(); applyBikeSkin(); renderBikes();
      };
    } else {
      btn.textContent = 'НЕ ХВАТАЕТ'; btn.disabled = true;
    }
    shopContent.appendChild(el);
  });
}

function renderColors(){
  COLORS.forEach(c => {
    const owned = save.ownedColors.includes(c.id);
    const active = save.currentColor === c.id;
    const el = document.createElement('div');
    el.className = 'shop-item' + (owned ? ' owned' : '') + (active ? ' active' : '');
    el.innerHTML = `
      <div class="color-swatch" style="background:#${c.hex.toString(16).padStart(6,'0')}"></div>
      <div class="name">${c.name}</div>
      <div class="price">${c.price === 0 ? 'СТАРТ' : '💰 ' + c.price}</div>
      <button></button>
    `;
    const btn = el.querySelector('button');
    if(active){
      btn.textContent = '✓ АКТИВЕН'; btn.className = 'use'; btn.disabled = true;
    } else if(owned){
      btn.textContent = 'ВЫБРАТЬ'; btn.className = 'use';
      btn.onclick = ()=>{ save.currentColor = c.id; writeSave(); applyBikeSkin(); renderColors(); };
    } else if(save.coins >= c.price){
      btn.textContent = 'КУПИТЬ'; btn.className = 'buy';
      btn.onclick = ()=>{
        save.coins -= c.price;
        save.ownedColors.push(c.id);
        save.currentColor = c.id;
        writeSave(); updateCoinsUI(); applyBikeSkin(); renderColors();
      };
    } else {
      btn.textContent = 'НЕ ХВАТАЕТ'; btn.disabled = true;
    }
    shopContent.appendChild(el);
  });
}

function applyBikeSkin(){
  const c = COLORS.find(x => x.id === save.currentColor);
  if(!c) return;
  if(matFrame) matFrame.dispose();
  matFrame = new THREE.MeshStandardMaterial({
    color: c.hex,
    roughness: 0.45,
    metalness: c.metal !== undefined ? c.metal : 0.4
  });
  frameMesh.material = matFrame;
  tank.material = matFrame;
}

/* ============================================================
   ЦИКЛ
   ============================================================ */
let lastT = performance.now();
let frames = 0, fpsTime = 0;

function animate(now){
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastT)/1000);
  lastT = now;

  update(dt);
  applyTransforms();
  updateCamera(dt);

  sun.position.set(bike.x + 80, bike.y + 120, bike.z + 60);
  sun.target.position.set(bike.x, bike.y, bike.z);
  sun.target.updateMatrixWorld();

  renderer.render(scene, camera);

  frames++; fpsTime += dt;
  if(fpsTime >= 0.5){
    fpsTxt.textContent = Math.round(frames/fpsTime) + ' FPS';
    frames = 0; fpsTime = 0;
  }
}

addEventListener('resize', ()=>{
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

applyPreset(currentPreset);
applyBikeSkin();
updateCoinsUI();
resetBike();
requestAnimationFrame(animate);